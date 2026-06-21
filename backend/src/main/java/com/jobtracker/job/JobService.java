package com.jobtracker.job;

import com.jobtracker.config.AppTimeZone;
import com.jobtracker.dashboard.DashboardStatsResponse;
import com.jobtracker.job.dto.CreateJobRequest;
import com.jobtracker.job.dto.DuplicateJobResponse;
import com.jobtracker.job.dto.InvalidJobLineResponse;
import com.jobtracker.job.dto.JobApplicationResponse;
import com.jobtracker.job.dto.JobUploadResponse;
import com.jobtracker.job.dto.UpdateJobStatusRequest;
import jakarta.persistence.EntityNotFoundException;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class JobService {

    private final JobApplicationRepository jobApplicationRepository;
    private final DuplicateJobLinkRepository duplicateJobLinkRepository;
    private final JobUrlNormalizer jobUrlNormalizer;
    private final CompanyNameExtractor companyNameExtractor;
    private final Clock clock;

    @Autowired
    public JobService(
            JobApplicationRepository jobApplicationRepository,
            DuplicateJobLinkRepository duplicateJobLinkRepository,
            JobUrlNormalizer jobUrlNormalizer,
            CompanyNameExtractor companyNameExtractor
    ) {
        this(jobApplicationRepository, duplicateJobLinkRepository, jobUrlNormalizer, companyNameExtractor, Clock.system(AppTimeZone.ZONE_ID));
    }

    JobService(
            JobApplicationRepository jobApplicationRepository,
            DuplicateJobLinkRepository duplicateJobLinkRepository,
            JobUrlNormalizer jobUrlNormalizer,
            CompanyNameExtractor companyNameExtractor,
            Clock clock
    ) {
        this.jobApplicationRepository = jobApplicationRepository;
        this.duplicateJobLinkRepository = duplicateJobLinkRepository;
        this.jobUrlNormalizer = jobUrlNormalizer;
        this.companyNameExtractor = companyNameExtractor;
        this.clock = clock;
    }

    @Transactional
    public JobUploadResponse importTextFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please upload a non-empty text file");
        }
        String fileName = file.getOriginalFilename();
        if (fileName == null || !fileName.toLowerCase().endsWith(".txt")) {
            throw new IllegalArgumentException("Only .txt files are supported");
        }

        JobImportResult result = new JobImportResult();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                processJobLine(line, JobSourceType.FILE_UPLOAD, JobStatus.PENDING, result);
            }
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to read uploaded file");
        }

        return new JobUploadResponse(result.getInserted(), result.getDuplicates(), result.getInvalidLines());
    }

    @Transactional
    public JobUploadResponse createManualJob(CreateJobRequest request) {
        JobImportResult result = new JobImportResult();
        JobStatus status = request.status() == null ? JobStatus.PENDING : request.status();
        processJobLine(request.jobUrl(), JobSourceType.MANUAL_ENTRY, status, result);
        return new JobUploadResponse(result.getInserted(), result.getDuplicates(), result.getInvalidLines());
    }

    @Transactional(readOnly = true)
    public List<JobApplicationResponse> getJobs(LocalDate date, JobStatus status, String search) {
        Specification<JobApplication> specification = JobApplicationSpecifications.withFilters(date, status, search);
        return jobApplicationRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "uploadedAt"))
                .stream()
                .map(JobApplicationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<com.jobtracker.job.dto.DuplicateJobRecordResponse> getDuplicates(LocalDate date, String search) {
        Specification<DuplicateJobLink> specification = DuplicateJobLinkSpecifications.withFilters(date, search);
        return duplicateJobLinkRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "duplicateDetectedAt"))
                .stream()
                .map(com.jobtracker.job.dto.DuplicateJobRecordResponse::from)
                .toList();
    }

    @Transactional
    public JobApplicationResponse updateStatus(Long id, UpdateJobStatusRequest request) {
        JobApplication application = jobApplicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Job application not found"));

        application.setStatus(request.status());
        OffsetDateTime now = OffsetDateTime.now(clock);
        application.setStatusUpdatedAt(now);
        if (request.status() == JobStatus.APPLIED) {
            application.setAppliedAt(now);
        }
        if (request.status() != JobStatus.APPLIED) {
            application.setAppliedAt(null);
        }
        return JobApplicationResponse.from(jobApplicationRepository.save(application));
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        OffsetDateTime now = OffsetDateTime.now(clock);
        OffsetDateTime startOfToday = AppTimeZone.startOfDay(now.toLocalDate());
        OffsetDateTime startOfTomorrow = AppTimeZone.startOfNextDay(now.toLocalDate());
        OffsetDateTime lastSevenDays = startOfToday.minusDays(6);

        long total = jobApplicationRepository.count();
        long todayCount = jobApplicationRepository.countByUploadedAtBetween(startOfToday, startOfTomorrow);
        long recentCount = jobApplicationRepository.countByUploadedAtBetween(lastSevenDays, startOfTomorrow);
        Map<String, Long> statusCounts = Arrays.stream(JobStatus.values())
                .collect(Collectors.toMap(
                        Enum::name,
                        status -> jobApplicationRepository.count(JobApplicationSpecifications.withFilters(null, status, null)),
                        (left, right) -> right,
                        LinkedHashMap::new
                ));

        return new DashboardStatsResponse(total, todayCount, recentCount, statusCounts);
    }

    @Transactional(readOnly = true)
    public List<JobApplication> getJobsUploadedOn(LocalDate date) {
        OffsetDateTime start = AppTimeZone.startOfDay(date);
        OffsetDateTime end = AppTimeZone.startOfNextDay(date);
        return jobApplicationRepository.findAllByUploadedAtBetween(start, end, Sort.by(Sort.Direction.ASC, "serialNo"));
    }

    @Transactional(readOnly = true)
    public List<DuplicateJobLink> getDuplicatesDetectedOn(LocalDate date) {
        OffsetDateTime start = AppTimeZone.startOfDay(date);
        OffsetDateTime end = AppTimeZone.startOfNextDay(date);
        return duplicateJobLinkRepository.findAllByDuplicateDetectedAtBetween(start, end, Sort.by(Sort.Direction.ASC, "id"));
    }

    @Transactional(readOnly = true)
    public long getDuplicateCountForToday() {
        OffsetDateTime startOfToday = AppTimeZone.startOfDay(OffsetDateTime.now(clock).toLocalDate());
        return duplicateJobLinkRepository.countByDuplicateDetectedAtGreaterThanEqual(startOfToday);
    }

    private void processJobLine(String line, JobSourceType sourceType, JobStatus status, JobImportResult result) {
        String trimmed = line == null ? "" : line.trim();
        if (trimmed.isBlank()) {
            return;
        }

        final String normalizedUrl;
        try {
            normalizedUrl = jobUrlNormalizer.normalize(trimmed);
        } catch (IllegalArgumentException exception) {
            result.getInvalidLines().add(new InvalidJobLineResponse(trimmed, exception.getMessage()));
            return;
        }

        jobApplicationRepository.findByJobUrl(normalizedUrl)
                .ifPresentOrElse(existing -> result.getDuplicates()
                                .add(recordDuplicate(existing, sourceType)),
                        () -> result.getInserted().add(JobApplicationResponse.from(
                                jobApplicationRepository.save(createJobApplication(normalizedUrl, sourceType, status))
                        )));
    }

    private DuplicateJobResponse recordDuplicate(JobApplication existing, JobSourceType sourceType) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        DuplicateJobLink duplicateJobLink = new DuplicateJobLink();
        duplicateJobLink.setJobUrl(existing.getJobUrl());
        duplicateJobLink.setCompanyName(existing.getCompanyName());
        duplicateJobLink.setSourceType(sourceType);
        duplicateJobLink.setOriginalUploadedAt(existing.getUploadedAt());
        duplicateJobLink.setDuplicateDetectedAt(now);
        DuplicateJobLink saved = duplicateJobLinkRepository.save(duplicateJobLink);
        return new DuplicateJobResponse(
                saved.getId(),
                saved.getJobUrl(),
                saved.getCompanyName(),
                saved.getSourceType(),
                saved.getOriginalUploadedAt(),
                saved.getDuplicateDetectedAt()
        );
    }

    private JobApplication createJobApplication(String normalizedUrl, JobSourceType sourceType, JobStatus status) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        JobApplication application = new JobApplication();
        application.setJobUrl(normalizedUrl);
        application.setCompanyName(companyNameExtractor.extract(normalizedUrl));
        application.setSourceType(sourceType);
        application.setStatus(status);
        application.setUploadedAt(now);
        application.setStatusUpdatedAt(now);
        application.setAppliedAt(status == JobStatus.APPLIED ? now : null);
        return application;
    }
}
