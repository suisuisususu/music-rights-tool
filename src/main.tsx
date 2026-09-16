import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import { LanguageProvider } from "@/providers/language"
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <TRPCProvider>
          <App />
        </TRPCProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
