# SmartAI - Frontend Concept Diagram (Updated)

Tôi đã phân tích trực tiếp mã nguồn `App.tsx` của Frontend và nhận thấy các Model (State) thực tế đang được sử dụng khác với hình ảnh ER ban đầu. Dưới đây là sơ đồ Concept Diagram chuẩn xác ánh xạ trực tiếp với cấu trúc dữ liệu hiện tại của Frontend.

## 1. Entity-Relationship Diagram (Biểu đồ ER thực tế theo State)

Biểu đồ này mô tả chính xác các Object/Type đang tồn tại trong `App.tsx` (`Product`, `Invoice`, `ImportSlip`, `POSCart`, `Promotion`, v.v.) và cách chúng liên kết với nhau:

```mermaid
erDiagram
    %% Các State chính trong App.tsx
    PRODUCT {
        string key PK
        string name
        string sku
        string category
        number stock
        number sold
        number price
        string supplier
        string status
        string expiry
    }

    INVOICE {
        string key PK
        string customer
        number amount
        string cashier
        string status
        string time
        number subtotal
        number discount
        number vat
    }

    INVOICE_ITEM {
        string name
        number qty
        number price
    }

    IMPORT_SLIP {
        string key PK
        string supplier
        number amount
        string status
        string time
    }

    POS_CART_ITEM {
        number quantity
    }

    PROMOTION {
        string productKey FK
        number discountPercent
    }

    AI_CHAT_MESSAGE {
        string sender
        string text
        object action
    }

    %% Các mối quan hệ thực tế
    INVOICE ||--o{ INVOICE_ITEM : "bao gồm (items)"
    PRODUCT ||--o{ INVOICE_ITEM : "lưu dưới dạng"
    PRODUCT ||--o{ POS_CART_ITEM : "được thêm vào giỏ (posCart)"
    PRODUCT ||--o| PROMOTION : "áp dụng khuyến mãi (activePromotions)"
    
    %% Các liên kết logic thông qua string field
    CATEGORY ||--o{ PRODUCT : "phân loại (category field)"
    SUPPLIER ||--o{ PRODUCT : "cung cấp (supplier field)"
    SUPPLIER ||--o{ IMPORT_SLIP : "giao hàng (supplier field)"
    CASHIER ||--o{ INVOICE : "thu ngân (cashier field)"
    CUSTOMER ||--o{ INVOICE : "khách hàng (customer field)"
```

## 2. System Flow / Logic Diagram (Luồng dữ liệu Frontend)

Sơ đồ này mô tả cách các tính năng trên màn hình tác động đến dữ liệu State:

```mermaid
graph TD
    subgraph App_States [React States trong App.tsx]
        productsList[(productsList)]
        invoicesList[(invoicesList)]
        importSlips[(importSlips)]
        activePromotions[(activePromotions)]
        posCart[(posCart)]
        chatHistory[(chatHistory)]
    end

    subgraph Features [Các module chính]
        POS[Bán hàng POS]
        Import[Nhập hàng & Tồn kho]
        AI[Trợ lý AI & Dự báo]
    end

    %% Flow bán hàng
    POS -->|Thêm SP vào giỏ| posCart
    posCart -.->|Cập nhật tồn kho| productsList
    POS -->|Thanh toán & Tạo| invoicesList
    POS -.->|Áp dụng giảm giá| activePromotions

    %% Flow nhập hàng
    Import -->|Tạo phiếu nhập| importSlips
    Import -.->|Duyệt & Tăng tồn| productsList
    
    %% Flow AI
    AI -->|Gợi ý giảm giá| activePromotions
    AI -->|Phân tích tồn & bán| productsList
    AI -->|Phân tích doanh thu| invoicesList
    chatHistory -->|Lưu hội thoại| AI
    
    classDef state fill:#f8fafc,stroke:#4648d4,stroke-width:2px;
    classDef feature fill:#e0e7ff,stroke:#10b981,stroke-width:2px;
    
    class productsList,invoicesList,importSlips,activePromotions,posCart,chatHistory state;
    class POS,Import,AI feature;
```
