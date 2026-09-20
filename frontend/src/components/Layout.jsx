import { Layout as AntLayout, Input, Button } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const { Header, Content, Footer } = AntLayout

const LIEN_KET = [
  { to: '/',          nhan: 'Kham pha' },
  { to: '/xep-hang',  nhan: 'Xep hang' },
  { to: '/so-sanh',   nhan: 'So sanh' },
]

export default function Layout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [tuKhoa, setTuKhoa] = useState('')

  const timKiem = () => {
    if (tuKhoa.trim()) navigate(`/?q=${encodeURIComponent(tuKhoa.trim())}`)
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex', alignItems: 'center', gap: 'var(--s-lg)', lineHeight: 'normal',
        padding: '0 var(--s-xl)', borderBottom: '1px solid var(--hairline)',
      }}>
        <Link to="/" style={{
          color: 'var(--primary)', fontWeight: 700, fontSize: 18,
          whiteSpace: 'nowrap', letterSpacing: '-0.4px',
        }}>
          GiaTriCauThu
        </Link>

        <nav style={{ display: 'flex', gap: 'var(--s-xs)' }}>
          {LIEN_KET.map(l => (
             <Link key={l.to} to={l.to} style={{
              display: 'inline-flex', alignItems: 'center', height: 40,
              padding: '0 14px',
              borderRadius: 'var(--r-md)',
              fontSize: 14, fontWeight: 700,
              color: pathname === l.to ? 'var(--on-dark)' : 'var(--ink)',
              background: pathname === l.to ? 'var(--ink)' : 'transparent',
            }}>
              {l.nhan}
            </Link>
          ))}
        </nav>

        <Input
          value={tuKhoa}
          onChange={e => setTuKhoa(e.target.value)}
          onPressEnter={timKiem}
          prefix={<SearchOutlined style={{ color: 'var(--mute)' }} />}
          placeholder="Tim cau thu, cau lac bo..."
          style={{
            flex: 1, maxWidth: 480, height: 48,
            borderRadius: 'var(--r-full)',
            background: 'var(--surface-card)',
            border: 'none',
          }}
        />

        <Button type="primary" onClick={() => navigate('/dang-nhap')}>
          Dang nhap
        </Button>
      </Header>

      <Content>
        <Outlet />
      </Content>

      <Footer style={{
        borderTop: '1px solid var(--hairline)',
        padding: 'var(--s-xxl) var(--s-xl)',
      }}>
        <div className="container t-sm">
          <div style={{ marginBottom: 'var(--s-sm)' }}>
            Do an mon Quan ly du an CNTT
          </div>
          <div className="t-caption">
            Nguon du lieu: dcaribou/transfermarkt-datasets (giay phep CC0)
          </div>
        </div>
      </Footer>
    </AntLayout>
  )
}