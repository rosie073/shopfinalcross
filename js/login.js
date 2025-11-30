// js/login.js
import { AuthService } from "./services/auth.js";

const LoginController = (() => {
  const init = () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginError = document.getElementById("loginError");
    const signupError = document.getElementById("signupError");

    // ----- LOGIN PAGE -----
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (loginError) loginError.textContent = "";

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (!email || !password) {
          if (loginError) loginError.textContent = "Please fill in all fields.";
          return;
        }

        try {
          const result = await AuthService.login(email, password);

          if (result && result.error) {
            if (loginError) loginError.textContent = result.error;
          } else {
            // Redirect to home or previous page
            window.location.href = "/";
          }
        } catch (err) {
          console.error(err);
          if (loginError)
            loginError.textContent = "Something went wrong. Please try again.";
        }
      });
    }

    // ----- REGISTER PAGE -----
    if (signupForm) {
      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (signupError) signupError.textContent = "";

        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;
        const confirmInput = document.getElementById("confirmPassword");
        const confirmPassword = confirmInput ? confirmInput.value : "";

        if (!email || !password || (confirmInput && !confirmPassword)) {
          if (signupError) signupError.textContent = "Please fill in all fields.";
          return;
        }

        if (confirmInput && password !== confirmPassword) {
          if (signupError) signupError.textContent = "Passwords do not match.";
          return;
        }

        try {
          const result = await AuthService.signUp(email, password);

          if (result && result.error) {
            if (signupError) signupError.textContent = result.error;
          } else {
            // Redirect to home after successful sign up
            window.location.href = "/";
          }
        } catch (err) {
          console.error(err);
          if (signupError)
            signupError.textContent = "Something went wrong. Please try again.";
        }
      });
    }
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  LoginController.init();
});
