import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { getTranslations, type LanguageMode } from './i18n';
import './styles.css';

const bootLoader = document.getElementById('boot-loader');
const bootStatus = document.getElementById('boot-loader-status');
const bootLanguage: LanguageMode =
  localStorage.getItem('codex-switcher-language') === 'en' ? 'en' : 'zh';
const bootText = getTranslations(bootLanguage);
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
  // Xiaolai contains many font assets. Load it after the first paint so it
  // cannot delay the startup skeleton or the initial application layout.
  updateBootStatus(bootText.loadingFont);
  const loadFont = () => {
    void import('@chinese-fonts/xiaolai/dist/Xiaolai/result.css')
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
