package com.jobtracker;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobtracker.job.DuplicateJobLinkRepository;
import com.jobtracker.job.JobApplication;
import com.jobtracker.job.JobApplicationRepository;
import com.jobtracker.job.JobSourceType;
import com.jobtracker.job.JobStatus;
import com.jobtracker.recruiter.RecruiterContactRepository;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class JobTrackerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private RecruiterContactRepository recruiterContactRepository;

    @Autowired
    private DuplicateJobLinkRepository duplicateJobLinkRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        recruiterContactRepository.deleteAll();
        duplicateJobLinkRepository.deleteAll();
        jobApplicationRepository.deleteAll();
    }

    @Test
    void shouldUploadTextFileAndReportDuplicatesAndInvalidLines() throws Exception {
        JobApplication existing = new JobApplication();
        existing.setJobUrl("https://jobs.example.com/roles/1");
        existing.setCompanyName("Example");
        existing.setSourceType(JobSourceType.FILE_UPLOAD);
        existing.setStatus(JobStatus.PENDING);
        existing.setUploadedAt(OffsetDateTime.parse("2026-06-19T08:00:00Z"));
        existing.setStatusUpdatedAt(OffsetDateTime.parse("2026-06-19T08:00:00Z"));
        jobApplicationRepository.save(existing);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "jobs.txt",
                MediaType.TEXT_PLAIN_VALUE,
                """
                https://jobs.example.com/roles/1
                https://careers.microsoft.com/us/en/job/123
                not-a-url
                """.getBytes()
        );

        mockMvc.perform(multipart("/api/jobs/upload").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inserted.length()").value(1))
                .andExpect(jsonPath("$.duplicates.length()").value(1))
                .andExpect(jsonPath("$.duplicates[0].originalUploadedAt").value("2026-06-19T08:00:00Z"))
                .andExpect(jsonPath("$.invalidLines.length()").value(1));

        mockMvc.perform(get("/api/jobs/duplicates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].jobUrl").value("https://jobs.example.com/roles/1"))
                .andExpect(jsonPath("$[0].originalUploadedAt").value("2026-06-19T08:00:00Z"));
    }

    @Test
    void shouldStoreManualDuplicatesOutsideApplicationList() throws Exception {
        JobApplication existing = new JobApplication();
        existing.setJobUrl("https://jobs.example.com/roles/77");
        existing.setCompanyName("Example");
        existing.setSourceType(JobSourceType.FILE_UPLOAD);
        existing.setStatus(JobStatus.PENDING);
        existing.setUploadedAt(OffsetDateTime.parse("2026-06-19T08:00:00Z"));
        existing.setStatusUpdatedAt(OffsetDateTime.parse("2026-06-19T08:00:00Z"));
        jobApplicationRepository.save(existing);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "jobUrl", "https://jobs.example.com/roles/77",
                                "status", "PENDING"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inserted.length()").value(0))
                .andExpect(jsonPath("$.duplicates.length()").value(1));

        mockMvc.perform(get("/api/jobs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void shouldFilterJobsByDateAndUpdateStatus() throws Exception {
        JobApplication application = new JobApplication();
        application.setJobUrl("https://example.com/jobs/abc");
        application.setCompanyName("Example");
        application.setSourceType(JobSourceType.FILE_UPLOAD);
        application.setStatus(JobStatus.PENDING);
        application.setUploadedAt(OffsetDateTime.parse("2026-06-20T08:00:00Z"));
        application.setStatusUpdatedAt(OffsetDateTime.parse("2026-06-20T08:00:00Z"));
        application = jobApplicationRepository.save(application);

        mockMvc.perform(get("/api/jobs").param("date", "2026-06-20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].jobUrl").value("https://example.com/jobs/abc"));

        mockMvc.perform(patch("/api/jobs/{id}/status", application.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of("status", "APPLIED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPLIED"))
                .andExpect(jsonPath("$.appliedAt").exists());
    }

    @Test
    void shouldImportRecruiterCsv() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "recruiters.csv",
                "text/csv",
                """
                Example,recruiter@example.com
                Example,recruiter@example.com
                InvalidOnly
                """.getBytes()
        );

        mockMvc.perform(multipart("/api/recruiters/upload").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inserted.length()").value(1))
                .andExpect(jsonPath("$.duplicates.length()").value(1))
                .andExpect(jsonPath("$.invalidLines.length()").value(1));

        mockMvc.perform(get("/api/recruiters"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("recruiter@example.com")));
    }
}
