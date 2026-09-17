# Codex Switcher

一个基于 Electron + React + Vite + Ant Design 的 macOS Codex profile 切换工具。

## 运行

```bash
yarn install
yarn dev
```

项目使用 `electron-vite` 组织主进程、预加载脚本和 React renderer，并通过项目内 `.yarnrc` 使用 `https://npmmirror.com/mirrors/electron/` 下载 Electron 二进制，避免 Yarn 安装时访问 GitHub 超时。

生产构建：

```bash
yarn typecheck
yarn build
yarn start
```

默认读写 `~/.codex`。如果 Codex 使用了其它目录，可在启动前设置 `CODEX_HOME`。

应用启动后会在 macOS 顶部菜单栏创建 Codex 图标。点击图标会显示所有 profile，点击 profile 会弹出确认框，确认后直接应用并刷新当前配置标记；双击图标可重新打开主窗口。

主窗口固定为 1600×960，不支持缩放、最大化或全屏。侧栏底部“设置”可以切换明暗主题，或打开关于说明。

## 配置格式

每个配置保存为 `$CODEX_HOME/<profile-name>.config.toml`，例如：

```toml
model = "gpt-5.5"
model_provider = "work"

[model_providers.work]
name = "work"
base_url = "https://api.example.com/v1"
wire_api = "responses"
requires_openai_auth = false
experimental_bearer_token = "sk-example"
```

表单保存会重新序列化 TOML，避免重复 key。点击“应用配置”后，profile 的 `model`、`model_provider` 和 `model_providers` 会合并写入 `$CODEX_HOME/config.toml`，其它已有顶层配置和其它 provider 会保留。自定义编辑器允许直接维护完整 TOML，并在保存前做语法校验。
