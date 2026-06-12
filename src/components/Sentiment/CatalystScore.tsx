import type { CatalystEvent, CatalystEventType } from '../../types/sentiment'
import { Trophy, Link2, Rocket, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react'
import { timeAgo } from '../../lib/utils'

interface Props {
  score?: number
  events?: CatalystEvent[]
}

function scoreColor(score: number): string {
  if (score >= 60) return 'text-gf-positive'
  if (score >= 40) return 'text-yellow-600'
  return 'text-gf-negative'
}

function scoreBg(score: number): string {
  if (score >= 60) return 'bg-gf-positive-bg'
  if (score >= 40) return 'bg-yellow-50'
  return 'bg-gf-negative-bg'
}

function eventIcon(type: CatalystEventType) {
  switch (type) {
    case 'contract_win':
      return Trophy
    case 'partnership':
      return Link2
    case 'product_launch':
      return Rocket
    case 'regulatory_approval':
      return CheckCircle2
    case 'contract_loss':
    case 'lawsuit':
    case 'layoffs':
      return XCircle
    case 'delay':
      return AlertTriangle
    default:
      return Clock
  }
}

function isPositive(type: CatalystEventType): boolean {
  return (
    type === 'contract_win' ||
    type === 'partnership' ||
    type === 'product_launch' ||
    type === 'regulatory_approval'
  )
}

function impactBadge(impact: CatalystEvent['impact']): { label: string; cls: string } {
  if (impact === 'high') return { label: 'HIGH', cls: 'bg-gf-positive-bg text-gf-positive' }
  if (impact === 'medium') return { label: 'MED', cls: 'bg-gf-accent-light text-gf-accent' }
  return { label: 'LOW', cls: 'bg-gf-neutral text-gf-neutral-text' }
}

export default function CatalystScore({ score, events }: Props) {
  if (score === undefined || score === null) return null

  const recent = (events ?? []).slice(0, 3)

  return (
    <div className="gf-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gf-text-secondary">Catalyst MoM</span>
        <div className={`flex items-center justify-center rounded-md px-3 py-1 ${scoreBg(score)}`}>
          <span className={`text-2xl font-bold font-mono ${scoreColor(score)}`}>{score}</span>
          <span className="text-xs text-gf-text-secondary ml-1 self-end mb-1">/100</span>
        </div>
      </div>

      {recent.length > 0 ? (
        <ul className="space-y-2">
          {recent.map((ev, i) => {
            const Icon = eventIcon(ev.type)
            const pos = isPositive(ev.type)
            const badge = impactBadge(ev.impact)
            return (
              <li key={i} className="flex items-start gap-2">
                <Icon
                  className={`w-4 h-4 mt-0.5 shrink-0 ${pos ? 'text-gf-positive' : 'text-gf-negative'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gf-text truncate">{ev.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gf-text-secondary">{timeAgo(ev.date)}</span>
                    <span className={`badge text-xs px-1.5 py-0 ${badge.cls}`}>{badge.label}</span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-xs text-gf-text-secondary">No recent catalyst events.</p>
      )}
    </div>
  )
}
