import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  App as AntApp,
  Button,
  ConfigProvider,
  Drawer,
  Form,
  Input,
  Layout,
  List,
  Modal,
  Popover,
  Progress,
  Skeleton,
  Space,
  Tag,
  Typography,
  theme as antdTheme,
  message,
  notification,
} from "antd";
import {
  CheckCircleFilled,
  CodeOutlined,
  DownloadOutlined,
  CloseOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  LockOutlined,
  MoonOutlined,
  MinusOutlined,
  PlayCircleFilled,
  PlusOutlined,
  BorderOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
  SunOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import packageJson from "../package.json";
import SingleCreatableSelect, {
  type ValueOption,
} from "./components/SingleCreatableSelect";
import { BASE_URL_OPTIONS, REPOSITORY_URL, SUPPORT_URL } from "./config";
import {
  getTranslations,
  interpolate,
  translate,
  type LanguageMode,
  type TranslationText,
} from "./i18n";
import { latencyClassName } from "./utils/latency";
import SessionManager from "./components/SessionManager";
import UsageStats from "./components/UsageStats";
import {
  APP_FONT_OPTIONS,
  applyAppFont,
  getAppFontFamily,
  getStoredAppFont,
  type AppFontKey,
} from "./fonts/appFont";

const { Sider, Content } = Layout;
const { Text, Title } = Typography;
const APP_VERSION = packageJson.version;
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

type FormValues = {
  model: string;
  reviewModel: string;
  baseUrl: string;
  apiKey: string;
};
type ThemeMode = "light" | "dark";

function initialTheme(): ThemeMode {
  return localStorage.getItem("codex-switcher-theme") === "dark"
    ? "dark"
    : "light";
}

function initialLanguage(): LanguageMode {
  return localStorage.getItem("codex-switcher-language") === "en" ? "en" : "zh";
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch (_) {
    return false;
  }
}

function App() {
  const isWindows = window.codexAPI?.platform === "win32";
  const [profiles, setProfiles] = useState<CodexProfile[]>([]);
  const [hasCodexConfig, setHasCodexConfig] = useState(false);
  const [selectedName, setSelectedName] = useState<string>();
  const [selected, setSelected] = useState<CodexProfile>();
  const [loading, setLoading] = useState(true);
  const [startupStatus, setStartupStatus] = useState<string>(
    translate("loadingConfig", initialLanguage()),
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [customDrawerOpen, setCustomDrawerOpen] = useState(false);
  const [customContent, setCustomContent] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [refreshingProfiles, setRefreshingProfiles] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [modelOptions, setModelOptions] = useState<ValueOption[]>([]);
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialTheme);
  const [languageMode, setLanguageMode] =
    useState<LanguageMode>(initialLanguage);
  const [fontMode, setFontMode] = useState<AppFontKey>(getStoredAppFont);
  const initialFontEffect = useRef(true);
  const [languageFontOpen, setLanguageFontOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [sessionManagerOpen, setSessionManagerOpen] = useState(false);
  const [usageStatsOpen, setUsageStatsOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<CodexUpdateInfo>();
  const [updateOpen, setUpdateOpen] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [downloadingUpdate, setDownloadingUpdate] = useState(false);
  const [hasStartedUpdateDownload, setHasStartedUpdateDownload] =
    useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const [messageApi, messageContextHolder] = message.useMessage({
    maxCount: 1,
    top: 64,
  });
  const [notificationApi, notificationContextHolder] =
    notification.useNotification();
  const [modalApi, modalContextHolder] = Modal.useModal();

  const isDark = themeMode === "dark";
  const antLocale = languageMode === "en" ? enUS : zhCN;
  const t = getTranslations(languageMode);
  const currentBaseUrl = Form.useWatch("baseUrl", form);
  const currentApiKey = Form.useWatch("apiKey", form);
  const currentModel = Form.useWatch("model", form);
  const canTestConnection = Boolean(
    currentBaseUrl?.trim() && currentApiKey?.trim() && currentModel?.trim(),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    localStorage.setItem("codex-switcher-theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem("codex-switcher-language", languageMode);
    window.codexAPI?.setLanguage?.(languageMode);
  }, [languageMode]);

  useEffect(() => {
    if (initialFontEffect.current) {
      initialFontEffect.current = false;
      return;
    }
    void applyAppFont(fontMode).catch(() => {
      // Keep the configured fallback stack if a packaged webfont fails to load.
    });
  }, [fontMode]);

  useEffect(() => {
    if (!window.codexAPI?.onStartupStatus) return;
    return window.codexAPI.onStartupStatus(setStartupStatus);
  }, []);

  useEffect(() => {
    if (!loading) window.dispatchEvent(new Event("codex-switcher:app-ready"));
  }, [loading]);

  const refresh = useCallback(async (preferredName?: string) => {
    // Keeps the renderer graceful if the preload bridge is unavailable (for example, in a plain browser preview).
    if (!window.codexAPI) {
      setProfiles([]);
      setHasCodexConfig(false);
      setSelectedName(undefined);
      setSelected(undefined);
      return {
        codexHome: "~/.codex",
        hasCodexConfig: false,
        profiles: [],
      };
    }
    const state = await window.codexAPI.getState();
    setProfiles(state.profiles);
    setHasCodexConfig(state.hasCodexConfig);
    const nextName =
      state.hasCodexConfig &&
      preferredName &&
      state.profiles.some((item) => item.name === preferredName)
        ? preferredName
        : state.hasCodexConfig
          ? state.profiles[0]?.name
          : undefined;
    setSelectedName(nextName);
    if (!nextName) setSelected(undefined);
    return state;
  }, []);

  const reloadProfile = useCallback(
    async (name: string) => {
      const profile = await window.codexAPI.getProfile(name);
      setSelected(profile);
      form.setFieldsValue({
        model: profile.model,
        reviewModel: profile.reviewModel,
        baseUrl: profile.baseUrl,
        apiKey: profile.apiKey,
      });
      setCustomContent(profile.source);
      return profile;
    },
    [form],
  );

  useEffect(() => {
    Promise.all([refresh(), window.codexAPI?.prepareSessions?.()])
      .catch((error: Error) => messageApi.error(error.message))
      .finally(() => setLoading(false));
  }, [messageApi, refresh]);

  useEffect(() => {
    if (!selectedName) return;
    if (!window.codexAPI) return;
    setDetailLoading(true);
    reloadProfile(selectedName)
      .catch((error: Error) => messageApi.error(error.message))
      .finally(() => setDetailLoading(false));
  }, [selectedName, messageApi, reloadProfile]);

  useEffect(() => {
    if (!window.codexAPI?.onStateChanged) return;
    return window.codexAPI.onStateChanged((state) => {
      setProfiles(state.profiles);
      setHasCodexConfig(state.hasCodexConfig);
      setSelected((current) => {
        if (!current) return current;
        const next = state.profiles.find(
          (profile) => profile.name === current.name,
        );
        return next ? { ...current, active: next.active } : current;
      });
    });
  }, []);

  useEffect(() => {
    if (!window.codexAPI?.checkUpdates) return;
    let disposed = false;
    let checking = false;
    const checkUpdates = async () => {
      if (checking) return;
      checking = true;
      if (!disposed) setCheckingUpdate(true);
      try {
        const info = await window.codexAPI.checkUpdates();
        if (!disposed) {
          setUpdateInfo(info);
          if (info.forceUpdate) {
            const downloaded = Boolean(info.downloadedPath);
            setUpdateDownloaded(downloaded);
            setHasStartedUpdateDownload(downloaded);
            setUpdateProgress(downloaded ? 100 : 0);
            setUpdateOpen(true);
          }
        }
      } catch (_) {
        // Network or GitHub availability should not block normal profile switching.
      } finally {
        checking = false;
        if (!disposed) setCheckingUpdate(false);
      }
    };

    const runAfterFirstPaint = () => {
      window.setTimeout(checkUpdates, 0);
    };
    requestAnimationFrame(runAfterFirstPaint);
    const timer = window.setInterval(checkUpdates, UPDATE_CHECK_INTERVAL_MS);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!window.codexAPI?.onUpdateProgress) return;
    return window.codexAPI.onUpdateProgress((progress) => {
      setUpdateProgress(progress.percent || 0);
    });
  }, []);

  const selectedIndex = useMemo(
    () => profiles.findIndex((profile) => profile.name === selectedName),
    [profiles, selectedName],
  );
  const selectedIsActive = profiles.some(
    (profile) => profile.name === selected?.name && profile.active,
  );

  const selectProfile = (name: string) => {
    setCustomDrawerOpen(false);
    setRenameOpen(false);
    setSelectedName(name);
  };

  useEffect(() => {
    setRenameOpen(false);
    setNameDraft(selected?.name || "");
  }, [selected?.name]);

  const handleSave = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      if (customDrawerOpen) {
        await window.codexAPI.saveProfile({
          name: selected.name,
          content: customContent,
        });
      } else {
        const values = form.getFieldsValue();
        await window.codexAPI.saveProfile({ name: selected.name, ...values });
      }
      await reloadProfile(selected.name);
      await refresh(selected.name);
      setCustomDrawerOpen(false);
      messageApi.success(t.saveSuccess);
    } catch (error) {
      messageApi.error(`${t.saveFailed}: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!hasCodexConfig) {
      messageApi.warning(t.installCodexFirst);
      return;
    }
    const name = createName.trim();
    if (!name) {
      messageApi.warning(t.profileNameRequired);
      return;
    }
    if (
      profiles.some(
        (profile) => profile.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      messageApi.error(interpolate(t.duplicateProfile, { name }));
      return;
    }
    try {
      setSaving(true);
      const saved = await window.codexAPI.createProfile({
        name,
        model: "",
        reviewModel: "",
        baseUrl: "",
        apiKey: "",
      });
      await refresh(saved.name);
      setCustomDrawerOpen(false);
      setCreateOpen(false);
      setCreateName("");
      messageApi.success(t.createProfileSuccess);
    } catch (error) {
      messageApi.error(`${t.createFailed}: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async () => {
    if (!selected) return;
    const values = form.getFieldsValue();
    const baseUrl = values.baseUrl?.trim();
    const apiKey = values.apiKey?.trim();
    const model = values.model?.trim();
    if (!baseUrl) {
      messageApi.warning(t.baseUrlRequired);
      return;
    }
    if (!isValidUrl(baseUrl)) {
      messageApi.warning(t.invalidUrl);
      return;
    }
    if (!apiKey) {
      messageApi.warning(t.apiKeyRequired);
      return;
    }
    if (!model) {
      messageApi.warning(t.modelRequired);
      return;
    }
    try {
      setApplying(true);
      const state = await window.codexAPI.applyProfile(selected.name);
      setProfiles(state.profiles);
      const applied = state.profiles.find(
        (profile) => profile.name === selected.name,
      );
      setSelected((current) =>
        current ? { ...current, active: Boolean(applied?.active) } : current,
      );
      notificationApi.success({
        message: `${t.appliedTitle}: ${selected.name}`,
        description: t.appliedDesc,
        placement: "topRight",
      });
    } catch (error) {
      messageApi.error(`${t.applyFailed}: ${(error as Error).message}`);
    } finally {
      setApplying(false);
    }
  };

  const handleDelete = () => {
    if (!selected) return;
    const profileName = selected.name;
    modalApi.confirm({
      title: t.deleteConfigTitle,
      content: interpolate(t.deleteConfigConfirm, { name: profileName }),
      okText: t.deleteConfig,
      okButtonProps: { danger: true },
      cancelText: t.cancel,
      centered: true,
      onOk: async () => {
        try {
          const state = await window.codexAPI.deleteProfile(profileName);
          setProfiles(state.profiles);
          setHasCodexConfig(state.hasCodexConfig);
          setCustomDrawerOpen(false);
          const nextName = state.profiles[0]?.name;
          setSelectedName(nextName);
          if (!nextName) {
            setSelected(undefined);
            form.resetFields();
            setCustomContent("");
          }
          messageApi.success(t.deleteConfigSuccess);
        } catch (error) {
          messageApi.error(
            `${t.deleteConfigFailed}: ${(error as Error).message}`,
          );
        }
      },
    });
  };

  const handleStartEditName = () => {
    if (!selected) return;
    setNameDraft(selected.name);
    setRenameOpen(true);
  };

  const handleSaveName = async () => {
    if (!selected) return;
    const newName = nameDraft.trim();
    if (!newName) {
      messageApi.warning(t.profileNameRequired);
      return;
    }
    if (newName === selected.name) {
      setRenameOpen(false);
      return;
    }
    if (
      profiles.some(
        (profile) =>
          profile.name.toLowerCase() === newName.toLowerCase() &&
          profile.name !== selected.name,
      )
    ) {
      messageApi.error(interpolate(t.duplicateProfile, { name: newName }));
      return;
    }
    try {
      setRenaming(true);
      const state = await window.codexAPI.renameProfile({
        oldName: selected.name,
        newName,
      });
      setProfiles(state.profiles);
      setHasCodexConfig(state.hasCodexConfig);
      setSelectedName(newName);
      await reloadProfile(newName);
      setRenameOpen(false);
      messageApi.success(t.renameConfigSuccess);
    } catch (error) {
      messageApi.error(`${t.renameConfigFailed}: ${(error as Error).message}`);
    } finally {
      setRenaming(false);
    }
  };

  const handleLoadModels = async () => {
    const baseUrl = form.getFieldValue("baseUrl")?.trim();
    const apiKey = form.getFieldValue("apiKey")?.trim();
    if (!baseUrl || !apiKey) {
      messageApi.warning(t.fillBaseUrlAndApiKey);
      return;
    }
    try {
      setLoadingModels(true);
      const models = await window.codexAPI.loadModels({ baseUrl, apiKey });
      const options = models.map((model) => ({ label: model, value: model }));
      setModelOptions(options);
      if (options.length)
        messageApi.success(interpolate(t.loadedModels, { count: options.length }));
      else messageApi.warning(t.noModelsReturned);
    } catch (error) {
      messageApi.error(`${t.loadModelsFailed}: ${(error as Error).message}`);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleTestConnection = async () => {
    const baseUrl = form.getFieldValue("baseUrl")?.trim();
    const apiKey = form.getFieldValue("apiKey")?.trim();
    const model = form.getFieldValue("model")?.trim();
    if (!baseUrl || !apiKey || !model) return;
    const startedAt = performance.now();
    try {
      setTesting(true);
      const result = await window.codexAPI.testConnection({ baseUrl, apiKey, model });
      const latency = Math.round(performance.now() - startedAt);
      if (!result.ok) {
        const responseBody = typeof result.body === "string" ? result.body : JSON.stringify(result.body ?? {}, null, 2);
        modalApi.error({
          title: t.testFailedTitle,
          centered: true,
          width: 620,
          content: (
            <div className="connection-test-result">
              <div>{t.model}: {model}</div>
              <div>{languageMode === "zh" ? "状态码" : "Status"}: <span className="connection-status-code">{result.status}</span></div>
              <div>{languageMode === "zh" ? "请求端点" : "Endpoint"}: <code>{result.endpoint}</code></div>
              <div>{t.latency}: <span className={`connection-latency ${latencyClassName(latency)}`}>{latency} ms</span></div>
              <div className="connection-response-label">{languageMode === "zh" ? "响应体" : "Response body"}</div>
              <pre className="connection-response-body">{responseBody}</pre>
            </div>
          ),
          okText: t.ok,
        });
        return;
      }
      modalApi.success({
        title: t.testSuccessTitle,
        centered: true,
        content: (
          <div className="connection-test-result">
            <div>
              {t.model}: {model}
            </div>
            <div>
              {t.latency}:{" "}
              <span
                className={`connection-latency ${latencyClassName(latency)}`}
              >
                {latency} ms
              </span>
            </div>
          </div>
        ),
        okText: t.ok,
      });
    } catch (error) {
      const latency = Math.round(performance.now() - startedAt);
      modalApi.error({
        title: t.testFailedTitle,
        centered: true,
        content: (
          <div className="connection-test-result">
            <div>
              {t.model}: {model}
            </div>
            <div>
              {t.latency}:{" "}
              <span
                className={`connection-latency ${latencyClassName(latency)}`}
              >
                {latency} ms
              </span>
            </div>
            <div className="connection-test-error">
              {(error as Error).message}
            </div>
          </div>
        ),
        okText: t.ok,
      });
    } finally {
      setTesting(false);
    }
  };

  const cancelCustom = async () => {
    if (selected) {
      try {
        await reloadProfile(selected.name);
      } catch (error) {
        messageApi.error(`${t.readConfigFailed}: ${(error as Error).message}`);
      }
    }
    setCustomDrawerOpen(false);
  };

  const openCustomEditor = async () => {
    if (!selected) return;
    try {
      await reloadProfile(selected.name);
    } catch (error) {
      messageApi.error(`${t.readConfigFailed}: ${(error as Error).message}`);
      return;
    }
    setCustomDrawerOpen(true);
  };

  const handleCustomContentChange = (value: string) => {
    setCustomContent(value);
  };

  const handleOpenFolder = async () => {
    setSettingsOpen(false);
    try {
      const error = await window.codexAPI.openFolder();
      if (error) {
        messageApi.error(error);
        return;
      }
      messageApi.success(t.openFolderSuccess);
    } catch (error) {
      messageApi.error(`${t.openFolderFailed}: ${(error as Error).message}`);
    }
  };

  const handleToggleTheme = () => {
    setSettingsOpen(false);
    setThemeMode(isDark ? "light" : "dark");
  };

  const handleSelectLanguage = (language: LanguageMode) => {
    setLanguageMode(language);
  };

  const handleOpenUpdate = async () => {
    setSettingsOpen(false);
    setUpdateOpen(true);
    setCheckingUpdate(true);
    try {
      const info = await window.codexAPI.checkUpdates();
      setUpdateInfo(info);
      setUpdateDownloaded(Boolean(info.downloadedPath));
      setHasStartedUpdateDownload(Boolean(info.downloadedPath));
      setUpdateProgress(info.downloadedPath ? 100 : 0);
    } catch (error) {
      messageApi.error(`${t.checkUpdateFailed}: ${(error as Error).message}`);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleDownloadUpdate = async () => {
    try {
      setDownloadingUpdate(true);
      setHasStartedUpdateDownload(true);
      const info = await window.codexAPI.downloadUpdate();
      setUpdateInfo(info);
      setUpdateDownloaded(true);
      setUpdateProgress(100);
      messageApi.success(t.updateDownloadedSuccess);
    } catch (error) {
      messageApi.error(`${t.downloadUpdateFailed}: ${(error as Error).message}`);
    } finally {
      setDownloadingUpdate(false);
    }
  };

  const handleInstallUpdate = async () => {
    try {
      await window.codexAPI.installUpdate();
      messageApi.success(t.installOpened);
    } catch (error) {
      messageApi.error(`${t.installOpenFailed}: ${(error as Error).message}`);
    }
  };

  const hasProfiles = hasCodexConfig && profiles.length > 0;
  const forceUpdate = Boolean(updateInfo?.forceUpdate);

  const handleRefreshProfiles = async () => {
    try {
      setRefreshingProfiles(true);
      await refresh(selectedName);
      messageApi.success(t.refreshProfilesSuccess);
    } catch (error) {
      messageApi.error(`${t.detectFailed}: ${(error as Error).message}`);
    } finally {
      setRefreshingProfiles(false);
    }
  };

  const handleDetectCodex = async () => {
    try {
      setLoading(true);
      await refresh();
      messageApi.success(t.detectCodexSuccess);
    } catch (error) {
      messageApi.error(`${t.detectFailed}: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaximize = async () => {
    try {
      const nextValue = await window.codexAPI.toggleMaximizeWindow();
      setIsMaximized(nextValue);
    } catch (error) {
      messageApi.error(`${t.windowOperationFailed}: ${(error as Error).message}`);
    }
  };

  const settingsContent = (
    <div className="settings-popover">
      <div className="settings-popover-title">{t.appSettings}</div>
      <div className="settings-row">
        <Button
          type="text"
          className="settings-theme-button"
          icon={isDark ? <MoonOutlined /> : <SunOutlined />}
          onClick={handleToggleTheme}
        >
          {isDark ? t.switchLight : t.switchDark}
        </Button>
      </div>
      <div className="settings-row settings-language-row">
        <Button
          type="text"
          className="settings-theme-button settings-language-button"
          icon={<GlobalOutlined />}
          onClick={() => {
            setSettingsOpen(false);
            setLanguageFontOpen(true);
          }}
        >
          <span>{languageMode === "zh" ? "语言字体" : "Language & Font"}</span>
        </Button>
      </div>
      <Button
        type="text"
        className="settings-about-button"
        icon={<DatabaseOutlined />}
        onClick={() => {
          setSettingsOpen(false);
          setSessionManagerOpen(true);
        }}
      >
        {languageMode === "zh" ? "会话管理" : "Session management"}
      </Button>
      <Button
        type="text"
        className="settings-about-button"
        icon={<BarChartOutlined />}
        onClick={() => {
          setSettingsOpen(false);
          setUsageStatsOpen(true);
        }}
      >
        {languageMode === "zh" ? "用量统计" : "Usage statistics"}
      </Button>
      {updateInfo?.hasUpdate && (
        <Button
          type="primary"
          danger
          className="settings-about-button settings-upgrade-button"
          icon={<DownloadOutlined />}
          onClick={handleOpenUpdate}
        >
          {t.upgrade}
        </Button>
      )}
      {hasCodexConfig && (
        <Button
          type="text"
          className="settings-about-button settings-folder-button"
          icon={<FolderOpenOutlined />}
          onClick={handleOpenFolder}
        >
          {t.openConfigFolder}
        </Button>
      )}
      <Button
        type="text"
        className="settings-about-button"
        icon={<InfoCircleOutlined />}
        onClick={() => {
          setSettingsOpen(false);
          setAboutOpen(true);
        }}
      >
        {t.about}
      </Button>
    </div>
  );

  const settingsButton = (className = "settings-button") => (
    <Button type="text" className={className} icon={<SettingOutlined />}>
      <span>{t.settings}</span>
      {checkingUpdate ? (
        <span className="settings-checking-status">
          <LoadingOutlined spin />
          <span>{languageMode === "zh" ? "检测新版本中" : "Checking for updates"}</span>
        </span>
      ) : updateInfo?.hasUpdate ? (
        <Tag color="red" className="update-tag">
          {t.newVersion}
        </Tag>
      ) : null}
    </Button>
  );

  const antThemeConfig = {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: "#1677ff",
      fontFamily: getAppFontFamily(fontMode),
      borderRadius: 8,
    },
  };

  if (loading) {
    return (
      <ConfigProvider locale={antLocale} theme={antThemeConfig}>
        <div className="loading-screen">
          <div className="loading-content">
            <Skeleton active paragraph={{ rows: 5 }} />
            <div className="loading-status">{startupStatus}</div>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={antLocale} theme={antThemeConfig}>
      <AntApp>
        {messageContextHolder}
        {notificationContextHolder}
        {modalContextHolder}
        <Layout className="app-shell">
          <div className="window-chrome">
            <div className="window-title">Codex Switcher</div>
            {isWindows && (
              <div className="window-controls" aria-label={t.windowControls}>
                <button
                  type="button"
                  className="window-control"
                  aria-label={t.minimize}
                  title={t.minimize}
                  onClick={() => window.codexAPI.minimizeWindow()}
                >
                  <MinusOutlined />
                </button>
                <button
                  type="button"
                  className="window-control"
                  aria-label={isMaximized ? t.restore : t.maximize}
                  title={isMaximized ? t.restore : t.maximize}
                  onClick={toggleMaximize}
                >
                  <BorderOutlined />
                </button>
                <button
                  type="button"
                  className="window-control window-control-close"
                  aria-label={t.windowClose}
                  title={t.windowClose}
                  onClick={() => window.codexAPI.closeWindow()}
                >
                  <CloseOutlined />
                </button>
              </div>
            )}
          </div>
          {!hasProfiles && (
            <header className="topbar empty-topbar">
              <div className="brand">
                <div className="brand-mark">
                  <BrandLogo />
                </div>
                <div>
                  <div className="brand-name">Codex Switcher</div>
                  <Text className="brand-subtitle">
                    Profiles, without the friction.
                  </Text>
                </div>
              </div>
              <Popover
                placement="bottomRight"
                trigger="click"
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                content={settingsContent}
              >
                {settingsButton("settings-button empty-settings-button")}
              </Popover>
            </header>
          )}

          <Layout className="body-layout">
            {hasProfiles && (
              <Sider width={288} className="profile-sider">
                <div className="sidebar-brand brand">
                  <div className="brand-mark">
                    <BrandLogo />
                  </div>
                  <div>
                    <div className="brand-name">Codex Switcher</div>
                    <Text className="brand-subtitle">
                      Profiles, without the friction.
                    </Text>
                  </div>
                </div>
                <div className="sider-heading">
                  <div>
                    <Text className="eyebrow">{t.workspace}</Text>
                    <div className="profile-list-title-row">
                      <Title level={4}>{t.profileList}</Title>
                      <Button
                        className="refresh-profile-button"
                        type="text"
                        size="small"
                        icon={<ReloadOutlined />}
                        loading={refreshingProfiles}
                        title={t.refreshProfiles}
                        aria-label={t.refreshProfiles}
                        onClick={handleRefreshProfiles}
                      />
                    </div>
                  </div>
                  <Button
                    className="square-button"
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateOpen(true)}
                  />
                </div>
                <div className="profile-list-region">
                  {refreshingProfiles ? (
                    <div className="profile-list-skeleton">
                      <Skeleton active paragraph={{ rows: 8 }} title={false} />
                    </div>
                  ) : (
                    <List
                      className="profile-list"
                      dataSource={profiles}
                      renderItem={(profile) => (
                        <List.Item
                          className={`profile-item ${profile.name === selectedName ? "selected" : ""}`}
                          onClick={() => selectProfile(profile.name)}
                        >
                          <div className="profile-leading">
                            <div className="profile-avatar">
                              {profile.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="profile-copy">
                              <Text className="profile-name">
                                {profile.name}
                              </Text>
                              <Text className="profile-model">
                                {profile.model || t.noModel}
                              </Text>
                            </div>
                          </div>
                          {profile.active && (
                            <CheckCircleFilled className="active-icon" />
                          )}
                        </List.Item>
                      )}
                    />
                  )}
                </div>
                <div className="sider-footer">
                  <Popover
                    placement="topLeft"
                    trigger="click"
                    open={settingsOpen}
                    onOpenChange={setSettingsOpen}
                    content={settingsContent}
                  >
                    {settingsButton()}
                  </Popover>
                </div>
              </Sider>
            )}

            <Content
              className={`main-content ${hasProfiles ? "" : "empty-content"}`}
            >
              {!hasProfiles ? (
                <EmptyState
                  hasCodexConfig={hasCodexConfig}
                  t={t}
                  onAdd={() => setCreateOpen(true)}
                  onDetect={handleDetectCodex}
                />
              ) : (
                <div className="detail-panel">
                  {detailLoading || !selected ? (
                    <div className="detail-skeleton">
                      <Skeleton active paragraph={{ rows: 7 }} />
                    </div>
                  ) : (
                    <>
                      <div className="detail-main">
                        <div className="detail-main-inner">
                          <div className="detail-header">
                            <div className="detail-heading">
                              <Text className="eyebrow">
                                PROFILE{" "}
                                {String(selectedIndex + 1).padStart(2, "0")}
                              </Text>
                              <div className="detail-title-row">
                                <Title level={2}>{selected.name}</Title>
                                {selectedIsActive && (
                                  <Tag
                                    className="active-tag"
                                    icon={<CheckCircleFilled />}
                                  >
                                    {t.currentApplied}
                                  </Tag>
                                )}
                                <Space
                                  className="detail-header-actions"
                                  size={12}
                                >
                                  <Button
                                    type="link"
                                    danger
                                    className="delete-profile-button"
                                    onClick={handleDelete}
                                  >
                                    {t.deleteConfig}
                                  </Button>
                                  <Button
                                    type="link"
                                    className="edit-profile-name-button"
                                    onClick={handleStartEditName}
                                  >
                                    {t.editConfigName}
                                  </Button>
                                </Space>
                              </div>
                              <Text className="detail-description">
                                {t.detailDescription}
                              </Text>
                            </div>
                          </div>

                          {selected.error && (
                            <Alert
                              type="error"
                              showIcon
                              message={t.parseErrorTitle}
                              description={selected.error}
                            />
                          )}

                          <div className="detail-body">
                            <div className="editor-card">
                              <Form
                                form={form}
                                layout="vertical"
                                requiredMark
                                className="config-form"
                              >
                                <Form.Item
                                  name="baseUrl"
                                  label="Base URL"
                                  required
                                >
                                  <SingleCreatableSelect
                                    options={BASE_URL_OPTIONS}
                                    placeholder={t.baseUrlPlaceholder}
                                    optionMode="baseUrl"
                                    customLabel={t.custom}
                                    prefixIcon={
                                      <GlobalOutlined className="input-prefix" />
                                    }
                                  />
                                </Form.Item>
                                <Form.Item
                                  name="apiKey"
                                  label="API Key"
                                  required
                                >
                                  <Input.Password
                                    size="large"
                                    placeholder={t.apiKeyPlaceholder}
                                    prefix={<LockOutlined className="input-prefix" />}
                                  />
                                </Form.Item>
                                <Form.Item
                                  name="model"
                                  label={
                                    <div className="model-label-row">
                                      <span>Model</span>
                                      <Button
                                        type="link"
                                        size="small"
                                        loading={loadingModels}
                                        onClick={handleLoadModels}
                                      >
                                        {t.loadModels}
                                      </Button>
                                    </div>
                                  }
                                >
                                  <SingleCreatableSelect
                                    options={modelOptions}
                                    placeholder={t.modelPlaceholder}
                                    optionMode="model"
                                    customLabel={t.custom}
                                    prefixIcon={
                                      <CodeOutlined className="input-prefix" />
                                    }
                                  />
                                </Form.Item>
                                <Form.Item
                                  name="reviewModel"
                                  label={`Review Model (${t.optional})`}
                                >
                                  <SingleCreatableSelect
                                    options={modelOptions}
                                    placeholder={t.reviewModelPlaceholder}
                                    optionMode="model"
                                    customLabel={t.custom}
                                    prefixIcon={
                                      <CodeOutlined className="input-prefix" />
                                    }
                                  />
                                </Form.Item>
                              </Form>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="detail-footer">
                        <Space size={12}>
                          <Button
                            type="primary"
                            size="large"
                            icon={<SaveOutlined />}
                            loading={saving}
                            onClick={handleSave}
                          >
                            {t.saveConfig}
                          </Button>
                          <Button
                            type="text"
                            size="large"
                            icon={<CodeOutlined />}
                            onClick={openCustomEditor}
                          >
                            {t.customConfig}
                          </Button>
                          <Button
                            size="large"
                            icon={<PlayCircleFilled className="test-icon" />}
                            loading={testing}
                            disabled={!canTestConnection}
                            onClick={handleTestConnection}
                          >
                            {t.testConnection}
                          </Button>
                        </Space>
                        <Button
                          className="apply-button"
                          size="large"
                          icon={<SwapOutlined />}
                          loading={applying}
                          onClick={handleApply}
                        >
                          {t.applyConfig}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {selected && (
                <Drawer
                  open={customDrawerOpen}
                  title={`${t.customConfigTitle} · ${selected.name}`}
                  placement="right"
                  width="100%"
                  getContainer={false}
                  rootClassName="custom-config-drawer"
                  onClose={cancelCustom}
                  footer={
                    <Space>
                      <Button onClick={cancelCustom}>{t.cancel}</Button>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={saving}
                        onClick={handleSave}
                      >
                        {t.saveConfig}
                      </Button>
                    </Space>
                  }
                >
                  <div className="custom-editor drawer-editor">
                    <div className="editor-toolbar">
                      <CodeOutlined /> <span>{t.editToml}</span>
                      <Text>{t.fullCodexConfigSupport}</Text>
                    </div>
                    <Input.TextArea
                      value={customContent}
                      onChange={(event) =>
                        handleCustomContentChange(event.target.value)
                      }
                      spellCheck={false}
                    />
                  </div>
                </Drawer>
              )}
            </Content>
          </Layout>
        </Layout>

        <Drawer
          open={sessionManagerOpen}
          title={languageMode === "zh" ? "会话管理" : "Session management"}
          placement="right"
          width="100%"
          destroyOnClose
          rootClassName="feature-fullscreen-drawer"
          onClose={() => setSessionManagerOpen(false)}
        >
          <SessionManager language={languageMode} />
        </Drawer>

        <Drawer
          open={usageStatsOpen}
          title={languageMode === "zh" ? "用量统计" : "Usage statistics"}
          placement="right"
          width="100%"
          destroyOnClose
          rootClassName="feature-fullscreen-drawer"
          onClose={() => setUsageStatsOpen(false)}
        >
          <UsageStats language={languageMode} />
        </Drawer>

        <Modal
          open={languageFontOpen}
          title={languageMode === "zh" ? "语言与字体" : "Language & Font"}
          footer={null}
          width={680}
          centered
          rootClassName="language-font-modal"
          onCancel={() => setLanguageFontOpen(false)}
        >
          <section className="preference-section">
            <div className="preference-section-title">
              {languageMode === "zh" ? "界面语言" : "Interface language"}
            </div>
            <div className="preference-choice-grid">
              {(["zh", "en"] as LanguageMode[]).map((language) => {
                const active = languageMode === language;
                return (
                  <button
                    key={language}
                    type="button"
                    className={`preference-choice ${active ? "active" : ""}`}
                    onClick={() => handleSelectLanguage(language)}
                  >
                    {active && <CheckCircleFilled className="preference-choice-check" />}
                    <span className="preference-choice-name">{language === "zh" ? "中文" : "English"}</span>
                    <span className="preference-choice-description">
                      {language === "zh" ? "使用简体中文显示界面" : "Display the interface in English"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="preference-section">
            <div className="preference-section-title">
              {languageMode === "zh" ? "界面字体" : "Interface font"}
            </div>
            <div className="preference-choice-grid font-choice-grid">
              {APP_FONT_OPTIONS.map((option) => {
                const active = fontMode === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`preference-choice ${active ? "active" : ""}`}
                    onClick={() => setFontMode(option.key)}
                  >
                    {active && <CheckCircleFilled className="preference-choice-check" />}
                    <span className="preference-choice-name">
                      {languageMode === "zh" ? option.label : option.labelEn}
                    </span>
                    <span className="preference-choice-description">
                      {languageMode === "zh" ? option.description : option.descriptionEn}
                    </span>
                    <span className="font-choice-preview" style={{ fontFamily: option.family }}>
                      {option.preview}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </Modal>

        <Modal
          open={createOpen}
          title={t.addConfig}
          okText={t.createConfig}
          cancelText={t.cancel}
          confirmLoading={saving}
          onOk={handleCreate}
          onCancel={() => {
            setCreateOpen(false);
            setCreateName("");
          }}
          centered
        >
          <div className="create-modal-copy">{t.configNameTip}</div>
          <Input
            autoFocus
            size="large"
            value={createName}
            onChange={(event) => setCreateName(event.target.value)}
            onPressEnter={handleCreate}
            placeholder={t.createNamePlaceholder}
          />
        </Modal>

        <Modal
          open={renameOpen}
          title={t.renameConfigTitle}
          okText={t.saveConfigName}
          cancelText={t.cancel}
          confirmLoading={renaming}
          onOk={handleSaveName}
          onCancel={() => {
            setRenameOpen(false);
            setNameDraft(selected?.name || "");
          }}
          centered
        >
          <div className="create-modal-copy">{t.configNameTip}</div>
          <Input
            autoFocus
            size="large"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            onPressEnter={handleSaveName}
            placeholder={t.createNamePlaceholder}
          />
        </Modal>

        <Modal
          open={aboutOpen}
          title={
            <Space size={8}>
              <span>{t.about}</span>
              <Tag color="blue">v{APP_VERSION}</Tag>
            </Space>
          }
          centered
          footer={
            <Button type="primary" onClick={() => setAboutOpen(false)}>
              {t.gotIt}
            </Button>
          }
          onCancel={() => setAboutOpen(false)}
        >
          <div className="about-content">
            <Title level={4}>{t.aboutFeatureTitle}</Title>
            <p>{t.aboutFeatureDesc}</p>
            <Title level={4}>{t.aboutSupportTitle}</Title>
            <p>
              {t.aboutSupportDescPrefix}{" "}
              <code>$CODEX_HOME/&lt;profile&gt;.config.toml</code>
              {t.aboutSupportDescSuffix}
            </p>
            <p>
              {t.repository}:{" "}
              <a
                href={REPOSITORY_URL}
                onClick={async (event) => {
                  event.preventDefault();
                  try {
                    await window.codexAPI.openExternal(REPOSITORY_URL);
                  } catch (error) {
                    messageApi.error((error as Error).message);
                  }
                }}
              >
                github.com/ihezebin/codex-switcher
              </a>
            </p>
            <p>
              {t.support}:{" "}
              <a
                href={SUPPORT_URL}
                onClick={async (event) => {
                  event.preventDefault();
                  try {
                    await window.codexAPI.openExternal(SUPPORT_URL);
                  } catch (error) {
                    messageApi.error((error as Error).message);
                  }
                }}
              >
                ncm.hezebin.com
              </a>
            </p>
            <p className="about-note">{t.aboutNote}</p>
          </div>
        </Modal>

        <Modal
          open={updateOpen}
          title={forceUpdate
            ? (languageMode === "zh" ? "必须升级 Codex Switcher" : "Codex Switcher update required")
            : t.upgrade}
          centered
          closable={false}
          maskClosable={false}
          keyboard={!forceUpdate}
          onCancel={() => {
            if (!forceUpdate && !downloadingUpdate) setUpdateOpen(false);
          }}
          footer={
            <Space>
              {!forceUpdate && (
                <Button
                  onClick={() => setUpdateOpen(false)}
                  disabled={downloadingUpdate}
                >
                  {t.close}
                </Button>
              )}
              {updateDownloaded ? (
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleInstallUpdate}
                >
                  {forceUpdate
                    ? (languageMode === "zh" ? "立即安装" : "Install now")
                    : t.installUpdate}
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  loading={checkingUpdate || downloadingUpdate}
                  disabled={checkingUpdate || !updateInfo?.downloadUrl}
                  onClick={handleDownloadUpdate}
                >
                  {forceUpdate
                    ? (languageMode === "zh" ? "立即升级" : "Update now")
                    : t.downloadUpdate}
                </Button>
              )}
            </Space>
          }
        >
          <div className="update-modal">
            {forceUpdate && (
              <Alert
                type="error"
                showIcon
                message={languageMode === "zh" ? "当前版本已低于最低支持版本" : "This version is no longer supported"}
                description={languageMode === "zh"
                  ? `当前版本 v${updateInfo?.currentVersion || APP_VERSION} 低于最低支持版本 v${updateInfo?.minimumVersion}。为确保配置兼容性和应用功能可以正常使用，必须升级后才能继续。`
                  : `Version v${updateInfo?.currentVersion || APP_VERSION} is below the minimum supported version v${updateInfo?.minimumVersion}. You must update to keep configuration compatibility and app features working correctly.`}
              />
            )}
            <div className="update-version-row">
              <span>{t.currentVersion}</span>
              <Tag className="update-value-tag">
                v{updateInfo?.currentVersion || APP_VERSION}
              </Tag>
            </div>
            <div className="update-version-row">
              <span>{t.latestVersion}</span>
              <Tag color="red" className="update-value-tag">
                v{updateInfo?.latestVersion || "-"}
              </Tag>
            </div>
            <div className="update-version-row">
              <span>{t.currentPlatform}</span>
              <Tag className="update-value-tag">
                {updateInfo?.platformKey || "-"}
              </Tag>
            </div>
            {updateInfo?.notes && (
              <div className="update-notes">{updateInfo.notes}</div>
            )}
            {!updateInfo?.downloadUrl && (
              <Alert
                type="warning"
                showIcon
                message={t.noDownloadUrlTitle}
                description={t.noDownloadUrlDesc}
              />
            )}
            {hasStartedUpdateDownload && (
              <Progress
                percent={updateProgress}
                status={downloadingUpdate ? "active" : undefined}
              />
            )}
            {updateDownloaded && (
              <Alert
                type="success"
                showIcon
                message={t.downloaded}
                description={t.downloadedDesc}
              />
            )}
          </div>
        </Modal>
      </AntApp>
    </ConfigProvider>
  );
}

function BrandLogo() {
  return (
    <svg className="brand-logo" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 7 4.5 12 8 17M16 7l3.5 5-3.5 5M13.5 5.5l-3 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyState({
  hasCodexConfig,
  t,
  onAdd,
  onDetect,
}: {
  hasCodexConfig: boolean;
  t: TranslationText;
  onAdd: () => void;
  onDetect: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-orbit">
        <div className="empty-icon">
          <BrandLogo />
        </div>
      </div>
      {hasCodexConfig ? (
        <>
          <Text className="eyebrow">GET STARTED</Text>
          <Title level={2}>{t.addFirstProfileTitle}</Title>
          <Text className="empty-copy">{t.addFirstProfileDesc}</Text>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={onAdd}
          >
            {t.addConfig}
          </Button>
        </>
      ) : (
        <>
          <Text className="eyebrow">CODEX NOT FOUND</Text>
          <Title level={2}>{t.codexNotFoundTitle}</Title>
          <Text className="empty-copy">{t.codexNotFoundDesc}</Text>
          <Button
            type="primary"
            size="large"
            icon={<ReloadOutlined />}
            onClick={onDetect}
          >
            {t.detectCodex}
          </Button>
        </>
      )}
    </div>
  );
}

export default App;
