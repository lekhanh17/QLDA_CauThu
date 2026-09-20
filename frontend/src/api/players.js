import api from './client.js'

export const timCauThu      = (params) => api.get('/players', { params }).then(r => r.data)
export const layChiTiet     = (id)     => api.get(`/players/${id}`).then(r => r.data)
export const layBienDongGia = (id)     => api.get(`/players/${id}/valuations`).then(r => r.data)
export const layTuyChonLoc  = ()       => api.get('/players/filter-options').then(r => r.data)
export const laySoSanh      = (ids)    => api.get('/players/compare', { params: { ids: ids.join(',') } }).then(r => r.data)
export const layTongQuan    = ()       => api.get('/stats/overview').then(r => r.data)
export const layTangTruong  = (params) => api.get('/stats/top-growth', { params }).then(r => r.data)