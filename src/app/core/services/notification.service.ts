import { Injectable, computed, signal } from '@angular/core';
import { Alerte } from '../models/alerte.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  // Signal list of alerts
  private alertesSignal = signal<Alerte[]>([]);

  // Computed values
  public readonly alertes = this.alertesSignal.asReadonly();
  public readonly unreadCount = computed(() => this.alertesSignal().filter(a => !a.lue).length);
  public readonly alertesNonLues = computed(() =>
    this.alertesSignal()
      .filter(a => !a.lue)
      .sort((a, b) => b.dateCreation.getTime() - a.dateCreation.getTime())
  );

  // Computed alerts by service
  public readonly unreadCountByService = computed(() => {
    const counts: Record<string, number> = {};
    for (const alerte of this.alertesSignal()) {
      if (!alerte.lue) {
        counts[alerte.service] = (counts[alerte.service] || 0) + 1;
      }
    }
    return counts;
  });

  constructor() {
    this.initMockAlertes();
    this.requestNotificationPermissionAndSimulate();
  }

  private async requestNotificationPermissionAndSimulate() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }
    try {
      await Notification.requestPermission();
    } catch { }
  }

  public triggerSystemNotification(alerte: Alerte) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('SYGACUT-BI: ' + alerte.titre, {
        body: alerte.description,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: alerte.id,
        renotify: true,
        vibrate: [200, 100, 200],
        silent: false
      } as any);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  private initMockAlertes() {
    const now = new Date();

    const mockAlertes: Alerte[] = [
      {
        id: 'notif-rule-la-regul-2026',
        type: 'DANGER',
        service: 'tresorerie',
        titre: 'Seuil Légal LA Non Atteint (88,5%)',
        description: 'Le taux de régularisation des Lettres d’Avance (88,5%) est inférieur à la norme ACCT (≥ 90%). Encours à apurer : 45,8 Mds FCFA.',
        montant: 45800000000,
        routeAction: '/synthese-decisionnelle',
        lue: false,
        dateCreation: new Date(now.getTime() - 15 * 60 * 1000)
      },
      {
        id: 'notif-rule-rap-critique-2026',
        type: 'DANGER',
        service: 'reglement',
        titre: 'Alerte Restes à Payer > 90 jours (34,9 Mds)',
        description: 'L’encours des RAP critiques dépasse le plafond de tolérance de 25 Mds FCFA sur les marchés BTP et fournitures.',
        montant: 34900000000,
        routeAction: '/reglement',
        lue: false,
        dateCreation: new Date(now.getTime() - 45 * 60 * 1000)
      },
      {
        id: 'notif-rule-concordance-bceao-2026',
        type: 'WARNING',
        service: 'comptabilite',
        titre: 'Écart de Concordance BCEAO / ACCT (1,20 Mds)',
        description: 'Écart résiduel de rapprochement détecté sur les écritures en transit du Compte Unique du Trésor.',
        montant: 1200000000,
        routeAction: '/comptabilite',
        lue: false,
        dateCreation: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'notif-rule-regies-plafond-2026',
        type: 'INFO',
        service: 'regies',
        titre: 'Mobilisation Régies & Recettes Conforme (1 254 Mds)',
        description: 'Exécution de la Loi de Finances à 94,7% avec un taux de pièces justificatives validées de 96,4%.',
        montant: 1254000000000,
        routeAction: '/regies',
        lue: false,
        dateCreation: new Date(now.getTime() - 4 * 60 * 60 * 1000)
      }
    ];

    this.alertesSignal.set(mockAlertes);
  }

  public syncWithPilotageNotification(compNotif: {
    id: string;
    severite: 'CRITIQUE' | 'VIGILANCE' | 'INFO' | 'SUCCES';
    titre: string;
    description: string;
    isRead: boolean;
  }) {
    const mappedType: 'DANGER' | 'WARNING' | 'INFO' =
      compNotif.severite === 'CRITIQUE'
        ? 'DANGER'
        : compNotif.severite === 'VIGILANCE'
          ? 'WARNING'
          : 'INFO';

    const newAlerte: Alerte = {
      id: compNotif.id,
      type: mappedType,
      service: 'statistiques',
      titre: compNotif.titre,
      description: compNotif.description,
      routeAction: '/analyse-comparative',
      lue: compNotif.isRead,
      dateCreation: new Date()
    };

    this.alertesSignal.update(list => {
      const filtered = list.filter(a => a.id !== compNotif.id);
      return [newAlerte, ...filtered];
    });
  }

  public setAllReadStateFromIds(readIds: Set<string>, totalActiveNotifs?: {
    id: string;
    severite: 'CRITIQUE' | 'VIGILANCE' | 'INFO' | 'SUCCES';
    domaine: string;
    titre: string;
    description: string;
    isRead: boolean;
  }[]) {
    if (totalActiveNotifs && totalActiveNotifs.length > 0) {
      const mapped: Alerte[] = totalActiveNotifs.map((n, idx) => ({
        id: n.id,
        type: n.severite === 'CRITIQUE' ? 'DANGER' : (n.severite === 'VIGILANCE' ? 'WARNING' : 'INFO'),
        service: this.mapDomaineToService(n.domaine),
        titre: n.titre,
        description: n.description,
        routeAction: n.domaine === 'Analyse Comparative' ? '/analyse-comparative' : '/notifications',
        lue: n.isRead,
        dateCreation: new Date(Date.now() - idx * 600000)
      }));
      this.alertesSignal.set(mapped);
      return;
    }

    this.alertesSignal.update(alertes =>
      alertes.map(a => ({ ...a, lue: readIds.has(a.id) ? true : a.lue }))
    );
  }

  private mapDomaineToService(domaine: string): string {
    const d = (domaine || '').toLowerCase();
    if (d.includes('trésor') || d.includes('tresor') || d.includes('liquidit')) return 'tresorerie';
    if (d.includes('compta') || d.includes('concordance')) return 'comptabilite';
    if (d.includes('règle') || d.includes('regle') || d.includes('rap')) return 'reglement';
    if (d.includes('régi') || d.includes('regi') || d.includes('recette')) return 'regies';
    if (d.includes('caution')) return 'cautionnement';
    return 'statistiques';
  }

  public markAsRead(id: string) {
    this.alertesSignal.update(alertes =>
      alertes.map(a => a.id === id ? { ...a, lue: true } : a)
    );
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('sygacut_notif_read_ids');
        const ids: string[] = stored ? JSON.parse(stored) : [];
        if (!ids.includes(id)) {
          ids.push(id);
          localStorage.setItem('sygacut_notif_read_ids', JSON.stringify(ids));
        }
      } catch { }
    }
  }

  public markAllAsRead() {
    const currentIds = this.alertesSignal().map(a => a.id);
    this.alertesSignal.update(alertes =>
      alertes.map(a => ({ ...a, lue: true }))
    );
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('sygacut_notif_read_ids');
        const ids = new Set<string>(stored ? JSON.parse(stored) : []);
        currentIds.forEach(id => ids.add(id));
        localStorage.setItem('sygacut_notif_read_ids', JSON.stringify(Array.from(ids)));
      } catch { }
    }
  }

  public dismissAlerte(id: string) {
    this.alertesSignal.update(alertes => alertes.filter(a => a.id !== id));
  }
}
