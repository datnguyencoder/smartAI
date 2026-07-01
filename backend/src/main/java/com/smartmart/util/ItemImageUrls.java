package com.smartmart.util;

import com.smartmart.entity.Category;
import com.smartmart.entity.Item;

import java.util.Map;

public final class ItemImageUrls {

    public static final String DEFAULT_CATEGORY = "/media/categories/default.svg";
    private static final String IMG_VINAMILK = "https://images.openfoodfacts.org/images/products/893/467/357/3399/front_en.3.400.jpg";
    private static final String IMG_TH_MILK = "https://www.lottemart.vn/media/catalog/product/cache/75x75/8/9/8935217400126.jpg.webp";
    private static final String IMG_COCA = "https://images.openfoodfacts.org/images/products/544/900/005/4227/front_en.543.400.jpg";
    private static final String IMG_PEPSI = "https://images.openfoodfacts.org/images/products/406/213/901/7416/front_en.12.400.jpg";
    private static final String IMG_REDBULL = "https://images.openfoodfacts.org/images/products/000/009/016/2909/front_en.122.400.jpg";
    private static final String IMG_LAVIE = "https://images.openfoodfacts.org/images/products/893/500/580/0015/front_fr.3.400.jpg";
    private static final String IMG_G7 = "https://images.openfoodfacts.org/images/products/085/807/220/1289/front_en.8.400.jpg";
    private static final String IMG_HAOHAO = "https://images.openfoodfacts.org/images/products/893/456/313/8165/front_vi.38.400.jpg";
    private static final String IMG_RICE = "https://product.hstatic.net/1000288770/product/gao_neptune_st25_plus_lua_tom_tui_5kg_b44cb50445b942fc93a82b7bf881bb16_master.jpg";
    private static final String IMG_NAMNGU = "https://product.hstatic.net/200000947769/product/nam-ngu-500ml-1_132c2977d38145429ecf30a8961b40ca_master.jpg";
    private static final String IMG_SIMPLY = "https://product.hstatic.net/1000288770/product/dau_dau_nanh_nguyen_chat_simply_chai_1_lit_f3cc5777a1484a939dc054d60113cdbc_master.jpg";
    private static final String IMG_CHOCOPIE = "https://orion.vn/media/unig5uxr/cp12p-original.png";
    private static final String IMG_OMO = "https://horeco.vn/cdn/shop/files/Nuoc-Giat-Omo-Matic-Cua-Tren-Sach-Sau-Vuot-Troi-2kg.jpg?v=1763612538&width=900";
    private static final String IMG_SUNLIGHT = "https://images.openbeautyfacts.org/images/products/871/256/152/1048/front_fr.13.400.jpg";
    private static final String IMG_PS = "https://images.openbeautyfacts.org/images/products/893/483/913/1739/front_en.3.400.jpg";
    private static final String IMG_CLEAR = "https://horeco.vn/cdn/shop/files/Dau-Goi-Clear-Men-Mat-Lanh-Bac-Ha-630G.jpg?v=1763611620&width=900";
    private static final String IMG_NAN = "https://images.openfoodfacts.org/images/products/761/303/564/6711/front_fr.8.400.jpg";
    private static final String IMG_HUGGIES = "https://media.bibomart.net/images/2025/1/22/1/origin/bim-ta-quan-huggies-tram-tra-skin-care-size-m-56-mieng-6-11kg-giao-bao-bi-ngau-nhien-1.jpg";
    private static final String IMG_PANASONIC = "https://images.openproductsfacts.org/images/products/541/085/306/3674/front_en.20.400.jpg";
    private static final String IMG_DOUBLE_A = "https://vanphongphamhl.vn/images/products/2024/06/21/large/giay-photo-double-a-a4-70gsm-13_1686653538_1718966205.jpg";
    private static final String IMG_PEN = "https://vanphongphamdankhue.com/images/stories/virtuemart/product/resized/027_400x400.jpg";
    private static final Map<String, String> REAL_PRODUCT_IMAGES = Map.ofEntries(
            Map.entry("SUA-VNM-1L", IMG_VINAMILK),
            Map.entry("SUA-TH-1L-ITDUONG", IMG_TH_MILK),
            Map.entry("COCA-330", IMG_COCA),
            Map.entry("PEPSI-330", IMG_PEPSI),
            Map.entry("REDBULL-250", IMG_REDBULL),
            Map.entry("LAVIE-500", IMG_LAVIE),
            Map.entry("COFFEE-G7", IMG_G7),
            Map.entry("MI-HAOHAO", IMG_HAOHAO),
            Map.entry("GAO-ST25-5KG", IMG_RICE),
            Map.entry("NUOC-MAM-NN", IMG_NAMNGU),
            Map.entry("DAU-SIMPLY-1L", IMG_SIMPLY),
            Map.entry("BANH-CHOCOPIE-12P", IMG_CHOCOPIE),
            Map.entry("BOT-GIAT-OMO", IMG_OMO),
            Map.entry("SUNLIGHT-CHANH-750", IMG_SUNLIGHT),
            Map.entry("KDR-PS-180", IMG_PS),
            Map.entry("DAU-GOI-CLEAR-630", IMG_CLEAR),
            Map.entry("SUA-BOT-NAN-800", IMG_NAN),
            Map.entry("TA-BIM-HUGGIES-M56", IMG_HUGGIES),
            Map.entry("PIN-AA-PANASONIC-4V", IMG_PANASONIC),
            Map.entry("GIAY-IN-A4-70G", IMG_DOUBLE_A),
            Map.entry("BUT-BI-TL-027", IMG_PEN)
    );

    private ItemImageUrls() {}

    public static String sanitizeCode(String itemCode) {
        if (itemCode == null || itemCode.isBlank()) {
            return "item";
        }
        return itemCode.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }

    public static String defaultItemPath(String itemCode) {
        return "/media/items/" + sanitizeCode(itemCode) + ".svg";
    }

    public static String realProductImage(String itemCode) {
        if (itemCode == null || itemCode.isBlank()) {
            return null;
        }
        String code = itemCode.trim().toUpperCase();
        String exact = REAL_PRODUCT_IMAGES.get(code);
        if (exact != null) return exact;

        if (code.startsWith("SUA-TH")) return IMG_TH_MILK;
        if (code.startsWith("SUA-BOT-NAN")) return IMG_NAN;
        if (code.startsWith("SUA") || code.startsWith("PROBI") || code.startsWith("PHO-MAI")
                || code.startsWith("BANH-FLAN") || code.startsWith("TRUNG")) return IMG_VINAMILK;
        if (code.startsWith("COCA")) return IMG_COCA;
        if (code.startsWith("PEPSI")) return IMG_PEPSI;
        if (code.startsWith("REDBULL") || code.startsWith("STING")) return IMG_REDBULL;
        if (code.startsWith("LAVIE") || code.startsWith("AQUAFINA") || code.startsWith("TRA-")
                || code.startsWith("TEA-PLUS")) return IMG_LAVIE;
        if (code.startsWith("COFFEE") || code.startsWith("NESCAFE")) return IMG_G7;
        if (code.startsWith("MI-")) return IMG_HAOHAO;
        if (code.startsWith("GAO") || code.startsWith("NGU-COC") || code.startsWith("YEN-MACH")
                || code.startsWith("BOT-BANH") || code.startsWith("BOT-CHIEN")) return IMG_RICE;
        if (code.startsWith("NUOC-MAM") || code.startsWith("NUOC-TUONG") || code.startsWith("TUONG-OT")
                || code.startsWith("HAT-NEM")) return IMG_NAMNGU;
        if (code.startsWith("DAU-SIMPLY") || code.startsWith("DAU-TUONG") || code.startsWith("DAU-CAI")) return IMG_SIMPLY;
        if (code.startsWith("BANH-") || code.startsWith("KEO-") || code.startsWith("SNACK-")) return IMG_CHOCOPIE;
        if (code.startsWith("BOT-GIAT") || code.startsWith("COMFORT")) return IMG_OMO;
        if (code.startsWith("SUNLIGHT") || code.startsWith("LIFEBUOY-HANDWASH")) return IMG_SUNLIGHT;
        if (code.startsWith("KDR")) return IMG_PS;
        if (code.startsWith("DAU-GOI") || code.startsWith("SUA-TAM")) return IMG_CLEAR;
        if (code.startsWith("XUC-XICH") || code.startsWith("CHA-GIO") || code.startsWith("CA-VIEN")
                || code.startsWith("BO-VIEN") || code.startsWith("KHOAI") || code.startsWith("DUMPLING")) return IMG_HAOHAO;
        if (code.startsWith("TA-BIM") || code.startsWith("KHAN-UOT") || code.startsWith("PHAN-ROM")) return IMG_HUGGIES;
        if (code.startsWith("PIN")) return IMG_PANASONIC;
        if (code.startsWith("GIAY-IN") || code.startsWith("BONG-DEN") || code.startsWith("MANG-")
                || code.startsWith("GIAY-BAC")) return IMG_DOUBLE_A;
        if (code.startsWith("BUT") || code.startsWith("VO-") || code.startsWith("BANG-KEO")
                || code.startsWith("BIEN-LAI")) return IMG_PEN;
        return null;
    }

    public static String resolve(Item item) {
        if (item == null) {
            return DEFAULT_CATEGORY;
        }
        String realImage = realProductImage(item.getItemCode());
        if (realImage != null) {
            return realImage;
        }
        String itemPath = defaultItemPath(item.getItemCode());
        if (item.getImageUrl() != null && !item.getImageUrl().isBlank()) {
            String imageUrl = item.getImageUrl().trim();
            if (imageUrl.startsWith("/media/categories/")) {
                return itemPath;
            }
            return imageUrl;
        }
        return itemPath;
    }

    public static String resolveCategory(Category category) {
        if (category == null) {
            return DEFAULT_CATEGORY;
        }
        if (category.getImageUrl() != null && !category.getImageUrl().isBlank()) {
            return category.getImageUrl().trim();
        }
        return DEFAULT_CATEGORY;
    }
}
