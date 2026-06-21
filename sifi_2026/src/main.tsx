import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { AuthProvider } from "@/context/AuthContext.tsx"
import { Toaster } from "@/components/ui/toaster.tsx"
import { ToastProvider } from "@/hooks/use-toast.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
        <Toaster />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
)
