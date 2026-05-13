/**
 * I18n System - Pattern from pi-crew i18n.ts
 * 
 * Namespace-based translation system.
 */

export type Locale = "en" | "es" | "fr" | "pt-BR" | "vi";

type TranslationKey = keyof typeof fallback;

const fallback = {
  // General
  "app.title": "pi-smart",
  "app.started": "pi-smart started.",
  "app.error": "An error occurred.",
  
  // Context
  "context.analyze": "Analyzing context...",
  "context.saved": "Context saved.",
  "context.loaded": "Context loaded.",
  "context.search": "Searching context...",
  "context.empty": "No context available.",
  
  // Smart features
  "smart.suggestion": "Suggestion: {suggestion}",
  "smart.advice": "Advisor recommends: {advice}",
  "smart.search.results": "Found {count} results.",
  
  // Errors
  "error.required": "{field} is required.",
  "error.invalid": "{field} is invalid.",
  "error.timeout": "Operation timed out.",
  
  // Actions
  "action.save": "Save",
  "action.cancel": "Cancel",
  "action.confirm": "Confirm",
  "action.delete": "Delete",
} as const;

const translations: Record<Locale, Partial<Record<TranslationKey, string>>> = {
  en: {},
  es: {
    "app.title": "pi-smart",
    "app.started": "pi-smart iniciado.",
    "context.analyze": "Analizando contexto...",
    "context.saved": "Contexto guardado.",
    "action.save": "Guardar",
    "action.cancel": "Cancelar",
  },
  fr: {
    "app.title": "pi-smart",
    "app.started": "pi-smart démarré.",
    "context.analyze": "Analyse du contexte...",
    "context.saved": "Contexte enregistré.",
    "action.save": "Enregistrer",
    "action.cancel": "Annuler",
  },
  "pt-BR": {
    "app.title": "pi-smart",
    "app.started": "pi-smart iniciado.",
    "context.analyze": "Analisando contexto...",
    "context.saved": "Contexto salvo.",
    "action.save": "Salvar",
    "action.cancel": "Cancelar",
  },
  vi: {
    "app.title": "pi-smart",
    "app.started": "pi-smart đã khởi động.",
    "context.analyze": "Đang phân tích ngữ cảnh...",
    "context.saved": "Đã lưu ngữ cảnh.",
    "context.search": "Đang tìm kiếm...",
    "smart.suggestion": "Đề xuất: {suggestion}",
    "error.required": "{field} là bắt buộc.",
    "action.save": "Lưu",
    "action.cancel": "Hủy",
    "action.confirm": "Xác nhận",
  },
};

let currentLocale: Locale = "en";

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

const TEMPLATE_RE = /\{(\w+)\}/g;

export function t(key: string, params?: Record<string, string | number>): string {
  const template = translations[currentLocale]?.[key as TranslationKey] 
    ?? fallback[key as TranslationKey] 
    ?? key;
  
  if (!params) return template;
  
  return template.replace(TEMPLATE_RE, (_, k) => String(params[k] ?? `{${k}}`));
}

export function tn(key: string, count: number, params?: Record<string, string | number>): string {
  const template = translations[currentLocale]?.[key as TranslationKey] 
    ?? fallback[key as TranslationKey] 
    ?? key;
  
  // Simple plural: append 's' for count !== 1 (English)
  const pluralized = count === 1 ? template : `${template}s`;
  
  if (!params) return pluralized;
  
  return pluralized.replace(TEMPLATE_RE, (_, k) => {
    if (k === "count") return String(count);
    return String(params[k] ?? `{${k}}`);
  });
}

export function getAvailableLocales(): Locale[] {
  return Object.keys(translations) as Locale[];
}
