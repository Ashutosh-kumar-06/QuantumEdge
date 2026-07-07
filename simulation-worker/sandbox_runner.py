# Import sys to read standard input (stdin)
import sys
# Import json to format the output as a JSON string
import json
import io
# Import QuantumCircuit and transpile from Qiskit
from qiskit import QuantumCircuit, transpile
# Import the AerSimulator to simulate quantum circuits classically
from qiskit_aer import AerSimulator

# Function to execute the user's code and run the simulation
def run_simulation(code):
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
    code = sys.stdin.read()
    res = run_simulation(code)
    print(json.dumps(res))
