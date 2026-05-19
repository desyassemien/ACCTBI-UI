import re

with open('src/app/layout/header/header.component.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('user()?.prenom', 'userProfile?.firstName')
content = content.replace('user()?.nom', 'userProfile?.lastName')
content = content.replace('user()?.role', 'userProfile?.username')

with open('src/app/layout/header/header.component.html', 'w', encoding='utf-8') as f:
    f.write(content)
