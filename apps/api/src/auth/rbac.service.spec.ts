import { RbacService } from './rbac.service';

describe('RbacService', () => {
  const service = new RbacService({} as any);

  it('grants permissions assigned to the default staff role', async () => {
    await expect(service.hasPermission('tenant-1', 'user-1', 'orders:create')).resolves.toBe(true);
    await expect(service.hasPermission('tenant-1', 'user-1', 'reports:export')).resolves.toBe(false);
  });

  it('deduplicates permissions across user roles', async () => {
    const permissions = await service.getUserPermissions('tenant-1', 'user-1');

    expect(permissions).toEqual(expect.arrayContaining(['customers:view', 'orders:create', 'inventory:view']));
    expect(new Set(permissions).size).toBe(permissions.length);
  });

  it('returns default system roles for a user', async () => {
    const roles = await service.getUserRoles('tenant-1', 'user-1');

    expect(roles).toEqual([
      expect.objectContaining({
        id: 'role-staff',
        name: 'staff',
        isSystem: true,
      }),
    ]);
  });

  it('falls back to manager permissions for unknown user roles', async () => {
    const roleSpy = jest.spyOn(service as any, 'getUserRole').mockResolvedValueOnce('contractor');

    const roles = await service.getUserRoles('tenant-1', 'user-1');

    expect(roles).toEqual([
      expect.objectContaining({
        id: 'role-contractor',
        name: 'contractor',
        permissions: expect.arrayContaining(['customers:view', 'products:create']),
      }),
    ]);
    expect(roles[0].permissions).not.toContain('inventory:adjust');
    roleSpy.mockRestore();
  });

  it('creates custom roles without persisting to the database placeholder', async () => {
    const role = await service.createRole('tenant-1', {
      name: 'Store Auditor',
      permissions: ['reports:view'],
      description: 'Read-only audit role',
    });

    expect(role.id).toEqual(expect.any(String));
    expect(role).toMatchObject({
      name: 'Store Auditor',
      description: 'Read-only audit role',
      permissions: ['reports:view'],
      isSystem: false,
    });
  });

  it('lists permissions grouped by module', () => {
    const modules = service.getAllPermissions();

    expect(modules.map((module) => module.module)).toEqual(['Customers', 'Products', 'Orders', 'Inventory', 'Reports']);
    expect(modules.find((module) => module.module === 'Orders')?.permissions).toEqual(
      expect.arrayContaining([
        { key: 'orders.read', label: 'View Orders' },
        { key: 'orders.approve', label: 'Approve Orders' },
      ])
    );
  });

  it('keeps role assignment placeholders callable', async () => {
    await expect(service.assignRole('tenant-1', 'user-1', 'role-staff')).resolves.toBeUndefined();
    await expect(service.removeRole('tenant-1', 'user-1', 'role-staff')).resolves.toBeUndefined();
  });
});
