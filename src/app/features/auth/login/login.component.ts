import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    loginForm = this.fb.group({
        matricule: ['', [Validators.required]],
        password: ['', [Validators.required]]
    });

    isLoading = signal(false);
    errorMessage = signal('');

    async onSubmit() {
        if (this.loginForm.valid) {
            this.isLoading.set(true);
            this.errorMessage.set('');

            const { matricule, password } = this.loginForm.value;

            const success = await this.authService.login(matricule!, password!);

            this.isLoading.set(false);

            if (success) {
                this.router.navigate(['/dashboard']);
            } else {
                this.errorMessage.set('Identifiants incorrects. Utilisez admin/admin pour tester.');
            }
        } else {
            this.loginForm.markAllAsTouched();
        }
    }
}
