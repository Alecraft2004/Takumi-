import { useEffect, useState } from 'react'
import { IconBell, IconChecklist, IconChevronDown, IconClipboardText, IconUserCircle, IconX } from '@tabler/icons-react'
import Sidebar from '../organisms/Sidebar'

const activityIcon = { status: IconChecklist, diagnosis: IconClipboardText, client: IconUserCircle, order: IconClipboardText }

function AppLayout({ children, activePage, onNavigate, onLogout, theme, onToggleTheme, activities = [] }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && setIsNotificationsOpen(false)
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])
  return <div className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}><Sidebar activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed((value) => !value)} theme={theme} onToggleTheme={onToggleTheme} /><main className="app-main"><header className="topbar"><button type="button" className={`icon-button notifications-trigger ${isNotificationsOpen ? 'is-active' : ''}`} aria-label="Notificaciones" aria-expanded={isNotificationsOpen} onClick={() => setIsNotificationsOpen((open) => !open)}><IconBell size={21} stroke={2} /><i aria-hidden="true" /></button><button className="top-profile"><span className="top-avatar">AP</span><IconChevronDown size={15} /></button></header><div className="page-content">{children}</div></main>{isNotificationsOpen && <><button type="button" className="notifications-scrim" aria-label="Cerrar notificaciones" onClick={() => setIsNotificationsOpen(false)} /><aside className="notifications-drawer" aria-label="Actividad reciente"><header><div><span>ACTIVIDAD DEL SISTEMA</span><h2>Notificaciones</h2></div><button type="button" className="notifications-close" aria-label="Cerrar notificaciones" onClick={() => setIsNotificationsOpen(false)}><IconX size={19} /></button></header><p className="notifications-intro">Últimos cambios realizados en Takumi.</p><div className="notifications-list">{activities.map((activity) => { const ActivityIcon = activityIcon[activity.type] || IconChecklist; return <article className="notification-item" key={activity.id}><span className={`notification-icon notification-icon--${activity.type}`}><ActivityIcon size={17} /></span><div><strong>{activity.title}</strong><p>{activity.detail}</p><time>{activity.time}</time></div></article> })}</div></aside></>}</div>
}
export default AppLayout
