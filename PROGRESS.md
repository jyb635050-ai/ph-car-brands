# PROGRESS

## 开工回执（2026-09-17）
- 目标：菲律宾汽车品牌官网导航站（苹果风磨砂玻璃方块，点击进品牌菲律宾官网），上线 jyb635050-ai.github.io/ph-car-brands
- 顺序：任务 1 数据（D0–D3、L1–L4）→ 任务 2 页面＋logo（P1–P13）→ --prove → 任务 3 上线 --url 全绿
- 最大风险：77 个候选里剩下 ~25 个的官网真假难判（公司网络拦截/反爬/过时链接）；logo 来源要本地化且得是现行 logo
- 任务 0：`node tools/accept.mjs` 0/2 PASS 退出码 1；SHA256 98661cc2…986700 一致
- 说明：执行者与写任务书的管理者是同一个会话，验收不独立

## 进度
- 任务 1 完成：tools/build_brands.mjs 生成 data/brands.json（54 个：日9 韩2 美6 欧12 中24 其他1）＋ data/excluded.json（20 个带理由）。判卷 D0–D3、L1–L4 全 PASS，L2 PASS=53、OFFNET=1（特斯拉 403，证据 AutoDeal 品牌页）。输出存 run-data.txt
  - 发现书里一条事实不对：subaru.com.ph 是「This domain is for sale」、haima.com.ph 是「domain is expired」，不是反爬（无头浏览器等久一点能看到正文）。斯巴鲁真官网是 subaru.asia/ph/en/；海马查无官网已排除。详情见 BLOCKED.md
  - 新找到并实测通过：jaguar.ph、liauto.ph、gacgroup.com/en-ph（gacmotorph.com 跳过去）、baic.ph、dongfengmotorsph.com
- 任务 2 完成：index.html + css/style.css + js/app.js（纯静态），logo 48/54 本地化（Simple Icons 23 个、维基共享资源 20 个、品牌菲律宾官网 5 个；gac/dfsk 原图是白色，用浏览器 canvas 转成深色）。logo 逐张核对过：删掉了搜到的错图 jmc.svg（是印度 JMC Projects 公司）和含义不明的 aito 小图标，改用字标
  - 本地判卷 21/21 PASS 退出码 0（run-local.txt）；--prove 退出码 1、「反向验证成立」（run-prove.txt，audi.com.ph 本次回 429 被判 botwall，仍被拒）
  - 看截图改了一轮：去掉 logo 懒加载（全页截图时底部三个没出来）、特别扁的字标放宽尺寸、中文大标题加 text-wrap: balance（「达。」单独掉行）、VinFast 中文名改「越南 VinFast」
  - 建议偏离：没做视图过渡（View Transitions），筛选换位改用手写 FLIP 动画——视图过渡快照会把磨砂玻璃拍成死图，动画期间玻璃失真
