export type LanguageMode = "zh" | "en";

type TranslationEntry = {
  zh: string;
} & Partial<Record<Exclude<LanguageMode, "zh">, string>>;

export const translations = {
  appSettings: { zh: "应用设置", en: "App Settings" },
  loadingConfig: { zh: "正在读取 Codex 配置…", en: "Reading Codex config..." },
  loadingFont: { zh: "正在加载界面字体…", en: "Loading interface fonts..." },
  finishingInit: {
    zh: "正在完成界面初始化…",
    en: "Finishing interface initialization...",
  },
  usingSystemFont: {
    zh: "正在使用系统字体完成初始化…",
    en: "Finishing with system fonts...",
  },
  switchLight: { zh: "切换为亮主题", en: "Switch to Light Theme" },
  switchDark: { zh: "切换为暗主题", en: "Switch to Dark Theme" },
  language: { zh: "语言", en: "Language" },
  languageZh: { zh: "中文", en: "中文" },
  languageEn: { zh: "English", en: "English" },
  openConfigFolder: {
    zh: "打开 Codex 配置目录",
    en: "Open Codex Config Folder",
  },
  about: { zh: "关于 Codex Switcher", en: "About Codex Switcher" },
  upgrade: { zh: "升级版本", en: "Upgrade" },
  settings: { zh: "设置", en: "Settings" },
  newVersion: { zh: "升级新版本", en: "Upgrade" },
  profileList: { zh: "配置列表", en: "Profiles" },
  refreshProfiles: { zh: "刷新配置列表", en: "Refresh profiles" },
  refreshProfilesSuccess: {
    zh: "配置列表已刷新",
    en: "Profile list refreshed",
  },
  workspace: { zh: "YOUR WORKSPACE", en: "YOUR WORKSPACE" },
  noModel: { zh: "未填写模型", en: "No model" },
  currentApplied: { zh: "当前已应用", en: "Active" },
  detailDescription: {
    zh: "独立的 Model、Base URL 和 API Key 配置",
    en: "Separate Model, Base URL, and API Key settings",
  },
  parseErrorTitle: {
    zh: "该配置文件无法解析",
    en: "This config file cannot be parsed",
  },
  baseUrlRequired: { zh: "请输入 Base URL", en: "Enter Base URL" },
  invalidUrl: { zh: "请输入有效的 URL", en: "Enter a valid URL" },
  apiKeyRequired: { zh: "请输入 API Key", en: "Enter API Key" },
  modelRequired: { zh: "请输入 Model", en: "Enter Model" },
  profileNameRequired: { zh: "请输入配置名称", en: "Enter a profile name" },
  baseUrlPlaceholder: {
    zh: "输入或选择 Base URL，例如：https://api.example.com/v1",
    en: "Enter or select a Base URL, e.g. https://api.example.com/v1",
  },
  apiKeyPlaceholder: { zh: "sk-••••••••••••••••", en: "sk-••••••••••••••••" },
  modelPlaceholder: {
    zh: "输入或点击加载模型可选择已支持的模型列表",
    en: "Load models to choose from supported models",
  },
  reviewModelPlaceholder: {
    zh: "输入或选择 Review Model，例如：gpt-5.5",
    en: "Enter or select a review model, e.g. gpt-5.5",
  },
  createNamePlaceholder: {
    zh: "例如：work、qwen、openai",
    en: "e.g. work, qwen, openai",
  },
  loadModels: { zh: "加载模型", en: "Load Models" },
  saveConfig: { zh: "保存配置", en: "Save" },
  editConfigName: { zh: "重命名", en: "Rename" },
  renameConfigTitle: { zh: "编辑配置名称", en: "Edit Profile Name" },
  saveConfigName: { zh: "保存", en: "Save" },
  renameConfigSuccess: { zh: "配置名称已保存", en: "Profile name saved" },
  renameConfigFailed: { zh: "保存名称失败", en: "Failed to save name" },
  deleteConfig: { zh: "删除", en: "Delete" },
  deleteConfigTitle: { zh: "删除配置", en: "Delete Profile" },
  deleteConfigConfirm: {
    zh: "确定要删除配置「{name}」吗？该操作不可撤销。",
    en: 'Delete profile "{name}"? This cannot be undone.',
  },
  deleteConfigSuccess: { zh: "配置已删除", en: "Profile deleted" },
  deleteConfigFailed: { zh: "删除失败", en: "Delete failed" },
  customConfig: { zh: "自定义配置文件", en: "Custom Config" },
  testConnection: { zh: "测试连接", en: "Test Connection" },
  applyConfig: { zh: "应用配置", en: "Apply" },
  appliedTitle: { zh: "已应用", en: "Applied" },
  appliedDesc: {
    zh: "请重启 Codex，并新建会话后生效。",
    en: "Restart Codex and start a new session for changes to take effect.",
  },
  testSuccessTitle: {
    zh: "连接测试成功",
    en: "Connection Test Succeeded",
  },
  testFailedTitle: { zh: "连接测试失败", en: "Connection Test Failed" },
  model: { zh: "模型", en: "Model" },
  latency: { zh: "延迟", en: "Latency" },
  ok: { zh: "确定", en: "OK" },
  addConfig: { zh: "添加配置", en: "Add Profile" },
  createConfig: { zh: "创建配置", en: "Create Profile" },
  cancel: { zh: "取消", en: "Cancel" },
  configNameTip: {
    zh: "为这套 Codex 配置取一个容易识别的名称。",
    en: "Choose an easy-to-recognize name for this Codex profile.",
  },
  gotIt: { zh: "知道了", en: "OK" },
  currentVersion: { zh: "当前版本", en: "Current Version" },
  latestVersion: { zh: "最新版本", en: "Latest Version" },
  currentPlatform: { zh: "当前平台", en: "Platform" },
  close: { zh: "关闭", en: "Close" },
  downloadUpdate: { zh: "下载更新", en: "Download Update" },
  installUpdate: { zh: "安装新版", en: "Install Update" },
  optional: { zh: "可选", en: "optional" },
  custom: { zh: "自定义", en: "Custom" },
  editToml: { zh: "编辑 TOML", en: "Edit TOML" },
  fullCodexConfigSupport: {
    zh: "支持完整的 Codex 配置字段",
    en: "Full Codex config fields are supported",
  },
  customConfigTitle: { zh: "自定义配置文件", en: "Custom Config File" },
  addFirstProfileTitle: { zh: "还没有配置", en: "No profiles yet" },
  addFirstProfileDesc: {
    zh: "创建你的第一套 Codex profile，之后可以在不同模型和服务之间快速切换。",
    en: "Create your first Codex profile, then switch between models and providers quickly.",
  },
  codexNotFoundTitle: { zh: "请先安装 Codex", en: "Install Codex first" },
  codexNotFoundDesc: {
    zh: "未检测到 Codex 配置文件。请先安装并启动 Codex，生成配置文件后再创建 profile。",
    en: "No Codex config file was found. Install and start Codex first, then create a profile after the config file is generated.",
  },
  detectCodex: { zh: "重新检测 Codex", en: "Detect Codex Again" },
  minimize: { zh: "最小化", en: "Minimize" },
  restore: { zh: "还原", en: "Restore" },
  maximize: { zh: "最大化", en: "Maximize" },
  windowControls: { zh: "窗口控制", en: "Window controls" },
  windowClose: { zh: "关闭", en: "Close" },
  aboutFeatureTitle: { zh: "功能说明", en: "Overview" },
  aboutFeatureDesc: {
    zh: "Codex Switcher 用于在多套 Codex Provider 配置之间快速切换。每个 profile 都是独立的 TOML 文件，配置内容不会因为应用切换而被删除。",
    en: "Codex Switcher quickly switches between multiple Codex provider profiles. Each profile is an independent TOML file, and profile content is not deleted when switching.",
  },
  aboutSupportTitle: {
    zh: "与桌面端 Codex 的支持方式",
    en: "Desktop Codex Support",
  },
  aboutSupportDescPrefix: {
    zh: "profile 保存在",
    en: "Profiles are saved at",
  },
  aboutSupportDescSuffix: {
    zh: "。点击“应用配置”后，工具会把 profile 中的 model、model_provider 和 model_providers 合并写入桌面端使用的 $CODEX_HOME/config.toml，profile 文件继续保留。",
    en: ". After Apply, the tool merges model, model_provider, and model_providers into $CODEX_HOME/config.toml used by Desktop Codex while keeping the profile file.",
  },
  repository: { zh: "项目仓库", en: "Repository" },
  support: { zh: "技术支持", en: "Support" },
  aboutNote: {
    zh: "API Key 会按当前 Codex Provider 配置写入本机 TOML 文件，请仅在可信设备上使用。",
    en: "API keys are written to local TOML files for the selected Codex provider. Use this only on trusted devices.",
  },
  noDownloadUrlTitle: {
    zh: "当前平台还没有配置下载地址",
    en: "No download URL configured for this platform",
  },
  noDownloadUrlDesc: {
    zh: "请在 GitHub 根目录 package.json 的 codexSwitcherUpdate.downloads 中补充对应平台下载地址。",
    en: "Add the matching platform URL under codexSwitcherUpdate.downloads in package.json.",
  },
  downloaded: { zh: "下载完成", en: "Downloaded" },
  downloadedDesc: {
    zh: "点击“安装新版”会打开安装包，请按系统提示完成安装。",
    en: "Click Install Update to open the installer, then follow the system prompts.",
  },
  saveSuccess: { zh: "配置已保存", en: "Config saved" },
  fillRequiredConfig: {
    zh: "请先完善必填配置",
    en: "Complete the required fields first",
  },
  saveFailed: { zh: "保存失败", en: "Save failed" },
  installCodexFirst: {
    zh: "请先安装 Codex，再创建配置",
    en: "Install Codex before creating a profile",
  },
  duplicateProfile: {
    zh: "配置「{name}」已经存在，请换一个名称。",
    en: 'Profile "{name}" already exists. Choose another name.',
  },
  createProfileSuccess: {
    zh: "已创建配置，请填写右侧内容",
    en: "Profile created. Fill in the settings on the right.",
  },
  createFailed: { zh: "创建失败", en: "Create failed" },
  applyFailed: { zh: "应用失败", en: "Apply failed" },
  fillBaseUrlAndApiKey: {
    zh: "请先填写 Base URL 和 API Key",
    en: "Enter Base URL and API Key first",
  },
  loadedModels: { zh: "已加载 {count} 个模型", en: "Loaded {count} models" },
  noModelsReturned: {
    zh: "接口返回成功，但没有可用模型",
    en: "The request succeeded, but no models were returned",
  },
  loadModelsFailed: { zh: "加载模型失败", en: "Failed to load models" },
  readConfigFailed: { zh: "读取配置失败", en: "Failed to read config" },
  openFolderFailed: { zh: "打开目录失败", en: "Failed to open folder" },
  openFolderSuccess: {
    zh: "已打开 Codex 配置目录",
    en: "Codex config folder opened",
  },
  checkUpdateFailed: { zh: "检查更新失败", en: "Update check failed" },
  updateDownloadedSuccess: {
    zh: "安装包已下载完成",
    en: "Installer downloaded",
  },
  downloadUpdateFailed: {
    zh: "下载更新失败",
    en: "Update download failed",
  },
  installOpened: {
    zh: "已打开安装包，请按系统提示完成安装",
    en: "Installer opened. Follow the system prompts to finish.",
  },
  installOpenFailed: {
    zh: "打开安装包失败",
    en: "Failed to open installer",
  },
  detectCodexSuccess: {
    zh: "Codex 配置状态已重新检测",
    en: "Codex config status refreshed",
  },
  detectFailed: { zh: "检测失败", en: "Detection failed" },
  windowOperationFailed: {
    zh: "窗口操作失败",
    en: "Window operation failed",
  },
} as const satisfies Record<string, TranslationEntry>;

export type TranslationKey = keyof typeof translations;
export type TranslationText = Record<TranslationKey, string>;

export function translate(key: TranslationKey, language: LanguageMode) {
  return translations[key][language] || translations[key].zh;
}

export function getTranslations(language: LanguageMode): TranslationText {
  return Object.fromEntries(
    (Object.keys(translations) as TranslationKey[]).map((key) => [
      key,
      translate(key, language),
    ]),
  ) as TranslationText;
}

export function interpolate(
  template: string,
  values: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}
