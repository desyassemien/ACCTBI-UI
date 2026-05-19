
import re

content = open('src/app/features/dashboard/dashboard.component.html', 'r', encoding='utf-8').read()
# Simple parser to track depth
depth = 0
lines = content.split('\n')
for i, line in enumerate(lines):
    opens = len(re.findall(r'<div', line))
    closes = len(re.findall(r'</div', line))
    depth += opens - closes
    if depth < 0:
        print(f"Error: Depth went negative at line {i+1}: {line}")
        depth = 0
print(f"Final depth: {depth}")
