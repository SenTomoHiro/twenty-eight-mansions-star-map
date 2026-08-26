import type { FourSymbolId, Mansion } from '../types/xingxiu'

type MansionSeed = Omit<
  Mansion,
  'id' | 'order' | 'symbolId' | 'symbolOrder' | 'assetStem' | 'assetStatus' | 'sourceIds'
> & {
  slug: string
}

const groups: Array<{ symbolId: FourSymbolId; entries: MansionSeed[] }> = [
  {
    symbolId: 'azure-dragon',
    entries: [
      { slug: 'jiao', name: '角', fullName: '角木蛟', pinyin: 'JIǍO', latin: 'JIAO', gloss: '角', nature: '木', animal: '蛟', anchor: { designation: 'α Virginis', commonName: 'Spica', ra: 201.298247, dec: -11.161319 }, intro: '东方苍龙第一宿。角宿以苍龙之角开启东方七宿，也由此成为整套星图的起笔。', culturalNote: '本系统以角宿一（室女座 α）作为现代星空定位锚点；历史星官的成员、距星制度与边界在不同时期存在差异。', sculptureNotes: '扬手而坐，蛟龙伴于身侧；以挂轴的冠帽、人物比例和姿态为主，复制品仅补充服饰层次。', officialOriginalPhoto: false },
      { slug: 'kang', name: '亢', fullName: '亢金龙', pinyin: 'KÀNG', latin: 'KANG', gloss: '颈', nature: '金', animal: '龙', anchor: { designation: 'κ Virginis', ra: 213.223937, dec: -10.273703 }, intro: '东方苍龙第二宿。亢宿承接龙角，在四象叙事中构成苍龙颈部的延伸。', culturalNote: '页面以亢宿距星的现代赤道坐标定位，并保留“传统星宿文化展示”与“现代坐标计算”两套口径的区别。', sculptureNotes: '高耸发冠、俯身动态与龙形伴生物是主要辨识点；避免采用复制品重做后的夸张底座。', officialOriginalPhoto: false },
      { slug: 'di', name: '氐', fullName: '氐土貉', pinyin: 'DĪ', latin: 'DI', gloss: '根柢', nature: '土', animal: '貉', anchor: { designation: 'α Librae', commonName: 'Zubenelgenubi', ra: 222.719638, dec: -16.041777 }, intro: '东方苍龙第三宿。氐有根柢、基础之意，在苍龙七宿中承上启下。', culturalNote: '古代星宿并非西方星座的逐一翻译；本页只用现代恒星坐标帮助辨认其大致天区。', sculptureNotes: '低冠坐姿，伴生貉靠近身侧；应避免现代复制品的高方冠与过度对称姿态。', officialOriginalPhoto: false },
      { slug: 'fang', name: '房', fullName: '房日兔', pinyin: 'FÁNG', latin: 'FANG', gloss: '房', nature: '日', animal: '兔', anchor: { designation: 'π Scorpii', ra: 239.712972, dec: -26.114108 }, intro: '东方苍龙第四宿。房宿处在苍龙七宿的中段，传统名号与室、房的空间意象相连。', culturalNote: '星图采用房宿代表恒星作锚点，连线仅用于展陈导览，不重构某一历史时期的完整星官图。', sculptureNotes: '人物持圆形物，兔在近侧；保持原塑造型参考中的含蓄坐姿与清楚手势。', officialOriginalPhoto: false },
      { slug: 'xin', name: '心', fullName: '心月狐', pinyin: 'XĪN', latin: 'XIN', gloss: '心', nature: '月', animal: '狐', anchor: { designation: 'σ Scorpii', ra: 245.297149, dec: -25.592792 }, intro: '东方苍龙第五宿。心宿位于苍龙核心意象所在的天区，是东方七宿中极具辨识度的一段。', culturalNote: '现代观察中，心宿天区邻近明亮的心宿二（天蝎座 α）；本页距星锚点采用心宿一（天蝎座 σ）。', sculptureNotes: '裸胸动态人物、指向手势和飘带是关键；避免把姿态做成游戏角色式夸张攻击动作。', officialOriginalPhoto: false },
      { slug: 'wei-east', name: '尾', fullName: '尾火虎', pinyin: 'WĚI', latin: 'WEI', gloss: '尾', nature: '火', animal: '虎', anchor: { designation: 'μ¹ Scorpii', ra: 252.967618, dec: -38.047399 }, intro: '东方苍龙第六宿。尾宿沿天蝎座南段展开，在四象图式中对应苍龙之尾。', culturalNote: '低纬度恒星在晋城视角下接近南方天空；日期与时刻会显著改变它在地平线上的可见状态。', sculptureNotes: '举拳武将与虎是主要特征；保留原参考的动态身体，减少复制品后来增加的成套重甲。', officialOriginalPhoto: false },
      { slug: 'ji-east', name: '箕', fullName: '箕水豹', pinyin: 'JĪ', latin: 'JI', gloss: '箕', nature: '水', animal: '豹', anchor: { designation: 'γ² Sagittarii', commonName: 'Alnasl', ra: 271.452034, dec: -30.42409 }, intro: '东方苍龙第七宿。箕宿收束苍龙七宿，其名称保留了古人从星列中辨认器物形态的方式。', culturalNote: '本页展示的是文化星图定位，不将现代星座边界替代传统星官体系。', sculptureNotes: '大型器物与伴生豹关系含蓄；以挂轴的人物轮廓和冠饰为准，控制动物与底座尺度。', officialOriginalPhoto: false },
    ],
  },
  {
    symbolId: 'black-tortoise',
    entries: [
      { slug: 'dou', name: '斗', fullName: '斗木獬', pinyin: 'DǑU', latin: 'DOU', gloss: '斗', nature: '木', animal: '獬', anchor: { designation: 'φ Sagittarii', ra: 281.414123, dec: -26.990783 }, intro: '北方玄武第一宿。斗宿以斗形星列开启玄武七宿，与北斗并非同一星官。', culturalNote: '“斗宿”与“北斗”常被混淆；本系统按二十八宿的南斗天区进行定位。', sculptureNotes: '红面官式人物与獬相伴；保留原参考较自然的坐姿，避免复制品高冠与密集金边。', officialOriginalPhoto: false },
      { slug: 'niu', name: '牛', fullName: '牛金牛', pinyin: 'NIÚ', latin: 'NIU', gloss: '牛', nature: '金', animal: '牛', anchor: { designation: 'β¹ Capricorni', commonName: 'Dabih', ra: 305.252777, dec: -14.781408 }, intro: '北方玄武第二宿。牛宿与女宿相邻，是传统星空中广为人知的一组名称。', culturalNote: '古籍、传说与星官制度的层次并不完全相同；页面只陈述可由资料支持的体系关系。', sculptureNotes: '端坐人物与牛相伴；以挂轴的冠饰、领口和坐姿为准，动物比例保持克制。', officialOriginalPhoto: false },
      { slug: 'nv', name: '女', fullName: '女土蝠', pinyin: 'NǓ', latin: 'NU', gloss: '女', nature: '土', animal: '蝠', anchor: { designation: 'ε Aquarii', commonName: 'Albali', ra: 311.918957, dec: -9.495777 }, intro: '北方玄武第三宿。女宿位于宝瓶座方向的传统天区，是玄武七宿的中前段。', culturalNote: '页面中的星点来自现代亮星目录；“女宿”名称和四象归属来自中国传统天文体系。', sculptureNotes: '人物姿态内敛，蝠靠近身侧；不采用复制品张口、高举蝠形构件的激烈改造。', officialOriginalPhoto: false },
      { slug: 'xu', name: '虚', fullName: '虚日鼠', pinyin: 'XŪ', latin: 'XU', gloss: '虚', nature: '日', animal: '鼠', anchor: { designation: 'β Aquarii', commonName: 'Sadalsuud', ra: 322.889717, dec: -5.571175 }, intro: '北方玄武第四宿。虚宿居玄武七宿中段，名称在历代天文文献中延续。', culturalNote: '神像造型由晋城市人民政府公开的元代原塑照片直接交叉校验。', sculptureNotes: '纤细直立人物，手势靠近胸前；严格保留官方原塑的比例、发式和衣褶轮廓。', officialOriginalPhoto: true },
      { slug: 'wei-north', name: '危', fullName: '危月燕', pinyin: 'WĒI', latin: 'WEI', gloss: '危', nature: '月', animal: '燕', anchor: { designation: 'α Aquarii', commonName: 'Sadalmelik', ra: 331.445981, dec: -0.319851 }, intro: '北方玄武第五宿。危宿邻近天球赤道，随季节和时刻在天空中呈现明显位移。', culturalNote: '在本系统中，日期切换通过地方恒星时改变其地平坐标，不以季节按钮简单替换文字。', sculptureNotes: '肩侧圆形物和内敛坐姿是辨识点；冠帽、手势以挂轴优先。', officialOriginalPhoto: false },
      { slug: 'shi', name: '室', fullName: '室火猪', pinyin: 'SHÌ', latin: 'SHI', gloss: '室', nature: '火', animal: '猪', anchor: { designation: 'α Pegasi', commonName: 'Markab', ra: 346.190223, dec: 15.205267 }, intro: '北方玄武第六宿。室宿与壁宿相连，在传统图式中共同形成鲜明的建筑空间意象。', culturalNote: '室宿神现代复制品与元代原塑差异很大；本项目以官方原塑摄影为最高造型依据。', sculptureNotes: '强烈动态的男性形象、赤裸上身与张口神态；不得采用现代复制品的端庄女性造型。', officialOriginalPhoto: true },
      { slug: 'bi-north', name: '壁', fullName: '壁水貐', pinyin: 'BÌ', latin: 'BI', gloss: '壁', nature: '水', animal: '貐', anchor: { designation: 'γ Pegasi', commonName: 'Algenib', ra: 3.308968, dec: 15.183598 }, intro: '北方玄武第七宿。壁宿收束玄武七宿，并与室宿共同构成天上宫室的连续想象。', culturalNote: '赤经在零时附近跨越 0°/360°，星图计算已按环绕角度处理。', sculptureNotes: '女性坐姿与貐相伴；保持原参考的手势、冠饰和裙袍外轮廓。', officialOriginalPhoto: false },
    ],
  },
  {
    symbolId: 'white-tiger',
    entries: [
      { slug: 'kui', name: '奎', fullName: '奎木狼', pinyin: 'KUÍ', latin: 'KUI', gloss: '奎', nature: '木', animal: '狼', anchor: { designation: 'η Andromedae', ra: 14.301668, dec: 23.41765 }, intro: '西方白虎第一宿。奎宿开启白虎七宿，位于仙女座方向的秋冬星空。', culturalNote: '四象与季节的对应是传统文化框架；实际可见性仍由日期、时刻和观察地点计算。', sculptureNotes: '自然官式坐姿并配狼；避免复制品硬朗对称袍服和过高冠帽。', officialOriginalPhoto: false },
      { slug: 'lou', name: '娄', fullName: '娄金狗', pinyin: 'LÓU', latin: 'LOU', gloss: '娄', nature: '金', animal: '狗', anchor: { designation: 'β Arietis', commonName: 'Sheratan', ra: 28.660046, dec: 20.808031 }, intro: '西方白虎第二宿。娄宿位于白羊座方向的传统天区，承接奎宿向东展开。', culturalNote: '星宿名称的文化解释存在版本差异时，本系统不把单一现代解释写成定论。', sculptureNotes: '女性坐姿及狗相伴；持物、冠饰和裙褶按挂轴优先，不强化复制品刃形元素。', officialOriginalPhoto: false },
      { slug: 'wei-west', name: '胃', fullName: '胃土雉', pinyin: 'WÈI', latin: 'WEI', gloss: '胃', nature: '土', animal: '雉', anchor: { designation: '35 Arietis', ra: 40.862976, dec: 27.707149 }, intro: '西方白虎第三宿。胃宿处于白虎七宿前段，传统名称以身体部位构成四象形体。', culturalNote: '本页定位锚点采用白羊座 35，坐标由 SIMBAD 专业天文数据库核验。', sculptureNotes: '老者坐姿、头巾与胡须是主要特征；保持克制衣褶，不使用过厚金边。', officialOriginalPhoto: false },
      { slug: 'mao', name: '昴', fullName: '昴日鸡', pinyin: 'MǍO', latin: 'MAO', gloss: '昴', nature: '日', animal: '鸡', anchor: { designation: '17 Tauri', commonName: 'Electra', ra: 56.218905, dec: 24.113338 }, intro: '西方白虎第四宿。昴宿与肉眼醒目的昴星团相连，是二十八宿中最易辨认的天区之一。', culturalNote: '神像以官方元代原塑照片校验；星图锚点采用昴星团成员金牛座 17。', sculptureNotes: '端坐、冠帽适中，手中圆形物与手势按官方原塑；避免复制品显著加高的冠帽。', officialOriginalPhoto: true },
      { slug: 'bi-west', name: '毕', fullName: '毕月乌', pinyin: 'BÌ', latin: 'BI', gloss: '毕', nature: '月', animal: '乌', anchor: { designation: 'ε Tauri', commonName: 'Ain', ra: 67.154168, dec: 19.180434 }, intro: '西方白虎第五宿。毕宿邻近毕星团，在冬季夜空中与昴宿前后相望。', culturalNote: '“昴毕”在传统观天语境中常相邻出现；页面仍将两宿分别定位和浏览。', sculptureNotes: '向上举手并与乌形成联系；人物动作有张力但不夸张，乌不应成为过大的视觉主体。', officialOriginalPhoto: false },
      { slug: 'zi', name: '觜', fullName: '觜火猴', pinyin: 'ZĪ', latin: 'ZI', gloss: '觜', nature: '火', animal: '猴', anchor: { designation: 'λ Orionis', commonName: 'Meissa', ra: 83.78449, dec: 9.934156 }, intro: '西方白虎第六宿。觜宿位于猎户座头部附近，是范围紧凑而有辨识度的传统星宿。', culturalNote: '“觜”字在天文名称中读作 zī；界面保留汉字为主、拉丁转写为辅。', sculptureNotes: '强烈坐姿与猴主题；保留原塑轮廓，抑制复制品的大型飘带和肌肉夸张。', officialOriginalPhoto: false },
      { slug: 'shen', name: '参', fullName: '参水猿', pinyin: 'SHĒN', latin: 'SHEN', gloss: '参', nature: '水', animal: '猿', anchor: { designation: 'ζ Orionis', commonName: 'Alnitak', ra: 85.189694, dec: -1.942574 }, intro: '西方白虎第七宿。参宿与猎户座腰带天区相连，冬夜中具有清晰的几何辨识度。', culturalNote: '本系统采用参宿一附近的现代恒星坐标作锚点，不把猎户座整体等同于参宿。', sculptureNotes: '女性坐姿与猿相伴；人物冠饰、脸型和袖口以挂轴为主要依据。', officialOriginalPhoto: false },
    ],
  },
  {
    symbolId: 'vermillion-bird',
    entries: [
      { slug: 'jing', name: '井', fullName: '井木犴', pinyin: 'JǏNG', latin: 'JING', gloss: '井', nature: '木', animal: '犴', anchor: { designation: 'μ Geminorum', commonName: 'Tejat', ra: 95.740112, dec: 22.513583 }, intro: '南方朱雀第一宿。井宿以井形星列开启朱雀七宿，横跨双子座方向的传统天区。', culturalNote: '传统星官的形状来自多星关系；选中时出现的导览线连接真实邻近亮星，但不冒充历史定本。', sculptureNotes: '人物带女性化或中性特征并与犴相伴；不得采用复制品改成的少年男性官帽造型。', officialOriginalPhoto: false },
      { slug: 'gui', name: '鬼', fullName: '鬼金羊', pinyin: 'GUǏ', latin: 'GUI', gloss: '鬼', nature: '金', animal: '羊', anchor: { designation: 'θ Cancri', ra: 127.898875, dec: 18.094418 }, intro: '南方朱雀第二宿。鬼宿位于巨蟹座方向，处于冬春夜空较为幽微的区域。', culturalNote: '本页不延伸未经可靠资料支持的吉凶占验，只呈现星宿结构与文物造型。', sculptureNotes: '女性人物、幼体构件与羊共同构成辨识关系；层次精细但不堆叠过度装饰。', officialOriginalPhoto: false },
      { slug: 'liu', name: '柳', fullName: '柳土獐', pinyin: 'LIǓ', latin: 'LIU', gloss: '柳', nature: '土', animal: '獐', anchor: { designation: 'δ Hydrae', ra: 129.414031, dec: 5.703788 }, intro: '南方朱雀第三宿。柳宿沿长蛇座前段展开，名称形成柔韧舒展的视觉联想。', culturalNote: '低亮度天区的展示会适度提高相关星点对比度，但保留恒星视星等层级。', sculptureNotes: '动态人物、幼体与獐是主要特征；不用复制品的重甲武将化改造。', officialOriginalPhoto: false },
      { slug: 'xing', name: '星', fullName: '星日马', pinyin: 'XĪNG', latin: 'XING', gloss: '星', nature: '日', animal: '马', anchor: { designation: 'α Hydrae', commonName: 'Alphard', ra: 141.896845, dec: -8.6586 }, intro: '南方朱雀第四宿。星宿位于朱雀七宿中段，以长蛇座 α 这一明亮恒星为醒目标识。', culturalNote: '神像造型由官方原塑摄影直接交叉校验；星点位置来自现代 ICRS/J2000 坐标。', sculptureNotes: '修长直立、双手靠近胸前；严格参考官方原塑比例，避免复制品高帽和短厚身体。', officialOriginalPhoto: true },
      { slug: 'zhang', name: '张', fullName: '张月鹿', pinyin: 'ZHĀNG', latin: 'ZHANG', gloss: '张', nature: '月', animal: '鹿', anchor: { designation: 'υ¹ Hydrae', ra: 147.869479, dec: -14.846629 }, intro: '南方朱雀第五宿。张宿承接星宿向朱雀翼部展开，“张”保留舒展铺陈的形态感。', culturalNote: '文献中对星官成员的记录可能随时代变动；系统仅将代表恒星作为浏览入口。', sculptureNotes: '女性式坐姿、圆形持物与鹿相伴；不采用现代复制品明显男性化的脸型与冠帽。', officialOriginalPhoto: false },
      { slug: 'yi', name: '翼', fullName: '翼火蛇', pinyin: 'YÌ', latin: 'YI', gloss: '翼', nature: '火', animal: '蛇', anchor: { designation: 'α Crateris', commonName: 'Alkes', ra: 164.943605, dec: -18.298786 }, intro: '南方朱雀第六宿。翼宿对应朱雀羽翼意象，星区沿巨爵座方向展开。', culturalNote: '官方原塑照片保留了极鲜明的动态姿态，是本项目人物造型的重要校验样本。', sculptureNotes: '赤膊男性，高举鞭状物，另一手张开；以官方原塑动作和身体比例为最高依据。', officialOriginalPhoto: true },
      { slug: 'zhen', name: '轸', fullName: '轸水蚓', pinyin: 'ZHĚN', latin: 'ZHEN', gloss: '轸', nature: '水', animal: '蚓', anchor: { designation: 'γ Corvi', commonName: 'Gienah', ra: 183.951545, dec: -17.54193 }, intro: '南方朱雀第七宿。轸宿收束朱雀七宿，在传统图式中与车轸意象相连。', culturalNote: '完成轸宿后，二十八宿沿赤经方向重新回到角宿，构成周天连续的浏览秩序。', sculptureNotes: '女性直立、单手抬起；保留官方原塑的冠饰、脸型与修长比例，不采用复制品双手重做。', officialOriginalPhoto: true },
    ],
  },
]

const slugs = [
  '01-jiao', '02-kang', '03-di', '04-fang', '05-xin', '06-wei', '07-ji',
  '08-dou', '09-niu', '10-nv', '11-xu', '12-wei', '13-shi', '14-bi',
  '15-kui', '16-lou', '17-wei', '18-mao', '19-bi', '20-zi', '21-shen',
  '22-jing', '23-gui', '24-liu', '25-xing', '26-zhang', '27-yi', '28-zhen',
]

export const MANSIONS: Mansion[] = groups.flatMap((group, groupIndex) =>
  group.entries.map((entry, index) => {
    const order = groupIndex * 7 + index + 1
    const assetStem = slugs[order - 1]
    if (!assetStem) throw new Error(`Missing asset stem for mansion ${order}`)
    const { slug, ...data } = entry
    return {
      ...data,
      id: `xingxiu-${String(order).padStart(2, '0')}-${slug}`,
      order,
      symbolId: group.symbolId,
      symbolOrder: index + 1,
      assetStem,
      assetStatus: 'approved-artwork',
      sourceIds: [
        'culture-classics',
        'astronomy-simbad',
        'relic-scrolls',
        'relic-replicas',
        ...(entry.officialOriginalPhoto ? ['relic-jincheng-government'] : []),
      ],
    }
  }),
)

export const MANSION_BY_ID = Object.fromEntries(
  MANSIONS.map((mansion) => [mansion.id, mansion]),
) as Record<string, Mansion>

export function mansionsForSymbol(symbolId: FourSymbolId) {
  return MANSIONS.filter((mansion) => mansion.symbolId === symbolId)
}
