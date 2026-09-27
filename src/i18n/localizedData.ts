import type { Locale } from './i18n'
import type { FourSymbol, Mansion, MansionStarMapping, SourceRecord, TraditionalSkyFigure } from '../types/xingxiu'
import type { XingxiuCultureProfile, CulturalSourceRecord } from '../types/culture'
import type { ImportantAsterism } from '../types/importantAsterism'
import type { ImportantAsterismSource } from '../data/importantAsterismSources'

const mansionNames = [
  'Jiao 角', 'Kang 亢', 'Di 氐', 'Fang 房', 'Xin 心', 'Wei 尾', 'Ji 箕',
  'Dou 斗', 'Niu 牛', 'Nü 女', 'Xu 虚', 'Wei 危', 'Shi 室', 'Bi 壁',
  'Kui 奎', 'Lou 娄', 'Wei 胃', 'Mao 昴', 'Bi 毕', 'Zi 觜', 'Shen 参',
  'Jing 井', 'Gui 鬼', 'Liu 柳', 'Xing 星', 'Zhang 张', 'Yi 翼', 'Zhen 轸',
] as const

const deityTitles = [
  'Jiao Wood Jiao-dragon 角木蛟', 'Kang Metal Dragon 亢金龙', 'Di Earth Raccoon Dog 氐土貉', 'Fang Sun Rabbit 房日兔', 'Xin Moon Fox 心月狐', 'Wei Fire Tiger 尾火虎', 'Ji Water Leopard 箕水豹',
  'Dou Wood Xiezhi 斗木獬', 'Niu Metal Ox 牛金牛', 'Nü Earth Bat 女土蝠', 'Xu Sun Rat 虚日鼠', 'Wei Moon Swallow 危月燕', 'Shi Fire Pig 室火猪', 'Bi Water Yu-creature 壁水貐',
  'Kui Wood Wolf 奎木狼', 'Lou Metal Dog 娄金狗', 'Wei Earth Pheasant 胃土雉', 'Mao Sun Rooster 昴日鸡', 'Bi Moon Crow 毕月乌', 'Zi Fire Monkey 觜火猴', 'Shen Water Ape 参水猿',
  'Jing Wood An-creature 井木犴', 'Gui Metal Sheep 鬼金羊', 'Liu Earth Roe Deer 柳土獐', 'Xing Sun Horse 星日马', 'Zhang Moon Deer 张月鹿', 'Yi Fire Snake 翼火蛇', 'Zhen Water Earthworm 轸水蚓',
] as const

const culturalRoles = [
  ['the celestial gate through which the ecliptic passes', 'court access, law, and military command', 'brightness and motion, not the mansion alone, conditioned its omen readings', 'Tianmen Star Lord 天门星君, associated in the Northern Song text with arms, rain, longevity, and farming'],
  ['the sovereign’s inner court for petitions and adjudication', 'administration, litigation, and the recording of merit', 'a bright appearance was read as loyal counsel and public order', 'Tianting Star Lord 天庭星君, whose later Daoist remit includes epidemics, winds, medicine, and official rank'],
  ['the sovereign’s residence and the consorts’ quarters', 'palace rank and succession within the inner court', 'relative stellar size was interpreted through observance of court order', 'Tianfu Star Lord 天府星君, linked with palace women, forests, vegetation, and rain'],
  ['the Mingtang 明堂 and the hall from which government was promulgated', 'ritual government, ministers, roads, horses, and court movement', 'planetary paths and the stars’ brightness were read in political and military contexts', 'Tiansi Star Lord 天驷星君, associated with the inner treasury, valuables, wind, and rain'],
  ['the central royal position, with its middle star called the Mingtang and Great Chen', 'sovereignty, succession, reward, and punishment', 'alignment, brightness, and planetary encounters produced distinct readings', 'Tianwang Star Lord 天王星君, associated with rulers, public works, arts, and rainfall'],
  ['a nine-star field of the inner palace', 'the ranks of consorts and dynastic descendants', 'ordered brightness was interpreted as an orderly palace and flourishing descendants', 'Tianji Star Lord 天鸡星君, linked in the cited Daoist text with auspicious clouds and relations among women'],
  ['Tianjin, the Celestial Ford, and a regulator of the eight winds', 'the inner palace, winds, speech, and distant regions', 'wind and frontier readings depended on specific celestial events', 'Tianlü Star Lord 天律星君, associated with winds, rain, waterways, and moral disorder'],
  ['the six-star Southern Dipper, a celestial temple and ministerial seat', 'selection of the worthy, rank, office, military affairs, and lifespan', 'brightness was read in relation to government and the conferral of rank', 'Tianfu Star Lord 天府星君, associated with examinations, emolument, rain, and standards of measure'],
  ['a celestial pass and bridge connected with sacrificial animals', 'roads, crossings, ritual offerings, and southern border regions', 'movement or color changes prompted readings; brightness suggested open passage', 'Tianji Star Lord 天机星君, associated with weather, livestock, sacrificial animals, and southern peoples'],
  ['the four-star Celestial Lesser Treasury', 'cloth production, tailoring, and marriage in the historical court economy', 'the cited history records duties rather than a context-free favorable or unfavorable label', 'Tiannü Star Lord 天女星君, associated with clothing, marriage, and strong winds'],
  ['a two-star office of the chief minister', 'settlements, temples, sacrifice, prayer, mourning, and burial', 'interpretation required a guest star, planetary visit, or observable change', 'Tianfu Star Lord 天府星君, associated with buildings, ancestral rites, loss, and lamentation'],
  ['a three-star office of treasuries, markets, and construction', 'storage, exchange, building, and funerary concerns shared with Xu', 'its readings follow Xu’s ritual and mourning context rather than the modern meaning of “danger”', 'Tianqian Star Lord 天钱星君, associated with tombs, storms, sand, and peril'],
  ['the sovereign’s palace, dark palace, pure temple, and military granary', 'palaces, ancestral temples, supplies, and construction', 'brightness was linked with prosperity; dimness with unsuccessful sacrifice', 'Tianlin Star Lord 天廪星君, associated with halls, writings, and military stores'],
  ['the celestial archive of writings and books', 'documents, learning, and cultural transmission', 'brightness, loss of color, and movement had different literary or construction readings', 'Tianshi Star Lord 天市星君; the source also writes the mansion as 璧, a textual variant of 壁'],
  ['a sixteen-star celestial arsenal also called Tian Shi or Feng Shi', 'weapons, the restraint of violence, canals, and waterways', 'the historical record emphasizes the principal star’s brightness rather than a fixed verdict', 'Tianjiang Star Lord 天将星君, associated with arsenals, waterways, wind, rain, thunder, and lightning'],
  ['a three-star celestial prison connected with parks and sacrificial herds', 'justice, animal husbandry, and the supply of ritual animals', 'the cited passage records offices but no portable fixed omen', 'Tianyu Star Lord 天狱星君, associated with temples, restricted parks, offerings, and Daoist rites'],
  ['the celestial kitchen store and granary of the five grains', 'food preparation, storage, grain, and provisioning', 'brightness was interpreted as peace, explicitly tying the reading to observation', 'Tiancang Star Lord 天仓星君, associated with stores, precious goods, textiles, and grain'],
  ['the seven-star eyes and ears of Heaven', 'oversight, western regions, justice, and ceremonial vanguards', 'brightness, color, missing stars, and motion carried different readings', 'Tianmu Star Lord 天目星君, associated with clear skies, averting disaster, prisons, and punishment'],
  ['an eight-star office of frontier troops and hunting', 'border defense, commanders, hunting, and the nearby listening star Fu’er', 'brightness, loss of color, and lunar passage were read in military and weather contexts', 'Tian’er Star Lord 天耳星君, associated with peace, insignia, and stable frontiers'],
  ['a three-star military watch and field store', 'military warning, provisions, and gathering', 'brightness was read as full stores and strong commanders', 'Tianping Star Lord 天屏星君, associated with gathering, weather, shrines, and spirits'],
  ['the military complex also called Shenfa, Great Chen, Celestial Market, and Axe', 'campaigns, punishment, balance, borders, and commanders', 'rays, motion, color, and changes in individual stars produced different readings', 'Tianshui Star Lord 天水星君, associated with generals, jurisdiction, punishment, and conflict'],
  ['the eight-star eastern well, southern gate, and ecliptic watch station', 'water management, fair law, passage, and judicial enforcement', 'orderly brightness and lunar passage were read in legal and weather contexts', 'Tianjing Star Lord 天井星君, associated with wells, bridges, rivers, lakes, and aquatic beings'],
  ['the five-star Yugui, understood as the eyes of Heaven', 'surveillance, stores, funerary rites, sacrifice, and punishment', 'the surrounding stars and central Jishi star could require opposite brightness readings', 'Tiankui Star Lord 天匮星君, associated with stores, valuables, mourning, medicine, and detecting wrongdoing'],
  ['the eight-star celestial kitchen office', 'food service, flavor, and thunderstorms', 'the cited history records duties but no fixed brightness verdict', 'Tianchu Star Lord 天厨星君, associated with kitchens, dim skies, storms, warfare, and banditry'],
  ['a seven-star mansion also called Tiandu', 'embroidered garments as well as urgent military and bandit affairs', 'brightness was linked with flourishing rule; dimness with worthy people losing position', 'Tianku Star Lord 天库星君, associated with clothing, embroidery, clear skies, and weapons'],
  ['a six-star office of ritual valuables, temple goods, clothing, and feasts', 'ritual vessels, garments, food, hospitality, and royal gifts', 'brightness was linked with the proper performance of the Five Rites', 'Tiancheng Star Lord 天秤星君, associated with temple treasures, banquets, guests, and social discord'],
  ['the twenty-two-star celestial music bureau', 'performance, ritual music, and guests from afar', 'brightness, movement, and displacement had distinct diplomatic or military readings', 'Tiandu Star Lord 天都星君, associated with music, pitch standards, waters, and living creatures'],
  ['a four-star office of chief ministers, vehicles, transport, and military movement', 'ministers, transport, armies, wind, and mourning', 'brightness and movement of Zhen and its neighboring stars entered separate readings', 'Tianjie Star Lord 天阶星君, associated with clarity, separation, disputes, and danger'],
] as const

const regionTexts = [
  [1, 2, 'Zheng and Yanzhou'], [3, 5, 'Song and Yuzhou'], [6, 7, 'Yan and Youzhou'], [8, 9, 'Wu–Yue and Yangzhou'],
  [10, 11, 'Qi and Qingzhou'], [12, 14, 'Wei and Bingzhou'], [15, 16, 'Lu and Xuzhou'], [17, 18, 'Zhao and Jizhou'],
  [19, 21, 'Wei and Yizhou'], [22, 23, 'Qin and Yongzhou'], [24, 26, 'Zhou and the Three He region'], [27, 28, 'Chu and Jingzhou'],
] as const

export function localizeMansion(mansion: Mansion, locale: Locale): Mansion {
  if (locale === 'zh-CN') return mansion
  const name = mansionNames[mansion.order - 1]
  const symbol = ['Eastern Azure Dragon', 'Northern Black Tortoise', 'Western White Tiger', 'Southern Vermilion Bird'][Math.floor((mansion.order - 1) / 7)]
  if (!name || !symbol) throw new Error(`Missing English mansion translation for ${mansion.id}`)
  return {
    ...mansion,
    name,
    fullName: deityTitles[mansion.order - 1] ?? mansion.fullName,
    gloss: name.split(' ')[0] ?? name,
    nature: ({ 木: 'Wood', 金: 'Metal', 土: 'Earth', 日: 'Sun', 月: 'Moon', 火: 'Fire', 水: 'Water' } as Record<string, string>)[mansion.nature] ?? mansion.nature,
    animal: deityTitles[mansion.order - 1]?.split(' ').slice(2, -1).join(' ') ?? mansion.animal,
    intro: `${name} is the ${mansion.symbolOrder}${['st', 'nd', 'rd'][mansion.symbolOrder - 1] ?? 'th'} mansion of the ${symbol}. It remains part of the traditional Chinese mansion system rather than a Western zodiac sign.`,
    culturalNote: `The display uses a modern stellar anchor to locate this traditional sky region. Historical membership, defining stars, and boundaries can vary by period and source.`,
  }
}

export function localizeFourSymbol(symbol: FourSymbol, locale: Locale): FourSymbol {
  if (locale === 'zh-CN') return symbol
  const values = ({
    'azure-dragon': ['Eastern Azure Dragon 东方苍龙', 'Azure Dragon 苍龙', 'East', 'Spring'],
    'black-tortoise': ['Northern Black Tortoise 北方玄武', 'Black Tortoise 玄武', 'North', 'Winter'],
    'white-tiger': ['Western White Tiger 西方白虎', 'White Tiger 白虎', 'West', 'Autumn'],
    'vermillion-bird': ['Southern Vermilion Bird 南方朱雀', 'Vermilion Bird 朱雀', 'South', 'Summer'],
  } as const)[symbol.id]
  if (!values) throw new Error(`Missing English symbol translation for ${symbol.id}`)
  return { ...symbol, name: values[0], shortName: values[1], direction: values[2], season: values[3], statement: `Its seven mansions form the ${values[0]} in the Four Symbols system.` }
}

export function localizeMapping(mapping: MansionStarMapping, mansion: Mansion, locale: Locale): MansionStarMapping {
  if (locale === 'zh-CN') return mapping
  return {
    ...mapping,
    name: mansion.name,
    traditionalAsterism: `${mansion.name} Mansion`,
    differenceNote: 'This display adopts the asterism lines and defining-star mapping of Stellarium 26.2’s Chinese Song Dynasty sky culture. Defining stars, added stars, and membership vary across periods; this version is not presented as the sole historical canon.',
  }
}

export function localizeCulture(profile: XingxiuCultureProfile, mansion: Mansion, locale: Locale): XingxiuCultureProfile {
  if (locale === 'zh-CN') return profile
  const role = culturalRoles[mansion.order - 1]
  const region = regionTexts.find(([from, to]) => mansion.order >= from && mansion.order <= to)?.[2]
  if (!role || !region) throw new Error(`Missing English cultural translation for ${mansion.id}`)
  const fields = [
    { title: 'Name & Sky Figure', text: `${mansion.name} is Mansion ${mansion.order} and ${role[0]}. The name belongs to the inherited Twenty-Eight Mansions sequence; where early sources do not establish a single etymology, this archive does not invent one from the modern character.` },
    { title: 'Human Order', text: `In the historical celestial-bureaucratic system it represented ${role[1]}. These correspondences are cultural and political language, not modern physical causation.` },
    { title: 'Omen Tradition', text: `${role[2]}. The archive therefore does not reduce a mansion to a permanent “auspicious” or “inauspicious” label.` },
    { title: 'Terrestrial Divisions', text: `The Tang commentary quoted in the Records of the Grand Historian associates this mansion’s group with ${region}. Terrestrial divisions were historical astrological geography; shifting state and provincial boundaries cannot be converted directly into modern jurisdictions.` },
    { title: 'Daoist Star Lord', text: `The Northern Song Dongyuan ji 洞渊集 presents this mansion as ${role[3]}. This is a Daoist textual layer and is not projected backward as the original meaning of pre-Qin or Han astronomy.` },
  ] as const
  return {
    ...profile,
    oneLinePosition: mansion.intro,
    nameAndImage: { ...profile.nameAndImage, ...fields[0] },
    humanOrder: { ...profile.humanOrder, ...fields[1] },
    omenTradition: { ...profile.omenTradition, ...fields[2] },
    regionalField: { ...profile.regionalField, ...fields[3] },
    daoistTradition: { ...profile.daoistTradition, ...fields[4] },
    ancientEvidence: profile.ancientEvidence.map((citation, index) => ({
      ...citation,
      book: index === 0 ? 'Book of Jin 晋书' : 'Dongyuan ji 洞渊集',
      section: index === 0 ? 'Treatise on Astronomy, Part One' : 'Scroll 8: Descent of the Star Lords of the Twenty-Eight Mansions',
      dynasty: index === 0 ? 'Official history compiled in the Tang dynasty' : 'Northern Song dynasty',
      authorOrCompiler: index === 0 ? 'Fang Xuanling et al.' : 'Compiled by Li Sicong',
      locator: `${mansion.name} entry`,
      interpretation: index === 0 ? `The passage situates ${mansion.name} within ${role[0]}.` : `The passage personifies ${mansion.name} as a Daoist star lord with a defined human remit; this evidence belongs to the Northern Song religious layer.`,
    })) as XingxiuCultureProfile['ancientEvidence'],
  }
}

type ImportantEnglish = Omit<Partial<ImportantAsterism>, 'members'> & { members: string[]; notes: string[] }

const importantEnglish: Record<string, ImportantEnglish> = {
  'beidou-nine': {
    name: 'Beidou Nine Stars 北斗九星', aliases: ['Beidou 北斗', 'Seven Stars with Fu and Bi'], traditionalRegion: 'Traditional Purple Forbidden Enclosure region',
    members: ['Tianshu 天枢', 'Tianxuan 天璇', 'Tianji 天玑', 'Tianquan 天权', 'Yuheng 玉衡', 'Kaiyang 开阳', 'Yaoguang 摇光', 'Fu 辅星', 'Bi 弼星'],
    notes: ['First star of Beidou.', 'Second star of Beidou.', 'Third star of Beidou.', 'Fourth star of Beidou.', 'Fifth star of Beidou.', 'Sixth star of Beidou.', 'Seventh star of Beidou.', 'The Book of Jin places Fu near Kaiyang; the Song-dynasty sky data maps it to HIP 65477.', 'Bi appears in historical texts, but this project found no consistent, reliable basis for a modern HIP or Bayer identification.'],
    astronomySummary: 'Beidou’s principal form runs from Tianshu through Yaoguang, with Fu near Kaiyang. The nine-star cultural structure adds Fu and Bi, but this project leaves Bi without a modern stellar identification.',
    daoistSummary: 'Daoist texts developed a personified system of the Nine Sovereigns of Beidou. Their titles and offices belong to religious literature and are not substitutes for early astronomical names.',
    culturalMeaning: 'Beidou was prominent in observation, orientation, and calendrical culture; later traditions also developed rites concerning protection and longevity.',
    modernMappingNotes: 'The seven principal stars and Fu use verifiable HIP entries. Bi appears only as a dashed traditional schematic position and is excluded from physical-sky hit testing and lines.',
  },
  'nandou-six': {
    name: 'Nandou Six Stars 南斗六星', aliases: ['Nandou 南斗', 'Six stars of the Dou Mansion'], traditionalRegion: 'Northern Black Tortoise · Dou Mansion region',
    members: ['Nandou Star 1 南斗一', 'Nandou Star 2 南斗二', 'Nandou Star 3 南斗三', 'Nandou Star 4 南斗四', 'Nandou Star 5 南斗五', 'Nandou Star 6 南斗六'], notes: Array(6).fill('Reuses the corresponding stellar entity from the Dou Mansion; no duplicate coordinates are maintained.'),
    astronomySummary: 'In this system, Nandou is the same six-star structure as the Dou Mansion. The same modern astronomical objects carry different cultural identities in the mansion and important-asterism contexts.',
    daoistSummary: 'Daoist works such as the Scripture of the Southern Dipper’s Six Offices personify Nandou as six offices concerned with extending life and guiding people. Those divine titles do not rewrite the earlier astronomical data.',
    culturalMeaning: 'Nandou is named for its dipper-like form in relation to Beidou and later acquired a corresponding body of stellar devotion.',
    modernMappingNotes: 'Directly references the stars and lines of xingxiu-08-dou; there is no second set of HIP identifiers, coordinates, or line data.',
  },
  santai: {
    name: 'Santai 三台', aliases: ['Three Steps 三阶', 'Celestial Steps 天阶'], traditionalRegion: 'Traditional Supreme Palace Enclosure region',
    members: ['Upper Step 1 上台一', 'Upper Step 2 上台二', 'Middle Step 1 中台一', 'Middle Step 2 中台二', 'Lower Step 1 下台一', 'Lower Step 2 下台二'], notes: ['One of the two Upper Step stars.', 'One of the two Upper Step stars.', 'One of the two Middle Step stars.', 'One of the two Middle Step stars.', 'One of the two Lower Step stars.', 'One of the two Lower Step stars; coordinates verified through the SIMBAD fallback.'],
    astronomySummary: 'Santai is a six-star asterism: two stars each in the Upper, Middle, and Lower Steps. It is three pairs, not three individual stars.',
    daoistSummary: 'Later religious and divinatory sources give Santai further personifications and symbolic readings. This page keeps those layers separate from the six-star structure recorded in official astronomical treatises.',
    culturalMeaning: 'Official histories explain Santai as celestial steps, creating an image of ranked ascent from lower to upper levels.',
    modernMappingNotes: 'All six members use the Stellarium Song-dynasty Chinese sky HIP mapping; each child group connects only its corresponding pair.',
  },
}

export function localizeImportantAsterism(asterism: ImportantAsterism, locale: Locale): ImportantAsterism {
  if (locale === 'zh-CN') return asterism
  const translated = importantEnglish[asterism.id]
  if (!translated) throw new Error(`Missing English important-asterism translation for ${asterism.id}`)
  const childNames = { upper: 'Upper Step 上台', middle: 'Middle Step 中台', lower: 'Lower Step 下台' } as Record<string, string>
  return {
    ...asterism,
    ...translated,
    members: asterism.members.map((member, index) => ({ ...member, name: translated.members[index]!, note: translated.notes[index]! })),
    childGroups: asterism.childGroups.map((group) => ({ ...group, name: childNames[group.id] ?? group.name, summary: `The ${childNames[group.id]?.split(' ')[0] ?? group.name} Step consists of this pair of stars.` })),
  } as ImportantAsterism
}

const sourceNotes: Record<string, string> = {
  'astronomy-hipparcos': 'Provides HIP identifiers, ICRS coordinates, and V magnitudes for principal mansion members.',
  'astronomy-hipparcos-2': 'Provides new-reduction parallaxes and formal errors for defining stars; approximate inverse-parallax distances appear only when relative error is at most 20%.',
  'culture-stellarium-song': 'Sun Shuwei’s CC BY-SA 4.0 sky culture in Stellarium 26.2 supplies the version-pinned technical figures, mansion definitions, and official line data used by this project.',
  'astronomy-bsc': 'The site bundles a lightweight subset to V magnitude 4.8 using J2000 right ascension, declination, and V magnitude.',
  'astronomy-simbad': 'Used to verify modern identifiers and ICRS/J2000 coordinates for the twenty-eight display anchors.',
  'astronomy-coordinate-method': 'Reference for converting equatorial coordinates to local horizontal coordinates using Julian date and Greenwich mean sidereal time.',
  'location-wangchenggang-coordinate': 'The published Wangchenggang coordinates are converted to the single engineering reference point 34.400278°N, 113.125556°E.',
  'culture-wangchenggang-yangcheng': 'Wangchenggang is important to research on early Xia culture and textual Yangcheng; the project preserves scholarly caution and makes no exclusive capital claim.',
  'culture-dengfeng-astronomy': 'Dengfeng is associated with the “Centre of Heaven and Earth,” observation, orientation, and calendrical practice; Gaocheng Observatory preserves major material evidence.',
  'culture-four-symbol-directions': 'The Palace Museum source identifies the Four Symbols with the cardinal directions. The south-facing default is a sourced product choice, not a universal rule for ancient observers.',
  'culture-classics': 'Supports the Four Symbols grouping, mansion order, and basic names. The interface does not invent unverified omen stories.',
  'relic-jincheng-government': 'Public photographs of the Yuan originals directly support review of six mansion sculptures; those photographs are not shipped in the public build.',
  'relic-scrolls': 'Twenty-eight scroll-style references support form research only; they are neither published by the site nor described as original-sculpture photography.',
  'relic-replicas': 'Modern colored replicas assist with clothing layers and local structure but never override higher-priority evidence from the originals.',
}

export function localizeSource(source: SourceRecord, locale: Locale): SourceRecord {
  if (locale === 'zh-CN') return source
  return { ...source, title: ({
    'location-wangchenggang-coordinate': 'Geographic Coordinates of the Wangchenggang Site (Quaternary Sciences)',
    'culture-wangchenggang-yangcheng': 'Wangchenggang and Research on “Yu’s Capital at Yangcheng”',
    'culture-four-symbol-directions': 'The Four Symbols and Cardinal Directions',
    'culture-classics': 'Records of the Grand Historian, Book of Jin, and the Traditional Mansion Sequence',
    'relic-jincheng-government': 'Public Record of the Yuan-Dynasty Twenty-Eight Mansion Sculptures at Fucheng Jade Emperor Temple',
    'relic-scrolls': 'Scroll References Based on the Yuan Sculpture Forms (28/28)',
    'relic-replicas': 'Modern Colored Replica References (28/28)',
  } as Record<string, string>)[source.id] ?? source.title, authorOrInstitution: ({
    'location-wangchenggang-coordinate': 'Institute of Earth Environment, Chinese Academy of Sciences et al.; Quaternary Sciences 38(2), 2018',
    'culture-wangchenggang-yangcheng': 'Henan Provincial Institute of Cultural Heritage and Archaeology; Zhengzhou Cultural Heritage Bureau',
    'culture-four-symbol-directions': 'The Palace Museum',
    'culture-classics': 'Traditional texts; cross-checked in modern critical editions',
    'relic-jincheng-government': 'Jincheng Municipal People’s Government',
    'relic-scrolls': 'Project research archive',
    'relic-replicas': 'Project research archive',
  } as Record<string, string>)[source.id] ?? source.authorOrInstitution, note: sourceNotes[source.id] ?? source.note }
}

const culturalSourceEnglish: Record<string, [string, string, string]> = {
  'primary-jinshu-tianwen': ['Book of Jin · Treatise One · Astronomy, Part One', 'Official history commissioned in the Tang; compiled by Fang Xuanling et al.', 'Used for each mansion’s star count, celestial office, human correspondence, and conditional omen language; readings are not reduced to fixed good/bad labels.'],
  'primary-shiji-tianguan': ['Records of the Grand Historian · Treatise on the Celestial Offices', 'Sima Qian, Western Han', 'Used for the Four Symbols, mansion order, and terrestrial divisions; the main text and Tang commentary are identified separately.'],
  'primary-dongyuan-juan8': ['Dongyuan ji, Scroll 8: Descent of the Star Lords of the Twenty-Eight Mansions', 'Compiled by Li Sicong, Northern Song', 'Used for Daoist star-lord titles, regions, and offices; production text includes only wording confirmed across checked transcriptions.'],
  'primary-daoist-ritual-variants': ['Twenty-Eight Mansion Star-Lord Titles in Daoist Ritual Texts', 'Ritual literature from the Southern Song and later', 'Confirms collective invocation of the mansion star lords and records title variants from the Dongyuan ji.'],
  'primary-butiange': ['Danyuanzi Song of Pacing the Heavens · Twenty-Eight Mansion Sections', 'Traditionally attributed to Wang Ximing / Danyuanzi; authorship and recensions disputed', 'Used for spatial organization of traditional asterisms; no single recension is used to settle every modern stellar identification.'],
  'research-sun-heaven-man': ['Connecting Heaven and Man: The Role of Astronomy in Ancient Chinese Society and Culture', 'Sun Xiaochun, 2011', 'Provides a research framework linking astronomy with politics, ritual, and heaven–human relations rather than a modern constellation encyclopedia.'],
  'research-chu-qin-daybooks': ['A Study of the Twenty-Eight Mansions in Chu and Qin Daybooks', 'Zhong Shouhua, 2009', 'Documents historical development of the mansion and omen systems and cautions against projecting later regularized schemes backward.'],
}

export function localizeCulturalSource(source: CulturalSourceRecord, locale: Locale): CulturalSourceRecord {
  if (locale === 'zh-CN') return source
  const value = culturalSourceEnglish[source.id]
  if (!value) throw new Error(`Missing English cultural source translation for ${source.id}`)
  return { ...source, title: value[0], authorOrCompiler: value[1], note: value[2], locator: 'See the cited section in the linked edition' }
}

const importantSourceNotes: Record<string, [string, string, string]> = {
  'classic-jinshu-tianwen': ['Book of Jin · Treatise on Astronomy, Part One', 'Tang-dynasty official history; Chinese Text Project transcription', 'Supports the seven Beidou names, Fu’s position, and Santai’s six-star, three-pair structure.'],
  'classic-qixu-xugao': ['Qixiu xugao · “Nine Stars of Beidou”', 'Lang Ying, Ming dynasty; Chinese Text Project transcription', 'Documents the nine-star scheme of seven plus Fu and Bi and the uncertainty surrounding Bi; it is not used to fabricate a modern counterpart.'],
  'daoist-beidou-nine': ['Scripture of the Hidden Names of the Nine Sovereigns of Beidou', 'Daoist scripture; Wikisource reading text', 'Supports the Daoist personification layer of the Nine Sovereigns without conflating it with early astronomical nomenclature.'],
  'daoist-nandou-six': ['Supreme Scripture of the Southern Dipper’s Six Offices, Extending Life and Delivering People', 'Daoist scripture; Kanseki Repository reading text', 'Supports the religious layer of Nandou’s six offices and life-extension traditions; divine titles remain distinct from early astronomical data.'],
  'astronomy-stellarium-song-important': ['Stellarium — Chinese Song Dynasty Sky', 'Sun Shuwei; Stellarium project', 'Supplies the historical figure lines and HIP membership for Beidou, Fu, and the three Santai pairs.'],
  'astronomy-simbad-important': ['SIMBAD Astronomical Database', 'CDS, Strasbourg', 'Verifies modern identifiers; HIP 55203 uses SIMBAD ICRS coordinates because its Hipparcos I/239 coordinate fields are blank.'],
}

export function localizeImportantSource(source: ImportantAsterismSource, locale: Locale): ImportantAsterismSource {
  if (locale === 'zh-CN') return source
  const value = importantSourceNotes[source.id]
  if (!value) throw new Error(`Missing English important-source translation for ${source.id}`)
  return { ...source, title: value[0], authorOrInstitution: value[1], note: value[2] }
}

export function traditionalFigureLabel(figure: TraditionalSkyFigure, locale: Locale) {
  if (locale === 'zh-CN') return figure.name
  const english = figure.englishName?.trim()
  return english ? `${english} (${figure.name})` : figure.name
}
