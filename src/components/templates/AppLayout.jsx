import { useState } from 'react'
import { IconBell, IconChevronDown } from '@tabler/icons-react'
import Sidebar from '../organisms/Sidebar'

function AppLayout({ children, activePage, onNavigate, onLogout, theme, onToggleTheme }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  return <div className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}><Sidebar activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed((value) => !value)} theme={theme} onToggleTheme={onToggleTheme} /><main className="app-main"><header className="topbar"><button className="icon-button" aria-label="Notificaciones"><IconBell size={21} stroke={2} /></button><button className="top-profile"><span className="top-avatar">AP</span><IconChevronDown size={15} /></button></header><div className="page-content">{children}</div></main></div>
}
export default AppLayout
