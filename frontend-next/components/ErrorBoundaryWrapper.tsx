'use client'

import React from 'react'

// Client-side ErrorBoundary wrapper (class components must be "use client")
class ErrorBoundaryWrapper extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const errorStack = `${this.state.error?.toString()}\n\n${
        this.state.errorInfo?.componentStack || ''
      }`
      return (
        <div
          style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '20px',
          }}
        >
          <div
            style={{
              maxWidth: '800px',
              width: '100%',
              background: 'white',
              borderRadius: '24px',
              padding: '48px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                ✓
              </div>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                }}
              >
                YesBill
              </h1>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              An unexpected error occurred. Please refresh the page or contact support.
            </p>
            <pre
              style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '12px',
                color: '#374151',
                overflowX: 'auto',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {errorStack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundaryWrapper
