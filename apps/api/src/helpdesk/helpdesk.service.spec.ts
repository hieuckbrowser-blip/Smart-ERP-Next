import { Test, TestingModule } from '@nestjs/testing';
import { HelpdeskService } from './services/helpdesk.service';

describe('HelpdeskService', () => {
  let service: HelpdeskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HelpdeskService],
    }).compile();

    service = module.get<HelpdeskService>(HelpdeskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});