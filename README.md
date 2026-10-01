# 计算机学习记录站

记录我在计算机方向的学习进度、代码提交和笔记。纯静态站点，通过 GitHub Pages 免费托管。

线上地址：<https://narofsty.github.io/personal-site/>

## 页面组成

| 板块 | 内容 | 数据来源 |
| --- | --- | --- |
| 个人信息 | 姓名 + 若干邮箱 | `data/site.json`（手写） |
| 学习进度 | 每条学习线的进度条、单元清单、最近提交 | `data/tracks.json`（手写）+ 构建时抓取 |
| 提交动态 | 提交数 / 活跃天数 / 连续学习 / 热力图 / 时间线 | 构建时从 GitHub 抓取 |
| 文章 | Markdown 写完，构建时转成 HTML 内嵌到单页 | `posts/*.md`（手写） |

## 目录结构

```
personal-site/
├─ index.html          ← 【自动生成，不要直接编辑】构建产物
├─ style.css           ← 手写：全部样式
├─ main.js             ← 手写：主题切换 / 滚动淡入 / 单元清单 / 文章展开
├─ build.mjs           ← 构建脚本
├─ package.json        ← 只有 build 命令和 2 个依赖
├─ data/
│  ├─ site.json        ← 姓名、邮箱、站点标题        【你改】
│  ├─ tracks.json      ← 学习线与单元进度            【你最常改】
│  └─ activity.json    ← 提交数据缓存，构建时自动写入
├─ posts/              ← 文章源文件（Markdown）      【你改】
└─ templates/
   └─ index.html       ← 页面骨架模板，含 {{占位符}}
```

> **重要**：`index.html` 是自动生成的。改内容请改 `data/` 或 `posts/`，直接改 `index.html` 会在下次构建时被覆盖。

## 一、本地预览

```bash
npm install     # 只需第一次
npm run build   # 生成 index.html
```

然后双击 `index.html` 就能看。想更接近线上环境，可以在本目录运行：

```bash
python -m http.server 8000     # 或用 npx serve .
```

## 二、日常怎么更新

### 1. 学完一个单元 → 改进度

打开 `data/tracks.json`，把对应单元的 `"status": "todo"` 改成 `"done"`：

```json
{ "dir": "03-Developer-Skills", "title": "03 · 开发者技能与调试", "status": "done", "date": "2026-10-05" }
```

`status` 三种取值：`done` 已完成 / `doing` 进行中 / `todo` 未开始。进度条、百分比、单元清单状态都会自动重算。

### 2. 写一篇文章 → 新建 Markdown

在 `posts/` 里新建 `2026-10-05-文章标题.md`：

````markdown
---
title: 文章标题
date: 2026-10-05
tags: [JavaScript, 笔记]
summary: 一句话摘要，会显示在列表卡片上。
---

正文用 Markdown 写。代码块会自动高亮：

```js
const add = (a, b) => a + b;
```
````

文章列表按日期倒序自动排列，二级/三级标题会自动生成「本文目录」和锚点，不需要手工维护任何清单。

### 3. 改姓名或邮箱

改 `data/site.json`：

```json
{
  "name": "narofsty",
  "alias": "王小强",
  "emails": [
    { "label": "Gmail", "address": "narofsty@gmail.com" },
    { "label": "QQ", "address": "1637370940@qq.com" }
  ]
}
```

### 4. 发布

```bash
npm run build
git add .
git commit -m "更新学习进度"
git push
```

推送后约 1 分钟线上自动更新。看不到变化先按 `Ctrl + F5` 强制刷新。

## 三、提交数据是怎么抓的

构建时 `build.mjs` 会对每条学习线调一次 GitHub，抓取**只属于你自己**的提交（自动过滤掉课程官方的骨架提交）。两种方式自动选择：

| 方式 | 何时使用 | 限制 |
| --- | --- | --- |
| **atom 订阅**（默认） | 没设 Token 时 | 只能读公开仓库，每个仓库最多最近 20 条 |
| **GitHub API** | 设置了 `GITHUB_TOKEN` 时 | 每次构建消耗 1 次 API 配额（未认证 60 次/小时） |

抓取结果会缓存进 `data/activity.json`。**网络不通或抓取失败时构建不会报错**，会直接用上次的缓存。

### 要抓私有仓库的提交

```powershell
$env:GITHUB_TOKEN = "ghp_你的token"   # 只需 repo 读权限
npm run build
```

Token 只在你本机环境变量里，**不会进代码、不会进网站**。

## 四、部署到 GitHub Pages

当前用的是最简单的「分支部署」，**改完推送就自动发布**，不需要动 GitHub Actions：

1. 仓库 → `Settings` → 左侧 `Pages`
2. `Source` 选 **Deploy from a branch**
3. `Branch` 选 `main`、目录选 `/ (root)` → `Save`
4. 访问 `https://narofsty.github.io/personal-site/`

> 为什么不发布 dist/？因为这是**单页**站，构建产物就是根目录这一个 index.html，直接提交即可。

## 五、常见问题

**1. 构建报错 Cannot find package 'marked'**
先跑 `npm install`。

**2. 我改了 index.html，重新构建后改动没了**
index.html 是生成物。要改内容请改 data/ 或 posts/；要改结构请改 templates/index.html。

**3. 提交数是 0 / 显示「暂无提交数据」**
- 没设 GITHUB_TOKEN 时只能读公开仓库，私有仓库抓不到（进度板块不受影响）
- 网络不通时用缓存；缓存也没有就显示空

**4. 想再加一条学习线（比如以后加 CS61B）**
复制 data/tracks.json 里 tracks 数组的那一项，改掉 id / title / subtitle / repo 和 units 即可，页面会自动多出一张卡片。

**5. 改了内容线上没变化**
按 Ctrl + F5 强制刷新；或者忘了跑 npm run build（不构建的话 index.html 还是旧的）。

## 六、设计文档

完整的架构决策、数据模型和取舍记录在 [DESIGN.md](DESIGN.md)。
