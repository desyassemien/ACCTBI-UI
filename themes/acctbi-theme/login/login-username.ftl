<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=false displayMessage=false; section>
    <#if section = "header">
        <!-- Pas de header standard ici, on gère tout dans le layout split -->
    <#elseif section = "form">
        <div class="login-container container-fluid p-0">
            <div class="row g-0 vh-100">
                <!-- Left Split (Image/Branding) - Hidden on mobile -->
                <div class="col-lg-6 d-none d-lg-flex bg-primary-dark auth-banner align-items-center justify-content-center flex-column text-white p-5 position-relative overflow-hidden">
                    <!-- Decorative background elements -->
                    <div class="bg-shape shape-1"></div>
                    <div class="bg-shape shape-2"></div>
                    
                    <div class="content-wrapper text-center z-1">
                        <h1 class="display-4 fw-bold mb-4 brand-title">${msg("brandTitle")}</h1>
                        <p class="lead mb-4 fw-light text-primary-100">
                            ${msg("brandSubtitle")?no_esc}
                        </p>
                        <div class="d-flex align-items-center justify-content-center gap-3 mt-5">
                            <div class="feature-badge">
                                <i class="fas fa-chart-line fs-4 mb-2"></i>
                                <span>${msg("featureAnalyses")}</span>
                            </div>
                            <div class="feature-badge">
                                <i class="fas fa-shield-alt fs-4 mb-2"></i>
                                <span>${msg("featureSecure")}</span>
                            </div>
                            <div class="feature-badge">
                                <i class="fas fa-bolt fs-4 mb-2"></i>
                                <span>${msg("featureRealTime")}</span>
                            </div>
                            <div class="feature-badge">
                                <i class="fas fa-robot fs-4 mb-2"></i>
                                <span>${msg("featureAI")}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Split (Login Form) -->
                <div class="col-12 col-lg-6 d-flex align-items-center justify-content-center bg-body">
                    <div class="auth-form-wrapper w-100 p-4 p-md-5">
                        
                        <!-- Mobile Header (Visible only on small screens) -->
                        <div class="d-lg-none text-center mb-5">
                            <h2 class="fw-bold text-primary-700 mb-1">${msg("brandTitle")}</h2>
                            <p class="text-secondary small">Trésor Public CI</p>
                        </div>

                        <div class="text-center text-lg-start mb-5">
                            <h3 class="fw-bold text-dark mb-2">${msg("loginTitle")}</h3>
                            <p class="text-secondary">Saisissez votre identifiant pour continuer</p>
                        </div>

                        <#-- Affichage des messages d'erreur Keycloak -->
                        <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                            <div class="alert alert-danger d-flex align-items-center" role="alert">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                <div>${kcSanitize(message.summary)?no_esc}</div>
                            </div>
                        </#if>

                        <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post" class="needs-validation">
                            <div class="form-floating mb-4">
                                <input 
                                    tabindex="1"
                                    type="text" 
                                    class="form-control" 
                                    id="username" 
                                    name="username"
                                    value="${(login.username!'')}"
                                    placeholder="Ex: 123456A"
                                    required
                                    autofocus
                                    autocomplete="off"
                                >
                                <label for="username">${msg("usernameOrEmail")}</label>
                            </div>

                            <div class="d-flex justify-content-between align-items-center mb-5">
                                <#if realm.rememberMe && !login.rememberMeReadOnly??>
                                    <div class="form-check">
                                        <input tabindex="3" class="form-check-input custom-checkbox" type="checkbox" id="rememberMe" name="rememberMe" <#if login.rememberMe??>checked</#if>>
                                        <label class="form-check-label text-secondary" for="rememberMe">
                                            ${msg("rememberMe")}
                                        </label>
                                    </div>
                                </#if>
                            </div>

                            <button 
                                tabindex="4"
                                type="submit" 
                                id="kc-login"
                                name="login"
                                class="btn btn-primary w-100 py-3 fw-bold fs-6 d-flex justify-content-center align-items-center" 
                            >
                                Suivant <i class="fas fa-arrow-right ms-2"></i>
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
