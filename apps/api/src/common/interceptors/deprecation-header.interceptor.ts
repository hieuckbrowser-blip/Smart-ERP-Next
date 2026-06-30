import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { DEPRECATED_KEY } from '../decorators/deprecated.decorator';

@Injectable()
export class DeprecationHeaderInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const deprecation = Reflect.getMetadata(DEPRECATED_KEY, context.getHandler());
    if (!deprecation) return next.handle();

    const response = context.switchToHttp().getResponse();
    const { sunsetDate, alternatives } = deprecation;

    if (sunsetDate) {
      const date = new Date(sunsetDate).toUTCString();
      response.setHeader('Sunset', date);
      response.setHeader('Deprecation', `true`);
    }

    if (alternatives) {
      response.setHeader('Link', `<${alternatives}>; rel="successor-version"`);
    }

    return next.handle();
  }
}
