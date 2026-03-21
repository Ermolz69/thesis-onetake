import { ReactNode, useEffect, useMemo, useState } from 'react';
import { storage, storageKeys } from '@/shared/config';
import { I18nContext } from './i18n-context';
import { localeLabels, messages, type Locale, type MessageTree } from './messages';

export interface I18nProviderProps {
  children: ReactNode;
}

const defaultLocale: Locale = 'en';

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && value in localeLabels;
}

function getMessage(tree: MessageTree, key: string): string | undefined {
  return key.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, tree) as string | undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;

  return Object.entries(params).reduce(
    (result, [key, value]) => result.split(`{${key}}`).join(String(value)),
    template
  );
}

export const I18nProvider = ({ children }: I18nProviderProps) => {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = storage.get<Locale>(storageKeys.locale);
    return isLocale(saved) ? saved : defaultLocale;
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    storage.set(storageKeys.locale, locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: string, params?: Record<string, string | number>) =>
        interpolate(
          getMessage(messages[locale], key) ?? getMessage(messages.en, key) ?? key,
          params
        ),
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
