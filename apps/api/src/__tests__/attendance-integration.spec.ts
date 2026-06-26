jest.mock('@smart-erp/database', () => ({
  workShifts: {},
  attendanceRecords: {},
  leaveRequests: {},
  users: {},
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((x: any) => x),
  and: jest.fn((...args: any[]) => args),
  desc: jest.fn((x: any) => x),
  sql: jest.fn((...args: any[]) => args),
  gte: jest.fn((x: any) => x),
  lte: jest.fn((x: any) => x),
  between: jest.fn((x: any) => x),
}));

import { AttendanceService } from '../hr/services/attendance.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let mockDb: any;

  const TENANT_ID = 'tenant-1';
  const EMPLOYEE_ID = 'emp-1';
  const APPROVER_ID = 'user-1';

  beforeEach(() => {
    mockDb = () => mockDb;

    mockDb.select = jest.fn(() => mockDb);
    mockDb.from = jest.fn(() => mockDb);
    mockDb.where = jest.fn(() => mockDb);
    mockDb.orderBy = jest.fn(() => mockDb);
    mockDb.limit = jest.fn(() => mockDb);
    mockDb.insert = jest.fn(() => mockDb);
    mockDb.values = jest.fn(() => mockDb);
    mockDb.update = jest.fn(() => mockDb);
    mockDb.set = jest.fn(() => mockDb);
    mockDb.delete = jest.fn(() => mockDb);
    mockDb.returning = jest.fn();
    mockDb.execute = jest.fn();
    mockDb.then = jest.fn();

    (mockDb.then as jest.Mock).mockImplementation((resolve: any) => resolve([]));
    (mockDb.returning as jest.Mock).mockReset();
    (mockDb.execute as jest.Mock).mockReset();

    service = new (AttendanceService as any)({ db: mockDb });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Work Shifts ──────────────────────────────────────────────────────────────

  describe('listShifts', () => {
    it('returns active shifts ordered by startTime', async () => {
      const shifts = [
        { id: 's-1', name: 'Morning', startTime: '06:00', isActive: true },
        { id: 's-2', name: 'Afternoon', startTime: '13:00', isActive: true },
      ];
      (mockDb.then as jest.Mock).mockImplementation((resolve: any) => resolve(shifts));

      const result = await service.listShifts(TENANT_ID);

      expect(result).toEqual(shifts);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
    });

    it('returns empty array when no active shifts exist', async () => {
      (mockDb.then as jest.Mock).mockImplementation((resolve: any) => resolve([]));

      const result = await service.listShifts(TENANT_ID);

      expect(result).toEqual([]);
    });
  });

  describe('createShift', () => {
    const dto = {
      name: 'Morning',
      code: 'MORN',
      startTime: '06:00',
      endTime: '14:00',
      workHours: 8,
    };

    it('creates and returns a new shift with defaults', async () => {
      const expected = { id: 's-1', ...dto, workHours: '8', breakMinutes: 60, color: '#3b82f6', tenantId: TENANT_ID };
      (mockDb.returning as jest.Mock).mockResolvedValue([expected]);

      const result = await service.createShift(TENANT_ID, dto);

      expect(result).toEqual(expected);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalled();
    });

    it('accepts custom breakMinutes and color', async () => {
      const custom = { ...dto, breakMinutes: 30, color: '#ff0000' };
      const expected = { id: 's-2', ...custom, workHours: '8', tenantId: TENANT_ID };
      (mockDb.returning as jest.Mock).mockResolvedValue([expected]);

      const result = await service.createShift(TENANT_ID, custom);

      expect(result.breakMinutes).toBe(30);
      expect(result.color).toBe('#ff0000');
    });
  });

  // ─── Check In / Check Out ────────────────────────────────────────────────────

  describe('checkIn', () => {
    it('creates a new check-in record when none exists for today', async () => {
      (mockDb.then as jest.Mock).mockImplementation((resolve: any) => resolve([]));
      const expected = { id: 'r-1', tenantId: TENANT_ID, employeeId: EMPLOYEE_ID, status: 'present' };
      (mockDb.returning as jest.Mock).mockResolvedValue([expected]);

      const result = await service.checkIn(TENANT_ID, EMPLOYEE_ID, {});

      expect(result).toEqual(expected);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('updates existing record if already has a row for today without checkInAt', async () => {
      const existing = { id: 'r-1', tenantId: TENANT_ID, employeeId: EMPLOYEE_ID, workDate: expect.any(String) };
      (mockDb.then as jest.Mock).mockImplementation((resolve: any) => resolve([existing]));
      const updated = { ...existing, status: 'present' };
      (mockDb.returning as jest.Mock).mockResolvedValue([updated]);

      const result = await service.checkIn(TENANT_ID, EMPLOYEE_ID, {});

      expect(result).toEqual(updated);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('throws ConflictException when already checked in', async () => {
      const existing = { id: 'r-1', checkInAt: new Date().toISOString() };
      (mockDb.then as jest.Mock).mockImplementation((resolve: any) => resolve([existing]));

      await expect(service.checkIn(TENANT_ID, EMPLOYEE_ID, {}))
        .rejects.toThrow(ConflictException);
    });

    it('marks status as late when past shift grace period', async () => {
      (mockDb.then as jest.Mock)
        .mockImplementationOnce((resolve: any) => resolve([]))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 's-1', startTime: '00:01' }]));
      const expected = { id: 'r-1', status: 'late', lateMinutes: expect.any(Number) };
      (mockDb.returning as jest.Mock).mockResolvedValue([expected]);

      const result = await service.checkIn(TENANT_ID, EMPLOYEE_ID, { shiftId: 's-1' });

      expect(result.status).toBe('late');
    });

    it('stores geo-location when provided', async () => {
      (mockDb.then as jest.Mock).mockImplementation((resolve: any) => resolve([]));
      const expected = { id: 'r-1', status: 'present', checkInLatitude: '10.5', checkInLongitude: '106.5' };
      (mockDb.returning as jest.Mock).mockResolvedValue([expected]);

      const result = await service.checkIn(TENANT_ID, EMPLOYEE_ID, { latitude: 10.5, longitude: 106.5 });

      expect(result.checkInLatitude).toBe('10.5');
      expect(result.checkInLongitude).toBe('106.5');
    });
  });

  describe('checkOut', () => {
    it('throws NotFoundException when no check-in found for today', async () => {
      (mockDb.then as jest.Mock).mockImplementation((resolve: any) => resolve([]));

      await expect(service.checkOut(TENANT_ID, EMPLOYEE_ID, {}))
        .rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when already checked out', async () => {
      (mockDb.then as jest.Mock).mockImplementation((resolve: any) => resolve([{ id: 'r-1', checkOutAt: new Date().toISOString() }]));

      await expect(service.checkOut(TENANT_ID, EMPLOYEE_ID, {}))
        .rejects.toThrow(ConflictException);
    });

    it('completes check-out and calculates hours', async () => {
      const checkInTime = new Date();
      checkInTime.setHours(checkInTime.getHours() - 8);
      const record = { id: 'r-1', checkInAt: checkInTime.toISOString(), shiftId: null };
      (mockDb.then as jest.Mock).mockImplementation((resolve: any) => resolve([record]));
      (mockDb.returning as jest.Mock).mockResolvedValue([{ id: 'r-1', checkOutAt: new Date(), actualHours: (8).toString(), overtimeHours: '0' }]);

      const result = await service.checkOut(TENANT_ID, EMPLOYEE_ID, {});

      expect(result.actualHours).toBeDefined();
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('calculates overtime when shift has workHours defined', async () => {
      const checkInTime = new Date();
      checkInTime.setHours(checkInTime.getHours() - 10);
      const record = { id: 'r-1', checkInAt: checkInTime.toISOString(), shiftId: 's-1' };
      (mockDb.then as jest.Mock)
        .mockImplementationOnce((resolve: any) => resolve([record]))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 's-1', workHours: '8' }]));
      const updated = { id: 'r-1', actualHours: '10', overtimeHours: '2' };
      (mockDb.returning as jest.Mock).mockResolvedValue([updated]);

      const result = await service.checkOut(TENANT_ID, EMPLOYEE_ID, {});

      expect(result.overtimeHours).toBeDefined();
    });
  });

  describe('getTodayStatus', () => {
    it('returns today record when checked in', async () => {
      const record = { id: 'r-1', tenantId: TENANT_ID, employeeId: EMPLOYEE_ID, status: 'present' };
      (mockDb.then as jest.Mock).mockImplementation((resolve: any) => resolve([record]));

      const result = await service.getTodayStatus(TENANT_ID, EMPLOYEE_ID);

      expect(result).toEqual(record);
    });

    it('returns default status when not checked in', async () => {
      const result = await service.getTodayStatus(TENANT_ID, EMPLOYEE_ID);

      expect(result.status).toBe('not_checked_in');
      expect(result.workDate).toBeDefined();
    });
  });

  // ─── Records ──────────────────────────────────────────────────────────────────

  describe('listRecords', () => {
    it('returns records with default pagination when no filters given', async () => {
      const rows = [{ id: 'r-1', employee_name: 'User 1' }];
      (mockDb.execute as jest.Mock).mockResolvedValue(rows);

      const result = await service.listRecords(TENANT_ID);

      expect(result).toEqual(rows);
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });

    it('applies employeeId filter when provided', async () => {
      (mockDb.execute as jest.Mock).mockResolvedValue([]);

      await service.listRecords(TENANT_ID, { employeeId: EMPLOYEE_ID });

      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });

    it('applies date range and status filters', async () => {
      (mockDb.execute as jest.Mock).mockResolvedValue([]);

      await service.listRecords(TENANT_ID, {
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        status: 'present',
      });

      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMonthlySummary', () => {
    it('returns monthly aggregated stats', async () => {
      const stats = [{
        present_days: 20, late_days: 2, absent_days: 1,
        half_days: 0, leave_days: 1,
        total_hours: '160', total_overtime: '10', total_late_minutes: 45,
      }];
      (mockDb.execute as jest.Mock).mockResolvedValue(stats);

      const result = await service.getMonthlySummary(TENANT_ID, 2026, 6);

      expect(result.present_days).toBe(20);
      expect(result.late_days).toBe(2);
      expect(result.total_hours).toBe('160');
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });

    it('filters by employee when employeeId is provided', async () => {
      const stats = [{ present_days: 22, late_days: 0, absent_days: 0, half_days: 0, leave_days: 0, total_hours: '176', total_overtime: '0', total_late_minutes: 0 }];
      (mockDb.execute as jest.Mock).mockResolvedValue(stats);

      const result = await service.getMonthlySummary(TENANT_ID, 2026, 6, EMPLOYEE_ID);

      expect(result.present_days).toBe(22);
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });

    it('returns empty object when no data', async () => {
      (mockDb.execute as jest.Mock).mockResolvedValue([]);

      const result = await service.getMonthlySummary(TENANT_ID, 2026, 6);

      expect(result).toEqual({});
    });
  });

  // ─── Leave Requests ──────────────────────────────────────────────────────────

  describe('createLeaveRequest', () => {
    const dto = {
      leaveType: 'annual',
      startDate: '2026-07-01',
      endDate: '2026-07-03',
      totalDays: 3,
      reason: 'Vacation',
    };

    it('creates and returns a pending leave request', async () => {
      const expected = {
        id: 'lr-1', tenantId: TENANT_ID, employeeId: EMPLOYEE_ID,
        leaveType: 'annual', startDate: '2026-07-01', endDate: '2026-07-03',
        totalDays: '3', reason: 'Vacation', status: 'pending',
      };
      (mockDb.returning as jest.Mock).mockResolvedValue([expected]);

      const result = await service.createLeaveRequest(TENANT_ID, EMPLOYEE_ID, dto);

      expect(result).toEqual(expected);
      expect(result.status).toBe('pending');
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('approveLeave', () => {
    it('sets status to approved and returns updated request', async () => {
      const updated = {
        id: 'lr-1', tenantId: TENANT_ID, status: 'approved',
        approvedBy: APPROVER_ID, approvedAt: expect.any(Date),
      };
      (mockDb.returning as jest.Mock).mockResolvedValue([updated]);

      const result = await service.approveLeave(TENANT_ID, 'lr-1', APPROVER_ID);

      expect(result).toEqual(updated);
      expect(result.status).toBe('approved');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('returns undefined when request does not exist', async () => {
      (mockDb.returning as jest.Mock).mockResolvedValue([]);

      const result = await service.approveLeave(TENANT_ID, 'nonexistent', APPROVER_ID);

      expect(result).toBeUndefined();
    });
  });

  describe('rejectLeave', () => {
    it('sets status to rejected with reason', async () => {
      const reason = 'Insufficient documentation';
      const updated = {
        id: 'lr-1', tenantId: TENANT_ID, status: 'rejected',
        approvedBy: APPROVER_ID, rejectionReason: reason,
      };
      (mockDb.returning as jest.Mock).mockResolvedValue([updated]);

      const result = await service.rejectLeave(TENANT_ID, 'lr-1', APPROVER_ID, reason);

      expect(result).toEqual(updated);
      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe(reason);
    });

    it('returns undefined when request does not exist', async () => {
      (mockDb.returning as jest.Mock).mockResolvedValue([]);

      const result = await service.rejectLeave(TENANT_ID, 'nonexistent', APPROVER_ID, 'No reason');

      expect(result).toBeUndefined();
    });
  });

  describe('listLeaveRequests', () => {
    it('returns all leave requests for tenant', async () => {
      const requests = [{ id: 'lr-1', tenantId: TENANT_ID, employee_name: 'User 1' }];
      (mockDb.execute as jest.Mock).mockResolvedValue(requests);

      const result = await service.listLeaveRequests(TENANT_ID);

      expect(result).toEqual(requests);
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });

    it('filters by status when provided', async () => {
      (mockDb.execute as jest.Mock).mockResolvedValue([]);

      const result = await service.listLeaveRequests(TENANT_ID, 'pending');

      expect(result).toEqual([]);
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });

    it('filters by employee when provided', async () => {
      (mockDb.execute as jest.Mock).mockResolvedValue([]);

      const result = await service.listLeaveRequests(TENANT_ID, undefined, EMPLOYEE_ID);

      expect(result).toEqual([]);
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });
  });
});
