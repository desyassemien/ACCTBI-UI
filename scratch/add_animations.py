import re

with open('src/app/features/dashboard/dashboard.component.html', 'r', encoding='utf-8') as f:
    content = f.read()

count = 1
def replacer(match):
    global count
    delay = count % 12
    if delay == 0: delay = 12
    count += 1
    return match.group(1) + f' reveal-item reveal-delay-{delay}"'

new_content = re.sub(r'(class="[^"]*dash-card[^"]*)"', replacer, content)

with open('src/app/features/dashboard/dashboard.component.html', 'w', encoding='utf-8') as f:
    f.write(new_content)
