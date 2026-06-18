import React from 'react';
import { Button, Input, Tag, Modal, message as antdMessage, InputNumber } from 'antd';
import { Search, ShoppingCart, Printer, CreditCard, Banknote, PauseCircle, PlayCircle } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import { useHotkeys } from 'react-hotkeys-hook';
import { Card, CardHeader, UiButton } from '@/components/ui';
import { ProductThumbnail } from '@/components/catalog/ProductThumbnail';
import { BarcodeScanner } from '@/components/sales/BarcodeScanner';
import { cn } from '@/lib/utils';
import { itemToProduct, formatMoney as money, type Product } from '@/lib/itemMapper';
import {
  createOrder,
  fetchCustomers,
  fetchCurrentShift,
  fetchItemByBarcode,
  fetchItems,
  fetchOrderPrint,
  suggestCustomers,
  validatePromotion,
} from '@/services/wmsApi';
import type { CustomerDto, ShiftDto } from '@/types/api';
import type { PageKey } from '@/types/pages';
import { animateCartBump, animateModalContent } from '@/lib/gsapAnimations';

const tierColors: Record<string, string> = {
  REGULAR: 'default',
  SILVER: 'blue',
  GOLD: 'gold',
};

export default function PosPage({
  categories,
  posCart,
  setPosCart,
  setPage,
  reloadCatalog,
  catalogLoading,
  cartPanelRef,
}: {
  categories: Array<{ id: number; categoryName: string }>;
  posCart: Array<{ product: Product; quantity: number }>;
  setPosCart: React.Dispatch<React.SetStateAction<Array<{ product: Product; quantity: number }>>>;
  setPage: (page: PageKey) => void;
  reloadCatalog: () => Promise<void>;
  catalogLoading: boolean;
  cartPanelRef: React.RefObject<HTMLDivElement>;
}) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = React.useState('Khách lẻ');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [loyaltyCustomer, setLoyaltyCustomer] = React.useState<CustomerDto | null>(null);
  const [promotionCode, setPromotionCode] = React.useState('');
  const [promoDiscount, setPromoDiscount] = React.useState(0);
  const [promoMessage, setPromoMessage] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('CASH');
  const [splitPayment, setSplitPayment] = React.useState(false);
  const [cashAmount, setCashAmount] = React.useState(0);
  const [bankAmount, setBankAmount] = React.useState(0);
  const [loyaltyRedeem, setLoyaltyRedeem] = React.useState(0);
  const [parkedOrders, setParkedOrders] = React.useState<Array<{ id: string; cart: typeof posCart; customer: string }>>([]);
  const [currentShift, setCurrentShift] = React.useState<ShiftDto | null>(null);
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [lastInvoice, setLastInvoice] = React.useState<any | null>(null);
  const receiptRef = React.useRef<HTMLDivElement>(null);
  const splitAmountsTouchedRef = React.useRef(false);

  const [localProducts, setLocalProducts] = React.useState<Product[]>([]);
  const [loadingItems, setLoadingItems] = React.useState(false);
  const [customerOptions, setCustomerOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [customerInput, setCustomerInput] = React.useState('');

  useHotkeys('f9', (e) => { e.preventDefault(); setPaymentMethod('CASH'); });
  useHotkeys('f10', (e) => { e.preventDefault(); setPaymentMethod('BANK_TRANSFER'); });

  React.useEffect(() => {
    if (receiptOpen) animateModalContent(receiptRef.current);
  }, [receiptOpen]);

  React.useEffect(() => {
    fetchCurrentShift().then(setCurrentShift).catch(() => setCurrentShift(null));
  }, []);

  React.useEffect(() => {
    const pendingCode = sessionStorage.getItem('smartmart_pending_promo_code');
    if (!pendingCode) return;
    sessionStorage.removeItem('smartmart_pending_promo_code');
    setPromotionCode(pendingCode.toUpperCase());
    antdMessage.info(`Đã nạp mã khuyến mãi ${pendingCode.toUpperCase()}`);
  }, []);

  React.useEffect(() => {
    let active = true;
    const loadItems = async () => {
      setLoadingItems(true);
      try {
        const res = await fetchItems(searchQuery, selectedCategoryId === 0 ? undefined : selectedCategoryId);
        if (active) setLocalProducts(res.map(itemToProduct));
      } catch (e) {
        console.error('Failed to fetch items', e);
      } finally {
        if (active) setLoadingItems(false);
      }
    };
    const timer = setTimeout(loadItems, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [searchQuery, selectedCategoryId]);

  React.useEffect(() => {
    let active = true;
    const loadCust = async () => {
      if (!customerInput.trim()) {
        setCustomerOptions([]);
        return;
      }
      try {
        const res = await suggestCustomers(customerInput.trim());
        if (active && res) {
          setCustomerOptions(res.map((c) => ({ value: c, label: c })));
        }
      } catch (e) {
        console.error(e);
      }
    };
    const timer = setTimeout(loadCust, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [customerInput]);

  const lookupCustomerByPhone = async (phone: string) => {
    const normalized = phone.replace(/[^0-9+]/g, '').trim();
    if (!normalized || normalized.length < 9) {
      setLoyaltyCustomer(null);
      return;
    }
    try {
      const customers = await fetchCustomers(normalized);
      if (customers.length > 0) {
        const c = customers[0];
        setLoyaltyCustomer(c);
        setSelectedCustomer(c.fullName);
        setCustomerInput(c.fullName);
        antdMessage.success(`Tìm thấy khách: ${c.fullName} (${c.loyaltyPoints} điểm)`);
      } else {
        setLoyaltyCustomer(null);
      }
    } catch {
      setLoyaltyCustomer(null);
    }
  };

  const subtotal = posCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const validatePromoCode = async (code: string, amount = subtotal) => {
    if (!code.trim()) {
      setPromoDiscount(0);
      setPromoMessage('');
      return;
    }
    try {
      const res = await validatePromotion(code.trim().toUpperCase(), amount);
      if (res.valid) {
        setPromoDiscount(Number(res.discountAmount));
        setPromoMessage(res.promotionName || 'Áp dụng thành công');
        antdMessage.success(`Giảm ${money(res.discountAmount)}`);
      } else {
        setPromoDiscount(0);
        setPromoMessage(res.message || 'Mã không hợp lệ');
        antdMessage.warning(res.message || 'Mã không hợp lệ');
      }
    } catch (e) {
      setPromoDiscount(0);
      setPromoMessage('Không kiểm tra được mã KM');
    }
  };

  React.useEffect(() => {
    if (promotionCode.trim()) {
      const timer = setTimeout(() => validatePromoCode(promotionCode, subtotal), 400);
      return () => clearTimeout(timer);
    }
    setPromoDiscount(0);
    setPromoMessage('');
  }, [promotionCode, subtotal]);

  const total = Math.max(0, subtotal - promoDiscount - loyaltyRedeem);
  const expectedLoyaltyEarn = customerPhone.trim() ? Math.floor(total / 1000) : 0;
  const maxLoyaltyRedeem = loyaltyCustomer
    ? Math.min(loyaltyCustomer.loyaltyPoints, Math.max(0, subtotal - promoDiscount))
    : 0;

  React.useEffect(() => {
    if (loyaltyRedeem > maxLoyaltyRedeem) {
      setLoyaltyRedeem(maxLoyaltyRedeem);
    }
  }, [maxLoyaltyRedeem, loyaltyRedeem]);

  React.useEffect(() => {
    if (splitPayment) {
      if (!splitAmountsTouchedRef.current) {
        setCashAmount(Math.round(total / 2));
        setBankAmount(total - Math.round(total / 2));
      }
    } else {
      splitAmountsTouchedRef.current = false;
    }
  }, [total, splitPayment]);

  const handleParkOrder = () => {
    if (posCart.length === 0) return;
    const id = `PARK-${Date.now()}`;
    setParkedOrders([...parkedOrders, { id, cart: [...posCart], customer: selectedCustomer }]);
    setPosCart([]);
    antdMessage.info('Đã giữ đơn tạm');
  };

  const handleRestoreParked = (id: string) => {
    const parked = parkedOrders.find((p) => p.id === id);
    if (!parked) return;
    setPosCart(parked.cart);
    setSelectedCustomer(parked.customer);
    setParkedOrders(parkedOrders.filter((p) => p.id !== id));
    antdMessage.success('Đã khôi phục đơn giữ');
  };

  const handleBarcodeScan = async (code: string) => {
    const q = code.trim();
    const local = localProducts.find((p) => p.sku.toLowerCase() === q.toLowerCase() || p.key === q);
    if (local) {
      handleAddToCart(local);
      return;
    }
    try {
      const item = await fetchItemByBarcode(q);
      handleAddToCart(itemToProduct(item));
    } catch {
      antdMessage.warning(`Không tìm thấy sản phẩm: ${q}`);
    }
  };

  const filteredProducts = React.useMemo(() => {
    let result = localProducts;
    if (selectedCategoryId !== 0) {
      result = result.filter((p) => p.categoryId === selectedCategoryId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    return result;
  }, [localProducts, searchQuery, selectedCategoryId]);

  const handleAddToCart = (product: Product) => {
    if (product.stock === 0) {
      antdMessage.error(`${product.name} đã hết hàng trong kho!`);
      return;
    }
    const existing = posCart.find((item) => item.product.key === product.key);
    if (existing) {
      if (existing.quantity >= product.stock) {
        antdMessage.warning(`Chỉ còn ${product.stock} sản phẩm để bán!`);
        return;
      }
      setPosCart(posCart.map((item) => (item.product.key === product.key ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setPosCart([...posCart, { product, quantity: 1 }]);
    }
    animateCartBump(cartPanelRef.current);
  };

  const updateQuantity = (productKey: string, delta: number) => {
    const existing = posCart.find((item) => item.product.key === productKey);
    if (!existing) return;
    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      setPosCart(posCart.filter((item) => item.product.key !== productKey));
    } else {
      if (newQty > existing.product.stock) {
        antdMessage.warning(`Chỉ còn ${existing.product.stock} sản phẩm trong kho!`);
        return;
      }
      setPosCart(posCart.map((item) => (item.product.key === productKey ? { ...item, quantity: newQty } : item)));
    }
  };

  const [checkoutLoading, setCheckoutLoading] = React.useState(false);

  const handleCheckout = async () => {
    if (posCart.length === 0) {
      antdMessage.warning('Giỏ hàng trống! Hãy quét chọn sản phẩm.');
      return;
    }
    const phone = customerPhone.replace(/[^0-9+]/g, '').trim();
    if (loyaltyRedeem > 0 && (!phone || phone.length < 9)) {
      antdMessage.error('Vui lòng nhập SĐT khách hàng hợp lệ để đổi điểm');
      return;
    }
    if (splitPayment && cashAmount + bankAmount !== total) {
      antdMessage.error(`Tổng thanh toán (${money(cashAmount + bankAmount)}) phải bằng ${money(total)}`);
      return;
    }
    setCheckoutLoading(true);
    try {
      const order = await createOrder({
        customerName: (customerInput.trim() && customerInput.trim() !== selectedCustomer) ? customerInput.trim() : selectedCustomer,
        customerPhone: customerPhone.trim() || undefined,
        promotionCode: promotionCode.trim() || undefined,
        paymentMethod: splitPayment ? 'CASH' : paymentMethod,
        loyaltyPointsRedeemed: loyaltyRedeem > 0 ? loyaltyRedeem : undefined,
        payments: splitPayment ? [
          { paymentMethod: 'CASH', amount: cashAmount },
          { paymentMethod: 'BANK_TRANSFER', amount: bankAmount },
        ] : undefined,
        items: posCart.map((item) => ({
          itemId: Number(item.product.key),
          quantity: item.quantity,
        })),
      });
      await reloadCatalog();
      const discount = Number(order.discountAmount || promoDiscount || 0);
      const loyaltyPointsEarned = Number(order.loyaltyPointsEarned || 0);
      const customerLoyaltyPoints = order.customerLoyaltyPoints;
      const newInvoice = {
        orderId: order.id,
        key: order.orderCode,
        customer: order.customerName,
        customerPhone: order.customerPhone,
        amount: Math.round(Number(order.totalAmount)),
        cashier: order.cashierName || 'Hệ thống',
        status: 'Đã thanh toán',
        time: new Date(order.orderDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        items: posCart.map((item) => ({
          name: item.product.name,
          qty: item.quantity,
          price: item.product.price,
          itemId: Number(item.product.key),
        })),
        subtotal: Math.round(subtotal),
        discount: Math.round(discount),
        loyaltyRedeemed: Number(order.loyaltyPointsRedeemed || loyaltyRedeem || 0),
        loyaltyEarned: loyaltyPointsEarned,
        customerPoints: customerLoyaltyPoints,
        customerTier: order.customerTier,
      };
      setLastInvoice(newInvoice);
      if (loyaltyCustomer && customerLoyaltyPoints !== undefined) {
        setLoyaltyCustomer({
          ...loyaltyCustomer,
          loyaltyPoints: Number(customerLoyaltyPoints),
          tier: order.customerTier || loyaltyCustomer.tier,
        });
      }
      setReceiptOpen(true);
      setPosCart([]);
      setPromotionCode('');
      setPromoDiscount(0);
      setLoyaltyRedeem(0);
      antdMessage.success(
        loyaltyPointsEarned > 0
          ? `Thanh toán thành công, tự động tích ${loyaltyPointsEarned} điểm`
          : 'Thanh toán đơn hàng thành công!'
      );
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Thanh toán thất bại');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_430px]">
      {currentShift && (
        <div className="xl:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Ca đang mở #{currentShift.id} · Mở lúc {new Date(currentShift.openedAt).toLocaleString('vi-VN')}
          · Tiền mặt đầu ca: {money(currentShift.openingCash)}
        </div>
      )}
      <Card>
        <div className="p-4 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-ink whitespace-nowrap">Danh sách sản phẩm bán {catalogLoading || loadingItems ? '(đang tải…)' : ''}</h2>
            <p className="text-xs text-slate-400">Click chọn sản phẩm hoặc quét mã vạch (Enter).</p>
          </div>
          <div className="w-full md:w-auto flex gap-2">
            <BarcodeScanner onScan={handleBarcodeScan} />
            <select
              className="w-full h-8 px-3 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:border-primary"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
            >
              <option value={0}>Tất cả</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.categoryName}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-5 pb-5 pt-4">
          <Input
            size="large"
            prefix={<Search size={18} />}
            placeholder="Tìm theo tên sản phẩm, SKU hoặc quét mã vạch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key !== 'Enter' || !searchQuery.trim()) return;
              e.preventDefault();
              const q = searchQuery.trim();
              const local = localProducts.find((p) => p.sku.toLowerCase() === q.toLowerCase() || p.key === q);
              if (local) {
                handleAddToCart(local);
                setSearchQuery('');
                return;
              }
              try {
                const item = await fetchItemByBarcode(q);
                handleAddToCart(itemToProduct(item));
                setSearchQuery('');
              } catch {
                antdMessage.warning(`Không tìm thấy sản phẩm với mã: ${q}`);
              }
            }}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredProducts.map((product) => (
              <button
                className={cn(
                  'rounded-xl border border-line bg-white p-3 text-left transition hover:border-emerald hover:bg-emerald-50/50 flex flex-col h-[200px] relative overflow-hidden',
                  product.stock === 0 && 'opacity-60 cursor-not-allowed bg-slate-100/50'
                )}
                key={product.key}
                onClick={() => handleAddToCart(product)}
              >
                <div className="flex justify-center py-1">
                  <ProductThumbnail name={product.name} imageUrl={product.imageUrl} size={72} />
                </div>
                <div className="flex-1 flex flex-col justify-between mt-2">
                  <div>
                    <strong className="text-sm font-bold text-ink line-clamp-2 leading-snug">{product.name}</strong>
                    <p className="mt-1 text-xs text-slate-400 font-medium">{product.sku} · Tồn {product.stock}</p>
                  </div>
                  <span className="font-extrabold text-primary text-base">{money(product.price)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div ref={cartPanelRef}>
        <Card className="flex flex-col h-fit">
          <CardHeader title="Giỏ hàng hiện tại" action={<Tag color="green" className="font-bold">{posCart.length} dòng hàng</Tag>} />
          <div className="space-y-3 px-5 pb-2 flex-1 max-h-[380px] overflow-y-auto scrollbar-thin">
            {posCart.map((item) => (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100" key={item.product.key}>
                <ProductThumbnail name={item.product.name} imageUrl={item.product.imageUrl} size={36} className="mr-2 shrink-0" />
                <div className="min-w-0 flex-1 pr-3">
                  <strong className="text-sm font-semibold text-ink line-clamp-1">{item.product.name}</strong>
                  <p className="text-xs text-slate-400 mt-0.5">{money(item.product.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="small" shape="circle" onClick={() => updateQuantity(item.product.key, -1)}>-</Button>
                  <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                  <Button size="small" shape="circle" onClick={() => updateQuantity(item.product.key, 1)}>+</Button>
                </div>
                <span className="font-bold text-slate-700 ml-4 min-w-[70px] text-right">{money(item.product.price * item.quantity)}</span>
              </div>
            ))}
            {posCart.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-300">
                <ShoppingCart size={40} className="mb-2" />
                <span className="text-sm">Chưa có sản phẩm nào trong giỏ hàng POS</span>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4 rounded-b-2xl">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Số điện thoại khách</label>
              <Input
                placeholder="09xx xxx xxx"
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  if (!e.target.value.trim()) setLoyaltyCustomer(null);
                }}
                onBlur={() => lookupCustomerByPhone(customerPhone)}
                onPressEnter={() => lookupCustomerByPhone(customerPhone)}
              />
              {loyaltyCustomer && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Tag color={tierColors[loyaltyCustomer.tier] || 'default'}>{loyaltyCustomer.tier}</Tag>
                    <span className="text-slate-600">{loyaltyCustomer.loyaltyPoints} điểm tích lũy</span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Đổi điểm (1 điểm = 1 VND)</label>
                    <InputNumber className="w-full mt-1" min={0} max={maxLoyaltyRedeem} value={loyaltyRedeem}
                      onChange={(v) => setLoyaltyRedeem(Math.min(Number(v) || 0, maxLoyaltyRedeem))} />
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    Sau thanh toán: tự trừ {loyaltyRedeem} điểm, dự kiến cộng {expectedLoyaltyEarn} điểm.
                  </div>
                </div>
              )}
              {!loyaltyCustomer && customerPhone.trim().length >= 9 && (
                <p className="mt-2 text-xs text-slate-500">
                  Khách mới sẽ được tự tạo và tích điểm khi thanh toán.
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Tên khách hàng</label>
              <CreatableSelect
                isClearable
                onChange={(newValue) => setSelectedCustomer(newValue ? newValue.value : 'Khách lẻ')}
                onInputChange={(newValue, actionMeta) => {
                  if (actionMeta.action !== 'input-blur' && actionMeta.action !== 'menu-close') {
                    setCustomerInput(newValue);
                  }
                }}
                onBlur={() => {
                  if (customerInput.trim()) setSelectedCustomer(customerInput.trim());
                }}
                options={customerOptions}
                placeholder="Chọn hoặc tạo mới..."
                value={{ value: selectedCustomer, label: selectedCustomer }}
                formatCreateLabel={(inputValue) => `Tạo khách hàng mới: "${inputValue}"`}
                styles={{ control: (base) => ({ ...base, minHeight: '32px', borderRadius: '6px' }) }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Mã khuyến mãi</label>
              <Input
                placeholder="VD: WEEKEND10, SAVE50K"
                value={promotionCode}
                onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
              />
              {promoMessage && <p className="text-xs text-slate-500 mt-1">{promoMessage}</p>}
            </div>

            <div className="space-y-1.5 text-sm border-t border-dashed border-slate-200 pt-3">
              <div className="flex justify-between text-slate-500">
                <span>Tạm tính</span>
                <span>{money(subtotal)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Giảm giá KM</span>
                  <span>-{money(promoDiscount)}</span>
                </div>
              )}
              {loyaltyRedeem > 0 && (
                <div className="flex justify-between text-amber-600 font-medium">
                  <span>Đổi điểm</span>
                  <span>-{money(loyaltyRedeem)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-ink border-t border-slate-200/80 pt-2 mt-2">
                <span>Tổng cộng thanh toán</span>
                <span className="text-primary">{money(total)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={splitPayment} onChange={(e) => {
                  splitAmountsTouchedRef.current = false;
                  setSplitPayment(e.target.checked);
                }} />
                Thanh toán chia (tiền mặt + CK)
              </label>
            </div>
            {splitPayment ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500">Tiền mặt</label>
                  <InputNumber className="w-full" min={0} value={cashAmount} onChange={(v) => {
                    splitAmountsTouchedRef.current = true;
                    setCashAmount(Number(v) || 0);
                  }} />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Chuyển khoản</label>
                  <InputNumber className="w-full" min={0} value={bankAmount} onChange={(v) => {
                    splitAmountsTouchedRef.current = true;
                    setBankAmount(Number(v) || 0);
                  }} />
                </div>
              </div>
            ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition', paymentMethod === 'CASH' ? 'bg-primary border-primary text-white font-bold shadow-md shadow-primary/20' : 'bg-white border-line text-muted font-semibold hover:border-primary hover:text-primary')}
              >
                <Banknote size={16} /> Tiền mặt (F9)
              </button>
              <button
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition', paymentMethod === 'BANK_TRANSFER' ? 'bg-primary border-primary text-white font-bold shadow-md shadow-primary/20' : 'bg-white border-line text-muted font-semibold hover:border-primary hover:text-primary')}
              >
                <CreditCard size={16} /> Chuyển khoản (F10)
              </button>
            </div>
            )}

            {parkedOrders.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {parkedOrders.map((p) => (
                  <Button key={p.id} size="small" icon={<PlayCircle size={14} />} onClick={() => handleRestoreParked(p.id)}>
                    {p.customer} ({p.cart.length})
                  </Button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <UiButton className="flex-1" variant="secondary" onClick={handleParkOrder} disabled={posCart.length === 0}>
                <PauseCircle size={16} className="mr-1 inline" /> Giữ đơn
              </UiButton>
              <UiButton className="flex-1 h-11" variant="primary" onClick={handleCheckout} disabled={checkoutLoading}>
                {checkoutLoading ? 'Đang xử lý…' : 'Thanh toán'}
              </UiButton>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={receiptOpen}
        onCancel={() => setReceiptOpen(false)}
        footer={[
          <Button key="close" onClick={() => setReceiptOpen(false)}>Đóng</Button>,
          <Button
            key="print"
            type="primary"
            icon={<Printer size={16} />}
            onClick={async () => {
              if (!lastInvoice?.orderId) return;
              try {
                const data = await fetchOrderPrint(lastInvoice.orderId);
                const lines = data.items.map((it) =>
                  `<tr><td>${it.itemName}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${money(it.unitPrice)}</td></tr>`
                ).join('');
                const html = `<html><body style="font-family:monospace;padding:16px"><h2>SMARTMART AI</h2><p>${data.orderCode}</p><table border="1" cellpadding="4">${lines}</table><p><strong>${money(data.totalAmount)}</strong></p></body></html>`;
                const w = window.open('', '_blank');
                if (w) { w.document.write(html); w.document.close(); w.print(); }
              } catch (e) {
                antdMessage.error(e instanceof Error ? e.message : 'In thất bại');
              }
            }}
          >
            In hóa đơn
          </Button>,
        ]}
        width={400}
        title="Hóa đơn thanh toán (POS)"
      >
        {lastInvoice && (
          <div ref={receiptRef} className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 font-mono text-xs">
            <div className="text-center border-b border-dashed border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800">SMARTMART AI</h3>
              <p className="text-slate-400 mt-1">Siêu Thị Mini Vận Hành Thông Minh</p>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              <div className="flex justify-between"><span>Số HĐ:</span><span className="font-bold">{lastInvoice.key}</span></div>
              <div className="flex justify-between"><span>Khách hàng:</span><span>{lastInvoice.customer}</span></div>
              {lastInvoice.customerPhone && (
                <div className="flex justify-between"><span>SĐT:</span><span>{lastInvoice.customerPhone}</span></div>
              )}
            </div>
            <div className="border-t border-b border-dashed border-slate-200 py-3 space-y-2">
              {lastInvoice.items.map((it: { name: string; qty: number; price: number }) => (
                <div className="flex justify-between text-slate-700" key={it.name}>
                  <div className="pr-3 truncate w-[180px]">{it.name}</div>
                  <div>{it.qty} x {money(it.price)}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-bold text-primary">
              <span>TỔNG:</span>
              <span>{money(lastInvoice.amount)}</span>
            </div>
            {(lastInvoice.loyaltyRedeemed > 0 || lastInvoice.loyaltyEarned > 0) && (
              <div className="border-t border-dashed border-slate-200 pt-3 space-y-1 text-[11px] text-slate-600">
                {lastInvoice.loyaltyRedeemed > 0 && (
                  <div className="flex justify-between">
                    <span>Điểm đã đổi:</span>
                    <span>-{lastInvoice.loyaltyRedeemed}</span>
                  </div>
                )}
                {lastInvoice.loyaltyEarned > 0 && (
                  <div className="flex justify-between">
                    <span>Điểm vừa tích:</span>
                    <span>+{lastInvoice.loyaltyEarned}</span>
                  </div>
                )}
                {lastInvoice.customerPoints !== undefined && (
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Số dư điểm:</span>
                    <span>{lastInvoice.customerPoints} {lastInvoice.customerTier ? `(${lastInvoice.customerTier})` : ''}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
