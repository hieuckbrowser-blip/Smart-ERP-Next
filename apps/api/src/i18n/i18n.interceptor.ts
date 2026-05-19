// @ts-nocheck
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { I18nService } from './i18n.service';

@Injectable()
export class I18nInterceptor implements NestInterceptor {
  constructor(private i18n: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const locale = request.headers['accept-language']?.split(',')[0] || 'vi';

    return next.handle().pipe(
      catchError(err => {
        if (err instanceof BadRequestException) {
          const response = err.getResponse() as any;
          if (response.message && Array.isArray(response.message)) {
            const translated = response.message.map(msg => this.i18n.t(msg, locale));
            return throwError(() => new BadRequestException(translated));
          }
        }
        return throwError(() => err);
      })
    );
  }
}
