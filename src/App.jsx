import { useEffect, useState } from 'react'
import LoginPage from './pages/LoginPage'
import AppLayout from './components/templates/AppLayout'
import DashboardPage from './pages/DashboardPage'
import NewOrderPage from './pages/NewOrderPage'
import DiagnosisPage from './pages/DiagnosisPage'
import RepairStatusPage from './pages/RepairStatusPage'
import OrdersPage from './pages/OrdersPage'
import ClientsPage from './pages/ClientsPage'
import SettingsPage from './pages/SettingsPage'
import { recentOrders } from './data/mockData'
import './index.css'
import './layout.css'
import './design/tokens.css'

const pages = { dashboard: DashboardPage, newOrder: NewOrderPage, diagnosis: DiagnosisPage, status: RepairStatusPage, orders: OrdersPage, clients: ClientsPage, settings: SettingsPage }
const paths = { dashboard: '/dashboard', newOrder: '/nueva-orden', diagnosis: '/diagnostico', status: '/estado-reparacion', orders: '/ordenes', clients: '/clientes', settings: '/configuracion' }
const pageFromPath = () => Object.entries(paths).find(([, path]) => path === window.location.pathname)?.[0] || 'dashboard'
const ORDERS_STORAGE_KEY = 'takumi-demo-orders'
const loadOrders = () => { try { const saved = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY)); return Array.isArray(saved) ? saved : recentOrders } catch { return recentOrders } }

function App() {
  const [user, setUser] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [page, setPage] = useState(pageFromPath)
  const [notice, setNotice] = useState('')
  const [isEntering, setIsEntering] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('takumi_theme') || 'light')
  const [orders, setOrders] = useState(loadOrders)
  const isAuthenticated = Boolean(user)

  useEffect(() => {
    document.body.classList.toggle('theme-dark', theme === 'dark')
    localStorage.setItem('takumi_theme', theme)
  }, [theme])

  useEffect(() => { localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders)) }, [orders])

  useEffect(() => {
    let active = true
    const verifySession = async () => {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'same-origin' })
        if (!response.ok) throw new Error('No session')
        const data = await response.json()
        if (active) setUser(data.user)
      } catch {
        window.history.replaceState(null, '', '/')
        if (active) setUser(null)
      } finally {
        if (active) setIsCheckingSession(false)
      }
    }
    verifySession()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const handleNavigation = () => {
      if (isAuthenticated) setPage(pageFromPath())
      else window.history.replaceState(null, '', '/')
    }
    window.addEventListener('popstate', handleNavigation)
    return () => window.removeEventListener('popstate', handleNavigation)
  }, [isAuthenticated])

  const navigate = (nextPage, replace = false) => {
    const destination = paths[nextPage] || paths.dashboard
    window.history[replace ? 'replaceState' : 'pushState'](null, '', destination)
    setPage(nextPage)
    setNotice('')
  }
  const showNotice = (message) => { setNotice(message); window.setTimeout(() => setNotice(''), 3000) }
  const login = (authenticatedUser) => {
    setIsEntering('covering')
    window.setTimeout(() => {
      setUser(authenticatedUser)
      navigate('dashboard', true)
      setIsEntering('revealing')
      window.setTimeout(() => setIsEntering(false), 520)
    }, 620)
  }
  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }) } finally {
      setUser(null)
      window.history.replaceState(null, '', '/')
      setPage('dashboard')
    }
  }

  if (isCheckingSession) return null
  const accessTransition = isEntering && <div className={`access-transition ${isEntering === 'revealing' ? 'is-leaving' : ''}`} role="status" aria-label="Ingresando al sistema"><div className="garage-shutter garage-shutter--left" /><div className="garage-shutter garage-shutter--right" /><div className="access-transition__content"><div className="ignition-gauge"><span>GO</span></div><b>TAKUMI</b><span>Encendiendo el control de tu taller</span><i /></div></div>
  if (!isAuthenticated) return <><LoginPage onLogin={login} />{accessTransition}</>
  const Page = pages[page]
  const updateOrderStatus = (orderId, status) => setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status } : order))
  const updateOrder = (orderId, updates) => setOrders((current) => current.map((order) => order.id === orderId ? { ...order, ...updates } : order))
  return <><div className={isEntering ? 'dashboard-enter' : ''}><AppLayout activePage={page} onNavigate={navigate} onLogout={logout} theme={theme} onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}>{notice && <div className="toast" role="status">{notice}</div>}<Page onNavigate={navigate} onNotify={showNotice} orders={orders} onUpdateOrderStatus={updateOrderStatus} onUpdateOrder={updateOrder} /></AppLayout></div>{accessTransition}</>
}
export default App
