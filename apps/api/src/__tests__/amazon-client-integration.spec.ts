const mockHttpRequest = jest.fn();
const mockAxiosPost = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({ request: mockHttpRequest })),
    post: mockAxiosPost,
    get: jest.fn(),
    put: jest.fn(),
  },
}));

import { AmazonClient } from '../ecommerce/amazon.client';

describe('AmazonClient integration', () => {
  let client: AmazonClient;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1770000000000);
    client = new AmazonClient({
      clientId: 'test',
      clientSecret: 'test',
      refreshToken: 'test',
      sellerId: 'test',
      region: 'na',
      accessToken: 'initial-token',
      accessTokenExpiry: 1770000001000,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getProducts', () => {
    it('returns products on successful response', async () => {
      mockHttpRequest.mockResolvedValueOnce({
        data: { items: [{ asin: 'B001', name: 'Product 1' }, { asin: 'B002', name: 'Product 2' }] },
      });

      const result = await client.getProducts();
      expect(result).toHaveLength(2);
      expect(result[0].asin).toBe('B001');
      expect(result[1].asin).toBe('B002');
    });

    it('supports pagination parameters', async () => {
      mockHttpRequest.mockResolvedValueOnce({ data: { items: [{ asin: 'B003' }] } });

      const result = await client.getProducts(3, 50);
      expect(result).toHaveLength(1);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({ url: expect.stringContaining('pageSize=50&pageNumber=3') }),
      );
    });

    it('returns empty array when response has no items', async () => {
      mockHttpRequest.mockResolvedValueOnce({ data: {} });
      const result = await client.getProducts();
      expect(result).toEqual([]);
    });
  });

  describe('getOrders', () => {
    it('returns orders without sinceDate', async () => {
      mockHttpRequest.mockResolvedValueOnce({ data: { payload: { Orders: [{ AmazonOrderId: 'O1' }] } } });

      const result = await client.getOrders();
      expect(result).toHaveLength(1);
      expect(result[0].AmazonOrderId).toBe('O1');
    });

    it('includes CreatedAfter when sinceDate is provided', async () => {
      mockHttpRequest.mockResolvedValueOnce({ data: { payload: { Orders: [{ AmazonOrderId: 'O2' }] } } });

      const result = await client.getOrders(new Date('2026-01-01'));
      expect(result).toHaveLength(1);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({ url: expect.stringContaining('CreatedAfter=') }),
      );
    });

    it('returns empty array when no orders', async () => {
      mockHttpRequest.mockResolvedValueOnce({ data: { payload: {} } });
      const result = await client.getOrders();
      expect(result).toEqual([]);
    });

    it('applies pagination parameters', async () => {
      mockHttpRequest.mockResolvedValueOnce({ data: { payload: { Orders: [] } } });

      await client.getOrders(undefined, 2, 50);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({ url: expect.stringContaining('PageSize=50&PageNumber=2') }),
      );
    });
  });

  describe('getCustomers', () => {
    it('returns empty array', async () => {
      const result = await client.getCustomers();
      expect(result).toEqual([]);
    });
  });

  describe('auth token refresh', () => {
    it('does not refresh when token is still valid', async () => {
      mockHttpRequest.mockResolvedValueOnce({ data: { items: [] } });
      await client.getProducts();
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it('refreshes token when expired and retries request', async () => {
      mockAxiosPost.mockResolvedValueOnce({ data: { access_token: 'refreshed-token', expires_in: 3600 } });
      mockHttpRequest.mockResolvedValueOnce({ data: { items: [{ asin: 'B100' }] } });

      const expClient = new AmazonClient({
        clientId: 'test',
        clientSecret: 'test',
        refreshToken: 'test',
        sellerId: 'test',
        region: 'na',
        accessTokenExpiry: 1,
      });
      const result = await expClient.getProducts();

      expect(mockAxiosPost).toHaveBeenCalledTimes(1);
      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://api.amazon.com/auth/o2/token',
        expect.any(URLSearchParams),
        expect.any(Object),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('throws on Amazon API errors with message', async () => {
      mockHttpRequest.mockResolvedValueOnce({ data: { errors: [{ message: 'Invalid seller identifier' }] } });
      await expect(client.getProducts()).rejects.toThrow('Invalid seller identifier');
    });

    it('throws generic error when errors array is empty', async () => {
      mockHttpRequest.mockResolvedValueOnce({ data: { errors: [] } });
      await expect(client.getProducts()).rejects.toThrow('Amazon API error');
    });

    it('re-throws network errors', async () => {
      mockHttpRequest.mockRejectedValueOnce(new Error('connect ECONNREFUSED'));
      await expect(client.getProducts()).rejects.toThrow('connect ECONNREFUSED');
    });
  });
});
