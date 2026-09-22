export type AppFontKey = "zhuque_fangsong" | "lxgw_wenkai" | "xiaolai";

export type AppFontOption = {
  key: AppFontKey;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  preview: string;
  family: string;
  load: () => Promise<unknown>;
};

export const DEFAULT_APP_FONT: AppFontKey = "xiaolai";
export const APP_FONT_STORAGE_KEY = "codex-switcher-font";

export const APP_FONT_OPTIONS: AppFontOption[] = [
  {
    key: "zhuque_fangsong",
    label: "朱雀仿宋",
    labelEn: "Zhuque Fangsong",
    description: "开源仿宋，适合书卷气正文",
    descriptionEn: "An open-source Fangsong face for elegant body text",
    preview: "山高水长，代码亦有温度",
    family: '"Zhuque Fangsong", "STFangsong", "FangSong", "宋体", "Songti SC", "PingFang SC", serif',
    load: () => import("@free-fonts/zhuque-fangsong/zhuque-fangsong.css"),
  },
  {
    key: "lxgw_wenkai",
    label: "霞鹜文楷",
    labelEn: "LXGW WenKai",
    description: "基于 Klee One 的开源楷体",
    descriptionEn: "An open-source Kai typeface based on Klee One",
    preview: "山高水长，代码亦有温度",
    family: '"LXGW WenKai", "Kaiti SC", "KaiTi", "楷体", "Songti SC", "PingFang SC", serif',
    load: () => Promise.all([
      import("@hanzi.pro/webfonts-lxgw-wenkai/swap/400.css"),
      import("@hanzi.pro/webfonts-lxgw-wenkai/swap/500.css"),
    ]),
  },
  {
    key: "xiaolai",
    label: "小赖字体",
    labelEn: "Xiaolai",
    description: "衍生于濑户字体的手写风简体",
    descriptionEn: "A friendly handwritten Simplified Chinese typeface",
    preview: "山高水长，代码亦有温度",
    family: '"Xiaolai SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    load: () => import("@chinese-fonts/xiaolai/dist/Xiaolai/result.css"),
  },
];

const options = Object.fromEntries(APP_FONT_OPTIONS.map((option) => [option.key, option])) as Record<AppFontKey, AppFontOption>;
const loaded = new Set<AppFontKey>();

export function getStoredAppFont(): AppFontKey {
  const stored = localStorage.getItem(APP_FONT_STORAGE_KEY);
  return stored && stored in options ? stored as AppFontKey : DEFAULT_APP_FONT;
}

export function getAppFontFamily(key: AppFontKey): string {
  return options[key].family;
}

export function setAppFontFamily(key: AppFontKey): void {
  document.documentElement.style.setProperty("--app-font-family", options[key].family);
}

export async function applyAppFont(key: AppFontKey, persist = true): Promise<void> {
  setAppFontFamily(key);
  if (persist) localStorage.setItem(APP_FONT_STORAGE_KEY, key);
  if (loaded.has(key)) return;
  await options[key].load();
  loaded.add(key);
}
