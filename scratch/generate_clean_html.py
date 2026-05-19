
html_content = """<div class="dashboard-container px-4 py-4">
    <!-- Page Header -->
    <div class="d-flex justify-content-between align-items-end mb-4">
        <div>
            <h4 class="fw-bold text-primary-900 mb-1">Cockpit Global - ACCTBI</h4>
            <p class="text-secondary mb-0">Analyse consolidée des flux et positions financières</p>
        </div>
    </div>

    <!-- Global Analysis Selector -->
    <div class="card border-0 shadow-sm mb-4">
        <div class="card-body p-3">
            <app-analyse-selector 
                title="Période de Référence"
                [showAxes]="false"
                [showIndicators]="false"
                [(selectedPeriod)]="selectedPeriod"
                (analysisTriggered)="onRefresh()">
            </app-analyse-selector>
        </div>
    </div>

    <!-- Alertes compactes -->
    <div class="card border-0 shadow-sm mb-4">
        <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="fw-bold mb-0 text-danger"><i class="fas fa-bell me-2"></i>Alertes Critiques</h6>
                <span class="badge bg-danger rounded-pill">{{ alertes.length }}</span>
            </div>
            <div class="d-flex gap-2 flex-wrap">
                @for (alerte of alertes; track alerte.id) {
                <div class="alert-chip d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm"
                    [class.alert-chip-danger]="alerte.type==='DANGER'"
                    [class.alert-chip-warning]="alerte.type==='WARNING'"
                    (click)="goToService(alerte.routeAction)" style="cursor:pointer;">
                    <i [class]="getAlertIcon(alerte.type)" style="font-size:0.75rem"></i>
                    <span class="small fw-bold">{{ alerte.service }} :</span>
                    <span class="small">{{ alerte.titre }}</span>
                </div>
                }
            </div>
        </div>
    </div>

    <!-- SECTION TRÉSORERIE -->
    <div class="d-flex align-items-center mb-3 mt-4 border-bottom pb-2">
        <h5 class="fw-bold text-primary mb-0"><i class="fas fa-university me-2"></i>Service Trésorerie</h5>
    </div>
    <div class="row g-4 mb-4">
        <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm h-100 dash-card" (click)="goToService('/tresorerie')" style="cursor:pointer;">
                <div class="card-header bg-white border-bottom pt-3 pb-2 px-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="fw-bold mb-0 text-primary">Position de Liquidité</h6>
                        <div class="d-flex align-items-center gap-2 mt-1">
                            <span class="small text-secondary">Évolution mensuelle (Mds)</span>
                            <div class="btn-group shadow-none" style="height:20px;">
                                <button class="btn btn-link p-0 px-1 border-0" [class.text-primary]="chartTypes['tresLiquidite']==='line'" [class.text-muted]="chartTypes['tresLiquidite']!=='line'" (click)="setChartType('tresLiquidite','line',$event)"><i class="fas fa-chart-line"></i></button>
                                <button class="btn btn-link p-0 px-1 border-0" [class.text-primary]="chartTypes['tresLiquidite']==='bar'" [class.text-muted]="chartTypes['tresLiquidite']!=='bar'" (click)="setChartType('tresLiquidite','bar',$event)"><i class="fas fa-chart-bar"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="fs-5 fw-bold text-primary">12.45 Mds</span>
                    </div>
                </div>
                <div class="card-body p-3">
                    @if (chartTypes['tresLiquidite']==='line') {
                        <svg viewBox="0 0 500 180" class="w-100" style="height:180px;">
                            <defs>
                                <linearGradient id="tresGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stop-color="#1B3A6B" stop-opacity="0.25"/>
                                    <stop offset="100%" stop-color="#1B3A6B" stop-opacity="0.02"/>
                                </linearGradient>
                            </defs>
                            <!-- Grid lines -->
                            <line x1="40" y1="40" x2="480" y2="40" stroke="#f1f5f9" stroke-width="1"/>
                            <line x1="40" y1="90" x2="480" y2="90" stroke="#f1f5f9" stroke-width="1"/>
                            <line x1="40" y1="140" x2="480" y2="140" stroke="#f1f5f9" stroke-width="1"/>
                            
                            <path d="M 40,140 L 80,125 L 120,110 L 160,115 L 200,95 L 240,85 L 280,70 L 320,75 L 360,55 L 400,45 L 440,35 L 480,20 L 480,170 L 40,170 Z" fill="url(#tresGrad)"/>
                            <polyline points="40,140 80,125 120,110 160,115 200,95 240,85 280,70 320,75 360,55 400,45 440,35 480,20" fill="none" stroke="#1B3A6B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            
                            <!-- Axes -->
                            <line x1="40" y1="20" x2="40" y2="170" stroke="#94a3b8" stroke-width="1"/>
                            <line x1="40" y1="170" x2="480" y2="170" stroke="#94a3b8" stroke-width="1"/>
                            
                            <!-- Y labels -->
                            <text x="35" y="170" text-anchor="end" font-size="9" fill="#94a3b8">0</text>
                            <text x="35" y="95" text-anchor="end" font-size="9" fill="#94a3b8">10</text>
                            <text x="35" y="25" text-anchor="end" font-size="9" fill="#94a3b8">20</text>
                        </svg>
                    } @else {
                        <svg viewBox="0 0 500 180" class="w-100" style="height:180px;">
                            <!-- Grid lines -->
                            <line x1="40" y1="40" x2="480" y2="40" stroke="#f1f5f9" stroke-width="1"/>
                            <line x1="40" y1="90" x2="480" y2="90" stroke="#f1f5f9" stroke-width="1"/>
                            <line x1="40" y1="140" x2="480" y2="140" stroke="#f1f5f9" stroke-width="1"/>
                            
                            @for (h of [140, 125, 110, 115, 95, 85, 70, 75, 55, 45, 35, 20]; track $index) {
                                <rect [attr.x]="50 + $index * 36" [attr.y]="h" width="22" [attr.height]="170 - h" fill="#1B3A6B" rx="2"></rect>
                            }
                            
                            <!-- Axes -->
                            <line x1="40" y1="20" x2="40" y2="170" stroke="#94a3b8" stroke-width="1"/>
                            <line x1="40" y1="170" x2="480" y2="170" stroke="#94a3b8" stroke-width="1"/>
                            
                            <!-- Y labels -->
                            <text x="35" y="170" text-anchor="end" font-size="9" fill="#94a3b8">0</text>
                            <text x="35" y="95" text-anchor="end" font-size="9" fill="#94a3b8">10</text>
                            <text x="35" y="25" text-anchor="end" font-size="9" fill="#94a3b8">20</text>
                        </svg>
                    }
                    <div class="d-flex justify-content-between text-secondary px-5 mt-1" style="font-size:0.7rem;">
                        <span>Jan</span><span>Mar</span><span>Mai</span><span>Jul</span><span>Sep</span><span>Nov</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm h-100 dash-card" (click)="goToService('/tresorerie')" style="cursor:pointer;">
                <div class="card-header bg-white border-bottom pt-3 pb-2 px-4">
                    <h6 class="fw-bold mb-0 text-primary">Répartition des Disponibilités</h6>
                    <span class="small text-secondary">Ventilation par type de compte</span>
                </div>
                <div class="card-body p-0">
                    <table class="table table-hover mb-0">
                        <thead class="bg-light">
                            <tr>
                                <th class="ps-4 small text-uppercase text-secondary fw-semibold border-0">Compte</th>
                                <th class="small text-uppercase text-secondary fw-semibold border-0 text-end">Solde (Mds)</th>
                                <th class="pe-4 small text-uppercase text-secondary fw-semibold border-0 text-end">Var.</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (item of tresorerieDetails; track item.libelle) {
                            <tr>
                                <td class="ps-4"><span class="small fw-medium text-dark">{{ item.libelle }}</span></td>
                                <td class="text-end fw-bold small">{{ item.montant | number:'1.0-0' }}</td>
                                <td class="pe-4 text-end">
                                    <span class="badge rounded-pill" style="font-size:0.7rem;"
                                        [class.bg-success-subtle]="item.tendance.includes('+')" [class.text-success]="item.tendance.includes('+')"
                                        [class.bg-danger-subtle]="item.tendance.includes('-')" [class.text-danger]="item.tendance.includes('-')">{{ item.tendance }}</span>
                                </td>
                            </tr>
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- SECTION COMPTABILITÉ -->
    <div class="d-flex align-items-center mb-3 mt-5 border-bottom pb-2">
        <h5 class="fw-bold text-success mb-0"><i class="fas fa-book me-2"></i>Service Comptabilité</h5>
    </div>
    <div class="row g-4 mb-4">
        <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm h-100 dash-card" (click)="goToService('/comptabilite')" style="cursor:pointer;">
                <div class="card-header bg-white border-bottom pt-3 pb-2 px-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="fw-bold mb-0 text-success">Solde Bancaire Consolidé</h6>
                        <div class="d-flex align-items-center gap-2 mt-1">
                            <span class="small text-secondary">Vue par institution</span>
                            <div class="btn-group shadow-none" style="height:20px;">
                                <button class="btn btn-link p-0 px-1 border-0" [class.text-success]="chartTypes['comptaSolde']==='bar'" [class.text-muted]="chartTypes['comptaSolde']!=='bar'" (click)="setChartType('comptaSolde','bar',$event)"><i class="fas fa-chart-bar"></i></button>
                                <button class="btn btn-link p-0 px-1 border-0" [class.text-success]="chartTypes['comptaSolde']==='line'" [class.text-muted]="chartTypes['comptaSolde']!=='line'" (click)="setChartType('comptaSolde','line',$event)"><i class="fas fa-chart-line"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="fs-4 fw-bold" style="color:#2E7D32;">{{ soldeBancaireTotal | number:'1.0-0' }} Mds</span>
                    </div>
                </div>
                <div class="card-body p-3">
                    @if (chartTypes['comptaSolde']==='bar') {
                        <svg viewBox="0 0 500 200" class="w-100" style="height:190px;">
                            <!-- Grid lines -->
                            <line x1="50" y1="40" x2="480" y2="40" stroke="#f1f5f9" stroke-width="1"/>
                            <line x1="50" y1="90" x2="480" y2="90" stroke="#f1f5f9" stroke-width="1"/>
                            <line x1="50" y1="140" x2="480" y2="140" stroke="#f1f5f9" stroke-width="1"/>
                            
                            @for (d of soldeBancaireEvolution; track d.mois; let i = $index) {
                                <rect [attr.x]="60 + i * 34" [attr.y]="170 - (d.transit / 100)" width="20" [attr.height]="d.transit / 100" fill="#E9ECEF"></rect>
                                <rect [attr.x]="60 + i * 34" [attr.y]="170 - (d.transit + d.depots) / 100" width="20" [attr.height]="d.depots / 100" fill="#6C757D"></rect>
                                <rect [attr.x]="60 + i * 34" [attr.y]="170 - (d.transit + d.depots + d.bni) / 100" width="20" [attr.height]="d.bni / 100" fill="#FF8200"></rect>
                                <rect [attr.x]="60 + i * 34" [attr.y]="170 - (d.transit + d.depots + d.bni + d.bceao) / 100" width="20" [attr.height]="d.bceao / 100" fill="#009E60" rx="2"></rect>
                            }
                            
                            <!-- Axes -->
                            <line x1="50" y1="20" x2="50" y2="170" stroke="#94a3b8" stroke-width="1"/>
                            <line x1="50" y1="170" x2="480" y2="170" stroke="#94a3b8" stroke-width="1"/>
                            
                            <!-- Y labels -->
                            <text x="45" y="170" text-anchor="end" font-size="9" fill="#94a3b8">0</text>
                            <text x="45" y="95" text-anchor="end" font-size="9" fill="#94a3b8">8K</text>
                            <text x="45" y="25" text-anchor="end" font-size="9" fill="#94a3b8">15K</text>
                        </svg>
                    } @else {
                        <svg viewBox="0 0 500 200" class="w-100" style="height:190px;">
                            <line x1="50" y1="170" x2="480" y2="170" stroke="#94a3b8" stroke-width="1"/>
                            <polyline points="60,140 100,120 140,150 180,130 220,110 260,125 300,100 340,105 380,80 420,90 460,60" fill="none" stroke="#009E60" stroke-width="3" stroke-linecap="round"></polyline>
                            @for (d of soldeBancaireEvolution; track d.mois; let i = $index) {
                                <circle [attr.cx]="60 + i * 40" [attr.cy]="140 - (i * 8)" r="3" fill="#009E60"></circle>
                            }
                        </svg>
                    }
                    <div class="d-flex gap-3 justify-content-center mt-2 flex-wrap">
                        <span class="small text-secondary"><span class="legend-dot" style="background:#009E60;"></span>BCEAO</span>
                        <span class="small text-secondary"><span class="legend-dot" style="background:#FF8200;"></span>BNI</span>
                        <span class="small text-secondary"><span class="legend-dot" style="background:#6C757D;"></span>Dépôts</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm h-100 dash-card" (click)="goToService('/comptabilite')" style="cursor:pointer;">
                <div class="card-header bg-white border-bottom pt-3 pb-2 px-4">
                    <h6 class="fw-bold mb-0 text-success">Situation par Compte</h6>
                    <span class="small text-secondary">Détails des soldes actifs</span>
                </div>
                <div class="card-body p-0">
                    <table class="table table-hover mb-0">
                        <thead class="bg-light">
                            <tr>
                                <th class="ps-4 small text-uppercase text-secondary fw-semibold border-0">Banque / Compte</th>
                                <th class="small text-uppercase text-secondary fw-semibold border-0 text-end">Solde (Mds)</th>
                                <th class="pe-4 small text-uppercase text-secondary fw-semibold border-0 text-end">Écart</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (c of comptaSoldesCompte; track c.banque) {
                            <tr>
                                <td class="ps-4">
                                    <div class="d-flex align-items-center gap-2">
                                        <span class="legend-dot" [style.background]="c.banque.includes('BCEAO') ? '#009E60' : c.banque.includes('BNI') ? '#FF8200' : '#94a3b8'"></span>
                                        <span class="small fw-medium text-dark">{{ c.banque }}</span>
                                    </div>
                                </td>
                                <td class="text-end fw-bold small">{{ c.solde | number:'1.0-0' }}</td>
                                <td class="pe-4 text-end small text-muted">{{ c.tendance }}</td>
                            </tr>
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- SECTION DETTE -->
    <div class="d-flex align-items-center mb-3 mt-5 border-bottom pb-2">
        <h5 class="fw-bold text-warning mb-0"><i class="fas fa-landmark me-2"></i>Service Dette & Macro</h5>
    </div>
    <div class="row g-4 mb-4">
        <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm h-100 dash-card" (click)="goToService('/statistiques')" style="cursor:pointer;">
                <div class="card-header bg-white border-bottom pt-3 pb-2 px-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="fw-bold mb-0 text-warning">Encours de la Dette Publique</h6>
                        <div class="d-flex align-items-center gap-2 mt-1">
                            <span class="small text-secondary">Évolution annuelle (Mds)</span>
                            <div class="btn-group shadow-none" style="height:20px;">
                                <button class="btn btn-link p-0 px-1 border-0" [class.text-warning]="chartTypes['detteVolume']==='bar'" [class.text-muted]="chartTypes['detteVolume']!=='bar'" (click)="setChartType('detteVolume','bar',$event)"><i class="fas fa-chart-bar"></i></button>
                                <button class="btn btn-link p-0 px-1 border-0" [class.text-warning]="chartTypes['detteVolume']==='line'" [class.text-muted]="chartTypes['detteVolume']!=='line'" (click)="setChartType('detteVolume','line',$event)"><i class="fas fa-chart-line"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body p-3">
                    @if (chartTypes['detteVolume']==='bar') {
                        <svg viewBox="0 0 500 200" class="w-100" style="height:180px;">
                            <!-- Grid lines -->
                            <line x1="50" y1="40" x2="480" y2="40" stroke="#f1f5f9" stroke-width="1"/>
                            <line x1="50" y1="90" x2="480" y2="90" stroke="#f1f5f9" stroke-width="1"/>
                            <line x1="50" y1="140" x2="480" y2="140" stroke="#f1f5f9" stroke-width="1"/>
                            
                            @for (d of detteEvolution; track d.annee; let i = $index) {
                                <rect [attr.x]="80 + i * 82" [attr.y]="170 - (d.volume / 100)" width="40" [attr.height]="d.volume / 100" rx="4" fill="#1B3A6B" opacity="0.85"></rect>
                                <text [attr.x]="80 + i * 82 + 20" y="190" text-anchor="middle" font-size="11" fill="#64748b" font-weight="500">{{ d.annee }}</text>
                            }
                            
                            <!-- Axes -->
                            <line x1="50" y1="20" x2="50" y2="170" stroke="#94a3b8" stroke-width="1"/>
                            <line x1="50" y1="170" x2="480" y2="170" stroke="#94a3b8" stroke-width="1"/>
                            
                            <!-- Y labels -->
                            <text x="45" y="170" text-anchor="end" font-size="9" fill="#94a3b8">0</text>
                            <text x="45" y="95" text-anchor="end" font-size="9" fill="#94a3b8">8K</text>
                            <text x="45" y="25" text-anchor="end" font-size="9" fill="#94a3b8">15K</text>
                        </svg>
                    } @else {
                        <svg viewBox="0 0 500 200" class="w-100" style="height:180px;">
                            <line x1="50" y1="170" x2="480" y2="170" stroke="#94a3b8" stroke-width="1"/>
                            <polyline points="80,150 160,130 240,100 320,80 400,60 480,40" fill="none" stroke="#1B3A6B" stroke-width="4" stroke-linecap="round"></polyline>
                            @for (d of detteEvolution; track d.annee; let i = $index) {
                                <circle [attr.cx]="80 + i * 80" [attr.cy]="150 - (i * 20)" r="5" fill="#1B3A6B"></circle>
                            }
                        </svg>
                    }
                </div>
            </div>
        </div>
        <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm h-100 dash-card" (click)="goToService('/statistiques')" style="cursor:pointer;">
                <div class="card-header bg-white border-bottom pt-3 pb-2 px-4">
                    <h6 class="fw-bold mb-0 text-warning">Portefeuille de la Dette</h6>
                    <span class="small text-secondary">Répartition par nature d'instrument</span>
                </div>
                <div class="card-body p-0">
                    <table class="table table-hover mb-0">
                        <thead class="bg-light">
                            <tr>
                                <th class="ps-4 small text-uppercase text-secondary fw-semibold border-0">Instrument</th>
                                <th class="small text-uppercase text-secondary fw-semibold border-0 text-end">Encours (Mds)</th>
                                <th class="pe-4 small text-uppercase text-secondary fw-semibold border-0 text-end">Part</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (item of detteDetails; track item.libelle) {
                            <tr>
                                <td class="ps-4"><span class="small fw-medium text-dark">{{ item.libelle }}</span></td>
                                <td class="text-end fw-bold small">{{ item.montant | number:'1.0-0' }}</td>
                                <td class="pe-4 text-end small text-muted">{{ item.tendance }}</td>
                            </tr>
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- SECTION RÉGIES -->
    <div class="d-flex align-items-center mb-3 mt-5 border-bottom pb-2">
        <h5 class="fw-bold text-info mb-0"><i class="fas fa-store me-2"></i>Service Régies (Recettes)</h5>
    </div>
    <div class="row g-4 mb-4">
        <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm h-100 dash-card" (click)="goToService('/regies')" style="cursor:pointer;">
                <div class="card-header bg-white border-bottom pt-3 pb-2 px-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="fw-bold mb-0 text-info">Recettes de l'État</h6>
                        <div class="d-flex align-items-center gap-2 mt-1">
                            <span class="small text-secondary">Composition des recettes</span>
                            <div class="btn-group shadow-none" style="height:20px;">
                                <button class="btn btn-link p-0 px-1 border-0" [class.text-info]="chartTypes['recettesComposition']==='donut'" [class.text-muted]="chartTypes['recettesComposition']!=='donut'" (click)="setChartType('recettesComposition','donut',$event)"><i class="fas fa-chart-pie"></i></button>
                                <button class="btn btn-link p-0 px-1 border-0" [class.text-info]="chartTypes['recettesComposition']==='bar'" [class.text-muted]="chartTypes['recettesComposition']!=='bar'" (click)="setChartType('recettesComposition','bar',$event)"><i class="fas fa-chart-bar"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="fs-5 fw-bold text-info">10 000 Mds</span>
                    </div>
                </div>
                <div class="card-body p-3">
                    @if (chartTypes['recettesComposition']==='donut') {
                        <div class="d-flex gap-4 align-items-center h-100 justify-content-center">
                            <div class="flex-shrink-0 position-relative" style="width:140px;height:140px;">
                                <svg viewBox="0 0 36 36" class="w-100 h-100" style="transform:rotate(-90deg);">
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#e9ecef" stroke-width="4"></circle>
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#1B3A6B" stroke-width="4" stroke-dasharray="42 100" stroke-linecap="round"></circle>
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#2E7D32" stroke-width="4" stroke-dasharray="21 100" stroke-dashoffset="-42" stroke-linecap="round"></circle>
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#D4A017" stroke-width="4" stroke-dasharray="18 100" stroke-dashoffset="-63" stroke-linecap="round"></circle>
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#E65100" stroke-width="4" stroke-dasharray="19 100" stroke-dashoffset="-81" stroke-linecap="round"></circle>
                                </svg>
                                <div class="position-absolute top-50 start-50 translate-middle text-center">
                                    <span class="fs-6 fw-bold text-dark">100%</span>
                                </div>
                            </div>
                            <div class="flex-grow-1">
                                @for (r of recettesComposition | slice:0:4; track r.nature) {
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <div class="d-flex align-items-center gap-2">
                                        <span class="legend-dot" [style.background]="r.couleur"></span>
                                        <span class="small text-dark fw-medium">{{ r.nature }}</span>
                                    </div>
                                    <span class="small fw-bold">{{ r.pct }}%</span>
                                </div>
                                }
                            </div>
                        </div>
                    } @else {
                        <svg viewBox="0 0 500 180" class="w-100" style="height:180px;">
                            <line x1="120" y1="20" x2="120" y2="160" stroke="#94a3b8" stroke-width="1"/>
                            <line x1="120" y1="160" x2="480" y2="160" stroke="#94a3b8" stroke-width="1"/>
                            
                            @for (r of recettesComposition | slice:0:4; track r.nature; let i = $index) {
                                <rect x="120" [attr.y]="30 + i * 32" [attr.width]="r.pct * 3.4" height="18" [attr.fill]="r.couleur" rx="2"></rect>
                                <text x="115" [attr.y]="42 + i * 32" text-anchor="end" font-size="10" fill="#64748b" font-weight="500">{{ r.nature }}</text>
                                <text [attr.x]="125 + r.pct * 3.4" [attr.y]="42 + i * 32" font-size="10" fill="#1e293b" font-weight="700">{{ r.pct }}%</text>
                            }
                            
                            <text x="120" y="175" text-anchor="middle" font-size="9" fill="#94a3b8">0%</text>
                            <text x="300" y="175" text-anchor="middle" font-size="9" fill="#94a3b8">50%</text>
                            <text x="480" y="175" text-anchor="middle" font-size="9" fill="#94a3b8">100%</text>
                        </svg>
                    }
                </div>
            </div>
        </div>
        <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm h-100 dash-card" (click)="goToService('/regies')" style="cursor:pointer;">
                <div class="card-header bg-white border-bottom pt-3 pb-2 px-4">
                    <h6 class="fw-bold mb-0 text-info">Performance des Régies</h6>
                    <span class="small text-secondary">Répartition par administration</span>
                </div>
                <div class="card-body p-0">
                    <table class="table table-hover mb-0">
                        <thead class="bg-light">
                            <tr>
                                <th class="ps-4 small text-uppercase text-secondary fw-semibold border-0">Régie</th>
                                <th class="small text-uppercase text-secondary fw-semibold border-0 text-end">Recettes (Mds)</th>
                                <th class="pe-4 small text-uppercase text-secondary fw-semibold border-0 text-end">Var.</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (item of recettesDetails; track item.libelle) {
                            <tr>
                                <td class="ps-4"><span class="small fw-medium text-dark">{{ item.libelle }}</span></td>
                                <td class="text-end fw-bold small">{{ item.montant | number:'1.0-0' }}</td>
                                <td class="pe-4 text-end small text-muted">{{ item.tendance }}</td>
                            </tr>
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- SECTION COMPTE DE GESTION -->
    <div class="d-flex align-items-center mb-3 mt-5 border-bottom pb-2">
        <h5 class="fw-bold text-success mb-0"><i class="fas fa-clipboard-list me-2"></i>Service Compte de Gestion</h5>
    </div>
    <div class="row g-4 mb-4">
        <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm h-100 dash-card" (click)="goToService('/compte-gestion')" style="cursor:pointer;">
                <div class="card-header bg-white border-bottom pt-3 pb-2 px-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="fw-bold mb-0 text-success">Dépenses par Poste (Top 6)</h6>
                        <div class="d-flex align-items-center gap-2 mt-1">
                            <span class="small text-secondary">Vue analytique</span>
                            <div class="btn-group shadow-none" style="height:20px;">
                                <button class="btn btn-link p-0 px-1 border-0" [class.text-success]="chartTypes['recettesDetail']==='bar'" [class.text-muted]="chartTypes['recettesDetail']!=='bar'" (click)="setChartType('recettesDetail','bar',$event)"><i class="fas fa-chart-bar"></i></button>
                                <button class="btn btn-link p-0 px-1 border-0" [class.text-success]="chartTypes['recettesDetail']==='pie'" [class.text-muted]="chartTypes['recettesDetail']!=='pie'" (click)="setChartType('recettesDetail','pie',$event)"><i class="fas fa-chart-pie"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body p-3">
                    @if (chartTypes['recettesDetail']==='bar') {
                        <svg viewBox="0 0 500 200" class="w-100" style="height:190px;">
                            <line x1="140" y1="20" x2="140" y2="170" stroke="#94a3b8" stroke-width="1"/>
                            <line x1="140" y1="170" x2="480" y2="170" stroke="#94a3b8" stroke-width="1"/>
                            
                            @for (dep of top10Depenses | slice:0:6; track dep.poste; let i = $index) {
                                <rect x="140" [attr.y]="30 + i * 24" [attr.width]="dep.pct * 4" height="14" [attr.fill]="'hsl(' + (140 + dep.pct * 3) + ', 55%, 42%)'" rx="2"></rect>
                                <text x="135" [attr.y]="40 + i * 24" text-anchor="end" font-size="9" fill="#64748b" font-weight="500">{{ dep.poste | slice:0:20 }}...</text>
                                <text [attr.x]="145 + dep.pct * 4" [attr.y]="40 + i * 24" font-size="9" fill="#1e293b" font-weight="700">{{ dep.montant }}M</text>
                            }
                        </svg>
                    } @else {
                        <div class="d-flex align-items-center justify-content-center h-100 py-4">
                            <svg viewBox="0 0 36 36" style="width:140px; height:140px; transform:rotate(-90deg);">
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#2E7D32" stroke-width="8" stroke-dasharray="40 100"></circle>
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#1B3A6B" stroke-width="8" stroke-dasharray="25 100" stroke-dashoffset="-40"></circle>
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#D4A017" stroke-width="8" stroke-dasharray="20 100" stroke-dashoffset="-65"></circle>
                            </svg>
                        </div>
                    }
                </div>
            </div>
        </div>
        <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm h-100 dash-card" (click)="goToService('/compte-gestion')" style="cursor:pointer;">
                <div class="card-header bg-white border-bottom pt-3 pb-2 px-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="fw-bold mb-0 text-success">Consommation Fonds Bailleurs</h6>
                        <div class="d-flex align-items-center gap-2 mt-1">
                            <div class="btn-group shadow-none" style="height:20px;">
                                <button class="btn btn-link p-0 px-1 border-0" [class.text-success]="chartTypes['gestionBailleurs']==='radial'" [class.text-muted]="chartTypes['gestionBailleurs']!=='radial'" (click)="setChartType('gestionBailleurs','radial',$event)"><i class="fas fa-dot-circle"></i></button>
                                <button class="btn btn-link p-0 px-1 border-0" [class.text-success]="chartTypes['gestionBailleurs']==='bar'" [class.text-muted]="chartTypes['gestionBailleurs']!=='bar'" (click)="setChartType('gestionBailleurs','bar',$event)"><i class="fas fa-chart-bar"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body p-3">
                    @if (chartTypes['gestionBailleurs']==='radial') {
                        <div class="d-flex justify-content-around flex-wrap h-100 align-items-center py-2">
                            @for (b of gestionFondsBailleursRadar; track b.bailleur) {
                            <div class="text-center mb-2 mx-2">
                                <div class="position-relative d-inline-block" style="width:65px; height:65px;">
                                    <svg viewBox="0 0 36 36" class="w-100 h-100" style="transform:rotate(-90deg);">
                                        <circle cx="18" cy="18" r="14" fill="none" stroke="#e9ecef" stroke-width="4"></circle>
                                        <circle cx="18" cy="18" r="14" fill="none" [attr.stroke]="b.consomme > 75 ? '#2E7D32' : b.consomme > 50 ? '#D4A017' : '#B71C1C'" stroke-width="4" [attr.stroke-dasharray]="b.consomme + ' 100'" stroke-linecap="round"></circle>
                                    </svg>
                                    <div class="position-absolute top-50 start-50 translate-middle text-center" style="font-size:0.7rem;">
                                        <span class="fw-bold">{{ b.consomme }}%</span>
                                    </div>
                                </div>
                                <span class="small d-block text-secondary mt-1" style="font-size:0.65rem;">{{ b.bailleur }}</span>
                            </div>
                            }
                        </div>
                    } @else {
                        <svg viewBox="0 0 500 180" class="w-100" style="height:170px;">
                            <line x1="100" y1="20" x2="100" y2="150" stroke="#94a3b8" stroke-width="1"/>
                            <line x1="100" y1="150" x2="480" y2="150" stroke="#94a3b8" stroke-width="1"/>
                            @for (b of gestionFondsBailleursRadar | slice:0:4; track b.bailleur; let i = $index) {
                                <rect x="100" [attr.y]="30 + i * 30" [attr.width]="b.consomme * 3.5" height="18" [attr.fill]="b.consomme > 75 ? '#2E7D32' : b.consomme > 50 ? '#D4A017' : '#B71C1C'" rx="2"></rect>
                                <text x="95" [attr.y]="42 + i * 30" text-anchor="end" font-size="10" fill="#64748b" font-weight="500">{{ b.bailleur }}</text>
                                <text [attr.x]="105 + b.consomme * 3.5" [attr.y]="42 + i * 30" font-size="10" fill="#1e293b" font-weight="700">{{ b.consomme }}%</text>
                            }
                            <text x="100" y="165" text-anchor="middle" font-size="9" fill="#94a3b8">0%</text>
                            <text x="290" y="165" text-anchor="middle" font-size="9" fill="#94a3b8">50%</text>
                            <text x="480" y="165" text-anchor="middle" font-size="9" fill="#94a3b8">100%</text>
                        </svg>
                    }
                </div>
            </div>
        </div>
    </div>

    <!-- SECTION RÈGLEMENT -->
    <div class="d-flex align-items-center mb-3 mt-5 border-bottom pb-2">
        <h5 class="fw-bold text-danger mb-0"><i class="fas fa-exclamation-triangle me-2"></i>Service Règlement</h5>
    </div>
    <div class="row g-4 mb-4">
        <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm h-100 dash-card" (click)="goToService('/reglement')" style="cursor:pointer;">
                <div class="card-header bg-white border-bottom pt-3 pb-2 px-4 d-flex justify-content-between align-items-center">
                    <h6 class="fw-bold mb-0 text-danger">Qualité & Rejets des Paiements</h6>
                    <span class="fs-6 fw-bold text-danger">23 Anomalies</span>
                </div>
                <div class="card-body p-3 d-flex align-items-center">
                    <div class="flex-shrink-0 position-relative" style="width:110px;height:110px;">
                        <svg viewBox="0 0 36 36" class="w-100 h-100" style="transform:rotate(-90deg);">
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#e9ecef" stroke-width="4"></circle>
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#009E60" stroke-width="4" [attr.stroke-dasharray]="reglementQualiteGlobal + ' 100'" stroke-linecap="round"></circle>
                        </svg>
                        <div class="position-absolute top-50 start-50 translate-middle text-center">
                            <span class="fw-bold text-success" style="font-size:0.9rem;">{{ reglementQualiteGlobal }}%</span>
                        </div>
                    </div>
                    <div class="flex-grow-1 ms-4">
                        @for (c of reglementRejetsCauses | slice:0:3; track c.cause) {
                        <div class="mb-2">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="small text-dark" style="font-size:0.7rem;">{{ c.cause }}</span>
                                <span class="small fw-bold" style="font-size:0.7rem;">{{ c.count }}</span>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar rounded" [style.width.%]="c.count * 1.5" [style.background]="c.color"></div>
                            </div>
                        </div>
                        }
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm h-100 dash-card" (click)="goToService('/reglement')" style="cursor:pointer;">
                <div class="card-header bg-white border-bottom pt-3 pb-2 px-4 d-flex justify-content-between align-items-center">
                    <h6 class="fw-bold mb-0 text-danger">Délais Moyens de Règlement</h6>
                    <span class="fs-6 fw-bold text-danger">3.2 Jours</span>
                </div>
                <div class="card-body p-3">
                    <svg viewBox="0 0 500 150" class="w-100" style="height:120px;">
                        <line x1="40" y1="20" x2="40" y2="130" stroke="#94a3b8" stroke-width="1"/>
                        <line x1="40" y1="130" x2="480" y2="130" stroke="#94a3b8" stroke-width="1"/>
                        <line x1="40" y1="90" x2="480" y2="90" stroke="#009E60" stroke-width="1" stroke-dasharray="5,5"></line>
                        <polyline points="40,110 80,105 120,115 160,95 200,80 240,85 280,70 320,75 360,55 400,65 440,45 480,50" fill="none" stroke="#B71C1C" stroke-width="3" stroke-linecap="round"></polyline>
                        <circle cx="480" cy="50" r="4" fill="#B71C1C"></circle>
                        
                        <text x="35" y="130" text-anchor="end" font-size="9" fill="#94a3b8">0</text>
                        <text x="35" y="75" text-anchor="end" font-size="9" fill="#94a3b8">5j</text>
                    </svg>
                </div>
            </div>
        </div>
    </div>

    <!-- SECTION CAUTIONNEMENT -->
    <div class="d-flex align-items-center mb-3 mt-5 border-bottom pb-2">
        <h5 class="fw-bold mb-0" style="color: #6C3483;"><i class="fas fa-file-contract me-2"></i>Service Cautionnement</h5>
    </div>
    <div class="row g-4 mb-4">
        <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm h-100 dash-card" (click)="goToService('/cautionnement')" style="cursor:pointer;">
                <div class="card-header bg-white border-bottom pt-3 pb-2 px-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="fw-bold mb-0" style="color:#6C3483;">États des Cautionnements</h6>
                        <div class="d-flex align-items-center gap-2 mt-1">
                            <div class="btn-group shadow-none" style="height:20px;">
                                <button class="btn btn-link p-0 px-1 border-0" [class.text-primary]="chartTypes['cautionStatuts']==='donut'" [class.text-muted]="chartTypes['cautionStatuts']!=='donut'" (click)="setChartType('cautionStatuts','donut',$event)"><i class="fas fa-chart-pie"></i></button>
                                <button class="btn btn-link p-0 px-1 border-0" [class.text-primary]="chartTypes['cautionStatuts']==='bar'" [class.text-muted]="chartTypes['cautionStatuts']!=='bar'" (click)="setChartType('cautionStatuts','bar',$event)"><i class="fas fa-chart-bar"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body p-3">
                    @if (chartTypes['cautionStatuts']==='donut') {
                        <div class="d-flex gap-4 align-items-center w-100 px-2 h-100 justify-content-center">
                            <div class="position-relative" style="width:100px; height:100px;">
                                <svg viewBox="0 0 36 36" class="w-100 h-100" style="transform:rotate(-90deg);">
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#2E7D32" stroke-width="6" stroke-dasharray="65 100"></circle>
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#D4A017" stroke-width="6" stroke-dasharray="25 100" stroke-dashoffset="-65"></circle>
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#B71C1C" stroke-width="6" stroke-dasharray="10 100" stroke-dashoffset="-90"></circle>
                                </svg>
                            </div>
                            <div class="flex-grow-1">
                                @for (s of cautionnementStatuts; track s.statut) {
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="small fw-medium">{{ s.statut }}</span>
                                    <span class="fw-bold small">{{ s.count }}</span>
                                </div>
                                }
                            </div>
                        </div>
                    } @else {
                        <svg viewBox="0 0 500 180" class="w-100" style="height:150px;">
                            <line x1="120" y1="20" x2="120" y2="140" stroke="#94a3b8" stroke-width="1"/>
                            <line x1="120" y1="140" x2="480" y2="140" stroke="#94a3b8" stroke-width="1"/>
                            @for (s of cautionnementStatuts; track s.statut; let i = $index) {
                                <rect x="120" [attr.y]="30 + i * 35" [attr.width]="s.count * 1.5" height="20" [attr.fill]="s.color" rx="2"></rect>
                                <text x="115" [attr.y]="44 + i * 35" text-anchor="end" font-size="10" fill="#64748b" font-weight="500">{{ s.statut }}</text>
                                <text [attr.x]="125 + s.count * 1.5" [attr.y]="44 + i * 35" font-size="10" fill="#1e293b" font-weight="700">{{ s.count }}</text>
                            }
                        </svg>
                    }
                </div>
            </div>
        </div>
        <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm h-100 dash-card" (click)="goToService('/cautionnement')" style="cursor:pointer;">
                <div class="card-header bg-white border-bottom pt-3 pb-2 px-4">
                    <h6 class="fw-bold mb-0" style="color:#6C3483;">Volumes Engagés</h6>
                    <span class="small text-secondary">Montants cumulés par catégorie (Mds)</span>
                </div>
                <div class="card-body p-3">
                    <svg viewBox="0 0 500 180" class="w-100" style="height:170px;">
                        <line x1="140" y1="20" x2="140" y2="160" stroke="#94a3b8" stroke-width="1"/>
                        <line x1="140" y1="160" x2="480" y2="160" stroke="#94a3b8" stroke-width="1"/>
                        @for (v of cautionnementVolumes | slice:0:4; track v.type; let i = $index) {
                            <rect x="140" [attr.y]="25 + i * 34" [attr.width]="v.montant * 30" height="20" fill="#6C3483" rx="2"></rect>
                            <text x="135" [attr.y]="40 + i * 34" text-anchor="end" font-size="10" fill="#64748b" font-weight="500">{{ v.type | slice:0:22 }}</text>
                            <text [attr.x]="145 + v.montant * 30" [attr.y]="40 + i * 34" font-size="10" fill="#1e293b" font-weight="700">{{ v.montant }} Mds</text>
                        }
                        <text x="140" y="175" text-anchor="middle" font-size="9" fill="#94a3b8">0</text>
                        <text x="310" y="175" text-anchor="middle" font-size="9" fill="#94a3b8">5</text>
                        <text x="480" y="175" text-anchor="middle" font-size="9" fill="#94a3b8">10</text>
                    </svg>
                </div>
            </div>
        </div>
    </div>
</div>"""

with open('src/app/features/dashboard/dashboard.component.html', 'w', encoding='utf-8') as f:
    f.write(html_content)
