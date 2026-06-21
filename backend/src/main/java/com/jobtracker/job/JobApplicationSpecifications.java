package com.jobtracker.job;

import com.jobtracker.config.AppTimeZone;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.springframework.data.jpa.domain.Specification;

public final class JobApplicationSpecifications {

    private JobApplicationSpecifications() {
    }

    public static Specification<JobApplication> withFilters(LocalDate date, JobStatus status, String search) {
        return Specification.where(byDate(date))
                .and(byStatus(status))
                .and(bySearch(search));
    }

    private static Specification<JobApplication> byDate(LocalDate date) {
        if (date == null) {
            return null;
        }
        OffsetDateTime start = AppTimeZone.startOfDay(date);
        OffsetDateTime end = AppTimeZone.startOfNextDay(date);
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.and(
                        criteriaBuilder.greaterThanOrEqualTo(root.get("uploadedAt"), start),
                        criteriaBuilder.lessThan(root.get("uploadedAt"), end)
                );
    }

    private static Specification<JobApplication> byStatus(JobStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("status"), status);
    }

    private static Specification<JobApplication> bySearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        String pattern = "%" + search.toLowerCase() + "%";
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("companyName")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("jobUrl")), pattern)
                );
    }
}
