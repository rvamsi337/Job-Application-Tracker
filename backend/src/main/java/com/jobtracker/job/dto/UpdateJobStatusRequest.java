package com.jobtracker.job.dto;

import com.jobtracker.job.JobStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateJobStatusRequest(
        @NotNull(message = "Status is required")
        JobStatus status
) {
}
