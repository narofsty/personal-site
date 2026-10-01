/* ==========================================================================
   页面交互：主题切换 / 滚动淡入 / 导航 / 单元清单 / 文章展开
   全部原生 JS，无依赖、无需打包。
   ========================================================================== */

/* ---------- 1. 主题切换（跟随系统 + 记住用户选择） ---------- */
(function initTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  root.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));

  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
})();

/* ---------- 2. 滚动淡入（由 JS 添加类，保证无 JS 时内容始终可见） ---------- */
(function initReveal() {
  const targets = document.querySelectorAll('.section__title, .card, .stat, .intro > .container > *');
  if (!targets.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) return; // 不做动画，直接显示

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // 只播放一次
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
  );

  targets.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${Math.min(i, 6) * 50}ms`;
    observer.observe(el);
  });
})();

/* ---------- 3. 导航：移动端菜单 + 滚动描边 + 当前区块高亮 ---------- */
(function initNav() {
  const nav = document.getElementById('nav');
  const links = document.getElementById('navLinks');
  const burger = document.getElementById('navBurger');

  burger?.addEventListener('click', () => links?.classList.toggle('is-open'));
  links?.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') links.classList.remove('is-open');
  });

  const onScroll = () => nav?.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // 当前区块高亮
  const anchors = [...document.querySelectorAll('.nav__links a')];
  const sections = anchors
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (!sections.length || !('IntersectionObserver' in window)) return;

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        anchors.forEach((a) => {
          a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  sections.forEach((s) => spy.observe(s));
})();

/* ---------- 4. 学习进度：展开/收起单元清单 ---------- */
(function initUnits() {
  document.querySelectorAll('.units__toggle').forEach((btn) => {
    const list = btn.nextElementSibling;
    if (!list) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      list.hidden = isOpen;
    });
  });
})();

/* ---------- 5. 文章：展开/收起全文 ---------- */
(function initPosts() {
  function setOpen(post, open) {
    const btn = post.querySelector('.post__toggle');
    const body = post.querySelector('.post__body');
    if (!btn || !body) return;

    btn.setAttribute('aria-expanded', String(open));
    body.hidden = !open;
    const text = btn.querySelector('.post__toggle-text');
    if (text) text.textContent = open ? '收起全文' : '阅读全文';
  }

  document.querySelectorAll('.post').forEach((post) => {
    const btn = post.querySelector('.post__toggle');
    btn?.addEventListener('click', () => {
      setOpen(post, btn.getAttribute('aria-expanded') !== 'true');
    });
    // 点标题区域也能展开，手感更自然
    post.querySelector('.post__head')?.addEventListener('click', () => {
      setOpen(post, btn?.getAttribute('aria-expanded') !== 'true');
    });
  });

  // 「下一篇」跳转：展开目标文章并滚动过去
  document.querySelectorAll('[data-open-post]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.getElementById(link.dataset.openPost);
      if (!target) return;
      e.preventDefault();
      setOpen(target, true);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${link.dataset.openPost}`);
    });
  });

  // 带 #post-xxx 打开页面时，自动展开并滚动到对应文章（兼容中文锚点被转义的情况）
  if (location.hash.startsWith('#post-')) {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = document.getElementById(id);
    if (target) {
      setTimeout(() => {
        setOpen(target, true);
        target.scrollIntoView({ block: 'start' });
      }, 60);
    }
  }
})();

/* ---------- 6. 页脚年份 ---------- */
(function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();
