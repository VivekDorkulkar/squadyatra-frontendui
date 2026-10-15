import { useEffect, useRef, type ReactNode } from 'react'
import { X, Compass } from 'lucide-react'

export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'wide' : ''}`}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button className="icon-button" onClick={onClose} title="Close" aria-label="Close dialog">
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  )
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Compass size={30} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  )
}
export function Avatars({ count = 4 }: { count?: number }) {
  return (
    <div className="avatars" aria-label={`${count} fellow travelers`}>
      {['AS', 'RK', 'MP'].slice(0, Math.min(count, 3)).map((name, index) => (
        <span key={name} className={`avatar avatar-${index}`}>
          {name}
        </span>
      ))}
      {count > 3 && <span className="avatar avatar-more">+{count - 3}</span>}
    </div>
  )
}
