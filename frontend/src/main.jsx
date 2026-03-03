import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/auth.css'

// Suppress harmless AbortErrors from Supabase in dev mode
import './lib/suppressAbortErrors'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
