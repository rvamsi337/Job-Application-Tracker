package com.jobtracker.recruiter;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecruiterContactRepository extends JpaRepository<RecruiterContact, Long> {

    List<RecruiterContact> findByCompanyNameContainingIgnoreCaseOrRecruiterNameContainingIgnoreCaseOrRecruiterEmailContainingIgnoreCaseOrderByCompanyNameAsc(
            String companyName,
            String recruiterName,
            String recruiterEmail
    );

    List<RecruiterContact> findAllByOrderByCompanyNameAsc();

    Optional<RecruiterContact> findByCompanyNameIgnoreCaseAndRecruiterEmailIgnoreCase(String companyName, String recruiterEmail);
}
