package com.jobtracker.backup;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobtracker.job.DuplicateJobLink;
import com.jobtracker.dashboard.DashboardStatsResponse;
import com.jobtracker.job.JobApplication;
import com.jobtracker.job.JobService;
import com.jobtracker.job.JobSourceType;
import com.jobtracker.job.JobStatus;
import com.jobtracker.recruiter.RecruiterContact;
import com.jobtracker.recruiter.RecruiterContactRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

class DailyBackupServiceTest {

    @Test
    void shouldGenerateExpectedBackupFiles() {
        JobService jobService = Mockito.mock(JobService.class);
        RecruiterContactRepository recruiterContactRepository = Mockito.mock(RecruiterContactRepository.class);
        GoogleDriveClient googleDriveClient = Mockito.mock(GoogleDriveClient.class);
        Clock clock = Clock.fixed(Instant.parse("2026-06-20T08:00:00Z"), ZoneOffset.UTC);

        JobApplication job = new JobApplication();
        job.setJobUrl("https://example.com/jobs/1");
        job.setCompanyName("Example");
        job.setSourceType(JobSourceType.FILE_UPLOAD);
        job.setStatus(JobStatus.PENDING);
        job.setUploadedAt(OffsetDateTime.parse("2026-06-20T07:00:00Z"));
        job.setStatusUpdatedAt(OffsetDateTime.parse("2026-06-20T07:00:00Z"));

        RecruiterContact recruiter = new RecruiterContact();
        recruiter.setCompanyName("Example");
        recruiter.setRecruiterEmail("recruiter@example.com");
        recruiter.setCreatedAt(OffsetDateTime.parse("2026-06-20T07:30:00Z"));

        when(jobService.getJobsUploadedOn(LocalDate.of(2026, 6, 20))).thenReturn(List.of(job));
        when(jobService.getDuplicatesDetectedOn(LocalDate.of(2026, 6, 20))).thenReturn(List.of(new DuplicateJobLink()));
        when(jobService.getDashboardStats()).thenReturn(new DashboardStatsResponse(10, 2, 4, java.util.Map.of("PENDING", 4L)));
        when(recruiterContactRepository.findAllByOrderByCompanyNameAsc()).thenReturn(List.of(recruiter));

        DailyBackupService service = new DailyBackupService(
                jobService,
                recruiterContactRepository,
                googleDriveClient,
                new ObjectMapper().findAndRegisterModules(),
                clock,
                true
        );

        service.exportDailyBackup();

        ArgumentCaptor<String> fileCaptor = ArgumentCaptor.forClass(String.class);
        verify(googleDriveClient, Mockito.times(3)).upload(fileCaptor.capture(), any(), any());
        assertThat(fileCaptor.getAllValues()).containsExactly(
                "2026-06-20-job-links.csv",
                "2026-06-20-recruiters.csv",
                "2026-06-20-summary.json"
        );
        assertThat(service.toSummaryJson(LocalDate.of(2026, 6, 20), 1, 1, 1, new DashboardStatsResponse(10, 2, 4, java.util.Map.of())))
                .contains("\"duplicateCount\" : 1");
    }
}
