// Desktop POS Component - Point of Sale
import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, DataTable } from '@smart-erp/ui';
import { useTranslation } from '@smart-erp/i18n';
import type { Column } from '@smart-erp/ui';
import { Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, X, ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

const PAYMENT_METHODS = [
  { key: 'cash', labelKey: 'payment.method.cash', icon: <Banknote className="w-5 h-5" /> },
  { key: 'bank_transfer', labelKey: 'payment.method.bank_transfer', icon: <CreditCard className="w-5 h-5" /> },
  { key: 'momo', labelKey: 'payment.method.momo', icon: <Smartphone className="w-5 h-5" /> },
  { key: 'vnpay', labelKey: 'payment.method.vnpay', icon: <Smartphone className="w-5 h-5" /> },
];

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export function POSScreen() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [cashReceived, setCashReceived] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3000/products?isActive=true&limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'X-Tenant-ID': localStorage.getItem('tenant_id') || '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, discount: 0 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeItem = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) =>
    sum + (item.product.price * item.quantity - item.discount), 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;
  const change = parseFloat(cashReceived || '0') - total;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (selectedPayment === 'cash' && parseFloat(cashReceived || '0') < total) {
      alert(t('pos.insufficientCash'));
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'X-Tenant-ID': localStorage.getItem('tenant_id') || '',
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
            discount: item.discount,
          })),
          paymentMethod: selectedPayment,
          paymentStatus: selectedPayment === 'cash' ? 'paid' : 'unpaid',
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          channel: 'pos',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(t('pos.orderCreated', { code: data.code }));
        setCart([]);
        setShowCheckout(false);
      } else {
        alert(t('pos.createOrderFailed'));
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      alert(t('pos.createOrderFailed'));
    }
  };

  const cartColumns: Column<CartItem>[] = [
    {
      key: 'name',
      title: t('pos.product'),
      render: (_, item) => (
        <div>
          <div className="font-medium">{item.product.name}</div>
          <div className="text-sm text-gray-500">{formatVND(item.product.price)}</div>
        </div>
      ),
    },
    {
      key: 'quantity',
      title: t('pos.qty'),
      align: 'center',
      render: (_, item) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => updateQuantity(item.product.id, -1)}
            className="w-8 h-8 bg-gray-100 rounded hover:bg-gray-200"
          >
            <Minus className="w-4 h-4 mx-auto" />
          </button>
          <span className="w-8 text-center font-semibold">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.product.id, 1)}
            className="w-8 h-8 bg-gray-100 rounded hover:bg-gray-200"
          >
            <Plus className="w-4 h-4 mx-auto" />
          </button>
        </div>
      ),
    },
    {
      key: 'total',
      title: t('pos.total'),
      align: 'right',
      render: (_, item) => formatVND(item.product.price * item.quantity - item.discount),
    },
    {
      key: 'actions',
      title: '',
      align: 'center',
      width: 50,
      render: (_, item) => (
        <button
          onClick={() => removeItem(item.product.id)}
          className="p-2 hover:bg-red-50 rounded text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="flex h-full gap-4">
      {/* Products Panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{t('nav.pos')}</h2>
          <input
            type="text"
            placeholder={t('pos.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-lg w-64"
          />
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => addToCart(product)}
              >
                <p className="font-medium text-sm truncate">{product.name}</p>
                <p className="text-green-600 font-bold mt-1">{formatVND(product.price)}</p>
                <p className="text-xs text-gray-400 mt-1">{t('pos.inStock', { stock: product.stock })}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-96 flex flex-col bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span className="font-semibold">{t('pos.cart')} ({cart.length})</span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setShowCheckout(true)}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              {t('pos.checkout')}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 py-8">{t('pos.cartEmpty')}</p>
          ) : (
            <DataTable
              columns={cartColumns}
              data={cart}
              rowKey={(item) => item.product.id}
              emptyText={t('pos.cartEmpty')}
            />
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between mb-2">
            <span>{t('pos.subtotal')}:</span>
            <span>{formatVND(subtotal)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>{t('pos.tax')}:</span>
            <span>{formatVND(tax)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>{t('pos.total')}:</span>
            <span className="text-green-600">{formatVND(total)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">{t('pos.checkout')}</h3>
              <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('pos.customerOptional')}</label>
                <input
                  type="text"
                  placeholder={t('pos.customerName')}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="tel"
                  placeholder={t('pos.customerPhone')}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mt-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('pos.paymentMethod')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.key}
                      onClick={() => setSelectedPayment(method.key)}
                      className={`flex items-center gap-2 p-3 rounded-lg border ${
                        selectedPayment === method.key
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {method.icon}
                      <span>{t(method.labelKey as any)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedPayment === 'cash' && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('pos.cashReceived')}</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="0"
                  />
                  {change > 0 && (
                    <p className="text-green-600 font-semibold mt-2">
                      {t('pos.change')}: {formatVND(change)}
                    </p>
                  )}
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>{t('pos.total')}:</span>
                  <span className="text-green-600">{formatVND(total)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setShowCheckout(false)} className="flex-1">
                  {t('pos.cancel')}
                </Button>
                <Button variant="primary" onClick={handleCheckout} className="flex-1">
                  {t('pos.confirm')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}