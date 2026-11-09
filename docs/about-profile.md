# 关于页资料卡片

`content/spec/about.md`（外部内容仓）或 `src/content/spec/about.md`（单仓）的 frontmatter 可选择提供 `profile`。省略时继续渲染原有 Markdown 关于页；提供时在 Markdown 正文前渲染资料卡片，沿用全站的主内容列与侧栏布局。

```yaml
---
profile:
  name: Author
  eyebrow: 你好，很高兴认识你
  introduction: 一段自己的介绍。
  avatar: /images/about/avatar.jpg
  tags: [开发, 摄影]
  links:
    - label: 文章归档
      href: /archive/
  sections:
    - id: interests
      kind: text
      eyebrow: 兴趣
      title: 我在做的事情
      text: 写程序，也记录生活。
      tone: primary
---
```

`profile` 必需字段为 `name`、`eyebrow`、`introduction`、`sections`；可选 `alias`、`avatar`、`image`、`tags`、`links`。每个链接的 `label` 是作者提供的内容文案，可选 `icon` 使用现有离线图标集合。

每个 section 具有唯一 `id`、`kind` 与 `title`。`kind` 可为 `text`（文字与配图）、`list`（条目）、`tools`（工具标签）、`posters`（封面列表）、`quote`（引言）；可选 `eyebrow`、`text`、`image`、`tone`、`wide`、`items`、`link`。`tone` 支持 `surface`、`primary`、`secondary`、`tertiary`，使用主题语义颜色。`items` 的字段为 `title`、可选 `description`、`image`、`href`；末尾 `link` 使用 `label`、`href`。

图片与链接只接受站内根路径或 HTTPS URL。图片属于个人内容仓，不放入主题源码。封面在无法加载时仍保留由标题生成的文字底图、标题和原始链接。

## 渲染与双模式契约

- Schema 单一实现为 `src/utils/about-profile-schema.ts`，源码 collection 与 npm 的 `specSchema` 均引用它。原有 spec 文档不必补 frontmatter。
- `AboutProfile.astro` 纯 SSR，不增加 hydration 或浏览器持久化。文案全部来自作者内容；图标沿用 Icon 原子。
- 卡片 CSS 作为 raw 字符串只在组件实际渲染时输出到主内容内，所有选择器限定于 `.about-profile`。页面经 Swup 替换时样式随内容移除，普通关于页没有这份样式或 DOM。
- 关于页不修改共享页框或隐藏侧栏。资料卡片复用 Card 与 AccentBar 原子，采用同样的 `--card-bg`、标题阶梯、间距与圆角；tone 仅用于小面积标题强调，不铺满彩色背景。
- 不从 `process.cwd()` 读取主题文件；数据由 Astro collections 读取，CSS 由 Vite 内联，因此源码与 npm 模式采用同一渲染路径。

验证：`node --test tests/about-profile.test.mjs`、Astro check、type-check、check:package-manifest；浏览器运行 `tests/site/about-profile.spec.ts` 和 a11y 的关于页分片。
