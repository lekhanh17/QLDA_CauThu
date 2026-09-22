import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Select, Spin } from 'antd'
import { timCauThu, laySoSanh } from '../api/players.js'
import { dinhDangSo, dinhDangTien } from '../utils/format.js'

/* Dinh nghia cac dong cua bang.
   caoLaHon = chi so ma gia tri lon hon thi noi bat duoc.
   Tuoi, chieu cao, chan thuan khong co "hon" - khong danh dau. */
const HANG = [
  { khoa: 'current_club_name',      nhan: 'Cau lac bo' },
  { khoa: 'sub_position',           nhan: 'Vi tri' },
  { khoa: 'country_of_citizenship', nhan: 'Quoc tich' },
  { khoa: 'tuoi',                   nhan: 'Tuoi',                so: true },
  { khoa: 'height_in_cm',           nhan: 'Chieu cao',           so: true, donVi: ' cm' },
  { khoa: 'foot',                   nhan: 'Chan thuan' },
  { khoa: 'gia_hien_tai',           nhan: 'Dinh gia hien tai',   tien: true, caoLaHon: true },
  { khoa: 'gia_cao_nhat',           nhan: 'Dinh gia cao nhat',   tien: true, caoLaHon: true },
  { khoa: 'so_tran',                nhan: 'So tran',             so: true, caoLaHon: true },
  { khoa: 'ban_thang',              nhan: 'Ban thang',           so: true, caoLaHon: true },
  { khoa: 'kien_tao',               nhan: 'Kien tao',            so: true, caoLaHon: true },
  { khoa: 'so_phut',                nhan: 'Phut thi dau',        so: true, caoLaHon: true },
  { khoa: 'ban_thang_moi_90p',      nhan: 'Ban thang / 90 phut', thapPhan: true, caoLaHon: true },
  { khoa: 'so_lan_chuyen_nhuong',   nhan: 'So lan chuyen nhuong', so: true },
]

function hienThi(h, v) {
  if (v == null || v === '') return '—'
  if (h.tien)     return dinhDangTien(v)
  if (h.thapPhan) return String(v).replace('.', ',')
  if (h.so)       return dinhDangSo(v) + (h.donVi || '')
  return v
}

export default function Compare() {
  const [tuyChon, setTuyChon] = useState([])
  const [ids, setIds]         = useState([])
  const [kq, setKq]           = useState(null)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi]         = useState(null)
  const hen = useRef(null)

  /* Goi y ban dau: cac cau thu dat gia nhat */
  useEffect(() => {
    timCauThu({ pageSize: 10 })
      .then(r => setTuyChon(r.items))
      .catch(() => {})
  }, [])

  /* Tim kiem co hoan (debounce) - khong goi API moi ky tu go */
  const timKiem = (chu) => {
    clearTimeout(hen.current)
    if (!chu) return
    hen.current = setTimeout(() => {
      timCauThu({ q: chu, pageSize: 15 })
        .then(r => setTuyChon(r.items))
        .catch(() => {})
    }, 350)
  }

  useEffect(() => {
    if (ids.length < 2) { setKq(null); setLoi(null); return }
    setDangTai(true)
    laySoSanh(ids)
      .then(d => { setKq(d); setLoi(null) })
      .catch(e => setLoi(e.response?.data?.error || e.message))
      .finally(() => setDangTai(false))
  }, [ids])

  const ds = kq?.cau_thu || []

  /* Cac vi tri khac nhau -> canh bao, vi so sanh tien dao voi hau ve
     bang chi so ban thang la khong cong bang */
  const lechViTri = useMemo(
    () => new Set(ds.map(c => c.position)).size > 1,
    [ds]
  )

  return (
    <div className="container" style={{ padding: 'var(--s-xxl) var(--s-xl) var(--s-section)' }}>

      <h1 className="t-heading-xl" style={{ marginBottom: 'var(--s-sm)' }}>
        So sanh cau thu
      </h1>
      <p className="t-sm" style={{ marginBottom: 'var(--s-xl)' }}>
        Chon tu 2 den 6 cau thu.
      </p>

      <Select
        mode="multiple"
        showSearch
        filterOption={false}
        onSearch={timKiem}
        placeholder="Go ten cau thu de tim..."
        style={{ width: '100%', maxWidth: 720, marginBottom: 'var(--s-xl)' }}
        value={ids}
        onChange={v => setIds(v.slice(0, 6))}
        options={tuyChon.map(c => ({
          value: c.player_id,
          label: `${c.name} — ${c.current_club_name}`,
        }))}
        notFoundContent={null}
      />

      {loi && <Alert type="error" message={loi} style={{ marginBottom: 'var(--s-lg)' }} />}
      {dangTai && <Spin />}

      {ids.length < 2 && !dangTai && (
        <p className="t-sm">Chon them cau thu de bat dau so sanh.</p>
      )}

      {ds.length >= 2 && (
        <>
          {lechViTri && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 'var(--s-lg)' }}
              message="Cac cau thu khac vi tri thi dau"
              description="Chi so ban thang va kien tao khong phan anh dung nang luc khi so sanh giua cac vi tri khac nhau."
            />
          )}

          <div style={{ background: 'var(--canvas)', borderRadius: 'var(--r-md)', overflowX: 'auto' }}>
            <table className="bang-ss">
              <thead>
                <tr>
                  <th style={{ width: 220 }}></th>
                  {ds.map(c => (
                    <th key={c.player_id}>{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HANG.map(h => {
                  const giaTri = ds.map(c => c[h.khoa])
                  const soHop = giaTri.filter(v => typeof v === 'number')
                  const dinh = h.caoLaHon && soHop.length ? Math.max(...soHop) : null

                  return (
                    <tr key={h.khoa}>
                      <td className="nhan">{h.nhan}</td>
                      {ds.map((c, i) => {
                        const v = giaTri[i]
                        const dan = dinh != null && v === dinh && soHop.length > 1
                        return (
                          <td
                            key={c.player_id}
                            className={[h.so || h.tien || h.thapPhan ? 'so' : '', dan ? 'dan' : '']
                              .filter(Boolean).join(' ')}
                          >
                            {hienThi(h, v)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="t-caption" style={{ marginTop: 'var(--s-md)' }}>
            O to dam tren nen xanh la gia tri cao nhat cua dong do.
          </p>
        </>
      )}

    </div>
  )
}