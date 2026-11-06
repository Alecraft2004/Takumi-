import { useEffect, useMemo, useRef, useState } from 'react'
import { IconArrowUpRight, IconCheck, IconTool, IconTrendingUp } from '@tabler/icons-react'
import { Card } from '../components/atoms/Card'
import { StatusBadge } from '../components/atoms/StatusBadge'
import { PageHeader } from '../components/molecules/PageHeader'
import './DashboardPage.css'
import './DashboardSlowMotion.css'

const stateDefinition = [
  { label: 'En diagnóstico', color: 'purple', statuses: ['En diagnóstico'] },
  { label: 'En reparación', color: 'orange', statuses: ['En reparación'] },
  { label: 'Lista', color: 'blue', statuses: ['Lista'] },
  { label: 'Entregadas', color: 'green', statuses: ['Entregada'] },
]
const stateColors = { purple: '#a988eb', orange: '#ffab70', blue: '#2d5de8', green: '#b4e763' }

const performanceData = {
  week: [
    { label: 'Lun', income: 6840, orders: 12 },
    { label: 'Mar', income: 9270, orders: 16 },
    { label: 'Mié', income: 7810, orders: 14 },
    { label: 'Jue', income: 11340, orders: 21 },
    { label: 'Vie', income: 10480, orders: 19 },
    { label: 'Sáb', income: 12920, orders: 24 },
    { label: 'Dom', income: 9790, orders: 17 },
  ],
  month: [
    { label: 'Sem. 1', income: 10320, orders: 19 },
    { label: 'Sem. 2', income: 14680, orders: 27 },
    { label: 'Sem. 3', income: 12110, orders: 23 },
    { label: 'Sem. 4', income: 17340, orders: 31 },
    { label: 'Sem. 5', income: 14000, orders: 28 },
  ],
}

function linePath(data, key, width = 640, height = 190, padding = 22) {
  const values = data.map((item) => item[key])
  const max = Math.max(...values) * 1.13
  const min = Math.min(...values) * .82
  const span = max - min || 1
  const step = (width - padding * 2) / Math.max(data.length - 1, 1)
  const points = values.map((value, index) => ({ x: padding + index * step, y: height - padding - ((value - min) / span) * (height - padding * 2) }))
  return { points, path: points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ') }
}

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

function InteractiveStatusChart({ states, activeState, onActiveStateChange }) {
  const [hoveredState, setHoveredState] = useState(null)
  const total = states.reduce((sum, state) => sum + state.count, 0)
  const highlightedState = states.find((state) => state.label === hoveredState) || states.find((state) => state.label === activeState)
  let offset = 0

  const selectState = (label) => onActiveStateChange(activeState === label ? null : label)

  return <div className="interactive-donut-wrap">
    <div className="interactive-donut" role="img" aria-label="Gráfico de distribución de órdenes por estado">
      <svg viewBox="0 0 160 160" className="donut-svg">
        <circle className="donut-track" cx="80" cy="80" r="54" pathLength="100" />
        {states.map((state) => {
          const value = total ? state.count / total * 100 : 0
          const segmentOffset = offset
          offset += value
          if (!value) return null
          const isHighlighted = highlightedState?.label === state.label
          return <circle
            key={state.label}
            className={`donut-segment ${isHighlighted ? 'is-highlighted' : ''} ${activeState === state.label ? 'is-selected' : ''}`}
            cx="80" cy="80" r="54" pathLength="100"
            stroke={stateColors[state.color]}
            strokeDasharray={`${value} ${100 - value}`}
            strokeDashoffset={-segmentOffset}
            tabIndex="0"
            role="button"
            aria-label={`${state.label}: ${state.count} órdenes. Activar filtro.`}
            onMouseEnter={() => setHoveredState(state.label)}
            onMouseLeave={() => setHoveredState(null)}
            onFocus={() => setHoveredState(state.label)}
            onBlur={() => setHoveredState(null)}
            onClick={() => selectState(state.label)}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectState(state.label) } }}
          />
        })}
      </svg>
      <div className="donut-readout" aria-live="polite">
        <strong>{highlightedState ? highlightedState.count : total}</strong>
        <span>{highlightedState ? highlightedState.label : 'órdenes'}</span>
      </div>
    </div>
    <p className="donut-status-copy">{highlightedState ? `${highlightedState.count} ${highlightedState.count === 1 ? 'orden' : 'órdenes'} ${highlightedState.label.toLocaleLowerCase()}.` : 'Explora cada segmento.'}</p>
  </div>
}

function DashboardPage({ onNavigate, onNotify, orders = [] }) {
  const dashboardRef = useRef(null)
  const [activeState, setActiveState] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPointerActive, setIsPointerActive] = useState(false)
  const [trendRange, setTrendRange] = useState('week')
  const [activePoint, setActivePoint] = useState(null)
  const trendData = performanceData[trendRange]
  const trend = useMemo(() => linePath(trendData, 'income'), [trendData])
  const selectedTrend = trendData[activePoint ?? trendData.length - 1]
  const dashboardData = useMemo(() => {
    const states = stateDefinition.map((state) => ({ ...state, count: orders.filter((order) => state.statuses.includes(order.status)).length }))
    const totalIncome = orders.reduce((total, order) => total + Number(String(order.total || '').replace(/\D/g, '') || 0), 0)
    const total = orders.length
    const doughnutStops = states.reduce((stops, state, index) => {
      const start = index === 0 ? 0 : stops[index - 1].end
      const end = start + (total ? state.count / total * 100 : 0)
      stops.push({ color: stateColors[state.color], start, end })
      return stops
    }, [])
    const donutBackground = total
      ? `conic-gradient(${doughnutStops.map((stop) => `${stop.color} ${stop.start}% ${stop.end}%`).join(', ')})`
      : 'conic-gradient(#dce3ee 0 100%)'
    return {
      states,
      donutBackground,
      metrics: [
        { label: 'Órdenes totales', value: total, detail: `${total} registradas en el sistema`, color: 'blue', action: 'orders' },
        { label: 'En reparación', value: states[1].count, detail: 'Activas ahora', color: 'orange', action: 'status' },
        { label: 'Listas para entrega', value: states[2].count, detail: 'Esperando entrega', color: 'purple', action: 'status' },
        { label: 'Ingresos registrados', value: totalIncome, detail: 'Monto estimado de órdenes', color: 'lime', action: 'income' },
      ],
    }
  }, [orders])
  const visibleOrders = useMemo(() => {
    if (!activeState) return orders
    const selectedState = dashboardData.states.find((state) => state.label === activeState)
    return orders.filter((order) => selectedState?.statuses.includes(order.status))
  }, [activeState, dashboardData.states, orders])
  const refresh = () => {
    setIsRefreshing(true)
    window.setTimeout(() => { setIsRefreshing(false); onNotify('Dashboard actualizado con los datos más recientes.') }, 1450)
  }
  const handleMetric = (metric) => metric.action === 'income' ? onNotify(`Ingresos registrados: S/ ${metric.value.toLocaleString('es-PE')}.`) : onNavigate(metric.action)
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
    <div className="metrics">{dashboardData.metrics.map((metric, index) => <Card className={`metric ${metric.color} dashboard-item metric-action`} key={metric.label} role="button" tabIndex="0" onClick={() => handleMetric(metric)} onKeyDown={(event) => event.key === 'Enter' && handleMetric(metric)} style={{ '--delay': `${index * 180}ms` }}><span>{metric.label}</span><MetricValue value={metric.value} isCurrency={metric.action === 'income'} /><small>{metric.detail}</small><IconArrowUpRight className="metric-arrow" size={18} /></Card>)}</div>
    <div className="dashboard-grid">
      <Card className="chart-card dashboard-item" style={{ '--delay': '320ms' }}><div className="card-title-row"><h2>Órdenes por estado</h2>{activeState && <button type="button" className="clear-filter" onClick={() => setActiveState(null)}>Ver todas</button>}</div><div className="chart-content"><InteractiveStatusChart states={dashboardData.states} activeState={activeState} onActiveStateChange={setActiveState} /><div className="legend">{dashboardData.states.map((state) => <button key={state.label} type="button" className={activeState === state.label ? 'active' : ''} onClick={() => setActiveState(activeState === state.label ? null : state.label)}><i className={`legend-${state.color}`} />{state.label} <b>{state.count}</b></button>)}</div></div><p className="chart-tip">Pasa el cursor o selecciona un segmento para ver y filtrar sus órdenes.</p></Card>
      <Card className="recent-card dashboard-item" style={{ '--delay': '400ms' }}><div className="card-title-row"><h2>{activeState || 'Órdenes recientes'}</h2><span className="order-count">{visibleOrders.length}</span></div>{visibleOrders.slice(0, 4).map((order, index) => <button className="compact-order interactive-order" type="button" key={order.id} style={{ '--row-delay': `${index * 60}ms` }} onClick={() => openOrder(order)}><span>{order.id} <b>{order.client}</b></span><StatusBadge status={order.status} /></button>)}{visibleOrders.length === 0 && <p className="empty-orders">No hay órdenes en este estado.</p>}<button className="text-action" onClick={() => onNavigate('orders')}>Ver todas <IconArrowUpRight size={15} /></button></Card>
      <Card className="performance-card dashboard-item" style={{ '--delay': '470ms' }}>
        <div className="performance-header">
          <div>
            <div className="performance-kicker"><IconTrendingUp size={16} /> Rendimiento del taller</div>
            <h2>Ingresos y carga operativa</h2>
          </div>
          <div className="chart-period" role="group" aria-label="Periodo del gráfico">
            <button type="button" className={trendRange === 'week' ? 'active' : ''} onClick={() => { setTrendRange('week'); setActivePoint(null) }}>7 días</button>
            <button type="button" className={trendRange === 'month' ? 'active' : ''} onClick={() => { setTrendRange('month'); setActivePoint(null) }}>Este mes</button>
          </div>
        </div>
        <div className="performance-layout">
          <div className="performance-summary" aria-live="polite">
            <span>Periodo seleccionado</span>
            <strong>S/ {selectedTrend.income.toLocaleString('es-PE')}</strong>
            <p>{selectedTrend.label} <b>{selectedTrend.orders} órdenes registradas</b></p>
          </div>
          <div className="performance-chart" aria-label="Gráfico interactivo de ingresos">
            <svg viewBox="0 0 640 190" preserveAspectRatio="none" role="img" aria-label="Tendencia de ingresos del periodo">
              <defs>
                <linearGradient id="income-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity=".30" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[42, 88, 134].map((y) => <line key={y} x1="22" x2="618" y1={y} y2={y} className="chart-gridline" />)}
              <path className="income-area" d={`${trend.path} L ${trend.points.at(-1).x} 168 L ${trend.points[0].x} 168 Z`} />
              <path className="income-path" d={trend.path} />
            </svg>
            <div className="chart-points">
              {trend.points.map((point, index) => <button key={trendData[index].label} type="button" aria-label={`${trendData[index].label}: S/ ${trendData[index].income.toLocaleString('es-PE')}`} className={activePoint === index ? 'active' : ''} style={{ left: `${(point.x / 640) * 100}%`, top: `${(point.y / 190) * 100}%` }} onMouseEnter={() => setActivePoint(index)} onFocus={() => setActivePoint(index)} onClick={() => setActivePoint(index)} />)}
            </div>
            <div className="chart-labels">{trendData.map((item) => <span key={item.label}>{item.label}</span>)}</div>
          </div>
        </div>
        <p className="performance-tip">Explora cada punto para consultar los ingresos y órdenes registrados.</p>
      </Card>
      <Card className="notice-card dashboard-item notice-action" style={{ '--delay': '480ms' }} role="button" tabIndex="0" onClick={() => onNavigate('orders')} onKeyDown={(event) => event.key === 'Enter' && onNavigate('orders')}><div className="notice-icon orange"><IconTool size={17} /></div><div><h2>Recordatorios</h2><p>3 órdenes esperan repuestos<br />2 entregas programadas para hoy</p></div><IconArrowUpRight className="notice-arrow" size={17} /></Card>
      <Card className="notice-card dashboard-item notice-action" style={{ '--delay': '560ms' }} role="button" tabIndex="0" onClick={() => onNavigate('orders')} onKeyDown={(event) => event.key === 'Enter' && onNavigate('orders')}><div className="notice-icon green"><IconCheck size={17} /></div><div><h2>Documentos pendientes</h2><p>5 órdenes sin firma del cliente</p></div><IconArrowUpRight className="notice-arrow" size={17} /></Card>
    </div>
  </div>
}
export default DashboardPage
