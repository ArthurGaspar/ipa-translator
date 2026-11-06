// The character usually used to write each syllable in foreign names and loanwords
// (after the Xinhua transliteration tables): ba 巴, si 斯, te 特, ke 克, li 里…

const TABLE = `a阿 ai艾 an安 ang昂 ao奥 ba巴 bai拜 ban班 bang邦 bao保 bei贝 ben本 beng崩 bi比 bian边 biao彪 bie别
bin宾 bing宾 bo博 bu布 ca擦 cai采 can灿 cang仓 cao曹 ce策 cen岑 ceng曾 ci茨 cong聪 cou凑 cu楚 cuan爨 cui崔 cun村
cuo措 cha查 chai柴 chan禅 chang昌 chao超 che车 chen陈 cheng程 chi赤 chong崇 chou丑 chu楚 chuai揣 chuan川
chuang创 chui吹 chun春 chuo绰 da达 dai代 dan丹 dang当 dao道 de德 dei得 den登 deng登 di迪 dia嗲 dian典 diao刁
die迭 ding丁 diu丢 dong东 dou都 du杜 duan端 dui对 dun敦 duo多 e厄 ei埃 en恩 eng恩 er尔 fa法 fan凡 fang方
fei菲 fen芬 feng丰 fo佛 fou否 fu夫 ga加 gai盖 gan甘 gang冈 gao高 ge格 gei给 gen根 geng庚 gong贡 gou苟 gu古
gua瓜 guai怪 guan关 guang光 gui圭 gun衮 guo果 ha哈 hai海 han汉 hang杭 hao豪 he赫 hei黑 hen亨 heng亨 hong洪
hou侯 hu胡 hua华 huai怀 huan欢 huang黄 hui惠 hun浑 huo霍 ji吉 jia贾 jian坚 jiang姜 jiao焦 jie杰 jin金 jing京
jiong炯 jiu久 ju居 juan娟 jue爵 jun君 ka卡 kai凯 kan坎 kang康 kao考 ke克 ken肯 keng铿 kong孔 kou寇 ku库 kua夸
kuai快 kuan宽 kuang匡 kui奎 kun昆 kuo阔 la拉 lai莱 lan兰 lang朗 lao劳 le勒 lei雷 leng冷 li里 lia俩 lian连
liang良 liao廖 lie列 lin林 ling灵 liu留 lo咯 long隆 lou娄 lu鲁 luan栾 lun伦 luo罗 lv吕 lve略 ma马 mai迈 man曼
mang芒 mao毛 me么 mei梅 men门 meng蒙 mi米 mian缅 miao苗 mie灭 min敏 ming明 miu谬 mo莫 mou牟 mu穆 na纳 nai奈
nan南 nang囊 nao瑙 ne讷 nei内 nen嫩 neng能 ni尼 nian年 niang娘 niao鸟 nie涅 nin宁 ning宁 niu纽 nong农 nou耨
nu努 nuan暖 nuo诺 nv女 nve虐 o欧 ou欧 pa帕 pai派 pan潘 pang庞 pao泡 pei佩 pen彭 peng彭 pi皮 pian片 piao漂
pie撇 pin品 ping平 po波 pou剖 pu普 qi奇 qia恰 qian钱 qiang强 qiao乔 qie切 qin秦 qing庆 qiong琼 qiu丘 qu曲
quan泉 que雀 qun群 ran冉 rang让 rao饶 re热 ren任 reng仍 ri日 rong荣 rou柔 ru如 ruan阮 rui瑞 run润 ruo若 sa萨
sai赛 san桑 sang桑 sao骚 se塞 sen森 seng僧 si斯 song宋 sou搜 su苏 suan酸 sui绥 sun孙 suo索 sha沙 shai晒
shan山 shang尚 shao绍 she舍 shei谁 shen申 sheng盛 shi什 shou寿 shu舒 shua刷 shuai帅 shuan栓 shuang双 shui水
shun顺 shuo硕 ta塔 tai泰 tan坦 tang汤 tao陶 te特 tei忒 teng腾 ti蒂 tian田 tiao条 tie铁 ting廷 tong通 tou头
tu图 tuan团 tui推 tun吞 tuo托 wa瓦 wai外 wan万 wang旺 wei维 wen温 weng翁 wo沃 wu武 xi西 xia夏 xian先
xiang香 xiao肖 xie谢 xin辛 xing兴 xiong雄 xiu休 xu许 xuan宣 xue雪 xun逊 ya亚 yan延 yang扬 yao尧 ye耶 yi伊
yin因 ying英 yo哟 yong永 you尤 yu于 yuan元 yue约 yun云 za扎 zai宰 zan赞 zang藏 zao藻 ze泽 zei贼 zen曾 zeng曾
zi兹 zong宗 zou邹 zu祖 zuan钻 zui最 zun尊 zuo佐 zha扎 zhai翟 zhan詹 zhang章 zhao赵 zhe哲 zhei这 zhen珍
zheng正 zhi芝 zhong中 zhou周 zhu朱 zhua抓 zhuai拽 zhuan专 zhuang庄 zhui追 zhun准 zhuo卓`;

export const TRANSLIT = new Map(TABLE.split(/\s+/).filter(Boolean).map((e) => [e.slice(0, -1), e.slice(-1)]));
// A consonant on its own (no vowel after it) gets one of these syllables: t → 特 te, s → 斯 si…
export const ALONE = {
  b: 'bu', p: 'pu', d: 'de', t: 'te', g: 'ge', k: 'ke', f: 'fu', s: 'si', z: 'zi', c: 'ci', sh: 'shi',
  zh: 'zhi', ch: 'qi', j: 'ji', q: 'qi', x: 'xi', r: 'ri', h: 'he', m: 'mu', n: 'en', l: 'er', w: 'wu', y: 'yi',
};
