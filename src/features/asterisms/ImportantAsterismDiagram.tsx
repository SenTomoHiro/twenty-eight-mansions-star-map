import { useMemo } from 'react'
import { resolveImportantMembers } from '../../data/importantAsterisms'
import type { ImportantAsterism } from '../../types/importantAsterism'

interface ImportantAsterismDiagramProps {
  asterism: ImportantAsterism
  selectedMemberIds: string[]
}

function wrappedDelta(value: number, center: number) {
  return ((value - center + 540) % 360) - 180
}

export function ImportantAsterismDiagram({ asterism, selectedMemberIds }: ImportantAsterismDiagramProps) {
  const resolved = useMemo(() => resolveImportantMembers(asterism), [asterism])
  const plotted = resolved.filter((member) => member.star)
  const centerRa = plotted.length > 0
    ? Math.atan2(
        plotted.reduce((sum, member) => sum + Math.sin((member.star!.ra * Math.PI) / 180), 0),
        plotted.reduce((sum, member) => sum + Math.cos((member.star!.ra * Math.PI) / 180), 0),
      ) * 180 / Math.PI
    : 0
  const rawPoints = plotted.map((member) => ({
    member,
    x: wrappedDelta(member.star!.ra, centerRa) * Math.cos((member.star!.dec * Math.PI) / 180),
    y: member.star!.dec,
  }))
  const minX = Math.min(...rawPoints.map((point) => point.x), -1)
  const maxX = Math.max(...rawPoints.map((point) => point.x), 1)
  const minY = Math.min(...rawPoints.map((point) => point.y), -1)
  const maxY = Math.max(...rawPoints.map((point) => point.y), 1)
  const pointByHip = new Map(rawPoints.map((point) => [point.member.hip, {
    ...point,
    sx: 12 + ((point.x - minX) / Math.max(1, maxX - minX)) * 76,
    sy: 82 - ((point.y - minY) / Math.max(1, maxY - minY)) * 64,
  }]))
  const selected = new Set(selectedMemberIds)
  const bi = resolved.find((member) => member.mapping === 'traditional-position-only')
  const lastReal = pointByHip.get(67301) ?? [...pointByHip.values()].at(-1)

  return (
    <figure className="important-diagram">
      <svg viewBox="0 0 100 100" role="img" aria-label={`${asterism.name}成员星位示意`}>
        <circle className="important-diagram__orbit" cx="50" cy="50" r="45" />
        {asterism.lines.flatMap((strip) => strip.slice(1).map((hip, index) => {
          const from = pointByHip.get(strip[index])
          const to = pointByHip.get(hip)
          return from && to ? (
            <line key={`${strip[index]}-${hip}`} x1={from.sx} y1={from.sy} x2={to.sx} y2={to.sy} />
          ) : null
        }))}
        {[...pointByHip.values()].map(({ member, sx, sy }) => (
          <g key={member.id} className={selected.has(member.id) ? 'is-selected' : ''}>
            <circle cx={sx} cy={sy} r={selected.has(member.id) ? 3.2 : 2.1} />
            <text x={sx + 2.8} y={sy - 2.8}>{member.name}</text>
          </g>
        ))}
        {bi && lastReal ? (
          <g className={`is-traditional${selected.has(bi.id) ? ' is-selected' : ''}`}>
            <line x1={lastReal.sx} y1={lastReal.sy} x2={Math.min(92, lastReal.sx + 9)} y2={Math.min(92, lastReal.sy + 8)} />
            <circle cx={Math.min(92, lastReal.sx + 9)} cy={Math.min(92, lastReal.sy + 8)} r="2.7" />
            <text x={Math.min(88, lastReal.sx + 12)} y={Math.min(96, lastReal.sy + 11)}>弼 · 传统示意</text>
          </g>
        ) : null}
      </svg>
      <figcaption>
        <span><i />真实恒星</span>
        {bi ? <span className="is-traditional"><i />传统星位 · 无现代映射</span> : null}
      </figcaption>
    </figure>
  )
}

