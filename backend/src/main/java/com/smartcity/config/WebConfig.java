package com.smartcity.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,https://*.vercel.app,https://violet-turkeys-live.loca.lt,http://violet-turkeys-live.loca.lt,https://*.loca.lt}")
    private String[] allowedOrigins;

    @Value("${file.upload-dir:./uploads/reports}")
    private String uploadDirPath;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);

        registry.addMapping("/uploads/**")
                .allowedOriginPatterns(allowedOrigins)
                .allowedMethods("GET", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Expose uploaded report images from configured upload directory
        String uploadPath = Paths.get(uploadDirPath).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/uploads/reports/**")
                .addResourceLocations(uploadPath.endsWith("/") ? uploadPath : uploadPath + "/");
    }
}
