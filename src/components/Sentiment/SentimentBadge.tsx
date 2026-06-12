import { getSentimentBg } from '../../lib/utils'
import type { SentimentLabel } from '../../types/sentiment'

interface Props {
  label: SentimentLabel
  score: number
  size?: 'sm' | 'md'
}

export default function SentimentBadge({ label, score, size = 'sm' }: Props) {
  const cls = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'
  return (
    <span className={`inline-flex items-center gap-1 rounded font-medium ${cls} ${getSentimentBg(label)}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label} {score}
    </span>
  )
}
