import os
import re

files_to_fix = [
    "quantum-fundamentals.md",
    "programming-foundations.md",
    "intro-to-qiskit.md",
    "quantum-gates.md",
    "circuit-visualization.md",
    "parameterized-circuits.md",
    "grovers-algorithm.md",
    "shors-algorithm.md",
    "vqe.md",
    "capstone.md"
]

def determine_simulator_config(context_text, i):
    context_text = context_text.lower()
    
    if "hadamard" in context_text or "h gate" in context_text or "superposition" in context_text:
        return f"type: circuit-demo\ngates: H,M" if i % 2 == 0 else f"type: bloch-sphere\nstate: +"
    elif "entangle" in context_text or "bell state" in context_text or "cx" in context_text or "cnot" in context_text:
        return f"type: circuit-demo\ngates: H,CX,M"
    elif "pauli-x" in context_text or "x gate" in context_text or "not gate" in context_text or "flip" in context_text:
        return f"type: circuit-demo\ngates: X,M" if i % 2 == 0 else f"type: bloch-sphere\nstate: 1"
    elif "pauli-z" in context_text or "z gate" in context_text or "phase flip" in context_text:
        return f"type: circuit-demo\ngates: X,Z,M" if i % 2 == 0 else f"type: bloch-sphere\nstate: -"
    elif "pauli-y" in context_text or "y gate" in context_text:
        return f"type: circuit-demo\ngates: Y,M" if i % 2 == 0 else f"type: bloch-sphere\nstate: i"
    elif "shor" in context_text or "fourier" in context_text or "qft" in context_text or "phase estimation" in context_text:
        return f"type: circuit-demo\ngates: H,H,H,CX,M"
    elif "grover" in context_text or "diffusion" in context_text or "oracle" in context_text:
        return f"type: circuit-demo\ngates: H,X,H,M"
    elif "vqe" in context_text or "ansatz" in context_text or "parameterized" in context_text or "rx" in context_text or "ry" in context_text:
        return f"type: circuit-demo\ngates: RX,RY,CX,M"
    elif "measure" in context_text or "collapse" in context_text or "probability" in context_text:
        return f"type: circuit-demo\ngates: H,M"
    elif "state vector" in context_text or "density" in context_text or "amplitude" in context_text:
        return f"type: bloch-sphere\nstate: superposition"
    elif "identity" in context_text or "do nothing" in context_text:
        return f"type: bloch-sphere\nstate: 0"
    else:
        # Fallbacks for variety
        fallbacks = [
            "type: circuit-demo\ngates: H,M",
            "type: bloch-sphere\nstate: 0",
            "type: circuit-demo\ngates: X,M",
            "type: bloch-sphere\nstate: 1",
            "type: circuit-demo\ngates: H,CX,M",
            "type: bloch-sphere\nstate: +",
            "type: circuit-demo\ngates: X,Z,M",
            "type: bloch-sphere\nstate: -",
            "type: circuit-demo\ngates: H,T,M",
            "type: bloch-sphere\nstate: i"
        ]
        return fallbacks[i % len(fallbacks)]

for file_name in files_to_fix:
    file_path = os.path.join("content", file_name)
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Split by ```simulator
    parts = content.split("```simulator\n")
    if len(parts) == 1:
        continue # No simulators
        
    new_content = parts[0]
    
    for i in range(1, len(parts)):
        # Find where the block ends
        end_idx = parts[i].find("```\n")
        if end_idx == -1:
            end_idx = parts[i].find("```")
            
        if end_idx != -1:
            # Everything after the block
            remainder = parts[i][end_idx+3:]
            # Ensure remainder starts with newline if it didn't match perfectly
            if remainder.startswith("\n"):
                pass
            elif remainder == "":
                remainder = "\n"
            else:
                remainder = "\n" + remainder
                
            # Grab context from new_content (last 500 chars)
            context = new_content[-500:]
            
            # Determine new config
            config = determine_simulator_config(context, i)
            
            # Append newly built block
            new_content += "```simulator\n" + config + "\n```" + remainder
        else:
            # Malformed block, just append it back
            new_content += "```simulator\n" + parts[i]
            
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Fixed simulators in {file_name}")

print("Done.")
