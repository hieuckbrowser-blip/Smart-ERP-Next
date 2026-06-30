import { SetMetadata } from '@nestjs/common';

export const DEPRECATED_KEY = 'deprecated';
export const Deprecated = (sunsetDate?: string, alternatives?: string) =>
  SetMetadata(DEPRECATED_KEY, { sunsetDate, alternatives });
