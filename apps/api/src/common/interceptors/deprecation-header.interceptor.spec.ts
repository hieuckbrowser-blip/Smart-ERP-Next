import { DeprecationHeaderInterceptor } from './deprecation-header.interceptor';
import { of } from 'rxjs';

describe('DeprecationHeaderInterceptor', () => {
  let interceptor: DeprecationHeaderInterceptor;

  beforeEach(() => {
    interceptor = new DeprecationHeaderInterceptor();
  });

  it('adds Sunset header when endpoint has @Deprecated with date', (done) => {
    const responseMock = { setHeader: jest.fn() };
    const context = {
      switchToHttp: () => ({ getResponse: () => responseMock }),
      getHandler: () => {
        const fn = () => {};
        Reflect.defineMetadata('deprecated', { sunsetDate: '2026-09-01', alternatives: '/api/v2/orders' }, fn);
        return fn;
      },
    } as any;

    interceptor.intercept(context, { handle: () => of({}) }).subscribe({
      next: () => {
        expect(responseMock.setHeader).toHaveBeenCalledWith('Sunset', expect.stringContaining('Sep 2026'));
        expect(responseMock.setHeader).toHaveBeenCalledWith('Deprecation', expect.any(String));
        done();
      },
      error: (err) => done(err),
    });
  });

  it('does not add headers when no @Deprecated', (done) => {
    const responseMock = { setHeader: jest.fn() };
    const context = {
      switchToHttp: () => ({ getResponse: () => responseMock }),
      getHandler: () => () => {},
    } as any;

    interceptor.intercept(context, { handle: () => of({}) }).subscribe({
      complete: () => {
        expect(responseMock.setHeader).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('adds deprecation hint when alternatives provided', (done) => {
    const responseMock = { setHeader: jest.fn() };
    const context = {
      switchToHttp: () => ({ getResponse: () => responseMock }),
      getHandler: () => {
        const fn = () => {};
        Reflect.defineMetadata('deprecated', { sunsetDate: '2026-09-01', alternatives: '/api/v2/orders' }, fn);
        return fn;
      },
    } as any;

    interceptor.intercept(context, { handle: () => of({}) }).subscribe({
      complete: () => {
        expect(responseMock.setHeader).toHaveBeenCalledWith('Link', expect.stringContaining('/api/v2/orders'));
        done();
      },
    });
  });
});
