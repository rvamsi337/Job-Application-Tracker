package com.jobtracker.recruiter.dto;

import java.util.List;

public record RecruiterUploadResponse(
        List<RecruiterContactResponse> inserted,
        List<String> duplicates,
        List<String> invalidLines
) {
}
