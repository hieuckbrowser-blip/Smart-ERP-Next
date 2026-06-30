import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const DEFAULT_TIMEOUT = 30_000;

@Injectable()
export class RequestTimeoutMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.setTimeout(parseInt(process.env.REQUEST_TIMEOUT ?? String(DEFAULT_TIMEOUT), 10), () => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          data: null,
          error: 'Request timeout',
          errorCode: 'REQUEST_TIMEOUT',
        });
      }
    });
    next();
  }
}
