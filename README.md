# 个人主页 DEMO

一个纯静态的个人主页，用来展示个人信息。**零依赖、零构建** —— 打开浏览器就能跑，
推到 GitHub 就能通过 GitHub Pages 免费上线，不需要买服务器，也不需要域名。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `index.html` | 页面结构 + 所有文字内容 |
| `css/style.css` | 全部样式（配色变量在最上面，换主题只改那一小块） |
| `js/main.js` | 交互：深浅色切换、打字机、滚动淡入、移动端菜单 |
| `.nojekyll` | 让 GitHub Pages 跳过 Jekyll 处理，避免以后某些文件被莫名忽略 |
| `README.md` | 本文件。它不会显示在网页上，但会显示在仓库首页 |

## 一、本地预览

不用安装任何东西，两种方式任选：

1. **最简单**：直接双击 `index.html`，浏览器就会打开。
2. **更接近线上环境**（推荐）：在本文件夹打开终端，运行

   ```bash
   python -m http.server 8000
   ```

   然后浏览器访问 <http://localhost:8000>。没有 Python 就用 Node.js：`npx serve .`

   按 `Ctrl + C` 停止。

## 二、改成你自己的内容

打开 `index.html`，搜索 `↓↓↓` —— 所有需要你替换的地方我都加了注释。

| 想改什么 | 去哪里改 |
| --- | --- |
| 浏览器标签页标题、搜索简介 | `index.html` 的 `<title>` 和 `<meta name="description">` |
| 页面上显示的名字 | `index.html` 里 `<h1 class="hero__name">` |
| 左上角 logo 字母 | `index.html` 里 `class="nav__logo"` 的那个字母 |
| 头像文字 | `index.html` 里 `.avatar` 内的 `<span>` |
| 身份/职位轮播文字 | `js/main.js` 第一行的 `TITLES` 数组 |
| 「关于我」正文 | `index.html` 的 `#about` 区块 |
| 技能标签 | `index.html` 的 `#skills` 区块 |
| 项目卡片 | `index.html` 的 `#projects` 区块（复制一个 `<article>` 就能加项目） |
| 邮箱 / GitHub / 社交链接 | `index.html` 的 `#contact` 区块里的 `<a href="...">` |
| 配色 | `css/style.css` 顶部的 `:root`（浅色）和 `[data-theme="dark"]`（深色） |

> **换成真实头像照片**：把照片命名为 `avatar.jpg` 放到和 `index.html` 同一层，
> 然后把 `<div class="avatar" aria-hidden="true"><span>王</span></div>`
> 换成 `<div class="avatar"><img src="avatar.jpg" alt="我的头像"></div>`。

## 三、部署到 GitHub Pages（手把手）

### 第 0 步：注册 GitHub

已经有账号就跳过。没有就去 <https://github.com/signup> 注册。
记住你的**用户名**，它决定你最终的网址。

### 第 1 步：在 GitHub 上新建仓库

1. 点右上角 `+` → `New repository`。
2. `Repository name` 填 `personal-site`（或任意英文名）。
3. 可见性选 **Public**（公开仓库用免费的 Pages 最省事）。
4. **不要**勾选 `Add a README file` / `.gitignore` / `license` —— 本地已经有文件了，
   勾了反而会产生冲突。
5. 点 `Create repository`。

### 第 2 步：把本地代码推上去

本地这个文件夹已经是 git 仓库、也已经提交好了。你只需关联远程仓库并推送：

```bash
# 把 你的用户名 换成你自己的 GitHub 用户名
git remote add origin https://github.com/你的用户名/personal-site.git
git branch -M main
git push -u origin main
```

第一次推送会弹出浏览器让你登录 GitHub，跟着授权即可。

### 第 3 步：打开 Pages

1. 进入仓库页面 → 上方 `Settings`。
2. 左侧菜单找到 `Pages`。
3. `Source` 选 **Deploy from a branch**。
4. `Branch` 选 `main`，右边目录选 `/ (root)`，点 `Save`。
5. 等 1～3 分钟，刷新这个设置页，顶部会出现绿色提示和你的网址。

### 第 4 步：访问你的网站

- 仓库名是 `你的用户名.github.io` → 网址 `https://你的用户名.github.io`
- 其他仓库名 → 网址 `https://你的用户名.github.io/personal-site/`

## 四、以后怎么更新内容

改完文件后，在本文件夹执行三行：

```bash
git add .
git commit -m "更新个人信息"
git push
```

推送后约 1 分钟线上自动更新。看不到变化就先按 `Ctrl + F5` 强制刷新。

## 五、常见问题

**1. 打开网址是 404**

- Pages 首次部署要等 1～3 分钟，先等等。
- 确认 `Settings → Pages` 里分支是 `main`、目录是 `/ (root)`。
- 确认 `index.html` 在仓库**根目录**，而不是在某个子文件夹里。
- 网址里的仓库名要和仓库实际名字大小写完全一致。

**2. 页面出来了但没有样式，或按钮点了没反应**

- 说明 `css/style.css` 或 `js/main.js` 没传上去。去仓库首页确认这些文件存在，
  且目录层级和 `index.html` 里写的一致。
- 文件名区分大小写：`Style.css` 不等于 `style.css`。

**3. 改完内容线上没变化**

- 浏览器缓存，用 `Ctrl + F5` 强制刷新，或用无痕窗口打开。
- 去仓库 `Settings → Pages` 看最近一次部署时间。

**4. 中文显示成乱码**

- 保存文件时选择 **UTF-8** 编码（VS Code 右下角可以切换并保存）。

**5. push 时一直认证失败**

- GitHub 已不支持用账号密码推送，需要用 **Personal Access Token**：
  `GitHub → 头像 → Settings → Developer settings → Personal access tokens → Tokens (classic)
  → Generate new token`，勾选 `repo` 权限，生成后复制那串字符，
  **在提示输入密码时粘贴它**。
- 更省事的办法：装 [GitHub Desktop](https://desktop.github.com/)，
  点几下就能推送，完全不用折腾 token。

**6. 想要更短的网址**

- 把仓库改名为 `你的用户名.github.io`（必须完全一致），再回 `Settings → Pages`
  保存一次，网址就变成 `https://你的用户名.github.io`。

**7. 想绑定自己的域名**

- 买个域名，在仓库 `Settings → Pages → Custom domain` 填进去，
  然后按提示去域名商那里添加 CNAME 记录。

**8. 首屏正常，但往下滚中间是空白的**

- 中间区块的设计是「先隐藏，滚动到才淡入」。我在代码里做了兜底：
  如果 `js/main.js` 加载失败，页面会自动恢复成全部可见。
- 如果仍然空白，说明脚本加载到了但执行出错。按 `F12` 打开 Console 看红色报错，
  最常见的原因是 `js/main.js` 的路径或文件名被改错了。

## 六、进阶：改用 GitHub Actions 部署（可选）

上面用的是最简单的「分支部署」。以后如果你想引入构建步骤（比如用 Vite、React、
Tailwind），就应该换成 GitHub Actions：

在仓库里新建文件 `.github/workflows/deploy.yml`（在 GitHub 网页端新建文件时，
路径里带 `/` 会自动创建文件夹），内容：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - id: deployment
        uses: actions/deploy-pages@v4
```

然后把 `Settings → Pages → Source` 从 `Deploy from a branch` 改成 **`GitHub Actions`**。

> 注意：这两件事要一起做。只加工作流文件、却仍把 Source 留在「分支部署」，
> 每次推送都会跑一个失败的部署任务。

## 七、上线前检查清单

- [ ] `index.html` 里的名字、简介、项目都换成自己的了
- [ ] 联系方式（邮箱、GitHub 链接）是自己的
- [ ] `js/main.js` 里的 `TITLES` 换成了自己的身份
- [ ] 本地双击 `index.html` 打开正常：有样式、无报错（按 F12 看 Console）
- [ ] 仓库是 Public，`index.html` 在仓库根目录
- [ ] `Settings → Pages` 已选 `main` + `/ (root)` 并保存
