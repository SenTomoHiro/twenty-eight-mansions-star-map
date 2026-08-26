import { SOURCE_BY_ID, SOURCES } from '../../data/sources'

const yangchengSources = [
  SOURCE_BY_ID['location-wangchenggang-coordinate'],
  SOURCE_BY_ID['culture-wangchenggang-yangcheng'],
  SOURCE_BY_ID['culture-dengfeng-astronomy'],
  SOURCE_BY_ID['culture-four-symbol-directions'],
].filter(Boolean)

export function ProvenancePage() {
  return (
    <main className="provenance-page" id="main-content">
      <section className="sources-section" aria-labelledby="sources-title">
        <header>
          <p className="eyebrow"><span>PROVENANCE & METHOD</span><i /><span>可追溯资料系统</span></p>
          <h1 id="sources-title">有所本，亦知其界</h1>
          <p>天文坐标、传统星官与文物造型分别记录来源。研究素材只用于造型比对，未作为公开图库装入网站。</p>
        </header>
        <div className="source-columns">
          {(['astronomy', 'culture', 'relic'] as const).map((type) => (
            <div key={type}>
              <h2>{type === 'astronomy' ? '天文依据' : type === 'culture' ? '文化依据' : '文物依据'}</h2>
              {SOURCES.filter((source) => source.type === type).map((source) => (
                <article key={source.id}>
                  <span>{source.verified ? '已校验' : '待校验'}</span>
                  <strong>{source.title}</strong>
                  <p>{source.note}</p>
                  {source.url ? <a href={source.url} target="_blank" rel="noreferrer">原始来源 ↗</a> : null}
                </article>
              ))}
            </div>
          ))}
        </div>
      </section>
      <section className="yangcheng-provenance" aria-labelledby="yangcheng-title">
        <header>
          <p className="eyebrow"><span>REFERENCE ORIGIN</span><i /><span>文化参考起点</span></p>
          <h2 id="yangcheng-title">为什么以阳城为默认观测点</h2>
          <p>这是文化展示系统采用的参考坐标，不是对夏朝所有天文观测地点的历史断言。</p>
        </header>
        <div className="yangcheng-provenance__chapters">
          <article>
            <small>01</small>
            <h3>夏都阳城</h3>
            <p>王城岗与文献所见“禹都阳城”及夏代早期都邑研究存在重要关联，因此本项目将其选作中国早期观象文化的默认参考观测点。有关具体都邑性质的研究仍应放在考古证据与学术讨论中理解，不将王城岗写成整个夏朝唯一且毫无争议的首都。</p>
          </article>
          <article>
            <small>02</small>
            <h3>天地之中</h3>
            <p>登封、告成地区长期承载“天地之中”的空间观念。告成观星台与周公测景台所体现的测影、定方位、历法与观象传统，使这片地域同时具有早期都邑研究与古代天文文化的双重意义。</p>
          </article>
          <article>
            <small>03</small>
            <h3>本项目为什么选择这里</h3>
            <p>本系统并非认为中国传统星空只属于某一个地点，而是选择具有早期都邑与古代天文文化双重意义的阳城地区，作为进入传统星空的文化参考起点。工程坐标为 34.400278°N、113.125556°E，时区为 Asia/Shanghai。</p>
          </article>
          <article>
            <small>04</small>
            <h3>为什么默认朝南</h3>
            <p>中国传统四象秩序中，南方与朱雀、北方与玄武、东方与青龙、西方与白虎相应。本系统据此将正南选为地理观测视图的产品默认进入方向，这是有传统文化依据的视角设计，并非宣称所有中国古代天文家都必须先朝南观测。</p>
          </article>
        </div>
        <div className="yangcheng-provenance__sources">
          <h3>机构与正式文献来源</h3>
          {yangchengSources.map((source) => source ? (
            <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
              <span>{source.authorOrInstitution}</span>
              <strong>{source.title}</strong>
              <i aria-hidden="true">↗</i>
            </a>
          ) : null)}
        </div>
      </section>
      <footer className="site-footer">
        <div><span>宿</span><strong>二十八星宿星图系统</strong></div>
        <p>中国传统星宿文化展示与展示级天象可视化<br />YANGCHENG REFERENCE VIEW · 2026</p>
        <a href="/">返回观星 ↑</a>
      </footer>
    </main>
  )
}
