// js/login.js
import { AuthService } from "./services/auth.js";
import { createFormValidator, eventBus } from "./services/patterns.js";

const LoginController = (() => {
  const toggleSubmit = (form, isValid) => {
    const btn = form?.querySelector("button[type='submit']");
    if (!btn) return;
    btn.disabled = !isValid;
    btn.classList.toggle("is-disabled", !isValid);
  };

  const initValidators = () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginValidator = loginForm
      ? createFormValidator(
          loginForm,
          {
            loginEmail: [
              { type: "required", options: { message: "Email is required." } },
              { type: "email" }
            ],
            loginPassword: [
              { type: "required", options: { message: "Password is required." } },
              { type: "password", options: { min: 6 } }
            ]
          },
          {
            onStateChange: (isValid) => toggleSubmit(loginForm, isValid)
          }
        )
      : null;

    const signupValidator = signupForm
      ? createFormValidator(
          signupForm,
          {
            fullName: [
              { type: "required", options: { message: "Full name is required." } },
              { type: "minLength", options: { min: 3 } }
            ],
            username: [
              { type: "required", options: { message: "Username is required." } },
              { type: "minLength", options: { min: 3 } }
            ],
            signupEmail: [
              { type: "required", options: { message: "Email is required." } },
              { type: "email" }
            ],
            signupPassword: [
              { type: "required" },
              { type: "password", options: { min: 6 } }
            ],
            confirmPassword: [
              { type: "required", options: { message: "Confirm your password." } },
              {
                type: "match",
                options: {
                  getTargetValue: () => document.getElementById("signupPassword")?.value || ""
                }
              }
            ]
          },
          {
            onStateChange: (isValid) => toggleSubmit(signupForm, isValid)
          }
        )
      : null;

    return { loginValidator, signupValidator };
  };

  const init = () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginError = document.getElementById("loginError");
    const signupError = document.getElementById("signupError");
    const { loginValidator, signupValidator } = initValidators();

    // Provide a small observer hook to highlight form state
    eventBus.on("form:validation", ({ formId, valid }) => {
      const form = document.getElementById(formId);
      if (form) form.classList.toggle("is-valid", !!valid);
    });

    // ----- LOGIN PAGE -----
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (loginError) loginError.textContent = "";

        const isValid = loginValidator ? loginValidator.validateAll() : true;
        if (!isValid) {
          if (loginError) loginError.textContent = "Please fix the highlighted fields.";
          return;
        }

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        try {
          const result = await AuthService.login(email, password);

          if (result && result.error) {
            if (loginError) loginError.textContent = result.error;
          } else {
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

        const isValid = signupValidator ? signupValidator.validateAll() : true;
        if (!isValid) {
          if (signupError) signupError.textContent = "Please fix the highlighted fields.";
          return;
        }

        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;

        try {
          const result = await AuthService.signUp(email, password);

          if (result && result.error) {
            if (signupError) signupError.textContent = result.error;
          } else {
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
