import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import PlayerDetail from './pages/PlayerDetail.jsx'
import Ranking from './pages/Ranking.jsx'
import Compare from './pages/Compare.jsx'
import Login from './pages/Login.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"            element={<Home />} />
        <Route path="/cau-thu/:id" element={<PlayerDetail />} />
        <Route path="/xep-hang"    element={<Ranking />} />
        <Route path="/so-sanh"     element={<Compare />} />
        <Route path="/dang-nhap"   element={<Login />} />
      </Route>
    </Routes>
  )
}