import { useEffect, useMemo, useState } from 'react'
import { IconBike, IconFilter, IconMail, IconPhone, IconSearch, IconX } from '@tabler/icons-react'
import { Button } from '../components/atoms/Button'
import { Card } from '../components/atoms/Card'
import { PageHeader } from '../components/molecules/PageHeader'
import { clients } from '../data/mockData'
import './ClientsPage.css'

const emptyClient = { document: '', name: '', email: '', phone: '', channel: '', plate: '', vehicleModel: '' }
const CLIENTS_PER_PAGE = 4
const CLIENTS_STORAGE_KEY = 'takumi-demo-clients'

function loadStoredClients() {
  try {
    const storedClients = JSON.parse(localStorage.getItem(CLIENTS_STORAGE_KEY))
    if (Array.isArray(storedClients)) return storedClients
  } catch {
    // Si el almacenamiento está corrupto, se restaura la lista de demostración.
  }
  return clients.map((client) => ({ ...client, disabled: false }))
}

function splitVehicle(vehicle) {
  const [plate, model] = vehicle.split(' · ')
  return model ? { plate, model } : { plate: 'Sin placa registrada', model: vehicle }
}

function getVehicles(client) {
  return client.vehicles?.length ? client.vehicles : [splitVehicle(client.vehicle)]
}

function ClientFormModal({ client, onClose, onSave }) {
  const firstVehicle = client ? getVehicles(client)[0] : null
  const [form, setForm] = useState(client ? { document: client.document, name: client.name, email: client.email, phone: client.phone, channel: client.channel, plate: firstVehicle.plate === 'Sin placa registrada' ? '' : firstVehicle.plate, vehicleModel: firstVehicle.model } : emptyClient)
  const [hasError, setHasError] = useState(false)
  const update = (field) => (event) => { setForm((current) => ({ ...current, [field]: event.target.value })); setHasError(false) }
  const submit = (event) => {
    event.preventDefault()
    if (!form.document.trim() || !form.name.trim()) { setHasError(true); return }
    const currentVehicles = client ? getVehicles(client) : []
    const primaryVehicle = { plate: form.plate.trim() || 'Sin placa registrada', model: form.vehicleModel.trim() || 'Vehículo no especificado' }
    const vehicles = currentVehicles.length ? [primaryVehicle, ...currentVehicles.slice(1)] : [primaryVehicle]
    onSave({ ...client, document: form.document.trim(), name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), channel: form.channel.trim() || 'No especificado', vehicle: `${primaryVehicle.plate} · ${primaryVehicle.model}`, vehicles, orders: client?.orders || '0 órdenes', disabled: client?.disabled || false })
  }
  return <div className="client-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <form className="client-form-dialog" onSubmit={submit} aria-label={client ? 'Editar cliente' : 'Agregar cliente'}>
      <div className="client-form-heading"><span className="detail-kicker">{client ? 'ACTUALIZAR CLIENTE' : 'NUEVO CLIENTE'}</span><h2>{client ? 'Editar información' : 'Agregar cliente'}</h2><p>Completa los datos principales para registrar la ficha.</p></div>
      <div className="client-form-grid">
        <label><span>Documento *</span><input value={form.document} onChange={update('document')} placeholder="Ej.: 72819405" /></label>
        <label><span>Nombre completo *</span><input value={form.name} onChange={update('name')} placeholder="Ej.: María López" /></label>
        <label><span>Correo electrónico</span><input type="email" value={form.email} onChange={update('email')} placeholder="correo@ejemplo.com" /></label>
        <label><span>Número telefónico</span><input value={form.phone} onChange={update('phone')} placeholder="+51 900 000 000" /></label>
        <label><span>Medio de contacto</span><input value={form.channel} onChange={update('channel')} placeholder="WhatsApp" /></label>
        <label><span>Placa</span><input value={form.plate} onChange={update('plate')} placeholder="ABC-123" /></label>
        <label className="form-field-wide"><span>Vehículo</span><input value={form.vehicleModel} onChange={update('vehicleModel')} placeholder="Marca y modelo" /></label>
      </div>
      {hasError && <p className="client-form-error">Documento y nombre son obligatorios.</p>}
      <div className="client-form-actions"><button type="button" className="form-cancel" onClick={onClose}>Cancelar</button><button type="submit" className="form-save">{client ? 'Guardar cambios' : 'Crear cliente'}</button></div>
    </form>
  </div>
}

function ClientDetails({ client, onClose, onEdit, onToggleDisabled }) {
  const vehicles = getVehicles(client)
  const [isVehicleListExpanded, setIsVehicleListExpanded] = useState(false)
  const visibleVehicles = isVehicleListExpanded ? vehicles : vehicles.slice(0, 2)
  return <div className="client-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="client-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="client-detail-title">
      <button className="detail-close" type="button" aria-label="Cerrar ficha del cliente" onClick={onClose}><IconX size={19} /></button>
      <span className="detail-kicker">FICHA DEL CLIENTE</span>
      <h2 id="client-detail-title">{client.name}</h2>
      <p className="detail-document">Documento: {client.document} {client.disabled && <b className="disabled-chip">Deshabilitado</b>}</p>
      <div className="detail-grid">
        <div><IconMail size={17} /><span>Correo electrónico</span><strong>{client.email || 'No registrado'}</strong></div>
        <div><IconPhone size={17} /><span>Número telefónico</span><strong>{client.phone || 'No registrado'}</strong></div>
        <div><IconPhone size={17} /><span>Medio de contacto</span><strong>{client.channel || 'No especificado'}</strong></div>
        <div className="vehicle-table-card"><div className="vehicle-table-title"><IconBike size={18} /><div><span>Vehículos registrados</span><small>{vehicles.length} {vehicles.length === 1 ? 'vehículo' : 'vehículos'}</small></div></div><div className={`vehicle-table-scroll ${isVehicleListExpanded ? 'is-expanded' : ''}`}><table><thead><tr><th>Placa</th><th>Vehículo</th></tr></thead><tbody>{visibleVehicles.map((vehicle) => <tr key={`${vehicle.plate}-${vehicle.model}`}><td>{vehicle.plate}</td><td>{vehicle.model}</td></tr>)}</tbody></table></div>{vehicles.length > 2 && <button type="button" className="vehicle-more" onClick={() => setIsVehicleListExpanded((expanded) => !expanded)}>{isVehicleListExpanded ? 'Ver menos' : 'Ver más'}<span>{isVehicleListExpanded ? '' : ` (${vehicles.length - 2} más)`}</span></button>}</div>
        <div className="detail-orders"><span>Órdenes activas</span><strong>{client.orders}</strong></div>
      </div>
      <div className="detail-actions"><button type="button" className="detail-edit" onClick={() => onEdit(client)}>Editar</button><button type="button" className={client.disabled ? 'detail-reactivate' : 'detail-disable'} onClick={() => onToggleDisabled(client)}>{client.disabled ? 'Reactivar cliente' : 'Deshabilitar cliente'}</button></div>
    </section>
  </div>
}

function ClientsPage({ onNotify }) {
  const [query, setQuery] = useState('')
  const [clientList, setClientList] = useState(loadStoredClients)
  const [selectedClient, setSelectedClient] = useState(null)
  const [formClient, setFormClient] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filteredClients = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('es-PE')
    return clientList.filter((client) => {
      const matchesSearch = !term || [client.document, client.name, client.email, client.phone, client.channel, client.vehicle, client.orders, ...(client.vehicles?.flatMap((vehicle) => [vehicle.plate, vehicle.model]) || [])].join(' ').toLocaleLowerCase('es-PE').includes(term)
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? !client.disabled : client.disabled)
      return matchesSearch && matchesStatus
    })
  }, [clientList, query, statusFilter])
  const pageCount = Math.max(1, Math.ceil(filteredClients.length / CLIENTS_PER_PAGE))
  const visibleClients = filteredClients.slice((currentPage - 1) * CLIENTS_PER_PAGE, currentPage * CLIENTS_PER_PAGE)
  useEffect(() => { setCurrentPage((page) => Math.min(page, pageCount)) }, [pageCount])
  useEffect(() => { localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clientList)) }, [clientList])
  const saveClient = (nextClient) => {
    const exists = clientList.some((client) => client.document === nextClient.document && client.document !== formClient?.document)
    if (exists) { onNotify('Ya existe un cliente con ese documento.'); return }
    setClientList((current) => formClient ? current.map((client) => client.document === formClient.document ? nextClient : client) : [...current, nextClient])
    setFormClient(null); setIsCreating(false); setSelectedClient(formClient ? nextClient : null)
    onNotify(formClient ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.')
  }
  const toggleDisabled = (target) => {
    const nextDisabled = !target.disabled
    const nextClient = { ...target, disabled: nextDisabled }
    setClientList((current) => current.map((client) => client.document === target.document ? nextClient : client))
    setSelectedClient(nextClient)
    onNotify(nextDisabled ? `${target.name} fue deshabilitado.` : `${target.name} fue reactivado.`)
  }
  const startEdit = (client) => { setSelectedClient(null); setFormClient(client) }
  return <section className="clients-page">
    <PageHeader title="Clientes" subtitle="Gestiona la información de tus clientes." actions={<div className="list-actions"><label className="search client-search"><IconSearch size={18} stroke={2.2} /><input value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1) }} placeholder="Buscar cliente" aria-label="Buscar clientes" />{query && <button type="button" className="search-clear" aria-label="Limpiar búsqueda" onClick={() => { setQuery(''); setCurrentPage(1) }}><IconX size={15} /></button>}</label><div className="client-filter"><Button variant="secondary" className={statusFilter !== 'all' ? 'is-filtered' : ''} onClick={() => setIsFilterOpen((open) => !open)} aria-expanded={isFilterOpen}><IconFilter size={16} /> Filtros</Button>{isFilterOpen && <div className="client-filter-menu" role="menu" aria-label="Filtrar clientes"><span>Estado del cliente</span>{[['all', 'Todos'], ['active', 'Activos'], ['inactive', 'Inactivos']].map(([value, label]) => <button type="button" className={statusFilter === value ? 'selected' : ''} key={value} onClick={() => { setStatusFilter(value); setCurrentPage(1); setIsFilterOpen(false) }}><i />{label}</button>)}</div>}</div><Button onClick={() => setIsCreating(true)}>Agregar cliente</Button></div>} />
    <Card className="table-card">
      <div className="table-wrap"><table className="data-table clients-table"><thead><tr><th>Documento</th><th>Cliente</th><th>Estado</th><th>Órdenes activas</th><th>Acciones</th></tr></thead><tbody>{filteredClients.length ? visibleClients.map((client) => <tr className={client.disabled ? 'is-disabled' : ''} key={client.document}><td>{client.document}</td><td><b>{client.name}</b></td><td><span className={`client-status ${client.disabled ? 'inactive' : 'active'}`}><i />{client.disabled ? 'Inactivo' : 'Activo'}</span></td><td>{client.orders}</td><td><Button onClick={() => setSelectedClient(client)}>Ver</Button></td></tr>) : <tr className="empty-search"><td colSpan="5"><div className="empty-search-content"><IconSearch size={20} /><strong>No encontramos clientes</strong><span>Prueba con otro nombre, documento, teléfono o vehículo.</span></div></td></tr>}</tbody></table></div>
      <div className="pagination clients-pagination"><Button variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Anterior</Button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => <button type="button" className={`page-number ${currentPage === page ? 'active' : ''}`} key={page} onClick={() => setCurrentPage(page)}>{page}</button>)}<Button variant="secondary" disabled={currentPage === pageCount} onClick={() => setCurrentPage((page) => page + 1)}>Siguiente</Button></div>
    </Card>
    {selectedClient && <ClientDetails client={selectedClient} onClose={() => setSelectedClient(null)} onEdit={startEdit} onToggleDisabled={toggleDisabled} />}
    {(isCreating || formClient) && <ClientFormModal client={formClient} onClose={() => { setFormClient(null); setIsCreating(false) }} onSave={saveClient} />}
  </section>
}

export default ClientsPage
