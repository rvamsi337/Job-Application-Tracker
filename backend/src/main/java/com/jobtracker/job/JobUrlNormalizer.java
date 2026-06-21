package com.jobtracker.job;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class JobUrlNormalizer {

    public String normalize(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            throw new IllegalArgumentException("URL cannot be blank");
        }

        try {
            URI uri = new URI(rawUrl.trim());
            String scheme = uri.getScheme();
            String host = uri.getHost();
            if (scheme == null || host == null) {
                throw new IllegalArgumentException("URL must include a valid scheme and host");
            }

            String normalizedPath = uri.getPath() == null || uri.getPath().isBlank() ? "/" : uri.getPath().replaceAll("/+$", "");
            if (normalizedPath.isBlank()) {
                normalizedPath = "/";
            }

            URI normalized = new URI(
                    scheme.toLowerCase(Locale.ROOT),
                    uri.getUserInfo(),
                    host.toLowerCase(Locale.ROOT),
                    uri.getPort(),
                    normalizedPath,
                    uri.getQuery(),
                    null
            );
            return normalized.toString();
        } catch (URISyntaxException exception) {
            throw new IllegalArgumentException("URL is invalid");
        }
    }
}
