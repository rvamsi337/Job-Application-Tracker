package com.jobtracker.job.dto;

import com.jobtracker.job.DuplicateJobLink;
import com.jobtracker.job.JobSourceType;
import java.time.OffsetDateTime;

public record DuplicateJobRecordResponse(
        Long id,
        String jobUrl,
        String companyName,
        JobSourceType sourceType,
        OffsetDateTime originalUploadedAt,
        OffsetDateTime duplicateDetectedAt
) {

    public static DuplicateJobRecordResponse from(DuplicateJobLink duplicateJobLink) {
        return new DuplicateJobRecordResponse(
                duplicateJobLink.getId(),
                duplicateJobLink.getJobUrl(),
                duplicateJobLink.getCompanyName(),
                duplicateJobLink.getSourceType(),
                duplicateJobLink.getOriginalUploadedAt(),
                duplicateJobLink.getDuplicateDetectedAt()
        );
    }
}
