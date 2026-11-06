import { useEffect, useRef, useState } from 'react'
import { IconArrowRight, IconChevronDown, IconPhoto, IconTrash, IconUpload, IconX } from '@tabler/icons-react'
import { Button } from '../components/atoms/Button'
import { Card } from '../components/atoms/Card'
import { PageHeader } from '../components/molecules/PageHeader'
import { clients as initialClients } from '../data/mockData'
import clientGlassIcon from '../assets/order-icons/client-glass.png'
import motorcycleGlassIcon from '../assets/order-icons/motorcycle-glass.png'
import serviceGlassIcon from '../assets/order-icons/service-glass.png'
import './NewOrderPage.css'
import './NewOrderFields.css'
import './NewOrderButtons.css'
import './NewOrderFocus.css'
import './NewOrderGlass.css'

const Field = ({ label, value, children, className = '' }) => <label className={`field ${className}`}><span>{label}</span>{children || <input placeholder={value} />}</label>
const CLIENTS_STORAGE_KEY = 'takumi-demo-clients'
const loadClients = () => { try { const saved = JSON.parse(localStorage.getItem(CLIENTS_STORAGE_KEY)); return Array.isArray(saved) ? saved : initialClients } catch { return initialClients } }
const getVehicles = (client) => client.vehicles?.length ? client.vehicles : client.vehicle ? [{ plate: client.vehicle.split('·')[0]?.trim(), model: client.vehicle.split('·').slice(1).join('·').trim() }] : []
const vehicleMeta = { 'Honda CB190R': { year: '2021', color: 'Negro' }, 'Yamaha FZ 2.0': { year: '2022', color: 'Azul' }, 'Bajaj Pulsar NS 200': { year: '2021', color: 'Gris' }, 'Yamaha R3': { year: '2020', color: 'Azul' }, 'Suzuki Gixxer 150': { year: '2023', color: 'Negro' } }

function FormSection({ icon, number, title, description, children }) {
  return <Card className="order-section"><header><div className="section-icon"><img src={icon} alt="" /></div><div><span className="section-step">PASO {number}</span><h2>{title}</h2><p>{description}</p></div></header><div className="section-fields">{children}</div></Card>
}

function GlassSelect({ value, onChange, placeholder, options }) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef(null)

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!selectRef.current?.contains(event.target)) setIsOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  return <div className={`glass-select ${isOpen ? 'is-open' : ''}`} ref={selectRef}>
    <button className="glass-select-trigger" type="button" onClick={() => setIsOpen((open) => !open)} aria-haspopup="listbox" aria-expanded={isOpen}>
      <span>{value || placeholder}</span><IconChevronDown size={17} stroke={2.4} />
    </button>
    <div className="glass-select-menu" role="listbox" aria-hidden={!isOpen}>
      {options.map((option) => <button type="button" role="option" aria-selected={value === option} className={value === option ? 'is-selected' : ''} key={option} onClick={() => { onChange(option); setIsOpen(false) }}>{option}</button>)}
    </div>
  </div>
}

function NewOrderPage({ onNavigate, onNotify, onCreateOrder, orders = [] }) {
  const [priority, setPriority] = useState('')
  const [clientQuery, setClientQuery] = useState('')
  const [vehicleQuery, setVehicleQuery] = useState('')
  const [clientForm, setClientForm] = useState({ document: '', name: '', phone: '', email: '' })
  const [vehicleForm, setVehicleForm] = useState({ plate: '', model: '', year: '', color: '' })
  const [reportedIssue, setReportedIssue] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [vehiclePhoto, setVehiclePhoto] = useState('')
  const [photoName, setPhotoName] = useState('')
  const clientRecords = loadClients()
  const vehicleRecords = clientRecords.flatMap((client) => getVehicles(client).map((vehicle) => ({ ...vehicle, owner: client, vin: `VIN-${(vehicle.plate || '').replace(/[^a-z0-9]/gi, '').toUpperCase()}` })))
  const clientMatches = clientQuery.trim() ? clientRecords.filter((client) => `${client.name} ${client.document}`.toLocaleLowerCase().includes(clientQuery.toLocaleLowerCase())).slice(0, 5) : []
  const vehicleMatches = vehicleQuery.trim() ? vehicleRecords.filter((vehicle) => `${vehicle.plate} ${vehicle.vin} ${vehicle.model}`.toLocaleLowerCase().includes(vehicleQuery.toLocaleLowerCase())).slice(0, 5) : []
  const selectClient = (client) => { setClientQuery(`${client.name} · ${client.document}`); setClientForm({ document: client.document || '', name: client.name || '', phone: client.phone || '', email: client.email || '' }) }
  const selectVehicle = (vehicle) => { const meta = vehicleMeta[vehicle.model] || { year: '', color: '' }; setVehicleQuery(`${vehicle.plate} · ${vehicle.vin}`); setVehicleForm({ plate: vehicle.plate || '', model: vehicle.model || '', year: meta.year, color: meta.color }); if (vehicle.owner) selectClient(vehicle.owner) }
  const findClient = (value) => { setClientQuery(value); const matches = clientRecords.filter((client) => `${client.name} ${client.document}`.toLocaleLowerCase().includes(value.toLocaleLowerCase())); if (matches.length === 1) selectClient(matches[0]) }
  const findVehicle = (value) => { setVehicleQuery(value); const matches = vehicleRecords.filter((vehicle) => `${vehicle.plate} ${vehicle.vin} ${vehicle.model}`.toLocaleLowerCase().includes(value.toLocaleLowerCase())); if (matches.length === 1) selectVehicle(matches[0]) }
  const isOrderReady = Boolean(clientForm.name.trim() && vehicleForm.plate.trim() && vehicleForm.model.trim() && reportedIssue.trim() && priority && deliveryDate)
  const requiredOrderHint = [!clientForm.name.trim() && 'cliente', !vehicleForm.plate.trim() && 'placa', !vehicleForm.model.trim() && 'modelo', !reportedIssue.trim() && 'problema reportado', !priority && 'prioridad', !deliveryDate && 'fecha estimada'].filter(Boolean).join(', ')
  const selectPhoto = (event) => { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith('image/')) { onNotify('Selecciona una imagen válida para el vehículo.'); return }; const reader = new FileReader(); reader.onload = () => { setVehiclePhoto(String(reader.result)); setPhotoName(file.name) }; reader.readAsDataURL(file) }
  const save = () => {
    if (!isOrderReady) return
    const nextNumber = Math.max(54, ...orders.map((order) => Number(order.id.replace(/\D/g, '')) || 0)) + 1
    const id = `ORD-${String(nextNumber).padStart(4, '0')}`
    onCreateOrder?.({
      id,
      clientDocument: clientForm.document,
      client: clientForm.name,
      vehicle: vehicleForm.model,
      plate: vehicleForm.plate,
      vehicleYear: vehicleForm.year,
      vehicleColor: vehicleForm.color,
      issue: reportedIssue,
      priority,
      date: new Date().toLocaleDateString('es-PE'),
      status: 'En diagnóstico',
      total: 'S/ 0',
      deliveryDate,
      technician: 'Sin asignar',
      progress: 16,
      photo: vehiclePhoto,
    })
    onNotify(`Orden ${id} guardada correctamente.`)
    onNavigate('orders')
  }
  return <div className="new-order-page">
    <PageHeader title="Nueva orden de reparación" subtitle="Registra al cliente, su motocicleta y el motivo de ingreso." actions={<><Button className="order-cancel" variant="danger" onClick={() => onNavigate('orders')}><IconX size={16} /> Cancelar</Button><span className={`required-action-tip ${!isOrderReady ? 'is-disabled' : ''}`} data-tooltip={`Completa: ${requiredOrderHint}`}><Button className="order-continue" disabled={!isOrderReady} onClick={save}>Continuar <IconArrowRight size={17} /></Button></span></>} />
    <div className="new-order-grid">
      <FormSection icon={clientGlassIcon} number="01" title="Cliente" description="Datos de contacto del propietario."><label className="field field-search lookup-field"><span>Buscar cliente</span><input value={clientQuery} onChange={(event) => findClient(event.target.value)} placeholder="Buscar por nombre o DNI" autoComplete="off" />{clientMatches.length > 0 && <div className="lookup-results">{clientMatches.map((client) => <button type="button" key={client.document} onClick={() => selectClient(client)}><b>{client.name}</b><span>DNI/RUC: {client.document}</span></button>)}</div>}</label><div className="customer-fields"><Field label="Nombre completo"><input value={clientForm.name} onChange={(event) => setClientForm({ ...clientForm, name: event.target.value })} placeholder="Ejemplo: María López" /></Field><Field label="Teléfono"><input value={clientForm.phone} onChange={(event) => setClientForm({ ...clientForm, phone: event.target.value })} placeholder="Ejemplo: +51 925 456 789" /></Field><Field label="Correo electrónico"><input value={clientForm.email} onChange={(event) => setClientForm({ ...clientForm, email: event.target.value })} placeholder="Ejemplo: maria.lopez@email.com" /></Field></div></FormSection>
      <FormSection icon={motorcycleGlassIcon} number="02" title="Motocicleta" description="Identifica el vehículo que ingresará al taller."><label className="field field-search lookup-field"><span>Buscar motocicleta</span><input value={vehicleQuery} onChange={(event) => findVehicle(event.target.value)} placeholder="Buscar por placa o VIN" autoComplete="off" />{vehicleMatches.length > 0 && <div className="lookup-results">{vehicleMatches.map((vehicle) => <button type="button" key={`${vehicle.plate}-${vehicle.vin}`} onClick={() => selectVehicle(vehicle)}><b>{vehicle.plate || 'Sin placa'} · {vehicle.model}</b><span>{vehicle.vin}</span></button>)}</div>}</label><div className="motorcycle-fields"><Field label="Placa"><input value={vehicleForm.plate} onChange={(event) => setVehicleForm({ ...vehicleForm, plate: event.target.value })} placeholder="Ejemplo: ABC123" /></Field><Field label="Marca / Modelo"><input value={vehicleForm.model} onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })} placeholder="Ejemplo: Yamaha FZ 2.0" /></Field><Field label="Año"><input value={vehicleForm.year} onChange={(event) => setVehicleForm({ ...vehicleForm, year: event.target.value })} placeholder="Ejemplo: 2021" /></Field><Field label="Color"><input value={vehicleForm.color} onChange={(event) => setVehicleForm({ ...vehicleForm, color: event.target.value })} placeholder="Ejemplo: Negro" /></Field></div><div className={`vehicle-photo-upload ${vehiclePhoto ? 'has-photo' : ''}`}><div className="vehicle-photo-preview">{vehiclePhoto ? <img src={vehiclePhoto} alt="Vista previa de la motocicleta" /> : <IconPhoto size={25} />}</div><div className="vehicle-photo-copy"><b>Foto del vehículo</b><span>{photoName || 'Sube una imagen para mostrarla en la tarjeta de la orden.'}</span></div><label className="vehicle-photo-action"><IconUpload size={15} /> {vehiclePhoto ? 'Cambiar foto' : 'Subir foto'}<input type="file" accept="image/*" onChange={selectPhoto} /></label>{vehiclePhoto && <button type="button" className="vehicle-photo-remove" onClick={() => { setVehiclePhoto(''); setPhotoName('') }} aria-label="Quitar foto"><IconTrash size={15} /></button>}</div></FormSection>
    </div>
    <Card className="service-details"><header><div className="section-icon service"><img src={serviceGlassIcon} alt="" /></div><div><span className="section-step">PASO 03</span><h2>Detalle del servicio</h2><p>Describe el problema y define la atención de la orden.</p></div></header><div className="service-fields"><Field label="Problema reportado" className="problem-field"><textarea value={reportedIssue} onChange={(event) => setReportedIssue(event.target.value)} placeholder="Describe el problema reportado por el cliente." /></Field><div className="service-options"><Field label="Prioridad"><GlassSelect value={priority} onChange={setPriority} placeholder="Selecciona una prioridad" options={['Alta', 'Media', 'Baja']} /></Field><Field label="Fecha estimada de entrega"><input type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} /></Field></div></div></Card>
  </div>
}
export default NewOrderPage
