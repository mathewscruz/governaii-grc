import type { Locale } from '@/contexts/LanguageContext';

const localeMap: Record<Locale, string> = {
  pt: 'pt-BR',
  en: 'en-US',
};

const currencyMap: Record<Locale, string> = {
  pt: 'BRL',
  en: 'USD',
};

export function getIntlLocale(locale: Locale): string {
  return localeMap[locale] || 'pt-BR';
}

export function formatDate(
  date: Date | string | number | null | undefined,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '';
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(getIntlLocale(locale), options || { dateStyle: 'short' }).format(d);
  } catch {
    return '';
  }
}

export function formatDateTime(
  date: Date | string | number | null | undefined,
  locale: Locale
): string {
  return formatDate(date, locale, { dateStyle: 'short', timeStyle: 'short' });
}

export function formatTime(
  date: Date | string | number | null | undefined,
  locale: Locale
): string {
  return formatDate(date, locale, { timeStyle: 'short' });
}

export function formatNumber(
  n: number | null | undefined,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  if (n === null || n === undefined || isNaN(n)) return '';
  try {
    return new Intl.NumberFormat(getIntlLocale(locale), options).format(n);
  } catch {
    return String(n);
  }
}

export function formatCurrency(
  n: number | null | undefined,
  locale: Locale,
  currency?: string
): string {
  if (n === null || n === undefined || isNaN(n)) return '';
  try {
    return new Intl.NumberFormat(getIntlLocale(locale), {
      style: 'currency',
      currency: currency || currencyMap[locale],
    }).format(n);
  } catch {
    return String(n);
  }
}

export function formatPercent(
  n: number | null | undefined,
  locale: Locale,
  fractionDigits = 0
): string {
  if (n === null || n === undefined || isNaN(n)) return '';
  try {
    return new Intl.NumberFormat(getIntlLocale(locale), {
      style: 'percent',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(n / 100);
  } catch {
    return `${n}%`;
  }
}

export function formatRelativeTime(
  date: Date | string | number | null | undefined,
  locale: Locale
): string {
  if (!date) return '';
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const diffMs = d.getTime() - Date.now();
    const diffSec = Math.round(diffMs / 1000);
    const rtf = new Intl.RelativeTimeFormat(getIntlLocale(locale), { numeric: 'auto' });

    const abs = Math.abs(diffSec);
    if (abs < 60) return rtf.format(diffSec, 'second');
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
    if (abs < 2592000) return rtf.format(Math.round(diffSec / 86400), 'day');
    if (abs < 31536000) return rtf.format(Math.round(diffSec / 2592000), 'month');
    return rtf.format(Math.round(diffSec / 31536000), 'year');
  } catch {
    return '';
  }
}

export function formatFileSize(bytes: number | null | undefined, locale: Locale): string {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return '';
  const units = locale === 'pt' ? ['B', 'KB', 'MB', 'GB', 'TB'] : ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${formatNumber(value, locale, { maximumFractionDigits: 1 })} ${units[i]}`;
}
