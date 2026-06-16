import { Test, TestingModule } from '@nestjs/testing';
import { AutomationService } from './automation.service';
import { DrizzleService } from '../drizzle/drizzle.service';

const mockDrizzle = { db: {} } as any;

describe('AutomationService', () => {
  let service: AutomationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AutomationService, { provide: DrizzleService, useValue: mockDrizzle }],
    }).compile();
    service = module.get<AutomationService>(AutomationService);
  });

  it('listWorkflows returns empty', async () => {
    expect(await service.listWorkflows('t1')).toEqual([]);
  });

  it('createWorkflow returns workflow with id', async () => {
    const wf = await service.createWorkflow('t1', { name: 'Test WF', triggerType: 'webhook', steps: [{ type: 'send_notification', config: {} }] });
    expect(wf.id).toBeTruthy();
    expect(wf.isActive).toBe(true);
  });

  it('createWorkflow generates unique IDs', async () => {
    const a = await service.createWorkflow('t1', { name: 'A', triggerType: 'schedule', steps: [] });
    const b = await service.createWorkflow('t1', { name: 'B', triggerType: 'schedule', steps: [] });
    expect(a.id).not.toBe(b.id);
  });

  it('toggleWorkflow flips active state', async () => {
    expect((await service.toggleWorkflow('t1', 'w1', false)).isActive).toBe(false);
    expect((await service.toggleWorkflow('t1', 'w1', true)).isActive).toBe(true);
  });

  it('getAvailableTriggers returns triggers', async () => {
    const t = await service.getAvailableTriggers();
    expect(t.some(x => x.key === 'order.created')).toBe(true);
  });

  it('getAvailableActions returns actions', async () => {
    const a = await service.getAvailableActions();
    expect(a.some(x => x.key === 'send_notification')).toBe(true);
  });

  it('executeWorkflow returns execution result', async () => {
    const r = await service.executeWorkflow('wf-1', { orderId: 'o-1' });
    expect(r.workflowId).toBe('wf-1');
    expect(r.executed).toBe(true);
  });
});
