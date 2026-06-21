package com.jobtracker.backup;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobtracker.config.AppTimeZone;
import com.jobtracker.dashboard.DashboardStatsResponse;
import com.jobtracker.job.DuplicateJobLink;
import com.jobtracker.job.JobApplication;
import com.jobtracker.job.JobService;
import com.jobtracker.recruiter.RecruiterContact;
import com.jobtracker.recruiter.RecruiterContactRepository;
import com.opencsv.CSVWriter;
import java.io.IOException;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class DailyBackupService {

    private final JobService jobService;
    private final RecruiterContactRepository recruiterContactRepository;
    private final GoogleDriveClient googleDriveClient;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final boolean backupsEnabled;

    @Autowired
    public DailyBackupService(
            JobService jobService,
            RecruiterContactRepository recruiterContactRepository,
            GoogleDriveClient googleDriveClient,
            ObjectMapper objectMapper,
            @Value("${app.backup.enabled:false}") boolean backupsEnabled
    ) {
        this(jobService, recruiterContactRepository, googleDriveClient, objectMapper, Clock.system(AppTimeZone.ZONE_ID), backupsEnabled);
    }

    DailyBackupService(
            JobService jobService,
            RecruiterContactRepository recruiterContactRepository,
            GoogleDriveClient googleDriveClient,
            ObjectMapper objectMapper,
            Clock clock,
            boolean backupsEnabled
    ) {
        this.jobService = jobService;
        this.recruiterContactRepository = recruiterContactRepository;
        this.googleDriveClient = googleDriveClient;
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.backupsEnabled = backupsEnabled;
    }

    @Scheduled(cron = "${app.backup.cron}", zone = "America/Chicago")
    public void scheduledBackup() {
        if (backupsEnabled) {
            exportDailyBackup();
        }
    }

    public void exportDailyBackup() {
        LocalDate date = LocalDate.now(clock);
        List<JobApplication> jobs = jobService.getJobsUploadedOn(date);
        List<DuplicateJobLink> duplicates = jobService.getDuplicatesDetectedOn(date);
        List<RecruiterContact> recruiters = recruiterContactRepository.findAllByOrderByCompanyNameAsc();
        DashboardStatsResponse stats = jobService.getDashboardStats();

        googleDriveClient.upload(
                date + "-job-links.csv",
                "text/csv",
                toJobCsv(jobs).getBytes(StandardCharsets.UTF_8)
        );
        googleDriveClient.upload(
                date + "-recruiters.csv",
                "text/csv",
                toRecruiterCsv(recruiters).getBytes(StandardCharsets.UTF_8)
        );
        googleDriveClient.upload(
                date + "-summary.json",
                "application/json",
                toSummaryJson(date, jobs.size(), duplicates.size(), recruiters.size(), stats).getBytes(StandardCharsets.UTF_8)
        );
    }

    String toJobCsv(List<JobApplication> jobs) {
        try (StringWriter writer = new StringWriter(); CSVWriter csvWriter = new CSVWriter(writer)) {
            csvWriter.writeNext(new String[]{"serialNo", "uploadedAt", "companyName", "jobUrl", "status", "sourceType"});
            for (JobApplication job : jobs) {
                csvWriter.writeNext(new String[]{
                        String.valueOf(job.getSerialNo()),
                        String.valueOf(job.getUploadedAt()),
                        job.getCompanyName(),
                        job.getJobUrl(),
                        job.getStatus().name(),
                        job.getSourceType().name()
                });
            }
            return writer.toString();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to generate jobs backup CSV", exception);
        }
    }

    String toRecruiterCsv(List<RecruiterContact> recruiters) {
        try (StringWriter writer = new StringWriter(); CSVWriter csvWriter = new CSVWriter(writer)) {
            csvWriter.writeNext(new String[]{"companyName", "recruiterName", "recruiterEmail", "mobileNumber", "createdAt"});
            for (RecruiterContact recruiter : recruiters) {
                csvWriter.writeNext(new String[]{
                        recruiter.getCompanyName(),
                        recruiter.getRecruiterName(),
                        recruiter.getRecruiterEmail(),
                        recruiter.getMobileNumber(),
                        String.valueOf(recruiter.getCreatedAt())
                });
            }
            return writer.toString();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to generate recruiters backup CSV", exception);
        }
    }

    String toSummaryJson(LocalDate date, int dailyJobCount, int duplicateCount, int recruiterCount, DashboardStatsResponse stats) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("date", date);
        summary.put("generatedAt", OffsetDateTime.now(clock));
        summary.put("dailyJobCount", dailyJobCount);
        summary.put("duplicateCount", duplicateCount);
        summary.put("recruiterCount", recruiterCount);
        summary.put("totalJobCount", stats.totalCount());
        summary.put("todayCount", stats.todayCount());
        summary.put("recentCount", stats.recentCount());
        summary.put("statusCounts", stats.statusCounts());
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(summary);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to generate backup summary JSON", exception);
        }
    }
}
