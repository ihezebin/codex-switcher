import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

const bootLoader = document.getElementById('boot-loader');
const bootStatus = document.getElementById('boot-loader-status');
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
  updateBootStatus('正在加载界面字体…');
  const loadFont = () => {
    void import('@chinese-fonts/xiaolai/dist/Xiaolai/result.css')
      .then(() => updateBootStatus('正在完成界面初始化…'))
      .catch(() => updateBootStatus('正在使用系统字体完成初始化…'))
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
