export interface ImportantAsterismSource {
  id: string
  title: string
  authorOrInstitution: string
  publication?: string
  url: string
  note: string
}

export const IMPORTANT_ASTERISM_SOURCES: ImportantAsterismSource[] = [
  {
    id: 'classic-jinshu-tianwen',
    title: '《晋书·天文志上》',
    authorOrInstitution: '唐代官修正史；中国哲学书电子化计划文本',
    url: 'https://ctext.org/wiki.pl?chapter=993298&if=gb',
    note: '用于北斗七星名号、辅星位置及三台六星、上中下三组结构。',
  },
  {
    id: 'classic-qixu-xugao',
    title: '《七修续稿》北斗九星条',
    authorOrInstitution: '明代郎瑛；中国哲学书电子化计划文本',
    url: 'https://ctext.org/wiki.pl?chapter=578014&if=gb',
    note: '用于说明七星加辅、弼称九星及弼星在不同传统中的不确定性；不据此虚构现代恒星对应。',
  },
  {
    id: 'daoist-beidou-nine',
    title: '《北斗九皇隐讳经》',
    authorOrInstitution: '道教经典；维基文库校读入口',
    url: 'https://zh.wikisource.org/wiki/北斗九皇隱諱經',
    note: '用于北斗九皇的道教神格化层；不与早期天文学星官事实混写。',
  },
  {
    id: 'daoist-nandou-six',
    title: '《太上说南斗六司延寿度人妙经》',
    authorOrInstitution: '道教经典；汉籍全文资料库校读入口',
    url: 'https://ask.bunkankun.org/KR5/KR5c/KR5c0005',
    note: '用于南斗六司、延寿度人等宗教文化层；具体尊号属于道教经典体系。',
  },
  {
    id: 'astronomy-stellarium-song-important',
    title: 'Stellarium — Chinese Song Dynasty Sky',
    authorOrInstitution: 'Sun Shuwei（孙殳玮）；Stellarium project',
    publication: 'Stellarium v26.2，CC BY-SA 4.0',
    url: 'https://github.com/Stellarium/stellarium/tree/v26.2/skycultures/chinese_song_dynasty',
    note: '用于北斗、辅及三台各组的历史星官连线与 HIP 成员映射。',
  },
  {
    id: 'astronomy-simbad-important',
    title: 'SIMBAD Astronomical Database',
    authorOrInstitution: 'CDS, Strasbourg',
    url: 'https://simbad.cds.unistra.fr/simbad/',
    note: '核验成员 HIP 的现代恒星标识；HIP 55203 因 Hipparcos I/239 坐标字段留空，采用 SIMBAD ICRS 坐标回退。',
  },
]

export const IMPORTANT_ASTERISM_SOURCE_BY_ID = Object.fromEntries(
  IMPORTANT_ASTERISM_SOURCES.map((source) => [source.id, source]),
) as Record<string, ImportantAsterismSource>

