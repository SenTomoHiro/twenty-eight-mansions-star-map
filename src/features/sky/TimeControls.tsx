import { useMemo } from 'react'
import {
  dateInputValue,
  formatChineseDate,
  representativeSeasonDate,
} from '../../utils/astronomy'

interface TimeControlsProps {
  date: string
  time: string
  timezone: string
  onDateChange: (value: string) => void
  onTimeChange: (value: string) => void
}

const seasons = [
  { id: 'spring', name: '春', date: '春分前后' },
  { id: 'summer', name: '夏', date: '夏至前后' },
  { id: 'autumn', name: '秋', date: '秋分前后' },
  { id: 'winter', name: '冬', date: '冬至前后' },
] as const

export function TimeControls({ date, time, timezone, onDateChange, onTimeChange }: TimeControlsProps) {
  const year = Number(date.slice(0, 4)) || new Date().getFullYear()
  const formatted = useMemo(() => formatChineseDate(date, timezone), [date, timezone])
  const [hours = 21, minutes = 0] = time.split(':').map(Number)
  const timeMinutes = Math.min(23 * 60 + 30, Math.max(0, hours * 60 + minutes))

  const changeTimeByMinutes = (value: string) => {
    const total = Number(value)
    const nextHours = Math.floor(total / 60)
    const nextMinutes = total % 60
    onTimeChange(`${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`)
  }

  const stepTime = (amount: number) => {
    const total = (timeMinutes + amount + 1440) % 1440
    changeTimeByMinutes(String(total))
  }

  return (
    <div className="time-controls">
      <div className="time-controls__primary">
        <label className="date-control">
          <span>观测日期</span>
          <input
            type="date"
            value={date}
            min="1900-01-01"
            max="2100-12-31"
            onChange={(event) => {
              if (event.target.value) onDateChange(event.target.value)
            }}
          />
          <strong>{formatted}</strong>
        </label>
        <div className="time-control">
          <span>地方时刻</span>
          <div className="time-control__value">
            <button type="button" aria-label="时刻减少三十分钟" onClick={() => stepTime(-30)}>−</button>
            <strong>{time}</strong>
            <button type="button" aria-label="时刻增加三十分钟" onClick={() => stepTime(30)}>+</button>
          </div>
          <input
            type="range"
            min="0"
            max="1410"
            step="30"
            value={timeMinutes}
            aria-label="当天时刻，每次三十分钟"
            onChange={(event) => changeTimeByMinutes(event.target.value)}
          />
        </div>
        <button className="text-button" type="button" onClick={() => onDateChange(dateInputValue())}>
          回到今日
        </button>
      </div>
      <div className="season-selector" aria-label="四季代表日期">
        {seasons.map((season) => (
          <button
            key={season.id}
            type="button"
            title={season.date}
            onClick={() => onDateChange(representativeSeasonDate(year, season.id))}
          >
            <span>{season.name}</span>
            <small>{season.date}</small>
          </button>
        ))}
      </div>
    </div>
  )
}
