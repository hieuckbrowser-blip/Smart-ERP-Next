import { RequestTimeoutMiddleware } from './request-timeout.middleware';

describe('RequestTimeoutMiddleware', () => {
  let middleware: RequestTimeoutMiddleware;

  beforeEach(() => {
    middleware = new RequestTimeoutMiddleware();
  });

  it('passes through requests that complete before timeout', (done) => {
    const req = { url: '/api/test' } as any;
    const res = { setTimeout: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
    done();
  });

  it('sets timeout on the response object', (done) => {
    const req = { url: '/api/test' } as any;
    const res = { setTimeout: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);
    expect(res.setTimeout).toHaveBeenCalledWith(expect.any(Number), expect.any(Function));
    done();
  });

  it('calls next within the timeout window', (done) => {
    const req = { url: '/api/slow' } as any;
    const res = { setTimeout: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    done();
  });
});
