package com.jobtracker.job.dto;

import com.jobtracker.job.JobApplication;
import com.jobtracker.job.JobSourceType;
import com.jobtracker.job.JobStatus;
import java.time.OffsetDateTime;

public record JobApplicationResponse(
        Long id,
        Long serialNo,
        String jobUrl,
        String companyName,
        JobSourceType sourceType,
        JobStatus status,
        OffsetDateTime uploadedAt,
        OffsetDateTime appliedAt,
        OffsetDateTime statusUpdatedAt
) {

    public static JobApplicationResponse from(JobApplication application) {
        return new JobApplicationResponse(
                application.getId(),
                application.getSerialNo(),
                application.getJobUrl(),
                application.getCompanyName(),
                application.getSourceType(),
                application.getStatus(),
                application.getUploadedAt(),
                application.getAppliedAt(),
                application.getStatusUpdatedAt()
        );
    }
}
