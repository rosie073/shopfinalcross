import { eventBus, uiState } from "../services/patterns.js";

// UIController: handles responsive nav + lightweight UI interactivity.
const UIController = (() => {
  const NAV_OPEN_CLASS = "nav-open";

  const ensureMobileControls = () => {
    const navbar = document.querySelector(".navbar");
    const nav = navbar?.querySelector("nav");
    if (!navbar || !nav) return;

    if (!navbar.querySelector(".nav-toggle")) {
      const toggle = document.createElement("button");
      toggle.className = "nav-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-label", "Toggle navigation menu");
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = `<span></span><span></span><span></span>`;
      navbar.insertBefore(toggle, nav);
    }

    if (!document.querySelector(".nav-overlay")) {
      const overlay = document.createElement("div");
      overlay.className = "nav-overlay";
      document.body.appendChild(overlay);
    }
  };

  const closeMenu = () => uiState.set("menuOpen", false);

  const bindNav = () => {
    const navbar = document.querySelector(".navbar");
    const nav = navbar?.querySelector("nav");
    const toggle = navbar?.querySelector(".nav-toggle");
    const overlay = document.querySelector(".nav-overlay");

    if (toggle) {
      toggle.addEventListener("click", () => uiState.toggle("menuOpen"));
    }

    overlay?.addEventListener("click", closeMenu);
    nav?.addEventListener("click", (e) => {
      if (e.target.closest("a")) closeMenu();
    });

    // Observe state changes (Observer pattern via event bus)
    eventBus.on("ui:menuOpen", (isOpen) => {
      if (!nav || !toggle) return;
      nav.classList.toggle("is-open", !!isOpen);
      toggle.setAttribute("aria-expanded", !!isOpen);
      document.body.classList.toggle(NAV_OPEN_CLASS, !!isOpen);
      overlay?.classList.toggle("visible", !!isOpen);
    });

    // Collapse menu on resize when moving back to desktop
    window.addEventListener("resize", () => {
      uiState.refreshViewport();
      if (window.innerWidth > 920) closeMenu();
    });
  };

  const bindScroll = () => {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;
    const toggleShadow = () => {
      navbar.classList.toggle("nav-docked", window.scrollY > 8);
    };
    toggleShadow();
    window.addEventListener("scroll", toggleShadow, { passive: true });
  };

  const init = () => {
    ensureMobileControls();
    bindNav();
    bindScroll();
  };

  return { init };
})();

export default UIController;
