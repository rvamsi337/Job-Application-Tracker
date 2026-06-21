package com.jobtracker.config;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "jobTrackerDotenv";
    private static final List<Path> CANDIDATE_PATHS = List.of(
            Path.of(".env"),
            Path.of("backend", ".env")
    );

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> values = new LinkedHashMap<>();
        for (Path candidatePath : CANDIDATE_PATHS) {
            if (!Files.exists(candidatePath) || !Files.isRegularFile(candidatePath)) {
                continue;
            }
            values.putAll(loadProperties(candidatePath));
        }

        if (!values.isEmpty() && environment.getPropertySources().get(PROPERTY_SOURCE_NAME) == null) {
            // Keep OS env vars and command-line args higher priority than .env values.
            environment.getPropertySources().addLast(new MapPropertySource(PROPERTY_SOURCE_NAME, values));
        }
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }

    private Map<String, Object> loadProperties(Path path) {
        Map<String, Object> values = new LinkedHashMap<>();
        try (InputStream stream = Files.newInputStream(path)) {
            for (String rawLine : new String(stream.readAllBytes()).lines().toList()) {
                String line = rawLine.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                int separatorIndex = line.indexOf('=');
                if (separatorIndex <= 0) {
                    continue;
                }

                String key = line.substring(0, separatorIndex).trim();
                String value = line.substring(separatorIndex + 1).trim();
                values.put(key, stripWrappingQuotes(value));
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to load .env file from " + path.toAbsolutePath(), exception);
        }
        return values;
    }

    private String stripWrappingQuotes(String value) {
        if (value.length() >= 2) {
            boolean wrappedInDoubleQuotes = value.startsWith("\"") && value.endsWith("\"");
            boolean wrappedInSingleQuotes = value.startsWith("'") && value.endsWith("'");
            if (wrappedInDoubleQuotes || wrappedInSingleQuotes) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }
}
