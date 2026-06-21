package com.jobtracker.job.dto;

import com.jobtracker.job.JobStatus;
import jakarta.validation.constraints.NotBlank;

public record CreateJobRequest(
        @NotBlank(message = "Job URL is required")
        String jobUrl,
        JobStatus status
) {
}
