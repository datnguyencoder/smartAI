import { API_BASE_URL } from '@/lib/env';
import { apiDownloadBlob, apiRequest } from '@/services/apiClient';
import type {
  CategoryDto,
  ItemDto,
  ItemLotDto,
  LocationDto,
  PageResponseDto,
  SupplierDto,
  UomDto,
} from '@/types/api';

export function fetchItems(search?: string, categoryId?: number) {
  const params = new URLSearchParams();
  if (search) params.set('q', search);
  if (categoryId) params.set('categoryId', String(categoryId));
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<ItemDto[]>(`/api/v1/items${query}`);
}

export function fetchItemsPaged(page = 0, size = 50, search?: string) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (search) params.set('q', search);
  return apiRequest<PageResponseDto<ItemDto>>(`/api/v1/items?${params}`);
}

export function fetchItemByBarcode(barcode: string) {
  return apiRequest<ItemDto>(`/api/v1/items?barcode=${encodeURIComponent(barcode.trim())}`);
}

export function createItem(payload: {
  itemCode: string;
  itemName: string;
  categoryId?: number;
  baseUomId: number;
  purchaseUomId?: number;
  costPrice: number;
  sellingPrice: number;
  minimumStock?: number;
  hasExpiry?: boolean;
  imageUrl?: string;
}) {
  return apiRequest<ItemDto>('/api/v1/items', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateItem(
  id: number,
  payload: {
    itemCode?: string;
    itemName?: string;
    categoryId?: number;
    costPrice?: number;
    sellingPrice?: number;
    minimumStock?: number;
    hasExpiry?: boolean;
    imageUrl?: string;
  }
) {
  return apiRequest<ItemDto>(`/api/v1/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function fetchCategories() {
  return apiRequest<CategoryDto[]>('/api/v1/categories');
}

export function fetchSuppliers() {
  return apiRequest<SupplierDto[]>('/api/v1/suppliers');
}

export function createSupplier(payload: {
  supplierName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}) {
  return apiRequest<SupplierDto>('/api/v1/suppliers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateSupplier(id: number, payload: Partial<SupplierDto>) {
  return apiRequest<SupplierDto>(`/api/v1/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function fetchLocations() {
  return apiRequest<LocationDto[]>('/api/v1/locations');
}

export function updateLocation(id: number, payload: Partial<LocationDto>) {
  return apiRequest<LocationDto>(`/api/v1/locations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function fetchUoms() {
  return apiRequest<UomDto[]>('/api/v1/uoms');
}

export function getBarcodeLabelUrl(itemId: number) {
  return `${API_BASE_URL}/api/v1/items/${itemId}/barcode-label`;
}

export function downloadBarcodeLabel(itemId: number) {
  return apiDownloadBlob(`/api/v1/items/${itemId}/barcode-label`);
}

export function fetchItemLots(itemId?: number, lotNumber?: string) {
  const params = new URLSearchParams();
  if (itemId) params.set('itemId', String(itemId));
  if (lotNumber) params.set('lotNumber', lotNumber);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<ItemLotDto[]>(`/api/v1/item-lots${qs}`);
}

export function fetchItemLotById(id: number) {
  return apiRequest<ItemLotDto>(`/api/v1/item-lots/${id}`);
}
