import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from './I18nProvider';
import { useI18n } from './i18n-context';
import { storage, storageKeys } from '@/shared/config';

function I18nHarness() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div>
      <span>{locale}</span>
      <span>{t('settings.title')}</span>
      <span>{t('upload.fileTooLarge', { max: 2 })}</span>
      <button type="button" onClick={() => setLocale('ru')}>
        ru
      </button>
    </div>
  );
}

describe('I18nProvider', () => {
  beforeEach(() => {
    storage.remove(storageKeys.locale);
    document.documentElement.lang = 'en';
  });

  it('reads locale from storage and interpolates messages', async () => {
    storage.set(storageKeys.locale, 'uk');
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <I18nHarness />
      </I18nProvider>
    );

    expect(screen.getByText('uk')).toBeInTheDocument();
    expect(screen.getByText('Налаштування')).toBeInTheDocument();
    expect(screen.getByText('Файл занадто великий (макс. 2 ГБ).')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'ru' }));

    expect(document.documentElement.lang).toBe('ru');
    expect(screen.getByRole('button', { name: 'ru' })).toBeInTheDocument();
  });
});
