import { AiCopilotController } from './ai-copilot.controller';
import { AiCopilotService } from './ai-copilot.service';

describe('AiCopilotController', () => {
  it('can be instantiated', () => {
    const service = { getExecutiveInsights: jest.fn() } as any;
    const controller = new AiCopilotController(service);
    expect(controller).toBeDefined();
  });

  it('getInsights delegates to service with tenantId', async () => {
    const service = { getExecutiveInsights: jest.fn().mockResolvedValue({ revenue: 100 }) } as any;
    const controller = new AiCopilotController(service);
    const req = { user: { tenantId: 't1' } };
    const result = await controller.getInsights(req);
    expect(service.getExecutiveInsights).toHaveBeenCalledWith('t1');
    expect(result).toEqual({ revenue: 100 });
  });
});
