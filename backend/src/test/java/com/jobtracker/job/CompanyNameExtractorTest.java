package com.jobtracker.job;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CompanyNameExtractorTest {

    private final CompanyNameExtractor extractor = new CompanyNameExtractor();

    @Test
    void shouldExtractCompanyFromHost() {
        assertThat(extractor.extract("https://careers.microsoft.com/us/en/job/123"))
                .isEqualTo("Microsoft");
    }

    @Test
    void shouldReturnNullForUnknownUrl() {
        assertThat(extractor.extract("invalid")).isNull();
    }
}
