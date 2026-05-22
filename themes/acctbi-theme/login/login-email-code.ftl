<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=false displayMessage=false; section>
    <#if section = "header">
        <!-- Pas de header standard ici -->
    <#elseif section = "form">
        <div class="login-container container-fluid p-0">
            <div class="row g-0 vh-100">
                <!-- Left Split -->
                <div class="col-lg-6 d-none d-lg-flex bg-primary-dark auth-banner align-items-center justify-content-center flex-column text-white p-5 position-relative overflow-hidden">
                    <div class="bg-shape shape-1"></div>
                    <div class="bg-shape shape-2"></div>
                    <div class="content-wrapper text-center z-1">
                        <h1 class="display-4 fw-bold mb-4 brand-title">${msg("brandTitle")}</h1>
                        <p class="lead mb-4 fw-light text-primary-100">${msg("brandSubtitle")?no_esc}</p>
                        <div class="d-flex align-items-center justify-content-center gap-3 mt-5">
                            <div class="feature-badge"><i class="fas fa-envelope fs-4 mb-2"></i><span>Email Secure</span></div>
                            <div class="feature-badge"><i class="fas fa-shield-alt fs-4 mb-2"></i><span>Protective</span></div>
                            <div class="feature-badge"><i class="fas fa-bolt fs-4 mb-2"></i><span>Fast OTP</span></div>
                        </div>
                    </div>
                </div>

                <!-- Right Split -->
                <div class="col-12 col-lg-6 d-flex align-items-center justify-content-center bg-body">
                    <div class="auth-form-wrapper w-100 p-4 p-md-5">
                        <div class="text-center text-lg-start mb-5">
                            <div class="mb-3">
                                <i class="fas fa-envelope-open-text text-primary-700 fa-3x"></i>
                            </div>
                            <h3 class="fw-bold text-dark mb-2">Code de vérification</h3>
                            <p class="text-secondary">Un code a été envoyé à votre adresse email. Veuillez le saisir ci-dessous.</p>
                        </div>

                        <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                            <div class="alert alert-danger d-flex align-items-center" role="alert">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                <div>${kcSanitize(message.summary)?no_esc}</div>
                            </div>
                        </#if>

                        <form id="kc-otp-login-form" action="${url.loginAction}" method="post">
                            <div class="form-floating mb-4">
                                <input tabindex="1" type="text" class="form-control text-center fs-4 fw-bold" id="otp" name="code" placeholder="123456" required autofocus autocomplete="off">
                                <label for="otp">Code de vérification</label>
                            </div>

                            <button tabindex="2" type="submit" name="login" class="btn btn-primary w-100 py-3 fw-bold fs-6 mb-3">
                                Valider le code <i class="fas fa-check-circle ms-2"></i>
                            </button>

                            <#-- Bouton de renvoi (Vérifie le nom du paramètre attendu par ton plugin, souvent 'resend' ou 'resendCode') -->
                            <button type="submit" name="resend" class="btn btn-outline-secondary w-100 py-2 fw-medium border-0 shadow-none text-decoration-underline">
                                <i class="fas fa-redo me-2 small"></i> Renvoyer l'email
                            </button>
                            
                            <div class="text-center mt-5 text-secondary small">
                                &copy; ${msg("copyright")}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </#if>
</@layout.registrationLayout>
