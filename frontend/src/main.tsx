import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App'
import './test-ui.css'
import './shared.css'
import { NotificationProvider } from './shared/components/NotificationProvider'
import { applyTheme, getCachedTheme } from './shared/utils/theme'

applyTheme(getCachedTheme())

createRoot(document.getElementById('root')!).render(<StrictMode><NotificationProvider><BrowserRouter><App /></BrowserRouter></NotificationProvider></StrictMode>)
