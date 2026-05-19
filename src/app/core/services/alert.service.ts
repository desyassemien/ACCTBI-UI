import { Injectable, signal } from '@angular/core';

export interface AlertData {
  title: string;
  message: string;
  type: 'danger' | 'warning' | 'info';
  show: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  // Utilisation d'un Signal pour une réactivité optimale sous Angular 20+
  private alertState = signal<AlertData>({
    title: '',
    message: '',
    type: 'danger',
    show: false
  });

  readonly alert = this.alertState.asReadonly();

  showAccessDenied(message: string = 'Vous ne possédez pas les droits nécessaires pour accéder à cette section.') {
    this.alertState.set({
      title: 'Accès Refusé',
      message: message,
      type: 'danger',
      show: true
    });
  }

  hideAlert() {
    this.alertState.update(state => ({ ...state, show: false }));
  }
}
