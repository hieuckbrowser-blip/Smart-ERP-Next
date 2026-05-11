import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

interface Translations {
  [key: string]: string | Translations;
}

@Injectable()
export class I18nService {
  private translations: Map<string, Translations> = new Map();
  private defaultLocale = 'vi';

  constructor() {
    this.loadTranslations();
  }

  private loadTranslations() {
    const localesPath = path.resolve(__dirname, '../../../../packages/i18n/src/locales');
    const locales = fs.readdirSync(localesPath).filter(f => f.match(/^(vi|en)$/));
    for (const locale of locales) {
      const filePath = path.join(localesPath, locale, 'common.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        this.translations.set(locale, data);
      }
    }
  }

  t(key: string, locale?: string, params?: Record<string, any>): string {
    const lang = locale || this.defaultLocale;
    const translation = this.getNestedValue(this.translations.get(lang), key);
    if (!translation) {
      const fallback = this.getNestedValue(this.translations.get(this.defaultLocale), key);
      if (!fallback) return key;
      return this.interpolate(fallback, params);
    }
    return this.interpolate(translation, params);
  }

  private getNestedValue(obj: any, path: string): string | undefined {
    return path.split('.').reduce((current, part) => current?.[part], obj);
  }

  private interpolate(str: string, params?: Record<string, any>): string {
    if (!params) return str;
    return str.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key] ?? `{{${key}}}`);
  }

  getAvailableLocales(): string[] {
    return Array.from(this.translations.keys());
  }
}
