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
                // Mock validation
                if (matricule === 'admin' && password === 'admin') {
                    const user: User = {
                        id: '1',
                        nom: 'Admin',
                        prenom: 'System',
                        matricule: 'admin',
                        role: 'DIRECTEUR',
                        service: 'Direction Générale'
                    };

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
