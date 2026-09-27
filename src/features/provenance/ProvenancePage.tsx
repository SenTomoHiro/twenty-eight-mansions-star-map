import { SOURCE_BY_ID, SOURCES } from '../../data/sources'
import { useLocale } from '../../i18n/i18n'
import { localizeSource } from '../../i18n/localizedData'

const yangchengSources = [
  SOURCE_BY_ID['location-wangchenggang-coordinate'],
  SOURCE_BY_ID['culture-wangchenggang-yangcheng'],
  SOURCE_BY_ID['culture-dengfeng-astronomy'],
  SOURCE_BY_ID['culture-four-symbol-directions'],
].filter(Boolean)

export function ProvenancePage() {
  const { locale } = useLocale()
  const english = locale === 'en'
  return (
    <main className="provenance-page" id="main-content">
      <section className="sources-section" aria-labelledby="sources-title">
        <header>
          <p className="eyebrow"><span>PROVENANCE & METHOD</span><i /><span>{english ? 'Source-aware documentation' : '可追溯资料系统'}</span></p>
          <h1 id="sources-title">{english ? 'Grounded in sources, explicit about limits' : '有所本，亦知其界'}</h1>
          <p>{english ? 'Astronomical coordinates, traditional asterisms, and heritage forms are sourced separately. Research images support comparison only and are not shipped as a public gallery.' : '天文坐标、传统星官与文物造型分别记录来源。研究素材只用于造型比对，未作为公开图库装入网站。'}</p>
        </header>
        <div className="source-columns">
          {(['astronomy', 'culture', 'relic'] as const).map((type) => (
            <div key={type}>
              <h2>{type === 'astronomy' ? (english ? 'Astronomical evidence' : '天文依据') : type === 'culture' ? (english ? 'Cultural evidence' : '文化依据') : (english ? 'Heritage evidence' : '文物依据')}</h2>
              {SOURCES.filter((source) => source.type === type).map((source) => localizeSource(source, locale)).map((source) => (
                <article key={source.id}>
                  <span>{source.verified ? (english ? 'Verified' : '已校验') : (english ? 'Pending review' : '待校验')}</span>
                  <strong>{source.title}</strong>
                  <p>{source.note}</p>
                  {source.url ? <a href={source.url} target="_blank" rel="noreferrer">{english ? 'Original source' : '原始来源'} ↗</a> : null}
                </article>
              ))}
            </div>
          ))}
        </div>
      </section>
      <section className="yangcheng-provenance" aria-labelledby="yangcheng-title">
        <header>
          <p className="eyebrow"><span>REFERENCE ORIGIN</span><i /><span>{english ? 'Cultural point of departure' : '文化参考起点'}</span></p>
          <h2 id="yangcheng-title">{english ? 'Why Yangcheng is the default observer location' : '为什么以阳城为默认观测点'}</h2>
          <p>{english ? 'This is a reference coordinate for a cultural display, not a claim about every astronomical observation site of the Xia period.' : '这是文化展示系统采用的参考坐标，不是对夏朝所有天文观测地点的历史断言。'}</p>
        </header>
        <div className="yangcheng-provenance__chapters">
          <article>
            <small>01</small>
            <h3>{english ? 'Yangcheng and the Xia-capital tradition' : '夏都阳城'}</h3>
            <p>{english ? 'Wangchenggang is important to research on the textual tradition of “Yu’s capital at Yangcheng” and early Xia urban sites, so it serves as the default reference for early Chinese sky-observation culture. Its precise political status remains a matter for archaeological evidence and scholarship; the project does not call it the Xia dynasty’s sole, undisputed capital.' : '王城岗与文献所见“禹都阳城”及夏代早期都邑研究存在重要关联，因此本项目将其选作中国早期观象文化的默认参考观测点。有关具体都邑性质的研究仍应放在考古证据与学术讨论中理解，不将王城岗写成整个夏朝唯一且毫无争议的首都。'}</p>
          </article>
          <article>
            <small>02</small>
            <h3>{english ? 'The Centre of Heaven and Earth' : '天地之中'}</h3>
            <p>{english ? 'Dengfeng and Gaocheng have long carried the spatial idea of the “Centre of Heaven and Earth.” The observatory and gnomon traditions of measuring shadows, fixing direction, calendrical work, and observing the sky give the region significance in both early urban research and ancient astronomical culture.' : '登封、告成地区长期承载“天地之中”的空间观念。告成观星台与周公测景台所体现的测影、定方位、历法与观象传统，使这片地域同时具有早期都邑研究与古代天文文化的双重意义。'}</p>
          </article>
          <article>
            <small>03</small>
            <h3>{english ? 'Why this project uses the location' : '本项目为什么选择这里'}</h3>
            <p>{english ? 'Traditional Chinese skies do not belong to a single place. Yangcheng is used as a cultural point of departure because of its dual significance to early urban and astronomical history. The engineering coordinate is 34.400278°N, 113.125556°E in Asia/Shanghai.' : '本系统并非认为中国传统星空只属于某一个地点，而是选择具有早期都邑与古代天文文化双重意义的阳城地区，作为进入传统星空的文化参考起点。工程坐标为 34.400278°N、113.125556°E，时区为 Asia/Shanghai。'}</p>
          </article>
          <article>
            <small>04</small>
            <h3>{english ? 'Why the initial view faces south' : '为什么默认朝南'}</h3>
            <p>{english ? 'In the Four Symbols system, south corresponds to the Vermilion Bird, north to the Black Tortoise, east to the Azure Dragon, and west to the White Tiger. The south-facing initial view is a culturally grounded design choice, not a claim that every historical Chinese astronomer had to begin by facing south.' : '中国传统四象秩序中，南方与朱雀、北方与玄武、东方与青龙、西方与白虎相应。本系统据此将正南选为地理观测视图的产品默认进入方向，这是有传统文化依据的视角设计，并非宣称所有中国古代天文家都必须先朝南观测。'}</p>
          </article>
        </div>
        <div className="yangcheng-provenance__sources">
          <h3>{english ? 'Institutional and formal sources' : '机构与正式文献来源'}</h3>
          {yangchengSources.map((source) => source ? localizeSource(source, locale) : source).map((source) => source ? (
            <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
              <span>{source.authorOrInstitution}</span>
              <strong>{source.title}</strong>
              <i aria-hidden="true">↗</i>
            </a>
          ) : null)}
        </div>
      </section>
      <footer className="site-footer">
        <div><span>宿</span><strong>{english ? 'Twenty-Eight Mansions Star Map' : '二十八星宿星图系统'}</strong></div>
        <p>{english ? 'Traditional Chinese mansion culture and interpretive astronomical visualization' : '中国传统星宿文化展示与展示级天象可视化'}<br />YANGCHENG REFERENCE VIEW · 2026</p>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{english ? 'Back to top' : '返回顶部'} ↑</button>
      </footer>
    </main>
  )
}
