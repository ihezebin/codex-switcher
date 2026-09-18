const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  shell,
  Tray,
} = require("electron");
const fs = require("node:fs/promises");
const { createWriteStream } = require("node:fs");
const { pipeline } = require("node:stream/promises");
const path = require("node:path");
const os = require("node:os");
const TOML = require("@iarna/toml");

const PROFILE_SUFFIX = ".config.toml";
const PROFILE_ORDER_FILE = ".codex-switcher-profile-order.json";
const REPOSITORY_URL = "http://github.com/ihezebin/codex-switcher";
const SUPPORT_URL = "https://ncm.hezebin.com";
const UPDATE_MANIFEST_URL =
  "https://raw.githubusercontent.com/ihezebin/codex-switcher/main/package.json";
const TRAY_GUID = "6c4d8f7a-2b9e-4d3a-9f1c-8a7e5b2d6c40";
const TRAY_ICON_PNG_1X =
  "iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAABmJLR0QA/wD/AP+gvaeTAAABSklEQVQ4jZXUv0pcURAG8N+udhapghjRViNYWEqardZ/+AC+g92+geQhsmKhjVj4BCEpFGzFdBFRWAuLQFCsLNRNcWfl7PHe3c3AgTMz33z3zpzznZp+q+EzpmJfZl3c4Xfs39kGbiI5yrrGehnJy3+Q9NYz1tJ2rocUnOO4InfVG8NCSfICvxJ/CysRuyjBz9fxMWvzD5rYT2JnWI5YMzCpTUIjY9/ENP6G3wnwDzxgFqt4TWoaOdE31PEziR1iDI/hn4bfriLqYAKt7A+3sZTFWoHt9IjqhtsZvoyA62utnbX2GG0cJZiTwOwOmlE+7O/xsdvI3asY9rj3etnDIr7iQxTORG4HTzjQr8UuhUirLuSK4jL24pUXksESOVbIY5B83iRCoeLnIQVVol3NRmMt2EcluUpJ8serhjl8Uhxxmb0qHrZLyUH9AzdfvpBi4lcvAAAAAElFTkSuQmCC";
const TRAY_ICON_PNG_2X =
  "iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAABmJLR0QA/wD/AP+gvaeTAAACzUlEQVRYhc2YS2tTQRTHf/aBCrZGt5KtgoKvKsVGi9UPoDs1ih+gCCpdWuGCWl3oSty7sesKbqXgC1yIFOymuyQtiNAaK8EUU+ti5vYeL/O6uTF6YMiE8z9n/jNzzpyZC/+ZbPHo+4ESsBfYlXOsr8AC8AZoZTUuAPeBFWCjw20FmAJ2hpI5DFT+ApF0WwKO+8gcAxpdIBO3BjBkI1MAFrtIJm41YNBE6EEHnK+3ucJ302T6yR/ALWAY6ANmMtouazt6NKES+dN6Dnivib3OaLsbGJGE9gUY1YHzun036N+J/pDGxPh6gP8/OEziX9aywD836C8KfUVjYikH+J+UhCIPeFpgi8CqAVMU+g2NKQq7ac8YESRb5pIl4Jru9wBPgYEUpoJKX4CT+ncAeAb06v/jQNU3mI/QL+AqKgMBJoAzBtxb0S+J/ingpu7XgSvap1cizMv4UGAOAD8suHGB+5jSNYFDQv/I4iPyEfoEbNP6rai0tu1/POAO4KdBPw9s9/iKwL5la8BlPTtQlf+gBbuqyQOcQB9wKdlPchqvobKuacBZCT1GzQJUzFy34EAdhuu6P+LA3SCJv3k9RjChLGIL6FwS0V4gbgBnNaYX+ObA+RIkchEKDcQWyZl0xEEmJEEicG9ZSCDOkdQ123ZlSRBvDKUD8XZKHxI/t0gSZBR3gmxKhH25F1HXA1ATeCl0F4SPqsH2FcmkC7jv6lEoIVdxTRdU2XIVV9876RLJ9aMGzOoViQuqabtmhb6sfbikBcmp+sUDBniCui8DjAEvhM5EaAw4J2x98ln+OY17OU1tQth/aMM+3UYloT6yX/JntN0warnzkNm85EuZasNRA1XH8q7OnTQZUG/tWgecZ21VLA9FUK+Fbj+lj9rISFLdWKlqCJlYBoF7qGDrNJFlVI00bpPvg1UfyQerPSQVO6s0Ua+XBVT9y/zB6p/Jb15rdL2SwLbDAAAAAElFTkSuQmCC";
const WINDOWS_TRAY_ICON_PNG_1X =
  "iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAACcUExURRZ3/xZ3/xZ3/xZ3/xZ3/xZ3/xZ3/xZ3/xR2/xN2/02X/2Wl/xV2/xN1/0uW/0qV/xd4/67P/7rW/06Y/zqM/93r/5K//yaB/9Xn/4y8/4++/x98/7HR/9fo/zWJ/xJ0/0OR/+rz/1yg/zKH/3mx/+71/1+i/xJ1/22q/+bw/ziL/xF0/0CP/+bx/5jD/57G/8ng/yB9/9Xm/63P/////6ON9jEAAAAGdFJOUwAck+j+sxvlnEUAAAABYktHRDM31XxeAAAAB3RJTUUH6gkREyEFfCs8igAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNi0wOS0xN1QxOTozMTozMyswMDowMAmsaUYAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjYtMDktMTdUMTk6MzE6MzMrMDA6MDB48dH6AAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDI2LTA5LTE3VDE5OjMzOjA1KzAwOjAwxk4SwQAAAL1JREFUGNNtkOkOgjAQhHtAK2yhKuDFoRwqCgj6/g+nbcGE6P7ZzSQzmW8RwoRabByLEowQttlsbIzIdHNuNkFUrQVn3HFBqJsilQOeD3K5Wnug8pCyBGEkNtvdPgyU+SPBIU7S7HjKiyQ+gJHK6iwu1/p2P1ellnjTdpLBox9Adm3DJwmG/gFskrTxfquvFzEZdXyRn45Z+o1XJfa750ZEYwlTdb16SfDHqhpIgOt8mBYGiMyhFfaf5/y+8A2DGRFV0icRWQAAAABJRU5ErkJggg==";
const WINDOWS_TRAY_ICON_PNG_2X =
  "iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAD/UExURQAAABZ3/xZ3/xZ3/xZ3/xZ3/xZ3/xZ3/xZ3/xZ3/xZ3/xZ3/xZ3/xZ3/xV2/xR2/xV3/yaB/zWJ/xl5/yaA/7fV/+bw/2am/xt6/xN1/0+Z//f6/////5XB/zKH/67Q/63P/zGG/xJ1/3uy//7+/2uo/y2E/xx7/6XK/2Gj/xd4/6rN/+/2/z+P/16h/6XL/2+r//n7/9Tm/zOI/9Ll/yWA/0CQ/+Dt//L4/0OR/yJ+/7bU/5PA/xh4/2yp/7bV/4G1//3+/8be/yqD/5rE//X5/06Y/+rz/yB9/93r/y6F/yuD/ziL/+fx/7jW/7nW/12h//r8/4u7/1CZ/zCG/48xi1MAAAANdFJOUwAAEF205/zoObb3T+LXRruqAAAAAWJLR0QcnARBBwAAAAd0SU1FB+oJERMhBXwrPIoAAAAldEVYdGF0ZTpjcmVhdGUAMjAyNi0wOS0xN1QxOTozMTozMyswMDowMAJrGlGAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDI2LTA5LTE3VDE5OjMzKzAwOjAwePHR+gAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyNi0wOS0xN1QxOTozMzowNSswMDowMMZOEsEAAAHCSURBVDjLjZTpVsIwEIVToApikoKgBK+IVREBEdzABUQWFRRU9P2fxYSlpYvI/Omc9MtkztyZIUTTtEAwpK9Rj62th4IB+ZsoJhzZoH/YRiSsKE2LbtIlthlVUHgpI6mwRgIR+o9FAiTozYdxZ15BEvIwRiy+5TgIEd0TJ5Hc3nHE0oldH5ZKMfkR6V3siak/qxexXJ7Zzx7ICOYhjo5z2f2MHc2CjJM8cGpSWiiidFYGzk8MD8QrVVxccspiV7i6zlygWuFuSNzUUC8L6dyWUCyIch21G+GEHnN098NCQntk8wqFJGw/A4x1zQEbrCe2Ois+66KUF5Z02nlrGIiSeX/DyrKIbr230B3zxaAaxN+safx9ilLKCvzELEi3gY5qA+fmFsZim+QG0hB8kxvj6NP2ghedSIwzfud9zdpZ80Ef71aA+idslEN89dNVtnxJYxVTqNlVKqpj3rmLOZVHq3ipx/GSZCZy5lurGGOWXvgJPW6V8ptSV1ToF8j6tMmm63PFEXcp/nE3naF+xh920sFt53r6OQeA728kEoy7TXSO1FY8ZbkaOlGs4uSeOGs6VxnylhbHa6llliS1bh/psHf4C9HdnFviHuEkAAAAASUVORK5CYII=";
let mainWindow = null;
let tray = null;
let isQuitting = false;
let latestUpdateInfo = null;
let downloadedUpdatePath = "";
let mainLanguage = "zh";

const mainTranslations = {
  zh: {
    invalidProfileName:
      "配置名称只能包含字母、数字、点、短横线和下划线，且不能以符号开头。",
    reservedConfigName: "config 是 Codex 主配置文件名，不能作为 profile 名称。",
    noReadPermission: (file) => `没有权限读取 ${file}`,
    invalidToml: (file, message) =>
      `${path.basename(file)} 不是有效的 TOML：${message}`,
    baseUrlRequired: "Base URL 不能为空",
    checkUpdateFailed: (status) => `检查更新失败：HTTP ${status}`,
    alreadyLatest: "当前已经是最新版本",
    missingDownloadUrl: (platform) => `没有找到 ${platform} 平台的下载地址`,
    downloadFailed: (status) => `下载失败：HTTP ${status}`,
    downloadNetworkFailed: (message) => `下载网络连接失败：${message}`,
    loadModelsFailed: (status) => `模型列表加载失败：HTTP ${status}`,
    connectionFailed: (status) => `连接测试失败：HTTP ${status}`,
    invalidTomlSave: (message) => `无法保存：TOML 格式有误，${message}`,
    duplicateProfile: (name) => `配置「${name}」已经存在，请换一个名称。`,
    profileNotFound: (name) => `配置「${name}」不存在。`,
    cannotOpenWindow: "无法打开窗口",
    applyConfigFailed: "应用配置失败",
    noProfiles: "暂无配置，请先创建 profile",
    openApp: "打开 Codex Switcher",
    profileList: "配置列表",
    reloadProfiles: "重新加载配置",
    quit: "退出",
    installerNotDownloaded: "安装包尚未下载完成",
    externalUrlDenied: "不允许打开该外部地址",
    deleteProfileFailed: (file) => `配置文件删除失败：${file}`,
    startupInitConfig: "正在初始化 Codex 配置目录…",
    startupCreateTray: "正在创建系统托盘菜单…",
    startupWaitConfig: "正在等待配置加载完成…",
    codexHomeInaccessible: "无法访问 Codex 配置目录",
    directory: (home) => `目录：${home}`,
  },
  en: {
    invalidProfileName:
      "Profile names can contain letters, numbers, dots, hyphens, and underscores, and cannot start with a symbol.",
    reservedConfigName:
      "config is the main Codex config file name and cannot be used as a profile name.",
    noReadPermission: (file) => `No permission to read ${file}`,
    invalidToml: (file, message) =>
      `${path.basename(file)} is not valid TOML: ${message}`,
    baseUrlRequired: "Base URL cannot be empty",
    checkUpdateFailed: (status) => `Update check failed: HTTP ${status}`,
    alreadyLatest: "You are already on the latest version",
    missingDownloadUrl: (platform) =>
      `No download URL was found for ${platform}`,
    downloadFailed: (status) => `Download failed: HTTP ${status}`,
    downloadNetworkFailed: (message) =>
      `Download network connection failed: ${message}`,
    loadModelsFailed: (status) => `Model list load failed: HTTP ${status}`,
    connectionFailed: (status) => `Connection test failed: HTTP ${status}`,
    invalidTomlSave: (message) => `Cannot save: TOML is invalid, ${message}`,
    duplicateProfile: (name) =>
      `Profile "${name}" already exists. Choose another name.`,
    profileNotFound: (name) => `Profile "${name}" does not exist.`,
    cannotOpenWindow: "Cannot Open Window",
    applyConfigFailed: "Apply Config Failed",
    noProfiles: "No profiles yet. Create a profile first.",
    openApp: "Open Codex Switcher",
    profileList: "Profiles",
    reloadProfiles: "Reload Profiles",
    quit: "Quit",
    installerNotDownloaded: "The installer has not finished downloading",
    externalUrlDenied: "This external URL is not allowed",
    deleteProfileFailed: (file) => `Failed to delete profile file: ${file}`,
    startupInitConfig: "Initializing Codex config folder...",
    startupCreateTray: "Creating system tray menu...",
    startupWaitConfig: "Waiting for config loading to finish...",
    codexHomeInaccessible: "Cannot Access Codex Config Folder",
    directory: (home) => `Directory: ${home}`,
  },
};

function t(key, ...args) {
  const value = mainTranslations[mainLanguage][key];
  return typeof value === "function" ? value(...args) : value;
}

app.setName("Codex Switcher");

function codexHome() {
  return process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
}

function profilePath(name) {
  return path.join(codexHome(), `${name}${PROFILE_SUFFIX}`);
}

function configPath() {
  return path.join(codexHome(), "config.toml");
}

function validateProfileName(name) {
  if (!name || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(name)) {
    throw new Error(t("invalidProfileName"));
  }
  if (name === "config") {
    throw new Error(t("reservedConfigName"));
  }
}

async function ensureCodexHome() {
  const home = codexHome();
  await fs.mkdir(home, { recursive: true, mode: 0o700 });
  await fs.access(home, fs.constants.R_OK | fs.constants.W_OK);
  return home;
}

async function hasFile(file) {
  try {
    await fs.access(file, fs.constants.F_OK);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function readTomlFile(file, fallback = {}) {
  try {
    const source = await fs.readFile(file, "utf8");
    return { value: TOML.parse(source), source };
  } catch (error) {
    if (error.code === "ENOENT") return { value: fallback, source: "" };
    if (error.code === "EACCES") throw new Error(t("noReadPermission", file));
    throw new Error(t("invalidToml", file, error.message));
  }
}

async function atomicWrite(file, content) {
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temporary, content, { encoding: "utf8", mode: 0o600 });
  try {
    await fs.rename(temporary, file);
  } catch (error) {
    // Windows cannot always rename over an existing file. Copying the fully
    // written temporary file keeps profile/config writes reliable there too.
    if (
      process.platform !== "win32" ||
      !["EEXIST", "EPERM", "ENOTEMPTY"].includes(error.code)
    ) {
      throw error;
    }
    await fs.copyFile(temporary, file);
    await fs.unlink(temporary);
  }
}

async function readProfileOrder(home) {
  try {
    const source = await fs.readFile(
      path.join(home, PROFILE_ORDER_FILE),
      "utf8",
    );
    const value = JSON.parse(source);
    return Array.isArray(value)
      ? value.filter((name) => typeof name === "string")
      : [];
  } catch (_) {
    return [];
  }
}

async function writeProfileOrder(home, order) {
  try {
    await atomicWrite(
      path.join(home, PROFILE_ORDER_FILE),
      `${JSON.stringify(order, null, 2)}\n`,
    );
  } catch (_) {
    // Profile listing should still work if the optional order file cannot be written.
  }
}

async function orderedProfileEntries(home, entries) {
  const details = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(PROFILE_SUFFIX))
      .map(async (entry) => {
        const file = path.join(home, entry.name);
        const stat = await fs.stat(file);
        return {
          entry,
          name: entry.name.slice(0, -PROFILE_SUFFIX.length),
          createdAt: stat.birthtimeMs || stat.ctimeMs || 0,
        };
      }),
  );
  const previousOrder = await readProfileOrder(home);
  const available = new Set(details.map((item) => item.name));
  const nextOrder = previousOrder.filter(
    (name, index, order) =>
      available.has(name) && order.indexOf(name) === index,
  );
  const fallback = [...details].sort(
    (a, b) => a.createdAt - b.createdAt || a.name.localeCompare(b.name),
  );
  for (const item of fallback) {
    if (!nextOrder.includes(item.name)) nextOrder.push(item.name);
  }
  if (JSON.stringify(previousOrder) !== JSON.stringify(nextOrder))
    await writeProfileOrder(home, nextOrder);
  const position = new Map(nextOrder.map((name, index) => [name, index]));
  return details.sort((a, b) => position.get(a.name) - position.get(b.name));
}

function serialize(value) {
  return `${TOML.stringify(value).trimEnd()}\n`;
}

function profileFromToml(name, value, source = "") {
  const providerId =
    typeof value.model_provider === "string" ? value.model_provider : "";
  const providers =
    value.model_providers && typeof value.model_providers === "object"
      ? value.model_providers
      : {};
  const provider =
    providerId &&
    providers[providerId] &&
    typeof providers[providerId] === "object"
      ? providers[providerId]
      : {};
  return {
    name,
    model: typeof value.model === "string" ? value.model : "",
    reviewModel:
      typeof value.review_model === "string" ? value.review_model : "",
    baseUrl: typeof provider.base_url === "string" ? provider.base_url : "",
    apiKey:
      typeof provider.experimental_bearer_token === "string"
        ? provider.experimental_bearer_token
        : "",
    providerId,
    source,
    custom: !providerId || !value.model || !provider.base_url,
  };
}

async function listProfiles() {
  const home = await ensureCodexHome();
  const hasCodexConfig = await hasFile(configPath());
  const entries = await fs.readdir(home, { withFileTypes: true });
  const files = await orderedProfileEntries(home, entries);
  const profiles = [];
  for (const item of files) {
    const { entry, name } = item;
    try {
      const { value, source } = await readTomlFile(path.join(home, entry.name));
      profiles.push(profileFromToml(name, value, source));
    } catch (error) {
      profiles.push({
        name,
        model: "",
        reviewModel: "",
        baseUrl: "",
        apiKey: "",
        providerId: "",
        source: "",
        custom: true,
        error: error.message,
      });
    }
  }

  let active;
  try {
    const { value } = await readTomlFile(configPath());
    const modelProvider = value.model_provider;
    const model = value.model;
    active = profiles.find(
      (profile) =>
        profile.providerId === modelProvider && profile.model === model,
    )?.name;
  } catch (_) {
    // A broken base config is shown only when the user tries to apply a profile.
  }
  return {
    codexHome: home,
    hasCodexConfig,
    profiles: profiles.map((profile) => ({
      ...profile,
      active: profile.name === active,
    })),
  };
}

async function readProfile(name) {
  validateProfileName(name);
  try {
    const { value, source } = await readTomlFile(profilePath(name));
    return profileFromToml(name, value, source);
  } catch (error) {
    if (error.code === "ENOENT") throw error;
    return {
      name,
      model: "",
      reviewModel: "",
      baseUrl: "",
      apiKey: "",
      providerId: "",
      source: "",
      custom: true,
      error: error.message,
    };
  }
}

function formToml(name, model, reviewModel, baseUrl, apiKey) {
  const providerId =
    name
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "provider";
  return {
    model: model || "",
    review_model: reviewModel || "",
    model_provider: providerId,
    model_providers: {
      [providerId]: {
        name,
        base_url: baseUrl,
        wire_api: "responses",
        requires_openai_auth: false,
        experimental_bearer_token: apiKey,
      },
    },
  };
}

function normalizeBaseUrl(baseUrl) {
  const trimmed = String(baseUrl || "").trim();
  if (!trimmed) throw new Error(t("baseUrlRequired"));
  return trimmed.replace(/\/+$/, "");
}

function endpointUrl(baseUrl, endpoint) {
  const suffix = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${normalizeBaseUrl(baseUrl)}${suffix}`;
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_) {
    return { raw: text };
  }
}

function responseErrorMessage(body, fallback) {
  if (body && typeof body === "object") {
    const error = body.error;
    if (typeof error === "string") return error;
    if (error && typeof error.message === "string") return error.message;
    if (typeof body.message === "string") return body.message;
    if (typeof body.err_msg === "string") return body.err_msg;
    if (typeof body.raw === "string") return body.raw.slice(0, 300);
  }
  return fallback;
}

function parseVersion(version) {
  return String(version || "")
    .replace(/^v/i, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
}

function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (a[index] || 0) - (b[index] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

function updatePlatformKey() {
  return `${process.platform}-${process.arch}`;
}

function normalizeUpdateInfo(manifest) {
  const version = typeof manifest.version === "string" ? manifest.version : "";
  const updateConfig =
    manifest.codexSwitcherUpdate &&
    typeof manifest.codexSwitcherUpdate === "object"
      ? manifest.codexSwitcherUpdate
      : {};
  const downloads =
    updateConfig.downloads && typeof updateConfig.downloads === "object"
      ? updateConfig.downloads
      : manifest.downloads && typeof manifest.downloads === "object"
        ? manifest.downloads
        : {};
  const notes =
    typeof updateConfig.notes === "string"
      ? updateConfig.notes
      : typeof manifest.notes === "string"
        ? manifest.notes
        : "";
  const releaseUrl =
    typeof updateConfig.releaseUrl === "string"
      ? updateConfig.releaseUrl
      : typeof manifest.releaseUrl === "string"
        ? manifest.releaseUrl
        : "";
  const minimumVersion =
    typeof updateConfig.minimumVersion === "string"
      ? updateConfig.minimumVersion
      : typeof manifest.minimumVersion === "string"
        ? manifest.minimumVersion
        : "";
  const platformKey = updatePlatformKey();
  const downloadUrl =
    typeof downloads[platformKey] === "string" ? downloads[platformKey] : "";
  const currentVersion = app.getVersion();
  return {
    currentVersion,
    latestVersion: version,
    hasUpdate:
      Boolean(version) &&
      compareVersions(version, currentVersion) > 0,
    platformKey,
    downloadUrl,
    notes,
    releaseUrl,
    minimumVersion,
    manifestUrl: UPDATE_MANIFEST_URL,
    downloadedPath: downloadedUpdatePath,
  };
}

async function checkForUpdates() {
  const response = await fetch(UPDATE_MANIFEST_URL, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const body = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(
      responseErrorMessage(body, t("checkUpdateFailed", response.status)),
    );
  }
  latestUpdateInfo = normalizeUpdateInfo(body);
  return latestUpdateInfo;
}

function updateFileName(updateInfo) {
  try {
    const url = new URL(updateInfo.downloadUrl);
    const basename = path.basename(url.pathname);
    if (basename) return decodeURIComponent(basename);
  } catch (_) {
    // Fall through to deterministic fallback.
  }
  const extension = process.platform === "win32" ? "exe" : "dmg";
  return `Codex-Switcher-${updateInfo.latestVersion}-${updateInfo.platformKey}.${extension}`;
}

function updateDownloadErrorMessage(error) {
  return (
    error?.cause?.message ||
    error?.cause?.code ||
    error?.message ||
    "unknown network error"
  );
}

async function fetchUpdateDownload(url) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent": "Codex-Switcher",
          Accept: "application/octet-stream,*/*",
        },
      });
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw new Error(t("downloadNetworkFailed", updateDownloadErrorMessage(lastError)));
}

function downloadPercent(transferred, total) {
  if (total) return Math.min(99, Math.round((transferred / total) * 100));
  const megabytes = transferred / (1024 * 1024);
  return Math.min(95, Math.max(1, Math.floor(megabytes * 6)));
}

async function downloadUpdate(updateInfo, webContents) {
  if (!updateInfo?.hasUpdate) throw new Error(t("alreadyLatest"));
  if (!updateInfo.downloadUrl) {
    throw new Error(t("missingDownloadUrl", updateInfo.platformKey));
  }
  if (webContents && !webContents.isDestroyed()) {
    webContents.send("codex:update-progress", {
      percent: 1,
      transferred: 0,
      total: 0,
    });
  }
  const response = await fetchUpdateDownload(updateInfo.downloadUrl);
  if (!response.ok || !response.body) {
    const body = await readJsonResponse(response);
    throw new Error(
      responseErrorMessage(body, t("downloadFailed", response.status)),
    );
  }

  const total = Number(response.headers.get("content-length") || 0);
  let transferred = 0;
  const updatesDir = path.join(app.getPath("userData"), "updates");
  await fs.mkdir(updatesDir, { recursive: true });
  const filePath = path.join(updatesDir, updateFileName(updateInfo));
  const writer = createWriteStream(filePath);
  const progressStream = new TransformStream({
    transform(chunk, controller) {
      transferred += chunk.byteLength;
      const percent = downloadPercent(transferred, total);
      if (webContents && !webContents.isDestroyed()) {
        webContents.send("codex:update-progress", {
          percent,
          transferred,
          total,
        });
      }
      controller.enqueue(chunk);
    },
  });
  try {
    await pipeline(response.body.pipeThrough(progressStream), writer);
  } catch (error) {
    try {
      await fs.unlink(filePath);
    } catch (_) {}
    throw new Error(t("downloadNetworkFailed", updateDownloadErrorMessage(error)));
  }
  downloadedUpdatePath = filePath;
  latestUpdateInfo = { ...updateInfo, downloadedPath: filePath };
  if (webContents && !webContents.isDestroyed()) {
    webContents.send("codex:update-progress", {
      percent: 100,
      transferred: total || transferred,
      total: total || transferred,
    });
  }
  return latestUpdateInfo;
}

async function loadModels({ baseUrl, apiKey }) {
  const response = await fetch(endpointUrl(baseUrl, "/models"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey || ""}`,
      Accept: "application/json",
    },
  });
  const body = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(
      responseErrorMessage(body, t("loadModelsFailed", response.status)),
    );
  }
  const data = Array.isArray(body.data) ? body.data : [];
  return data
    .map((item) => (typeof item === "string" ? item : item?.id))
    .filter((id) => typeof id === "string" && id.trim())
    .map((id) => id.trim());
}

async function testConnection({ baseUrl, apiKey, model }) {
  const headers = {
    Authorization: `Bearer ${apiKey || ""}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const responsesResult = await fetch(endpointUrl(baseUrl, "/responses"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      input: "ping",
      max_output_tokens: 8,
    }),
  });
  if (responsesResult.ok) return { ok: true };

  const responsesBody = await readJsonResponse(responsesResult);
  if (![400, 404, 405].includes(responsesResult.status)) {
    throw new Error(
      responseErrorMessage(
        responsesBody,
        t("connectionFailed", responsesResult.status),
      ),
    );
  }

  const chatResult = await fetch(endpointUrl(baseUrl, "/chat/completions"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 8,
    }),
  });
  if (chatResult.ok) return { ok: true };
  const chatBody = await readJsonResponse(chatResult);
  throw new Error(
    responseErrorMessage(chatBody, t("connectionFailed", chatResult.status)),
  );
}

async function saveProfile({
  name,
  model,
  reviewModel,
  baseUrl,
  apiKey,
  content,
}) {
  validateProfileName(name);
  const next =
    content !== undefined
      ? content
      : serialize(
          formToml(
            name,
            (model || "").trim(),
            (reviewModel || "").trim(),
            (baseUrl || "").trim(),
            apiKey || "",
          ),
        );
  try {
    TOML.parse(next);
  } catch (error) {
    throw new Error(t("invalidTomlSave", error.message));
  }
  await ensureCodexHome();
  await atomicWrite(
    profilePath(name),
    next.endsWith("\n") ? next : `${next}\n`,
  );
  return readProfile(name);
}

async function createProfile(payload) {
  validateProfileName(payload.name);
  const existing = await listProfiles();
  if (
    existing.profiles.some(
      (profile) => profile.name.toLowerCase() === payload.name.toLowerCase(),
    )
  ) {
    throw new Error(t("duplicateProfile", payload.name));
  }
  try {
    await fs.access(profilePath(payload.name));
    throw new Error(t("duplicateProfile", payload.name));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return saveProfile(payload);
}

async function deleteProfile(name) {
  validateProfileName(name);
  const file = profilePath(name);
  try {
    await fs.unlink(file);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (await hasFile(file)) {
    throw new Error(t("deleteProfileFailed", file));
  }
  const home = await ensureCodexHome();
  const previousOrder = await readProfileOrder(home);
  const nextOrder = previousOrder.filter((item) => item !== name);
  if (nextOrder.length !== previousOrder.length)
    await writeProfileOrder(home, nextOrder);
  return listProfiles();
}

async function renameProfile(oldName, newName) {
  validateProfileName(oldName);
  validateProfileName(newName);
  if (oldName === newName) return listProfiles();
  const oldFile = profilePath(oldName);
  const newFile = profilePath(newName);
  if (!(await hasFile(oldFile))) {
    throw new Error(t("profileNotFound", oldName));
  }
  if (await hasFile(newFile)) {
    throw new Error(t("duplicateProfile", newName));
  }
  await fs.rename(oldFile, newFile);
  const home = await ensureCodexHome();
  const previousOrder = await readProfileOrder(home);
  const nextOrder = previousOrder.map((item) =>
    item === oldName ? newName : item,
  );
  if (JSON.stringify(previousOrder) !== JSON.stringify(nextOrder)) {
    await writeProfileOrder(home, nextOrder);
  }
  return listProfiles();
}

function mergeProfileIntoConfig(base, profile) {
  const next = { ...base };
  // These assignments replace object keys before serializing, so duplicate TOML keys cannot be emitted.
  if (profile.model !== undefined) next.model = profile.model;
  if (profile.review_model !== undefined)
    next.review_model = profile.review_model;
  if (profile.model_provider !== undefined)
    next.model_provider = profile.model_provider;
  if (profile.model_providers !== undefined) {
    next.model_providers = {
      ...(base.model_providers || {}),
      ...profile.model_providers,
    };
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
  return nativeImage.createFromDataURL(
    `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
  );
}

function createTrayIcon() {
  if (process.platform !== "darwin") {
    const trayImage = nativeImage.createFromDataURL(
      `data:image/png;base64,${WINDOWS_TRAY_ICON_PNG_1X}`,
    );
    trayImage.addRepresentation({
      scaleFactor: 2,
      buffer: Buffer.from(WINDOWS_TRAY_ICON_PNG_2X, "base64"),
    });
    return trayImage;
  }

  // macOS uses a Retina-ready template image so the system can render the
  // Logo background and transparent code cutout with the menu bar color.
  const trayImage = nativeImage.createFromDataURL(
    `data:image/png;base64,${TRAY_ICON_PNG_1X}`,
  );
  trayImage.addRepresentation({
    scaleFactor: 2,
    buffer: Buffer.from(TRAY_ICON_PNG_2X, "base64"),
  });
  trayImage.setTemplateImage(true);
  return trayImage;
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow().catch((error) =>
      dialog.showErrorBox(t("cannotOpenWindow"), error.message),
    );
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function sendStartupStatus(message) {
  if (mainWindow && !mainWindow.isDestroyed())
    mainWindow.webContents.send("codex:startup-status", message);
}

async function switchFromTray(name) {
  try {
    const state = await applyProfile(name);
    await refreshTrayMenu(state);
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("codex:state-changed", state);
    showMainWindow();
  } catch (error) {
    dialog.showErrorBox(t("applyConfigFailed"), error.message);
  }
}

async function refreshTrayMenu(state) {
  if (!tray) return state || listProfiles();
  const current = state || (await listProfiles());
  const profileItems = current.profiles.length
    ? current.profiles.map((profile) => ({
        label: profile.name,
        type: "radio",
        checked: Boolean(profile.active),
        click: () => switchFromTray(profile.name),
      }))
    : [{ label: t("noProfiles"), enabled: false }];
  const menu = Menu.buildFromTemplate([
    { label: t("openApp"), click: showMainWindow },
    { type: "separator" },
    { label: t("profileList"), enabled: false },
    ...profileItems,
    { type: "separator" },
    { label: t("reloadProfiles"), click: () => refreshTrayMenu() },
    {
      label: t("quit"),
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
  tray.setToolTip(
    current.profiles.find((profile) => profile.active)?.name ||
      "Codex Switcher",
  );
  return current;
}

async function createTray() {
  const trayIcon = createTrayIcon();
  if (!app.isPackaged) {
    console.info("[tray] icon", {
      empty: trayIcon.isEmpty(),
      size: trayIcon.getSize(),
      template: trayIcon.isTemplateImage(),
    });
  }
  tray = new Tray(trayIcon, TRAY_GUID);
  tray.on("click", () => tray.popUpContextMenu());
  tray.on("double-click", showMainWindow);
  await refreshTrayMenu();
}

async function createWindow() {
  const isMac = process.platform === "darwin";
  const isWindows = process.platform === "win32";
  const windowOptions = {
    width: 900,
    height: 640,
    minWidth: 900,
    minHeight: 640,
    resizable: true,
    maximizable: true,
    fullscreenable: true,
    icon: createLogoImage(),
    backgroundColor: "#f5f7fb",
    show: false,
    ...(isWindows ? { frame: false, autoHideMenuBar: true } : {}),
    ...(isMac
      ? {
          titleBarStyle: "hiddenInset",
          trafficLightPosition: { x: 18, y: 18 },
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: !app.isPackaged,
    },
  };
  const window = new BrowserWindow(windowOptions);
  mainWindow = window;

  if (app.isPackaged) {
    window.webContents.on("before-input-event", (event, input) => {
      const key = input.key.toLowerCase();
      const opensDevTools =
        input.key === "F12" ||
        ((input.control || input.meta) &&
          input.shift &&
          ["i", "j", "c"].includes(key)) ||
        (input.meta && input.alt && key === "i");
      if (opensDevTools) event.preventDefault();
    });
    window.webContents.on("devtools-opened", () => {
      window.webContents.closeDevTools();
    });
  }

  const showLoadedWindow = () => {
    if (!window.isDestroyed() && !window.isVisible()) window.show();
  };
  window.webContents.once("dom-ready", showLoadedWindow);
  window.webContents.once("did-finish-load", showLoadedWindow);

  window.on("closed", () => {
    if (mainWindow === window) mainWindow = null;
  });
  window.on("close", (event) => {
    if ((isMac || isWindows) && tray && !isQuitting) {
      event.preventDefault();
      window.hide();
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
  if (!app.isPackaged) await window.loadURL(devUrl);
  else await window.loadFile(path.join(__dirname, "../../dist/index.html"));
  showLoadedWindow();
  return window;
}

ipcMain.handle("codex:state", () => listProfiles());
ipcMain.handle("codex:profile", (_, name) => readProfile(name));
ipcMain.handle("codex:save-profile", async (_, payload) => {
  const saved = await saveProfile(payload);
  await refreshTrayMenu();
  return saved;
});
ipcMain.handle("codex:create-profile", async (_, payload) => {
  const saved = await createProfile(payload);
  await refreshTrayMenu();
  return saved;
});
ipcMain.handle("codex:delete-profile", async (_, name) => {
  const state = await deleteProfile(name);
  await refreshTrayMenu(state);
  return state;
});
ipcMain.handle("codex:rename-profile", async (_, payload) => {
  const state = await renameProfile(payload.oldName, payload.newName);
  await refreshTrayMenu(state);
  return state;
});
ipcMain.handle("codex:apply-profile", async (_, name) => {
  const state = await applyProfile(name);
  await refreshTrayMenu(state);
  return state;
});
ipcMain.handle("codex:load-models", (_, payload) => loadModels(payload));
ipcMain.handle("codex:test-connection", (_, payload) => testConnection(payload));
ipcMain.on("codex:set-language", (_, language) => {
  mainLanguage = language === "en" ? "en" : "zh";
  refreshTrayMenu().catch(() => {});
});
ipcMain.handle("codex:check-updates", () => checkForUpdates());
ipcMain.handle("codex:download-update", async (event) => {
  const updateInfo = latestUpdateInfo || (await checkForUpdates());
  return downloadUpdate(updateInfo, event.sender);
});
ipcMain.handle("codex:install-update", async () => {
  if (!downloadedUpdatePath) throw new Error(t("installerNotDownloaded"));
  const error = await shell.openPath(downloadedUpdatePath);
  if (error) throw new Error(error);
  return true;
});
ipcMain.handle("codex:open-folder", async () => {
  await ensureCodexHome();
  return shell.openPath(codexHome());
});
ipcMain.handle("codex:open-external", async (_, url) => {
  if (![REPOSITORY_URL, SUPPORT_URL].includes(url))
    throw new Error(t("externalUrlDenied"));
  return shell.openExternal(url);
});
ipcMain.on("window:minimize", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});
ipcMain.handle("window:toggle-maximize", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return false;
  if (window.isMaximized()) window.unmaximize();
  else window.maximize();
  return window.isMaximized();
});
ipcMain.on("window:close", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

app.whenReady().then(async () => {
  try {
    if (process.platform === "darwin" && app.dock)
      app.dock.setIcon(createLogoImage());

    // Show the renderer's boot skeleton before doing filesystem and tray work.
    await createWindow();

    // Tray creation and profile scanning are intentionally deferred until the
    // window is already visible, so first launch is not a blank native window.
    sendStartupStatus(t("startupInitConfig"));
    await ensureCodexHome();
    sendStartupStatus(t("startupCreateTray"));
    await createTray();
    sendStartupStatus(t("startupWaitConfig"));
  } catch (error) {
    await dialog.showMessageBox({
      type: "error",
      title: t("codexHomeInaccessible"),
      message: error.message,
      detail: t("directory", codexHome()),
    });
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("activate", async () => {
  if (!mainWindow || mainWindow.isDestroyed()) await createWindow();
  else showMainWindow();
});
