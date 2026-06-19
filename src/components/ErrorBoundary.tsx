import { Component, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 text-center">
          <h2 className="font-bold text-lg mb-2">Something went wrong</h2>
          <p className="text-slate-500 text-sm mb-4">{this.state.error.message}</p>
          <button onClick={() => location.reload()} className="bg-accent text-white rounded-xl px-5 py-2.5 font-medium">
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
