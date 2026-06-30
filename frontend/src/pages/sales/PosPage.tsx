import React from 'react';
import { Button, Input, Tag, Modal, message as antdMessage, InputNumber, Popconfirm } from 'antd';
import type { InputRef } from 'antd';
import {
  Banknote,
  CreditCard,
  FileClock,
  Gauge,
  Home,
  LayoutGrid,
  PauseCircle,
  PlayCircle,
  Printer,
  RotateCcw,
  Search,
  ShoppingCart,
  Smartphone,
  Store,
} from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import { useHotkeys } from 'react-hotkeys-hook';
import { Card, CardHeader, UiButton } from '@/components/ui';
import { ProductThumbnail } from '@/components/catalog/ProductThumbnail';
import { BarcodeScanner } from '@/components/sales/BarcodeScanner';
import { cn } from '@/lib/utils';
import { itemToProduct, formatMoney as money, type Product } from '@/lib/itemMapper';
import { buildPrintHtml } from '@/lib/printReceipt';
import {
  createOrder,
  createHeldOrder,
  fetchCustomers,
  fetchCurrentShift,
  fetchHeldOrders,
  fetchInventory,
  fetchItemById,
  fetchItemByBarcode,
  fetchItems,
  fetchOrderPrint,
  restoreHeldOrder,
  suggestCustomers,
  validatePromotion,
  cancelHeldOrder,
} from '@/services/wmsApi';
import type { CustomerDto, HeldOrderDto, ShiftDto } from '@/types/api';
import type { PageKey } from '@/types/pages';
import { animateCartBump, animateModalContent } from '@/lib/gsapAnimations';

const tierColors: Record<string, string> = {
  REGULAR: 'default',
  SILVER: 'blue',
  GOLD: 'gold',
};

const POS_SELLING_LOCATION_NAME = 'Kho b\u00e1n';

function availableQty(row: any) {
  const quantity = Number(row?.quantity ?? 0);
  const reserved = Number(row?.reservedQuantity ?? 0);
  const available = Number(row?.availableQuantity ?? quantity - reserved);
  return Number.isFinite(available) ? available : 0;
}

function stockBySellingLocation(rows: any[]) {
  return rows.reduce<Record<number, number>>((acc, row) => {
    if (row?.locationName !== POS_SELLING_LOCATION_NAME) return acc;
    const itemId = Number(row?.itemId);
    if (!Number.isFinite(itemId)) return acc;
    acc[itemId] = (acc[itemId] || 0) + availableQty(row);
    return acc;
  }, {});
}

function applySellableStock(product: Product, stock?: number) {
  if (stock === undefined) return product;
  const next = { ...product, stock: Math.max(0, Math.round(stock)) };
  if (next.stock === 0) next.status = 'Hết hàng';
  else if (next.stock <= next.minimumStock) next.status = 'Sắp hết';
  else next.status = 'Còn hàng';
  return next;
}

const paymentOptions = [
  { value: 'CASH', label: 'Tiền mặt', hotkey: 'F9', icon: Banknote },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản', hotkey: 'F10', icon: CreditCard },
  { value: 'CARD', label: 'Thẻ', icon: CreditCard },
  { value: 'WALLET', label: 'Ví điện tử', icon: Smartphone },
  { value: 'PAY_LATER', label: 'Ghi nợ', icon: FileClock },
];

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
  const [cashReceived, setCashReceived] = React.useState(0);
  const [loyaltyRedeem, setLoyaltyRedeem] = React.useState(0);
  const [parkedOrders, setParkedOrders] = React.useState<HeldOrderDto[]>([]);
  const [currentShift, setCurrentShift] = React.useState<ShiftDto | null>(null);
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [lastInvoice, setLastInvoice] = React.useState<any | null>(null);
  const receiptRef = React.useRef<HTMLDivElement>(null);
  const splitAmountsTouchedRef = React.useRef(false);
  const searchInputRef = React.useRef<InputRef>(null);

  React.useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const [localProducts, setLocalProducts] = React.useState<Product[]>([]);
  const [loadingItems, setLoadingItems] = React.useState(false);
  const [customerOptions, setCustomerOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [customerInput, setCustomerInput] = React.useState('');
  const [currentTime, setCurrentTime] = React.useState(() => new Date());

  useHotkeys('f9', (e) => { e.preventDefault(); setPaymentMethod('CASH'); });
  useHotkeys('f10', (e) => { e.preventDefault(); setPaymentMethod('BANK_TRANSFER'); });

  React.useEffect(() => {
    if (receiptOpen) animateModalContent(receiptRef.current);
  }, [receiptOpen]);

  React.useEffect(() => {
    fetchCurrentShift().then(setCurrentShift).catch(() => setCurrentShift(null));
  }, []);

  React.useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadHeldOrders = React.useCallback(async () => {
    try {
      setParkedOrders(await fetchHeldOrders());
    } catch {
      setParkedOrders([]);
    }
  }, []);

  React.useEffect(() => {
    loadHeldOrders();
  }, [loadHeldOrders]);

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
        const [items, inventory] = await Promise.all([
          fetchItems(searchQuery, selectedCategoryId === 0 ? undefined : selectedCategoryId),
          fetchInventory().catch(() => []),
        ]);
        const stockMap = stockBySellingLocation(inventory as any[]);
        if (active) {
          setLocalProducts(
            items.map((item) => applySellableStock(itemToProduct(item), stockMap[Number(item.id)]))
          );
        }
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

  const categoryFilters = React.useMemo(
    () => [{ id: 0, categoryName: 'Tất cả' }, ...categories],
    [categories]
  );

  const categoryVisuals = React.useMemo(() => {
    const firstProductByCategory = new Map<number, Product>();
    localProducts.forEach((product) => {
      if (!firstProductByCategory.has(product.categoryId)) {
        firstProductByCategory.set(product.categoryId, product);
      }
    });
    return firstProductByCategory;
  }, [localProducts]);

  const cartQuantityByProductKey = React.useMemo(() => {
    const result = new Map<string, number>();
    posCart.forEach((item) => result.set(item.product.key, item.quantity));
    return result;
  }, [posCart]);

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

  React.useEffect(() => {
    if (paymentMethod === 'CASH' && !splitPayment) {
      setCashReceived(total);
    }
  }, [paymentMethod, splitPayment, total]);

  const resetTransaction = () => {
    setPosCart([]);
    setSelectedCustomer('Khách lẻ');
    setCustomerInput('');
    setCustomerPhone('');
    setLoyaltyCustomer(null);
    setPromotionCode('');
    setPromoDiscount(0);
    setPromoMessage('');
    setPaymentMethod('CASH');
    setSplitPayment(false);
    setCashAmount(0);
    setBankAmount(0);
    setCashReceived(0);
    setLoyaltyRedeem(0);
  };

  const handleParkOrder = async () => {
    if (posCart.length === 0) return;
    try {
      await createHeldOrder({
        customerName: (customerInput.trim() && customerInput.trim() !== selectedCustomer) ? customerInput.trim() : selectedCustomer,
        customerPhone: customerPhone.trim() || undefined,
        promotionCode: promotionCode.trim() || undefined,
        loyaltyPointsRedeemed: loyaltyRedeem > 0 ? loyaltyRedeem : undefined,
        items: posCart.map((item) => ({
          itemId: Number(item.product.key),
          quantity: item.quantity,
        })),
      });
      resetTransaction();
      await loadHeldOrders();
      antdMessage.info('Đã giữ đơn tạm');
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Không thể giữ đơn');
    }
  };

  const handleCancelParked = async (id: number) => {
    try {
      await cancelHeldOrder(id);
      await loadHeldOrders();
      antdMessage.success('Đã hủy đơn giữ');
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Không thể hủy đơn giữ');
    }
  };

  const handleRestoreParked = async (id: number) => {
    const parked = parkedOrders.find((p) => p.id === id);
    if (!parked) return;
    try {
      await restoreHeldOrder(id);
      const products = await Promise.all(parked.items.map(async (line) => {
        const item = await fetchItemById(line.itemId);
        return { product: itemToProduct(item), quantity: Number(line.quantity) };
      }));
      setPosCart(products);
      setSelectedCustomer(parked.customerName || 'Khách lẻ');
      setCustomerInput(parked.customerName || 'Khách lẻ');
      setCustomerPhone(parked.customerPhone || '');
      setPromotionCode(parked.promotionCode || '');
      setLoyaltyRedeem(Number(parked.loyaltyPointsRedeemed || 0));
      await loadHeldOrders();
      antdMessage.success('Đã khôi phục đơn giữ');
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Không thể khôi phục đơn giữ');
    }
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
    if (!currentShift || currentShift.status !== 'OPEN') {
      antdMessage.error('Vui lòng mở ca làm việc trước khi thanh toán.');
      setPage('shifts');
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
    if (!splitPayment && paymentMethod === 'CASH' && cashReceived < total) {
      antdMessage.error(`Tiền khách đưa phải tối thiểu ${money(total)}`);
      return;
    }
    if (!splitPayment && paymentMethod === 'PAY_LATER') {
      const phone = customerPhone.replace(/[^0-9+]/g, '').trim();
      if (!phone || phone.length < 9) {
        antdMessage.error('Vui lòng nhập SĐT khách hàng hợp lệ để bán ghi nợ');
        return;
      }
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
      resetTransaction();
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

  const pageContent = (
    <div className="flex min-h-screen flex-col bg-[#f5f7fb]">
      <header className="sticky top-0 z-30 flex min-h-[62px] items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#06335d] text-white shadow-sm">
            <Store size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1 text-xl font-black leading-none text-[#06335d]">
              SmartMart <span className="text-xs font-extrabold text-orange-500">POS</span>
            </div>
            <p className="text-xs font-medium text-slate-400">Quầy bán hàng tập trung</p>
          </div>
          <div className="ml-2 hidden items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white md:flex">
            <Gauge size={15} />
            {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 justify-center">
          <Input
            ref={searchInputRef}
            className="max-w-[480px]"
            size="large"
            prefix={<Search size={18} />}
            placeholder="Tìm sản phẩm, SKU hoặc quét mã vạch..."
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
        </div>
        <div className="flex items-center gap-2">
          <BarcodeScanner onScan={handleBarcodeScan} />
          <Button type="primary" icon={<Home size={16} />} onClick={() => setPage('dashboard')}>
            Dashboard
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[118px_minmax(0,1fr)_430px]">
        <aside className="border-r border-slate-200 bg-white px-3 py-5">
          <div className="flex gap-2 overflow-x-auto xl:flex-col xl:overflow-visible">
            {categoryFilters.map((cat) => {
              const sample = cat.id === 0 ? undefined : categoryVisuals.get(cat.id);
              const active = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={cn(
                    'flex h-[86px] w-[92px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border bg-white px-2 text-center text-xs font-bold transition',
                    active
                      ? 'border-orange-400 text-[#06335d] shadow-sm ring-1 ring-orange-100'
                      : 'border-slate-200 text-[#06335d] hover:border-orange-300'
                  )}
                >
                  {sample ? (
                    <ProductThumbnail name={sample.name} imageUrl={sample.imageUrl} size={28} />
                  ) : (
                    <LayoutGrid size={28} className={active ? 'text-orange-500' : 'text-slate-400'} />
                  )}
                  <span className="line-clamp-2 leading-tight">{cat.categoryName}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 px-4 py-5">
      {currentShift && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Ca đang mở #{currentShift.id} · Mở lúc {new Date(currentShift.openedAt).toLocaleString('vi-VN')}
          · Tiền mặt đầu ca: {money(currentShift.openingCash)}
        </div>
      )}
      <Card>
        <div className="border-b border-line bg-white p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
              <h2 className="text-xl font-black text-[#06335d]">Welcome, POS cashier</h2>
              <p className="text-sm text-slate-400">
                {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                {catalogLoading || loadingItems ? ' · Đang tải sản phẩm...' : ''}
              </p>
          </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="border-[#0f1f46] bg-[#0f1f46] text-white hover:!border-[#0f1f46] hover:!text-white"
                icon={<LayoutGrid size={16} />}
                onClick={() => setSelectedCategoryId(0)}
              >
                View All
              </Button>
              <Button
                className="border-orange-400 bg-orange-400 text-white hover:!border-orange-500 hover:!text-white"
                onClick={() => {
                  const best = localProducts.find((product) => product.stock > 0);
                  if (best) handleAddToCart(best);
                }}
              >
                Featured
              </Button>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 pt-4">
          <div className={cn(
            'grid max-h-[calc(100vh-220px)] gap-4 overflow-y-auto pr-1 scrollbar-thin sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'
          )}>
            {filteredProducts.map((product) => {
              const selectedQty = cartQuantityByProductKey.get(product.key) ?? 0;
              return (
                <button
                  className={cn(
                    'relative flex h-[284px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-400 hover:shadow-md',
                    selectedQty > 0 && 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-100',
                    product.stock === 0 && 'cursor-not-allowed bg-slate-100/50 opacity-60'
                  )}
                  key={product.key}
                  onClick={() => handleAddToCart(product)}
                >
                {selectedQty > 0 && (
                  <span className="absolute right-3 top-3 z-10 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-emerald-600 px-2 text-xs font-black text-white shadow-sm ring-2 ring-white">
                    x{selectedQty}
                  </span>
                )}
                <div className="flex h-[150px] items-center justify-center rounded-xl bg-slate-50">
                  <ProductThumbnail name={product.name} imageUrl={product.imageUrl} size={118} />
                </div>
                <div className="mt-3 flex flex-1 flex-col justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{product.category}</p>
                    <strong className="line-clamp-2 text-base font-extrabold leading-snug text-slate-800">{product.name}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-black text-[#0f1f46]">{money(product.price)}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
                      Tồn {product.stock}
                    </span>
                  </div>
                </div>
                </button>
              );
            })}
          </div>
        </div>
      </Card>
        </section>

      <aside ref={cartPanelRef} className="min-h-0 border-l border-slate-200 bg-[#e9eef3] p-5">
        <Card className="flex h-[calc(100vh-126px)] min-h-[620px] flex-col overflow-hidden rounded-xl">
          <CardHeader title="Order List" action={<Tag color="blue" className="font-bold">#{posCart.length} item</Tag>} />
          <div className="min-h-[180px] flex-[1.05] space-y-3 overflow-y-auto px-5 pb-4 scrollbar-thin">
            {posCart.map((item) => (
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3" key={item.product.key}>
                <ProductThumbnail name={item.product.name} imageUrl={item.product.imageUrl} size={36} className="mr-2 shrink-0" />
                <div className="min-w-0">
                  <strong className="text-sm font-semibold text-ink line-clamp-1">{item.product.name}</strong>
                  <p className="text-xs text-slate-400 mt-0.5">{money(item.product.price)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1">
                    <Button size="small" shape="circle" onClick={() => updateQuantity(item.product.key, -1)}>-</Button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <Button size="small" shape="circle" onClick={() => updateQuantity(item.product.key, 1)}>+</Button>
                  </div>
                  <span className="min-w-[80px] text-right text-sm font-bold text-slate-700">{money(item.product.price * item.quantity)}</span>
                </div>
              </div>
            ))}
            {posCart.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-300">
                <ShoppingCart size={40} className="mb-2" />
                <span className="text-sm">Chưa có sản phẩm nào trong giỏ hàng POS</span>
              </div>
            )}
          </div>

          <div className="flex-[1.2] space-y-4 overflow-y-auto border-t border-slate-100 bg-slate-50/50 p-5 scrollbar-thin">
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
                  <label className="text-xs text-slate-500">Ngân hàng</label>
                  <InputNumber className="w-full" min={0} value={bankAmount} onChange={(v) => {
                    splitAmountsTouchedRef.current = true;
                    setBankAmount(Number(v) || 0);
                  }} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {paymentOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPaymentMethod(option.value)}
                      className={cn(
                        'flex min-h-10 items-center justify-center gap-2 rounded-lg border px-2 py-2 text-sm transition',
                        paymentMethod === option.value
                          ? 'bg-primary border-primary text-white font-bold shadow-md shadow-primary/20'
                          : 'bg-white border-line text-muted font-semibold hover:border-primary hover:text-primary'
                      )}
                    >
                      <Icon size={16} />
                      <span className="truncate">{option.label}{option.hotkey ? ` (${option.hotkey})` : ''}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {!splitPayment && paymentMethod === 'CASH' && (
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-3">
                <div>
                  <label className="text-xs text-slate-500">Khách đưa</label>
                  <InputNumber
                    className="w-full"
                    min={0}
                    value={cashReceived}
                    onChange={(v) => setCashReceived(Number(v) || 0)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Tiền thối</label>
                  <div className="mt-1 flex h-8 items-center rounded-md bg-slate-50 px-3 text-sm font-bold text-emerald-700">
                    {money(Math.max(0, cashReceived - total))}
                  </div>
                </div>
              </div>
            )}

            {parkedOrders.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Đơn đang giữ ({parkedOrders.length})</p>
                <div className="flex flex-wrap gap-1">
                  {parkedOrders.map((p) => (
                    <div key={p.id} className="flex items-center gap-0.5">
                      <Button size="small" icon={<PlayCircle size={14} />} onClick={() => handleRestoreParked(p.id)}>
                        {p.customerName} ({p.items.length})
                      </Button>
                      <Popconfirm title="Hủy đơn giữ này?" okText="Hủy" cancelText="Không" onConfirm={() => handleCancelParked(p.id)}>
                        <Button size="small" danger type="text">×</Button>
                      </Popconfirm>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <UiButton className="flex-1" variant="secondary" onClick={handleParkOrder} disabled={posCart.length === 0}>
                <PauseCircle size={16} className="mr-1 inline" /> Giữ đơn
              </UiButton>
              <Popconfirm
                title="Hủy giao dịch hiện tại?"
                description="Giỏ hàng và thông tin thanh toán sẽ được xóa."
                okText="Hủy giao dịch"
                cancelText="Quay lại"
                onConfirm={resetTransaction}
              >
                <UiButton className="flex-1" variant="secondary" disabled={posCart.length === 0}>
                  <RotateCcw size={16} className="mr-1 inline" /> Reset
                </UiButton>
              </Popconfirm>
            </div>
            <div className="flex gap-2">
              <UiButton className="flex-1 h-11" variant="primary" onClick={handleCheckout} disabled={checkoutLoading}>
                {checkoutLoading ? 'Đang xử lý…' : 'Thanh toán'}
              </UiButton>
            </div>
          </div>
        </Card>
      </aside>
      </div>

      <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
        <Button
          className="min-w-[104px] border-orange-600 bg-orange-600 text-white hover:!border-orange-700 hover:!text-white"
          icon={<PauseCircle size={16} />}
          onClick={handleParkOrder}
          disabled={posCart.length === 0}
        >
          Hold
        </Button>
        <Button
          className="min-w-[118px] border-[#0f1f46] bg-[#0f1f46] text-white hover:!border-[#0f1f46] hover:!text-white"
          icon={<PlayCircle size={16} />}
          disabled={parkedOrders.length === 0}
          onClick={() => parkedOrders[0] && handleRestoreParked(parkedOrders[0].id)}
        >
          View Orders
        </Button>
        <Popconfirm
          title="Hủy giao dịch hiện tại?"
          description="Giỏ hàng và thông tin thanh toán sẽ được xóa."
          okText="Hủy giao dịch"
          cancelText="Quay lại"
          onConfirm={resetTransaction}
        >
          <Button
            className="min-w-[104px] border-indigo-600 bg-indigo-600 text-white hover:!border-indigo-700 hover:!text-white"
            icon={<RotateCcw size={16} />}
            disabled={posCart.length === 0}
          >
            Reset
          </Button>
        </Popconfirm>
        <Button
          className="min-w-[132px] border-red-600 bg-red-600 text-white hover:!border-red-700 hover:!text-white"
          icon={<CreditCard size={16} />}
          onClick={handleCheckout}
          disabled={checkoutLoading}
        >
          {checkoutLoading ? 'Processing' : 'Payment'}
        </Button>
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
                const w = window.open('', '_blank', 'width=380,height=720');
                if (w) {
                  w.document.write(buildPrintHtml(data));
                  w.document.close();
                }
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

  return pageContent;
}
