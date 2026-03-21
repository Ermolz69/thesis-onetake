import { RouterProvider } from './providers/router';
import { StoreProvider } from './providers/store';
import { ThemeProvider } from './providers/theme';
import { AuthProvider } from './providers/auth';
import { I18nProvider } from './providers/i18n';

export const App = () => {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <StoreProvider>
            <RouterProvider />
          </StoreProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
};
