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
  public readonly alertesNonLues = computed(() => this.alertesSignal().filter(a => !a.lue).sort((a, b) => b.dateCreation.getTime() - a.dateCreation.getTime()));
  
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

  /**
   * Demander la permission au navigateur et simuler une notification Push
   */
  private async requestNotificationPermissionAndSimulate() {
    if (!('Notification' in window)) {
      console.warn('Ce navigateur ne supporte pas les notifications système.');
      return;
    }

    // Demander la permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ [PWA] Permission accordée pour les notifications Web Push. Prêt pour le déclenchement manuel.');
    } else {
      console.warn('❌ [PWA] Permission refusée pour les notifications Web Push.');
    }
  }

  /**
   * Crée la notification système (OS) - Rendu public pour test manuel
   */
  public triggerSystemNotification(alerte: Alerte) {
    console.log('▶️ [PWA] Entrée dans triggerSystemNotification avec Notification.permission =', Notification.permission);
    if (Notification.permission === 'granted') {
      console.log(`🔔 [PWA] API Notification appelée pour: ${alerte.titre}`);
      
      const notification = new Notification('SYGACUT-BI: ' + alerte.titre, {
        body: alerte.description,
        icon: '/icons/icon-192x192.png', // Icône générée par PWA
        badge: '/icons/icon-72x72.png',
        tag: alerte.id, // Évite de dupliquer la même alerte
        renotify: true, // Force le "ping" même si le tag est identique
        vibrate: [200, 100, 200], // Vibration pour mobile
        silent: false // S'assurer que ce n'est pas silencieux
      } as any);

      notification.onclick = () => {
        window.focus();
        notification.close();
        // Redirection potentielle ici si Router était injecté
      };
    }
  }

  /**
   * Initialize some mock alerts based on Point 11.3 logic
   */
  private initMockAlertes() {
    const now = new Date();
    
    const mockAlertes: Alerte[] = [
      {
        id: '1',
        type: 'INFO',
        service: 'tresorerie',
        titre: 'Point Matinal de Trésorerie',
        description: 'La position nette est excédentaire de 2.5 Milliards FCFA.',
        montant: 2500000000,
        routeAction: '/tresorerie/situation',
        lue: false,
        dateCreation: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0) // today 8am
      },
      {
        id: '2',
        type: 'WARNING',
        service: 'statistiques',
        titre: 'Top 5 des RAP anciens',
        description: 'Les 5 Restes À Payer les plus anciens ont été mis à jour.',
        routeAction: '/statistiques/rap',
        lue: false,
        dateCreation: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        id: '3',
        type: 'DANGER',
        service: 'comptabilite',
        titre: 'Alerte Écart de Concordance',
        description: 'L\'écart de concordance bancaire dépasse le seuil toléré de 0.1%.',
        routeAction: '/comptabilite/rapprochement',
        lue: false,
        dateCreation: new Date(now.getTime() - 1 * 60 * 60 * 1000) // 1 hour ago
      }
    ];

    this.alertesSignal.set(mockAlertes);
  }

  /**
   * Mark a specific alert as read
   */
  public markAsRead(id: string) {
    this.alertesSignal.update(alertes => 
      alertes.map(a => a.id === id ? { ...a, lue: true } : a)
    );
  }

  /**
   * Mark all alerts as read
   */
  public markAllAsRead() {
    this.alertesSignal.update(alertes => 
      alertes.map(a => ({ ...a, lue: true }))
    );
  }

  /**
   * Dismiss/Delete an alert
   */
  public dismissAlerte(id: string) {
    this.alertesSignal.update(alertes => alertes.filter(a => a.id !== id));
  }
}
