package com.smartmart.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springdoc.core.providers.ObjectMapperProvider;
import org.springdoc.core.properties.SwaggerUiConfigParameters;
import org.springdoc.core.properties.SwaggerUiConfigProperties;
import org.springdoc.core.properties.SwaggerUiOAuthProperties;
import org.springdoc.webmvc.ui.SwaggerIndexPageTransformer;
import org.springdoc.webmvc.ui.SwaggerWelcomeCommon;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.resource.ResourceTransformerChain;
import org.springframework.web.servlet.resource.TransformedResource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Swagger UI qua ngrok free cần header {@code ngrok-skip-browser-warning} trên mọi request,
 * nếu không browser nhận HTML cảnh báo → "Failed to fetch".
 */
@Configuration
public class NgrokSwaggerUiConfig {

    private static final String NGROK_INTERCEPTOR = """
            requestInterceptor: (req) => {
              if (!req.headers) req.headers = {};
              req.headers['ngrok-skip-browser-warning'] = 'true';
              return req;
            },
            """;

    private static final String FETCH_PATCH = """
            <script>
            (function() {
              const orig = window.fetch;
              window.fetch = function(input, init) {
                init = init || {};
                const h = new Headers(init.headers || {});
                h.set('ngrok-skip-browser-warning', 'true');
                init.headers = h;
                return orig(input, init);
              };
            })();
            </script>
            """;

    @Bean
    @Primary
    public SwaggerIndexPageTransformer swaggerIndexPageTransformer(
            SwaggerUiConfigProperties swaggerUiConfig,
            SwaggerUiOAuthProperties swaggerUiOAuthProperties,
            SwaggerUiConfigParameters swaggerUiConfigParameters,
            SwaggerWelcomeCommon swaggerWelcomeCommon,
            ObjectMapperProvider objectMapperProvider
    ) {
        return new SwaggerIndexPageTransformer(
                swaggerUiConfig,
                swaggerUiOAuthProperties,
                swaggerUiConfigParameters,
                swaggerWelcomeCommon,
                objectMapperProvider
        ) {
            @Override
            public Resource transform(
                    HttpServletRequest request,
                    Resource resource,
                    ResourceTransformerChain chain
            ) throws IOException {
                Resource transformed = super.transform(request, resource, chain);
                String filename = resource.getFilename();
                if (filename == null
                        || (!"index.html".equals(filename) && !"swagger-initializer.js".equals(filename))) {
                    return transformed;
                }
                try (InputStream inputStream = transformed.getInputStream()) {
                    String content = readFullyAsString(inputStream);
                    if ("swagger-initializer.js".equals(filename) && !content.contains("ngrok-skip-browser-warning")) {
                        content = content.replace("SwaggerUIBundle({", "SwaggerUIBundle({\n" + NGROK_INTERCEPTOR);
                    }
                    if ("index.html".equals(filename) && !content.contains("ngrok-skip-browser-warning")) {
                        content = content.replace("</head>", FETCH_PATCH + "\n  </head>");
                    }
                    return new TransformedResource(resource, content.getBytes(StandardCharsets.UTF_8));
                }
            }
        };
    }
}
