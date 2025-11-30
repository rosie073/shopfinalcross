import { AuthService } from "./services/auth.js";

const LoginController = (() => {

  const init = () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginError = document.getElementById("loginError");
    const signupError = document.getElementById("signupError");

    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        loginError.textContent = "";
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        const result = await AuthService.login(email, password);
        if (result.error) {
          loginError.textContent = result.error;
        } else {
          // Redirect to home or previous page
          window.location.href = "/";
        }
      });
    }

    if (signupForm) {
      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        signupError.textContent = "";
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;

        const result = await AuthService.signUp(email, password);
        if (result.error) {
          signupError.textContent = result.error;
        } else {
          // Redirect to home
          window.location.href = "/";
        }
      });
    }
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  LoginController.init();
});
