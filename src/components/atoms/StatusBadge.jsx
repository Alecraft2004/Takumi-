export function StatusBadge({ status }) {
  const classes = { Entregada: 'green', Lista: 'green', 'En reparación': 'red', 'En diagnóstico': 'yellow', 'En espera': 'blue', Recibida: 'gray' }
  return <span className={`status ${classes[status] || 'gray'}`}>{status}</span>
}
