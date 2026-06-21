package com.jobtracker.job;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long>, JpaSpecificationExecutor<JobApplication> {

    Optional<JobApplication> findByJobUrl(String jobUrl);

    List<JobApplication> findAllByUploadedAtBetween(OffsetDateTime start, OffsetDateTime end, Sort sort);

    long countByUploadedAtGreaterThanEqual(OffsetDateTime offsetDateTime);

    long countByUploadedAtBetween(OffsetDateTime start, OffsetDateTime end);
}
