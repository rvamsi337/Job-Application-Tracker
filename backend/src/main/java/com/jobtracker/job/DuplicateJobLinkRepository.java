package com.jobtracker.job;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface DuplicateJobLinkRepository extends JpaRepository<DuplicateJobLink, Long>, JpaSpecificationExecutor<DuplicateJobLink> {

    long countByDuplicateDetectedAtGreaterThanEqual(OffsetDateTime duplicateDetectedAt);

    List<DuplicateJobLink> findAllByDuplicateDetectedAtBetween(OffsetDateTime start, OffsetDateTime end, Sort sort);
}
