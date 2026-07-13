# Import pika to connect to RabbitMQ message queue
import pika
# Import time for adding delays
import time
# Import json for parsing string messages
import json
# Import os to read environment variables
import os
# Import subprocess to run shell commands (like docker)
import subprocess

# Get the connection URL for RabbitMQ from the environment, or use a default
RABBITMQ_URL = os.environ.get('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672')

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
            # Ensure the 'cpp_jobs' queue exists where we will listen for work
            channel.queue_declare(queue='cpp_jobs')
            return connection, channel
        except pika.exceptions.AMQPConnectionError:
            print("RabbitMQ not ready, retrying in 5 seconds...")
            time.sleep(5)

# Function to compile and execute the user's C++ QuEST code securely
def run_cpp_code(code, status_callback=None):
    try:
        if status_callback:
            status_callback("Provisioning Sandbox (C++)...")
        # Secure DooD (Docker-out-of-Docker) execution: 
        # Spawn an ephemeral, network-disabled container to compile and run the C++ code
        cmd = [
            "docker", "run", "-i", "--rm", 
            "--network", "none", # No internet access
            "--memory", "256m", # Limit memory
            "--cpus", "0.5", # Limit CPU usage
            "--entrypoint", "bash",
            "quantumedge-cpp-worker", 
            # The bash command does three things:
            # 1. 'cat > user_code.cpp' saves the incoming stdin to a file
            # 2. 'g++ ...' compiles the file linking the QuEST library
            # 3. './user_circuit' runs the compiled executable
            "-c", "cat > user_code.cpp && g++ user_code.cpp -o user_circuit -I/QuEST/QuEST/include -L/QuEST/build/QuEST -lQuEST -lm && ./user_circuit"
        ]
        
        # Run the docker command, passing the user's C++ code via standard input (stdin)
        process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if status_callback:
            status_callback("Compiling & Executing QuEST Code...")
            
        stdout, stderr = process.communicate(input=code, timeout=15)
        
        # If compilation or execution failed (non-zero return code), return the stderr output
        if process.returncode != 0:
            if "docker:" in stderr or "Cannot connect to the Docker daemon" in stderr:
                return {"error": "Failed to provision secure container:\n" + stderr, "errorType": "docker"}
            else:
                return {"error": "Compilation/Execution failed:\n" + stderr, "errorType": "compilation"}
            
        # Return success with the standard output from the C++ program
        return {"status": "success", "counts": stdout, "diagram": "QuEST C++ Simulation completed securely."}
        
    except subprocess.TimeoutExpired:
        # If the compilation or execution takes longer than 15 seconds, kill it
        return {"error": "Execution timed out (15s limit exceeded).", "errorType": "timeout"}
    except Exception as e:
        return {"error": str(e), "errorType": "system"}

# Function that gets called automatically whenever a new message arrives in the queue
def callback(ch, method, properties, body):
    # Parse the incoming JSON message
    job = json.loads(body)
    job_id = job.get('jobId')
    print(f"Received C++ job {job_id}")
    
    # Extract the code
    code = job.get('code')
    def status_callback(status_msg):
        ch.basic_publish(exchange='', routing_key='job_results', body=json.dumps({"jobId": job_id, "status": status_msg}))

    # Run the C++ code compilation and execution
    result = run_cpp_code(code, status_callback)
    
    # Prepare the response package
    response = {
        "jobId": job_id,
        "result": result
    }
    
    # Ensure the 'job_results' queue exists
    ch.queue_declare(queue='job_results', durable=False)
    # Publish the response package back to the API gateway
    ch.basic_publish(exchange='', routing_key='job_results', body=json.dumps(response))
    
    print(f"Job {job_id} completed and result sent back.")
    # Acknowledge the message so RabbitMQ removes it from the queue
    ch.basic_ack(delivery_tag=method.delivery_tag)

# Main entry point of the script
def main():
    connection, channel = connect_queue()
    print('C++ QuEST worker waiting for messages...')
    # Tell RabbitMQ to only send one message at a time to this worker
    channel.basic_qos(prefetch_count=1)
    # Set up the consumer: when a message arrives on 'cpp_jobs', call the 'callback' function
    channel.basic_consume(queue='cpp_jobs', on_message_callback=callback)
    # Start an infinite loop listening for messages
    channel.start_consuming()

if __name__ == '__main__':
    main()
