package com.smartmart.service.ai;


public final class AiTextSanitizer {

    public static final String STYLE_RULES = """
            Quy tắc định dạng (bắt buộc):
            - Trả lời bằng tiếng Việt, văn phong chuyên nghiệp, ngắn gọn.
            - Dùng Markdown đơn giản (tiêu đề, danh sách, in đậm) khi cần.
            - TUYỆT ĐỐI không dùng emoji, biểu tượng cảm xúc, icon (ví dụ: rocket, checkmark, box).
            - Không dùng ký tự trang trí hoặc bullet đặc biệt; chỉ dùng - hoặc số cho danh sách.
            """;

    /**
     * Dùng cho các nơi hiển thị kết quả AI dưới dạng văn bản thuần (không qua MarkdownMessage) —
     * ví dụ ô "lý do" trong bảng đề xuất khuyến mãi. Nếu dùng STYLE_RULES thông thường, Gemini
     * hay trả về tiêu đề "##", gạch đầu dòng "-", in đậm "**" mà nơi hiển thị không render Markdown
     * sẽ hiện nguyên các ký tự đó ra màn hình, trông như lỗi định dạng.
     */
    public static final String PLAIN_TEXT_STYLE_RULES = """
            Quy tắc định dạng (bắt buộc):
            - Trả lời bằng tiếng Việt, văn phong chuyên nghiệp, súc tích, tối đa 2-3 câu.
            - CHỈ trả lời bằng đoạn văn thuần tuý — không dùng tiêu đề (#), danh sách gạch đầu
              dòng/số thứ tự, in đậm (**) hay bất kỳ ký hiệu Markdown nào, vì nội dung này hiển
              thị trong 1 ô văn bản ngắn, không phải khung chat có thể render Markdown.
            - TUYỆT ĐỐI không dùng emoji, biểu tượng cảm xúc, icon.
            """;

    private AiTextSanitizer() {
    }

    public static String sanitize(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }
        StringBuilder cleaned = new StringBuilder(text.length());
        for (int i = 0; i < text.length(); ) {
            int codePoint = text.codePointAt(i);
            if (!isEmojiOrDecorativeIcon(codePoint)) {
                cleaned.appendCodePoint(codePoint);
            }
            i += Character.charCount(codePoint);
        }
        return cleaned.toString().replaceAll("[ \\t]{2,}", " ").trim();
    }

    private static boolean isEmojiOrDecorativeIcon(int codePoint) {
        if (codePoint == 0xFE0F || codePoint == 0x200D) {
            return true;
        }
        if (codePoint >= 0x1F300 && codePoint <= 0x1FAFF) {
            return true;
        }
        if (codePoint >= 0x2600 && codePoint <= 0x27BF) {
            return true;
        }
        if (codePoint >= 0x231A && codePoint <= 0x23FF) {
            return true;
        }
        if (codePoint >= 0x2B50 && codePoint <= 0x2B55) {
            return true;
        }
        return false;
    }
}
