# Import pika to connect to RabbitMQ message queue
import pika
# Import time for adding delays (like retrying connections)
import time
# Import json for parsing string messages into Python dictionaries
import json
# Import os to read environment variables (like the RabbitMQ URL)
import os
import subprocess

# Get the connection URL for RabbitMQ from the environment, or use a default
RABBITMQ_URL = os.environ.get('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672')

# Function to connect to RabbitMQ and create the necessary queues
def connect_queue():
    while True:
        try:
            # Set up the connection parameters
            params = pika.URLParameters(RABBITMQ_URL)
            # Create a blocking connection to the RabbitMQ server
            connection = pika.BlockingConnection(params)
            # Open a communication channel
            channel = connection.channel()
            # Ensure the 'quantum_jobs' queue exists where we will listen for work
            channel.queue_declare(queue='quantum_jobs')
            return connection, channel
        except pika.exceptions.AMQPConnectionError:
            # If the connection fails (e.g., RabbitMQ is still starting up), wait 5 seconds and retry
            print("RabbitMQ not ready, retrying in 5 seconds...")
            time.sleep(5)

# We pass the files payload to the ephemeral container via stdin, and the container parses it and runs it.
def run_simulation(files, main_file, noise_model, status_callback=None):
    try:
        if status_callback:
            status_callback("Provisioning Sandbox...")
        # Secure DooD (Docker-out-of-Docker) execution: 
        # Spawn an ephemeral, network-disabled container to run the untrusted code
        cmd = [
            "docker", "run", "-i", "--rm", 
            "--network", "none", # No internet access to prevent malicious downloads/attacks
            "--memory", "256m", # Limit memory to 256MB to prevent memory exhaustion
            "--cpus", "0.5", # Limit CPU usage
            "--entrypoint", "python",
            "quantumedge-simulation-worker", 
            "sandbox_runner.py" # The script inside the container that will actually execute the code
        ]
        
        # Pass files, mainFile, and noiseModel via stdin as JSON
        payload = json.dumps({"files": files, "mainFile": main_file, "noiseModel": noise_model})
        
        process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if status_callback:
            status_callback("Executing Qiskit Code...")
            
        stdout, stderr = process.communicate(input=payload, timeout=15)
        
        # If the docker command failed (non-zero return code), return the error message
        if process.returncode != 0:
            if "docker:" in stderr or "Cannot connect to the Docker daemon" in stderr:
                return {"error": "Failed to provision secure container:\n" + stderr, "errorType": "docker"}
            else:
                return {"error": "Execution failed:\n" + stderr, "errorType": "runtime"}
            
        # The sandbox_runner prints its results as a JSON string. Parse it back into a dictionary
        try:
            return json.loads(stdout)
        except json.JSONDecodeError:
            return {"error": "Failed to parse simulation output:\n" + stdout, "errorType": "system"}
            
    except subprocess.TimeoutExpired:
        # If the code takes longer than 15 seconds, kill it
        return {"error": "Execution timed out (15s limit exceeded).", "errorType": "timeout"}
    except Exception as e:
        # Catch any other unexpected errors
        return {"error": str(e), "errorType": "system"}

# Function that gets called automatically whenever a new message arrives in the queue
def callback(ch, method, properties, body):
    # The message body is a JSON string. Parse it into a Python dictionary
    job = json.loads(body)
    job_id = job.get('jobId')
    print(f"Received Qiskit job {job_id}")
    
    # Extract the files from the job
    code = job.get('code')
    noise_model = job.get('noiseModel', 'ideal')
    files = job.get('files', {'main.py': code})
    main_file = job.get('mainFile', 'main.py')
    
    def status_callback(status_msg):
        ch.basic_publish(exchange='', routing_key='job_results', body=json.dumps({"jobId": job_id, "status": status_msg}))
        
    # Run the simulation and get the results
    result = run_simulation(files, main_file, noise_model, status_callback)
    
    # Prepare the response package to send back to the API Gateway
    response = {
        "jobId": job_id,
        "result": result
    }
    
    # Ensure the 'job_results' queue exists
    ch.queue_declare(queue='job_results', durable=False)
    # Publish the response package to the 'job_results' queue as a JSON string
    ch.basic_publish(exchange='', routing_key='job_results', body=json.dumps(response))
    
    print(f"Job {job_id} completed and result sent back.")
    # Acknowledge to RabbitMQ that we have successfully processed this message so it can be deleted
    ch.basic_ack(delivery_tag=method.delivery_tag)

# Main entry point of the script
def main():
    # Connect to RabbitMQ
    connection, channel = connect_queue()
    print('Simulation worker waiting for messages. To exit press CTRL+C')
    # Tell RabbitMQ to only send one message at a time to this worker
    channel.basic_qos(prefetch_count=1)
    # Set up the consumer: when a message arrives on 'quantum_jobs', call the 'callback' function
    channel.basic_consume(queue='quantum_jobs', on_message_callback=callback)
    try:
        # Start an infinite loop listening for messages
        channel.start_consuming()
    except KeyboardInterrupt:
        # If the user presses CTRL+C, gracefully stop listening
        channel.stop_consuming()
    # Close the connection when done
    connection.close()

if __name__ == '__main__':
    main()
