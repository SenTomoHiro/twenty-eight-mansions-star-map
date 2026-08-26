# 资料来源与处理原则

本页说明公开网站实际使用的数据与文化资料。项目不上传本地人工审核参考图、原始视频或私人研究档案。

## 现代天文数据

- [Bright Star Catalogue, 5th Revised Edition（CDS VizieR V/50）](https://cdsarc.cds.unistra.fr/viz-bin/ReadMe/V/50?format=html)：背景亮星的 J2000 赤经、赤纬与 V 星等。
- [Hipparcos Main Catalogue（I/239）](https://cdsarc.cds.unistra.fr/viz-bin/cat/I/239)：传统星空 HIP 成员的 ICRS 坐标与 V 星等。
- [Hipparcos New Reduction（I/311）](https://cdsarc.cds.unistra.fr/viz-bin/cat/I/311)：二十八宿距星视差与形式误差；只在相对误差不超过 20% 时显示简单反演的近似距离。
- [SIMBAD Astronomical Database](https://simbad.cds.unistra.fr/simbad/) 与 CDS Sesame：核验现代恒星标识并为缺失目录坐标提供回退。HIP 55203 在 I/239 中坐标字段留空，三台映射使用 SIMBAD 核验的 ICRS 坐标。
- [USNO 恒星时说明](https://aa.usno.navy.mil/faq/GAST)：地方恒星时与坐标转换方法参考。

## 二十八宿与传统星官

- [Stellarium 26.2 — Chinese Song Dynasty Sky](https://github.com/Stellarium/stellarium/tree/v26.2/skycultures/chinese_song_dynasty)：Sun Shuwei（孙殳玮）贡献，CC BY-SA 4.0。项目固定使用 v26.2 / commit `2b10b1a3bb534eb4e7586751054bf67b36c22e53` 的星官成员与技术连线，并保留公开上游快照和可复现审计脚本。
- [《晋书·天文志上》](https://ctext.org/wiki.pl?chapter=993298&if=gb)：二十八宿、北斗七星名号、辅星及三台六星结构。
- [《史记·天官书》](https://ctext.org/wiki.pl?chapter=574568&if=gb)：四象、二十八舍次序及传统天官语境。
- [《步天歌》](https://zh.wikisource.org/zh-hans/%E6%AD%A5%E5%A4%A9%E6%AD%8C_(%E4%BD%95%E5%90%9B%E8%97%A9))：传统星官空间组织；作者、年代与传本有讨论，项目不以单一传本解决全部现代映射。
- 孙小淳：*Connecting Heaven and Man: The role of astronomy in ancient Chinese society and culture*，用于古代天文、政治礼制与天人关系的研究框架。

## 道教文化资料

- 《洞渊集》卷八《周天二十八宿星君降灵》及相关道教科仪：二十八宿星君称号与职掌。不同经仪存在异称，页面不强行合并为唯一标准。
- [《北斗九皇隐讳经》](https://zh.wikisource.org/wiki/北斗九皇隱諱經)：北斗九皇的道教神格化资料。
- [《太上说南斗六司延寿度人妙经》](https://ask.bunkankun.org/KR5/KR5c/KR5c0005)：南斗六司与延寿度人的宗教文化层。
- [《七修续稿》北斗九星条](https://ctext.org/wiki.pl?chapter=578014&if=gb)：七星加辅、弼称九星及不同传统的差异线索。

正史天文学、道教经典与后世术数／民间称谓在数据和页面中分层陈述，不把后出的神格称号写成最早天文学事实。

## 重要星官现代映射

- 北斗七颗主星：α、β、γ、δ、ε、ζ、η Ursae Majoris，对应 HIP 54061、53910、58001、59774、62956、65378、67301。
- 辅星：Alcor / 80 Ursae Majoris，HIP 65477；依据传统星图与现代专业数据库交叉核验。
- 弼星：保留为传统文化星位，现代恒星对应未作确定，不进入真实天球坐标。
- 南斗六星：直接复用斗宿现有 HIP 89341、90496、92041、92855、93864、93506，不维护第二套坐标。
- 三台：上台 HIP 44127、44471；中台 HIP 50372、50801；下台 HIP 55219、55203，共六星。

## 二十八星宿神像

山西晋城府城玉皇庙二十八星宿彩塑是主要文化与造型研究对象。项目参考晋城市人民政府公开的原塑资料，并按“官方元代原塑摄影 > 元代原塑造型挂轴参考 > 现代彩塑复制品”的优先级研究造型。

正式网站使用项目整理并经用户逐张人工审核通过的数字插画，不把所有参考照片原样公开。挂轴参考仅作造型资料，不称作元代原塑原始摄影。公开仓库只包含网站运行所需的正式 Web 插画。

## 地点文化资料

- [王城岗遗址资料](https://wwj.zhengzhou.gov.cn/country/3175818.jhtml)与《第四纪研究》论文坐标：用于“夏都阳城参考视角”。项目保持考古表述谨慎，不作排他性都城定论。
- [UNESCO 登封“天地之中”历史建筑群](https://whc.unesco.org/en/list/1305)：登封天文观测与文化语境。

## 不确定性说明

古代星官成员、距星制度、连线图式与现代恒星的一一对应并非在所有时代和传本中都完全一致。当前系统采用一套可追溯、适合展示的版本，并在数据中保存来源、差异说明与置信度。遇到无法可靠确定的映射时，项目明确标记而不猜测。
