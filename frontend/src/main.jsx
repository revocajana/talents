import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import logo from './assets/Logo1.png'

document.title = 'Talanta'
const favicon = document.createElement('link')
favicon.rel = 'icon'
favicon.type = 'image/png'
favicon.href = logo
document.head.appendChild(favicon)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
