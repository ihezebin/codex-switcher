import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

requestAnimationFrame(() => {
  document.getElementById('boot-loader')?.remove();

  // Xiaolai contains many font assets. Load it after the first paint so it
  // cannot delay the startup skeleton or the initial application layout.
  const loadFont = () => {
    void import('@chinese-fonts/xiaolai/dist/Xiaolai/result.css').catch(() => {
      // System fonts remain available if the optional font chunk cannot load.
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadFont, { timeout: 1500 });
  } else {
    setTimeout(loadFont, 0);
  }
});
