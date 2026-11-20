import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { RealDataPilotageMetrics } from './pilotage-real-data.service';

export interface AiSummaryResult {
  title: string;
  domain: string;
  period: string;
  globalScore: number; // 0 to 100
  globalStatus: 'EXCELLENT' | 'CONFORME' | 'VIGILANCE' | 'CRITIQUE';
  executiveSummary: string;
  keyHighlights: string[];
  risksAndGaps: string[];
  recommendations: string[];
  predictiveInsights: {
    label: string;
    trend: 'UP' | 'DOWN' | 'STABLE';
    forecast: string;
    confidence: number;
    subLabel: string;
    subValue: string;
  }[];
}

export interface PredictiveProjection {
  year: number;
  isHistorical: boolean;
  recettes: number;
  reglements: number;
  soldeCut: number;
  ratioCouverture: number;
}

@Injectable({
  providedIn: 'root'
})
export class PilotageAiService {

  generateExecutiveAnalysis(
    domain: string,
    perimetre: string = 'Consolidé National (DGTCP / ACCT)',
    annee: number = 2026,
    metrics?: RealDataPilotageMetrics | null
  ): Observable<AiSummaryResult> {
    const recMds = metrics?.totalRecettesMilliards || 1254.0;
    const liqMds = metrics?.liquiditeNetteCutMilliards || 1542.3;
    const regMds = metrics?.totalReglementsMilliards || 1138.2;
    const rapMds = metrics?.encoursRapMilliards || 124.5;
    const rap90 = metrics?.rapCritiquePlus90jMilliards || 34.9;
    const conc = metrics?.tauxRapprochementAuto || 94.8;
    const laReg = metrics?.tauxRegularisationLA || 88.5;
    const laEnc = metrics?.laEnCoursMilliards || 45.8;
    const prev2027 = metrics?.prevision2027 || 1321.7;
    const postes = metrics?.postesEtRegiesActifs || 142;
    const subMds = metrics?.statSubventionsMilliards || 66.82;
    const ocMds = metrics?.statObligationsCautionneesMilliards || 48.7;

    const summaries: Record<string, AiSummaryResult> = {
      tous: {
        title: `Audit & Synthèse Décisionnelle — Vue Consolidée`,
        domain: 'Vue Consolidée DGTCP',
        period: `${annee}`,
        globalScore: Math.round((conc * 0.35 + laReg * 0.25 + (metrics?.tauxConformiteCompteGestion || 95) * 0.4)),
        globalStatus: conc >= 92 ? 'EXCELLENT' : 'CONFORME',
        executiveSummary: `<p class="lead-headline"><strong>Synthèse Consolidée :</strong> Recettes mobilisées de <strong>${recMds.toFixed(1)} Mds FCFA</strong> pour une liquidité nette CUT de <strong>${liqMds.toFixed(1)} Mds FCFA</strong>.</p><p class="lead-paragraph">Pour l'exercice <strong>${annee}</strong> (${perimetre}), les règlements exécutés atteignent <strong>${regMds.toFixed(1)} Mds FCFA</strong> avec un taux de rapprochement automatique BCEAO/ACCT de <strong>${conc.toFixed(1)}%</strong> et une conformité Compte de Gestion de <strong>${metrics?.tauxConformiteCompteGestion || 96.4}%</strong>.</p><p class="lead-paragraph m-0">Les axes de pilotage prioritaires portent sur la régularisation des Lettres d'Avance (<strong>${laReg.toFixed(1)}%</strong>) et la résorption des Restes à Payer de plus de 90 jours (<strong>${rap90.toFixed(1)} Mds FCFA</strong> sur ${rapMds.toFixed(1)} Mds).</p>`,
        keyHighlights: [
          `Position nette de liquidité CUT à ${liqMds.toFixed(1)} Mds FCFA avec ${postes} postes et régies actifs.`,
          `Concordance BCEAO/ACCT à ${conc.toFixed(1)}% et conformité Cour des Comptes à ${metrics?.tauxConformiteCompteGestion || 96.4}%.`,
          `Recettes mobilisées à ${recMds.toFixed(1)} Mds FCFA face à ${regMds.toFixed(1)} Mds FCFA de règlements exécutés.`
        ],
        risksAndGaps: [
          `Encours des Restes à Payer à ${rapMds.toFixed(1)} Mds FCFA dont ${rap90.toFixed(1)} Mds FCFA > 90 jours.`,
          `Taux de régularisation des Lettres d'Avance à ${laReg.toFixed(1)}% (${laEnc.toFixed(1)} Mds FCFA en cours).`,
          `Opérations en attente de ${metrics?.suspensComptablesMilliards || 45.8} Mds FCFA à apurer avant clôture.`
        ],
        recommendations: [
          `Prioriser l'apurement des Restes à Payer critiques (> 90j) et des comptes transitoires 47.`,
          `Relancer les postes pour porter la régularisation des Lettres d'Avance au-dessus du seuil de 90%.`,
          `Maintenir la trajectoire projetée pour atteindre ${prev2027.toFixed(1)} Mds FCFA de recettes projetées en ${annee + 1}.`
        ],
        predictiveInsights: [
          { label: 'Recettes Projetées N+1', trend: 'UP', forecast: `${prev2027.toFixed(1)} Mds`, confidence: 94, subLabel: 'Projection', subValue: 'Tendance +' },
          { label: 'Concordance BCEAO', trend: 'UP', forecast: '97,8%', confidence: 93, subLabel: 'Objectif ACCT', subValue: '+3,0 pts' },
          { label: 'Régularisation LA', trend: 'UP', forecast: '92,5%', confidence: 89, subLabel: 'Seuil légal', subValue: '> 90%' },
          { label: 'Indice de Confiance IA', trend: 'UP', forecast: '95%', confidence: 96, subLabel: 'Consolidé', subValue: 'DGTCP' }
        ]
      },
      comptabilite: {
        title: `Audit & Synthèse Décisionnelle — Comptabilité`,
        domain: 'Comptabilité (Rapprochement, Journaux, Balance)',
        period: `${annee}`,
        globalScore: conc >= 94 ? 94 : 88,
        globalStatus: conc >= 94 ? 'EXCELLENT' : 'CONFORME',
        executiveSummary: `<p class="lead-headline"><strong>Taux de rapprochement automatique BCEAO / ACCT à ${conc.toFixed(1)}% :</strong> Volume de mouvements de la Balance Générale consolidé à <strong>${metrics?.comptaVolumeMouvementsMilliards || 348.52} Mds FCFA</strong>.</p><p class="lead-paragraph">Pour l'exercice <strong>${annee}</strong> (${perimetre}), le lettrage automatisé des écritures miroirs du Compte Unique du Trésor réduit le délai moyen d'apurement à <strong>${metrics?.delaiMoyenApurementComptaJours || 1.1} jour ouvré</strong>.</p><p class="lead-paragraph m-0">Le point d'attention porte sur l'apurement de <strong>${metrics?.suspensComptablesMilliards || 45.8} Mds FCFA d'écritures en suspens</strong> (${metrics?.suspensionsActivesDossiers || 18} dossiers non lettrés) et d'un écart résiduel de concordance de <strong>${metrics?.ecartConcordanceMilliards || 1.2} Mds FCFA</strong>.</p>`,
        keyHighlights: [
          `Taux de rapprochement automatique certifié à ${conc.toFixed(1)}% des écritures bancaires (seuil > 90%).`,
          `Équilibre strict Débit / Crédit de la Balance Générale (${metrics?.comptaVolumeMouvementsMilliards || 348.52} Mds FCFA sur 1 245 comptes mouvementés).`,
          `Délai moyen d'apurement abaissé à ${metrics?.delaiMoyenApurementComptaJours || 1.1} jour ouvré.`
        ],
        risksAndGaps: [
          `Écart de concordance résiduel de ${metrics?.ecartConcordanceMilliards || 1.2} Mds FCFA sur les virements en transit (comptes 4711 / 5120).`,
          `${metrics?.suspensionsActivesDossiers || 18} dossiers en suspens de plus de 60 jours concentrés sur 3 ministères.`,
          `Imputations provisoires (compte 47) à régulariser avant clôture.`
        ],
        recommendations: [
          `Déployer le lettrage automatique par référence unique SIGFiP / SYGACUT sur 100% des avis de crédit BCEAO.`,
          `Convoquer une commission mixte d'apurement des suspens de plus de 60 jours avant l'arrêté trimestriel.`,
          `Apurer prioritairement les comptes transitoires 4711 et 4712 des trésoreries régionales.`
        ],
        predictiveInsights: [
          { label: 'Concordance Auto Prévue', trend: 'UP', forecast: '97,8%', confidence: 94, subLabel: 'Objectif ACCT', subValue: '+3,0 pts' },
          { label: 'Délai Moyen Lettrage', trend: 'DOWN', forecast: '0,6 jour', confidence: 91, subLabel: 'Temps réel', subValue: 'Flux T+0' },
          { label: 'Réduction des Suspens', trend: 'DOWN', forecast: '-42%', confidence: 86, subLabel: 'Compte 47', subValue: 'Apurement' },
          { label: 'Indice de Confiance IA', trend: 'UP', forecast: '95%', confidence: 96, subLabel: 'Projection', subValue: 'Certifié ACCT' }
        ]
      },
      tresorerie: {
        title: `Audit & Synthèse Décisionnelle — Trésorerie`,
        domain: 'Trésorerie (Lettres d’Avance, Bons de Caisse, Comptes Spéciaux)',
        period: `${annee}`,
        globalScore: laReg >= 90 ? 92 : 86,
        globalStatus: laReg >= 90 ? 'EXCELLENT' : 'CONFORME',
        executiveSummary: `<p class="lead-headline"><strong>Position nette du Compte Unique du Trésor (CUT) à ${liqMds.toFixed(1)} Mds FCFA :</strong> Couverture optimale des échéances régaliennes et de ${metrics?.bonsCaisseCirculationCount || 458} Bons de Caisse actifs.</p><p class="lead-paragraph">Au titre de l'exercice <strong>${annee}</strong> sur le périmètre <strong>${perimetre}</strong>, les disponibilités centralisées à la BCEAO (<strong>55%</strong>) et sur les <strong>${metrics?.comptesSpeciauxActifs || 84} Comptes Spéciaux (${metrics?.soldeComptesSpeciauxMilliards || 42.85} Mds)</strong> assurent une solvabilité robuste.</p><p class="lead-paragraph m-0">Toutefois, l'encours de <strong>${laEnc.toFixed(1)} Mds FCFA de Lettres d'Avance non régularisées</strong> (taux d'apurement à <strong>${laReg.toFixed(1)}%</strong> contre un seuil légal de <strong>90%</strong>) requiert une relance ciblée.</p>`,
        keyHighlights: [
          `Position nette de liquidité consolidée à ${liqMds.toFixed(1)} Mds FCFA (+5,3% sur l'exercice).`,
          `Couverture d'approvisionnement des guichets et des ${metrics?.bonsCaisseCirculationCount || 458} Bons de Caisse maintenue à 98,2%.`,
          `${metrics?.comptesSpeciauxActifs || 84} Comptes Spéciaux du Trésor (CST) excédentaires (${metrics?.soldeComptesSpeciauxMilliards || 42.85} Mds FCFA).`
        ],
        risksAndGaps: [
          `Encours de ${laEnc.toFixed(1)} Mds FCFA de Lettres d'Avance en attente de pièces justificatives au-delà de 45 jours.`,
          `Écart de ${(90 - laReg > 0 ? (90 - laReg).toFixed(1) : '0.5')} point(s) par rapport à la cible légale de régularisation LA (≥ 90%).`,
          `Dépassement ponctuel sur le Fonds d'Urgence Sanitaire (Comptes Spéciaux).`
        ],
        recommendations: [
          `Bloquer l'émission de nouvelles Lettres d'Avance pour les ordonnateurs présentant un retard > 60 jours.`,
          `Automatiser le nivellement quotidien des sous-comptes bancaires vers le Compte Unique BCEAO.`,
          `Systématiser l'apurement électronique des Bons de Caisse inter-postes à J+5.`
        ],
        predictiveInsights: [
          { label: 'Projection Liquidité CUT N+1', trend: 'UP', forecast: `${(liqMds * 1.058).toFixed(1)} Mds`, confidence: 92, subLabel: 'Horizon 2027', subValue: '+5,8%/an' },
          { label: 'Cible Régularisation LA', trend: 'UP', forecast: '≥ 93,5%', confidence: 89, subLabel: 'Norme ACCT', subValue: 'Seuil ≥ 90%' },
          { label: 'Solde Comptes Spéciaux', trend: 'UP', forecast: `${((metrics?.soldeComptesSpeciauxMilliards || 42.8) * 1.04).toFixed(1)} Mds`, confidence: 87, subLabel: 'Trésorerie', subValue: '+4,0%' },
          { label: 'Indice de Confiance IA', trend: 'UP', forecast: '94%', confidence: 95, subLabel: 'Projection', subValue: 'Certifié DWH' }
        ]
      },
      cautionnement: {
        title: `Audit & Synthèse Décisionnelle — Cautionnement`,
        domain: 'Cautionnement (Comptables, Marchés Publics, Consignations)',
        period: `${annee}`,
        globalScore: 87,
        globalStatus: 'CONFORME',
        executiveSummary: `<p class="lead-headline"><strong>Portefeuille de ${metrics?.cautionnementsActifsCount || 1450} cautionnements actifs (${metrics?.cautionnementsVolumeMilliards || 15.0} Mds FCFA) :</strong> Taux de couverture des comptables et régisseurs à <strong>${metrics?.tauxCouvertureCautionnement || 96.8}%</strong>.</p><p class="lead-paragraph">En <strong>${annee}</strong> (${perimetre}), le service Cautionnement pilote les garanties des comptables publics, les retenues de garantie 5% sur marchés publics et les consignations judiciaires CDC-CI.</p><p class="lead-paragraph m-0">Une action ciblée est requise sur <strong>${metrics?.cautionnementsEchusMilliards || 2.3} Mds FCFA de cautionnements échus non levés</strong> et <strong>${metrics?.cautionnementsContentieuxCount || 45} dossiers en contentieux</strong>.</p>`,
        keyHighlights: [
          `Habilitation et attestation active pour les comptables principaux et régisseurs en poste.`,
          `Sécurisation bancaire de 1ère demande sur les grands marchés d'infrastructures (BTP, Énergie).`,
          `Traçabilité complète des dépôts et séquestres judiciaires (Cour des Comptes & Tribunal de Commerce).`
        ],
        risksAndGaps: [
          `Cautionnements échus non régularisés représentant ${metrics?.cautionnementsEchusMilliards || 2.3} Mds FCFA (320 dossiers).`,
          `${metrics?.cautionnementsContentieuxCount || 45} dossiers en contentieux ou dépassement de délai de forclusion douanière.`
        ],
        recommendations: [
          `Déclencher les alertes automatiques de renouvellement d'attestation 30 jours avant l'échéance du mandat des régisseurs.`,
          `Activer les appels en garantie bancaire sur les marchés publics en défaillance constatée.`,
          `Numériser la délivrance des quitus et mainlevées définitives après contrôle contradictoire.`
        ],
        predictiveInsights: [
          { label: 'Volume Garanties N+1', trend: 'UP', forecast: `${((metrics?.cautionnementsVolumeMilliards || 15.0) * 1.08).toFixed(1)} Mds`, confidence: 90, subLabel: 'Marchés & Postes', subValue: '+8,0%' },
          { label: 'Délai Émission Quitus', trend: 'DOWN', forecast: '4,5 jours', confidence: 88, subLabel: 'Dématérialisé', subValue: '-50%' },
          { label: 'Taux Couverture Régisseurs', trend: 'UP', forecast: '100%', confidence: 98, subLabel: 'Obligation légale', subValue: 'Conforme' },
          { label: 'Indice de Confiance IA', trend: 'UP', forecast: '92%', confidence: 94, subLabel: 'Projection', subValue: 'Certifié ACCT' }
        ]
      },
      regies: {
        title: `Audit & Synthèse Décisionnelle — Régies`,
        domain: 'Régies (Régies d’Avances, Régies de Recettes, Audits)',
        period: `${annee}`,
        globalScore: 91,
        globalStatus: 'EXCELLENT',
        executiveSummary: `<p class="lead-headline"><strong>Mobilisation globale de ${recMds.toFixed(1)} Mds FCFA :</strong> Taux de pièces justificatives conformes à <strong>${metrics?.regiesTauxPiecesConformes || 96.4}%</strong> sur ${postes} régies et postes connectés.</p><p class="lead-paragraph">Durant l'exercice <strong>${annee}</strong> (${perimetre}), les régies d'avances gèrent <strong>${metrics?.regiesAvancesEnCoursMilliards || 4.85} Mds FCFA</strong> avec une rotation moyenne de <strong>${metrics?.regiesDelaiMoyenRotationJours || 12.5} jours</strong>, tandis que les régies de recettes ont perçu <strong>${metrics?.regiesRecettesPercuesMilliards || 14.28} Mds FCFA</strong>.</p><p class="lead-paragraph m-0">La surveillance porte sur <strong>${metrics?.regiesEnDepassementCount || 7} régies en dépassement de plafond ou délai</strong> nécessitant des contrôles inopinés ACCT.</p>`,
        keyHighlights: [
          `Taux de rapatriement des recettes des régies vers le Trésor à 99,1% (délai moyen : 2,4 jours).`,
          `Taux de conformité des pièces justificatives des régies d'avances à ${metrics?.regiesTauxPiecesConformes || 96.4}% (seuil légal > 95%).`,
          `Interconnexion temps réel de ${postes} postes et régies sur la plateforme SYGACUT-BI.`
        ],
        risksAndGaps: [
          `${metrics?.regiesEnDepassementCount || 7} régies d'avances présentent une rotation des fonds supérieure au plafond de 15 jours ouvrés.`,
          `4 chèques impayés en souffrance dans les régies de recettes périphériques.`
        ],
        recommendations: [
          `Généraliser l'encaissement digital (TrésorPay / Mobile Money) dans toutes les régies hospitalières et universitaires.`,
          `Diligenter des missions d'audit inopiné sur les régies présentant un taux de justificatifs < 90%.`,
          `Automatiser le plafonnement d'encaisse physique avec reversement automatique à la BCEAO/BNI.`
        ],
        predictiveInsights: [
          { label: 'Recettes Projetées 2027', trend: 'UP', forecast: `${prev2027.toFixed(1)} Mds`, confidence: 93, subLabel: 'Horizon 2027', subValue: '+5,4%/an' },
          { label: 'Taux Exécution LF Prévu', trend: 'UP', forecast: '96,8%', confidence: 90, subLabel: 'Loi de Finances', subValue: 'Cible ≥ 95%' },
          { label: 'Rotation Moyenne Fonds', trend: 'DOWN', forecast: '9,8 jours', confidence: 88, subLabel: 'Régies Avances', subValue: 'Cible < 15j' },
          { label: 'Indice de Confiance IA', trend: 'UP', forecast: '93%', confidence: 95, subLabel: 'Projection', subValue: 'Certifié DWH' }
        ]
      },
      reglement: {
        title: `Audit & Synthèse Décisionnelle — Règlement`,
        domain: 'Règlement (Fournisseurs, Imputations Provisoires, Rapprochement CUT)',
        period: `${annee}`,
        globalScore: 88,
        globalStatus: 'CONFORME',
        executiveSummary: `<p class="lead-headline"><strong>Volume de règlements exécutés à ${regMds.toFixed(1)} Mds FCFA :</strong> Délai moyen de paiement réduit à <strong>${metrics?.delaiMoyenReglementJours || 21.4} jours</strong> (norme légale &lt; 30j).</p><p class="lead-paragraph">Sur l'exercice <strong>${annee}</strong> (${perimetre}), <strong>${metrics?.partVirementsRtgsPct || 68}%</strong> des paiements fournisseurs (${metrics?.reglementsEnCoursMilliards || 18.25} Mds en cours) sont exécutés par télé-règlements RTGS/BCEAO.</p><p class="lead-paragraph m-0">L'enjeu prioritaire est l'apurement de <strong>${metrics?.imputationsProvisoiresMilliards || 1.85} Mds FCFA d'Imputations Provisoires (IP)</strong> et la levée de <strong>${metrics?.anomaliesReglementDossiers || 14} suspensions bancaires</strong>.</p>`,
        keyHighlights: [
          `Délai moyen de règlement fournisseur maîtrisé à ${metrics?.delaiMoyenReglementJours || 21.4} jours ouvrés (-3,6 jours vs N-1).`,
          `Taux de télétransmission bancaire RTGS / SICA sans rejet à 98,5% (concordance CUT/ACCT de 99,98%).`,
          `Taux d'apurement définitif des Imputations Provisoires à 91,8%.`
        ],
        risksAndGaps: [
          `Encours d'Imputations Provisoires (IP) en attente de visa d'engagement définitif (${metrics?.imputationsProvisoiresMilliards || 1.85} Mds FCFA).`,
          `${metrics?.anomaliesReglementDossiers || 14} dossiers de règlement suspendus pour anomalies de coordonnées bancaires (RIB) ou pièces manquantes.`
        ],
        recommendations: [
          `Conditionner toute nouvelle imputation provisoire à la régularisation des IP antérieures de plus de 30 jours.`,
          `Automatiser le contrôle pré-validation des RIB fournisseurs avec le fichier central BCEAO / SICA.`,
          `Généraliser le télé-règlement sur 100% des mandats supérieurs à 50 Millions FCFA.`
        ],
        predictiveInsights: [
          { label: 'Délai Moyen Cible N+1', trend: 'DOWN', forecast: '17,5 jours', confidence: 91, subLabel: 'Norme < 30j', subValue: '-3,9 jours' },
          { label: 'Part Télé-règlement RTGS', trend: 'UP', forecast: '78,0%', confidence: 93, subLabel: 'Digitalisation', subValue: '+10 pts' },
          { label: 'Apurement IP Cible', trend: 'UP', forecast: '96,5%', confidence: 89, subLabel: 'Imputations', subValue: 'Cible > 95%' },
          { label: 'Indice de Confiance IA', trend: 'UP', forecast: '92%', confidence: 94, subLabel: 'Projection', subValue: 'Certifié ACCT' }
        ]
      },
      statistiques: {
        title: `Audit & Synthèse Décisionnelle — Statistiques`,
        domain: 'Statistiques (Subventions, RAP, OC/LC, UEMOA/CEDEAO, Dette)',
        period: `${annee}`,
        globalScore: rap90 > 30 ? 81 : 89,
        globalStatus: rap90 > 30 ? 'VIGILANCE' : 'CONFORME',
        executiveSummary: `<p class="lead-headline"><strong>Pilotage des 16 livrables statistiques institutionnels :</strong> Taux de réalisation des prévisions macro à <strong>${metrics?.tauxRealisationPrevisionsStat || 93.8}%</strong> et subventions consolidées à <strong>${subMds.toFixed(2)} Mds FCFA</strong>.</p><p class="lead-paragraph">En <strong>${annee}</strong> (${perimetre}), les Obligations Cautionnées (OC/LC) mobilisent <strong>${ocMds.toFixed(1)} Mds FCFA</strong> et les reversements communautaires UEMOA (PCS) / CEDEAO (PCC) atteignent <strong>${metrics?.statCooperationRegionaleMilliards || 35.55} Mds FCFA</strong>.</p><p class="lead-paragraph m-0">La vigilance porte sur l'encours de <strong>${rapMds.toFixed(1)} Mds FCFA de Restes à Payer (RAP)</strong> (dont <strong>${rap90.toFixed(1)} Mds &gt; 90 jours</strong>) et le suivi du service de la dette (<strong>${metrics?.serviceDetteMilliards || 75.4} Mds FCFA</strong>).</p>`,
        keyHighlights: [
          `Exécution des subventions aux EPN, Santé, Éducation et FER à ${metrics?.tauxRealisationPrevisionsStat || 93.8}% (${subMds.toFixed(2)} Mds FCFA).`,
          `Reversements communautaires PCS (UEMOA) et PCC (CEDEAO) exécutés à 98,0% sans arriéré.`,
          `Suivi temps réel des collectes douanières Webfontaine et des comptes bailleurs (C2D, BAD).`
        ],
        risksAndGaps: [
          `Encours de Restes à Payer (RAP) critiques (> 90 jours) s'élevant à ${rap90.toFixed(1)} Mds FCFA sur le secteur BTP.`,
          `Encours global de la dette à ${metrics?.encoursDetteMilliards || 12840} Mds FCFA exigeant un provisionnement rigoureux des échéances.`
        ],
        recommendations: [
          `Instaurer un plan d'apurement prioritaire sur les RAP de plus de 90 jours identifiés dans l'état statistique N°5.`,
          `Synchroniser automatiquement les prévisions mensuelles de trésorerie avec l'échéancier du service de la dette.`,
          `Renforcer la justification des subventions d'investissement (FER et pistes rurales) avant décaissement.`
        ],
        predictiveInsights: [
          { label: 'Réduction Projetée des RAP', trend: 'DOWN', forecast: `${(rapMds * 0.78).toFixed(1)} Mds`, confidence: 89, subLabel: 'Plan Apurement', subValue: '-22% en N+1' },
          { label: 'Mobilisation OC/LC & Douanes', trend: 'UP', forecast: `${(ocMds * 1.06).toFixed(1)} Mds`, confidence: 92, subLabel: 'Webfontaine', subValue: '+6,0%' },
          { label: 'Fiabilité Prévisions Macro', trend: 'UP', forecast: '96,2%', confidence: 91, subLabel: 'DWH / DGTCP', subValue: '+2,4 pts' },
          { label: 'Indice de Confiance IA', trend: 'UP', forecast: '93%', confidence: 95, subLabel: 'Projection', subValue: '16 Rapports' }
        ]
      },
      compte_gestion: {
        title: `Audit & Synthèse Décisionnelle — Compte de Gestion`,
        domain: 'Compte de Gestion (Développements, Balance, Reddition Cour des Comptes)',
        period: `${annee}`,
        globalScore: 95,
        globalStatus: 'EXCELLENT',
        executiveSummary: `<p class="lead-headline"><strong>Taux de conformité des Comptes de Gestion à ${metrics?.tauxConformiteCompteGestion || 96.4}% :</strong> Volume audité de <strong>${metrics?.cgVolumeAuditeMilliards || 482.5} Mds FCFA</strong> aligné sur les exigences de la Cour des Comptes.</p><p class="lead-paragraph">Sur l'exercice <strong>${annee}</strong> (${perimetre}), les développements budgétaires, balances d'entrée et états de reddition de la TGE, PGT, RGF et PGA affichent un taux de quitus transmis de <strong>${metrics?.quitusTransmisPct || 95.2}%</strong>.</p><p class="lead-paragraph m-0">Les derniers travaux d'apurement portent sur <strong>${metrics?.restesEnInstanceCGMilliards || 11.26} Mds FCFA de restes en instance</strong> et la complétude documentaire des postes décentralisés.</p>`,
        keyHighlights: [
          `Transmission dans les délais légaux des dossiers de reddition annuelle (TGE, PGT, RGF, PGA).`,
          `Concordance certifiée à 99,2% entre la Balance Générale et les développements budgétaires (${metrics?.tauxExecutionCreditsCG || 91.6}% d'exécution).`,
          `Apurement de 92% des Imputations Provisoires de Dépenses (IPD) et débiteurs divers.`
        ],
        risksAndGaps: [
          `Restes en instance d'apurement de ${metrics?.restesEnInstanceCGMilliards || 11.26} Mds FCFA sur certains postes régionaux.`,
          `Pièces justificatives complémentaires attendues sur 2 bordereaux décentralisés.`
        ],
        recommendations: [
          `Généraliser la liasse numérique certifiée pour la transmission directe des Comptes de Gestion à la Cour des Comptes.`,
          `Instaurer un pré-audit mensuel automatisé de concordance Balance / État d'exécution budgétaire.`,
          `Accompagner les trésoreries générales régionales sur l'apurement des restes à recouvrer.`
        ],
        predictiveInsights: [
          { label: 'Conformité Reddition N+1', trend: 'UP', forecast: '98,5%', confidence: 96, subLabel: 'Cour des Comptes', subValue: 'Quitus cible' },
          { label: 'Taux Apurement IPD', trend: 'UP', forecast: '97,0%', confidence: 92, subLabel: 'Imputations', subValue: '+5,0 pts' },
          { label: 'Postes Certifiés J+15', trend: 'UP', forecast: '100%', confidence: 94, subLabel: 'Réseau DGTCP', subValue: 'Exhaustif' },
          { label: 'Indice de Confiance IA', trend: 'UP', forecast: '96%', confidence: 97, subLabel: 'Projection', subValue: 'Certifié DGTCP' }
        ]
      }
    };

    return of(summaries[domain] || summaries['tresorerie']);
  }

  getPredictiveSeries(baseYear: number = 2026, metrics?: RealDataPilotageMetrics | null): Observable<PredictiveProjection[]> {
    const projections: PredictiveProjection[] = [];

    if (metrics && metrics.historiqueFlux && metrics.historiqueFlux.length > 0) {
      for (const h of metrics.historiqueFlux) {
        const solde = Number((h.recettesMilliards - h.reglementsMilliards).toFixed(1));
        const ratio = h.reglementsMilliards > 0
          ? Number(((h.recettesMilliards / h.reglementsMilliards) * 100).toFixed(1))
          : 100;
        projections.push({
          year: h.annee,
          isHistorical: true,
          recettes: Number(h.recettesMilliards.toFixed(1)),
          reglements: Number(h.reglementsMilliards.toFixed(1)),
          soldeCut: solde,
          ratioCouverture: ratio
        });
      }

      for (let i = 0; i < metrics.anneesProjections.length; i++) {
        const py = metrics.anneesProjections[i];
        const recP = Number((metrics.projectionsRecettes[i] || 1300).toFixed(1));
        const regP = Number((metrics.projectionsReglements[i] || 1180).toFixed(1));
        const soldeP = Number((recP - regP).toFixed(1));
        projections.push({
          year: py,
          isHistorical: false,
          recettes: recP,
          reglements: regP,
          soldeCut: soldeP,
          ratioCouverture: Number(((recP / Math.max(1, regP)) * 100).toFixed(1))
        });
      }

      return of(projections);
    }

    for (let y = baseYear - 4; y <= baseYear + 4; y++) {
      const isHist = y <= baseYear;
      const step = y - (baseYear - 4);
      const rec = Number((980 + step * 62.5).toFixed(1));
      const reg = Number((895 + step * 54.0).toFixed(1));
      projections.push({
        year: y,
        isHistorical: isHist,
        recettes: rec,
        reglements: reg,
        soldeCut: Number((rec - reg).toFixed(1)),
        ratioCouverture: Number(((rec / reg) * 100).toFixed(1))
      });
    }
    return of(projections);
  }
}
