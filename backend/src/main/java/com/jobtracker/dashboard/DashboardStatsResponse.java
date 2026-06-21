package com.jobtracker.dashboard;

import java.util.Map;

public record DashboardStatsResponse(
        long totalCount,
        long todayCount,
        long recentCount,
        Map<String, Long> statusCounts
) {
}
