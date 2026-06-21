package com.jobtracker.job.dto;

public record InvalidJobLineResponse(
        String line,
        String reason
) {
}
