package com.jobtracker.recruiter.dto;

import com.jobtracker.recruiter.RecruiterContact;
import java.time.OffsetDateTime;

public record RecruiterContactResponse(
        Long id,
        String companyName,
        String recruiterName,
        String recruiterEmail,
        String mobileNumber,
        OffsetDateTime createdAt
) {

    public static RecruiterContactResponse from(RecruiterContact contact) {
        return new RecruiterContactResponse(
                contact.getId(),
                contact.getCompanyName(),
                contact.getRecruiterName(),
                contact.getRecruiterEmail(),
                contact.getMobileNumber(),
                contact.getCreatedAt()
        );
    }
}
