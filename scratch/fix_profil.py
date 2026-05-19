with open('src/app/features/profil/profil.component.html', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('user()', 'user')
with open('src/app/features/profil/profil.component.html', 'w', encoding='utf-8') as f:
    f.write(content)
