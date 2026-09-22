import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { applyAppFont, getStoredAppFont, setAppFontFamily } from './fonts/appFont';
import { getTranslations, type LanguageMode } from './i18n';
import './styles.css';

const bootLoader = document.getElementById('boot-loader');
const bootStatus = document.getElementById('boot-loader-status');
const bootLanguage: LanguageMode =
  localStorage.getItem('codex-switcher-language') === 'en' ? 'en' : 'zh';
const bootText = getTranslations(bootLanguage);
const bootFont = getStoredAppFont();
setAppFontFamily(bootFont);
let appReady = false;
let fontReady = false;

const updateBootStatus = (message: string) => {
  if (bootStatus) bootStatus.textContent = message;
};

const removeBootLoader = () => {
  if (appReady && fontReady) bootLoader?.remove();
};

window.codexAPI?.onStartupStatus(updateBootStatus);
window.addEventListener('codex-switcher:app-ready', () => {
  appReady = true;
  removeBootLoader();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

requestAnimationFrame(() => {
  // The selected webfont contains many split assets. Load only that font after
  // first paint so it cannot delay the startup skeleton.
  updateBootStatus(bootText.loadingFont);
  const loadFont = () => {
    void applyAppFont(bootFont, false)
      .then(() => updateBootStatus(bootText.finishingInit))
      .catch(() => updateBootStatus(bootText.usingSystemFont))
      .finally(() => {
        fontReady = true;
        removeBootLoader();
      });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadFont, { timeout: 1500 });
  } else {
    setTimeout(loadFont, 0);
  }
});
