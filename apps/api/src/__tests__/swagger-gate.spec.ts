jest.mock('@nestjs/swagger', () => ({
  DocumentBuilder: jest.fn(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    addBearerAuth: jest.fn().mockReturnThis(),
    addApiKey: jest.fn().mockReturnThis(),
    build: jest.fn(),
  })),
  SwaggerModule: {
    createDocument: jest.fn(() => ({})),
    setup: jest.fn(),
  },
}));

function setNodeEnv(value: string | undefined) {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

import { setupSwagger } from '../swagger-setup';

describe('Swagger production gate', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    setNodeEnv(undefined);
  });

  it('does not set up Swagger when NODE_ENV is production', () => {
    setNodeEnv('production');

    const { SwaggerModule } = require('@nestjs/swagger');
    const app = { get: jest.fn() } as any;

    setupSwagger(app, '1.0.0');

    expect(SwaggerModule.setup).not.toHaveBeenCalled();
  });

  it('sets up Swagger when NODE_ENV is development', () => {
    setNodeEnv('development');

    const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');
    const app = { get: jest.fn() } as any;

    setupSwagger(app, '1.0.0');

    expect(SwaggerModule.setup).toHaveBeenCalledWith('api', app, {});
    expect(DocumentBuilder).toHaveBeenCalled();
  });

  it('sets up Swagger when NODE_ENV is unset', () => {
    setNodeEnv(undefined);

    const { SwaggerModule } = require('@nestjs/swagger');
    const app = { get: jest.fn() } as any;

    setupSwagger(app, '1.0.0');

    expect(SwaggerModule.setup).toHaveBeenCalled();
  });
});
