import type { Product } from '@/lib/itemMapper';

const IMAGE_BASE =
  'https://images.unsplash.com';

const POS_IMAGE_BY_SKU: Record<string, string> = {
  'SUA-VNM-1L': `${IMAGE_BASE}/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=360&q=80`,
  'SUA-VNM-1L-ITDUONG': `${IMAGE_BASE}/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=360&q=80`,
  'SUA-VNM-1L-KDUONG': `${IMAGE_BASE}/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=360&q=80`,
  'SUA-TH-1L-ITDUONG': `${IMAGE_BASE}/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=360&q=80`,
  'SUA-DALAT-1L': `${IMAGE_BASE}/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=360&q=80`,
  'SUA-CHUA-VNM': `${IMAGE_BASE}/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=360&q=80`,
  'SUA-CHUA-VNM-NHA-DAM': `${IMAGE_BASE}/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=360&q=80`,
  'SUA-CHUA-TH-LOC4': `${IMAGE_BASE}/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=360&q=80`,
  'PROBI-65ML-LOC5': `${IMAGE_BASE}/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=360&q=80`,
  'PHO-MAI-BELCUBE': `${IMAGE_BASE}/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=360&q=80`,
  'BANH-FLAN-4H': `${IMAGE_BASE}/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=360&q=80`,
  'COCA-330': `${IMAGE_BASE}/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=360&q=80`,
  'COCA-ZERO-330': `${IMAGE_BASE}/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=360&q=80`,
  'COCA-LIGHT-330': `${IMAGE_BASE}/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=360&q=80`,
  'PEPSI-330': `${IMAGE_BASE}/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=360&q=80`,
  'REDBULL-250': `${IMAGE_BASE}/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=360&q=80`,
  'STING-DAU-330': `${IMAGE_BASE}/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=360&q=80`,
  'TRA-XANH-0': `${IMAGE_BASE}/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=360&q=80`,
  'TEA-PLUS-450': `${IMAGE_BASE}/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=360&q=80`,
  'LAVIE-500': `${IMAGE_BASE}/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=360&q=80`,
  'LAVIE-1500': `${IMAGE_BASE}/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=360&q=80`,
  'AQUAFINA-500': `${IMAGE_BASE}/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=360&q=80`,
  'COFFEE-G7': `${IMAGE_BASE}/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=360&q=80`,
  'COFFEE-G7-DEN': `${IMAGE_BASE}/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=360&q=80`,
  'NESCAFE-3IN1': `${IMAGE_BASE}/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=360&q=80`,
  'MI-HAOHAO': `${IMAGE_BASE}/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=360&q=80`,
  'MI-HAOHAO-TOM': `${IMAGE_BASE}/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=360&q=80`,
  'MI-HAOHAO-SA-TE': `${IMAGE_BASE}/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=360&q=80`,
  'MI-HAOHAO-GA-VANG': `${IMAGE_BASE}/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=360&q=80`,
  'MI-HAOHAO-XAO-TOM-HANH': `${IMAGE_BASE}/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=360&q=80`,
  'MI-OMACHI': `${IMAGE_BASE}/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=360&q=80`,
  'MI-OMACHI-BO-HAM': `${IMAGE_BASE}/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=360&q=80`,
  'MI-KOKOMI-90': `${IMAGE_BASE}/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=360&q=80`,
  'GAO-ST25-5KG': `${IMAGE_BASE}/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=360&q=80`,
  'GAO-JASMINE-5KG': `${IMAGE_BASE}/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=360&q=80`,
  'GAO-NANG-HOA-5KG': `${IMAGE_BASE}/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=360&q=80`,
  'NUOC-MAM-NN': `${IMAGE_BASE}/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=360&q=80`,
  'NUOC-MAM-NN-750': `${IMAGE_BASE}/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=360&q=80`,
  'NUOC-TUONG-CHINSU': `${IMAGE_BASE}/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=360&q=80`,
  'TUONG-OT-CHINSU': `${IMAGE_BASE}/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=360&q=80`,
  'HAT-NEM-KNORR-400': `${IMAGE_BASE}/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=360&q=80`,
  'DAU-SIMPLY-1L': `${IMAGE_BASE}/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=360&q=80`,
  'DAU-TUONG-SIMPLY-1L': `${IMAGE_BASE}/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=360&q=80`,
  'DAU-CAI-TUONG-AN-1L': `${IMAGE_BASE}/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=360&q=80`,
  'BANH-OISHI': `${IMAGE_BASE}/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=360&q=80`,
  'BANH-OISHI-BAP-NGOT': `${IMAGE_BASE}/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=360&q=80`,
  'BANH-CHOCOPIE-12P': `${IMAGE_BASE}/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=360&q=80`,
  'BANH-CUSTAS-12P': `${IMAGE_BASE}/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=360&q=80`,
  'KEO-ALPENLIEBE': `${IMAGE_BASE}/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=360&q=80`,
  'KEO-ALPENLIEBE-DAU': `${IMAGE_BASE}/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=360&q=80`,
  'SNACK-LAYS': `${IMAGE_BASE}/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=360&q=80`,
  'SNACK-LAYS-BBQ': `${IMAGE_BASE}/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=360&q=80`,
  'SNACK-POCA-MUC': `${IMAGE_BASE}/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=360&q=80`,
  'BOT-GIAT-OMO': `${IMAGE_BASE}/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=360&q=80`,
  'BOT-GIAT-OMO-FRONT-2KG': `${IMAGE_BASE}/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=360&q=80`,
  'SUNLIGHT-CHANH-750': `${IMAGE_BASE}/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=360&q=80`,
  'COMFORT-800': `${IMAGE_BASE}/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=360&q=80`,
  'LIFEBUOY-HANDWASH-450': `${IMAGE_BASE}/photo-1583947581924-860bda6a26df?auto=format&fit=crop&w=360&q=80`,
  'KDR-PS-180': `${IMAGE_BASE}/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=360&q=80`,
  'KDR-PS-MUOI-180': `${IMAGE_BASE}/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=360&q=80`,
  'KDR-COLGATE-180': `${IMAGE_BASE}/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=360&q=80`,
  'DAU-GOI-CLEAR-630': `${IMAGE_BASE}/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=360&q=80`,
  'SUA-TAM-LIFEBUOY-850': `${IMAGE_BASE}/photo-1583947581924-860bda6a26df?auto=format&fit=crop&w=360&q=80`,
  'XUC-XICH-CP-500': `${IMAGE_BASE}/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=360&q=80`,
  'CHA-GIO-CP-500': `${IMAGE_BASE}/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=360&q=80`,
  'CA-VIEN-VISSAN-500': `${IMAGE_BASE}/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=360&q=80`,
  'BO-VIEN-VISSAN-500': `${IMAGE_BASE}/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=360&q=80`,
  'KHOAI-TAY-DL-1KG': `${IMAGE_BASE}/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=360&q=80`,
  'DUMPLING-HQ-500': `${IMAGE_BASE}/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=360&q=80`,
  'TRUNG-GA-HOP10': `${IMAGE_BASE}/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=360&q=80`,
  'TRUNG-VIT-HOP10': `${IMAGE_BASE}/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=360&q=80`,
  'SUA-BOT-DIELAC-900': `${IMAGE_BASE}/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=360&q=80`,
  'SUA-BOT-NAN-800': `${IMAGE_BASE}/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=360&q=80`,
  'TA-BIM-HUGGIES-M56': `${IMAGE_BASE}/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=360&q=80`,
  'TA-BIM-BOBBY-L46': `${IMAGE_BASE}/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=360&q=80`,
  'KHAN-UOT-MAMYPOKO-80': `${IMAGE_BASE}/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=360&q=80`,
  'PHAN-ROM-JOHNSON-200': `${IMAGE_BASE}/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=360&q=80`,
  'PIN-AA-PANASONIC-4V': `${IMAGE_BASE}/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=360&q=80`,
  'PIN-AAA-ENERGIZER-4V': `${IMAGE_BASE}/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=360&q=80`,
  'BONG-DEN-DQ-9W': `${IMAGE_BASE}/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=360&q=80`,
  'BONG-DEN-RANGDONG-12W': `${IMAGE_BASE}/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=360&q=80`,
  'MANG-BOC-TP-30CM': `${IMAGE_BASE}/photo-1584473457409-cea5f9bce06f?auto=format&fit=crop&w=360&q=80`,
  'GIAY-BAC-FOIL-5M': `${IMAGE_BASE}/photo-1584473457409-cea5f9bce06f?auto=format&fit=crop&w=360&q=80`,
  'BUT-BI-TL-027': `${IMAGE_BASE}/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=360&q=80`,
  'BUT-GEL-FLEXOFFICE': `${IMAGE_BASE}/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=360&q=80`,
  'VO-HOC-SINH-96T': `${IMAGE_BASE}/photo-1517842645767-c639042777db?auto=format&fit=crop&w=360&q=80`,
  'BANG-KEO-TRONG-5CM': `${IMAGE_BASE}/photo-1586282391129-76a6df230234?auto=format&fit=crop&w=360&q=80`,
  'GIAY-IN-A4-70G': `${IMAGE_BASE}/photo-1586282391129-76a6df230234?auto=format&fit=crop&w=360&q=80`,
  'BIEN-LAI-2LIEN': `${IMAGE_BASE}/photo-1586282391129-76a6df230234?auto=format&fit=crop&w=360&q=80`,
  'NGU-COC-CALBEE-700': `${IMAGE_BASE}/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=360&q=80`,
  'YEN-MACH-QUAKER-600': `${IMAGE_BASE}/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=360&q=80`,
  'BOT-BANH-XEO-400': `${IMAGE_BASE}/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=360&q=80`,
  'BOT-CHIEN-GION-150': `${IMAGE_BASE}/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=360&q=80`,
};

const POS_IMAGE_BY_CATEGORY: Record<string, string> = {
  drink: `${IMAGE_BASE}/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=360&q=80`,
  dairy: `${IMAGE_BASE}/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=360&q=80`,
  dryFood: `${IMAGE_BASE}/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=360&q=80`,
  condiment: `${IMAGE_BASE}/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=360&q=80`,
  snack: `${IMAGE_BASE}/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=360&q=80`,
  cleaning: `${IMAGE_BASE}/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=360&q=80`,
  personalCare: `${IMAGE_BASE}/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=360&q=80`,
  frozen: `${IMAGE_BASE}/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=360&q=80`,
  baby: `${IMAGE_BASE}/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=360&q=80`,
  home: `${IMAGE_BASE}/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=360&q=80`,
  stationery: `${IMAGE_BASE}/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=360&q=80`,
  grocery: `${IMAGE_BASE}/photo-1542838132-92c53300491e?auto=format&fit=crop&w=360&q=80`,
};

function normalizeText(value?: string) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isGeneratedMediaPlaceholder(url?: string) {
  return !url || /^\/?media\/(items|categories)\/[^?]+\.svg$/i.test(url.trim());
}

function categoryImageKey(product: Product) {
  const text = normalizeText(`${product.category} ${product.name} ${product.sku}`);
  if (/(sua|yogurt|chua|probi|pho mai|flan|trung)/.test(text)) return 'dairy';
  if (/(do uong|nuoc|coca|pepsi|sting|tra|coffee|cafe|redbull)/.test(text)) return 'drink';
  if (/(mi |gao|ngu coc|yen mach|bot |thuc pham kho)/.test(text)) return 'dryFood';
  if (/(gia vi|nuoc mam|nuoc tuong|tuong ot|hat nem|dau an|simply)/.test(text)) return 'condiment';
  if (/(snack|banh|keo|oishi|lays|poca|chocopie|custas)/.test(text)) return 'snack';
  if (/(ve sinh|bot giat|rua chen|comfort|handwash)/.test(text)) return 'cleaning';
  if (/(cham soc|kem danh rang|dau goi|sua tam)/.test(text)) return 'personalCare';
  if (/(dong lanh|xuc xich|cha gio|ca vien|bo vien|khoai|dumpling)/.test(text)) return 'frozen';
  if (/(me va be|sua bot|ta bim|khan uot|phan rom)/.test(text)) return 'baby';
  if (/(gia dung|pin|bong den|mang boc|giay bac)/.test(text)) return 'home';
  if (/(van phong|but|vo|bang keo|giay in|bien lai)/.test(text)) return 'stationery';
  return 'grocery';
}

export function resolvePosProductImage(product: Product) {
  const imageUrl = product.imageUrl?.trim();
  if (imageUrl && !isGeneratedMediaPlaceholder(imageUrl)) {
    return imageUrl;
  }

  const sku = product.sku.trim().toUpperCase();
  return POS_IMAGE_BY_SKU[sku] ?? POS_IMAGE_BY_CATEGORY[categoryImageKey(product)];
}

export function formatPlainNumber(value?: string | number | null) {
  const numeric = Number(String(value ?? '').replace(/[^\d-]/g, ''));
  if (!Number.isFinite(numeric)) return '';
  return new Intl.NumberFormat('vi-VN').format(numeric);
}

export function parseFormattedNumber(value?: string) {
  const numeric = Number((value ?? '').replace(/[^\d-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

export const moneyInputFormatter = (value?: string | number) => formatPlainNumber(value);
export const moneyInputParser = (value?: string) => parseFormattedNumber(value);
