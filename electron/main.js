const { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, shell, Tray } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const TOML = require('@iarna/toml');

const PROFILE_SUFFIX = '.config.toml';
const PROFILE_ORDER_FILE = '.codex-switcher-profile-order.json';
const REPOSITORY_URL = 'http://github.com/ihezebin/codex-switcher';
let mainWindow = null;
let tray = null;
let isQuitting = false;

function codexHome() {
  return process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
}

function profilePath(name) {
  return path.join(codexHome(), `${name}${PROFILE_SUFFIX}`);
}

function configPath() {
  return path.join(codexHome(), 'config.toml');
}

function validateProfileName(name) {
  if (!name || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(name)) {
    throw new Error('配置名称只能包含字母、数字、点、短横线和下划线，且不能以符号开头。');
  }
  if (name === 'config') {
    throw new Error('config 是 Codex 主配置文件名，不能作为 profile 名称。');
  }
}

async function ensureCodexHome() {
  const home = codexHome();
  await fs.mkdir(home, { recursive: true, mode: 0o700 });
  await fs.access(home, fs.constants.R_OK | fs.constants.W_OK);
  return home;
}

async function readTomlFile(file, fallback = {}) {
  try {
    const source = await fs.readFile(file, 'utf8');
    return { value: TOML.parse(source), source };
  } catch (error) {
    if (error.code === 'ENOENT') return { value: fallback, source: '' };
    if (error.code === 'EACCES') throw new Error(`没有权限读取 ${file}`);
    throw new Error(`${path.basename(file)} 不是有效的 TOML：${error.message}`);
  }
}

async function atomicWrite(file, content) {
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temporary, content, { encoding: 'utf8', mode: 0o600 });
  await fs.rename(temporary, file);
}

async function readProfileOrder(home) {
  try {
    const source = await fs.readFile(path.join(home, PROFILE_ORDER_FILE), 'utf8');
    const value = JSON.parse(source);
    return Array.isArray(value) ? value.filter((name) => typeof name === 'string') : [];
  } catch (_) {
    return [];
  }
}

async function writeProfileOrder(home, order) {
  try {
    await atomicWrite(path.join(home, PROFILE_ORDER_FILE), `${JSON.stringify(order, null, 2)}\n`);
  } catch (_) {
    // Profile listing should still work if the optional order file cannot be written.
  }
}

async function orderedProfileEntries(home, entries) {
  const details = await Promise.all(entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(PROFILE_SUFFIX))
    .map(async (entry) => {
      const file = path.join(home, entry.name);
      const stat = await fs.stat(file);
      return {
        entry,
        name: entry.name.slice(0, -PROFILE_SUFFIX.length),
        createdAt: stat.birthtimeMs || stat.ctimeMs || 0,
      };
    }));
  const previousOrder = await readProfileOrder(home);
  const available = new Set(details.map((item) => item.name));
  const nextOrder = previousOrder.filter((name, index, order) => available.has(name) && order.indexOf(name) === index);
  const fallback = [...details].sort((a, b) => a.createdAt - b.createdAt || a.name.localeCompare(b.name));
  for (const item of fallback) {
    if (!nextOrder.includes(item.name)) nextOrder.push(item.name);
  }
  if (JSON.stringify(previousOrder) !== JSON.stringify(nextOrder)) await writeProfileOrder(home, nextOrder);
  const position = new Map(nextOrder.map((name, index) => [name, index]));
  return details.sort((a, b) => position.get(a.name) - position.get(b.name));
}

function serialize(value) {
  return `${TOML.stringify(value).trimEnd()}\n`;
}

function profileFromToml(name, value, source = '') {
  const providerId = typeof value.model_provider === 'string' ? value.model_provider : '';
  const providers = value.model_providers && typeof value.model_providers === 'object'
    ? value.model_providers : {};
  const provider = providerId && providers[providerId] && typeof providers[providerId] === 'object'
    ? providers[providerId] : {};
  return {
    name,
    model: typeof value.model === 'string' ? value.model : '',
    reviewModel: typeof value.review_model === 'string' ? value.review_model : '',
    baseUrl: typeof provider.base_url === 'string' ? provider.base_url : '',
    apiKey: typeof provider.experimental_bearer_token === 'string' ? provider.experimental_bearer_token : '',
    providerId,
    source,
    custom: !providerId || !value.model || !provider.base_url,
  };
}

async function listProfiles() {
  const home = await ensureCodexHome();
  const entries = await fs.readdir(home, { withFileTypes: true });
  const files = await orderedProfileEntries(home, entries);
  const profiles = [];
  for (const item of files) {
    const { entry, name } = item;
    try {
      const { value, source } = await readTomlFile(path.join(home, entry.name));
      profiles.push(profileFromToml(name, value, source));
    } catch (error) {
      profiles.push({ name, model: '', reviewModel: '', baseUrl: '', apiKey: '', providerId: '', source: '', custom: true, error: error.message });
    }
  }

  let active;
  try {
    const { value } = await readTomlFile(configPath());
    const modelProvider = value.model_provider;
    const model = value.model;
    active = profiles.find((profile) => profile.providerId === modelProvider && profile.model === model)?.name;
  } catch (_) {
    // A broken base config is shown only when the user tries to apply a profile.
  }
  return { codexHome: home, profiles: profiles.map((profile) => ({ ...profile, active: profile.name === active })) };
}

async function readProfile(name) {
  validateProfileName(name);
  try {
    const { value, source } = await readTomlFile(profilePath(name));
    return profileFromToml(name, value, source);
  } catch (error) {
    if (error.code === 'ENOENT') throw error;
    return { name, model: '', reviewModel: '', baseUrl: '', apiKey: '', providerId: '', source: '', custom: true, error: error.message };
  }
}

function formToml(name, model, reviewModel, baseUrl, apiKey) {
  const providerId = name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'provider';
  return {
    model: model || '',
    review_model: reviewModel || '',
    model_provider: providerId,
    model_providers: {
      [providerId]: {
        name,
        base_url: baseUrl,
        wire_api: 'responses',
        requires_openai_auth: false,
        experimental_bearer_token: apiKey,
      },
    },
  };
}

async function saveProfile({ name, model, reviewModel, baseUrl, apiKey, content }) {
  validateProfileName(name);
  const next = content !== undefined
    ? content
    : serialize(formToml(name, (model || '').trim(), (reviewModel || '').trim(), (baseUrl || '').trim(), apiKey || ''));
  try {
    TOML.parse(next);
  } catch (error) {
    throw new Error(`无法保存：TOML 格式有误，${error.message}`);
  }
  await ensureCodexHome();
  await atomicWrite(profilePath(name), next.endsWith('\n') ? next : `${next}\n`);
  return readProfile(name);
}

async function createProfile(payload) {
  validateProfileName(payload.name);
  const existing = await listProfiles();
  if (existing.profiles.some((profile) => profile.name.toLowerCase() === payload.name.toLowerCase())) {
    throw new Error(`配置「${payload.name}」已经存在，请换一个名称。`);
  }
  try {
    await fs.access(profilePath(payload.name));
    throw new Error(`配置「${payload.name}」已经存在，请换一个名称。`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return saveProfile(payload);
}

function mergeProfileIntoConfig(base, profile) {
  const next = { ...base };
  // These assignments replace object keys before serializing, so duplicate TOML keys cannot be emitted.
  if (profile.model !== undefined) next.model = profile.model;
  if (profile.review_model !== undefined) next.review_model = profile.review_model;
  if (profile.model_provider !== undefined) next.model_provider = profile.model_provider;
  if (profile.model_providers !== undefined) {
    next.model_providers = { ...(base.model_providers || {}), ...profile.model_providers };
  }
  return next;
}

async function applyProfile(name) {
  validateProfileName(name);
  const profileFile = await readTomlFile(profilePath(name));
  const currentConfig = await readTomlFile(configPath());
  const merged = mergeProfileIntoConfig(currentConfig.value, profileFile.value);
  await atomicWrite(configPath(), serialize(merged));
  return listProfiles();
}

function createLogoImage(size = 512) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#1677ff"/>
      <path d="M8 7 4.5 12 8 17M16 7l3.5 5-3.5 5M13.5 5.5l-3 13" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  return nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
}

function createTrayIcon() {
  return createLogoImage(22);
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow().catch((error) => dialog.showErrorBox('无法打开窗口', error.message));
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

async function switchFromTray(name) {
  try {
    const state = await applyProfile(name);
    await refreshTrayMenu(state);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('codex:state-changed', state);
    showMainWindow();
  } catch (error) {
    dialog.showErrorBox('应用配置失败', error.message);
  }
}

async function refreshTrayMenu(state) {
  if (!tray) return state || listProfiles();
  const current = state || await listProfiles();
  const profileItems = current.profiles.length
    ? current.profiles.map((profile) => ({
      label: profile.name,
      type: 'radio',
      checked: Boolean(profile.active),
      click: () => switchFromTray(profile.name),
    }))
    : [{ label: '暂无配置，请先创建 profile', enabled: false }];
  const menu = Menu.buildFromTemplate([
    { label: '打开 Codex Switcher', click: showMainWindow },
    { type: 'separator' },
    { label: '配置列表', enabled: false },
    ...profileItems,
    { type: 'separator' },
    { label: '重新加载配置', click: () => refreshTrayMenu() },
    { label: '退出', click: () => { isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(menu);
  tray.setToolTip(current.profiles.find((profile) => profile.active)?.name || 'Codex Switcher');
  return current;
}

async function createTray() {
  tray = new Tray(createTrayIcon());
  tray.on('click', () => {
    if (process.platform === 'darwin') tray.popUpContextMenu();
    else showMainWindow();
  });
  tray.on('double-click', showMainWindow);
  await refreshTrayMenu();
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 960,
    minHeight: 640,
    resizable: true,
    maximizable: true,
    fullscreenable: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 18 },
    icon: createLogoImage(),
    backgroundColor: '#10131a',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  if (!app.isPackaged) await window.loadURL(devUrl);
  else await window.loadFile(path.join(__dirname, '../../dist/index.html'));
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = null;
  });
  window.on('close', (event) => {
    if (process.platform === 'darwin' && !isQuitting) {
      event.preventDefault();
      window.hide();
    }
  });
  mainWindow = window;
  return window;
}

ipcMain.handle('codex:state', () => listProfiles());
ipcMain.handle('codex:profile', (_, name) => readProfile(name));
ipcMain.handle('codex:save-profile', async (_, payload) => {
  const saved = await saveProfile(payload);
  await refreshTrayMenu();
  return saved;
});
ipcMain.handle('codex:create-profile', async (_, payload) => {
  const saved = await createProfile(payload);
  await refreshTrayMenu();
  return saved;
});
ipcMain.handle('codex:apply-profile', async (_, name) => {
  const state = await applyProfile(name);
  await refreshTrayMenu(state);
  return state;
});
ipcMain.handle('codex:open-folder', async () => {
  await ensureCodexHome();
  return shell.openPath(codexHome());
});
ipcMain.handle('codex:open-external', async (_, url) => {
  if (url !== REPOSITORY_URL) throw new Error('不允许打开该外部地址');
  return shell.openExternal(url);
});

app.whenReady().then(async () => {
  try {
    await ensureCodexHome();
    if (process.platform === 'darwin' && app.dock) app.dock.setIcon(createLogoImage());
    await createTray();
    await createWindow();
  } catch (error) {
    await dialog.showMessageBox({ type: 'error', title: '无法访问 Codex 配置目录', message: error.message, detail: `目录：${codexHome()}` });
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('activate', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) await createWindow();
  else showMainWindow();
});
