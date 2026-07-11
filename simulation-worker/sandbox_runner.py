# Import sys to read standard input (stdin)
import sys
# Import json to format the output as a JSON string
import json
import io
# Import QuantumCircuit and transpile from Qiskit
from qiskit import QuantumCircuit, transpile
# Import the AerSimulator to simulate quantum circuits classically
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, depolarizing_error, thermal_relaxation_error

# Function to execute the user's code and run the simulation
def run_simulation(code, noise_model_name='ideal'):
    try:
        local_scope = {
            'QuantumCircuit': QuantumCircuit
        }
        
        old_stdout = sys.stdout
        redirected_output = sys.stdout = io.StringIO()
        
        try:
            exec(code, globals(), local_scope)
        finally:
            sys.stdout = old_stdout
            
        printed_output = redirected_output.getvalue()
        
        qc = None
        for key, val in local_scope.items():
            if isinstance(val, QuantumCircuit):
                qc = val
                if len(qc.clbits) > 0:
                    break
                    
        counts = {}
        diagram = ""
        
        if qc is not None:
            try:
                diagram = qc.draw('text')
            except:
                pass
            
            if len(qc.clbits) > 0:
                try:
                    simulator = AerSimulator()
                    
                    # Apply noise model if requested
                    if noise_model_name == 'depolarizing':
                        noise_model = NoiseModel()
                        error = depolarizing_error(0.05, 1) # 5% error on 1-qubit gates
                        error2 = depolarizing_error(0.1, 2) # 10% error on 2-qubit gates
                        noise_model.add_all_qubit_quantum_error(error, ['u1', 'u2', 'u3', 'rx', 'ry', 'rz', 'h', 'x', 'y', 'z'])
                        noise_model.add_all_qubit_quantum_error(error2, ['cx', 'cz'])
                        simulator = AerSimulator(noise_model=noise_model)
                    elif noise_model_name == 'thermal':
                        noise_model = NoiseModel()
                        error = thermal_relaxation_error(50e-3, 70e-3, 100e-9) # T1=50ms, T2=70ms, Gate=100ns
                        noise_model.add_all_qubit_quantum_error(error, ['id', 'u1', 'u2', 'u3', 'rx', 'ry', 'rz', 'h', 'x', 'y', 'z'])
                        simulator = AerSimulator(noise_model=noise_model)
                        
                    compiled_circuit = transpile(qc, simulator)
                    job = simulator.run(compiled_circuit)
                    counts = job.result().get_counts()
                except:
                    pass
        
        return {
            "status": "success", 
            "counts": counts, 
            "diagram": str(diagram),
            "output": printed_output
        }
    except Exception as e:
        return {"error": str(e)}

# Main entry point of the script
if __name__ == "__main__":
    payload_str = sys.stdin.read()
    try:
        payload = json.loads(payload_str)
        code = payload.get('code', '')
        noise_model = payload.get('noiseModel', 'ideal')
    except:
        code = payload_str
        noise_model = 'ideal'
        
    res = run_simulation(code, noise_model)
    print(json.dumps(res))
