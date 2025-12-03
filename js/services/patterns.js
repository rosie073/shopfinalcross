// Shared design-pattern utilities (Singleton, Factory, Observer) used across the UI.

// Observer + Singleton: tiny event bus for cross-module communication
class EventBus {
  constructor() {
    if (EventBus.instance) return EventBus.instance;
    this.listeners = {};
    EventBus.instance = this;
  }

  on(event, handler) {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event].add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this.listeners[event]?.delete(handler);
  }

  emit(event, payload) {
    (this.listeners[event] || []).forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        console.error(`EventBus handler error for ${event}:`, err);
      }
    });
  }
}

export const eventBus = new EventBus(); // singleton instance

// Singleton UI state to keep nav + layout state centralized
class UIState {
  constructor() {
    if (UIState.instance) return UIState.instance;
    this.state = {
      menuOpen: false,
      viewport: this.#getViewport()
    };
    UIState.instance = this;
  }

  #getViewport() {
    return window?.innerWidth || 0;
  }

  snapshot() {
    return { ...this.state };
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    eventBus.emit(`ui:${key}`, value);
    eventBus.emit("ui:change", this.snapshot());
  }

  toggle(key) {
    this.set(key, !this.state[key]);
  }

  refreshViewport() {
    this.set("viewport", this.#getViewport());
  }
}

export const uiState = new UIState(); // singleton instance

// Factory: returns validators tailored to the requested rule
export class ValidatorFactory {
  static create(type, options = {}) {
    switch (type) {
      case "required":
        return (value = "") =>
          value && value.toString().trim().length
            ? null
            : options.message || "This field is required.";
      case "email":
        return (value = "") => {
          const email = value.trim().toLowerCase();
          const isGmail = email.endsWith("@gmail.com");
          const matchesPattern = /^[a-z0-9._%+-]+@gmail\.com$/.test(email);
          return isGmail && matchesPattern
            ? null
            : options.message || "Use a @gmail.com address.";
        };
      case "password":
        return (value = "") =>
          value.length >= (options.min || 6)
            ? null
            : options.message || `Password must be at least ${options.min || 6} characters.`;
      case "match":
        return (value = "") => {
          if (typeof options.getTargetValue !== "function") return null;
          return value === options.getTargetValue()
            ? null
            : options.message || "Values do not match.";
        };
      case "phone":
        return (value = "") => {
          const digits = value.replace(/\\D/g, "");
          return digits.length === 11
            ? null
            : options.message || "Enter an 11-digit number.";
        };
      case "minLength":
        return (value = "") =>
          value.trim().length >= (options.min || 3)
            ? null
            : options.message || `Enter at least ${options.min || 3} characters.`;
      default:
        return () => null;
    }
  }
}

// Simple modular form validator that broadcasts results through the observer
export const createFormValidator = (form, rules = {}, { onStateChange } = {}) => {
  if (!form) return null;

  const getFieldKey = (input) => input?.name || input?.id;

  const getErrorNode = (input) => {
    if (!input) return null;

    // Radios live in a shared group container
    if (input.name === "payment") {
      const host = form.querySelector(".payment-options") || input.parentElement;
      if (!host) return null;
      let groupError = host.querySelector(".field-error");
      if (!groupError) {
        groupError = document.createElement("p");
        groupError.className = "field-error";
        host.appendChild(groupError);
      }
      return groupError;
    }

    // For normal fields, place the error directly after the input to avoid sharing nodes
    let sibling = input.nextElementSibling;
    if (!sibling || !sibling.classList?.contains("field-error")) {
      const errorNode = document.createElement("p");
      errorNode.className = "field-error";
      input.insertAdjacentElement("afterend", errorNode);
      return errorNode;
    }
    return sibling;
  };

  const showError = (input, message) => {
    const errorNode = getErrorNode(input);
    input?.classList.add("input-error");
    input?.setAttribute("aria-invalid", "true");
    if (errorNode) errorNode.textContent = message || "";
  };

  const clearError = (input) => {
    const errorNode = getErrorNode(input);
    input?.classList.remove("input-error");
    input?.removeAttribute("aria-invalid");
    if (errorNode) errorNode.textContent = "";
  };

  const validateField = (input) => {
    const key = getFieldKey(input);
    if (!key || !rules[key]) return true;

    const validators = rules[key];
    let value = input.value;

    if ((input.type === "radio" || input.type === "checkbox") && input.name) {
      const checked = form.querySelector(`input[name="${input.name}"]:checked`);
      value = checked ? checked.value : "";
    }

    const message = validators
      .map((rule) => (typeof rule === "function" ? rule : ValidatorFactory.create(rule.type, rule.options))(value))
      .find((result) => result);

    if (message) {
      showError(input, message);
      return false;
    }

    clearError(input);
    return true;
  };

  const validateAll = () => {
    let isValid = true;
    Object.keys(rules).forEach((key) => {
      const field = form.querySelector(`#${key}`) || form.querySelector(`[name="${key}"]`);
      if (field) {
        const ok = validateField(field);
        if (!ok) isValid = false;
      }
    });
    eventBus.emit("form:validation", { formId: form.id, valid: isValid });
    if (typeof onStateChange === "function") onStateChange(isValid);
    return isValid;
  };

  form.addEventListener("input", (e) => {
    validateField(e.target);
    validateAll();
  });
  form.addEventListener("blur", (e) => validateField(e.target), true);

  return { validateAll, validateField };
};
