package com.jobtracker.job;

import java.net.URI;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class CompanyNameExtractor {

    private static final Set<String> GENERIC_HOST_PARTS = new HashSet<>(Arrays.asList(
            "www", "jobs", "careers", "boards", "apply", "job", "greenhouse", "lever", "myworkdayjobs"
    ));
    private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-zA-Z0-9]+");

    public String extract(String url) {
        try {
            URI uri = URI.create(url);
            String host = uri.getHost();
            if (host == null) {
                return null;
            }
            String[] hostParts = host.toLowerCase(Locale.ROOT).split("\\.");
            for (String part : hostParts) {
                if (!GENERIC_HOST_PARTS.contains(part) && part.length() > 2) {
                    return prettify(part);
                }
            }

            String path = uri.getPath();
            if (path != null) {
                for (String pathSegment : path.split("/")) {
                    String cleaned = pathSegment.toLowerCase(Locale.ROOT);
                    if (!cleaned.isBlank() && cleaned.length() > 2 && !GENERIC_HOST_PARTS.contains(cleaned)) {
                        return prettify(cleaned);
                    }
                }
            }
            return null;
        } catch (Exception exception) {
            return null;
        }
    }

    private String prettify(String value) {
        String normalized = NON_ALPHANUMERIC.matcher(value).replaceAll(" ").trim();
        if (normalized.isBlank()) {
            return null;
        }
        String[] words = normalized.split("\\s+");
        StringBuilder builder = new StringBuilder();
        for (String word : words) {
            if (!builder.isEmpty()) {
                builder.append(' ');
            }
            builder.append(Character.toUpperCase(word.charAt(0)));
            if (word.length() > 1) {
                builder.append(word.substring(1));
            }
        }
        return builder.toString();
    }
}
