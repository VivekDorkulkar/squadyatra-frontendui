import { createContext, useContext, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, X } from 'lucide-react'
import type { Workspace } from '../../domain/models'
import { repository } from './repository'

interface WorkspaceContextValue {
  data: Workspace
  run: (action: () => Promise<unknown>, message: string) => Promise<boolean>
  pending: boolean
}
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient()
  const query = useQuery({
    queryKey: ['workspace'],
    queryFn: repository.load,
    refetchInterval: 30000,
  })
  const mutation = useMutation({ mutationFn: (action: () => Promise<unknown>) => action() })
  const [notice, setNotice] = useState<{ message: string; error: boolean } | null>(null)
  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await mutation.mutateAsync(action)
      await client.invalidateQueries({ queryKey: ['workspace'] })
      setNotice({ message, error: false })
      return true
    } catch (error) {
      setNotice({
        message: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        error: true,
      })
      return false
    }
  }
  if (query.isPending)
    return (
      <div className="page-state" role="status">
        <span className="spinner" />
        Finding your next adventure...
      </div>
    )
  if (query.isError)
    return (
      <div className="page-state">
        <h2>We couldn't load your trips</h2>
        <p>{query.error.message}</p>
        <button className="button primary" onClick={() => query.refetch()}>
          Try again
        </button>
      </div>
    )
  return (
    <WorkspaceContext.Provider value={{ data: query.data, run, pending: mutation.isPending }}>
      {children}
      {notice && (
        <div
          className={`toast ${notice.error ? 'error' : ''}`}
          role={notice.error ? 'alert' : 'status'}
        >
          <CheckCircle2 size={20} />
          <span>{notice.message}</span>
          <button
            className="icon-button"
            aria-label="Dismiss message"
            onClick={() => setNotice(null)}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </WorkspaceContext.Provider>
  )
}
export function useWorkspace() {
  const value = useContext(WorkspaceContext)
  if (!value) throw new Error('WorkspaceProvider is missing')
  return value
}
