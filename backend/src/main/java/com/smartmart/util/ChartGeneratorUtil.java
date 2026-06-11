package com.smartmart.util;

import org.jfree.chart.ChartFactory;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.axis.CategoryAxis;
import org.jfree.chart.axis.NumberAxis;
import org.jfree.chart.plot.CategoryPlot;
import org.jfree.chart.plot.PiePlot;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.data.general.DefaultPieDataset;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Component
public class ChartGeneratorUtil {

    private Font titleFont;
    private Font regularFont;

    @PostConstruct
    public void initFonts() {
        try {
            String fontPath;
            try {
                fontPath = new ClassPathResource("fonts/Roboto-Regular.ttf").getFile().getAbsolutePath();
            } catch (Exception e) {
                // Fallback to copying classpath resource to temp file (for packaged JAR execution)
                java.nio.file.Path tempFile = java.nio.file.Files.createTempFile("Roboto-Regular-chart", ".ttf");
                try (java.io.InputStream is = new ClassPathResource("fonts/Roboto-Regular.ttf").getInputStream()) {
                    java.nio.file.Files.copy(is, tempFile, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                }
                fontPath = tempFile.toAbsolutePath().toString();
            }
            Font customFont = Font.createFont(Font.TRUETYPE_FONT, new java.io.File(fontPath));
            GraphicsEnvironment ge = GraphicsEnvironment.getLocalGraphicsEnvironment();
            ge.registerFont(customFont);
            this.titleFont = customFont.deriveFont(Font.BOLD, 14f);
            this.regularFont = customFont.deriveFont(Font.PLAIN, 12f);
        } catch (Exception e) {
            // Fallback
            this.titleFont = new Font("SansSerif", Font.BOLD, 14);
            this.regularFont = new Font("SansSerif", Font.PLAIN, 12);
        }
    }

    private static class VndNumberFormat extends java.text.NumberFormat {
        @Override
        public StringBuffer format(double number, StringBuffer toAppendTo, java.text.FieldPosition pos) {
            double abs = Math.abs(number);
            String suffix = "";
            double divisor = 1.0;
            
            if (abs >= 1_000_000_000) {
                suffix = " tỷ";
                divisor = 1_000_000_000.0;
            } else if (abs >= 1_000_000) {
                suffix = " tr";
                divisor = 1_000_000.0;
            } else if (abs >= 1_000) {
                suffix = " k";
                divisor = 1_000.0;
            }
            
            double val = number / divisor;
            if (val == (long) val) {
                toAppendTo.append(String.format("%,d%s", (long) val, suffix));
            } else {
                toAppendTo.append(String.format("%,.1f%s", val, suffix));
            }
            return toAppendTo;
        }

        @Override
        public StringBuffer format(long number, StringBuffer toAppendTo, java.text.FieldPosition pos) {
            return format((double) number, toAppendTo, pos);
        }

        @Override
        public Number parse(String source, java.text.ParsePosition parsePosition) {
            return null;
        }
    }

    private void applyStandardTheme(JFreeChart chart) {
        chart.getTitle().setFont(titleFont);
        if (chart.getLegend() != null) {
            chart.getLegend().setItemFont(regularFont);
        }
        
        if (chart.getPlot() instanceof CategoryPlot) {
            CategoryPlot plot = (CategoryPlot) chart.getPlot();
            plot.setBackgroundPaint(Color.WHITE);
            plot.setRangeGridlinePaint(Color.LIGHT_GRAY);
            plot.setOutlineVisible(false);
            
            CategoryAxis domainAxis = plot.getDomainAxis();
            domainAxis.setTickLabelFont(regularFont);
            domainAxis.setLabelFont(titleFont);
            
            NumberAxis rangeAxis = (NumberAxis) plot.getRangeAxis();
            rangeAxis.setTickLabelFont(regularFont);
            rangeAxis.setLabelFont(titleFont);
            rangeAxis.setNumberFormatOverride(new VndNumberFormat());
        } else if (chart.getPlot() instanceof PiePlot) {
            PiePlot plot = (PiePlot) chart.getPlot();
            plot.setBackgroundPaint(Color.WHITE);
            plot.setOutlineVisible(false);
            plot.setLabelFont(regularFont);
            plot.setShadowPaint(null);
        }
    }

    public byte[] createLineChart(String title, String categoryAxisLabel, String valueAxisLabel, DefaultCategoryDataset dataset, int width, int height) throws IOException {
        if (dataset.getColumnCount() == 0) return createEmptyChartImage(width, height);
        
        JFreeChart chart = ChartFactory.createLineChart(
                title, categoryAxisLabel, valueAxisLabel, dataset, PlotOrientation.VERTICAL, true, false, false);
        applyStandardTheme(chart);
        return chartToImageBytes(chart, width, height);
    }

    public byte[] createBarChart(String title, String categoryAxisLabel, String valueAxisLabel, DefaultCategoryDataset dataset, int width, int height) throws IOException {
        if (dataset.getColumnCount() == 0) return createEmptyChartImage(width, height);

        JFreeChart chart = ChartFactory.createBarChart(
                title, categoryAxisLabel, valueAxisLabel, dataset, PlotOrientation.VERTICAL, true, false, false);
        applyStandardTheme(chart);
        return chartToImageBytes(chart, width, height);
    }
    
    public byte[] createHorizontalBarChart(String title, String categoryAxisLabel, String valueAxisLabel, DefaultCategoryDataset dataset, int width, int height) throws IOException {
        if (dataset.getColumnCount() == 0) return createEmptyChartImage(width, height);

        JFreeChart chart = ChartFactory.createBarChart(
                title, categoryAxisLabel, valueAxisLabel, dataset, PlotOrientation.HORIZONTAL, false, false, false);
        applyStandardTheme(chart);
        return chartToImageBytes(chart, width, height);
    }

    public byte[] createDonutChart(String title, DefaultPieDataset dataset, int width, int height) throws IOException {
        if (dataset.getItemCount() == 0) return createEmptyChartImage(width, height);

        JFreeChart chart = ChartFactory.createRingChart(title, dataset, true, false, false);
        applyStandardTheme(chart);
        return chartToImageBytes(chart, width, height);
    }

    private byte[] chartToImageBytes(JFreeChart chart, int width, int height) throws IOException {
        // Optimize memory with TYPE_INT_RGB instead of ARGB
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2 = image.createGraphics();
        
        // Anti-aliasing
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        
        g2.setColor(Color.WHITE);
        g2.fillRect(0, 0, width, height);
        
        chart.draw(g2, new Rectangle(0, 0, width, height));
        g2.dispose();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }

    private byte[] createEmptyChartImage(int width, int height) throws IOException {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2 = image.createGraphics();
        g2.setColor(Color.WHITE);
        g2.fillRect(0, 0, width, height);
        g2.setColor(Color.GRAY);
        g2.setFont(regularFont);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        String msg = "Không có dữ liệu trong kỳ báo cáo";
        FontMetrics fm = g2.getFontMetrics();
        int x = (width - fm.stringWidth(msg)) / 2;
        int y = (height - fm.getHeight()) / 2 + fm.getAscent();
        g2.drawString(msg, x, y);
        g2.dispose();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }
}
