import { useState } from 'react'
import { IconBell, IconDeviceFloppy, IconRefresh } from '@tabler/icons-react'
import { Button } from '../components/atoms/Button'
import { Card } from '../components/atoms/Card'
import { PageHeader } from '../components/molecules/PageHeader'
import './SettingsPage.css'

const initialSettings = {
  name: 'Takumi Corporation',
  ruc: '20615067980',
  address: 'Av. Socabaya Mz. 2 Lote 12',
  orderNotifications: true,
  deliveryReminders: true,
}

function readSettings() {
  try { return { ...initialSettings, ...JSON.parse(localStorage.getItem('takumi_settings')) } } catch { return initialSettings }
}

function SettingsPage({ onNotify }) {
  const [settings, setSettings] = useState(readSettings)
  const [isSaving, setIsSaving] = useState(false)
  const update = (field, value) => setSettings((current) => ({ ...current, [field]: value }))
  const save = () => {
    if (!settings.name.trim() || !settings.address.trim()) return onNotify('Completa el nombre y la dirección del taller.')
    if (!/^\d{11}$/.test(settings.ruc.trim())) return onNotify('El RUC debe tener exactamente 11 dígitos.')
    setIsSaving(true)
    window.setTimeout(() => {
      localStorage.setItem('takumi_settings', JSON.stringify(settings))
      setIsSaving(false)
      onNotify('Configuración guardada correctamente.')
    }, 700)
  }
  const reset = () => {
    setSettings(initialSettings)
    localStorage.removeItem('takumi_settings')
    onNotify('Se restauraron los valores predeterminados.')
  }
  const toggle = (field, label) => {
    const next = !settings[field]
    update(field, next)
    localStorage.setItem('takumi_settings', JSON.stringify({ ...settings, [field]: next }))
    onNotify(`${label} ${next ? 'activados' : 'desactivados'}.`)
  }

  return <><PageHeader title="Configuración" subtitle="Administra la información y preferencias del taller." actions={<Button variant="secondary" onClick={reset}><IconRefresh size={16} /> Restaurar</Button>} /><div className="settings-grid settings-page"><Card><h2>Datos del taller</h2><label className="field"><span>Nombre del taller</span><input value={settings.name} onChange={(event) => update('name', event.target.value)} /></label><label className="field"><span>RUC</span><input value={settings.ruc} inputMode="numeric" maxLength="11" onChange={(event) => update('ruc', event.target.value.replace(/\D/g, ''))} /></label><label className="field"><span>Dirección</span><input value={settings.address} onChange={(event) => update('address', event.target.value)} /></label><Button onClick={save} disabled={isSaving}><IconDeviceFloppy size={16} /> {isSaving ? 'Guardando…' : 'Guardar cambios'}</Button></Card><Card><h2>Preferencias</h2><div className="setting-row"><div><b>Notificaciones de órdenes</b><p>Recibe alertas cuando cambie el estado de una orden.</p></div><button className={`setting-switch ${settings.orderNotifications ? 'on' : ''}`} type="button" onClick={() => toggle('orderNotifications', 'Notificaciones de órdenes')} role="switch" aria-checked={settings.orderNotifications} aria-label="Notificaciones de órdenes"><span><IconBell size={14} /></span></button></div><div className="setting-row"><div><b>Recordatorios de entrega</b><p>Recibe un aviso antes de la fecha estimada.</p></div><button className={`setting-switch ${settings.deliveryReminders ? 'on' : ''}`} type="button" onClick={() => toggle('deliveryReminders', 'Recordatorios de entrega')} role="switch" aria-checked={settings.deliveryReminders} aria-label="Recordatorios de entrega"><span><IconBell size={14} /></span></button></div><p className="settings-note">Los cambios en las preferencias se guardan inmediatamente.</p></Card></div></> }
export default SettingsPage
