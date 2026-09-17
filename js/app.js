(() => {
  'use strict';

  const REGIONS = ['all', 'jp', 'kr', 'us', 'eu', 'cn', 'other'];
  const T = {
    en: {
      app: 'PH Car Brands',
      title: 'Every official car brand in the Philippines.',
      sub: 'Tap a tile to open the brand’s official Philippine website.',
      search: 'Search brands',
      empty: 'No brand matches your search.',
      count: n => `${n} ${n === 1 ? 'brand' : 'brands'}`,
      foot1: 'Links checked by opening each site on 17 Sep 2026. Only brands with their own Philippine website are listed — no dealer pages.',
      foot2: 'Logos and names are trademarks of their respective owners. This is an independent directory.',
      regions: { all: 'All', jp: 'Japan', kr: 'Korea', us: 'USA', eu: 'Europe', cn: 'China', other: 'Others' },
      open: name => `Open ${name} Philippines official website (new tab)`,
      incl: 'incl.',
    },
    zh: {
      app: '菲律宾汽车品牌',
      title: '菲律宾汽车品牌官网，一站直达。',
      sub: '点一下方块，直接打开这个品牌的菲律宾官网。',
      search: '搜索品牌',
      empty: '没有找到匹配的品牌。',
      count: n => `共 ${n} 个品牌`,
      foot1: '所有链接已于 2026 年 9 月 17 日逐个打开核实。只收品牌自己的菲律宾官网，不收经销商页面。',
      foot2: '品牌名称与标志归各自所有者。本站为独立整理的导航页。',
      regions: { all: '全部', jp: '日系', kr: '韩系', us: '美系', eu: '欧系', cn: '中国品牌', other: '其他' },
      open: name => `在新标签页打开 ${name} 菲律宾官网`,
      incl: '含',
    },
  };
  const ALSO = { haval: 'Haval', tank: 'Tank', omoda: 'Omoda', jaecoo: 'Jaecoo', seres: 'Seres', aion: 'Aion', forthing: 'Forthing', baojun: 'Baojun' };

  const $ = (s, el = document) => el.querySelector(s);
  const grid = $('#grid');
  const segs = $('.segments');
  const glider = $('.seg-glider');
  const input = $('[data-testid=search]');
  const countEl = $('.count');
  const emptyEl = $('.empty');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  let brands = [];
  let lang = 'en';
  let region = 'all';
  let query = '';
  try { if (localStorage.getItem('phcb-lang') === 'zh') lang = 'zh'; } catch { /* 无存储时用默认英文 */ }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const host = url => { try { return new URL(url).hostname.replace(/^www\d?\./, ''); } catch { return ''; } };

  function tileHTML(b, i) {
    const logo = b.logo
      ? `<img data-testid="logo" src="${esc(b.logo)}" alt="" decoding="async">`
      : `<span class="wordmark" data-testid="wordmark">${esc(b.name)}</span>`;
    return `<a class="tile" data-testid="brand" data-id="${esc(b.id)}" data-region="${esc(b.region)}" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer" style="--i:${i}">
      <div class="logo">${logo}</div>
      <div class="meta">
        <div class="names"><div class="name"></div><div class="alt"></div></div>
        <span class="go" aria-hidden="true"><svg viewBox="0 0 16 16" width="12" height="12"><path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </div>
    </a>`;
  }

  function render() {
    grid.innerHTML = brands.map(tileHTML).join('');
    // 特别扁的横版标志（字标）放宽一些，否则缩得太小
    grid.querySelectorAll('img[data-testid=logo]').forEach(img => {
      const mark = () => { if (img.naturalWidth / img.naturalHeight > 4.5) img.classList.add('wide'); };
      if (img.complete) mark(); else img.addEventListener('load', mark, { once: true });
    });
    segs.insertAdjacentHTML('beforeend', REGIONS.map(r =>
      `<button class="seg" type="button" data-testid="filter-${r}" data-r="${r}" aria-pressed="${r === region}"><span class="l"></span><span class="n">${r === 'all' ? brands.length : brands.filter(b => b.region === r).length}</span></button>`).join(''));
    segs.addEventListener('click', e => {
      const btn = e.target.closest('.seg');
      if (!btn || btn.dataset.r === region) return;
      region = btn.dataset.r;
      update(true);
      btn.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' });
    });
    applyLang();
    update(false);
  }

  function applyLang() {
    const t = T[lang];
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(el => { const v = t[el.dataset.i18n]; if (typeof v === 'string') el.textContent = v; });
    input.placeholder = t.search;
    document.title = lang === 'zh' ? '菲律宾汽车品牌官网导航' : 'PH Car Brands — Official Philippine Websites';
    const lb = $('[data-testid=lang]');
    lb.querySelector('.lang-on').textContent = lang === 'zh' ? '中文' : 'EN';
    lb.querySelector('.lang-off').textContent = lang === 'zh' ? 'EN' : '中文';
    lb.setAttribute('aria-label', lang === 'zh' ? 'Switch to English' : '切换到中文');
    segs.querySelectorAll('.seg').forEach(s => { s.querySelector('.l').textContent = t.regions[s.dataset.r]; });
    grid.querySelectorAll('.tile').forEach(a => {
      const b = byId.get(a.dataset.id);
      const primary = lang === 'zh' ? b.nameZh : b.name;
      const subs = (b.also || []).map(x => ALSO[x]).filter(Boolean);
      const secondary = [lang === 'zh' ? b.name : b.nameZh, subs.length ? `${t.incl} ${subs.join(' · ')}` : host(b.url)].join(' · ');
      a.querySelector('.name').textContent = primary;
      a.querySelector('.alt').textContent = secondary;
      a.setAttribute('aria-label', t.open(primary));
      a.title = host(b.url);
    });
    placeGlider(false);
    updateCount();
  }

  const byId = new Map();
  const matches = b => {
    if (region !== 'all' && b.region !== region) return false;
    if (!query) return true;
    const hay = [b.name, b.nameZh, ...(b.also || []).map(x => ALSO[x] || x)].join(' ').toLowerCase();
    return hay.includes(query);
  };

  function update(animate) {
    const tiles = [...grid.children];
    const first = animate && !reduce.matches ? new Map(tiles.filter(t => !t.hidden).map(t => [t, t.getBoundingClientRect()])) : null;
    let shown = 0;
    for (const t of tiles) {
      const on = matches(byId.get(t.dataset.id));
      t.hidden = !on;
      if (on) shown++;
    }
    segs.querySelectorAll('.seg').forEach(s => s.setAttribute('aria-pressed', String(s.dataset.r === region)));
    placeGlider(animate);
    emptyEl.hidden = shown > 0;
    updateCount(shown);
    if (!first) return;
    // FLIP：留下的方块从旧位置滑到新位置，新出现的淡入
    for (const t of tiles) {
      if (t.hidden) continue;
      t.style.animation = 'none';
      const a = first.get(t), z = t.getBoundingClientRect();
      if (a) {
        const dx = a.left - z.left, dy = a.top - z.top;
        if (dx || dy) t.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' });
      } else {
        t.animate([{ opacity: 0, scale: .94 }, { opacity: 1, scale: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    }
  }

  function updateCount(n) {
    if (n === undefined) n = [...grid.children].filter(t => !t.hidden).length;
    countEl.textContent = T[lang].count(n);
  }

  function placeGlider(animate) {
    const btn = segs.querySelector(`.seg[data-r="${region}"]`);
    if (!btn) return;
    if (!animate) glider.style.transition = 'none';
    glider.style.width = btn.offsetWidth + 'px';
    glider.style.transform = `translateX(${btn.offsetLeft}px)`;
    if (!animate) { void glider.offsetWidth; glider.style.transition = ''; }
  }

  // 搜索
  let raf = 0;
  input.addEventListener('input', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { query = input.value.trim().toLowerCase(); update(false); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    else if (e.key === 'Escape' && document.activeElement === input) { input.value = ''; query = ''; update(false); input.blur(); }
  });

  // 语言
  $('[data-testid=lang]').addEventListener('click', () => {
    lang = lang === 'en' ? 'zh' : 'en';
    try { localStorage.setItem('phcb-lang', lang); } catch { /* ignore */ }
    applyLang();
  });

  // 指针倾斜 + 高光（只在有鼠标的设备上）
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let pending = null, raf2 = 0;
    grid.addEventListener('pointermove', e => {
      const t = e.target.closest('.tile');
      if (!t) return;
      pending = { t, x: e.clientX, y: e.clientY };
      if (raf2) return;
      raf2 = requestAnimationFrame(() => {
        raf2 = 0;
        if (!pending || reduce.matches) return;
        const r = pending.t.getBoundingClientRect();
        const px = (pending.x - r.left) / r.width, py = (pending.y - r.top) / r.height;
        pending.t.style.setProperty('--mx', `${px * 100}%`);
        pending.t.style.setProperty('--my', `${py * 100}%`);
        pending.t.style.setProperty('--rx', `${(0.5 - py) * 7}deg`);
        pending.t.style.setProperty('--ry', `${(px - 0.5) * 7}deg`);
      });
    });
    grid.addEventListener('pointerout', e => {
      const t = e.target.closest('.tile');
      if (t && !t.contains(e.relatedTarget)) { t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg'); }
    });
  }

  addEventListener('resize', () => placeGlider(false));

  fetch('data/brands.json', { cache: 'no-cache' })
    .then(r => r.json())
    .then(data => {
      brands = data;
      brands.forEach(b => byId.set(b.id, b));
      render();
      window.__brandsReady = true;
    })
    .catch(err => {
      countEl.textContent = 'Could not load brand list. Please refresh.';
      console.warn(err);
    });
})();
