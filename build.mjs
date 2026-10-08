#!/usr/bin/env node
/**
 * 构建脚本：把 data/ 和 posts/ 渲染成单页 index.html
 *
 *   npm run build
 *
 * 可选：构建前设置环境变量 GITHUB_TOKEN，就能抓到私有仓库的提交：
 *   $env:GITHUB_TOKEN = "ghp_xxx"; npm run build
 *
 * 不设 Token 也能正常工作：公开仓库走 GitHub 的 atom 订阅（无配额限制）。
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Marked } from 'marked';
import hljs from 'highlight.js';

/* ============================ 配置 ============================ */
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const p = (...s) => path.join(ROOT, ...s);

const OWNER = 'narofsty';   // 你的 GitHub 用户名（用于过滤出你自己的提交）
const MAX_TIMELINE = 30;    // 时间线最多显示多少条提交
const WEEKS = 12;           // 热力图显示最近多少周

const log = (...a) => console.log(...a);
const ok = (m) => log('  \u2713 ' + m);
const warn = (m) => log('  ! ' + m);

/* ============================ 小工具 ============================ */

const readJSON = async (rel) => JSON.parse(await readFile(p(rel), 'utf8'));

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function unescapeXml(s = '') {
  return String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** 把标题转成锚点 id，保留中文 */
function slugify(text = '') {
  const s = String(text)
    .replace(/<[^>]+>/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}\-_]/gu, '');
  return s.slice(0, 60) || 'section';
}

/** 只在本地时区取日期，避免 new Date('2026-09-24') 被当成 UTC 而偏移一天 */
function parseDateOnly(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(value);
}

const dayKey = (value) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmtDateTime = (value) => {
  const d = new Date(value);
  return `${dayKey(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/* ============================ 读取数据 ============================ */

async function loadSite() {
  const site = await readJSON('data/site.json');
  ok(`站点信息：${site.name}（${site.emails.length} 个邮箱）`);
  return site;
}

async function loadTracks() {
  const { tracks } = await readJSON('data/tracks.json');
  ok(`学习线：${tracks.length} 条`);
  return tracks;
}

/* ============================ 文章 ============================ */

/** 解析 Markdown 顶部的 front matter
 *  开头的 \uFEFF? 用来跳过 BOM：Windows 记事本、PowerShell 5.1 保存的文件会带 BOM，
 *  不跳过的话开头的 --- 匹配不到，元信息会被「静默」忽略（日期/标签/摘要全丢）。 */
function parseFrontMatter(raw) {
  const m = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return { data: {}, body: raw };

  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1];
    let value = kv[2].trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      data[key] = value.replace(/^["']|["']$/g, '');
    }
  }
  return { data, body: m[2] };
}

/** Markdown → HTML，代码高亮 + 标题锚点（锚点带文章前缀，避免多篇文章 id 撞车） */
function renderMarkdown(body, idPrefix) {
  const md = new Marked({ gfm: true, breaks: false });

  md.use({
    renderer: {
      code(tokenOrCode, legacyLang) {
        const isToken = tokenOrCode && typeof tokenOrCode === 'object';
        const raw = isToken ? tokenOrCode.text : tokenOrCode;
        const info = (isToken ? tokenOrCode.lang : legacyLang) || '';
        const lang = String(info).trim().split(/\s+/)[0].toLowerCase();

        let inner;
        if (lang && hljs.getLanguage(lang)) {
          inner = hljs.highlight(raw, { language: lang, ignoreIllegals: true }).value;
        } else {
          inner = escapeHtml(raw);
        }
        const cls = lang ? `hljs language-${lang}` : 'hljs';
        return `<pre class="code" data-lang="${escapeHtml(lang || 'text')}"><code class="${cls}">${inner}</code></pre>\n`;
      },

      heading(tokenOrText, legacyDepth) {
        const isToken = tokenOrText && typeof tokenOrText === 'object';
        const depth = isToken ? tokenOrText.depth : legacyDepth;
        let text;
        try {
          text = isToken && tokenOrText.tokens ? this.parser.parseInline(tokenOrText.tokens) : tokenOrText.text ?? tokenOrText;
        } catch {
          text = isToken ? tokenOrText.text : tokenOrText;
        }
        const id = `${idPrefix}--${slugify(text)}`;
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      },
    },
  });

  return md.parse(body);
}

/** 从渲染结果里抽出 h2/h3，生成目录 */
function buildToc(html) {
  const items = [];
  for (const m of html.matchAll(/<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)) {
    items.push({ level: Number(m[1]), id: m[2], text: m[3].replace(/<[^>]+>/g, '') });
  }
  if (items.length < 2) return '';
  const lis = items
    .map((it) => `<li class="toc__item toc__item--h${it.level}"><a href="#${it.id}">${it.text}</a></li>`)
    .join('\n        ');
  return `<details class="toc"><summary>本文目录</summary>\n      <ol>\n        ${lis}\n      </ol>\n    </details>`;
}

async function loadPosts() {
  const dir = p('posts');
  let files = [];
  try {
    files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith('.md'));
  } catch {
    warn('没有 posts/ 目录，跳过文章');
    return [];
  }

  const posts = [];
  for (const file of files) {
    const raw = await readFile(path.join(dir, file), 'utf8');
    const { data, body } = parseFrontMatter(raw);
    const title = data.title || file.replace(/\.md$/i, '');
    const slug = slugify(title);
    const html = renderMarkdown(body, slug);
    posts.push({
      file,
      title,
      slug,
      date: data.date ? parseDateOnly(data.date) : null,
      tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
      summary: data.summary || '',
      html,
      toc: buildToc(html),
    });
  }

  posts.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  ok(`文章：${posts.length} 篇`);
  return posts;
}

/* ============================ 提交数据 ============================ */

const GH_HEADERS = () => {
  const h = { 'User-Agent': 'personal-site-build', Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
};

/** 方式一：GitHub API（需要 Token，可读私有仓库） */
async function fetchCommitsApi(repo, author) {
  const url = `https://api.github.com/repos/${repo}/commits?author=${encodeURIComponent(author)}&per_page=100`;
  const res = await fetch(url, { headers: GH_HEADERS(), signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`API HTTP ${res.status}`);
  const json = await res.json();
  return json.map((c) => ({
    sha: c.sha.slice(0, 7),
    message: String(c.commit.message || '').split('\n')[0].trim(),
    date: new Date(c.commit.author.date).toISOString(),
    url: c.html_url,
  }));
}

/** 方式二：atom 订阅（无需 Token、无配额，但只能读公开仓库、最多 20 条） */
async function fetchCommitsAtom(repo, author) {
  const res = await fetch(`https://github.com/${repo}/commits.atom`, {
    headers: { 'User-Agent': 'personal-site-build' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`atom HTTP ${res.status}`);
  const xml = await res.text();

  const out = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const entry = m[1];
    const pick = (re) => (re.exec(entry)?.[1] ?? '');
    const name = unescapeXml(pick(/<author>\s*<name>([\s\S]*?)<\/name>/)).trim();
    if (name !== author) continue;   // 过滤掉课程官方的骨架提交

    const message = unescapeXml(pick(/<title[^>]*>([\s\S]*?)<\/title>/)).replace(/\s+/g, ' ').trim();
    const date = pick(/<updated>([\s\S]*?)<\/updated>/).trim();
    const url = pick(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/);
    const sha = (/commit\/([0-9a-f]{7,40})/.exec(url)?.[1] ?? '').slice(0, 7);

    out.push({ sha, message, date: new Date(date).toISOString(), url });
  }
  return out;
}

/** 抓取 + 缓存：抓不到就用上次的缓存，保证构建不会失败 */
async function collectActivity(tracks) {
  let cache = { repos: {} };
  try {
    cache = await readJSON('data/activity.json');
  } catch {
    warn('还没有 data/activity.json，首次构建');
  }

  const result = { generatedAt: new Date().toISOString(), repos: {} };

  for (const track of tracks) {
    const repo = track.repo;
    if (!repo) continue;
    const author = track.author || OWNER;
    let commits = null;
    let source = 'cache';

    if (process.env.GITHUB_TOKEN) {
      try {
        commits = await fetchCommitsApi(repo, author);
        source = 'api';
      } catch (e) {
        warn(`${repo} API 抓取失败（${e.message}），改用 atom 订阅`);
      }
    }
    if (!commits) {
      try {
        commits = await fetchCommitsAtom(repo, author);
        source = 'atom';
      } catch (e) {
        warn(`${repo} atom 抓取失败（${e.message}）`);
      }
    }

    if (commits && commits.length) {
      commits.sort((a, b) => new Date(b.date) - new Date(a.date));
      result.repos[repo] = { source, commits };
      ok(`${repo}：抓到 ${commits.length} 条你的提交（来源 ${source}）`);
    } else if (cache.repos?.[repo]?.commits?.length) {
      result.repos[repo] = { ...cache.repos[repo], source: 'cache' };
      warn(`${repo}：使用上次缓存的 ${cache.repos[repo].commits.length} 条提交`);
    } else {
      result.repos[repo] = { source: 'none', commits: [] };
      warn(`${repo}：没有任何提交数据`);
    }
  }

  return result;
}

/** 统计：总数、活跃天数、连续天数、按日聚合 */
function computeStats(activity) {
  const all = [];
  for (const [repo, info] of Object.entries(activity.repos)) {
    for (const c of info.commits) all.push({ ...c, repo });
  }
  all.sort((a, b) => new Date(b.date) - new Date(a.date));

  const byDay = new Map();
  for (const c of all) {
    const k = dayKey(c.date);
    byDay.set(k, (byDay.get(k) || 0) + 1);
  }

  // 连续学习天数：从最近一次提交那天往前数
  let streak = 0;
  if (all.length) {
    const cursor = parseDateOnly(dayKey(all[0].date));
    while (byDay.has(dayKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  return {
    commits: all,
    total: all.length,
    activeDays: byDay.size,
    streak,
    lastDate: all.length ? dayKey(all[0].date) : null,
    firstDate: all.length ? dayKey(all[all.length - 1].date) : null,
    byDay,
  };
}

/* ============================ 渲染片段 ============================ */

const renderEmails = (site) => site.emails.map((e) => `<li class="email">
          <span class="email__label">${escapeHtml(e.label)}</span>
          <a class="email__addr" href="mailto:${escapeHtml(e.address)}">${escapeHtml(e.address)}</a>
        </li>`).join('\n        ');

const STATUS_TEXT = { done: '已完成', doing: '进行中', todo: '未开始' };

function renderTracks(tracks, activity) {
  if (!tracks.length) return '<p class="empty">还没有配置学习线，去 data/tracks.json 添加。</p>';

  return tracks.map((track) => {
    const units = track.units || [];
    const done = units.filter((u) => u.status === 'done').length;
    const doing = units.filter((u) => u.status === 'doing').length;
    const total = units.length || 1;
    const pctDone = (done / total) * 100;
    const pctDoing = (doing / total) * 100;

    const repoInfo = activity.repos[track.repo];
    const latest = repoInfo?.commits?.[0];
    const foot = latest
      ? `最近提交 ${dayKey(latest.date).slice(5)} · ${escapeHtml(latest.message.slice(0, 40))}`
      : '暂无提交数据';

    const unitLis = units.map((u) => {
      const status = ['done', 'doing', 'todo'].includes(u.status) ? u.status : 'todo';
      const date = u.date ? `<span class="unit__date">${escapeHtml(u.date)}</span>` : '';
      return `<li class="unit unit--${status}">
            <span class="unit__dot" aria-hidden="true"></span>
            <span class="unit__title">${escapeHtml(u.title || u.dir || '')}</span>
            <span class="unit__status">${STATUS_TEXT[status]}</span>
            ${date}
          </li>`;
    }).join('\n          ');

    return `<article class="track card">
        <header class="track__head">
          <div>
            <h3 class="track__title">${escapeHtml(track.title)}</h3>
            <p class="track__sub">${escapeHtml(track.subtitle || '')}</p>
          </div>
          ${track.repo ? `<a class="track__repo" href="https://github.com/${track.repo}" target="_blank" rel="noopener">GitHub ↗</a>` : ''}
        </header>

        <div class="progress" role="img" aria-label="${done} / ${units.length} 个单元已完成">
          <div class="progress__track">
            <span class="progress__done" style="width:${pctDone.toFixed(2)}%"></span>
            <span class="progress__doing" style="width:${pctDoing.toFixed(2)}%"></span>
          </div>
          <p class="progress__text">
            <strong>${done}</strong> / ${units.length} 完成${doing ? ` · ${doing} 进行中` : ''}
            <span class="progress__pct">${Math.round(pctDone)}%</span>
          </p>
        </div>

        ${units.length ? `<button class="units__toggle" type="button" aria-expanded="false">
          单元清单（${units.length}）
          <span class="units__caret" aria-hidden="true">▾</span>
        </button>
        <ul class="units" hidden>
          ${unitLis}
        </ul>` : ''}

        <footer class="track__foot">${foot}</footer>
      </article>`;
  }).join('\n      ');
}

function renderStats(stats) {
  if (!stats.total) {
    return '<p class="empty">暂无提交数据（可能是网络不通，或仓库是私有的且没有提供 GITHUB_TOKEN）。</p>';
  }
  const cells = [
    { v: stats.total, l: '提交（已采集）' },
    { v: stats.activeDays, l: '活跃天数' },
    { v: stats.streak, l: '连续学习' },
    { v: stats.lastDate?.slice(5) || '-', l: '最近提交' },
  ];
  return cells.map((c) => `<div class="stat">
          <strong class="stat__num">${c.v}</strong>
          <span class="stat__label">${c.l}</span>
        </div>`).join('\n        ');
}

function renderHeatmap(stats) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 从 (WEEKS-1) 周前的周日开始，铺满 WEEKS 列 × 7 行
  const start = new Date(today);
  start.setDate(start.getDate() - (today.getDay() + (WEEKS - 1) * 7));

  const cells = [];
  const weekLabels = [];
  let lastMonth = -1;

  // 按「周」铺：一列一周，7 行对应周日到周六
  for (let w = 0; w < WEEKS; w++) {
    let weekMonth = -1;
    let weekLabel = '';

    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(day.getDate() + w * 7 + d);

      const key = dayKey(day);
      const count = stats.byDay.get(key) || 0;
      const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 7 ? 3 : 4;
      const isFuture = day > today;

      cells.push(`<span class="hm__cell" data-level="${isFuture ? 'empty' : level}" title="${key}：${count} 次提交"></span>`);

      if (d === 0) {
        weekMonth = day.getMonth();
        weekLabel = `${weekMonth + 1}月`;
      }
    }

    // 只在「月份第一次出现」的那一列打标签；比较的是月份本身，不是上一个标签
    const show = weekMonth !== lastMonth;
    if (show) lastMonth = weekMonth;
    weekLabels.push(show ? weekLabel : '');
  }

  const legend = [0, 1, 2, 3, 4]
    .map((l) => `<span class="hm__cell hm__cell--legend" data-level="${l}"></span>`)
    .join('');

  return `<div class="hm">
          <div class="hm__months">${weekLabels.map((m) => `<span>${m}</span>`).join('')}</div>
          <div class="hm__grid">${cells.join('')}</div>
          <div class="hm__legend"><span class="hm__legend-label">少</span>${legend}<span class="hm__legend-label">多</span></div>
        </div>
        <p class="hm__note">最近 ${WEEKS} 周 · 已采集 ${stats.total} 条提交</p>`;
}

function renderTimeline(stats) {
  if (!stats.commits.length) return '<p class="empty">暂无提交可以显示。</p>';

  const items = stats.commits.slice(0, MAX_TIMELINE).map((c) => {
    const repoShort = c.repo.split('/').pop();
    return `<li class="tl__item">
            <time class="tl__date" datetime="${dayKey(c.date)}">${dayKey(c.date).slice(5)}</time>
            <span class="tl__msg">${escapeHtml(c.message || '(无提交信息)')}</span>
            <a class="tl__repo" href="${escapeHtml(c.url)}" target="_blank" rel="noopener" title="${escapeHtml(c.repo)} ${c.sha}">${escapeHtml(repoShort)} ${c.sha} ↗</a>
          </li>`;
  }).join('\n          ');

  const more = stats.total > MAX_TIMELINE
    ? `<p class="tl__more">只显示最近 ${MAX_TIMELINE} 条，共采集到 ${stats.total} 条</p>` : '';

  return `<ol class="tl">
          ${items}
        </ol>
        ${more}`;
}

function renderPosts(posts) {
  if (!posts.length) {
    return '<p class="empty">还没有文章。在 posts/ 目录新建一个 .md 文件，然后重新构建即可。</p>';
  }

  return posts.map((post, i) => {
    const next = posts[i + 1];
    const meta = [
      post.date ? dayKey(post.date) : '',
      post.tags.length ? post.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('') : '',
    ].filter(Boolean).join(' · ');

    const nextLink = next
      ? `<a class="post__next" href="#post-${next.slug}" data-open-post="post-${next.slug}">下一篇：${escapeHtml(next.title)} →</a>`
      : '';

    return `<article class="post card" id="post-${post.slug}">
        <div class="post__head">
          <h3 class="post__title">${escapeHtml(post.title)}</h3>
          <p class="post__meta">${meta}</p>
          ${post.summary ? `<p class="post__summary">${escapeHtml(post.summary)}</p>` : ''}
        </div>
        <button class="btn post__toggle" type="button" aria-expanded="false" aria-controls="body-${post.slug}">
          <span class="post__toggle-text">阅读全文</span>
        </button>
        <div class="post__body" id="body-${post.slug}" hidden>
          ${post.toc}
          <div class="markdown">
${post.html}
          </div>
          ${nextLink}
        </div>
      </article>`;
  }).join('\n      ');
}

/* ============================ 主流程 ============================ */

async function main() {
  log('\n构建开始 · ' + fmtDateTime(new Date()));

  const site = await loadSite();
  const tracks = await loadTracks();
  const posts = await loadPosts();

  log('  抓取提交数据…');
  const activity = await collectActivity(tracks);
  const stats = computeStats(activity);

  // 写回缓存（供下次离线构建使用）
  await writeFile(p('data/activity.json'), JSON.stringify({
    generatedAt: activity.generatedAt,
    repos: activity.repos,
  }, null, 2) + '\n', 'utf8');

  const template = await readFile(p('templates/index.html'), 'utf8');
  const values = {
    TITLE: `${site.title} · ${site.name}`,
    NAME: escapeHtml(site.name),
    ALIAS: escapeHtml(site.alias || ''),
    DESCRIPTION: escapeHtml(site.description || ''),
    EMAILS: renderEmails(site),
    TRACKS: renderTracks(tracks, activity),
    STATS: renderStats(stats),
    HEATMAP: renderHeatmap(stats),
    TIMELINE: renderTimeline(stats),
    POSTS: renderPosts(posts),
    GENERATED_AT: fmtDateTime(activity.generatedAt),
  };

  let html = template.replace(/\{\{([A-Z_]+)\}\}/g, (full, key) => (
    key in values ? values[key] : full
  ));

  const leftover = [...html.matchAll(/\{\{[A-Z_]+\}\}/g)].map((m) => m[0]);
  if (leftover.length) warn('模板里有未替换的占位符：' + [...new Set(leftover)].join(', '));

  const banner = `<!-- 本文件由 build.mjs 自动生成，请勿直接编辑。\n     要改内容请改 data/site.json、data/tracks.json 或 posts/*.md，然后运行 npm run build。\n     生成时间：${fmtDateTime(new Date())} -->`;
  html = html.replace('<!DOCTYPE html>', `<!DOCTYPE html>\n${banner}`);

  await writeFile(p('index.html'), html, 'utf8');

  log('构建完成');
  ok(`输出 index.html（${(Buffer.byteLength(html) / 1024).toFixed(1)} KB）`);
  ok(`统计：${tracks.length} 条学习线 / ${tracks.reduce((n, t) => n + (t.units?.length || 0), 0)} 个单元 / ${stats.total} 条提交 / ${posts.length} 篇文章`);
  log('');
}

main().catch((err) => {
  console.error('\n构建失败：' + err.message);
  console.error(err.stack);
  process.exit(1);
});
