import { test, expect } from '@playwright/test';

const API = 'http://localhost:3456';
let token = '';

function h() { return { Authorization: `Bearer ${token}` }; }
function u(d: any): any { return d && d.success === true ? d.data : d; }

test.describe('Feature Smoke Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, { data: { email: 'admin@demo.vn', password: 'admin123' } });
    const body = await res.json();
    token = body.access_token || body.data?.access_token || '';
  });

  test('GET /status returns version and uptime', async ({ request }) => {
    const res = await request.get(`${API}/status`);
    const body = await res.json();
    const data = body.success === true ? body.data : body;
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('uptime');
    expect(data).toHaveProperty('dbStatus');
  });

  test('GET /settings/currency returns default currency', async ({ request }) => {
    const res = await request.get(`${API}/settings/currency`, { headers: h() });
    expect(res.ok()).toBeTruthy();
    const body = u(await res.json());
    expect(body).toHaveProperty('currency');
  });

  test('GET /exports/entities returns exportable entities', async ({ request }) => {
    const res = await request.get(`${API}/exports/entities`, { headers: h() });
    expect(res.ok()).toBeTruthy();
    const body = u(await res.json());
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      expect(body[0]).toHaveProperty('key');
      expect(body[0]).toHaveProperty('label');
    }
  });

  test('GET /activity/recent returns activity items', async ({ request }) => {
    const res = await request.get(`${API}/activity/recent`, { headers: h() });
    expect(res.ok()).toBeTruthy();
    const body = u(await res.json());
    expect(body).toBeDefined();
  });
});
