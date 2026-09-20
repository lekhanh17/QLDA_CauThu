// Dinh dang tien te: 7141546 -> "€7,1 tr"
export function dinhDangTien(v) {
  if (v == null || isNaN(v)) return '—'
  const n = Number(v)
  const gon = (x) => x.toFixed(1).replace(/[.,]0$/, '').replace('.', ',')
  if (n >= 1e9) return `€${gon(n / 1e9)} ty`
  if (n >= 1e6) return `€${gon(n / 1e6)} tr`
  if (n >= 1e3) return `€${Math.round(n / 1e3)} ngh`
  return `€${n}`
}

// Dinh dang so nguyen: 32544 -> "32.544"
export function dinhDangSo(v) {
  if (v == null || isNaN(v)) return '—'
  return new Intl.NumberFormat('vi-VN').format(v)
}

// Dinh dang ngay: "2020-05-18T00:00:00.000Z" -> "18/05/2020"
export function dinhDangNgay(v) {
  if (!v) return '—'
  const d = new Date(v)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}