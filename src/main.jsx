import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { SimpleRouter } from './router/SimpleRouter.jsx'
import { LocaleProvider } from './i18n/LocaleProvider'
import { ThemeProvider } from './contexts/ThemeContext'
import { UserProvider } from './contexts/UserProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <LocaleProvider>
        <UserProvider>
          <SimpleRouter />
        </UserProvider>
      </LocaleProvider>
    </ThemeProvider>
  </StrictMode>,
)
