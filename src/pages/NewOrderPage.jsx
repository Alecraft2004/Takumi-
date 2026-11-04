import { useEffect, useRef, useState } from 'react'
import { IconArrowRight, IconChevronDown, IconX } from '@tabler/icons-react'
import { Button } from '../components/atoms/Button'
import { Card } from '../components/atoms/Card'
import { PageHeader } from '../components/molecules/PageHeader'
import clientGlassIcon from '../assets/order-icons/client-glass.png'
import motorcycleGlassIcon from '../assets/order-icons/motorcycle-glass.png'
import serviceGlassIcon from '../assets/order-icons/service-glass.png'
import './NewOrderPage.css'
import './NewOrderFields.css'
import './NewOrderButtons.css'
import './NewOrderFocus.css'
import './NewOrderGlass.css'

const Field = ({ label, value, children, className = '' }) => <label className={`field ${className}`}><span>{label}</span>{children || <input placeholder={value} />}</label>

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

function NewOrderPage({ onNavigate, onNotify }) {
  const [priority, setPriority] = useState('')
  const save = () => { onNotify('Orden ORD-0055 guardada correctamente.'); onNavigate('diagnosis') }
  return <div className="new-order-page">
    <PageHeader title="Nueva orden de reparación" subtitle="Registra al cliente, su motocicleta y el motivo de ingreso." actions={<><Button className="order-cancel" variant="secondary" onClick={() => onNavigate('orders')}><IconX size={16} /> Cancelar</Button><Button className="order-continue" onClick={save}>Continuar <IconArrowRight size={17} /></Button></>} />
    <div className="new-order-grid">
      <FormSection icon={clientGlassIcon} number="01" title="Cliente" description="Datos de contacto del propietario."><Field label="Buscar cliente" value="Buscar por nombre o DNI" className="field-search" /><div className="customer-fields"><Field label="Nombre completo" value="Ejemplo: María López" /><Field label="Teléfono" value="Ejemplo: +51 925 456 789" /><Field label="Correo electrónico" value="Ejemplo: maria.lopez@email.com" /></div></FormSection>
      <FormSection icon={motorcycleGlassIcon} number="02" title="Motocicleta" description="Identifica el vehículo que ingresará al taller."><Field label="Buscar motocicleta" value="Buscar por placa o VIN" className="field-search" /><div className="motorcycle-fields"><Field label="Placa" value="Ejemplo: ABC123" /><Field label="Marca / Modelo" value="Ejemplo: Yamaha FZ 2.0" /><Field label="Año" value="Ejemplo: 2021" /><Field label="Color" value="Ejemplo: Negro" /></div></FormSection>
    </div>
    <Card className="service-details"><header><div className="section-icon service"><img src={serviceGlassIcon} alt="" /></div><div><span className="section-step">PASO 03</span><h2>Detalle del servicio</h2><p>Describe el problema y define la atención de la orden.</p></div></header><div className="service-fields"><Field label="Problema reportado" className="problem-field"><textarea placeholder="Describe el problema reportado por el cliente." /></Field><div className="service-options"><Field label="Prioridad"><GlassSelect value={priority} onChange={setPriority} placeholder="Selecciona una prioridad" options={['Alta', 'Media', 'Baja']} /></Field><Field label="Fecha estimada de entrega"><input type="date" /></Field></div></div></Card>
  </div>
}
export default NewOrderPage
