import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './theme-context';
import { storage, storageKeys } from '@/shared/config';

function ThemeHarness() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <span>{theme}</span>
      <button type="button" onClick={toggleTheme}>
        toggle
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    storage.remove(storageKeys.theme);
    document.documentElement.removeAttribute('data-theme');
  });

  it('restores theme from storage and toggles document theme', async () => {
    storage.set(storageKeys.theme, 'dark');
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>
    );

    expect(screen.getByText('dark')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

    await user.click(screen.getByRole('button', { name: 'toggle' }));

    expect(screen.getByText('light')).toBeInTheDocument();
    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });
});
