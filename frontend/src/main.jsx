import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Bungkus komponen App dengan Provider Google */}
    <GoogleOAuthProvider clientId="215287433587-26et6207aihud0bfhl02g8b76b6sle2e.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
