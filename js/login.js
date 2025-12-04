// js/login.js
import { AuthService } from "./services/auth.js";
import { createFormValidator, eventBus } from "./services/patterns.js";

const LoginController = (() => {
  const loginPath = window.location.pathname.includes("/html/") ? "login.html" : "/html/login.html";

  const notify = (title, text = "", icon = "info") => {
    if (window.Swal?.fire) return window.Swal.fire({ title, text, icon });
    if (typeof window.swal === "function") return window.swal(title, text, icon);
    alert(text ? `${title}: ${text}` : title);
  };

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
    const loginInfo = document.getElementById("loginInfo");
    const signupInfo = document.getElementById("signupInfo");
    const { loginValidator, signupValidator } = initValidators();

    // Surface any post-redirect notices (e.g., verification email sent after signup)
    const pendingNotice = sessionStorage.getItem("signupVerificationNotice");
    if (pendingNotice && loginForm) {
      sessionStorage.removeItem("signupVerificationNotice");
      try {
        const { title, text, icon } = JSON.parse(pendingNotice);
        notify(title, text, icon);
      } catch (e) {
        notify("Email verification sent", "Please check your email to confirm your account.", "success");
      }
    }

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
        if (loginInfo) loginInfo.textContent = "";

        const isValid = loginValidator ? loginValidator.validateAll() : true;
        if (!isValid) {
          if (loginError) loginError.textContent = "Please fix the highlighted fields.";
          return;
        }

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const rememberMe = !!document.getElementById("loginRemember")?.checked;

        try {
          const result = await AuthService.login(email, password, { rememberMe });

          if (result && result.error) {
            if (loginError) loginError.textContent = result.error;
            if (result.requiresEmailVerification && loginInfo) {
              loginInfo.textContent = result.verificationEmailSent
                ? "Verification email sent. Please confirm your inbox before logging in."
                : "We couldn't send a verification email right now. Please try again.";
            }
          } else {
            if (loginInfo) loginInfo.textContent = "";
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
        if (signupInfo) signupInfo.textContent = "";

        const isValid = signupValidator ? signupValidator.validateAll() : true;
        if (!isValid) {
          if (signupError) signupError.textContent = "Please fix the highlighted fields.";
          return;
        }

        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;
        const fullName = document.getElementById("fullName")?.value.trim() || "";
        const username = document.getElementById("username")?.value.trim() || "";
        const rememberMe = !!document.getElementById("signupRemember")?.checked;

        try {
          const result = await AuthService.signUp(email, password, {
            fullName,
            username,
            rememberMe
          });

          if (result && result.error) {
            if (signupError) signupError.textContent = result.error;
          } else if (result?.requiresEmailVerification) {
            if (result.verificationEmailSent) {
              sessionStorage.setItem(
                "signupVerificationNotice",
                JSON.stringify({
                  title: "Verification email sent",
                  text: "Please check your email to confirm your account.",
                  icon: "success"
                })
              );
              window.location.href = loginPath;
            } else if (signupInfo) {
              signupInfo.textContent =
                "Registration created, but we couldn't send a verification email. Try logging in to request a new link.";
            }
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
