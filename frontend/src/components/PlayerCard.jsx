import { Link } from 'react-router-dom'
import { dinhDangTien } from '../utils/format.js'

function chuCaiDau(ten) {
  const phan = (ten || '').trim().split(/\s+/)
  const dau = phan[0]?.[0] ?? ''
  const cuoi = phan.length > 1 ? phan[phan.length - 1][0] : ''
  return (dau + cuoi).toUpperCase()
}

export default function PlayerCard({ cauThu }) {
  return (
    <Link to={`/cau-thu/${cauThu.player_id}`} className="the-cau-thu">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-md)' }}>
        <div style={{
          width: 56, height: 56, flexShrink: 0,
          borderRadius: 'var(--r-full)',
          background: 'var(--surface-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color: 'var(--ink)',
        }}>
          {chuCaiDau(cauThu.name)}
        </div>

        <div style={{ minWidth: 0 }}>
          <div className="t-heading-md" style={{
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {cauThu.name}
          </div>
          <div className="t-sm" style={{
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {cauThu.current_club_name}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--s-sm)',
        margin: 'var(--s-lg) 0 var(--s-md)', flexWrap: 'wrap',
      }}>
        <span className="chip" style={{ height: 28, padding: '0 10px', fontSize: 12 }}>
          {cauThu.sub_position || cauThu.position}
        </span>
        <span className="t-caption">{cauThu.country_of_citizenship}</span>
        <span className="t-caption">· {cauThu.tuoi} tuoi</span>
      </div>

      <div style={{
        borderTop: '1px solid var(--hairline-soft)',
        paddingTop: 'var(--s-md)',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      }}>
        <span className="t-caption">Dinh gia hien tai</span>
        <span style={{
          fontSize: 22, fontWeight: 600, letterSpacing: '-0.4px', color: 'var(--ink)',
        }}>
          {dinhDangTien(cauThu.market_value_in_eur)}
        </span>
      </div>
    </Link>
  )
}