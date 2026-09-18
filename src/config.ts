import type { ValueOption } from "./components/SingleCreatableSelect";

export const REPOSITORY_URL = "http://github.com/ihezebin/codex-switcher";
export const SUPPORT_URL = "https://ncm.hezebin.com";

export const BASE_URL_OPTIONS: ValueOption[] = [
  { label: "OpenAI", value: "https://api.openai.com/v1" },
  { label: "DeepSeek", value: "https://api.deepseek.com" },
  {
    label: "Gemini",
    value: "https://generativelanguage.googleapis.com/v1beta/openai/",
  },
  { label: "Kimi", value: "https://api.moonshot.ai/v1" },
  {
    label: "Qwen",
    value: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
  {
    label: "Doubao",
    value: "https://ark.cn-beijing.volces.com/api/v3",
  },
  { label: "Grok", value: "https://api.x.ai/v1" },
  { label: "MiMo", value: "https://api.xiaomimimo.com/v1" },
];
