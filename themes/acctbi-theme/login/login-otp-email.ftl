<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=false displayMessage=false; section>
    <#if section = "header">
        <!-- Pas de header standard ici -->
    <#elseif section = "form">
        <div style="background: red; color: white; padding: 10px; text-align: center; font-weight: bold; position: fixed; top: 0; width: 100%; z-index: 9999;">
            DEBUG: login-otp-email.ftl LOADED
        </div>
        <div class="login-container container-fluid p-0">
            <div class="row g-0 vh-100">
                <!-- Left Split -->
                <div class="col-lg-6 d-none d-lg-flex bg-primary-dark auth-banner align-items-center justify-content-center flex-column text-white p-5 position-relative overflow-hidden">
                    <div class="bg-shape shape-1"></div>
                    <div class="bg-shape shape-2"></div>
                    <div class="content-wrapper text-center z-1">
                        <h1 class="display-4 fw-bold mb-4 brand-title">${msg("brandTitle")}</h1>
                        <p class="lead mb-4 fw-light text-primary-100">${msg("brandSubtitle")?no_esc}</p>
                    </div>
                </div>

                <!-- Right Split -->
                <div class="col-12 col-lg-6 d-flex align-items-center justify-content-center bg-body">
                    <div class="auth-form-wrapper w-100 p-4 p-md-5">
                        <div class="text-center text-lg-start mb-5">
                            <h3 class="fw-bold text-dark mb-2">Code Email</h3>
                        </div>
                        <form id="kc-otp-login-form" action="${url.loginAction}" method="post">
                            <div class="form-floating mb-4">
                                <input tabindex="1" type="text" class="form-control text-center fs-4 fw-bold" id="otp" name="code" placeholder="123456" required autofocus autocomplete="off">
                                <label for="otp">Code</label>
                            </div>
                            <button tabindex="2" type="submit" name="login" class="btn btn-primary w-100 py-3 fw-bold fs-6 mb-3">Valider</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </#if>
</@layout.registrationLayout>
