import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';

@Component({
    selector: 'app-profil',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './profil.component.html',
    styleUrl: './profil.component.scss'
})
export class ProfilComponent {
    private keycloak = inject(KeycloakService);
    user: any = null;

    async ngOnInit() {
        if (this.keycloak.isLoggedIn()) {
            this.user = await this.keycloak.loadUserProfile();
        }
    }
}
