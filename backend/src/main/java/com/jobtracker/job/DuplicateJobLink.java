package com.jobtracker.job;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "duplicate_job_links")
public class DuplicateJobLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_url", nullable = false)
    private String jobUrl;

    @Column(name = "company_name")
    private String companyName;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    private JobSourceType sourceType;

    @Column(name = "original_uploaded_at", nullable = false)
    private OffsetDateTime originalUploadedAt;

    @Column(name = "duplicate_detected_at", nullable = false)
    private OffsetDateTime duplicateDetectedAt;

    public Long getId() {
        return id;
    }

    public String getJobUrl() {
        return jobUrl;
    }

    public void setJobUrl(String jobUrl) {
        this.jobUrl = jobUrl;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public JobSourceType getSourceType() {
        return sourceType;
    }

    public void setSourceType(JobSourceType sourceType) {
        this.sourceType = sourceType;
    }

    public OffsetDateTime getOriginalUploadedAt() {
        return originalUploadedAt;
    }

    public void setOriginalUploadedAt(OffsetDateTime originalUploadedAt) {
        this.originalUploadedAt = originalUploadedAt;
    }

    public OffsetDateTime getDuplicateDetectedAt() {
        return duplicateDetectedAt;
    }

    public void setDuplicateDetectedAt(OffsetDateTime duplicateDetectedAt) {
        this.duplicateDetectedAt = duplicateDetectedAt;
    }
}
