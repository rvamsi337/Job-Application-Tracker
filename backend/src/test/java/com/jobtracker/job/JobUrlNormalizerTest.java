package com.jobtracker.job;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class JobUrlNormalizerTest {

    private final JobUrlNormalizer normalizer = new JobUrlNormalizer();

    @Test
    void shouldNormalizeHostAndRemoveFragment() {
        String normalized = normalizer.normalize("HTTPS://WWW.Example.com/jobs/123/#details");

        assertThat(normalized).isEqualTo("https://www.example.com/jobs/123");
    }

    @Test
    void shouldRejectInvalidUrl() {
        assertThatThrownBy(() -> normalizer.normalize("not-a-url"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("valid scheme and host");
    }
}
