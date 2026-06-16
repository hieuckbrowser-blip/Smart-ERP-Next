import { HrController } from './hr.controller';
import { AttendanceController } from './attendance.controller';
import { PayrollController } from './payroll.controller';
import { PerformanceController } from './performance.controller';

function mockReq(overrides = {}) {
  return { user: { tenantId: 't1', sub: 'u1' }, ...overrides };
}

describe('HrController', () => {
  let svc: any;
  let ctrl: HrController;

  beforeEach(() => {
    svc = {
      createEmployee: jest.fn(),
      findAllEmployees: jest.fn(),
      findOneEmployee: jest.fn(),
      updateEmployee: jest.fn(),
      removeEmployee: jest.fn(),
      processPayroll: jest.fn(),
      getPayrolls: jest.fn(),
    };
    ctrl = new HrController(svc);
  });

  it('create delegates to service', async () => {
    svc.createEmployee.mockResolvedValue({ id: 'e1' });
    const r = await ctrl.create(mockReq(), { name: 'A' } as any);
    expect(svc.createEmployee).toHaveBeenCalledWith('t1', { name: 'A' });
    expect(r).toEqual({ id: 'e1' });
  });

  it('findAll delegates to service', async () => {
    svc.findAllEmployees.mockResolvedValue([]);
    await ctrl.findAll(mockReq(), '1', '20', 'test');
    expect(svc.findAllEmployees).toHaveBeenCalledWith('t1', { page: 1, limit: 20, search: 'test' });
  });

  it('findOne delegates to service', async () => {
    svc.findOneEmployee.mockResolvedValue({ id: 'e1' });
    const r = await ctrl.findOne(mockReq(), 'e1');
    expect(svc.findOneEmployee).toHaveBeenCalledWith('t1', 'e1');
    expect(r).toEqual({ id: 'e1' });
  });

  it('update delegates to service', async () => {
    svc.updateEmployee.mockResolvedValue({ id: 'e1' });
    await ctrl.update(mockReq(), 'e1', { name: 'B' } as any);
    expect(svc.updateEmployee).toHaveBeenCalledWith('t1', 'e1', { name: 'B' });
  });

  it('remove delegates to service', async () => {
    svc.removeEmployee.mockResolvedValue({ id: 'e1' });
    const r = await ctrl.remove(mockReq(), 'e1');
    expect(svc.removeEmployee).toHaveBeenCalledWith('t1', 'e1');
    expect(r).toEqual({ id: 'e1' });
  });

  it('processPayroll delegates to service', async () => {
    svc.processPayroll.mockResolvedValue({ id: 'p1' });
    const r = await ctrl.processPayroll(mockReq());
    expect(svc.processPayroll).toHaveBeenCalledWith('t1');
    expect(r).toEqual({ id: 'p1' });
  });

  it('getPayrolls delegates to service', async () => {
    svc.getPayrolls.mockResolvedValue([]);
    await ctrl.getPayrolls(mockReq(), '1', '10');
    expect(svc.getPayrolls).toHaveBeenCalledWith('t1', { page: 1, limit: 10 });
  });
});

describe('AttendanceController', () => {
  let svc: any;
  let ctrl: AttendanceController;

  beforeEach(() => {
    svc = {
      listShifts: jest.fn(),
      createShift: jest.fn(),
      checkIn: jest.fn(),
      checkOut: jest.fn(),
      getTodayStatus: jest.fn(),
      listRecords: jest.fn(),
      getMonthlySummary: jest.fn(),
      createLeaveRequest: jest.fn(),
      listLeaveRequests: jest.fn(),
      approveLeave: jest.fn(),
      rejectLeave: jest.fn(),
    };
    ctrl = new AttendanceController(svc);
  });

  it('listShifts delegates to service', async () => {
    svc.listShifts.mockResolvedValue([]);
    await ctrl.listShifts(mockReq());
    expect(svc.listShifts).toHaveBeenCalledWith('t1');
  });

  it('createShift delegates to service', async () => {
    const body = { name: 'Morning', code: 'M', startTime: '08:00', endTime: '17:00', workHours: 8 };
    svc.createShift.mockResolvedValue({ id: 's1' });
    await ctrl.createShift(mockReq(), body);
    expect(svc.createShift).toHaveBeenCalledWith('t1', body);
  });

  it('checkIn delegates to service', async () => {
    svc.checkIn.mockResolvedValue({ id: 'a1' });
    await ctrl.checkIn(mockReq(), {});
    expect(svc.checkIn).toHaveBeenCalledWith('t1', 'u1', {});
  });

  it('checkOut delegates to service', async () => {
    svc.checkOut.mockResolvedValue({ id: 'a1' });
    await ctrl.checkOut(mockReq(), {});
    expect(svc.checkOut).toHaveBeenCalledWith('t1', 'u1', {});
  });

  it('getToday delegates to service', async () => {
    svc.getTodayStatus.mockResolvedValue({ status: 'checked_in' });
    const r = await ctrl.getToday(mockReq());
    expect(svc.getTodayStatus).toHaveBeenCalledWith('t1', 'u1');
    expect(r).toEqual({ status: 'checked_in' });
  });

  it('getEmployeeToday delegates to service', async () => {
    svc.getTodayStatus.mockResolvedValue({ status: 'absent' });
    await ctrl.getEmployeeToday(mockReq(), 'e2');
    expect(svc.getTodayStatus).toHaveBeenCalledWith('t1', 'e2');
  });

  it('listRecords delegates to service', async () => {
    svc.listRecords.mockResolvedValue({ items: [], total: 0 });
    await ctrl.listRecords(mockReq(), 'e1', '2026-01-01', '2026-01-31', 'present', '1');
    expect(svc.listRecords).toHaveBeenCalledWith('t1', { employeeId: 'e1', startDate: '2026-01-01', endDate: '2026-01-31', status: 'present', page: 1 });
  });

  it('getMonthlySummary delegates to service', async () => {
    svc.getMonthlySummary.mockResolvedValue({ total: 22 });
    await ctrl.getMonthlySummary(mockReq(), '2026', '3', 'e1');
    expect(svc.getMonthlySummary).toHaveBeenCalledWith('t1', 2026, 3, 'e1');
  });

  it('createLeave delegates to service', async () => {
    const body = { leaveType: 'sick', startDate: '2026-03-01', endDate: '2026-03-02', totalDays: 2 };
    svc.createLeaveRequest.mockResolvedValue({ id: 'l1' });
    await ctrl.createLeave(mockReq(), body);
    expect(svc.createLeaveRequest).toHaveBeenCalledWith('t1', 'u1', body);
  });

  it('listLeave delegates to service', async () => {
    svc.listLeaveRequests.mockResolvedValue([]);
    await ctrl.listLeave(mockReq(), 'pending');
    expect(svc.listLeaveRequests).toHaveBeenCalledWith('t1', 'pending');
  });

  it('approveLeave delegates to service', async () => {
    svc.approveLeave.mockResolvedValue({ id: 'l1', status: 'approved' });
    const r = await ctrl.approveLeave(mockReq(), 'l1');
    expect(svc.approveLeave).toHaveBeenCalledWith('t1', 'l1', 'u1');
    expect(r).toEqual({ id: 'l1', status: 'approved' });
  });

  it('rejectLeave delegates to service', async () => {
    svc.rejectLeave.mockResolvedValue({ id: 'l1', status: 'rejected' });
    const r = await ctrl.rejectLeave(mockReq(), 'l1', { reason: 'No docs' });
    expect(svc.rejectLeave).toHaveBeenCalledWith('t1', 'l1', 'u1', 'No docs');
    expect(r).toEqual({ id: 'l1', status: 'rejected' });
  });
});

describe('PayrollController', () => {
  let svc: any;
  let ctrl: PayrollController;

  beforeEach(() => {
    svc = { listBoards: jest.fn(), generateSalaryBoard: jest.fn(), getPayslips: jest.fn(), approveBoard: jest.fn() };
    ctrl = new PayrollController(svc);
  });

  it('listBoards delegates to service', async () => {
    svc.listBoards.mockResolvedValue([]);
    await ctrl.listBoards(mockReq());
    expect(svc.listBoards).toHaveBeenCalledWith('t1');
  });

  it('generateBoard delegates to service', async () => {
    svc.generateSalaryBoard.mockResolvedValue({ id: 'b1' });
    const r = await ctrl.generateBoard(mockReq(), { month: 3, year: 2026 });
    expect(svc.generateSalaryBoard).toHaveBeenCalledWith('t1', 'u1', 3, 2026);
    expect(r).toEqual({ id: 'b1' });
  });

  it('getPayslips delegates to service', async () => {
    svc.getPayslips.mockResolvedValue([]);
    await ctrl.getPayslips(mockReq(), 'b1');
    expect(svc.getPayslips).toHaveBeenCalledWith('t1', 'b1');
  });

  it('approveBoard delegates to service', async () => {
    svc.approveBoard.mockResolvedValue({ id: 'b1', status: 'approved' });
    const r = await ctrl.approveBoard(mockReq(), 'b1');
    expect(svc.approveBoard).toHaveBeenCalledWith('t1', 'b1');
    expect(r).toEqual({ id: 'b1', status: 'approved' });
  });
});

describe('PerformanceController', () => {
  let svc: any;
  let ctrl: PerformanceController;

  beforeEach(() => {
    svc = { getEmployeeKPIs: jest.fn(), updateKpiProgress: jest.fn(), createPerformanceReview: jest.fn() };
    ctrl = new PerformanceController(svc);
  });

  it('getMyKPIs delegates to service', async () => {
    svc.getEmployeeKPIs.mockResolvedValue([]);
    await ctrl.getMyKPIs(mockReq(), '2026-Q1');
    expect(svc.getEmployeeKPIs).toHaveBeenCalledWith('t1', 'u1', '2026-Q1');
  });

  it('getEmployeeKPIs delegates to service', async () => {
    svc.getEmployeeKPIs.mockResolvedValue([]);
    await ctrl.getEmployeeKPIs(mockReq(), 'e2', '2026-Q1');
    expect(svc.getEmployeeKPIs).toHaveBeenCalledWith('t1', 'e2', '2026-Q1');
  });

  it('updateProgress delegates to service', async () => {
    svc.updateKpiProgress.mockResolvedValue({ id: 'k1' });
    const r = await ctrl.updateProgress(mockReq(), 'k1', { actualValue: 85 });
    expect(svc.updateKpiProgress).toHaveBeenCalledWith('t1', 'u1', 'k1', 85);
    expect(r).toEqual({ id: 'k1' });
  });

  it('createReview delegates to service', async () => {
    svc.createPerformanceReview.mockResolvedValue({ id: 'r1' });
    const r = await ctrl.createReview(mockReq(), { employeeId: 'e1' });
    expect(svc.createPerformanceReview).toHaveBeenCalledWith('t1', { employeeId: 'e1' });
    expect(r).toEqual({ id: 'r1' });
  });
});
