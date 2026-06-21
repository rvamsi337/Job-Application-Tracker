package com.jobtracker.job;

import com.jobtracker.config.AppTimeZone;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;

public final class DuplicateJobLinkSpecifications {

    private DuplicateJobLinkSpecifications() {
    }

    public static Specification<DuplicateJobLink> withFilters(LocalDate date, String search) {
        return (root, query, criteriaBuilder) -> {
            var predicates = criteriaBuilder.conjunction();

            if (date != null) {
                var start = AppTimeZone.startOfDay(date);
                var end = AppTimeZone.startOfNextDay(date);
                predicates = criteriaBuilder.and(
                        predicates,
                        criteriaBuilder.greaterThanOrEqualTo(root.get("duplicateDetectedAt"), start),
                        criteriaBuilder.lessThan(root.get("duplicateDetectedAt"), end)
                );
            }

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates = criteriaBuilder.and(
                        predicates,
                        criteriaBuilder.or(
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("jobUrl")), pattern),
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("companyName")), pattern)
                        )
                );
            }

            return predicates;
        };
    }
}
