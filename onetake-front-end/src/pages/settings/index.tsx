import { useMemo } from 'react';
import { useI18n, localeLabels, type Locale } from '@/app/providers/i18n';
import { useTheme, type Theme } from '@/app/providers/theme';
import { Button, Card, Tabs } from '@/shared/ui';
import {
  contentContainer,
  contentShell,
  pageSubtitle,
  pageTitle,
  sectionCard,
  toolbar,
} from '@/shared/ui/recipes';

const themeOptions: Theme[] = ['light', 'dark'];
const localeOptions: Locale[] = ['en', 'uk', 'ru'];

export const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();

  const themeTabs = useMemo(
    () =>
      themeOptions.map((option) => ({
        id: option,
        label: t(`settings.${option}`),
        content: (
          <div className="rounded-2xl border border-border-soft bg-surface-muted px-4 py-4 text-sm text-text-secondary">
            <p>
              {t('settings.statusTheme')}:{' '}
              <span className="font-semibold text-text-primary">{t(`settings.${option}`)}</span>
            </p>
            <p className="mt-2">{t('settings.themeHint')}</p>
          </div>
        ),
      })),
    [t]
  );

  return (
    <div className={contentShell}>
      <div className={`${contentContainer} space-y-8 py-8 sm:py-10`}>
        <div className={toolbar}>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-text-secondary">
              {t('settings.eyebrow')}
            </p>
            <h1 className={pageTitle}>{t('settings.title')}</h1>
            <p className={pageSubtitle}>{t('settings.subtitle')}</p>
          </div>
          <Button variant="outline" tone="neutral" onClick={() => window.history.back()}>
            {t('settings.back')}
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <Card radius="xl" className={`${sectionCard} space-y-6 p-5 sm:p-6`}>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {t('settings.appearanceTitle')}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">{t('settings.appearanceSubtitle')}</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-text-primary">
                {t('settings.themeLabel')}
              </label>
              <Tabs
                tabs={themeTabs}
                activeTab={theme}
                onTabChange={(tabId) => setTheme(tabId as Theme)}
                variant="pills"
                tone="accent"
                size="md"
                className="w-full"
              />
            </div>
          </Card>

          <Card radius="xl" className={`${sectionCard} space-y-6 p-5 sm:p-6`}>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {t('settings.languageTitle')}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">{t('settings.languageSubtitle')}</p>
            </div>

            <div className="space-y-3">
              <label htmlFor="language" className="text-sm font-medium text-text-primary">
                {t('settings.languageLabel')}
              </label>
              <select
                id="language"
                value={locale}
                onChange={(event) => setLocale(event.target.value as Locale)}
                className="h-input-md w-full rounded-xl border border-border-soft bg-surface-elevated px-4 text-sm text-text-primary outline-none transition focus-visible:[box-shadow:var(--input-ring)] sm:text-base"
              >
                {localeOptions.map((option) => (
                  <option key={option} value={option}>
                    {localeLabels[option]}
                  </option>
                ))}
              </select>
              <p className="text-sm text-text-secondary">{t('settings.languageHint')}</p>
            </div>
          </Card>
        </div>

        <Card radius="xl" className={`${sectionCard} space-y-4 p-5 sm:p-6`}>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {t('settings.previewTitle')}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">{t('settings.previewSubtitle')}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="rounded-3xl border border-border-soft bg-surface-muted p-5 shadow-sm">
              <p className="text-lg font-semibold text-text-primary">
                {t('settings.previewCardTitle')}
              </p>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                {t('settings.previewCardBody')}
              </p>
            </div>

            <div className="space-y-3 rounded-3xl border border-border-soft bg-surface-elevated p-5 shadow-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">
                  {t('settings.statusTheme')}
                </p>
                <p className="mt-2 font-semibold text-text-primary">{t(`settings.${theme}`)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">
                  {t('settings.statusLanguage')}
                </p>
                <p className="mt-2 font-semibold text-text-primary">{localeLabels[locale]}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
