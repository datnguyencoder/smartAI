package com.smartmart.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.common.BitMatrix;

import java.util.HashMap;
import java.util.Map;

public class BarcodeGeneratorUtil {

    /**
     * Sinh các thẻ <rect> đại diện cho các sọc đen của mã vạch Code 128.
     *
     * @param text   Chuỗi cần mã hóa thành mã vạch.
     * @param width  Chiều rộng của vùng mã vạch (px).
     * @param height Chiều cao của sọc mã vạch (px).
     * @return Chuỗi chứa các thẻ <rect x="..." y="..." width="..." height="..." fill="black" />
     */
    public static String generateCode128SVG(String text, int width, int height) {
        try {
            MultiFormatWriter writer = new MultiFormatWriter();
            
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.MARGIN, 0); // Tối ưu không gian nhãn, không chèn margin thừa bên trong ZXing
            
            BitMatrix bitMatrix = writer.encode(text, BarcodeFormat.CODE_128, width, height, hints);

            int matrixWidth = bitMatrix.getWidth();
            StringBuilder svgRects = new StringBuilder();

            boolean inBar = false;
            int barStart = 0;

            for (int x = 0; x < matrixWidth; x++) {
                boolean isBlack = bitMatrix.get(x, 0);
                if (isBlack) {
                    if (!inBar) {
                        inBar = true;
                        barStart = x;
                    }
                } else {
                    if (inBar) {
                        inBar = false;
                        int barWidth = x - barStart;
                        svgRects.append(String.format("  <rect x=\"%d\" y=\"0\" width=\"%d\" height=\"%d\" fill=\"black\" />\n", barStart, barWidth, height));
                    }
                }
            }
            if (inBar) {
                int barWidth = matrixWidth - barStart;
                svgRects.append(String.format("  <rect x=\"%d\" y=\"0\" width=\"%d\" height=\"%d\" fill=\"black\" />\n", barStart, barWidth, height));
            }

            return svgRects.toString();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi sinh barcode Code 128: " + e.getMessage(), e);
        }
    }
}
