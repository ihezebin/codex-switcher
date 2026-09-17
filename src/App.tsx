import { useCallback, useEffect, useMemo, useState } from "react";
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
  Skeleton,
  Space,
  Tag,
  Typography,
  theme as antdTheme,
  message,
} from "antd";
import {
  CheckCircleFilled,
  CodeOutlined,
  CloseOutlined,
  FolderOpenOutlined,
  InfoCircleOutlined,
  LockOutlined,
  MoonOutlined,
  MinusOutlined,
  PlusOutlined,
  BorderOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
  SunOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import zhCN from "antd/locale/zh_CN";

const { Sider, Content } = Layout;
const { Text, Title } = Typography;
const REPOSITORY_URL = "http://github.com/ihezebin/codex-switcher";
const SUPPORT_URL = "https://ncm.hezebin.com";

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

function App() {
  const isWindows = window.codexAPI?.platform === "win32";
  const [profiles, setProfiles] = useState<CodexProfile[]>([]);
  const [hasCodexConfig, setHasCodexConfig] = useState(false);
  const [selectedName, setSelectedName] = useState<string>();
  const [selected, setSelected] = useState<CodexProfile>();
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [customDrawerOpen, setCustomDrawerOpen] = useState(false);
  const [customContent, setCustomContent] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialTheme);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const [messageApi, messageContextHolder] = message.useMessage({
    maxCount: 1,
  });

  const isDark = themeMode === "dark";

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    localStorage.setItem("codex-switcher-theme", themeMode);
  }, [themeMode]);

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
    refresh()
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

  const selectedIndex = useMemo(
    () => profiles.findIndex((profile) => profile.name === selectedName),
    [profiles, selectedName],
  );

  const selectProfile = (name: string) => {
    setCustomDrawerOpen(false);
    setSelectedName(name);
  };

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
        const values = await form.validateFields();
        await window.codexAPI.saveProfile({ name: selected.name, ...values });
      }
      await reloadProfile(selected.name);
      await refresh(selected.name);
      setCustomDrawerOpen(false);
      messageApi.success("配置已保存");
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) {
        messageApi.warning("请先完善必填配置");
        return;
      }
      messageApi.error(`保存失败：${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!hasCodexConfig) {
      messageApi.warning("请先安装 Codex，再创建配置");
      return;
    }
    const name = createName.trim();
    if (!name) {
      messageApi.warning("请输入配置名称");
      return;
    }
    if (
      profiles.some(
        (profile) => profile.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      messageApi.error(`配置「${name}」已经存在，请换一个名称。`);
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
      messageApi.success("已创建配置，请填写右侧内容");
    } catch (error) {
      messageApi.error(`创建失败：${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async () => {
    if (!selected) return;
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
      messageApi.success(`已应用「${selected.name}」`);
    } catch (error) {
      messageApi.error(`应用失败：${(error as Error).message}`);
    } finally {
      setApplying(false);
    }
  };

  const cancelCustom = async () => {
    if (selected) {
      try {
        await reloadProfile(selected.name);
      } catch (error) {
        messageApi.error(`读取配置失败：${(error as Error).message}`);
      }
    }
    setCustomDrawerOpen(false);
  };

  const openCustomEditor = async () => {
    if (!selected) return;
    try {
      await reloadProfile(selected.name);
    } catch (error) {
      messageApi.error(`读取配置失败：${(error as Error).message}`);
      return;
    }
    setCustomDrawerOpen(true);
  };

  const handleCustomContentChange = (value: string) => {
    setCustomContent(value);
  };

  const handleOpenFolder = async () => {
    try {
      const error = await window.codexAPI.openFolder();
      if (error) {
        messageApi.error(error);
        return;
      }
      messageApi.success("已打开 Codex 配置目录");
      setSettingsOpen(false);
    } catch (error) {
      messageApi.error((error as Error).message);
    }
  };

  const hasProfiles = hasCodexConfig && profiles.length > 0;

  const handleDetectCodex = async () => {
    try {
      setLoading(true);
      await refresh();
      messageApi.success("Codex 配置状态已重新检测");
    } catch (error) {
      messageApi.error(`检测失败：${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaximize = async () => {
    try {
      const nextValue = await window.codexAPI.toggleMaximizeWindow();
      setIsMaximized(nextValue);
    } catch (error) {
      messageApi.error(`窗口操作失败：${(error as Error).message}`);
    }
  };

  const settingsContent = (
    <div className="settings-popover">
      <div className="settings-popover-title">应用设置</div>
      <div className="settings-row">
        <Button
          type="text"
          className="settings-theme-button"
          icon={isDark ? <MoonOutlined /> : <SunOutlined />}
          onClick={() => setThemeMode(isDark ? "light" : "dark")}
        >
          {isDark ? "切换为亮主题" : "切换为暗主题"}
        </Button>
      </div>
      {hasCodexConfig && (
        <Button
          type="text"
          className="settings-about-button settings-folder-button"
          icon={<FolderOpenOutlined />}
          onClick={handleOpenFolder}
        >
          打开Codex配置目录
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
        关于 Codex Switcher
      </Button>
    </div>
  );

  const antThemeConfig = {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: "#1677ff",
      fontFamily: '"Xiaolai SC", "PingFang SC", "Hiragino Sans GB", sans-serif',
      borderRadius: 8,
    },
  };

  if (loading) {
    return (
      <ConfigProvider locale={zhCN} theme={antThemeConfig}>
        <div className="loading-screen">
          <Skeleton active paragraph={{ rows: 5 }} />
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={zhCN} theme={antThemeConfig}>
      <AntApp>
        {messageContextHolder}
        <Layout className="app-shell">
          <div className="window-chrome">
            <div className="window-title">Codex Switcher</div>
            {isWindows && (
              <div className="window-controls" aria-label="窗口控制">
                <button
                  type="button"
                  className="window-control"
                  aria-label="最小化"
                  title="最小化"
                  onClick={() => window.codexAPI.minimizeWindow()}
                >
                  <MinusOutlined />
                </button>
                <button
                  type="button"
                  className="window-control"
                  aria-label={isMaximized ? "还原" : "最大化"}
                  title={isMaximized ? "还原" : "最大化"}
                  onClick={toggleMaximize}
                >
                  <BorderOutlined />
                </button>
                <button
                  type="button"
                  className="window-control window-control-close"
                  aria-label="关闭"
                  title="关闭"
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
                <Button
                  type="text"
                  className="settings-button empty-settings-button"
                  icon={<SettingOutlined />}
                >
                  设置
                </Button>
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
                    <Text className="eyebrow">YOUR WORKSPACE</Text>
                    <Title level={4}>配置列表</Title>
                  </div>
                  <Button
                    className="square-button"
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateOpen(true)}
                  />
                </div>
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
                          <Text className="profile-name">{profile.name}</Text>
                          <Text className="profile-model">
                            {profile.model || "未填写模型"}
                          </Text>
                        </div>
                      </div>
                      {profile.active && (
                        <CheckCircleFilled className="active-icon" />
                      )}
                    </List.Item>
                  )}
                />
                <div className="sider-footer">
                  <Popover
                    placement="topLeft"
                    trigger="click"
                    open={settingsOpen}
                    onOpenChange={setSettingsOpen}
                    content={settingsContent}
                  >
                    <Button
                      type="text"
                      className="settings-button"
                      icon={<SettingOutlined />}
                    >
                      设置
                    </Button>
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
                  onAdd={() => setCreateOpen(true)}
                  onDetect={handleDetectCodex}
                />
              ) : (
                <div className="detail-panel">
                  {detailLoading || !selected ? (
                    <Skeleton active paragraph={{ rows: 7 }} />
                  ) : (
                    <>
                      <div className="detail-header">
                        <div>
                          <Text className="eyebrow">
                            PROFILE {String(selectedIndex + 1).padStart(2, "0")}
                          </Text>
                          <Title level={2}>{selected.name}</Title>
                          <Text className="detail-description">
                            独立的 Model、Base URL 和 API Key 配置
                          </Text>
                        </div>
                        {selected.active && (
                          <Tag
                            className="active-tag"
                            icon={<CheckCircleFilled />}
                          >
                            当前已应用
                          </Tag>
                        )}
                      </div>

                      {selected.error && (
                        <Alert
                          type="error"
                          showIcon
                          message="该配置文件无法解析"
                          description={selected.error}
                        />
                      )}

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
                            rules={[
                              {
                                required: true,
                                whitespace: true,
                                message: "请输入 Base URL",
                              },
                              { type: "url", message: "请输入有效的 URL" },
                            ]}
                          >
                            <Input
                              size="large"
                              placeholder="https://api.example.com/v1"
                              prefix={<span className="input-prefix">↗</span>}
                            />
                          </Form.Item>
                          <Form.Item
                            name="apiKey"
                            label="API Key"
                            rules={[
                              {
                                required: true,
                                whitespace: true,
                                message: "请输入 API Key",
                              },
                            ]}
                          >
                            <Input.Password
                              size="large"
                              placeholder="sk-••••••••••••••••"
                              prefix={<LockOutlined />}
                            />
                          </Form.Item>
                          <Form.Item name="model" label="Model（可选）">
                            <Input
                              size="large"
                              placeholder="例如：gpt-5.5"
                              prefix={<SettingOutlined />}
                            />
                          </Form.Item>
                          <Form.Item
                            name="reviewModel"
                            label="Review Model（可选）"
                          >
                            <Input
                              size="large"
                              placeholder="例如：gpt-5.5"
                              prefix={<SettingOutlined />}
                            />
                          </Form.Item>
                        </Form>
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
                            保存配置
                          </Button>
                          <Button
                            type="text"
                            size="large"
                            icon={<CodeOutlined />}
                            onClick={openCustomEditor}
                          >
                            自定义配置文件
                          </Button>
                        </Space>
                        <Button
                          className="apply-button"
                          size="large"
                          icon={<SwapOutlined />}
                          loading={applying}
                          onClick={handleApply}
                        >
                          应用配置
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {selected && (
                <Drawer
                  open={customDrawerOpen}
                  title={`自定义配置文件 · ${selected.name}`}
                  placement="right"
                  width="100%"
                  getContainer={false}
                  rootClassName="custom-config-drawer"
                  onClose={cancelCustom}
                  footer={
                    <Space>
                      <Button onClick={cancelCustom}>取消</Button>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={saving}
                        onClick={handleSave}
                      >
                        保存配置
                      </Button>
                    </Space>
                  }
                >
                  <div className="custom-editor drawer-editor">
                    <div className="editor-toolbar">
                      <CodeOutlined /> <span>编辑 TOML</span>
                      <Text>支持完整的 Codex 配置字段</Text>
                    </div>
                    <Input.TextArea
                      value={customContent}
                      onChange={(event) =>
                        handleCustomContentChange(event.target.value)
                      }
                      autoSize={{ minRows: 20, maxRows: 36 }}
                      spellCheck={false}
                    />
                  </div>
                </Drawer>
              )}
            </Content>
          </Layout>
        </Layout>

        <Modal
          open={createOpen}
          title="添加配置"
          okText="创建配置"
          cancelText="取消"
          confirmLoading={saving}
          onOk={handleCreate}
          onCancel={() => {
            setCreateOpen(false);
            setCreateName("");
          }}
          centered
        >
          <div className="create-modal-copy">
            为这套 Codex 配置取一个容易识别的名称。
          </div>
          <Input
            autoFocus
            size="large"
            value={createName}
            onChange={(event) => setCreateName(event.target.value)}
            onPressEnter={handleCreate}
            placeholder="例如：work、qwen、openai"
          />
        </Modal>

        <Modal
          open={aboutOpen}
          title="关于 Codex Switcher"
          centered
          footer={
            <Button type="primary" onClick={() => setAboutOpen(false)}>
              知道了
            </Button>
          }
          onCancel={() => setAboutOpen(false)}
        >
          <div className="about-content">
            <Title level={4}>功能说明</Title>
            <p>
              Codex Switcher 用于在多套 Codex Provider 配置之间快速切换。每个
              profile 都是独立的 TOML 文件，配置内容不会因为应用切换而被删除。
            </p>
            <Title level={4}>与桌面端 Codex 的支持方式</Title>
            <p>
              profile 保存在{" "}
              <code>$CODEX_HOME/&lt;profile&gt;.config.toml</code>
              。点击“应用配置”后，工具会把 profile 中的 <code>model</code>、
              <code>model_provider</code> 和 <code>model_providers</code>{" "}
              合并写入桌面端使用的 <code>$CODEX_HOME/config.toml</code>，profile
              文件继续保留。
            </p>
            <p>
              项目仓库：
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
              技术支持：
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
            <p className="about-note">
              API Key 会按当前 Codex Provider 配置写入本机 TOML
              文件，请仅在可信设备上使用。
            </p>
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
  onAdd,
  onDetect,
}: {
  hasCodexConfig: boolean;
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
          <Title level={2}>还没有配置</Title>
          <Text className="empty-copy">
            创建你的第一套 Codex profile，之后可以在不同模型和服务之间快速切换。
          </Text>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={onAdd}
          >
            添加配置
          </Button>
        </>
      ) : (
        <>
          <Text className="eyebrow">CODEX NOT FOUND</Text>
          <Title level={2}>请先安装 Codex</Title>
          <Text className="empty-copy">
            未检测到 Codex 配置文件。请先安装并启动 Codex，生成配置文件后再创建
            profile。
          </Text>
          <Button
            type="primary"
            size="large"
            icon={<ReloadOutlined />}
            onClick={onDetect}
          >
            重新检测 Codex
          </Button>
        </>
      )}
    </div>
  );
}

export default App;
