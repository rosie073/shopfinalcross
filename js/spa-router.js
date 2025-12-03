// SPA-friendly router shim for Firebase Hosting rewrites.
// Firebase rewrites all routes to /index.html. This script maps clean URLs
// (e.g., /shop) to the actual static HTML files (e.g., /html/shop.html) so
// direct links and reloads work without 404s.

const ROUTE_MAP = {
  "": "index.html",
  index: "index.html",
  shop: "html/shop.html",
  product: "html/product.html",
  cart: "html/cart.html",
  checkout: "html/checkout.html",
  login: "html/login.html",
  register: "html/register.html",
  orders: "html/orders.html",
  about: "html/about.html",
  contact: "html/contact.html",
  blog: "html/blog.html",
  admin: "html/admin.html",
  "admin-orders": "html/admin-orders.html"
};

const getPathSegment = () => {
  const trimmed = window.location.pathname.replace(/^\/+|\/+$/g, "");
  // Support nested paths like /product/123 by taking the first segment
  const [first] = trimmed.split("/");
  return first || "";
};

const resolveInitialRoute = () => {
  const currentPath = window.location.pathname;
  const trimmed = currentPath.replace(/^\/+|\/+$/g, "");
  const searchHash = window.location.search + window.location.hash;

  // If the path already points to an HTML file but not under /html/, remap to the correct file in /html/
  if (trimmed.endsWith(".html")) {
    const filename = trimmed.split("/").pop() || "";
    const name = filename.replace(/\.html$/i, "");
    const target = ROUTE_MAP[name];
    if (target && !currentPath.endsWith(target)) {
      window.location.replace(`/${target}${searchHash}`);
    }
    return;
  }

  const segment = getPathSegment();
  const target = ROUTE_MAP[segment];
  if (!target) return;

  // Avoid loops: only redirect if we're not already at the target file
  if (!currentPath.endsWith(target)) {
    window.location.replace(`/${target}${searchHash}`);
  }
};

const normalizeInternalLinks = () => {
  const anchors = document.querySelectorAll("a[href]");
  anchors.forEach((anchor) => {
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) return;

    // Resolve relative links and map to clean paths (e.g., /shop instead of /html/shop.html)
    const resolved = new URL(href, window.location.origin + window.location.pathname);
    const normalizedPath = resolved.pathname.replace(/^\/+|\/+$/g, "");
    const [segment] = normalizedPath.split("/");
    const target = ROUTE_MAP[segment];
    if (target) {
      anchor.setAttribute("href", `/${segment}${resolved.search}${resolved.hash}`);
      return;
    }

    // Fallback: if authoring used html/xyz.html, make it absolute from root
    if (/^(\.\/)?html\//i.test(href) || href.endsWith(".html")) {
      const cleaned = href.replace(/^\.\//, "").replace(/^\/+/, "");
      anchor.setAttribute("href", `/${cleaned}`);
    }
  });
};

resolveInitialRoute();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", normalizeInternalLinks);
} else {
  normalizeInternalLinks();
}
