import { RouterProvider } from './providers/router'
import { StoreProvider } from './providers/store'
import { ThemeProvider } from './providers/theme'

export const App = () => {
  return (
    <ThemeProvider>
      <StoreProvider>
        <RouterProvider />
      </StoreProvider>
    </ThemeProvider>
  )
}

