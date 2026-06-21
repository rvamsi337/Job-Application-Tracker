package com.jobtracker.job.dto;

import com.jobtracker.job.JobSourceType;
import java.time.OffsetDateTime;

public record DuplicateJobResponse(
        Long id,
        String jobUrl,
        String companyName,
        JobSourceType sourceType,
        OffsetDateTime originalUploadedAt,
        OffsetDateTime duplicateDetectedAt
) {
}
