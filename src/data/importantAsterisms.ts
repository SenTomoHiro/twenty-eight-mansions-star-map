import mansionStarMappingsData from './mansion-star-mappings.json'
import traditionalSkyData from './traditional-chinese-sky.json'
import type { ImportantAsterism, ImportantAsterismId, ResolvedImportantMember } from '../types/importantAsterism'
import type { MansionMappedStar, MansionStarMapping, TraditionalChineseSkyData } from '../types/xingxiu'

const mansionMappings = mansionStarMappingsData.mappings as MansionStarMapping[]
const traditionalSky = traditionalSkyData as TraditionalChineseSkyData
const douMapping = mansionMappings.find((mapping) => mapping.mansionId === 'xingxiu-08-dou')
  ?? (() => { throw new Error('Missing the shared Dou mansion mapping') })()

const sourceFigureIds = {
  beidou: 'CON chinese_song_dynasty P37',
  fu: 'CON chinese_song_dynasty P38',
  santaiUpper: 'CON chinese_song_dynasty S20',
  santaiMiddle: 'CON chinese_song_dynasty S21',
  santaiLower: 'CON chinese_song_dynasty S22',
  santaiWhole: 'CON chinese_song_dynasty S23',
} as const

function linesForFigure(id: string) {
  const figure = traditionalSky.figures.find((entry) => entry.id === id)
  if (!figure) throw new Error(`Missing traditional sky figure ${id}`)
  return figure.lines.filter((strip): strip is number[] => strip.every((reference) => typeof reference === 'number'))
}

const beidouLines = linesForFigure(sourceFigureIds.beidou)
const santaiLines = [
  ...linesForFigure(sourceFigureIds.santaiUpper),
  ...linesForFigure(sourceFigureIds.santaiMiddle),
  ...linesForFigure(sourceFigureIds.santaiLower),
]

export const IMPORTANT_ASTERISMS: ImportantAsterism[] = [
  {
    id: 'beidou-nine',
    order: 1,
    name: '北斗九星',
    latin: 'BEIDOU · NINE STARS',
    aliases: ['北斗', '北斗七星与辅弼'],
    category: 'important-asterism',
    traditionalRegion: '紫微垣传统天区',
    members: [
      { id: 'tianshu', name: '天枢', hip: 54061, designation: 'α Ursae Majoris', commonName: 'Dubhe', mapping: 'modern-star', note: '北斗第一星。' },
      { id: 'tianxuan', name: '天璇', hip: 53910, designation: 'β Ursae Majoris', commonName: 'Merak', mapping: 'modern-star', note: '北斗第二星。' },
      { id: 'tianji', name: '天玑', hip: 58001, designation: 'γ Ursae Majoris', commonName: 'Phecda', mapping: 'modern-star', note: '北斗第三星。' },
      { id: 'tianquan', name: '天权', hip: 59774, designation: 'δ Ursae Majoris', commonName: 'Megrez', mapping: 'modern-star', note: '北斗第四星。' },
      { id: 'yuheng', name: '玉衡', hip: 62956, designation: 'ε Ursae Majoris', commonName: 'Alioth', mapping: 'modern-star', note: '北斗第五星。' },
      { id: 'kaiyang', name: '开阳', hip: 65378, designation: 'ζ Ursae Majoris', commonName: 'Mizar', mapping: 'modern-star', note: '北斗第六星。' },
      { id: 'yaoguang', name: '摇光', hip: 67301, designation: 'η Ursae Majoris', commonName: 'Alkaid', mapping: 'modern-star', note: '北斗第七星。' },
      { id: 'fu', name: '辅星', hip: 65477, designation: '80 Ursae Majoris', commonName: 'Alcor', mapping: 'modern-star', note: '《晋书·天文志》称辅星傅乎开阳；宋代星图数据亦将辅映射为 HIP 65477。' },
      { id: 'bi', name: '弼星', mapping: 'traditional-position-only', note: '古籍有弼星记载，但本项目未找到足以确定其现代 HIP／Bayer 身份的一致可靠依据；现代恒星对应未作确定。' },
    ],
    lines: beidouLines,
    childGroups: [],
    astronomySummary: '北斗主体为天枢至摇光七星；辅星附于开阳附近。九星说将辅、弼并入文化结构，但弼星的现代恒星对应不在本项目中作确定。',
    daoistSummary: '道教经典发展出北斗九皇等神格化体系，相关尊号与职掌属于宗教文献层，不作为早期星官命名的同义替代。',
    culturalMeaning: '北斗在古代观象、方位辨识与历法文化中地位突出，后世又形成禳解、延生等星斗信仰。',
    modernMappingNotes: '七颗主星与辅星均采用可核验 HIP；弼星仅在详情示意中以虚线传统星位出现，不进入真实天球命中或连线。',
    mappingConfidence: 'mixed',
    sourceIds: ['classic-jinshu-tianwen', 'classic-qixu-xugao', 'daoist-beidou-nine', 'astronomy-stellarium-song-important', 'astronomy-simbad-important'],
    sourceFigureIds: [sourceFigureIds.beidou, sourceFigureIds.fu],
  },
  {
    id: 'nandou-six',
    order: 2,
    name: '南斗六星',
    latin: 'NANDOU · SIX STARS',
    aliases: ['南斗', '斗宿六星'],
    category: 'important-asterism',
    traditionalRegion: '北方玄武 · 斗宿天区',
    members: douMapping.stars.map((star, index) => ({
      id: `nandou-${index + 1}`,
      name: `南斗第${['一', '二', '三', '四', '五', '六'][index]}星`,
      hip: star.hip,
      designation: ['μ Sagittarii', 'λ Sagittarii', 'φ Sagittarii', 'σ Sagittarii', 'τ Sagittarii', 'ζ Sagittarii'][index],
      mapping: 'shared-mansion-star' as const,
      note: `复用斗宿现有第 ${index + 1} 颗恒星实体，不另建坐标。`,
    })),
    lines: douMapping.lines,
    childGroups: [],
    astronomySummary: '南斗六星在本系统中就是二十八宿“斗宿”的六颗主星。同一组现代天文对象在二十八宿语境与重要星官语境中承载不同文化身份。',
    daoistSummary: '《太上说南斗六司延寿度人妙经》等道教文献将南斗神格化为六司，并发展出延寿度人的宗教意义；六司尊号不反向改写早期天文学数据。',
    culturalMeaning: '“南斗”因斗形与北斗相对而得名，后世形成与北斗相应的星斗信仰。',
    modernMappingNotes: '直接引用 xingxiu-08-dou 的 stars 与 lines；没有第二套 HIP、坐标或连线数据。',
    mappingConfidence: 'high',
    sourceIds: ['classic-jinshu-tianwen', 'daoist-nandou-six', 'astronomy-stellarium-song-important', 'astronomy-simbad-important'],
    sourceFigureIds: [],
    sharedMansionId: douMapping.mansionId,
  },
  {
    id: 'santai',
    order: 3,
    name: '三台',
    latin: 'SANTAI · THREE STEPS',
    aliases: ['三阶', '天阶'],
    category: 'important-asterism',
    traditionalRegion: '太微垣传统天区',
    members: [
      { id: 'upper-1', name: '上台一', hip: 44127, designation: 'ι Ursae Majoris', mapping: 'modern-star', childGroupId: 'upper', note: '上台两星之一。' },
      { id: 'upper-2', name: '上台二', hip: 44471, designation: 'κ Ursae Majoris', mapping: 'modern-star', childGroupId: 'upper', note: '上台两星之一。' },
      { id: 'middle-1', name: '中台一', hip: 50372, designation: 'λ Ursae Majoris', mapping: 'modern-star', childGroupId: 'middle', note: '中台两星之一。' },
      { id: 'middle-2', name: '中台二', hip: 50801, designation: 'μ Ursae Majoris', mapping: 'modern-star', childGroupId: 'middle', note: '中台两星之一。' },
      { id: 'lower-1', name: '下台一', hip: 55219, designation: 'ν Ursae Majoris', mapping: 'modern-star', childGroupId: 'lower', note: '下台两星之一。' },
      { id: 'lower-2', name: '下台二', hip: 55203, designation: 'ξ Ursae Majoris', mapping: 'modern-star', childGroupId: 'lower', note: '下台两星之一；坐标由 SIMBAD 回退核验。' },
    ],
    lines: santaiLines,
    childGroups: [
      { id: 'upper', name: '上台', memberIds: ['upper-1', 'upper-2'], summary: '上台由两星组成，是三台的第一阶。' },
      { id: 'middle', name: '中台', memberIds: ['middle-1', 'middle-2'], summary: '中台由两星组成，是三台的第二阶。' },
      { id: 'lower', name: '下台', memberIds: ['lower-1', 'lower-2'], summary: '下台由两星组成，是三台的第三阶。' },
    ],
    astronomySummary: '三台是一个由六星组成的星官：上台二星、中台二星、下台二星，共三组而非三颗星。',
    daoistSummary: '后世宗教与术数资料对三台另有神格化和象征解释；本页只将可溯源内容标注为相应文化层，不与正史天文志的六星结构混同。',
    culturalMeaning: '正史天文志以天阶阐释三台，形成由下而上的秩序意象。',
    modernMappingNotes: '六颗成员采用 Stellarium 宋代中国星空 HIP 映射；三个子组各自只连接对应两星。',
    mappingConfidence: 'high',
    sourceIds: ['classic-jinshu-tianwen', 'astronomy-stellarium-song-important', 'astronomy-simbad-important'],
    sourceFigureIds: [sourceFigureIds.santaiUpper, sourceFigureIds.santaiMiddle, sourceFigureIds.santaiLower, sourceFigureIds.santaiWhole],
  },
]

export const IMPORTANT_ASTERISM_BY_ID = Object.fromEntries(
  IMPORTANT_ASTERISMS.map((asterism) => [asterism.id, asterism]),
) as Record<ImportantAsterismId, ImportantAsterism>

export const IMPORTANT_SOURCE_FIGURE_IDS = new Set(
  IMPORTANT_ASTERISMS.flatMap((asterism) => asterism.sourceFigureIds),
)

const traditionalStarByHip = new Map(traditionalSky.stars.map((star) => [star.hip, star]))

export function resolveImportantMembers(asterism: ImportantAsterism): ResolvedImportantMember[] {
  const sharedStars = asterism.sharedMansionId === douMapping.mansionId
    ? new Map(douMapping.stars.map((star) => [star.hip, star]))
    : undefined
  return asterism.members.map((member) => ({
    ...member,
    star: member.hip === undefined
      ? undefined
      : sharedStars?.get(member.hip) ?? traditionalStarByHip.get(member.hip) as MansionMappedStar | undefined,
  }))
}

export function resolvedImportantStars(asterism: ImportantAsterism) {
  return resolveImportantMembers(asterism).flatMap((member) => member.star ? [member.star] : [])
}

export function importantAsterismCenterHip(asterism: ImportantAsterism) {
  return resolveImportantMembers(asterism).find((member) => member.hip)?.hip
}
