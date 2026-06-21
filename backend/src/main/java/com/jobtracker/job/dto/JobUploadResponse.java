package com.jobtracker.job.dto;

import java.util.List;

public record JobUploadResponse(
        List<JobApplicationResponse> inserted,
        List<DuplicateJobResponse> duplicates,
        List<InvalidJobLineResponse> invalidLines
) {
}
