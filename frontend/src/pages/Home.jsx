import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert, Spin, Empty } from 'antd'
import { layTongQuan, timCauThu } from '../api/players.js'
import { dinhDangSo, dinhDangTien } from '../utils/format.js'
import PlayerCard from '../components/PlayerCard.jsx'

// Ten tham so tim kiem cua backend — sua o day neu backend dung ten khac
const THAM_SO_TIM = 'q'

function O({ nhan, giaTri }) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      borderRadius: 'var(--r-md)',
      padding: 'var(--s-xl)',
    }}>
      <div className="t-caption" style={{ marginBottom: 'var(--s-sm)' }}>{nhan}</div>
      <div style={{
        fontSize: 28, fontWeight: 600, lineHeight: 1.2,
        letterSpacing: '-1.2px', color: 'var(--ink)',
      }}>
        {giaTri}
      </div>
    </div>
  )
}

export default function Home() {
  const [searchParams] = useSearchParams()
  const tuKhoa = searchParams.get('q') || ''

  const [tongQuan, setTongQuan] = useState(null)
  const [dsCauThu, setDsCauThu] = useState(null)
  const [tong, setTong] = useState(0)
  const [loi, setLoi] = useState(null)

  useEffect(() => {
    layTongQuan().then(setTongQuan).catch(e => setLoi(e.message))
  }, [])

  useEffect(() => {
    setDsCauThu(null)
    const params = { pageSize: 12 }
    if (tuKhoa) params[THAM_SO_TIM] = tuKhoa
    timCauThu(params)
      .then(kq => { setDsCauThu(kq.items); setTong(kq.total) })
      .catch(e => setLoi(e.message))
  }, [tuKhoa])

  return (
    <div className="container" style={{ padding: 'var(--s-section) var(--s-xl)' }}>

      {!tuKhoa && (
        <section style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto var(--s-section)' }}>
          <h1 className="t-display-xl">
            Theo doi gia tri<br />cau thu bong da
          </h1>
          <p style={{ color: 'var(--mute)', marginTop: 'var(--s-lg)', fontSize: 18, lineHeight: 1.4 }}>
            Bien dong dinh gia, lich su chuyen nhuong va thong ke thi dau —
            tong hop tu du lieu mo Transfermarkt.
          </p>
        </section>
      )}

      {!tuKhoa && (
        <section style={{ marginBottom: 'var(--s-section)' }}>
          {loi && <Alert type="error" message={`Khong goi duoc API: ${loi}`} />}
          {!loi && !tongQuan && <Spin />}
          {tongQuan && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 'var(--s-sm)',
            }}>
              <O nhan="Cau thu"            giaTri={dinhDangSo(tongQuan.so_cau_thu)} />
              <O nhan="Cau lac bo"         giaTri={dinhDangSo(tongQuan.so_clb)} />
              <O nhan="Luot chuyen nhuong" giaTri={dinhDangSo(tongQuan.so_chuyen_nhuong)} />
              <O nhan="Lan dinh gia"       giaTri={dinhDangSo(tongQuan.so_lan_dinh_gia)} />
              <O nhan="Gia tri trung binh" giaTri={dinhDangTien(tongQuan.gia_tri_trung_binh)} />
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="t-heading-xl" style={{ marginBottom: 'var(--s-xl)' }}>
          {tuKhoa
            ? `Ket qua cho "${tuKhoa}"`
            : 'Cau thu gia tri cao nhat'}
        </h2>

        {tuKhoa && dsCauThu && (
          <div className="t-sm-strong" style={{ marginBottom: 'var(--s-lg)', color: 'var(--mute)' }}>
            {dinhDangSo(tong)} cau thu
          </div>
        )}

        {!dsCauThu && !loi && <Spin />}
        {dsCauThu?.length === 0 && <Empty description="Khong tim thay cau thu nao" />}
        {dsCauThu?.length > 0 && (
          <div className="luoi-cau-thu">
            {dsCauThu.map(ct => <PlayerCard key={ct.player_id} cauThu={ct} />)}
          </div>
        )}
      </section>

    </div>
  )
}