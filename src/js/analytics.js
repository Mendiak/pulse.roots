/**
 * Thin wrapper around gtag.
 *
 * Google Analytics only loads after cookie consent, so every call must be safe
 * when `gtag` is missing (rejected consent, ad blocker, SSR build) and must not
 * queue events before the visitor has accepted. `BaseLayout` defines the gtag
 * stub, which is why checking the stub alone is not enough.
 */
const CONSENT_KEY = 'pulseRootsCookieConsent';

function hasConsent() {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === 'accepted';
  } catch {
    return false;
  }
}

export function track(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  if (!window._gaLoaded && !hasConsent()) return;
  window.gtag('event', eventName, params);
}
