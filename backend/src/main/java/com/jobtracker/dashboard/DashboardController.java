package com.jobtracker.dashboard;

import com.jobtracker.job.JobService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final JobService jobService;

    public DashboardController(JobService jobService) {
        this.jobService = jobService;
    }

    @GetMapping("/stats")
    public DashboardStatsResponse getStats() {
        return jobService.getDashboardStats();
    }
}
