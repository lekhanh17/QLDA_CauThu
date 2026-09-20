import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert, Spin, Table } from 'antd'
import { layChiTiet, layBienDongGia } from '../api/players.js'
import { dinhDangTien, dinhDangSo, dinhDangNgay } from '../utils/format.js'
import ValueChart from '../components/ValueChart.jsx'

function chuCaiDau(ten) {
  const p = (ten || '').trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase()
}

function Dong({ nhan, giaTri }) {
  if (giaTri == null || giaTri === '') return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', gap: 'var(--s-lg)',
      padding: 'var(--s-md) 0', borderBottom: '1px solid var(--hairline-soft)',
    }}>
      <span className="t-sm">{nhan}</span>
      <span className="t-body-strong" style={{ textAlign: 'right' }}>{giaTri}</span>
    </div>
  )
}

function OThongSo({ nhan, giaTri }) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      borderRadius: 'var(--r-md)',
      padding: 'var(--s-lg)',
    }}>
      <div className="t-caption" style={{ marginBottom: 4 }}>{nhan}</div>
      <div style={{
        fontSize: 24, fontWeight: 600, lineHeight: 1.2,
        letterSpacing: '-0.6px', color: 'var(--ink)',
      }}>
        {giaTri}
      </div>
    </div>
  )
}

const COT_CHUYEN_NHUONG = [
  {
    title: 'Mua giai',
    dataIndex: 'transfer_season',
    width: 100,
  },
  {
    title: 'Ngay',
    dataIndex: 'transfer_date',
    width: 130,
    render: v => dinhDangNgay(v),
  },
  {
    title: 'Tu CLB',
    dataIndex: 'from_club_name',
    render: v => <span style={{ color: 'var(--mute)' }}>{v}</span>,
  },
  {
    title: 'Den CLB',
    dataIndex: 'to_club_name',
    render: v => <span className="t-body-strong">{v}</span>,
  },
  {
    title: 'Phi chuyen nhuong',
    dataIndex: 'transfer_fee',
    align: 'right',
    width: 170,
    render: v => v == null
      ? <span className="t-sm">Khong co du lieu</span>
      : <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {dinhDangTien(v)}
        </span>,
  },
]

export default function PlayerDetail() {
  const { id } = useParams()
  const [ct, setCt] = useState(null)
  const [bd, setBd] = useState(null)
  const [loi, setLoi] = useState(null)

  useEffect(() => {
    setCt(null); setBd(null); setLoi(null)
    Promise.all([layChiTiet(id), layBienDongGia(id)])
      .then(([a, b]) => { setCt(a); setBd(b) })
      .catch(e => setLoi(e.message))
  }, [id])

  if (loi) return <div className="container" style={{ padding: 'var(--s-section) var(--s-xl)' }}>
    <Alert type="error" message={`Khong tai duoc du lieu: ${loi}`} />
  </div>

  if (!ct || !bd) return <div className="container" style={{ padding: 'var(--s-section) var(--s-xl)' }}>
    <Spin />
  </div>

  const tt = bd.tom_tat || {}
  const ts = ct.thong_so || {}
  const nhanLen = tt.gia_dau_tien > 0 ? tt.gia_hien_tai / tt.gia_dau_tien : null
  const dsChuyenNhuong = [...(ct.chuyen_nhuong || [])].sort(
    (a, b) => new Date(b.transfer_date) - new Date(a.transfer_date)
  )

  return (
    <div className="container" style={{ padding: 'var(--s-xxl) var(--s-xl) var(--s-section)' }}>

      {/* Dau trang */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-xl)', marginBottom: 'var(--s-xxl)' }}>
        <div style={{
          width: 96, height: 96, flexShrink: 0,
          borderRadius: 'var(--r-full)', background: 'var(--surface-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, fontWeight: 700, color: 'var(--ink)',
        }}>
          {chuCaiDau(ct.name)}
        </div>
        <div>
          <h1 className="t-display-lg">{ct.name}</h1>
          <div style={{ display: 'flex', gap: 'var(--s-sm)', marginTop: 'var(--s-md)', flexWrap: 'wrap' }}>
            <span className="chip" style={{ height: 32, fontSize: 13 }}>{ct.sub_position || ct.position}</span>
            <span className="chip" style={{ height: 32, fontSize: 13 }}>{ct.current_club_name}</span>
            <span className="chip" style={{ height: 32, fontSize: 13 }}>{ct.country_of_citizenship}</span>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(280px,1fr)', gap: 'var(--s-xl)', alignItems: 'start' }}>

        {/* Bieu do */}
        <section style={{ background: 'var(--canvas)', borderRadius: 'var(--r-md)', padding: 'var(--s-xl)' }}>
          <h2 className="t-heading-lg">Bien dong gia tri</h2>
          <p className="t-sm" style={{ margin: '4px 0 var(--s-xl)' }}>
            {dinhDangSo(tt.so_lan_dinh_gia)} lan dinh gia, tu {dinhDangNgay(tt.ngay_dau)} den {dinhDangNgay(tt.ngay_cuoi)}
          </p>

          {/* Con so chu dao cua trang */}
          <div style={{ marginBottom: 'var(--s-xl)' }}>
            <div style={{ fontSize: 48, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-1.2px', color: 'var(--ink)' }}>
              {dinhDangTien(tt.gia_hien_tai)}
            </div>
            <div className="delta-up" style={{ fontSize: 14, marginTop: 4 }}>
              ▲ {dinhDangTien(tt.muc_tang)}
              {nhanLen && ` — gap ${dinhDangSo(Math.round(nhanLen))} lan so voi lan dinh gia dau tien`}
            </div>
          </div>

          <ValueChart diem={bd.diem_du_lieu} />
        </section>

        {/* Cot phai */}
        <aside style={{ display: 'grid', gap: 'var(--s-xl)' }}>

          {/* Thong so thi dau */}
          <section style={{ background: 'var(--canvas)', borderRadius: 'var(--r-md)', padding: 'var(--s-xl)' }}>
            <h2 className="t-heading-lg" style={{ marginBottom: 'var(--s-lg)' }}>Thong so thi dau</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-sm)' }}>
              <OThongSo nhan="Tran dau"     giaTri={dinhDangSo(ts.so_tran)} />
              <OThongSo nhan="Ban thang"    giaTri={dinhDangSo(ts.ban_thang)} />
              <OThongSo nhan="Kien tao"     giaTri={dinhDangSo(ts.kien_tao)} />
              <OThongSo nhan="Phut thi dau" giaTri={dinhDangSo(ts.so_phut)} />
            </div>
          </section>

          {/* Thong tin */}
          <section style={{ background: 'var(--canvas)', borderRadius: 'var(--r-md)', padding: 'var(--s-xl)' }}>
            <h2 className="t-heading-lg" style={{ marginBottom: 'var(--s-md)' }}>Thong tin</h2>
            <Dong nhan="Tuoi"            giaTri={ct.tuoi} />
            <Dong nhan="Ngay sinh"       giaTri={dinhDangNgay(ct.date_of_birth)} />
            <Dong nhan="Quoc tich"       giaTri={ct.country_of_citizenship} />
            <Dong nhan="Noi sinh"        giaTri={ct.country_of_birth} />
            <Dong nhan="Chieu cao"       giaTri={ct.height_in_cm ? `${ct.height_in_cm} cm` : null} />
            <Dong nhan="Chan thuan"      giaTri={ct.foot} />
            <Dong nhan="Giai dau"        giaTri={ct.ten_giai_dau} />
            <Dong nhan="Han hop dong"    giaTri={dinhDangNgay(ct.contract_expiration_date)} />
            <Dong nhan="Nguoi dai dien"  giaTri={ct.agent_name} />
            <Dong nhan="Gia cao nhat"    giaTri={dinhDangTien(tt.gia_cao_nhat)} />
            <Dong nhan="Gia thap nhat"   giaTri={dinhDangTien(tt.gia_thap_nhat)} />
          </section>

        </aside>

      </div>

      {/* Lich su chuyen nhuong */}
      <section style={{
        background: 'var(--canvas)', borderRadius: 'var(--r-md)',
        padding: 'var(--s-xl)', marginTop: 'var(--s-xl)',
      }}>
        <h2 className="t-heading-lg" style={{ marginBottom: 'var(--s-lg)' }}>
          Lich su chuyen nhuong
        </h2>

        {dsChuyenNhuong.length === 0 ? (
          <p className="t-sm">Chua co du lieu chuyen nhuong.</p>
        ) : (
          <Table
            rowKey={r => `${r.transfer_date}-${r.to_club_name}`}
            columns={COT_CHUYEN_NHUONG}
            dataSource={dsChuyenNhuong}
            pagination={false}
            size="middle"
          />
        )}
      </section>

    </div>
  )
}