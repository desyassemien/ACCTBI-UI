with open('src/app/features/dashboard/dashboard.component.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'Service Trésorerie': 'Trésorerie',
    'Service Comptabilité': 'Comptabilité',
    'Service Dette & Macro': 'Dette & Macro',
    'Service Régies (Recettes)': 'Régies (Recettes)',
    'Service Compte de Gestion': 'Compte de Gestion',
    'Service Règlement': 'Règlement',
    'Service Cautionnement': 'Cautionnement'
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/app/features/dashboard/dashboard.component.html', 'w', encoding='utf-8') as f:
    f.write(content)
