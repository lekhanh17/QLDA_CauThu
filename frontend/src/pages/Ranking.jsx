import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, InputNumber, Select, Table } from 'antd'
import { timCauThu, layTuyChonLoc } from '../api/players.js'
import { dinhDangSo, dinhDangTien } from '../utils/format.js'

const NHAN_VI_TRI = {
  Attack:     'Tien dao',
  Midfield:   'Tien ve',
  Defender:   'Hau ve',
  Goalkeeper: 'Thu mon',
}

const CACH_SAP_XEP = [
  { value: 'value_desc', label: 'Dinh gia cao nhat' },
  { value: 'value_asc',  label: 'Dinh gia thap nhat' },
  { value: 'age',        label: 'Tre nhat' },
  { value: 'name',       label: 'Ten A-Z' },
]

const LOC_RONG = { position: undefined, country: undefined, ageMin: undefined, ageMax: undefined }

export default function Ranking() {
  const navigate = useNavigate()

  const [tuyChon, setTuyChon] = useState({ positions: [], countries: [] })
  const [loc, setLoc]         = useState(LOC_RONG)
  const [sapXep, setSapXep]   = useState('value_desc')
  const [trang, setTrang]     = useState(1)
  const [cuaSo, setCuaSo]     = useState(20)
  const [dl, setDl]           = useState({ items: [], total: 0 })
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi]         = useState(null)

  /* Nap danh sach tuy chon cho cac o loc, chi mot lan */
  useEffect(() => {
    layTuyChonLoc()
      .then(t => setTuyChon({
        // 'Missing' la gia tri rac cua nguon, khong cho vao dropdown
        positions: (t.positions || []).filter(p => p !== 'Missing'),
        countries: t.countries || [],
      }))
      .catch(() => {})
  }, [])

  /* Goi lai API moi khi loc / sap xep / phan trang thay doi */
  useEffect(() => {
    setDangTai(true)
    const params = { page: trang, pageSize: cuaSo, sort: sapXep }
    Object.entries(loc).forEach(([k, v]) => {
      if (v != null && v !== '') params[k] = v
    })
    timCauThu(params)
      .then(kq => { setDl({ items: kq.items, total: kq.total }); setLoi(null) })
      .catch(e => setLoi(e.message))
      .finally(() => setDangTai(false))
  }, [loc, sapXep, trang, cuaSo])

  /* Doi bo loc thi phai ve trang 1 — dang o trang 15 ma loc lai
     con 3 ket qua thi bang se trong tron */
  const doiLoc = (phan) => {
    setLoc(cu => ({ ...cu, ...phan }))
    setTrang(1)
  }

  const coLoc = Object.values(loc).some(v => v != null && v !== '')

  const cot = [
    {
      title: '#', width: 64, align: 'right',
      render: (_, __, i) => (
        <span className="t-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {(trang - 1) * cuaSo + i + 1}
        </span>
      ),
    },
    {
      title: 'Cau thu', dataIndex: 'name',
      render: (v, r) => (
        <div>
          <div className="t-body-strong">{v}</div>
          <div className="t-sm">{r.current_club_name}</div>
        </div>
      ),
    },
    {
      title: 'Vi tri', dataIndex: 'sub_position', width: 170,
      render: (v, r) => v || NHAN_VI_TRI[r.position] || r.position,
    },
    { title: 'Quoc tich', dataIndex: 'country_of_citizenship', width: 150 },
    {
      title: 'Tuoi', dataIndex: 'tuoi', width: 80, align: 'right',
      render: v => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</span>,
    },
    {
      title: 'Dinh gia', dataIndex: 'market_value_in_eur', width: 140, align: 'right',
      render: v => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {dinhDangTien(v)}
        </span>
      ),
    },
  ]

  return (
    <div className="container" style={{ padding: 'var(--s-xxl) var(--s-xl) var(--s-section)' }}>

      <h1 className="t-heading-xl" style={{ marginBottom: 'var(--s-xl)' }}>
        Xep hang cau thu
      </h1>

      {/* Hang bo loc — tat ca tren mot hang, ngay tren bang */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 'var(--s-sm)',
        alignItems: 'center', marginBottom: 'var(--s-lg)',
      }}>
        <Select
          allowClear
          placeholder="Vi tri"
          style={{ width: 160 }}
          value={loc.position}
          onChange={v => doiLoc({ position: v })}
          options={tuyChon.positions.map(p => ({ value: p, label: NHAN_VI_TRI[p] || p }))}
        />

        <Select
          allowClear
          showSearch
          placeholder="Quoc tich"
          style={{ width: 200 }}
          value={loc.country}
          onChange={v => doiLoc({ country: v })}
          filterOption={(nhap, opt) => opt.label.toLowerCase().includes(nhap.toLowerCase())}
          options={tuyChon.countries.map(c => ({ value: c, label: c }))}
        />

        <InputNumber
          placeholder="Tuoi tu"
          min={15} max={45}
          style={{ width: 110 }}
          value={loc.ageMin}
          onChange={v => doiLoc({ ageMin: v })}
        />
        <InputNumber
          placeholder="den"
          min={15} max={45}
          style={{ width: 90 }}
          value={loc.ageMax}
          onChange={v => doiLoc({ ageMax: v })}
        />

        <Select
          style={{ width: 200 }}
          value={sapXep}
          onChange={v => { setSapXep(v); setTrang(1) }}
          options={CACH_SAP_XEP}
        />

        {coLoc && (
          <Button type="text" onClick={() => { setLoc(LOC_RONG); setTrang(1) }}>
            Xoa loc
          </Button>
        )}
      </div>

      {loi && <Alert type="error" message={`Khong tai duoc danh sach: ${loi}`}
                     style={{ marginBottom: 'var(--s-lg)' }} />}

      <div style={{ background: 'var(--canvas)', borderRadius: 'var(--r-md)', padding: 'var(--s-sm)' }}>
        <Table
          rowKey="player_id"
          columns={cot}
          dataSource={dl.items}
          loading={dangTai}
          onRow={r => ({
            onClick: () => navigate(`/cau-thu/${r.player_id}`),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: trang,
            pageSize: cuaSo,
            total: dl.total,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100],
            showTotal: t => `${dinhDangSo(t)} cau thu`,
            onChange: (p, s) => { setTrang(p); setCuaSo(s) },
          }}
        />
      </div>

    </div>
  )
}