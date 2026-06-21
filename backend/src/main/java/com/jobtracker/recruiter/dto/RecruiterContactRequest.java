package com.jobtracker.recruiter.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RecruiterContactRequest(
        @NotBlank(message = "Company name is required")
        String companyName,
        String recruiterName,
        @NotBlank(message = "Recruiter email is required")
        @Email(message = "Recruiter email must be valid")
        String recruiterEmail,
        String mobileNumber
) {
}
