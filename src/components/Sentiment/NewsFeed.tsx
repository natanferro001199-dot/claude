import { ExternalLink } from 'lucide-react'
import type { NewsArticle } from '../../types/sentiment'
import { getSentimentBg, timeAgo } from '../../lib/utils'

interface Props {
  articles: NewsArticle[]
  filterFilingsOnly?: boolean
}

export default function NewsFeed({ articles, filterFilingsOnly = false }: Props) {
  const filtered = filterFilingsOnly ? articles.filter((a) => a.isFilingRelated) : articles

  if (!filtered.length) return null

  return (
    <div className="gf-card overflow-hidden">
      <div className="px-4 py-2 bg-gf-bg border-b border-gf-border">
        <span className="text-xs font-semibold text-gf-text-secondary uppercase tracking-wide">
          {filterFilingsOnly ? 'Earnings & SEC Filings' : 'Latest News'}
        </span>
      </div>
      <div className="divide-y divide-gf-border">
        {filtered.map((article, i) => (
          <div key={i} className="px-4 py-3 hover:bg-gf-bg transition-colors">
            <div className="flex items-start gap-2">
              <span className={`badge text-xs mt-0.5 shrink-0 ${getSentimentBg(article.sentimentLabel)}`}>
                {article.sentimentLabel}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gf-text leading-snug line-clamp-2">{article.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gf-text-secondary font-medium">{article.source}</span>
                  <span className="text-xs text-gf-text-secondary">·</span>
                  <span className="text-xs text-gf-text-secondary">{timeAgo(article.date)}</span>
                  {article.isFilingRelated && (
                    <span className="badge bg-yellow-50 text-yellow-700 text-xs">SEC/Earnings</span>
                  )}
                </div>
              </div>
              {article.url && article.url !== '#' && (
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <ExternalLink className="w-3.5 h-3.5 text-gf-text-secondary hover:text-gf-accent" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
