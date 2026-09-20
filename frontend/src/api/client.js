import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Tự động gắn token vào mỗi request nếu đã đăng nhập
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Token hết hạn hoặc không hợp lệ => xóa token và user khỏi localStorage
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(err)
  }
)

export default api