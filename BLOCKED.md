# BLOCKED（待裁决）

1. **判卷漏洞（没改判卷，照样按它做）**：挂牌出售/过期域名的中转页标题是「Redirecting...」，判卷 probe() 先按标题判成 botwall（反爬），于是这种死域名可以被标 offnet 混进数据。实测：subaru.com.ph 正文是「This domain is for sale」、haima.com.ph 是「domain is expired」、exeed.com.ph / soueast.ph 是「This domain is available to be registered」。任务书「现状」把前两个说成反爬也是这个原因。我没有把它们收进来（斯巴鲁改用 subaru.asia/ph/en/，海马排除）。建议管理者给 parked 判定加上这几句正文，再重新冻结指纹。
2. **收录口径待领导看一眼**：阿尔法·罗密欧/菲亚特/阿巴斯只有代理商 Petromax 的三品牌合站 petromaxcars.com；法拉利、兰博基尼、宾利只有经销商页。按「只收菲律宾专属官网」都排除了，若领导觉得代理商站也算官网可补回（判卷 phUrl 对 petromaxcars.com 会判红）。
3. **JAC、Mahindra**：jacmotors.ph、mahindra.com.ph 对所有请求回 429，看不到内容、找不到第三方证据，暂时排除。
