import { test, expect } from '@playwright/test';

const API = 'http://localhost:3456';
let token = '';

function h() { return { Authorization: `Bearer ${token}` }; }
function u(d: any): any { return d && d.success === true ? d.data : d; }

test.describe('Settings', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, { data: { email: 'admin@demo.vn', password: 'admin123' } });
    const body = await res.json();
    token = body.access_token || body.data?.access_token || '';
  });

  test('GET /settings/currency returns current currency', async ({ request }) => {
    const res = await request.get(`${API}/settings/currency`, { headers: h() });
    expect(res.ok()).toBeTruthy();
    const body = u(await res.json());
    expect(body).toHaveProperty('currency');
    expect(typeof body.currency).toBe('string');
  });

  test('PATCH /settings/currency updates to USD and back to VND', async ({ request }) => {
    const set = await request.patch(`${API}/settings/currency`, {
      headers: h(),
      data: { currency: 'USD' },
    });
    expect(set.ok()).toBeTruthy();
    let body = u(await set.json());
    expect(body.currency).toBe('USD');

    // Revert to VND
    const revert = await request.patch(`${API}/settings/currency`, {
      headers: h(),
      data: { currency: 'VND' },
    });
    expect(revert.ok()).toBeTruthy();
    body = u(await revert.json());
    expect(body.currency).toBe('VND');
  });
});
