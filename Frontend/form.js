document.addEventListener('DOMContentLoaded', () => {

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

  function showError(input, message) {
    let errorEl = input.nextElementSibling;
    if (!errorEl || !errorEl.classList.contains('error-message')) {
      errorEl = document.createElement('div');
      errorEl.className = 'error-message';
      input.parentNode.insertBefore(errorEl, input.nextSibling);
    }
    errorEl.textContent = message;
  }

  function clearError(input) {
    const errorEl = input.nextElementSibling;
    if (errorEl && errorEl.classList.contains('error-message')) errorEl.textContent = '';
  }

  // ===== Password Toggle =====
  const toggleBtns = document.querySelectorAll('.toggle-pass');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const pwInput = btn.closest('.password-wrapper').querySelector('input[type="password"], input[type="text"]');
      if (pwInput) {
        const type = pwInput.type === 'password' ? 'text' : 'password';
        pwInput.type = type;
        btn.innerHTML = type === 'password'
          ? '<i class="ri-eye-line"></i>'
          : '<i class="ri-eye-off-line"></i>';
      }
    });
  });

  // ===== Signup Form =====
  const signupForm = document.querySelector('.signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async e => {
      e.preventDefault();

      const usernameEl = document.getElementById('username');
      const emailEl = document.getElementById('email');
      const passwordEl = document.getElementById('password');

      const username = usernameEl.value.trim();
      const email = emailEl.value.trim();
      const password = passwordEl.value.trim();

      clearError(usernameEl);
      clearError(emailEl);
      clearError(passwordEl);

      let valid = true;
      if (!username) { showError(usernameEl, 'Username required'); valid = false; }
      if (!emailPattern.test(email)) { showError(emailEl, 'Valid email required'); valid = false; }
      if (!passwordPattern.test(password)) { showError(passwordEl, 'Min 6 chars letters+numbers'); valid = false; }
      if (!valid) return;

      try {
        const res = await fetch('https://robo-t52y.onrender.com/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();

        if (res.ok) {
          alert('Registration successful! Please login.');
          window.location.href = 'login.html';
        } else {
          alert(data.error || 'Registration failed');
        }
      } catch (err) {
        console.error(err);
        alert('Server error. Try again later.');
      }
    });
  }

  // ===== Login Form =====
  const loginForm = document.querySelector('.login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();

      const emailEl = document.getElementById('email');
      const passwordEl = document.getElementById('password');

      const email = emailEl.value.trim();
      const password = passwordEl.value.trim();

      clearError(emailEl);
      clearError(passwordEl);

      let valid = true;
      if (!emailPattern.test(email)) { showError(emailEl, 'Valid email required'); valid = false; }
      if (!password) { showError(passwordEl, 'Password required'); valid = false; }
      if (!valid) return;

      try {
        const res = await fetch('https://robo-t52y.onrender.com/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok && data.user) {
          localStorage.setItem('loggedIn', 'true');
          localStorage.setItem('userId', data.user.id);
          localStorage.setItem('username', data.user.username);
          localStorage.setItem('email', data.user.email);

          emailEl.value = '';
          passwordEl.value = '';

          window.location.href = 'index.html';
        } else {
          showError(passwordEl, data.error || 'Invalid email or password');
        }
      } catch (err) {
        console.error(err);
        alert('Server error. Try again later.');
      }
    });
  }

  // ===== Update Profile Form =====
  const profileForm = document.querySelector('.profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async e => {
      e.preventDefault();

      const usernameEl = document.getElementById('username');
      const emailEl = document.getElementById('email');

      const username = usernameEl.value.trim();
      const email = emailEl.value.trim();
      const userId = localStorage.getItem('userId');

      clearError(usernameEl);
      clearError(emailEl);

      let valid = true;
      if (!username) { showError(usernameEl, 'Username required'); valid = false; }
      if (!emailPattern.test(email)) { showError(emailEl, 'Valid email required'); valid = false; }
      if (!valid) return;

      try {
        const res = await fetch('https://robo-t52y.onrender.com/auth/update_profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: userId, username, email })
        });

        const data = await res.json();

        if (res.ok && data.user) {
          alert('Profile updated successfully!');
          localStorage.setItem('username', data.user.username);
          localStorage.setItem('email', data.user.email);
        } else {
          alert(data.error || 'Update failed');
        }
      } catch (err) {
        console.error(err);
        alert('Server error. Try again later.');
      }
    });
  }

});