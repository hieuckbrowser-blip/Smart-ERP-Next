jest.mock('@smart-erp/database', () => ({
  salaryBoards: {},
  payslips: {},
  attendanceRecords: {},
  users: {},
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((x: any) => x),
  and: jest.fn((...args: any[]) => args),
  desc: jest.fn((x: any) => x),
  sql: jest.fn((...args: any[]) => args),
}));

import { PayrollService } from '../hr/services/payroll.service';
import { NotFoundException } from '@nestjs/common';

describe('PayrollService', () => {
  let service: PayrollService;
  let mockDb: any;

  const TENANT_ID = 'tenant-1';
  const BOARD_ID = 'board-1';
  const AUTHOR_ID = 'user-1';
  const MONTH = 6;
  const YEAR = 2026;

  beforeEach(() => {
    mockDb = () => mockDb;

    mockDb.select = jest.fn(() => mockDb);
    mockDb.from = jest.fn(() => mockDb);
    mockDb.where = jest.fn(() => mockDb);
    mockDb.orderBy = jest.fn(() => mockDb);
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

    service = new (PayrollService as any)({ db: mockDb });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listBoards', () => {
    it('returns salary boards ordered by year/month descending', async () => {
      const boards = [
        { id: 'sb-2', tenantId: TENANT_ID, month: '7', year: '2026', status: 'draft' },
        { id: 'sb-1', tenantId: TENANT_ID, month: '6', year: '2026', status: 'draft' },
      ];
      (mockDb.then as jest.Mock).mockImplementation((resolve: any) => resolve(boards));

      const result = await service.listBoards(TENANT_ID);

      expect(result).toEqual(boards);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
    });

    it('returns empty array when no boards exist', async () => {
      (mockDb.then as jest.Mock).mockImplementation((resolve: any) => resolve([]));

      const result = await service.listBoards(TENANT_ID);

      expect(result).toEqual([]);
    });
  });

  describe('generateSalaryBoard', () => {
    it('creates board and calculates payslips from attendance', async () => {
      const board = {
        id: BOARD_ID, tenantId: TENANT_ID, name: `Bảng lương tháng 06/2026`,
        month: '6', year: '2026', status: 'draft', createdBy: AUTHOR_ID,
      };
      const stats = {
        rows: [
          { employee_id: 'emp-1', present_days: '20', total_ot: '10', total_late: '30' },
          { employee_id: 'emp-2', present_days: '22', total_ot: '5', total_late: '0' },
        ],
      };

      (mockDb.returning as jest.Mock).mockResolvedValue([board]);
      (mockDb.execute as jest.Mock).mockResolvedValue(stats);

      const result = await service.generateSalaryBoard(TENANT_ID, AUTHOR_ID, MONTH, YEAR);

      expect(result).toEqual(board);
      expect(mockDb.insert).toHaveBeenCalledTimes(3);
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
      expect(mockDb.update).toHaveBeenCalledTimes(1);
    });

    it('handles zero attendance records gracefully', async () => {
      const board = {
        id: BOARD_ID, tenantId: TENANT_ID, name: `Bảng lương tháng 06/2026`,
        month: '6', year: '2026', status: 'draft', createdBy: AUTHOR_ID,
      };

      (mockDb.returning as jest.Mock).mockResolvedValue([board]);
      (mockDb.execute as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await service.generateSalaryBoard(TENANT_ID, AUTHOR_ID, MONTH, YEAR);

      expect(result).toEqual(board);
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
      expect(mockDb.update).toHaveBeenCalledTimes(1);
    });

    it('generates correct payslip calculations', async () => {
      const board = {
        id: BOARD_ID, tenantId: TENANT_ID, name: `Bảng lương tháng 06/2026`,
        month: '6', year: '2026', status: 'draft', createdBy: AUTHOR_ID,
      };
      const stats = {
        rows: [
          { employee_id: 'emp-1', present_days: '22', total_ot: '0', total_late: '0' },
        ],
      };

      (mockDb.returning as jest.Mock).mockResolvedValue([board]);
      (mockDb.execute as jest.Mock).mockResolvedValue(stats);

      await service.generateSalaryBoard(TENANT_ID, AUTHOR_ID, MONTH, YEAR);

      expect(mockDb.values).toHaveBeenCalledTimes(2);
      const valuesCall = (mockDb.values as jest.Mock).mock.calls[1][0];
      expect(valuesCall.employeeId).toBe('emp-1');
      expect(valuesCall.baseSalary).toBe('10000000');
      expect(valuesCall.netSalary).toBe('10000000');
    });
  });

  describe('getPayslips', () => {
    it('returns payslips with user details', async () => {
      const payslipsData = [
        { id: 'p-1', boardId: BOARD_ID, employeeId: 'emp-1', employee_name: 'User 1', employee_email: 'u1@test.com' },
      ];
      (mockDb.execute as jest.Mock).mockResolvedValue({ rows: payslipsData });

      const result = await service.getPayslips(TENANT_ID, BOARD_ID);

      expect(result).toEqual({ rows: payslipsData });
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });

    it('returns empty rows when no payslips exist', async () => {
      (mockDb.execute as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await service.getPayslips(TENANT_ID, BOARD_ID);

      expect(result).toEqual({ rows: [] });
    });
  });

  describe('approveBoard', () => {
    it('sets status to approved and returns updated board', async () => {
      const updated = {
        id: BOARD_ID, tenantId: TENANT_ID, status: 'approved',
        name: 'Bảng lương tháng 06/2026', month: '6', year: '2026',
      };
      (mockDb.returning as jest.Mock).mockResolvedValue([updated]);

      const result = await service.approveBoard(TENANT_ID, BOARD_ID);

      expect(result).toEqual(updated);
      expect(result.status).toBe('approved');
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('throws NotFoundException when board does not exist', async () => {
      (mockDb.returning as jest.Mock).mockResolvedValue([]);

      await expect(service.approveBoard(TENANT_ID, 'nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
