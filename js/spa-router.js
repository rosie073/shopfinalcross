// Lightweight URL cleaner.
// Removes .html segments from the visible URL and fixes internal links
// so navigation still works while keeping paths tidy.

const originalPathname = window.location.pathname;

const toCleanPath = (pathname) => {
  if (pathname.endsWith("/")) return pathname;
  if (pathname.endsWith("index.html")) return "/";

  // /html/about.html -> /about
  const htmlMatch = pathname.match(/\/html\/(.+)\.html$/);
  if (htmlMatch) return `/${htmlMatch[1]}`;

  // /login.html -> /login
  if (pathname.endsWith(".html")) {
    return pathname.replace(/\.html$/, "");
  }

  return pathname;
};

const applyCleanUrl = () => {
  const cleanPath = toCleanPath(originalPathname);
  const newUrl = cleanPath + window.location.search + window.location.hash;
  if (newUrl !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState({}, "", newUrl);
  }
};

const normalizeInternalLinks = () => {
  const anchors = document.querySelectorAll("a[href]");
  anchors.forEach((anchor) => {
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) return;

    // Resolve relative hrefs using the ORIGINAL path (with /html/...)
    const resolved = new URL(href, window.location.origin + originalPathname);
    // Only touch links that point to our site
    if (resolved.origin !== window.location.origin) return;

    anchor.setAttribute("href", resolved.pathname + resolved.search + resolved.hash);
  });
};

// Clean the current URL immediately
applyCleanUrl();

// Fix links after DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", normalizeInternalLinks);
} else {
  normalizeInternalLinks();
}
