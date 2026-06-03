import { Test, TestingModule } from '@nestjs/testing';
import { SettingsModule } from './settings.module';

describe('SettingsModule', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [SettingsModule],
    }).compile();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('should be defined', () => {
    expect(moduleRef).toBeDefined();
  });
});
