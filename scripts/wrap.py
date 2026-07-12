import textwrap
import sys

def wrap_markdown(filepath, width=65):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    out_lines = []
    in_code_block = False
    
    for line in lines:
        stripped = line.rstrip('\n')
        
        # Check for code blocks
        if stripped.startswith('```'):
            in_code_block = not in_code_block
            out_lines.append(stripped)
            continue
            
        if in_code_block:
            out_lines.append(stripped)
            continue
            
        # Don't wrap headers or empty lines
        if stripped.startswith('#') or not stripped:
            out_lines.append(stripped)
            continue
            
        # Check if it's a list item (simple check)
        if stripped.startswith('- ') or stripped.startswith('1. ') or stripped.startswith('2. ') or stripped.startswith('3. ') or stripped.startswith('4. ') or stripped.startswith('5. '):
            wrapped = textwrap.fill(stripped, width=width, subsequent_indent='  ')
            out_lines.append(wrapped)
            continue
            
        # Regular paragraph text
        wrapped = textwrap.fill(stripped, width=width)
        out_lines.append(wrapped)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out_lines) + '\n')

wrap_markdown(r'd:\quantumEdge\api-gateway\content\intro-to-qiskit.md')
