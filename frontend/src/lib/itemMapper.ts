import type { ItemDto } from '@/types/api';

export type Product = {
  key: string;
  name: string;
  sku: string;
  category: string;
  categoryId: number;
  stock: number;
  sold: number;
  price: number;
  cost: number;
  supplier: string;
  status: 'Còn hàng' | 'Sắp hết' | 'Hết hàng' | 'Nguy cơ';
  expiry: string;
  imageUrl?: string;
  purchaseRatio: number;
  minimumStock: number;
  baseUomName?: string;
  purchaseUomName?: string;
};

const productImageUrls = {
  vinamilk: 'https://images.openfoodfacts.org/images/products/893/467/357/3399/front_en.3.400.jpg',
  thMilk: 'https://www.lottemart.vn/media/catalog/product/cache/75x75/8/9/8935217400126.jpg.webp',
  coca: 'https://images.openfoodfacts.org/images/products/544/900/005/4227/front_en.543.400.jpg',
  pepsi: 'https://images.openfoodfacts.org/images/products/406/213/901/7416/front_en.12.400.jpg',
  redbull: 'https://images.openfoodfacts.org/images/products/000/009/016/2909/front_en.122.400.jpg',
  lavie: 'https://images.openfoodfacts.org/images/products/893/500/580/0015/front_fr.3.400.jpg',
  g7: 'https://images.openfoodfacts.org/images/products/085/807/220/1289/front_en.8.400.jpg',
  haohao: 'https://images.openfoodfacts.org/images/products/893/456/313/8165/front_vi.38.400.jpg',
  rice: 'https://product.hstatic.net/1000288770/product/gao_neptune_st25_plus_lua_tom_tui_5kg_b44cb50445b942fc93a82b7bf881bb16_master.jpg',
  namNgu: 'https://product.hstatic.net/200000947769/product/nam-ngu-500ml-1_132c2977d38145429ecf30a8961b40ca_master.jpg',
  simply: 'https://product.hstatic.net/1000288770/product/dau_dau_nanh_nguyen_chat_simply_chai_1_lit_f3cc5777a1484a939dc054d60113cdbc_master.jpg',
  chocopie: 'https://orion.vn/media/unig5uxr/cp12p-original.png',
  omo: 'https://horeco.vn/cdn/shop/files/Nuoc-Giat-Omo-Matic-Cua-Tren-Sach-Sau-Vuot-Troi-2kg.jpg?v=1763612538&width=900',
  sunlight: 'https://images.openbeautyfacts.org/images/products/871/256/152/1048/front_fr.13.400.jpg',
  ps: 'https://images.openbeautyfacts.org/images/products/893/483/913/1739/front_en.3.400.jpg',
  clear: 'https://horeco.vn/cdn/shop/files/Dau-Goi-Clear-Men-Mat-Lanh-Bac-Ha-630G.jpg?v=1763611620&width=900',
  nan: 'https://images.openfoodfacts.org/images/products/761/303/564/6711/front_fr.8.400.jpg',
  huggies: 'https://media.bibomart.net/images/2025/1/22/1/origin/bim-ta-quan-huggies-tram-tra-skin-care-size-m-56-mieng-6-11kg-giao-bao-bi-ngau-nhien-1.jpg',
  panasonic: 'https://images.openproductsfacts.org/images/products/541/085/306/3674/front_en.20.400.jpg',
  doubleA: 'https://vanphongphamhl.vn/images/products/2024/06/21/large/giay-photo-double-a-a4-70gsm-13_1686653538_1718966205.jpg',
  pen: 'https://vanphongphamdankhue.com/images/stories/virtuemart/product/resized/027_400x400.jpg',
} as const;

const realProductImages: Record<string, string> = {
  'SUA-VNM-1L': productImageUrls.vinamilk,
  'SUA-TH-1L-ITDUONG': productImageUrls.thMilk,
  'COCA-330': productImageUrls.coca,
  'PEPSI-330': productImageUrls.pepsi,
  'REDBULL-250': productImageUrls.redbull,
  'LAVIE-500': productImageUrls.lavie,
  'COFFEE-G7': productImageUrls.g7,
  'MI-HAOHAO': productImageUrls.haohao,
  'GAO-ST25-5KG': productImageUrls.rice,
  'NUOC-MAM-NN': productImageUrls.namNgu,
  'DAU-SIMPLY-1L': productImageUrls.simply,
  'BANH-CHOCOPIE-12P': productImageUrls.chocopie,
  'BOT-GIAT-OMO': productImageUrls.omo,
  'SUNLIGHT-CHANH-750': productImageUrls.sunlight,
  'KDR-PS-180': productImageUrls.ps,
  'DAU-GOI-CLEAR-630': productImageUrls.clear,
  'SUA-BOT-NAN-800': productImageUrls.nan,
  'TA-BIM-HUGGIES-M56': productImageUrls.huggies,
  'PIN-AA-PANASONIC-4V': productImageUrls.panasonic,
  'GIAY-IN-A4-70G': productImageUrls.doubleA,
  'BUT-BI-TL-027': productImageUrls.pen,
};

function defaultProductImageUrl(itemCode?: string | null) {
  const slug = itemCode?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug ? `/media/items/${slug}.svg` : undefined;
}

function resolveProductImageUrl(item: ItemDto) {
  const code = item.itemCode?.trim().toUpperCase() ?? '';
  const realImage = realProductImages[code];
  if (realImage) {
    return realImage;
  }
  if (code.startsWith('SUA-TH')) return productImageUrls.thMilk;
  if (code.startsWith('SUA-BOT-NAN')) return productImageUrls.nan;
  if (code.startsWith('SUA') || code.startsWith('PROBI') || code.startsWith('PHO-MAI') || code.startsWith('BANH-FLAN') || code.startsWith('TRUNG')) {
    return productImageUrls.vinamilk;
  }
  if (code.startsWith('COCA')) return productImageUrls.coca;
  if (code.startsWith('PEPSI')) return productImageUrls.pepsi;
  if (code.startsWith('REDBULL') || code.startsWith('STING')) return productImageUrls.redbull;
  if (code.startsWith('LAVIE') || code.startsWith('AQUAFINA') || code.startsWith('TRA-') || code.startsWith('TEA-PLUS')) {
    return productImageUrls.lavie;
  }
  if (code.startsWith('COFFEE') || code.startsWith('NESCAFE')) return productImageUrls.g7;
  if (code.startsWith('MI-')) return productImageUrls.haohao;
  if (code.startsWith('GAO') || code.startsWith('NGU-COC') || code.startsWith('YEN-MACH') || code.startsWith('BOT-BANH') || code.startsWith('BOT-CHIEN')) {
    return productImageUrls.rice;
  }
  if (code.startsWith('NUOC-MAM') || code.startsWith('NUOC-TUONG') || code.startsWith('TUONG-OT') || code.startsWith('HAT-NEM')) {
    return productImageUrls.namNgu;
  }
  if (code.startsWith('DAU-SIMPLY') || code.startsWith('DAU-TUONG') || code.startsWith('DAU-CAI')) return productImageUrls.simply;
  if (code.startsWith('BANH-') || code.startsWith('KEO-') || code.startsWith('SNACK-')) return productImageUrls.chocopie;
  if (code.startsWith('BOT-GIAT') || code.startsWith('COMFORT')) return productImageUrls.omo;
  if (code.startsWith('SUNLIGHT') || code.startsWith('LIFEBUOY-HANDWASH')) return productImageUrls.sunlight;
  if (code.startsWith('KDR')) return productImageUrls.ps;
  if (code.startsWith('DAU-GOI') || code.startsWith('SUA-TAM')) return productImageUrls.clear;
  if (code.startsWith('XUC-XICH') || code.startsWith('CHA-GIO') || code.startsWith('CA-VIEN') || code.startsWith('BO-VIEN') || code.startsWith('KHOAI') || code.startsWith('DUMPLING')) {
    return productImageUrls.haohao;
  }
  if (code.startsWith('TA-BIM') || code.startsWith('KHAN-UOT') || code.startsWith('PHAN-ROM')) return productImageUrls.huggies;
  if (code.startsWith('PIN')) return productImageUrls.panasonic;
  if (code.startsWith('GIAY-IN') || code.startsWith('BONG-DEN') || code.startsWith('MANG-') || code.startsWith('GIAY-BAC')) {
    return productImageUrls.doubleA;
  }
  if (code.startsWith('BUT') || code.startsWith('VO-') || code.startsWith('BANG-KEO') || code.startsWith('BIEN-LAI')) {
    return productImageUrls.pen;
  }
  const imageUrl = item.imageUrl?.trim();
  if (!imageUrl || imageUrl.startsWith('/media/categories/')) {
    return defaultProductImageUrl(item.itemCode);
  }
  return imageUrl;
}

export function itemToProduct(item: ItemDto): Product {
  const qty = Number(item.totalAvailableQty ?? 0);
  const min = item.minimumStock ?? 0;
  let status: Product['status'] = 'Còn hàng';
  if (qty === 0) status = 'Hết hàng';
  else if (qty <= min) status = 'Sắp hết';

  let purchaseRatio = item.purchaseRatio ?? item.purchaseConversionRatio ?? 1;

  return {
    key: String(item.id),
    name: item.itemName,
    sku: item.itemCode,
    category: item.categoryName ?? 'Khác',
    categoryId: item.categoryId ?? 0,
    stock: qty,
    sold: Number(item.soldQty ?? 0),
    price: Number(item.sellingPrice),
    cost: Number(item.costPrice ?? 0),
    imageUrl: resolveProductImageUrl(item),
    supplier: '-',
    status,
    expiry: item.hasExpiry ? '-' : 'Không áp dụng',
    purchaseRatio,
    minimumStock: item.minimumStock ?? 0,
    baseUomName: item.baseUomName,
    purchaseUomName: item.purchaseUomName,
  };
}

export function statusTone(status: Product['status']): 'success' | 'warning' | 'danger' {
  if (status === 'Còn hàng') return 'success';
  if (status === 'Sắp hết') return 'warning';
  return 'danger';
}

export const formatMoney = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(value) + 'đ';
