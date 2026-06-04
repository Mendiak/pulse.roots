const COOKIE_CONSENT_KEY = 'pulseRootsCookieConsent';
const GA_MEASUREMENT_ID = 'G-S86REQ0046';

function getConsent() {
  return localStorage.getItem(COOKIE_CONSENT_KEY);
}

function setConsent(value) {
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
}

function loadGoogleAnalytics() {
  if (window._gaLoaded) return;
  window._gaLoaded = true;

  const s = document.createElement('script');
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  s.async = true;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
}

function showBanner() {
  const banner = document.getElementById('cookie-consent-banner');
  if (banner) banner.classList.add('visible');
}

function hideBanner() {
  const banner = document.getElementById('cookie-consent-banner');
  if (banner) banner.classList.remove('visible');
}

function handleAccept() {
  setConsent('accepted');
  hideBanner();
  loadGoogleAnalytics();
}

function handleReject() {
  setConsent('rejected');
  hideBanner();
}

function init() {
  const consent = getConsent();

  if (consent === 'accepted') {
    loadGoogleAnalytics();
    return;
  }

  if (consent === 'rejected') {
    return;
  }

  showBanner();

  const acceptBtn = document.getElementById('cookie-accept-btn');
  const rejectBtn = document.getElementById('cookie-reject-btn');

  if (acceptBtn) acceptBtn.addEventListener('click', handleAccept);
  if (rejectBtn) rejectBtn.addEventListener('click', handleReject);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
