jest.mock('@smart-erp/database', () => {
  const db: any = () => db;
  const chainFn = jest.fn(() => db);
  db.select = chainFn;
  db.from = chainFn;
  db.where = chainFn;
  db.insert = chainFn;
  db.values = chainFn;
  db.update = chainFn;
  db.set = chainFn;
  db.delete = chainFn;
  db.returning = jest.fn();
  db.then = jest.fn();
  return { db };
});
jest.mock('@smart-erp/database/schema', () => ({
  roles: {}, rolePermissions: {}, userRoles: {}, tenants: {}, users: {},
}));
jest.mock('@smart-erp/database/drizzle', () => ({
  eq: jest.fn(), and: jest.fn(), sql: jest.fn(),
}));

import { RbacService } from '../auth/rbac.service';
import { PERMISSIONS, DEFAULT_ROLES } from '../auth/permissions';

describe('RbacService — roles CRUD & permissions', () => {
  let service: RbacService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RbacService({} as any);
  });

  describe('getRoles', () => {
    it('returns default roles (admin, manager, staff) seeded on first call', async () => {
      const roles = await service.getRoles('tenant-1');

      expect(roles).toHaveLength(3);
      const names = roles.map((r) => r.name);
      expect(names).toEqual(expect.arrayContaining(['admin', 'manager', 'staff']));
      roles.forEach((r) => expect(r.isSystem).toBe(true));
    });
  });

  describe('createRole', () => {
    it('creates a custom role with specified permissions', async () => {
      await service.getRoles('tenant-1');

      const role = await service.createRole('tenant-1', {
        name: 'Custom Role',
        permissions: ['products:view', 'products:create'],
        description: 'A custom role',
      });

      expect(role.id).toBeTruthy();
      expect(role.name).toBe('Custom Role');
      expect(role.permissions).toEqual(['products:view', 'products:create']);
      expect(role.description).toBe('A custom role');
      expect(role.isSystem).toBe(false);

      const all = await service.getRoles('tenant-1');
      expect(all).toHaveLength(4);
      expect(all.find((r) => r.id === role.id)).toBeDefined();
    });
  });

  describe('updateRole', () => {
    it('updates the permissions (and optional name / description) of a custom role', async () => {
      await service.getRoles('tenant-1');
      const role = await service.createRole('tenant-1', {
        name: 'Temp', permissions: ['products:view'],
      });

      const updated = await service.updateRole('tenant-1', role.id, {
        name: 'Updated',
        permissions: ['products:view', 'orders:view'],
        description: 'Updated desc',
      });

      expect(updated.name).toBe('Updated');
      expect(updated.permissions).toEqual(['products:view', 'orders:view']);
      expect(updated.description).toBe('Updated desc');

      const stored = (await service.getRoles('tenant-1')).find((r) => r.id === role.id);
      expect(stored?.permissions).toEqual(['products:view', 'orders:view']);
    });

    it('allows partial update (only permissions)', async () => {
      await service.getRoles('tenant-1');
      const role = await service.createRole('tenant-1', {
        name: 'Partial', permissions: ['products:view'], description: 'Original',
      });

      const updated = await service.updateRole('tenant-1', role.id, {
        permissions: ['products:view', 'products:create'],
      });

      expect(updated.name).toBe('Partial');
      expect(updated.permissions).toEqual(['products:view', 'products:create']);
      expect(updated.description).toBe('Original');
    });
  });

  describe('deleteRole', () => {
    it('deletes a custom role', async () => {
      await service.getRoles('tenant-1');
      const role = await service.createRole('tenant-1', {
        name: 'Temp', permissions: ['products:view'],
      });

      await service.deleteRole('tenant-1', role.id);

      const roles = await service.getRoles('tenant-1');
      expect(roles.find((r) => r.id === role.id)).toBeUndefined();
    });

    it('throws when trying to delete a system role', async () => {
      const roles = await service.getRoles('tenant-1');
      const adminRole = roles.find((r) => r.name === 'admin')!;

      await expect(service.deleteRole('tenant-1', adminRole.id))
        .rejects.toThrow('Cannot delete system roles');
    });

    it('throws when role does not exist', async () => {
      await expect(service.deleteRole('tenant-1', 'non-existent'))
        .rejects.toThrow('Role not found');
    });
  });

  describe('seedDefaultRoles', () => {
    it('creates admin, manager, and staff roles with correct permissions', async () => {
      const roles = await service.seedDefaultRoles('tenant-2');

      expect(roles).toHaveLength(3);
      const admin = roles.find((r) => r.name === 'admin')!;
      const manager = roles.find((r) => r.name === 'manager')!;
      const staff = roles.find((r) => r.name === 'staff')!;

      expect(admin.isSystem).toBe(true);
      expect(admin.permissions).toEqual(DEFAULT_ROLES.admin);

      expect(manager.isSystem).toBe(true);
      expect(manager.permissions).toEqual(DEFAULT_ROLES.manager);

      expect(staff.isSystem).toBe(true);
      expect(staff.permissions).toEqual(DEFAULT_ROLES.staff);
    });
  });

  describe('getPermissions', () => {
    it('returns all available permissions grouped by module', () => {
      const result = service.getPermissions();

      const moduleNames = result.map((m) => m.module);
      expect(moduleNames).toEqual(expect.arrayContaining(Object.keys(PERMISSIONS)));

      const products = result.find((m) => m.module === 'products');
      expect(products?.permissions).toEqual(
        expect.arrayContaining(['products:view', 'products:create', 'products:edit', 'products:delete']),
      );
    });
  });
});

describe('RbacController delegation', () => {
  it('forwards calls with correct tenant-scoped arguments', () => {
    const { RbacController } = require('../auth/rbac.controller');
    const mockService = {
      getRoles: jest.fn().mockResolvedValue([]),
      createRole: jest.fn().mockResolvedValue({}),
      updateRole: jest.fn().mockResolvedValue({}),
      deleteRole: jest.fn().mockResolvedValue(undefined),
      getPermissions: jest.fn().mockReturnValue([]),
    };
    const controller = new RbacController(mockService);
    const req = { user: { tenantId: 'tenant-x', sub: 'user-1' } };

    controller.getRoles(req);
    expect(mockService.getRoles).toHaveBeenCalledWith('tenant-x');

    controller.createRole(req, { name: 'X', permissions: ['a:b'] });
    expect(mockService.createRole).toHaveBeenCalledWith('tenant-x', { name: 'X', permissions: ['a:b'] });

    controller.updateRole(req, 'role-1', { name: 'Y' });
    expect(mockService.updateRole).toHaveBeenCalledWith('tenant-x', 'role-1', { name: 'Y' });

    controller.deleteRole(req, 'role-1');
    expect(mockService.deleteRole).toHaveBeenCalledWith('tenant-x', 'role-1');

    controller.getPermissions();
    expect(mockService.getPermissions).toHaveBeenCalledWith();
  });
});
