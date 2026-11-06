export function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button--${variant} ${variant} ${className}`.trim()} {...props}>{children}</button>
}
