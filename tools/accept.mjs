// 菲律宾汽车品牌官网聚合站 验收脚本 —— 判卷标准，冻结，任何人不许改（改了就算不合格）。
// 用法（在 D:\blender\PHCarBrands 下）：
//   node tools/accept.mjs            本地验收：自带静态服务器（站点挂在 /ph-car-brands/ 子路径下，和 GitHub Pages 一样）
//                                    ＋ 用真浏览器逐个打开 data/brands.json 里的官网
//   node tools/accept.mjs --url https://jyb635050-ai.github.io/ph-car-brands/
//                                    线上验收：页面检查＋线上 data/brands.json 必须与本地逐字节相同（不重复逐个开官网）
//   node tools/accept.mjs --prove    反向验证：换成一组实测的坏链接、并去掉毛玻璃，检查器必须全部判不合格
//                                    正确拒绝 → 退出码 1；有坏链接或无毛玻璃被放过 → 退出码 2
// 全部 PASS 退出码 0；任一 FAIL 退出码 1。截图写到 shots/。
//
// ───── 数据契约 ─────
// data/brands.json   数组，每项：
//   id      小写字母数字短横线，唯一；CANDIDATES 里有的品牌必须用那个 id
//   name    英文品牌名（非空）；nameZh 中文名（含汉字）
//   region  jp|kr|us|eu|cn|other；CANDIDATES 里有的必须与之一致（MG 归 cn：领导原话把名爵列为中国品牌）
//   url     该品牌「菲律宾专属官网」首页。领导 2026-09-17 裁决：经销商页面、没有菲律宾频道的全球官网都不收
//           判定：最终落地网址是 .ph 域名／域名含 philippines 或以 ph、phil 结尾／路径含 ph、en-ph、philippines 这类菲律宾频道
//   logo    "assets/logos/<文件名>"（本地文件），或 null（页面显示文字字标）
//   also    可选：同一个官网覆盖的子品牌 id 数组（如 gwm 的 haval、tank）
//   offnet  可选，只许给「本机公司网络打不开」的站：{ "why": "filter|botwall|neterr", "evidence": "https://第三方页面，写明这个网址是该品牌菲律宾官网" }
// data/excluded.json 数组，每项 { id, reason(≥10 字符), tried: ["试过的网址", …](至少 1 个) }
// CANDIDATES 里每个 id 必须恰好有一个去向：brands 的 id ／ 某项的 also ／ excluded 的 id
//
// ───── 页面契约（index.html）─────
// window.__brandsReady      数据渲染完成后置 true
// a[data-testid=brand]      每个品牌一个方块；data-id=品牌 id；href 与数据 url 完全相同；target=_blank；rel 含 noopener
//                           内含 img[data-testid=logo]（同源、加载成功）或 [data-testid=wordmark]（文字字标）
// [data-testid=filter-all|filter-jp|filter-kr|filter-us|filter-eu|filter-cn|filter-other]
//                           地区筛选按钮，aria-pressed="true" 表示选中
// [data-testid=search]      搜索框，按英文名或中文名过滤（不区分大小写，包含即命中）
// [data-testid=lang]        中/英切换；默认 <html lang="en">（领导裁决：默认英文），切换后 zh-CN
// 每个方块（自身、::before/::after 或子元素）计算样式 backdrop-filter 不是 none（磨砂玻璃）
// 页面加载和交互期间不许请求任何外域资源（本机公司网络会拦截陌生域名，实测 2026-09-17）
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('C:/Users/73405/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const { chromium } = require('playwright');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const PROVE = args.includes('--prove');
const urlArg = args.includes('--url') ? args[args.indexOf('--url') + 1] : null;
const SHOT = path.join(ROOT, 'shots');
const shotName = n => path.join(SHOT, (urlArg ? 'live-' : '') + (PROVE ? 'prove-' : '') + n);
const BASE_PATH = '/ph-car-brands/';

// AutoDeal 品牌目录 68 个（2026-09-17 抓取）＋ 管理者实测找到的 9 个。值＝地区
const CANDIDATES = {
  honda: 'jp', isuzu: 'jp', lexus: 'jp', mazda: 'jp', mitsubishi: 'jp', nissan: 'jp', subaru: 'jp', suzuki: 'jp', toyota: 'jp',
  hyundai: 'kr', kia: 'kr',
  chevrolet: 'us', dodge: 'us', ford: 'us', jeep: 'us', ram: 'us', tesla: 'us',
  abarth: 'eu', 'alfa-romeo': 'eu', 'aston-martin': 'eu', audi: 'eu', bentley: 'eu', bmw: 'eu', ferrari: 'eu', fiat: 'eu', jaguar: 'eu',
  lamborghini: 'eu', 'land-rover': 'eu', lotus: 'eu', maserati: 'eu', 'mercedes-benz': 'eu', mini: 'eu', porsche: 'eu', 'rolls-royce': 'eu',
  volvo: 'eu', peugeot: 'eu', volkswagen: 'eu', mclaren: 'eu',
  aito: 'cn', baic: 'cn', bestune: 'cn', byd: 'cn', changan: 'cn', chery: 'cn', deepal: 'cn', denza: 'cn', dfsk: 'cn', dongfeng: 'cn',
  faw: 'cn', foton: 'cn', gac: 'cn', geely: 'cn', gwm: 'cn', haima: 'cn', hongqi: 'cn', jac: 'cn', jaecoo: 'cn', jetour: 'cn', kaicene: 'cn',
  kaiyi: 'cn', 'li-auto': 'cn', 'lynk-co': 'cn', mg: 'cn', omoda: 'cn', radar: 'cn', voyah: 'cn', zeekr: 'cn', maxus: 'cn', jmc: 'cn',
  xpeng: 'cn', leapmotor: 'cn', haval: 'cn', tank: 'cn',
  gaz: 'other', mahindra: 'other', tata: 'other', vinfast: 'other',
};
const REGIONS = ['jp', 'kr', 'us', 'eu', 'cn', 'other'];
const MIN_PASS = { jp: 7, kr: 2, us: 4, eu: 8, cn: 16 };
const MIN_TOTAL = 42, MAX_OFFNET = 10;

// 实测坏链接（2026-09-17，本机无头 Chrome）
const BAD = [
  { id: 'chery', name: 'Chery', url: 'https://www.chery.ph/' },                 // 域名挂牌出售（dynadot）
  { id: 'xpeng', name: 'XPeng', url: 'https://www.xpeng.ph/' },                 // 域名挂牌出售（atom）
  { id: 'baic', name: 'BAIC', url: 'https://baicphilippines.com/' },            // 停放页 /lander
  { id: 'byd', name: 'BYD', url: 'https://www.byd.com.ph/' },                   // 域名不存在（AutoDeal 里的旧链接）
  { id: 'volvo', name: 'Volvo', url: 'https://www.volvocars.com/en-ph/' },      // 404
  { id: 'ferrari', name: 'Ferrari', url: 'https://philippines.ferraridealers.com/' }, // 经销商页
  { id: 'jetour', name: 'Jetour', url: 'https://jetourauto.ph/' },              // 证书是 baic-ph.com 的
  { id: 'leapmotor', name: 'XPeng', url: 'https://www.xpengphilippines.com/' }, // Coming Soon 空页
  { id: 'audi', name: 'Audi', url: 'https://www.audi.com.ph/' },                // 公司网络拦截，且没声明 offnet
];

let fails = 0;
const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, timeout, step = 250) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try { const v = await fn(); if (v) return v; } catch { /* keep polling */ }
    await sleep(step);
  }
  return null;
}
const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
const CJK = /[\u4e00-\u9fff]/;

// ───── 静态服务器（挂在 /ph-car-brands/ 下）─────
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.txt': 'text/plain' };
async function startServer() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!p.startsWith(BASE_PATH)) { res.writeHead(404); return res.end('404 (站点在 ' + BASE_PATH + ' 下)'); }
    p = p.slice(BASE_PATH.length - 1);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  return srv;
}

// ───── 官网链接检查 ─────
const PARK_HOST = /(dynadot|atom\.com|sedo|afternic|dan\.com|hugedomains|godaddy|bodis|parkingcrew|above\.com|namebright|undeveloped|squadhelp)/i;
function phUrl(s) {
  const u = new URL(s), h = u.hostname.toLowerCase();
  if (/\.ph$/.test(h) || h.includes('philippines')) return true;
  if (h.split('.').some(l => l.length > 4 && /(ph|phil)$/.test(l))) return true;
  return u.pathname.toLowerCase().split('/').some(seg => /^(ph|en-ph|en_ph|ph-en|ph_en|philippines|_philippines_)$/.test(seg));
}
async function probe(ctx, b) {
  const page = await ctx.newPage();
  let status = null;
  page.on('response', r => { try { if (r.request().isNavigationRequest() && r.frame() === page.mainFrame()) status = r.status(); } catch { /* ignore */ } });
  try {
    try {
      await page.goto(b.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (e) {
      const m = String(e.message).split('\n')[0];
      if (/ERR_CERT|ERR_SSL|SSL_PROTOCOL/i.test(m)) return { kind: 'cert', detail: m };
      if (/ERR_NAME_NOT_RESOLVED/i.test(m)) return { kind: 'dns', detail: m };
      return { kind: 'neterr', detail: m };
    }
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForFunction(() => !/^(redirecting|just a moment|loading)/i.test(document.title), null, { timeout: 8000 }).catch(() => {});
    await sleep(1500);
    await until(() => page.evaluate(() => (document.body ? document.body.innerText : '').trim().length >= 300), 10000, 500);
    const final = page.url();
    const u = new URL(final);
    const title = (await page.title().catch(() => '')) || '';
    const text = await page.evaluate(() => (document.body ? document.body.innerText : '').slice(0, 60000)).catch(() => '');
    const d = `${status} ${final} 「${title.slice(0, 50)}」`;
    if (u.hostname === '10.50.250.252' || /^url filter$/i.test(title.trim())) return { kind: 'filter', detail: d };
    if (!/^https?:$/.test(u.protocol)) return { kind: 'neterr', detail: d };
    if (/access denied|just a moment|attention required|verify you are human|checking your browser|^redirecting/i.test(title) || [401, 403, 429].includes(status)) return { kind: 'botwall', detail: d };
    if (status >= 400) return { kind: 'http', detail: d };
    if (PARK_HOST.test(u.hostname) || /^\/lander/i.test(u.pathname) || /for sale|buy this domain|domain.{0,20}(parked|available)|coming soon/i.test(title) ||
      (text.length < 3000 && /(domain|website).{0,30}(for sale|is parked)|buy this domain/i.test(text))) return { kind: 'parked', detail: d };
    if (text.trim().length < 300) return { kind: 'empty', detail: d + ` text=${text.trim().length}` };
    if (/dealer|retailer/i.test(u.hostname + u.pathname)) return { kind: 'dealer', detail: d };
    const n = norm(b.name);
    if (!n || !(norm(u.hostname).includes(n) || norm(title).includes(n))) return { kind: 'brand', detail: d };
    if (!phUrl(final)) return { kind: 'not-ph', detail: d };
    return { kind: 'pass', detail: d };
  } finally {
    await page.close().catch(() => {});
  }
}
async function checkLinks(browser, list) {
  const ctx = await browser.newContext({ userAgent: UA, locale: 'en-PH', viewport: { width: 1366, height: 900 } });
  const out = new Map();
  let i = 0;
  async function worker() {
    while (i < list.length) {
      const b = list[i++];
      let r = await probe(ctx, b);
      if (['neterr', 'botwall', 'empty'].includes(r.kind)) { await sleep(3000); r = await probe(ctx, b); }
      out.set(b.id, r);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  await ctx.close();
  return out;
}
function grade(b, r) {
  if (r.kind === 'pass') return 'PASS';
  if (['filter', 'botwall', 'neterr'].includes(r.kind) && b.offnet && ['filter', 'botwall', 'neterr'].includes(b.offnet.why) && /^https?:\/\//.test(b.offnet.evidence || '')) return 'OFFNET';
  return 'FAIL';
}

// ───── 数据检查 ─────
function readJson(rel) { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
function checkData(brands, excluded) {
  const ids = new Set(); let dup = 0, bad = [];
  for (const b of brands) {
    if (!b || typeof b.id !== 'string' || !/^[a-z0-9-]+$/.test(b.id) || ids.has(b.id)) dup++; else ids.add(b.id);
    const probs = [];
    if (!b.name || !String(b.name).trim()) probs.push('name');
    if (!CJK.test(b.nameZh || '')) probs.push('nameZh');
    if (!REGIONS.includes(b.region)) probs.push('region');
    const want = CANDIDATES[b.id] || (Array.isArray(b.also) ? b.also.map(a => CANDIDATES[a]).find(Boolean) : null);
    if (want && b.region !== want) probs.push(`region应为${want}`);
    try { const u = new URL(b.url); if (u.protocol !== 'https:' && u.protocol !== 'http:') probs.push('url'); } catch { probs.push('url'); }
    if (b.logo !== null && !(typeof b.logo === 'string' && /^assets\/logos\/[^/]+$/.test(b.logo) && (urlArg || fs.existsSync(path.join(ROOT, b.logo))))) probs.push('logo');
    if (b.offnet && !(['filter', 'botwall', 'neterr'].includes(b.offnet.why) && /^https?:\/\//.test(b.offnet.evidence || ''))) probs.push('offnet');
    if (probs.length) bad.push(`${b.id}:${probs.join('/')}`);
  }
  check('D1 brands.json 每项字段合规（id 唯一、中英文名、地区与候选表一致、logo 文件存在、offnet 带证据）', dup === 0 && bad.length === 0, `dup=${dup} ${bad.slice(0, 8).join(' ')}`);
  const urls = brands.map(b => { try { const u = new URL(b.url); return (u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/+$/, '')).toLowerCase(); } catch { return b.url; } });
  const dupUrl = urls.filter((u, k) => urls.indexOf(u) !== k);
  check('D2 没有两个方块指向同一个官网（同站子品牌用 also）', dupUrl.length === 0, dupUrl.join(' '));
  const seen = {};
  for (const b of brands) { seen[b.id] = (seen[b.id] || 0) + 1; for (const a of (Array.isArray(b.also) ? b.also : [])) seen[a] = (seen[a] || 0) + 1; }
  let exBad = [];
  for (const e of excluded) {
    seen[e?.id] = (seen[e?.id] || 0) + 1;
    if (!e || String(e.reason || '').length < 10 || !Array.isArray(e.tried) || e.tried.length === 0) exBad.push(e?.id);
  }
  const missing = Object.keys(CANDIDATES).filter(k => !seen[k]);
  const twice = Object.keys(seen).filter(k => seen[k] > 1);
  check('D3 候选品牌 77 个每个都有且只有一个去向（收录／also／excluded 带理由和试过的网址）', missing.length === 0 && twice.length === 0 && exBad.length === 0,
    `缺=${missing.join(',') || '-'} 重复=${twice.join(',') || '-'} excluded不合规=${exBad.join(',') || '-'}`);
}

// ───── 页面检查 ─────
async function checkPage(browser, base, brands, { killGlass = false, routeData = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' });
  const page = await ctx.newPage();
  const origin = new URL(base).origin;
  const foreign = [], errors = [];
  page.on('request', r => { const u = r.url(); if (/^https?:/.test(u) && new URL(u).origin !== origin) foreign.push(u); });
  page.on('pageerror', e => errors.push(String(e.message).split('\n')[0]));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 120) + ' @ ' + (m.location()?.url || '')); });
  if (routeData) await page.route('**/data/brands.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(routeData) }));
  await page.addInitScript(() => {
    window.__lt = [];
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push(e.duration); }).observe({ type: 'longtask', buffered: true }); } catch { /* ignore */ }
  });
  await page.goto(base, { waitUntil: 'load', timeout: 60000 }).catch(e => errors.push('goto: ' + e.message));
  const ready = await until(() => page.evaluate(() => window.__brandsReady === true), 15000);
  check('P1 页面加载完成（__brandsReady）', !!ready);
  if (!ready) { await ctx.close(); return; }
  if (killGlass) await page.addStyleTag({ content: '*,*::before,*::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await sleep(1200);
  await page.screenshot({ path: shotName('desktop-en.png'), fullPage: true });

  const tiles = await page.$$eval('a[data-testid=brand]', els => els.map(a => {
    const img = a.querySelector('img[data-testid=logo]');
    return { id: a.dataset.id, href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel') || '',
      img: img ? { ok: img.complete && img.naturalWidth > 0, src: img.currentSrc || img.src } : null, word: !!a.querySelector('[data-testid=wordmark]') };
  }));
  const byId = new Map(brands.map(b => [b.id, b]));
  const hrefBad = tiles.filter(t => !byId.has(t.id) || byId.get(t.id).url !== t.href || t.target !== '_blank' || !/noopener/.test(t.rel)).map(t => t.id);
  check('P2 每个品牌一个方块，href 与数据完全一致，新标签页打开（target=_blank + noopener）',
    tiles.length === brands.length && new Set(tiles.map(t => t.id)).size === brands.length && hrefBad.length === 0, `tiles=${tiles.length} brands=${brands.length} bad=${hrefBad.slice(0, 6).join(',')}`);
  const logoBad = tiles.filter(t => t.img ? (!t.img.ok || new URL(t.img.src).origin !== origin) : !t.word).map(t => t.id);
  const logoWant = tiles.filter(t => byId.get(t.id)?.logo && !t.img).map(t => t.id);
  const real = tiles.filter(t => t.img && t.img.ok).length;
  check('P3 标志：图片同源且加载成功、没图的显示文字字标、数据里有 logo 的必须显示图片', logoBad.length === 0 && logoWant.length === 0, `bad=${logoBad.slice(0, 6).join(',')} 缺图=${logoWant.slice(0, 6).join(',')}`);
  check('P4 真 logo 覆盖 ≥ 80% 的方块（领导裁决：真 logo，缺的才用字标）', tiles.length > 0 && real / tiles.length >= 0.8, `${real}/${tiles.length}`);
  const noGlass = await page.$$eval('a[data-testid=brand]', els => els.filter(a => {
    const nodes = [a, ...a.querySelectorAll('*')];
    return !nodes.some(n => ['', '::before', '::after'].some(ps => {
      const cs = getComputedStyle(n, ps || null);
      const v = cs.backdropFilter || cs.webkitBackdropFilter || 'none';
      return v && v !== 'none';
    }));
  }).map(a => a.dataset.id));
  check('P5 每个方块都有磨砂玻璃（backdrop-filter）', tiles.length > 0 && noGlass.length === 0, `无=${noGlass.length} ${noGlass.slice(0, 5).join(',')}`);

  const visibleIds = () => page.$$eval('a[data-testid=brand]', els => els.filter(a => a.checkVisibility({ opacityProperty: true, visibilityProperty: true })).map(a => a.dataset.id).sort());
  const same = (a, b) => a.length === b.length && a.every((x, k) => x === b[k]);
  let filterBad = [];
  for (const r of ['all', ...REGIONS]) {
    const sel = `[data-testid=filter-${r}]`;
    if (!(await page.$(sel))) { filterBad.push(`${r}:缺按钮`); continue; }
    await page.click(sel);
    const want = brands.filter(b => r === 'all' || b.region === r).map(b => b.id).sort();
    const got = await until(async () => { const v = await visibleIds(); return same(v, want) ? v : null; }, 3000);
    const pressed = await page.getAttribute(sel, 'aria-pressed');
    if (!got || pressed !== 'true') filterBad.push(`${r}:${got ? '' : '显示不符'}${pressed !== 'true' ? 'aria-pressed' : ''}`);
  }
  check('P6 地区筛选：7 个按钮，点哪个只显示那个地区的品牌，3 秒内到位', filterBad.length === 0, filterBad.join(' '));
  if (await page.$('[data-testid=filter-all]')) await page.click('[data-testid=filter-all]');
  let searchOk = false, searchDetail = '';
  if (await page.$('[data-testid=search]')) {
    const toyota = byId.get('toyota');
    await page.fill('[data-testid=search]', 'TOYOTA');
    const want = brands.filter(b => norm(b.name).includes('toyota') || (b.nameZh || '').toLowerCase().includes('toyota')).map(b => b.id).sort();
    const g1 = await until(async () => same(await visibleIds(), want), 3000);
    let g2 = false;
    if (toyota) { await page.fill('[data-testid=search]', toyota.nameZh); g2 = await until(async () => (await visibleIds()).includes('toyota') && (await visibleIds()).length < brands.length, 3000); }
    await page.fill('[data-testid=search]', '');
    const g3 = await until(async () => (await visibleIds()).length === brands.length, 3000);
    searchOk = !!(g1 && g2 && g3); searchDetail = `英文=${!!g1} 中文=${!!g2} 清空复原=${!!g3}`;
  } else searchDetail = '缺搜索框';
  check('P7 搜索：英文不分大小写、中文名都能搜到，清空后全部复原', searchOk, searchDetail);
  const lt = await page.evaluate(() => window.__lt || []);
  const maxLt = lt.length ? Math.max(...lt) : 0;
  check('P8 交互期间没有 ≥ 200ms 的主线程卡顿', maxLt < 200, `最长=${Math.round(maxLt)}ms 次数=${lt.length}`);

  const langOk = [];
  langOk.push(await page.evaluate(() => document.documentElement.lang) === 'en');
  const cnLabel = async () => (await page.$('[data-testid=filter-cn]')) ? page.innerText('[data-testid=filter-cn]') : '';
  langOk.push(!CJK.test(await cnLabel()));
  if (await page.$('[data-testid=lang]')) {
    await page.click('[data-testid=lang]');
    langOk.push(!!(await until(() => page.evaluate(() => document.documentElement.lang === 'zh-CN'), 3000)));
    langOk.push(CJK.test(await cnLabel()));
    await sleep(600);
    await page.screenshot({ path: shotName('desktop-zh.png'), fullPage: true });
    await page.click('[data-testid=lang]');
    langOk.push(!!(await until(() => page.evaluate(() => document.documentElement.lang === 'en'), 3000)));
  } else langOk.push(false);
  check('P9 语言：默认英文（lang=en、筛选按钮无汉字），切换成 zh-CN 后筛选按钮是中文，再切回英文', langOk.every(Boolean), JSON.stringify(langOk));
  const firstRow = await page.$$eval('a[data-testid=brand]', els => { const vis = els.filter(a => a.checkVisibility()); if (!vis.length) return 0; const t = vis[0].getBoundingClientRect().top; return vis.filter(a => Math.abs(a.getBoundingClientRect().top - t) < 4).length; });
  check('P10 桌面 1440 宽：第一排 ≥ 4 个方块', firstRow >= 4, `firstRow=${firstRow}`);

  await page.setViewportSize({ width: 375, height: 812 });
  await sleep(800);
  const mob = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, out: [...document.querySelectorAll('a[data-testid=brand]')].filter(a => { const r = a.getBoundingClientRect(); return r.left < -1 || r.right > 376; }).length }));
  await page.screenshot({ path: shotName('mobile.png'), fullPage: false });
  check('P11 手机 375 宽：无横向滚动，方块不出屏', mob.sw <= 375 && mob.out === 0, JSON.stringify(mob));
  check('P12 全程无 JS 报错、无控制台 error', errors.length === 0, errors.slice(0, 3).join(' | '));
  check('P13 全程没有请求外域资源', foreign.length === 0, [...new Set(foreign)].slice(0, 4).join(' | '));
  await ctx.close();
}

// ───── 主流程 ─────
fs.mkdirSync(SHOT, { recursive: true });
let srv = null, base = urlArg;
if (!base) { srv = await startServer(); base = `http://127.0.0.1:${srv.address().port}${BASE_PATH}`; }
console.log(`PH 汽车品牌聚合站 验收  base=${base}${PROVE ? '  [--prove：坏链接＋去掉毛玻璃]' : ''}`);
const browser = await chromium.launch({ headless: true, executablePath: CHROME });

if (PROVE) {
  const bad = BAD.map(b => ({ ...b, nameZh: '测试', region: CANDIDATES[b.id], logo: null }));
  const res = await checkLinks(browser, bad);
  let leaked = [];
  for (const b of bad) {
    const r = res.get(b.id), g = grade(b, r);
    check(`L ${b.id} ${b.url} 判为 ${g}（${r.kind}）`, g === 'PASS', r.detail);
    if (g === 'PASS') leaked.push(b.url);
  }
  const before = fails;
  try { await checkPage(browser, base, bad, { killGlass: true, routeData: bad }); } catch (e) { check('页面流程异常中断', false, String(e.message).split('\n')[0]); }
  const p5 = results.find(r => r.name.startsWith('P5'));
  const glassLeak = !p5 || p5.ok === true;
  await browser.close(); if (srv) srv.close();
  if (leaked.length || glassLeak) { console.log(`\n反向验证失败：检查器放过了 ${leaked.join(' ')}${glassLeak ? (p5 ? ' 无毛玻璃的页面' : ' ——页面没加载出来，毛玻璃检查没跑到') : ''}`); process.exit(2); }
  console.log(`\n反向验证成立：坏链接 ${bad.length}/${bad.length} 被判不合格，去掉毛玻璃后 P5 变红（页面其余 ${fails - before - 1} 条 FAIL 是换了假数据的连带结果）`);
  process.exit(1);
}

let brands = [], excluded = [];
try {
  brands = readJson('data/brands.json');
  excluded = fs.existsSync(path.join(ROOT, 'data/excluded.json')) ? readJson('data/excluded.json') : [];
  if (!Array.isArray(brands) || !Array.isArray(excluded)) throw new Error('不是数组');
  check('D0 data/brands.json 与 data/excluded.json 可读且是数组', true, `brands=${brands.length} excluded=${excluded.length}`);
} catch (e) { check('D0 data/brands.json 与 data/excluded.json 可读且是数组', false, e.message); }

if (urlArg) {
  try {
    const live = Buffer.from(await (await fetch(new URL('data/brands.json', base), { cache: 'no-store' })).arrayBuffer());
    const local = fs.readFileSync(path.join(ROOT, 'data/brands.json'));
    check('U1 线上 data/brands.json 与本地逐字节相同', Buffer.compare(live, local) === 0, `live=${live.length}B local=${local.length}B`);
  } catch (e) { check('U1 线上 data/brands.json 与本地逐字节相同', false, e.message); }
} else if (brands.length) {
  checkData(brands, excluded);
  console.log(`\n逐个打开 ${brands.length} 个官网（约 ${Math.ceil(brands.length * 15 / 6 / 60)} 分钟）…`);
  const res = await checkLinks(browser, brands);
  const count = { PASS: 0, OFFNET: 0, FAIL: 0 };
  const per = Object.fromEntries(REGIONS.map(r => [r, 0]));
  const failed = [], offWrong = [];
  for (const b of brands) {
    const r = res.get(b.id), g = grade(b, r);
    count[g]++;
    if (g === 'PASS') per[b.region]++;
    if (g === 'FAIL') failed.push(`${b.id}(${r.kind}: ${r.detail})`);
    console.log(`  ${g.padEnd(6)} ${b.region.padEnd(5)} ${b.id.padEnd(16)} ${r.kind.padEnd(11)} ${r.detail}`);
  }
  check('L1 每个收录的官网：能打开、不是停放/出售/空页/经销商页、品牌名对得上、是菲律宾专属站（本机打不开的必须声明 offnet 并附证据）', count.FAIL === 0, failed.slice(0, 6).join(' || '));
  check(`L2 实测可打开的菲律宾官网 ≥ ${MIN_TOTAL} 个`, count.PASS >= MIN_TOTAL, `PASS=${count.PASS}`);
  check('L3 各地区实测可打开数达标（日≥7 韩≥2 美≥4 欧≥8 中≥16）', Object.entries(MIN_PASS).every(([r, m]) => per[r] >= m), JSON.stringify(per));
  check(`L4 声明本机打不开（offnet）的 ≤ ${MAX_OFFNET} 个`, count.OFFNET <= MAX_OFFNET, `OFFNET=${count.OFFNET}`);
}

try { await checkPage(browser, base, brands); } catch (e) { check('页面流程异常中断', false, String(e.message).split('\n')[0]); }
await browser.close();
if (srv) srv.close();
console.log(`\n${results.length - fails}/${results.length} PASS${fails ? `，${fails} FAIL` : ''}`);
process.exit(fails ? 1 : 0);
