function resolvePath(obj, key) {
  if (!obj) return undefined;
  const parts = key.split('.');
  let val = obj;
  for (const p of parts) {
    if (val && typeof val === 'object') val = val[p];
    else return undefined;
  }
  return val;
}

export function t(key, replacements = {}) {
  const dict = window.PR_I18N;
  const fallback = window.PR_I18N_FALLBACK;
  let val = resolvePath(dict, key);
  if (typeof val !== 'string') val = resolvePath(fallback, key);
  if (typeof val !== 'string') return key;
  if (Object.keys(replacements).length === 0) return val;
  return val.replace(/\{(\w+)\}/g, (_, k) => replacements[k] != null ? replacements[k] : `{${k}}`);
}

export function applyI18nToDOM(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  root.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  root.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria-label')));
  });
}
