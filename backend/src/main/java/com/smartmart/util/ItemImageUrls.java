package com.smartmart.util;

import com.smartmart.entity.Category;
import com.smartmart.entity.Item;

public final class ItemImageUrls {

    public static final String DEFAULT_CATEGORY = "/media/categories/default.svg";

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

    public static String resolve(Item item) {
        if (item == null) {
            return DEFAULT_CATEGORY;
        }
        
        if (item.getImageUrl() != null && !item.getImageUrl().isBlank()) {
            return item.getImageUrl().trim();
        }
        
        return defaultItemPath(item.getItemCode());
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
