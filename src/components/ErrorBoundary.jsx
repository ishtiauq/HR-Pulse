import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', fontFamily: 'sans-serif', color: '#333', padding: '20px', textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>Something went wrong</h1>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
            style={{
              padding: '10px 24px', fontSize: '1rem', border: 'none', borderRadius: '8px',
              background: '#3b82f6', color: '#fff', cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
