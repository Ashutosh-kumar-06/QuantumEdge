import sys
import json
import os
import subprocess

if __name__ == "__main__":
    payload_str = sys.stdin.read()
    try:
        payload = json.loads(payload_str)
        files = payload.get('files', {})
        main_file = payload.get('mainFile', 'main.cpp')
        
        if not files and 'code' in payload:
            files = {main_file: payload.get('code', '')}
    except:
        files = {'main.cpp': payload_str}
        main_file = 'main.cpp'
        
    workspace_dir = '/tmp/workspace'
    os.makedirs(workspace_dir, exist_ok=True)
    
    for file_path, content in files.items():
        if file_path.endswith('/'):
            os.makedirs(os.path.join(workspace_dir, file_path), exist_ok=True)
        else:
            full_path = os.path.join(workspace_dir, file_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'w') as f:
                f.write(content)
                
    os.chdir(workspace_dir)
    
    # Compile
    compile_cmd = ["g++", "-o", "user_circuit"]
    # Find all cpp files
    cpp_files = []
    for root, dirs, filenames in os.walk('.'):
        for filename in filenames:
            if filename.endswith('.cpp'):
                cpp_files.append(os.path.join(root, filename))
    
    if not cpp_files:
        print("No .cpp files found to compile.", file=sys.stderr)
        sys.exit(1)
        
    compile_cmd.extend(cpp_files)
    compile_cmd.extend(["-I/QuEST/QuEST/include", "-L/QuEST/build/QuEST", "-lQuEST", "-lm"])
    
    compile_proc = subprocess.run(compile_cmd, capture_output=True, text=True)
    if compile_proc.returncode != 0:
        print("Compilation Failed:\n" + compile_proc.stderr, file=sys.stderr)
        sys.exit(1)
        
    run_proc = subprocess.run(["./user_circuit"], capture_output=True, text=True)
    if run_proc.returncode != 0:
        print("Execution Failed:\n" + run_proc.stderr, file=sys.stderr)
        sys.exit(1)
        
    print(run_proc.stdout)
