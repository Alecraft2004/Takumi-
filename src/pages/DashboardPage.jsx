import { useEffect, useMemo, useRef, useState } from 'react'
import { IconArrowUpRight, IconCheck, IconTool } from '@tabler/icons-react'
import { Card } from '../components/atoms/Card'
import { StatusBadge } from '../components/atoms/StatusBadge'
import { PageHeader } from '../components/molecules/PageHeader'
import { recentOrders } from '../data/mockData'
import './DashboardPage.css'
import './DashboardSlowMotion.css'

const metrics = [
  { label: 'Órdenes totales', value: 128, detail: '↑ 4% este mes', color: 'blue', action: 'orders' },
  { label: 'En reparación', value: 38, detail: 'Activas ahora', color: 'orange', action: 'status' },
  { label: 'Listas para entrega', value: 16, detail: 'Esperando entrega', color: 'purple', action: 'status' },
  { label: 'Ingresos del mes', value: 68450, detail: 'vs. mes anterior', color: 'lime', action: 'income' },
]
const states = [{ label: 'En diagnóstico', color: 'purple' }, { label: 'En reparación', color: 'orange' }, { label: 'En espera', color: 'blue' }, { label: 'Entregadas', color: 'green' }]

function useCountUp(value, duration = 1650) {
  const [amount, setAmount] = useState(0)
  useEffect(() => {
    let frame
    const startedAt = performance.now()
    const tick = (time) => {
      const progress = Math.min((time - startedAt) / duration, 1)
      setAmount(Math.round(value * (1 - (1 - progress) ** 3)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])
  return amount
}

function MetricValue({ value, isCurrency }) {
  const amount = useCountUp(value)
  return <strong>{isCurrency ? `S/ ${amount.toLocaleString('es-PE')}` : amount}</strong>
}

function DashboardPage({ onNavigate, onNotify }) {
  const dashboardRef = useRef(null)
  const [activeState, setActiveState] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPointerActive, setIsPointerActive] = useState(false)
  const visibleOrders = useMemo(() => activeState ? recentOrders.filter((order) => order.status === activeState || (activeState === 'Entregadas' && order.status === 'Entregada')) : recentOrders, [activeState])
  const refresh = () => {
    setIsRefreshing(true)
    window.setTimeout(() => { setIsRefreshing(false); onNotify('Dashboard actualizado con los datos más recientes.') }, 1450)
  }
  const handleMetric = (metric) => metric.action === 'income' ? onNotify('Ingresos del mes: S/ 68,450.') : onNavigate(metric.action)
  const openOrder = (order) => { onNotify(`Abriendo ${order.id} · ${order.client}`); onNavigate(order.status === 'En diagnóstico' ? 'diagnosis' : 'status') }
  const reactToPointer = (event) => {
    const bounds = dashboardRef.current?.getBoundingClientRect()
    if (!bounds) return
    dashboardRef.current.style.setProperty('--pointer-x', ((event.clientX - bounds.left) / bounds.width - .5).toFixed(3))
    dashboardRef.current.style.setProperty('--pointer-y', ((event.clientY - bounds.top) / bounds.height - .5).toFixed(3))
    if (!isPointerActive) setIsPointerActive(true)
  }
  const resetPointer = () => {
    dashboardRef.current?.style.setProperty('--pointer-x', '0')
    dashboardRef.current?.style.setProperty('--pointer-y', '0')
    setIsPointerActive(false)
  }

  return <div ref={dashboardRef} onPointerMove={reactToPointer} onPointerLeave={resetPointer} className={`dashboard-view ${isRefreshing ? 'is-refreshing' : ''} ${isPointerActive ? 'pointer-active' : ''}`}>
    <PageHeader title="Dashboard" subtitle="Resumen general del taller" actions={<button className="dashboard-refresh" type="button" onClick={refresh} disabled={isRefreshing}>{isRefreshing ? 'Actualizando…' : 'Actualizar'}</button>} />
    <div className="metrics">{metrics.map((metric, index) => <Card className={`metric ${metric.color} dashboard-item metric-action`} key={metric.label} role="button" tabIndex="0" onClick={() => handleMetric(metric)} onKeyDown={(event) => event.key === 'Enter' && handleMetric(metric)} style={{ '--delay': `${index * 180}ms` }}><span>{metric.label}</span><MetricValue value={metric.value} isCurrency={metric.action === 'income'} /><small>{metric.detail}</small><IconArrowUpRight className="metric-arrow" size={18} /></Card>)}</div>
    <div className="dashboard-grid">
      <Card className="chart-card dashboard-item" style={{ '--delay': '320ms' }}><div className="card-title-row"><h2>Órdenes por estado</h2>{activeState && <button type="button" className="clear-filter" onClick={() => setActiveState(null)}>Ver todas</button>}</div><div className="chart-content"><div className="donut dashboard-donut" aria-label="Distribución de órdenes por estado" /><div className="legend">{states.map((state) => <button key={state.label} type="button" className={activeState === state.label ? 'active' : ''} onClick={() => setActiveState(activeState === state.label ? null : state.label)}><i className={`legend-${state.color}`} />{state.label}</button>)}</div></div><p className="chart-tip">Selecciona un estado para filtrar las órdenes recientes.</p></Card>
      <Card className="recent-card dashboard-item" style={{ '--delay': '400ms' }}><div className="card-title-row"><h2>{activeState || 'Órdenes recientes'}</h2><span className="order-count">{visibleOrders.length}</span></div>{visibleOrders.slice(0, 4).map((order, index) => <button className="compact-order interactive-order" type="button" key={order.id} style={{ '--row-delay': `${index * 60}ms` }} onClick={() => openOrder(order)}><span>{order.id} <b>{order.client}</b></span><StatusBadge status={order.status} /></button>)}{visibleOrders.length === 0 && <p className="empty-orders">No hay órdenes en este estado.</p>}<button className="text-action" onClick={() => onNavigate('orders')}>Ver todas <IconArrowUpRight size={15} /></button></Card>
      <Card className="notice-card dashboard-item notice-action" style={{ '--delay': '480ms' }} role="button" tabIndex="0" onClick={() => onNavigate('orders')} onKeyDown={(event) => event.key === 'Enter' && onNavigate('orders')}><div className="notice-icon orange"><IconTool size={17} /></div><div><h2>Recordatorios</h2><p>3 órdenes esperan repuestos<br />2 entregas programadas para hoy</p></div><IconArrowUpRight className="notice-arrow" size={17} /></Card>
      <Card className="notice-card dashboard-item notice-action" style={{ '--delay': '560ms' }} role="button" tabIndex="0" onClick={() => onNavigate('orders')} onKeyDown={(event) => event.key === 'Enter' && onNavigate('orders')}><div className="notice-icon green"><IconCheck size={17} /></div><div><h2>Documentos pendientes</h2><p>5 órdenes sin firma del cliente</p></div><IconArrowUpRight className="notice-arrow" size={17} /></Card>
    </div>
  </div>
}
export default DashboardPage
