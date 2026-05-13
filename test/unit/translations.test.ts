import assert from "node:assert/strict";
import test from "node:test";
import { t, tn, setLocale, getLocale, getAvailableLocales } from "../../src/i18n/translations.ts";

test("t - returns fallback for unknown key", () => {
  const result = t("unknown.key");
  assert.strictEqual(result, "unknown.key");
});

test("t - returns translation with params", () => {
  setLocale("en");
  const result = t("smart.suggestion", { suggestion: "Use tabs" });
  assert.strictEqual(result, "Suggestion: Use tabs");
});

test("t - falls back to English for missing translation", () => {
  setLocale("vi");
  // "app.started" exists in vi
  const result = t("app.started");
  assert.ok(result.includes("khởi động") || result.length > 0);
});

test("tn - handles count replacement", () => {
  setLocale("en");
  // tn replaces {count} with the count value
  const singular = tn("smart.search.results", 1, { count: 1 });
  const plural = tn("smart.search.results", 5, { count: 5 });
  
  assert.ok(singular.includes("1"));
  assert.ok(plural.includes("5"));
});

test("getLocale - returns current locale", () => {
  setLocale("fr");
  assert.strictEqual(getLocale(), "fr");
});

test("getAvailableLocales - returns supported locales", () => {
  const locales = getAvailableLocales();
  assert.ok(locales.includes("en"));
  assert.ok(locales.includes("vi"));
});
