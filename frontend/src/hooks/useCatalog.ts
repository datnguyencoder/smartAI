import * as React from 'react';
import { message as antdMessage } from 'antd';
import { itemToProduct, type Product } from '@/lib/itemMapper';
import { ordersToInvoices } from '@/lib/mappers/ordersToInvoices';
import { canAccessPage, canFetchOrders, normalizeRole } from '@/lib/permissions';
import {
  fetchCategories,
  fetchInventory,
  fetchItems,
  fetchLocations,
  fetchOrders,
  fetchSuppliers,
  fetchUoms,
} from '@/services/wmsApi';
import type { CategoryDto, LocationDto, OrderDto, SupplierDto, UomDto, UserDto } from '@/types/api';

function extractArray(data: unknown): unknown[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.items)) return obj.items;
  if (Array.isArray(obj.content)) return obj.content;
  if (Array.isArray(obj.data)) return obj.data;
  return [];
}

export function useCatalog(authUser: UserDto | null) {
  const [productsList, setProductsList] = React.useState<Product[]>([]);
  const [invoicesList, setInvoicesList] = React.useState<ReturnType<typeof ordersToInvoices>>([]);
  const [categories, setCategories] = React.useState<CategoryDto[]>([]);
  const [suppliers, setSuppliers] = React.useState<SupplierDto[]>([]);
  const [locations, setLocations] = React.useState<LocationDto[]>([]);
  const [uoms, setUoms] = React.useState<UomDto[]>([]);
  const [catalogLoading, setCatalogLoading] = React.useState(false);

  const clearCatalog = React.useCallback(() => {
    setProductsList([]);
    setInvoicesList([]);
    setCategories([]);
    setSuppliers([]);
    setLocations([]);
    setUoms([]);
  }, []);

  const reloadCatalog = React.useCallback(async () => {
    if (!authUser) return;
    setCatalogLoading(true);
    const role = normalizeRole(authUser.role);
    const ordersTask = canFetchOrders(role) ? fetchOrders() : Promise.resolve([]);

    try {
      const [items, orders, cats, sups, locs, uomList, inventoryList] = await Promise.all([
        fetchItems().catch(() => []),
        authUser && canAccessPage(authUser.role, 'invoices') ? ordersTask.catch(() => []) : Promise.resolve([]),
        fetchCategories().catch(() => []),
        authUser && canAccessPage(authUser.role, 'suppliers') ? fetchSuppliers().catch(() => []) : Promise.resolve([]),
        authUser && canAccessPage(authUser.role, 'locations') ? fetchLocations().catch(() => []) : Promise.resolve([]),
        fetchUoms().catch(() => []),
        // Luôn gọi (không gate theo trang 'inventory') — STAFF không có trang quản lý tồn kho
        // riêng nhưng vẫn cần SỐ TỒN THẬT để hiện đúng ở POS/Sản phẩm, nếu không productsList
        // dùng chung sẽ luôn có stock=0 cho STAFF dù backend đã cho phép gọi endpoint này.
        fetchInventory().catch(() => []),
      ]);

      const stockMap: Record<number, number> = {};
      extractArray(inventoryList).forEach((inv: any) => {
        stockMap[inv.itemId] = (stockMap[inv.itemId] || 0) + Number(inv.quantity || 0);
      });

      setProductsList(
        extractArray(items).map((item: any) => {
          const prod = itemToProduct(item);
          if (stockMap[item.id] !== undefined) {
            prod.stock = Math.round(stockMap[item.id]);
            if (prod.stock === 0) prod.status = 'Hết hàng';
            else if (prod.stock <= (item.minimumStock ?? 0)) prod.status = 'Sắp hết';
            else prod.status = 'Còn hàng';
          }
          return prod;
        })
      );
      setInvoicesList(ordersToInvoices(extractArray(orders) as OrderDto[]));
      setCategories(extractArray(cats) as CategoryDto[]);
      setSuppliers(extractArray(sups) as SupplierDto[]);
      setLocations(extractArray(locs) as LocationDto[]);
      setUoms(extractArray(uomList) as UomDto[]);
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Không tải được dữ liệu API');
    } finally {
      setCatalogLoading(false);
    }
  }, [authUser]);

  return {
    productsList,
    invoicesList,
    categories,
    suppliers,
    locations,
    uoms,
    catalogLoading,
    reloadCatalog,
    clearCatalog,
  };
}
