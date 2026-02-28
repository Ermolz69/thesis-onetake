import { RouterProvider } from './providers/router';
import { StoreProvider } from './providers/store';
import { ThemeProvider } from './providers/theme';
import { AuthProvider } from './providers/auth';

export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoreProvider>
          <RouterProvider />
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
