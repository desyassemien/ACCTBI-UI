import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // Using signals for state management
    private currentUserSignal = signal<User | null>(null);

    // Computed state for easy access
    readonly currentUser = this.currentUserSignal.asReadonly();
    readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

    constructor(private router: Router) {
        // Check if user is stored in local storage on initialization
        const storedUser = localStorage.getItem('sygacutUser');
        if (storedUser) {
            this.currentUserSignal.set(JSON.parse(storedUser));
        }
    }

    // Mock login method
    login(matricule: string, password: string): Promise<boolean> {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                let user: User | null = null;

                if (matricule === 'admin' && password === 'admin') {
                    user = {
                        id: '1',
                        nom: 'Admin',
                        prenom: 'System',
                        matricule: 'admin',
                        role: 'ADMIN',
                        service: 'Direction Générale'
                    };
                } else if (matricule === 'compta' && password === 'compta') {
                    user = {
                        id: '2',
                        nom: 'Comptable',
                        prenom: 'Chef',
                        matricule: 'compta',
                        role: 'CHEF_COMPTA',
                        service: 'Comptabilité'
                    };
                } else if (matricule === 'tresor' && password === 'tresor') {
                    user = {
                        id: '3',
                        nom: 'Trésorier',
                        prenom: 'Chef',
                        matricule: 'tresor',
                        role: 'CHEF_TRESORERIE',
                        service: 'Trésorerie'
                    };
                } else if (matricule === 'regie' && password === 'regie') {
                    user = {
                        id: '4',
                        nom: 'Régisseur',
                        prenom: 'Chef',
                        matricule: 'regie',
                        role: 'CHEF_REGIE',
                        service: 'Régies'
                    };
                }

                if (user) {
                    this.currentUserSignal.set(user);
                    localStorage.setItem('sygacutUser', JSON.stringify(user));
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, 1000);
        });
    }

    logout(): void {
        this.currentUserSignal.set(null);
        localStorage.removeItem('sygacutUser');
        this.router.navigate(['/login']);
    }
}
