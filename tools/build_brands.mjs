// 生成 data/brands.json 与 data/excluded.json
// 网址均于 2026-09-17 在本机用浏览器实测，过程记录见 PROGRESS.md
// 用法：node tools/build_brands.mjs（在项目根目录下）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOGOS = path.join(ROOT, 'assets/logos');
const B = (id, name, nameZh, region, url, extra = {}) => {
  const f = ['svg', 'png', 'webp'].map(e => `${id}.${e}`).find(n => fs.existsSync(path.join(LOGOS, n)));
  return { id, name, nameZh, region, url, logo: f ? `assets/logos/${f}` : null, ...extra };
};

const brands = [
  B('toyota', 'Toyota', '丰田', 'jp', 'https://www.toyota.com.ph/'),
  B('lexus', 'Lexus', '雷克萨斯', 'jp', 'https://www.lexus.com.ph/'),
  B('honda', 'Honda', '本田', 'jp', 'https://www.hondaphil.com/'),
  B('nissan', 'Nissan', '日产', 'jp', 'https://www.nissan.ph/'),
  B('mitsubishi', 'Mitsubishi', '三菱', 'jp', 'https://www.mitsubishi-motors.com.ph/'),
  B('suzuki', 'Suzuki', '铃木', 'jp', 'https://auto.suzuki.com.ph/'),
  B('mazda', 'Mazda', '马自达', 'jp', 'https://www.mazda.ph/'),
  B('isuzu', 'Isuzu', '五十铃', 'jp', 'https://www.isuzuphil.com/'),
  B('subaru', 'Subaru', '斯巴鲁', 'jp', 'https://www.subaru.asia/ph/en/'),
  B('hyundai', 'Hyundai', '现代', 'kr', 'https://www.hyundai.com/ph/en'),
  B('kia', 'Kia', '起亚', 'kr', 'https://kiaphilippines.com/'),
  B('ford', 'Ford', '福特', 'us', 'https://www.ford.com.ph/'),
  B('chevrolet', 'Chevrolet', '雪佛兰', 'us', 'https://www.chevrolet.com.ph/'),
  B('jeep', 'Jeep', '吉普', 'us', 'https://www.jeep.com.ph/'),
  B('ram', 'RAM', '公羊', 'us', 'https://www.ram.com/ph/en/'),
  B('dodge', 'Dodge', '道奇', 'us', 'https://www.dodge.com/ph/en/index.html'),
  // tesla.com 对本机浏览器一律回 403 Access Denied；AutoDeal 特斯拉品牌页写明官网是 https://www.tesla.com/en_ph
  B('tesla', 'Tesla', '特斯拉', 'us', 'https://www.tesla.com/en_ph', { offnet: { why: 'botwall', evidence: 'https://www.autodeal.com.ph/brands/tesla-philippines' } }),
  B('bmw', 'BMW', '宝马', 'eu', 'https://www.bmw.com.ph/'),
  B('mini', 'MINI', '迷你', 'eu', 'https://www.mini.com.ph/'),
  B('mercedes-benz', 'Mercedes-Benz', '梅赛德斯-奔驰', 'eu', 'https://www.mercedes-benz.ph/'),
  B('audi', 'Audi', '奥迪', 'eu', 'https://www.audi.ph/'),
  B('porsche', 'Porsche', '保时捷', 'eu', 'https://www.porsche.com/philippines/'),
  B('volkswagen', 'Volkswagen', '大众', 'eu', 'https://www.volkswagen.com.ph/'),
  B('volvo', 'Volvo', '沃尔沃', 'eu', 'https://www.volvocars.com/ph/'),
  B('land-rover', 'Land Rover', '路虎', 'eu', 'https://www.landrover.ph/'),
  B('jaguar', 'Jaguar', '捷豹', 'eu', 'https://www.jaguar.ph/'),
  B('peugeot', 'Peugeot', '标致', 'eu', 'https://www.peugeot.ph/'),
  B('maserati', 'Maserati', '玛莎拉蒂', 'eu', 'https://www.maserati.com/ph/en'),
  B('lotus', 'Lotus', '路特斯', 'eu', 'https://www.lotuscars.com/en-PH'),
  B('byd', 'BYD', '比亚迪', 'cn', 'https://bydcarsphilippines.com/'),
  B('denza', 'Denza', '腾势', 'cn', 'https://www.denza.com/ph'),
  B('geely', 'Geely', '吉利', 'cn', 'https://www.geelyph.com/'),
  B('zeekr', 'Zeekr', '极氪', 'cn', 'https://www.zeekrlife.com/en-ph/'),
  B('lynk-co', 'Lynk & Co', '领克', 'cn', 'https://www.lynkco.com/en-ph/'),
  B('chery', 'Chery', '奇瑞', 'cn', 'https://www.cheryauto.ph/'),
  B('omoda-jaecoo', 'Omoda & Jaecoo', '欧萌达与捷酷', 'cn', 'https://www.omodajaecoo.com/ph/', { also: ['omoda', 'jaecoo'] }),
  B('mg', 'MG', '名爵', 'cn', 'https://mgmotor.com.ph/'),
  B('maxus', 'Maxus', '上汽大通', 'cn', 'https://maxus.ph/'),
  B('changan', 'Changan', '长安', 'cn', 'https://www.changan.ph/'),
  B('deepal', 'Deepal', '深蓝', 'cn', 'https://deepal.com.ph/'),
  B('hongqi', 'Hongqi', '红旗', 'cn', 'https://www.hongqi.ph/'),
  B('bestune', 'Bestune', '奔腾', 'cn', 'https://www.bestune.ph/'),
  B('gwm', 'GWM', '长城', 'cn', 'https://www.gwm.com.ph/', { also: ['haval', 'tank'] }),
  B('gac', 'GAC', '广汽', 'cn', 'https://www.gacgroup.com/en-ph'),
  B('baic', 'BAIC', '北汽', 'cn', 'https://baic.ph/'),
  B('dongfeng', 'Dongfeng', '东风', 'cn', 'https://dongfengmotorsph.com/'),
  B('dfsk', 'DFSK', '东风小康', 'cn', 'https://www.dfsk.com.ph/'),
  B('foton', 'Foton', '福田', 'cn', 'https://www.foton.com.ph/'),
  B('jmc', 'JMC', '江铃', 'cn', 'https://jmc.com.ph/'),
  B('kaiyi', 'Kaiyi', '凯翼', 'cn', 'https://kaiyi.com.ph/'),
  B('aito', 'AITO', '问界', 'cn', 'https://www.aito.ph/'),
  B('xpeng', 'XPeng', '小鹏', 'cn', 'https://www.xpeng.com/ph'),
  B('li-auto', 'Li Auto', '理想', 'cn', 'https://www.liauto.ph/'),
  B('vinfast', 'VinFast', '越南 VinFast', 'other', 'https://vinfastauto.ph/en'),
];

const X = (id, reason, tried) => ({ id, reason, tried });
const excluded = [
  X('abarth', '菲律宾由 Petromax 代理，只有代理商的多品牌网站 petromaxcars.com；abarth.ph 域名不存在', ['https://www.abarth.ph/', 'https://www.petromaxcars.com/']),
  X('alfa-romeo', '菲律宾由 Petromax 代理，只有代理商的多品牌网站；alfaromeo.ph 域名不存在，alfaromeo.com.ph 连不上', ['https://www.alfaromeo.ph/', 'https://www.alfaromeo.com.ph/', 'https://www.petromaxcars.com/']),
  X('fiat', '菲律宾由 Petromax 代理，只有代理商的多品牌网站；fiat.ph 域名不存在，fiat.com.ph 连不上', ['https://www.fiat.ph/', 'https://www.fiat.com.ph/', 'https://www.petromaxcars.com/']),
  X('aston-martin', '只有经销商 Aston Martin Manila，没有菲律宾专属官网；AutoDeal 给的经销商域名已不存在', ['http://manila.astonmartindealers.com/en/', 'https://www.astonmartin.com/en/dealers/aston-martin-manila']),
  X('bentley', '只有 Bentley 全球官网里的 Bentley Manila 经销商页面，按领导裁决经销商页不收', ['https://www.manila.bentleymotors.com/']),
  X('ferrari', '只有经销商 Velocita Motors 的页面（manila.ferraridealers.com），按领导裁决经销商页不收', ['https://philippines.ferraridealers.com/']),
  X('lamborghini', '只有 Lamborghini 全球官网里的 Lamborghini Manila 经销商页面，按领导裁决不收', ['https://www.lamborghini.com/en-en/dealerships/lamborghini-manila']),
  X('mclaren', '只有经销商 McLaren Manila，找不到菲律宾专属官网；猜的域名不存在、全球站经销商页 404', ['https://www.mclarenmanila.com/', 'https://cars.mclaren.com/en/retailers/manila']),
  X('rolls-royce', '找不到菲律宾专属官网，AutoDeal 给的马尼拉经销商网址已 404', ['https://www.rolls-roycemotorcars-manila.com.ph/']),
  X('faw', '菲律宾只卖 FAW 卡车（代理商 Focus Ventures 的 wix 站），纯卡车品牌不收', ['http://www.focusventures.com.ph/', 'https://focusventures.wixsite.com/fawphilippines']),
  X('gaz', 'AutoDeal 给的代理商网址 gazellemotors.com 域名不存在，查不到菲律宾官网', ['https://gazellemotors.com/', 'https://www.gazphilippines.com/']),
  X('haima', 'haima.com.ph 域名已过期（页面写着 domain is expired），查不到其他菲律宾官网', ['https://www.haima.com.ph/']),
  X('jac', 'jacmotors.ph 对浏览器和 curl 都回 429，另一次实测被跳到垃圾广告站，无法确认是正常官网', ['https://jacmotors.ph/', 'https://www.jacmotors.ph/', 'https://www.jacphilippines.com/']),
  X('jetour', 'jetourauto.ph 的 HTTPS 证书是 baic-ph.com 的，访客浏览器会报安全警告打不开；jetour.com.ph 被本机拦为钓鱼站', ['https://jetourauto.ph/', 'http://jetourauto.ph/', 'https://jetour.com.ph/', 'https://www.jetour.ph/']),
  X('kaicene', '搜索只见车媒页面，查不到菲律宾官网；猜的 kaicene.ph / kaicene.com.ph 连不上', ['https://www.kaicene.ph/', 'https://www.kaicene.com.ph/']),
  X('leapmotor', '搜不到零跑进入菲律宾的消息，leapmotor.ph 证书错误，leapmotorphilippines.com 不存在', ['https://www.leapmotor.ph/', 'https://www.leapmotorphilippines.com/']),
  X('mahindra', 'mahindra.com.ph 对浏览器和 curl 都回 429 看不到内容，也找不到第三方页面证明它是官网', ['https://www.mahindra.com.ph/', 'https://www.mahindra.ph/']),
  X('radar', '只有代理商 UAAGI 的新闻稿，查不到雷达汽车菲律宾官网；radar.ph 是菲律宾新闻网站', ['https://radar.ph/', 'https://www.radarauto.ph/', 'https://www.radar-auto.ph/']),
  X('tata', 'philippines.tatamotors.com 域名已不存在，tatamotors.ph 跳到印度全球站并拒绝访问', ['http://philippines.tatamotors.com/', 'https://www.tatamotors.ph/', 'https://www.tatamotors.com.ph/']),
  X('voyah', '只有代理商 Voltion 的多品牌网站（还卖别的电动车），本机也连不上，没有岚图菲律宾专属官网', ['https://www.voltion.ph/', 'https://www.voyah.ph/']),
];

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/brands.json'), JSON.stringify(brands, null, 2) + '\n');
fs.writeFileSync(path.join(ROOT, 'data/excluded.json'), JSON.stringify(excluded, null, 2) + '\n');
console.log(`brands=${brands.length} excluded=${excluded.length} logos=${brands.filter(b => b.logo).length}`);
