
content = open('src/app/features/dashboard/dashboard.component.html', 'r', encoding='utf-8').read()
open_divs = content.count('<div')
close_divs = content.count('</div')
print(f"Open: {open_divs}, Close: {close_divs}")
