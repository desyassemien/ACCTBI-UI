import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PilotageRealDataService, RealDataPilotageMetrics } from './pilotage-real-data.service';
import { NotificationService } from './notification.service';

export type ServiceDomainFilter =
  | 'TOUS'
  | 'COMPTABILITE'
  | 'TRESORERIE'
  | 'CAUTIONNEMENT'
  | 'REGIES'
  | 'REGLEMENT'
  | 'STATISTIQUES'
  | 'COMPTE_GESTION';

export interface ComparativeIndicator {
  code: string;
  domaine: Exclude<ServiceDomainFilter, 'TOUS'>;
  domaineLabel: string;
  nom: string;
  description: string;
  valeurA: number;
  valeurB: number;
  unite: string;
  deltaBrut: number;
  deltaPct: number;
  sensFavorable: 'HAUSSE' | 'BAISSE';
  statut: 'PROGRESSION' | 'REGRESSION' | 'STABLE';
}

export interface SectorComparisonItem {
  secteur: string;
  montantA: number;
  montantB: number;
  deltaMds: number;
  deltaPct: number;
}

export interface YearComparisonAnalysis {
  anneeRef: number;
  anneeComp: number;
  perimetre: string;

  metricsA: RealDataPilotageMetrics;
  metricsB: RealDataPilotageMetrics;

  deltaRecettesMds: number;
  deltaRecettesPct: number;
  deltaConcordancePts: number;
  deltaLiquiditeMds: number;
  deltaLiquiditePct: number;
  deltaRapMds: number;
  deltaRapPct: number;

  recetteParPosteA: number;
  recetteParPosteB: number;
  deltaRecetteParPostePct: number;

  liquiditeParPosteA: number;
  liquiditeParPosteB: number;

  ratioCouvertureDepensesA: number;
  ratioCouvertureDepensesB: number;

  indicateurs: ComparativeIndicator[];
  secteursComparatif: SectorComparisonItem[];

  radarScoresA: number[];
  radarScoresB: number[];
  radarLabels: string[];

  structureBreakdown: {
    composante: string;
    montantA: number;
    montantB: number;
    deltaMds: number;
  }[];

  pointsForts: string[];
  pointsVigilance: string[];
}

export interface ComparativeNotification {
  id: string;
  source: 'COMPARATIF';
  domaine: 'Analyse Comparative';
  severite: 'CRITIQUE' | 'VIGILANCE' | 'INFO' | 'SUCCES';
  titre: string;
  description: string;
  chiffreCle: string;
  badgeLabel: string;
  dateStr: string;
  isRead: boolean;
  actionType: 'COMPARATIF';
  actionLabel: string;
  anneeRef: number;
  anneeComp: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class PilotageBenchmarkService {
  private realDataService = inject(PilotageRealDataService);
  private notificationService = inject(NotificationService);

  readonly anneesDisponibles: number[] = this.realDataService.exerciceList;
  private _selectedAnneeA = 2026;
  private _selectedAnneeB = 2025;
  private _selectedPerimetre = this.realDataService.perimetresList[0];

  constructor() {
    this.initFromStorage();
  }

  initFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const a = localStorage.getItem('sygacut_benchmark_anneeA');
        const b = localStorage.getItem('sygacut_benchmark_anneeB');
        const p = localStorage.getItem('sygacut_benchmark_perimetre');
        if (a && !isNaN(Number(a)) && this.anneesDisponibles.includes(Number(a))) {
          this._selectedAnneeA = Number(a);
        }
        if (b && !isNaN(Number(b)) && this.anneesDisponibles.includes(Number(b))) {
          this._selectedAnneeB = Number(b);
        }
        if (p && this.realDataService.perimetresList.includes(p)) {
          this._selectedPerimetre = p;
        }
      } catch {}
    }
  }

  setSelectedYears(yearA: number, yearB: number, perimetre?: string): void {
    this._selectedAnneeA = Number(yearA);
    this._selectedAnneeB = Number(yearB);
    if (perimetre) {
      this._selectedPerimetre = perimetre;
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('sygacut_benchmark_anneeA', String(this._selectedAnneeA));
        localStorage.setItem('sygacut_benchmark_anneeB', String(this._selectedAnneeB));
        localStorage.setItem('sygacut_benchmark_perimetre', this._selectedPerimetre);
      } catch {}
    }
  }

  getSelectedYears(): { anneeA: number; anneeB: number; perimetre: string } {
    this.initFromStorage();
    return {
      anneeA: this._selectedAnneeA,
      anneeB: this._selectedAnneeB,
      perimetre: this._selectedPerimetre
    };
  }

  getStoredComparativeNotifications(): ComparativeNotification[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const stored = localStorage.getItem('sygacut_comparative_notifications');
      if (!stored) return [];
      return JSON.parse(stored) as ComparativeNotification[];
    } catch {
      return [];
    }
  }

  saveComparativeNotification(analysis: YearComparisonAnalysis): ComparativeNotification {
    const yearA = analysis.anneeRef;
    const yearB = analysis.anneeComp;
    const deltaPct = analysis.deltaRecettesPct;
    const deltaMds = analysis.deltaRecettesMds;
    const signPct = deltaPct >= 0 ? '+' : '';
    const signMds = deltaMds >= 0 ? '+' : '';

    const hasNegativeRecettes = deltaPct < 0 || deltaMds < 0;
    const hasDropConcordance = analysis.deltaConcordancePts < -1.0;
    const hasRapIncrease = analysis.deltaRapMds > 5;
    const isCritical = hasNegativeRecettes || hasDropConcordance || hasRapIncrease;

    let severite: 'CRITIQUE' | 'VIGILANCE' | 'INFO' | 'SUCCES' = 'INFO';
    let badgeLabel = 'Conforme';
    let titre = `Stabilité Multi-Services (${signPct}${deltaPct}%)`;
    let description = `Comparatif des 7 Services ${yearA} vs ${yearB} (${analysis.perimetre}) : évolution de ${signPct}${deltaPct}% (${signMds}${deltaMds} Mds FCFA).`;

    if (isCritical) {
      severite = 'CRITIQUE';
      badgeLabel = 'Alerte Critique';
      if (hasNegativeRecettes) {
        titre = `Contraction des Recettes & Régies (${deltaPct}%)`;
        description = `Différentiel ${yearA} vs ${yearB} : recul de ${deltaPct}% (${deltaMds} Mds FCFA) sur les recettes et régies, exigeant un arbitrage DGTCP immédiat.`;
      } else if (hasDropConcordance) {
        titre = `Recul du Taux de Rapprochement Comptabilité (${analysis.deltaConcordancePts} pts)`;
        description = `Différentiel ${yearA} vs ${yearB} : baisse de la concordance automatique BCEAO/ACCT de ${analysis.deltaConcordancePts} points.`;
      } else {
        titre = `Hausse des Restes à Payer Statistiques (+${analysis.deltaRapMds} Mds)`;
        description = `Différentiel ${yearA} vs ${yearB} : progression de l'encours RAP de +${analysis.deltaRapMds} Mds FCFA (+${analysis.deltaRapPct}%).`;
      }
    } else if (deltaPct > 3) {
      severite = 'SUCCES';
      badgeLabel = 'Expansion';
      titre = `Progression Consolidée des 7 Services (+${deltaPct}%)`;
      description = `Différentiel ${yearA} vs ${yearB} : hausse de +${deltaPct}% (+${deltaMds} Mds FCFA) sur les 7 Services SYGACUT-BI.`;
    }

    const notifId = `notif-comp-${yearA}-${yearB}`;
    const notif: ComparativeNotification = {
      id: notifId,
      source: 'COMPARATIF',
      domaine: 'Analyse Comparative',
      severite,
      titre,
      description,
      chiffreCle: `${signPct}${deltaPct}% (${signMds}${deltaMds} Mds)`,
      badgeLabel,
      dateStr: `${yearA} vs ${yearB}`,
      isRead: false,
      actionType: 'COMPARATIF',
      actionLabel: 'Ouvrir l’Analyse Comparative',
      anneeRef: yearA,
      anneeComp: yearB,
      timestamp: Date.now()
    };

    if (typeof localStorage !== 'undefined') {
      try {
        let list = this.getStoredComparativeNotifications();
        list = list.filter(n => n.id !== notifId);
        list.unshift(notif);
        if (list.length > 30) list = list.slice(0, 30);
        localStorage.setItem('sygacut_comparative_notifications', JSON.stringify(list));

        const readStored = localStorage.getItem('sygacut_notif_read_ids');
        if (readStored) {
          let readIds: string[] = JSON.parse(readStored);
          if (readIds.includes(notifId)) {
            readIds = readIds.filter(id => id !== notifId);
            localStorage.setItem('sygacut_notif_read_ids', JSON.stringify(readIds));
          }
        }
        this.notificationService.syncWithPilotageNotification(notif);
      } catch {}
    }

    return notif;
  }

  removeStoredComparativeNotification(id: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      let list = this.getStoredComparativeNotifications();
      list = list.filter(n => n.id !== id);
      localStorage.setItem('sygacut_comparative_notifications', JSON.stringify(list));
    } catch {}
  }

  compareYears(yearA: number, yearB: number, perimetre: string = this._selectedPerimetre): Observable<YearComparisonAnalysis> {
    const mA = this.realDataService.getDirectCache(yearA, perimetre)!;
    const mB = this.realDataService.getDirectCache(yearB, perimetre)!;
    return of(this.buildComparisonAnalysis(mA, mB, perimetre));
  }

  private buildComparisonAnalysis(
    mA: RealDataPilotageMetrics,
    mB: RealDataPilotageMetrics,
    perimetre: string
  ): YearComparisonAnalysis {
    const deltaRecettesMds = Number((mA.totalRecettesMilliards - mB.totalRecettesMilliards).toFixed(2));
    const deltaRecettesPct = mB.totalRecettesMilliards > 0
      ? Number(((deltaRecettesMds / mB.totalRecettesMilliards) * 100).toFixed(1))
      : 0;

    const deltaConcordancePts = Number((mA.tauxRapprochementAuto - mB.tauxRapprochementAuto).toFixed(1));

    const deltaLiquiditeMds = Number((mA.liquiditeNetteCutMilliards - mB.liquiditeNetteCutMilliards).toFixed(2));
    const deltaLiquiditePct = mB.liquiditeNetteCutMilliards > 0
      ? Number(((deltaLiquiditeMds / mB.liquiditeNetteCutMilliards) * 100).toFixed(1))
      : 0;

    const deltaRapMds = Number((mA.encoursRapMilliards - mB.encoursRapMilliards).toFixed(2));
    const deltaRapPct = mB.encoursRapMilliards > 0
      ? Number(((deltaRapMds / mB.encoursRapMilliards) * 100).toFixed(1))
      : 0;

    const recetteParPosteA = mA.postesEtRegiesActifs > 0
      ? Number((mA.totalRecettesMilliards / mA.postesEtRegiesActifs).toFixed(2))
      : 0;
    const recetteParPosteB = mB.postesEtRegiesActifs > 0
      ? Number((mB.totalRecettesMilliards / mB.postesEtRegiesActifs).toFixed(2))
      : 0;
    const deltaRecetteParPostePct = recetteParPosteB > 0
      ? Number((((recetteParPosteA - recetteParPosteB) / recetteParPosteB) * 100).toFixed(1))
      : 0;

    const liquiditeParPosteA = mA.postesEtRegiesActifs > 0
      ? Number((mA.liquiditeNetteCutMilliards / mA.postesEtRegiesActifs).toFixed(2))
      : 0;
    const liquiditeParPosteB = mB.postesEtRegiesActifs > 0
      ? Number((mB.liquiditeNetteCutMilliards / mB.postesEtRegiesActifs).toFixed(2))
      : 0;

    const ratioCouvertureA = mA.totalReglementsMilliards > 0
      ? Number(((mA.totalRecettesMilliards / mA.totalReglementsMilliards) * 100).toFixed(1))
      : 100;
    const ratioCouvertureB = mB.totalReglementsMilliards > 0
      ? Number(((mB.totalRecettesMilliards / mB.totalReglementsMilliards) * 100).toFixed(1))
      : 100;

    // Indicateurs complets couvrant l'ensemble des métriques réelles de chacun des 7 Services
    const indicateurs: ComparativeIndicator[] = [
      // COMPTABILITÉ (6 indicateurs)
      this.createInd('CPT_RAPP', 'COMPTABILITE', 'Comptabilité', 'Taux Rapprochement Auto BCEAO/ACCT', 'Part des écritures rapprochées automatiquement sur le CUT', mA.tauxRapprochementAuto, mB.tauxRapprochementAuto, '%', 'HAUSSE'),
      this.createInd('CPT_VOL', 'COMPTABILITE', 'Comptabilité', 'Volume Mouvements Balance Générale', 'Total des écritures Débit/Crédit validées aux journaux', mA.comptaVolumeMouvementsMilliards, mB.comptaVolumeMouvementsMilliards, 'Mds FCFA', 'HAUSSE'),
      this.createInd('CPT_ECART', 'COMPTABILITE', 'Comptabilité', 'Écart de Concordance Bancaire', 'Divergence résiduelle entre relevé BCEAO et Grand Livre', mA.ecartConcordanceMilliards, mB.ecartConcordanceMilliards, 'Mds FCFA', 'BAISSE'),
      this.createInd('CPT_DELAI', 'COMPTABILITE', 'Comptabilité', 'Délai Moyen Apurement Comptable', 'Durée moyenne de lettrage et apurement des écritures', mA.delaiMoyenApurementComptaJours, mB.delaiMoyenApurementComptaJours, 'Jours', 'BAISSE'),
      this.createInd('CPT_SUSP', 'COMPTABILITE', 'Comptabilité', 'Encours des Opérations en Attente', 'Montant total des écritures en attente de régularisation (compte 47)', mA.suspensComptablesMilliards, mB.suspensComptablesMilliards, 'Mds FCFA', 'BAISSE'),
      this.createInd('CPT_DOSS', 'COMPTABILITE', 'Comptabilité', 'Dossiers en Attente Actifs', 'Nombre de dossiers comptables en attente d’apurement', mA.suspensionsActivesDossiers, mB.suspensionsActivesDossiers, 'Dossiers', 'BAISSE'),

      // TRÉSORERIE (8 indicateurs)
      this.createInd('TRS_LIQ', 'TRESORERIE', 'Trésorerie', 'Position Nette de Liquidité CUT', 'Disponibilités globales BCEAO et banques partenaires', mA.liquiditeNetteCutMilliards, mB.liquiditeNetteCutMilliards, 'Mds FCFA', 'HAUSSE'),
      this.createInd('TRS_BCEAO', 'TRESORERIE', 'Trésorerie', 'Disponibilités Centralisées BCEAO', 'Part des disponibilités du CUT logées à la BCEAO', mA.soldeBceaoMilliards, mB.soldeBceaoMilliards, 'Mds FCFA', 'HAUSSE'),
      this.createInd('TRS_LA_REG', 'TRESORERIE', 'Trésorerie', 'Taux de Régularisation des LA', 'Part des Lettres d’Avance apurées dans les délais', mA.tauxRegularisationLA, mB.tauxRegularisationLA, '%', 'HAUSSE'),
      this.createInd('TRS_LA_VOL', 'TRESORERIE', 'Trésorerie', 'Lettres d’Avance Régularisées', 'Montant des Lettres d’Avance apurées', mA.laRegulariseesMilliards, mB.laRegulariseesMilliards, 'Mds FCFA', 'HAUSSE'),
      this.createInd('TRS_LA_ENC', 'TRESORERIE', 'Trésorerie', 'Encours Lettres d’Avance Non Régularisées', 'Montant des Lettres d’Avance en attente d’apurement', mA.laEnCoursMilliards, mB.laEnCoursMilliards, 'Mds FCFA', 'BAISSE'),
      this.createInd('TRS_BC', 'TRESORERIE', 'Trésorerie', 'Bons de Caisse en Circulation', 'Nombre de Bons de Caisse actifs sur le réseau', mA.bonsCaisseCirculationCount, mB.bonsCaisseCirculationCount, 'Bons', 'BAISSE'),
      this.createInd('TRS_CS', 'TRESORERIE', 'Trésorerie', 'Disponibilités Comptes Spéciaux (CS)', 'Solde disponible sur les Comptes Spéciaux du Trésor', mA.soldeComptesSpeciauxMilliards, mB.soldeComptesSpeciauxMilliards, 'Mds FCFA', 'HAUSSE'),
      this.createInd('TRS_CS_NB', 'TRESORERIE', 'Trésorerie', 'Comptes Spéciaux Actifs', 'Nombre de Comptes Spéciaux du Trésor actifs', mA.comptesSpeciauxActifs, mB.comptesSpeciauxActifs, 'Comptes', 'HAUSSE'),

      // CAUTIONNEMENT (5 indicateurs)
      this.createInd('CAU_ACT', 'CAUTIONNEMENT', 'Cautionnement', 'Portefeuille Cautionnements Actifs', 'Attestations comptables, marchés publics et séquestres', mA.cautionnementsActifsCount, mB.cautionnementsActifsCount, 'Dossiers', 'HAUSSE'),
      this.createInd('CAU_VOL', 'CAUTIONNEMENT', 'Cautionnement', 'Volume Financier des Garanties', 'Montant cumulé des cautionnements et consignations', mA.cautionnementsVolumeMilliards, mB.cautionnementsVolumeMilliards, 'Mds FCFA', 'HAUSSE'),
      this.createInd('CAU_ECH', 'CAUTIONNEMENT', 'Cautionnement', 'Cautionnements Échus Non Levés', 'Garanties arrivées à terme en attente de mainlevée/quitus', mA.cautionnementsEchusMilliards, mB.cautionnementsEchusMilliards, 'Mds FCFA', 'BAISSE'),
      this.createInd('CAU_CONT', 'CAUTIONNEMENT', 'Cautionnement', 'Dossiers en Contentieux', 'Cautionnements faisant l’objet de litige ou recouvrement', mA.cautionnementsContentieuxCount, mB.cautionnementsContentieuxCount, 'Dossiers', 'BAISSE'),
      this.createInd('CAU_COUV', 'CAUTIONNEMENT', 'Cautionnement', 'Taux de Couverture Cautionnement', 'Part des postes et marchés couverts par une garantie valide', mA.tauxCouvertureCautionnement, mB.tauxCouvertureCautionnement, '%', 'HAUSSE'),

      // RÉGIES (7 indicateurs)
      this.createInd('REG_TOT', 'REGIES', 'Régies', 'Recettes & Régies Mobilisées', 'Collecte globale DGI, Douanes, Trésor et Régies de recettes', mA.totalRecettesMilliards, mB.totalRecettesMilliards, 'Mds FCFA', 'HAUSSE'),
      this.createInd('REG_PERC', 'REGIES', 'Régies', 'Recettes Perçues en Régie', 'Encaissements directs des régies de recettes', mA.regiesRecettesPercuesMilliards, mB.regiesRecettesPercuesMilliards, 'Mds FCFA', 'HAUSSE'),
      this.createInd('REG_AV', 'REGIES', 'Régies', 'Avances en Cours des Régies', 'Encours des fonds mis à disposition des régies d’avances', mA.regiesAvancesEnCoursMilliards, mB.regiesAvancesEnCoursMilliards, 'Mds FCFA', 'BAISSE'),
      this.createInd('REG_CONF', 'REGIES', 'Régies', 'Taux Pièces Justificatives Conformes', 'Conformité documentaire des régies d’avances et recettes', mA.regiesTauxPiecesConformes, mB.regiesTauxPiecesConformes, '%', 'HAUSSE'),
      this.createInd('REG_ROT', 'REGIES', 'Régies', 'Délai Moyen Rotation des Fonds', 'Vélocité d’apurement des caisses des régisseurs', mA.regiesDelaiMoyenRotationJours, mB.regiesDelaiMoyenRotationJours, 'Jours', 'BAISSE'),
      this.createInd('REG_DEP', 'REGIES', 'Régies', 'Régies en Dépassement', 'Nombre de régies présentant un dépassement de plafond ou délai', mA.regiesEnDepassementCount, mB.regiesEnDepassementCount, 'Régies', 'BAISSE'),
      this.createInd('REG_LF', 'REGIES', 'Régies', 'Taux d’Exécution Loi de Finances', 'Taux de réalisation des prévisions de recettes de la LF', mA.tauxExecutionLoiFinances, mB.tauxExecutionLoiFinances, '%', 'HAUSSE'),

      // RÈGLEMENT (6 indicateurs)
      this.createInd('RGL_TOT', 'REGLEMENT', 'Règlement', 'Volume Total des Règlements Exécutés', 'Paiements fournisseurs, virements RTGS/SICA et chèques', mA.totalReglementsMilliards, mB.totalReglementsMilliards, 'Mds FCFA', 'HAUSSE'),
      this.createInd('RGL_ENC', 'REGLEMENT', 'Règlement', 'Règlements Fournisseurs en Cours', 'Mandats validés en cours de décaissement', mA.reglementsEnCoursMilliards, mB.reglementsEnCoursMilliards, 'Mds FCFA', 'BAISSE'),
      this.createInd('RGL_DEL', 'REGLEMENT', 'Règlement', 'Délai Moyen de Règlement', 'Durée moyenne de traitement des mandats de paiement', mA.delaiMoyenReglementJours, mB.delaiMoyenReglementJours, 'Jours', 'BAISSE'),
      this.createInd('RGL_IP', 'REGLEMENT', 'Règlement', 'Encours Imputations Provisoires (IP)', 'Paiements urgents en attente d’engagement définitif', mA.imputationsProvisoiresMilliards, mB.imputationsProvisoiresMilliards, 'Mds FCFA', 'BAISSE'),
      this.createInd('RGL_RTGS', 'REGLEMENT', 'Règlement', 'Part des Virements RTGS', 'Proportion des règlements dématérialisés via RTGS/SICA', mA.partVirementsRtgsPct, mB.partVirementsRtgsPct, '%', 'HAUSSE'),
      this.createInd('RGL_ANO', 'REGLEMENT', 'Règlement', 'Anomalies de Règlement', 'Dossiers rejetés ou bloqués pour erreur de RIB/pièce', mA.anomaliesReglementDossiers, mB.anomaliesReglementDossiers, 'Dossiers', 'BAISSE'),

      // STATISTIQUES (8 indicateurs)
      this.createInd('STA_SUB', 'STATISTIQUES', 'Statistiques', 'Subventions & Approvisionnements', 'Dotations EPN, collectivités, FER et approvisionnements ACCDP', mA.statSubventionsMilliards, mB.statSubventionsMilliards, 'Mds FCFA', 'HAUSSE'),
      this.createInd('STA_RAP', 'STATISTIQUES', 'Statistiques', 'Encours Restes à Payer (RAP)', 'Engagements ordonnancés en attente de décaissement', mA.encoursRapMilliards, mB.encoursRapMilliards, 'Mds FCFA', 'BAISSE'),
      this.createInd('STA_RAP90', 'STATISTIQUES', 'Statistiques', 'RAP Critiques (> 90 jours)', 'Part des Restes à Payer dépassant le seuil critique de 90 jours', mA.rapCritiquePlus90jMilliards, mB.rapCritiquePlus90jMilliards, 'Mds FCFA', 'BAISSE'),
      this.createInd('STA_OC', 'STATISTIQUES', 'Statistiques', 'Obligations Cautionnées (OC/LC)', 'Volume des obligations cautionnées suivies', mA.statObligationsCautionneesMilliards, mB.statObligationsCautionneesMilliards, 'Mds FCFA', 'HAUSSE'),
      this.createInd('STA_COP', 'STATISTIQUES', 'Statistiques', 'Intégration Régionale (PCS UEMOA / PCC CEDEAO)', 'Prélèvements communautaires et flux Webfontaine', mA.statCooperationRegionaleMilliards, mB.statCooperationRegionaleMilliards, 'Mds FCFA', 'HAUSSE'),
      this.createInd('STA_DET', 'STATISTIQUES', 'Statistiques', 'Encours Global de la Dette', 'Stock consolidé de la dette publique suivie', mA.encoursDetteMilliards, mB.encoursDetteMilliards, 'Mds FCFA', 'BAISSE'),
      this.createInd('STA_SDET', 'STATISTIQUES', 'Statistiques', 'Service de la Dette', 'Échéances d’amortissement et intérêts réglés', mA.serviceDetteMilliards, mB.serviceDetteMilliards, 'Mds FCFA', 'BAISSE'),
      this.createInd('STA_PREV', 'STATISTIQUES', 'Statistiques', 'Taux Réalisation Prévisions Statistiques', 'Adéquation entre réalisations et prévisions macroéconomiques', mA.tauxRealisationPrevisionsStat, mB.tauxRealisationPrevisionsStat, '%', 'HAUSSE'),

      // COMPTE DE GESTION (5 indicateurs)
      this.createInd('CG_VOL', 'COMPTE_GESTION', 'Compte de Gestion', 'Volume Audité Compte de Gestion', 'Masse financière auditée (TGE, PGT, RGF, PGA)', mA.cgVolumeAuditeMilliards, mB.cgVolumeAuditeMilliards, 'Mds FCFA', 'HAUSSE'),
      this.createInd('CG_CONF', 'COMPTE_GESTION', 'Compte de Gestion', 'Taux Conformité Cour des Comptes', 'Conformité des liasses de reddition (TGE, PGT, RGF, PGA)', mA.tauxConformiteCompteGestion, mB.tauxConformiteCompteGestion, '%', 'HAUSSE'),
      this.createInd('CG_EXEC', 'COMPTE_GESTION', 'Compte de Gestion', 'Taux Exécution des Crédits Assignés', 'Absorption budgétaire sur les développements de titres', mA.tauxExecutionCreditsCG, mB.tauxExecutionCreditsCG, '%', 'HAUSSE'),
      this.createInd('CG_INST', 'COMPTE_GESTION', 'Compte de Gestion', 'Restes en Instance d’Apurement', 'Imputations provisoires et débiteurs divers à régulariser', mA.restesEnInstanceCGMilliards, mB.restesEnInstanceCGMilliards, 'Mds FCFA', 'BAISSE'),
      this.createInd('CG_QUIT', 'COMPTE_GESTION', 'Compte de Gestion', 'Taux de Quitus Transmis', 'Part des comptables ayant obtenu/transmis leur quitus', mA.quitusTransmisPct, mB.quitusTransmisPct, '%', 'HAUSSE')
    ];

    // Radar sur les 7 Services SYGACUT-BI
    const radarLabels = [
      'Comptabilité',
      'Trésorerie',
      'Cautionnement',
      'Régies',
      'Règlement',
      'Statistiques',
      'Compte de Gestion'
    ];

    const radarScoresA = mA.syntheseSeptServices.map(s => Math.min(100, Math.round(s.tauxPerformance)));
    const radarScoresB = mB.syntheseSeptServices.map(s => Math.min(100, Math.round(s.tauxPerformance)));

    // Structure Breakdown des 7 Services
    const structureBreakdown = mA.syntheseSeptServices.map((sA, idx) => {
      const sB = mB.syntheseSeptServices[idx] || sA;
      return {
        composante: sA.service.replace(/^\d+\.\s*/, ''),
        montantA: sA.volumeMilliards,
        montantB: sB.volumeMilliards,
        deltaMds: Number((sA.volumeMilliards - sB.volumeMilliards).toFixed(2))
      };
    });

    const secteursComparatif: SectorComparisonItem[] = mA.repartitionMinisteresDepenses.map((sA, idx) => {
      const sB = mB.repartitionMinisteresDepenses[idx] || { name: sA.name, value: sA.value * 0.92 };
      const dMds = Number((sA.value - sB.value).toFixed(2));
      const dPct = sB.value > 0 ? Number(((dMds / sB.value) * 100).toFixed(1)) : 0;
      return {
        secteur: sA.name,
        montantA: sA.value,
        montantB: sB.value,
        deltaMds: dMds,
        deltaPct: dPct
      };
    });

    const pointsForts: string[] = [];
    const pointsVigilance: string[] = [];

    if (deltaRecettesPct >= 0) {
      pointsForts.push(`Service Régies & Recettes : progression de +${deltaRecettesPct}% (+${deltaRecettesMds} Mds FCFA) et taux de pièces conformes à ${mA.regiesTauxPiecesConformes}%.`);
    } else {
      pointsVigilance.push(`Service Régies : contraction des recettes collectées de ${deltaRecettesPct}% (${deltaRecettesMds} Mds FCFA).`);
    }

    if (deltaConcordancePts >= 0) {
      pointsForts.push(`Services Comptabilité & Compte de Gestion : concordance BCEAO à ${mA.tauxRapprochementAuto}% (+${deltaConcordancePts} pt) et conformité Cour des Comptes à ${mA.tauxConformiteCompteGestion}%.`);
    } else {
      pointsVigilance.push(`Service Comptabilité : baisse du taux de rapprochement auto de ${deltaConcordancePts} pt (${mA.tauxRapprochementAuto}%).`);
    }

    if (deltaLiquiditeMds >= 0) {
      pointsForts.push(`Services Trésorerie & Cautionnement : liquidité CUT renforcée (+${deltaLiquiditeMds} Mds FCFA) et ${mA.cautionnementsActifsCount} cautionnements actifs.`);
    } else {
      pointsVigilance.push(`Service Trésorerie : baisse de la liquidité nette du CUT (${deltaLiquiditeMds} Mds FCFA).`);
    }

    if (deltaRapMds <= 0) {
      pointsForts.push(`Services Règlement & Statistiques : réduction de l'encours RAP de ${deltaRapMds} Mds FCFA et délai moyen de règlement abaissé à ${mA.delaiMoyenReglementJours} jours.`);
    } else {
      pointsVigilance.push(`Services Règlement & Statistiques : hausse de l'encours des Restes à Payer (+${deltaRapMds} Mds FCFA) nécessitant l'apurement des RAP > 90j.`);
    }

    return {
      anneeRef: mA.annee,
      anneeComp: mB.annee,
      perimetre,
      metricsA: mA,
      metricsB: mB,
      deltaRecettesMds,
      deltaRecettesPct,
      deltaConcordancePts,
      deltaLiquiditeMds,
      deltaLiquiditePct,
      deltaRapMds,
      deltaRapPct,
      recetteParPosteA,
      recetteParPosteB,
      deltaRecetteParPostePct,
      liquiditeParPosteA,
      liquiditeParPosteB,
      ratioCouvertureDepensesA: ratioCouvertureA,
      ratioCouvertureDepensesB: ratioCouvertureB,
      indicateurs,
      secteursComparatif,
      radarScoresA,
      radarScoresB,
      radarLabels,
      structureBreakdown,
      pointsForts,
      pointsVigilance
    };
  }

  private createInd(
    code: string,
    domaine: Exclude<ServiceDomainFilter, 'TOUS'>,
    domaineLabel: string,
    nom: string,
    description: string,
    valA: number,
    valB: number,
    unite: string,
    sensFavorable: 'HAUSSE' | 'BAISSE'
  ): ComparativeIndicator {
    const deltaBrut = Number((valA - valB).toFixed(2));
    const deltaPct = valB > 0 ? Number(((deltaBrut / valB) * 100).toFixed(1)) : 0;

    let statut: 'PROGRESSION' | 'REGRESSION' | 'STABLE' = 'STABLE';
    if (Math.abs(deltaPct) < 0.3) {
      statut = 'STABLE';
    } else if (sensFavorable === 'HAUSSE') {
      statut = deltaBrut > 0 ? 'PROGRESSION' : 'REGRESSION';
    } else {
      statut = deltaBrut < 0 ? 'PROGRESSION' : 'REGRESSION';
    }

    return {
      code,
      domaine,
      domaineLabel,
      nom,
      description,
      valeurA: valA,
      valeurB: valB,
      unite,
      deltaBrut,
      deltaPct,
      sensFavorable,
      statut
    };
  }
}
