const mockAxios = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: mockAxios,
}));

import crypto from 'crypto';
import { ShopeeClient } from '../ecommerce/shopee.client';

describe('ShopeeClient integration', () => {
  let client: ShopeeClient;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1770000000000);
    client = new ShopeeClient({
      partnerId: '123',
      partnerKey: 'test-key',
      shopId: '456',
      accessToken: 'test-token',
      apiUrl: 'https://shopee.test',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getProducts', () => {
    it('returns mapped products with pagination info', async () => {
      mockAxios.mockResolvedValueOnce({
        data: {
          response: {
            item: [
              {
                item_id: 1001,
                item_name: 'Áo thun nam',
                item_sku: 'SKU-001',
                price_info: [{ original_price: 150000, current_price: 120000 }],
                stock_info: [{ current_stock: 50 }],
                image: { image_url_list: ['https://img.test/a.jpg'] },
                item_status: 'NORMAL',
                create_time: 1700000000,
                update_time: 1700001000,
              },
            ],
            has_next_page: true,
            total_count: 25,
          },
        },
      });

      const result = await client.getProducts(1, 50);
      expect(result.products).toHaveLength(1);
      expect(result.products[0]).toMatchObject({
        id: '1001',
        name: 'Áo thun nam',
        sku: 'SKU-001',
        price: 120000,
        stock: 50,
        status: 'active',
      });
      expect(result.pagination).toEqual({ hasNext: true, total: 25, page: 1, pageSize: 50 });
    });

    it('uses offset from pagination parameter', async () => {
      mockAxios.mockResolvedValueOnce({ data: { response: { item: [], has_next_page: false, total_count: 0 } } });

      await client.getProducts(3, 10, 25);
      expect(mockAxios.mock.calls[0][0].data.pagination.offset).toBe(25);
    });

    it('handles fallback defaults when fields are missing', async () => {
      mockAxios.mockResolvedValueOnce({
        data: {
          response: {
            item: [
              {
                item_id: 1002,
                item_name: 'Quần jean',
                item_sku: '',
                price_info: [{ original_price: 200000 }],
                stock_info: [{}],
                item_status: 'BANNED',
                create_time: 1700000000,
                update_time: 1700001000,
              },
            ],
            has_next_page: false,
          },
        },
      });

      const result = await client.getProducts();
      expect(result.products[0]).toMatchObject({
        price: 200000,
        stock: 0,
        images: [],
        status: 'inactive',
        sku: '1002',
      });
    });
  });

  describe('getProductDetail', () => {
    it('returns mapped product detail', async () => {
      mockAxios.mockResolvedValueOnce({
        data: {
          response: {
            item_list: [{
              item_id: 1001,
              item_name: 'Áo thun nam',
              item_sku: 'SKU-001',
              description: 'Chất liệu cotton',
              image: { image_url_list: ['https://img.test/a.jpg'] },
              price_info: [{ current_price: 120000 }],
              stock_info: [{ current_stock: 50 }],
              item_status: 'NORMAL',
              weight: 0.3,
              category_id: 123,
              brand: { brand_name: 'BrandX' },
            }],
          },
        },
      });

      const result = await client.getProductDetail(1001);
      expect(result).toMatchObject({
        id: '1001',
        name: 'Áo thun nam',
        sku: 'SKU-001',
        price: 120000,
        stock: 50,
        status: 'NORMAL',
        weight: 0.3,
        categoryId: '123',
        brand: 'BrandX',
      });
    });

    it('throws when product is not found', async () => {
      mockAxios.mockResolvedValueOnce({ data: { response: { item_list: [] } } });
      await expect(client.getProductDetail(9999)).rejects.toThrow('Product 9999 not found on Shopee');
    });
  });

  describe('updateStock', () => {
    it('updates stock for single item', async () => {
      mockAxios.mockResolvedValueOnce({ data: { response: { success: true } } });
      const result = await client.updateStock(1001, 75);
      expect(result).toEqual({ success: true });
    });
  });

  describe('batchUpdateStock', () => {
    it('updates stock for multiple items', async () => {
      mockAxios.mockResolvedValueOnce({ data: { response: { success: true } } });

      const items = [{ itemId: 1001, stock: 50 }, { itemId: 1002, stock: 30 }];
      const result = await client.batchUpdateStock(items);
      expect(result).toEqual({ success: true });
      expect(mockAxios.mock.calls[0][0].data.stock_list).toEqual([
        { item_id: 1001, stock: 50 },
        { item_id: 1002, stock: 30 },
      ]);
    });
  });

  describe('getOrders', () => {
    it('returns orders with pagination when since is provided', async () => {
      mockAxios.mockResolvedValueOnce({
        data: {
          response: {
            order_list: [{
              order_sn: 'SN-001',
              order_status: 'READY_TO_SHIP',
              create_time: 1700000000,
              update_time: 1700001000,
              buyer_username: 'buyer1',
              recipient_address: { name: 'Nguyen Van A', phone: '0900', full_address: 'Hanoi' },
              total_amount: 250000,
              currency: 'VND',
              payment_method: 'COD',
            }],
            more: true,
            next_offset: 50,
          },
        },
      });

      const result = await client.getOrders('2026-05-01', 1, 50);
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0]).toMatchObject({
        orderSn: 'SN-001',
        status: 'confirmed',
        totalAmount: 250000,
        currency: 'VND',
      });
      expect(result.pagination).toEqual({ hasMore: true, nextOffset: 50, page: 1, pageSize: 50 });
    });

    it('uses default 7-day window when since is omitted', async () => {
      mockAxios.mockResolvedValueOnce({ data: { response: { order_list: [], more: false } } });
      await client.getOrders();
      expect(mockAxios.mock.calls[0][0].data.time_from).toBe(1769395200);
    });

    it('returns empty orders list', async () => {
      mockAxios.mockResolvedValueOnce({ data: { response: { order_list: [], more: false } } });
      const result = await client.getOrders();
      expect(result.orders).toEqual([]);
      expect(result.pagination.hasMore).toBe(false);
    });
  });

  describe('getOrderDetail', () => {
    it('returns order detail with items', async () => {
      mockAxios.mockResolvedValueOnce({
        data: {
          response: {
            order_sn: 'SN-001',
            order_status: 'COMPLETED',
            create_time: 1700000000,
            item_list: [
              { item_id: 1001, item_name: 'Áo thun', item_sku: 'SKU-001', model_name: 'M', original_price: 100000, discounted_price: 90000, quantity: 2 },
            ],
          },
        },
      });

      const result = await client.getOrderDetail('SN-001');
      expect(result).toMatchObject({
        orderSn: 'SN-001',
        status: 'delivered',
        items: [expect.objectContaining({ itemId: '1001', price: 90000, quantity: 2 })],
      });
    });

    it('throws when order is not found', async () => {
      jest.spyOn(client as any, 'request').mockResolvedValueOnce(null);
      await expect(client.getOrderDetail('SN-MISSING')).rejects.toThrow('Order SN-MISSING not found on Shopee');
    });
  });

  describe('getOrderItems', () => {
    it('returns items from order detail', async () => {
      mockAxios.mockResolvedValueOnce({
        data: {
          response: {
            order_sn: 'SN-002',
            order_status: 'SHIPPED',
            create_time: 1700000000,
            item_list: [
              { item_id: 1002, item_name: 'Quần jean', item_sku: 'SKU-002', model_name: 'L', original_price: 200000, discounted_price: 0, quantity: 1 },
            ],
          },
        },
      });

      const result = await client.getOrderItems('SN-002');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ itemId: '1002', sku: 'SKU-002', price: 200000 });
    });
  });

  describe('refreshAccessToken', () => {
    it('refreshes token and updates config', async () => {
      mockAxios.mockResolvedValueOnce({
        data: {
          response: {
            access_token: 'new-token-abc',
            refresh_token: 'new-refresh-xyz',
            expire_in: 7200,
          },
        },
      });

      const result = await client.refreshAccessToken('old-refresh');
      expect(result).toMatchObject({
        access_token: 'new-token-abc',
        refresh_token: 'new-refresh-xyz',
        expire_in: 7200,
      });
      expect((client as any).config.accessToken).toBe('new-token-abc');
    });
  });

  describe('verifyWebhook', () => {
    it('returns true for valid signature', () => {
      const payload = '{"order_sn":"SN-001"}';
      const signature = crypto.createHmac('sha256', 'test-key').update(payload).digest('hex');
      expect(client.verifyWebhook(payload, signature)).toBe(true);
    });

    it('returns false for invalid signature', () => {
      const payload = '{"order_sn":"SN-001"}';
      const badSig = 'a'.repeat(64);
      expect(client.verifyWebhook(payload, badSig)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('throws Shopee API error with message field', async () => {
      mockAxios.mockResolvedValueOnce({ data: { error: 'bad_param', message: 'Invalid parameter' } });
      await expect(client.updateStock(1001, 10)).rejects.toThrow(
        'Shopee API error [/api/v2/product/update_stock]: bad_param - Invalid parameter',
      );
    });

    it('throws Shopee API error with msg fallback', async () => {
      mockAxios.mockResolvedValueOnce({ data: { error: 'auth_fail', msg: 'Access token expired' } });
      await expect(client.getProducts()).rejects.toThrow(
        'Shopee API error [/api/v2/product/get_item_list]: auth_fail - Access token expired',
      );
    });

    it('re-throws network errors', async () => {
      mockAxios.mockRejectedValueOnce(new Error('timeout'));
      await expect(client.getProducts()).rejects.toThrow('timeout');
    });
  });
});
