import { useEffect, useState } from 'react'
import { IconAlertCircle, IconCircleCheck, IconEye, IconEyeOff, IconLock, IconMail, IconX } from '@tabler/icons-react'
import motorcycle from '../assets/motorcycle.webp'
import '@fontsource/caveat/700.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import './LoginPage.css'
import './LoginViewport.css'
import './LoginFieldHints.css'
import './PasswordToggle.css'
import './LoginMotion.css'
import './LoginDatabase.css'
import './LoginNotification.css'

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [notification, setNotification] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({ username: false, password: false })
  const [shakeKey, setShakeKey] = useState(0)
  const notify = (type, message) => setNotification({ type, message })
  const showFieldErrors = (errors, message) => {
    setFieldErrors(errors)
    setShakeKey((key) => key + 1)
    notify('error', message)
  }

  useEffect(() => {
    if (!notification) return undefined
    const timer = window.setTimeout(() => setNotification(null), 3600)
    return () => window.clearTimeout(timer)
  }, [notification])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!username || !password) return showFieldErrors({ username: !username, password: !password }, 'Completa los campos marcados para continuar.')
    setIsSubmitting(true)
    setFieldErrors({ username: false, password: false })
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
      const responseText = await response.text()
      let data = {}
      try { data = responseText ? JSON.parse(responseText) : {} } catch { data = {} }
      if (!response.ok) {
        if (response.status === 401) showFieldErrors({ username: true, password: true }, 'Usuario o contraseña inválidos.')
        throw new Error(data.message || (response.status === 401 ? 'Usuario o contraseña inválidos.' : 'No se pudo validar el acceso.'))
      }
      if (!data.user) throw new Error('El servidor no devolvió una sesión válida.')
      notify('success', 'Acceso correcto. Bienvenido a Takumi.')
      window.setTimeout(() => onLogin(data.user), 700)
    } catch (requestError) {
      const message = requestError instanceof TypeError
        ? 'No se pudo conectar al servidor. Inicia npm run server.'
        : requestError.message || 'No fue posible validar tus credenciales.'
      notify('error', message)
    } finally { setIsSubmitting(false) }
  }

  const NotificationIcon = notification?.type === 'success' ? IconCircleCheck : IconAlertCircle
  return <main className="login-page"><aside className="login-sidebar"><b>TAKUMI</b><span>SISTEMA DE GESTIÓN<br />DE REPARACIONES</span></aside><section className="login-intro"><h1>Tu taller,<br />en su mejor<br />versión.</h1><p>Gestiona órdenes, diagnósticos y clientes<br />en un solo lugar.</p><strong>Menos caos. Más control.</strong><div className="motorcycle-orbit"><img src={motorcycle} alt="Motocicleta Takumi" /></div></section>{notification && <div className={`dynamic-island ${notification.type}`} role="status"><NotificationIcon size={20} /><span>{notification.message}</span><button type="button" onClick={() => setNotification(null)} aria-label="Cerrar notificación"><IconX size={17} /></button></div>}<form className="login-card" onSubmit={handleSubmit} noValidate><h2>Iniciar sesión</h2><p>Bienvenido de vuelta</p><label className={fieldErrors.username ? 'has-error' : ''}>Usuario<div key={`username-${fieldErrors.username}-${shakeKey}`} className={fieldErrors.username ? 'field-error field-shake' : ''}><IconMail size={17} /><input value={username} onChange={(event) => { setUsername(event.target.value); setFieldErrors((errors) => ({ ...errors, username: false })) }} autoComplete="username" aria-invalid={fieldErrors.username} /></div><small className="input-hint">{fieldErrors.username ? 'Usuario inválido.' : 'Ejemplo: admin'}</small></label><label className={fieldErrors.password ? 'has-error' : ''}>Contraseña<div key={`password-${fieldErrors.password}-${shakeKey}`} className={fieldErrors.password ? 'field-error field-shake' : ''}><IconLock size={17} /><input type={isPasswordVisible ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setFieldErrors((errors) => ({ ...errors, password: false })) }} autoComplete="current-password" aria-invalid={fieldErrors.password} /><button className={`password-toggle ${isPasswordVisible ? 'revealed' : ''}`} type="button" onClick={() => setIsPasswordVisible((visible) => !visible)} aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{isPasswordVisible ? <IconEye size={18} /> : <IconEyeOff size={18} />}</button></div><small className="input-hint">{fieldErrors.password ? 'Contraseña inválida.' : 'Ejemplo: admin123'}</small></label><button disabled={isSubmitting}>{isSubmitting ? 'Validando...' : 'Entrar'}</button><a href="#recuperar">¿Olvidaste tu contraseña?</a></form></main>
}

export default LoginPage
