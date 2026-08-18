import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import './index.css'
import './design-system.css'
import './theme-contrast.css'
import './page-title-spacing.css'
import './startup-error.css'
import { StartupError, StartupErrorBoundary } from './StartupErrorBoundary.tsx'

const rootElement = document.getElementById('root')
let root: Root | undefined

const showStartupError = (reason: unknown) => {
  if (!rootElement) return
  if (root) root.render(<StartupError reason={reason} />)
  else rootElement.textContent = `Chyba při spuštění aplikace\n${reason instanceof Error ? reason.message : String(reason)}`
}

window.addEventListener('error', (event) => showStartupError(event.error ?? event.message))
window.addEventListener('unhandledrejection', (event) => showStartupError(event.reason))

const boot = async () => {
  try {
    if (!rootElement) throw new Error('Nebyl nalezen kořen aplikace.')
    const { default: App } = await import('./App.tsx')
    root = createRoot(rootElement)
    root.render(
      <StrictMode>
        <StartupErrorBoundary>
          <App />
        </StartupErrorBoundary>
      </StrictMode>,
    )
  } catch (reason) {
    showStartupError(reason)
  }
}

void boot()
