package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.service.MediaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

@RestController
@RequiredArgsConstructor
@Tag(name = "Media", description = "Media Upload API")
public class MediaController {

    private static final String[] PALETTE = {
            "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316", "#64748b"
    };

    private final MediaService mediaService;

    @Operation(summary = "Upload Image")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAREHOUSE')")
    @PostMapping(value = "/api/v1/media/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<String> uploadImage(@RequestPart("file") MultipartFile file) {
        String url = mediaService.uploadImage(file);
        return ApiResponse.success("Upload successful", url);
    }

    @GetMapping(value = "/media/items/{slug}.svg", produces = "image/svg+xml")
    public ResponseEntity<byte[]> itemImage(@PathVariable String slug) {
        return svg(slug, "SKU");
    }

    @GetMapping(value = "/media/categories/{slug}.svg", produces = "image/svg+xml")
    public ResponseEntity<byte[]> categoryImage(@PathVariable String slug) {
        return svg(slug, "CAT");
    }

    private ResponseEntity<byte[]> svg(String slug, String prefix) {
        String safeSlug = sanitize(slug);
        String label = label(prefix, safeSlug);
        String color = PALETTE[Math.floorMod(safeSlug.hashCode(), PALETTE.length)];
        String svg = """
                <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="%s">
                  <rect width="160" height="160" rx="24" fill="#f8fafc"/>
                  <rect x="16" y="16" width="128" height="128" rx="20" fill="%s" opacity="0.14"/>
                  <circle cx="112" cy="48" r="22" fill="%s" opacity="0.22"/>
                  <path d="M42 104h76v18H42zM50 78h60v18H50zM60 52h40v18H60z" fill="%s"/>
                  <text x="80" y="139" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#0f172a">%s</text>
                </svg>
                """.formatted(label, color, color, color, label);

        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("image/svg+xml"))
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                .body(svg.getBytes(StandardCharsets.UTF_8));
    }

    private String sanitize(String value) {
        if (value == null || value.isBlank()) {
            return "default";
        }
        String sanitized = value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9-]", "-").replaceAll("^-+|-+$", "");
        return sanitized.isBlank() ? "default" : sanitized;
    }

    private String label(String prefix, String slug) {
        String compact = slug.replace("-", "");
        String suffix = compact.length() <= 3 ? compact : compact.substring(0, 3);
        return (prefix + "-" + suffix).toUpperCase(Locale.ROOT);
    }
}
