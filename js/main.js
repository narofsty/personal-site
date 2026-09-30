/* ==========================================================================
   页面交互：主题切换 / 打字机 / 滚动淡入 / 移动端菜单 / 页脚年份
   全部原生 JS，无依赖、无需打包。
   ========================================================================== */

/* ↓↓↓ 首屏轮播的身份标签，改成你自己的职位或身份 ↓↓↓ */
const TITLES = ['前端开发工程师', '全栈爱好者', '终身学习者'];

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

/* ---------- 2. 首屏打字机效果 ---------- */
(function initTyping() {
  const el = document.getElementById('typed');
  if (!el) return;

  // 用户在系统里关掉了动画，就直接显示第一个标签
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = TITLES[0];
    return;
  }

  let titleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const title = TITLES[titleIndex];
    el.textContent = title.slice(0, charIndex);

    if (!deleting) {
      if (charIndex < title.length) {
        charIndex += 1;
        setTimeout(tick, 110);
      } else {
        deleting = true;
        setTimeout(tick, 1600); // 显示完整后停顿一下
      }
    } else {
      if (charIndex > 0) {
        charIndex -= 1;
        setTimeout(tick, 55);
      } else {
        deleting = false;
        titleIndex = (titleIndex + 1) % TITLES.length;
        setTimeout(tick, 320);
      }
    }
  }
  tick();
})();

/* ---------- 3. 滚动淡入 ---------- */
(function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // 只播放一次
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i, 5) * 70}ms`; // 轻微错峰，更自然
    observer.observe(el);
  });
})();

/* ---------- 4. 移动端菜单 + 滚动时给导航加描边 ---------- */
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
})();

/* ---------- 5. 页脚年份 ---------- */
(function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();
