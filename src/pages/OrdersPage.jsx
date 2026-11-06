import { useMemo, useState } from 'react'
import { IconFilter, IconLayoutCards, IconList, IconSearch, IconX } from '@tabler/icons-react'
import { Button } from '../components/atoms/Button'
import { Card } from '../components/atoms/Card'
import { StatusBadge } from '../components/atoms/StatusBadge'
import { PageHeader } from '../components/molecules/PageHeader'
import motorcycleCard from '../assets/order-motorcycle-card.png'
import fallbackMotorcycle from '../assets/motorcycle.webp'
import './OrdersPage.css'

function OrderCard({ order, index, onNavigate }) {
  return <article className="order-vehicle-card">
    <div className="order-card-inner">
      <div className="order-card-face order-card-front">
        <img src={order.photo || (index % 2 ? fallbackMotorcycle : motorcycleCard)} alt={`Motocicleta ${order.vehicle}`} />
        <div className="order-card-shade" />
        <div className="order-card-status"><StatusBadge status={order.status} /></div>
        <div className="order-card-summary"><span>{order.id}</span><h3>{order.vehicle}</h3><p>{order.client}</p></div>
      </div>
      <div className="order-card-face order-card-back">
        <span className="card-back-kicker">ORDEN DE REPARACIÓN</span><h3>{order.id}</h3>
        <dl><div><dt>Cliente</dt><dd>{order.client}</dd></div><div><dt>Motocicleta</dt><dd>{order.vehicle}</dd></div><div><dt>Fecha de ingreso</dt><dd>{order.date}</dd></div><div><dt>Total estimado</dt><dd>{order.total}</dd></div></dl>
        <div className="order-card-back-actions"><span>Detalles de la orden</span><Button onClick={() => onNavigate('diagnosis')}>Ver más</Button></div>
      </div>
    </div>
  </article>
}

function OrdersPage({ onNavigate, orders = [] }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [view, setView] = useState(() => {
    try {
      const savedView = window.localStorage.getItem('takumi:orders-view')
      return savedView === 'cards' || savedView === 'table' ? savedView : 'table'
    } catch {
      return 'table'
    }
  })
  const changeView = (nextView) => {
    setView(nextView)
    try {
      window.localStorage.setItem('takumi:orders-view', nextView)
    } catch {
      // Si el navegador bloquea el almacenamiento, la vista se conserva durante esta sesión.
    }
  }
  const statusOptions = ['Todos', 'En reparación', 'En diagnóstico', 'Lista', 'Entregada']
  const filteredOrders = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    return orders.filter((order) => {
      const matchesSearch = !term || [order.id, order.client, order.vehicle, order.date, order.status, order.total].some((value) => String(value).toLocaleLowerCase().includes(term))
      return matchesSearch && (statusFilter === 'Todos' || order.status === statusFilter)
    })
  }, [query, statusFilter, orders])

  const actions = <div className="list-actions"><label className="search order-search"><IconSearch size={18} stroke={2.2} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar orden" aria-label="Buscar órdenes" />{query && <button type="button" className="order-search-clear" aria-label="Limpiar búsqueda" onClick={() => setQuery('')}><IconX size={15} /></button>}</label><div className="orders-filter"><Button variant="secondary" className={statusFilter !== 'Todos' ? 'is-filtered' : ''} onClick={() => setIsFilterOpen((open) => !open)} aria-expanded={isFilterOpen}><IconFilter size={16} /> Filtros</Button>{isFilterOpen && <div className="orders-filter-menu" role="menu" aria-label="Filtrar órdenes"><span>Estado de la orden</span>{statusOptions.map((status) => <button type="button" className={`${statusFilter === status ? 'selected' : ''} ${status === 'Todos' ? 'all' : status === 'En reparación' ? 'repair' : status === 'En diagnóstico' ? 'diagnosis' : 'ready'}`} key={status} onClick={() => { setStatusFilter(status); setIsFilterOpen(false) }}><i />{status}</button>)}</div>}</div><div className="orders-view-toggle" role="group" aria-label="Modo de visualización"><button type="button" onClick={() => changeView('table')} className={view === 'table' ? 'active' : ''} aria-label="Ver como lista"><IconList size={18} /></button><button type="button" onClick={() => changeView('cards')} className={view === 'cards' ? 'active' : ''} aria-label="Ver como tarjetas"><IconLayoutCards size={18} /></button></div></div>
  const table = <Card className="table-card orders-table-card"><div className="table-wrap"><table className="data-table orders-table"><thead><tr><th>Orden</th><th>Cliente</th><th>Motocicleta</th><th>Fecha</th><th>Estado</th><th>Total</th><th>Diagnóstico</th></tr></thead><tbody>{filteredOrders.length ? filteredOrders.map((order) => <tr key={order.id}><td>{order.id}</td><td><b>{order.client}</b></td><td>{order.vehicle}</td><td>{order.date}</td><td><StatusBadge status={order.status} /></td><td>{order.total}</td><td><Button onClick={() => onNavigate('diagnosis')}>Revisar</Button></td></tr>) : <tr className="orders-empty"><td colSpan="7"><div><IconSearch size={22} /><strong>No encontramos órdenes</strong><span>Prueba con otro código, cliente, motocicleta o estado.</span></div></td></tr>}</tbody></table></div><div className="pagination orders-pagination"><Button variant="secondary" disabled>Anterior</Button><button className="page-number active">1</button><Button variant="secondary" disabled>Siguiente</Button></div></Card>
  const cards = <div className="orders-card-grid">{filteredOrders.length ? filteredOrders.map((order, index) => <OrderCard key={order.id} order={order} index={index} onNavigate={onNavigate} />) : <Card className="orders-cards-empty"><IconSearch size={25} /><strong>No encontramos órdenes</strong><span>Modifica la búsqueda o el filtro para mostrar tarjetas.</span></Card>}</div>
  return <section className={`orders-page orders-view-${view}`}><PageHeader title="Órdenes" subtitle="Consulta las órdenes del taller." actions={actions} />{view === 'table' ? table : cards}</section>
}
export default OrdersPage
