import { AiCopilotService } from './ai-copilot.service';

describe('AiCopilotService', () => {
  let service: AiCopilotService;

  function mockDb(opts?: { total?: number; leadsCount?: number; highPriority?: number; signedCount?: number }) {
    let callIndex = 0;
    const results: Record<number, any> = {};
    const o = { total: 0, leadsCount: 0, highPriority: 0, signedCount: 0, ...opts };
    results[0] = [{ total: o.total }];
    results[1] = [{ count: o.leadsCount }];
    results[2] = [{ count: o.highPriority }];
    results[3] = [{ count: o.signedCount }];
    return {
      db: {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockImplementation(() => {
          const idx = callIndex++;
          return Promise.resolve(results[idx] ?? [{ total: 0 }]);
        }),
      },
    };
  }

  it('is defined', () => {
    service = new AiCopilotService(mockDb() as any);
    expect(service).toBeDefined();
  });

  it('getExecutiveInsights returns all expected fields', async () => {
    service = new AiCopilotService(mockDb({ total: 50000000, leadsCount: 10, highPriority: 3, signedCount: 2 }) as any);
    const result = await service.getExecutiveInsights('t1');
    expect(result.revenue).toBe(50000000);
    expect(result.leadsCount).toBe(10);
    expect(result.highPriority).toBe(3);
    expect(result.signedCount).toBe(2);
    expect(result.healthStatus).toBe('on track');
    expect(result.recommendations).toContain('Revenue below target. Push CRM leads conversion.');
    expect(result.generatedAt).toBeDefined();
  });

  it('flags needs attention when highPriority > 5', async () => {
    service = new AiCopilotService(mockDb({ highPriority: 6 }) as any);
    const result = await service.getExecutiveInsights('t1');
    expect(result.highPriority).toBe(6);
    expect(result.healthStatus).toBe('needs attention');
    expect(result.recommendations).toContain('High number of new leads. Review sales pipeline.');
  });

  it('recommends revenue push when revenue < 100M', async () => {
    service = new AiCopilotService(mockDb({ total: 50000000 }) as any);
    const result = await service.getExecutiveInsights('t1');
    expect(result.recommendations).toContain('Revenue below target. Push CRM leads conversion.');
  });

  it('does not recommend revenue push when revenue >= 100M', async () => {
    service = new AiCopilotService(mockDb({ total: 150000000, highPriority: 0 }) as any);
    const result = await service.getExecutiveInsights('t1');
    expect(result.recommendations).not.toContain('Revenue below target');
  });

  it('handles zero results gracefully', async () => {
    service = new AiCopilotService(mockDb({ total: 0, leadsCount: 0, highPriority: 0, signedCount: 0 }) as any);
    const result = await service.getExecutiveInsights('t1');
    expect(result.revenue).toBe(0);
    expect(result.leadsCount).toBe(0);
    expect(result.healthStatus).toBe('on track');
  });
});
