import { useMemo, useState } from 'react'
import { IconFilter, IconSearch, IconX } from '@tabler/icons-react'
import { Button } from '../components/atoms/Button'
import { Card } from '../components/atoms/Card'
import { StatusBadge } from '../components/atoms/StatusBadge'
import { PageHeader } from '../components/molecules/PageHeader'
import './OrdersPage.css'

function OrdersPage({ onNavigate, orders = [] }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const statusOptions = ['Todos', 'En reparación', 'En diagnóstico', 'Lista', 'Entregada']
  const filteredOrders = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    return orders.filter((order) => {
      const matchesSearch = !term || [order.id, order.client, order.vehicle, order.date, order.status, order.total].some((value) => String(value).toLocaleLowerCase().includes(term))
      return matchesSearch && (statusFilter === 'Todos' || order.status === statusFilter)
    })
  }, [query, statusFilter, orders])

  return <section className="orders-page"><PageHeader title="Órdenes" subtitle="Consulta las órdenes del taller." actions={<div className="list-actions"><label className="search order-search"><IconSearch size={18} stroke={2.2} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar orden" aria-label="Buscar órdenes" />{query && <button type="button" className="order-search-clear" aria-label="Limpiar búsqueda" onClick={() => setQuery('')}><IconX size={15} /></button>}</label><div className="orders-filter"><Button variant="secondary" className={statusFilter !== 'Todos' ? 'is-filtered' : ''} onClick={() => setIsFilterOpen((open) => !open)} aria-expanded={isFilterOpen}><IconFilter size={16} /> Filtros</Button>{isFilterOpen && <div className="orders-filter-menu" role="menu" aria-label="Filtrar órdenes"><span>Estado de la orden</span>{statusOptions.map((status) => <button type="button" className={`${statusFilter === status ? 'selected' : ''} ${status === 'Todos' ? 'all' : status === 'En reparación' ? 'repair' : status === 'En diagnóstico' ? 'diagnosis' : 'ready'}`} key={status} onClick={() => { setStatusFilter(status); setIsFilterOpen(false) }}><i />{status}</button>)}</div>}</div></div>} /><Card className="table-card orders-table-card"><div className="table-wrap"><table className="data-table orders-table"><thead><tr><th>Orden</th><th>Cliente</th><th>Motocicleta</th><th>Fecha</th><th>Estado</th><th>Total</th><th>Diagnóstico</th></tr></thead><tbody>{filteredOrders.length ? filteredOrders.map((order) => <tr key={order.id}><td>{order.id}</td><td><b>{order.client}</b></td><td>{order.vehicle}</td><td>{order.date}</td><td><StatusBadge status={order.status} /></td><td>{order.total}</td><td><Button onClick={() => onNavigate('diagnosis')}>Revisar</Button></td></tr>) : <tr className="orders-empty"><td colSpan="7"><div><IconSearch size={22} /><strong>No encontramos órdenes</strong><span>Prueba con otro código, cliente, motocicleta o estado.</span></div></td></tr>}</tbody></table></div><div className="pagination orders-pagination"><Button variant="secondary" disabled>Anterior</Button><button className="page-number active">1</button><Button variant="secondary" disabled>Siguiente</Button></div></Card></section> }
export default OrdersPage
