/**
 * Password Recovery & OTP Reset Controller
 */
document.addEventListener('DOMContentLoaded', () => {
    let state = {
        email: '',
        otp: '',
        timer: null,
        secondsLeft: 60
    };

    const step1Panel = document.getElementById('step-1-panel');
    const step2Panel = document.getElementById('step-2-panel');
    const step3Panel = document.getElementById('step-3-panel');

    const step1Badge = document.getElementById('step-1-badge');
    const step2Badge = document.getElementById('step-2-badge');
    const step3Badge = document.getElementById('step-3-badge');
    const stepLine1 = document.getElementById('step-line-1');
    const stepLine2 = document.getElementById('step-line-2');

    const emailForm = document.getElementById('form-request-otp');
    const otpForm = document.getElementById('form-verify-otp');
    const resetForm = document.getElementById('form-set-password');

    const devBanner = document.getElementById('dev-otp-banner');
    const devCodeDisplay = document.getElementById('dev-otp-code');
    const displayEmailTarget = document.getElementById('display-email-target');
    const otpInputs = document.querySelectorAll('.otp-field');

    const timerWrapper = document.getElementById('resend-timer-wrapper');
    const timerSeconds = document.getElementById('resend-timer-seconds');
    const resendBtn = document.getElementById('btn-resend-otp');

    function navigateToStep(step) {
        step1Panel.classList.add('d-none');
        step2Panel.classList.add('d-none');
        step3Panel.classList.add('d-none');

        step1Badge.className = 'step-badge';
        step2Badge.className = 'step-badge';
        step3Badge.className = 'step-badge';
        if (stepLine1) stepLine1.className = 'step-line';
        if (stepLine2) stepLine2.className = 'step-line';

        if (step === 1) {
            step1Panel.classList.remove('d-none');
            step1Badge.classList.add('step-active');
        } else if (step === 2) {
            step2Panel.classList.remove('d-none');
            step1Badge.classList.add('step-complete');
            if (stepLine1) stepLine1.classList.add('step-line-active');
            step2Badge.classList.add('step-active');
            if (otpInputs.length) setTimeout(() => otpInputs[0].focus(), 150);
        } else if (step === 3) {
            step3Panel.classList.remove('d-none');
            step1Badge.classList.add('step-complete');
            if (stepLine1) stepLine1.classList.add('step-line-active');
            step2Badge.classList.add('step-complete');
            if (stepLine2) stepLine2.classList.add('step-line-active');
            step3Badge.classList.add('step-active');
        }
    }

    // OTP Input Navigation & Paste
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = val;
            if (val && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').slice(0, 6);
            if (text) {
                text.split('').forEach((char, i) => {
                    if (otpInputs[i]) otpInputs[i].value = char;
                });
                const focusIndex = Math.min(text.length, otpInputs.length - 1);
                otpInputs[focusIndex].focus();
            }
        });
    });

    function startCooldownTimer() {
        clearInterval(state.timer);
        state.secondsLeft = 60;
        if (timerWrapper) timerWrapper.classList.remove('d-none');
        if (resendBtn) resendBtn.classList.add('d-none');
        if (timerSeconds) timerSeconds.textContent = '60s';

        state.timer = setInterval(() => {
            state.secondsLeft--;
            if (timerSeconds) timerSeconds.textContent = `${state.secondsLeft}s`;
            if (state.secondsLeft <= 0) {
                clearInterval(state.timer);
                if (timerWrapper) timerWrapper.classList.add('d-none');
                if (resendBtn) resendBtn.classList.remove('d-none');
            }
        }, 1000);
    }

    // Step 1: Request OTP
    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value.trim();
            const btn = document.getElementById('btn-request-otp');

            if (!email) {
                window.ui.showToast('Please enter your registered email address', 'error');
                return;
            }

            window.ui.setLoading(btn, true, 'Generating Code...');

            const result = await window.apiClient.post('/api/auth/forgot-password', { email });

            window.ui.setLoading(btn, false, 'Dispatch Security Code');

            if (!result.ok) {
                window.ui.showToast(result.data.message || 'Error generating OTP', 'error');
                return;
            }

            state.email = email;
            if (displayEmailTarget) displayEmailTarget.textContent = email;

            if (result.data.devOtp && devBanner && devCodeDisplay) {
                devBanner.classList.remove('d-none');
                devCodeDisplay.textContent = result.data.devOtp;
                window.ui.showToast(`Development OTP generated: ${result.data.devOtp}`, 'info');
            }

            window.ui.showToast('Verification code dispatched successfully', 'success');
            navigateToStep(2);
            startCooldownTimer();
        });
    }

    // Resend OTP Action
    if (resendBtn) {
        resendBtn.addEventListener('click', async () => {
            window.ui.setLoading(resendBtn, true, 'Sending...');
            const result = await window.apiClient.post('/api/auth/forgot-password', { email: state.email });
            window.ui.setLoading(resendBtn, false, 'Resend Code');

            if (result.ok) {
                if (result.data.devOtp && devBanner && devCodeDisplay) {
                    devBanner.classList.remove('d-none');
                    devCodeDisplay.textContent = result.data.devOtp;
                }
                window.ui.showToast('New verification code dispatched', 'success');
                startCooldownTimer();
            } else {
                window.ui.showToast(result.data.message || 'Error resending code', 'error');
            }
        });
    }

    // Step 2: Verify OTP
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otp = Array.from(otpInputs).map(i => i.value).join('');
            const btn = document.getElementById('btn-verify-otp');

            if (otp.length !== 6) {
                window.ui.showToast('Please provide all 6 digits of the verification code', 'error');
                return;
            }

            window.ui.setLoading(btn, true, 'Validating Code...');

            const result = await window.apiClient.post('/api/auth/verify-otp', {
                email: state.email,
                otp
            });

            window.ui.setLoading(btn, false, 'Verify Code');

            if (!result.ok) {
                window.ui.showToast(result.data.message || 'Invalid or expired code', 'error');
                return;
            }

            state.otp = otp;
            window.ui.showToast('Code validated successfully', 'success');
            navigateToStep(3);
        });
    }

    // Step 3: Set New Password
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('new-password').value;
            const confirmNewPassword = document.getElementById('confirm-new-password').value;
            const btn = document.getElementById('btn-submit-reset');

            if (!newPassword || !confirmNewPassword) {
                window.ui.showToast('Please fill in both password fields', 'error');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                window.ui.showToast('New password confirmation does not match', 'error');
                return;
            }

            if (newPassword.length < 6) {
                window.ui.showToast('Password must contain at least 6 characters', 'error');
                return;
            }

            window.ui.setLoading(btn, true, 'Updating Credentials...');

            const result = await window.apiClient.post('/api/auth/reset-password', {
                email: state.email,
                otp: state.otp,
                newPassword
            });

            window.ui.setLoading(btn, false, 'Update Password');

            if (!result.ok) {
                window.ui.showToast(result.data.message || 'Error updating password', 'error');
                return;
            }

            window.ui.showToast('Password updated successfully. Redirecting to Sign In...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1200);
        });
    }
});
