document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleBtn');
  const password = document.getElementById('password');
  const form = document.getElementById('loginForm');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');

  // Eye icons SVG
  const eyeOpenSvg = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `;

  const eyeOffSvg = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  `;

  // Toggle password visibility
  if (toggleBtn && password) {
    toggleBtn.addEventListener('click', () => {
      const isPassword = password.type === 'password';
      password.type = isPassword ? 'text' : 'password';
      toggleBtn.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
      toggleBtn.innerHTML = isPassword ? eyeOffSvg : eyeOpenSvg;
    });
  }

  // Form submission & validation
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email');
      const pass = document.getElementById('password');

      if (!email.value.trim() || !pass.value) {
        showError('Não foi possível entrar. Confira seu e-mail e senha.');
        return;
      }

      // Validação de formato de e-mail
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email.value.trim())) {
        showError('Por favor, informe um e-mail válido.');
        return;
      }

      hideError();
      console.log('Login submetido para:', email.value);
      // Aqui pode ser incluída a requisição de autenticação para a API
    });
  }

  function showError(msg) {
    if (errorMessage) errorMessage.textContent = msg;
    if (errorAlert) errorAlert.classList.add('show');
  }

  function hideError() {
    if (errorAlert) errorAlert.classList.remove('show');
  }
});
