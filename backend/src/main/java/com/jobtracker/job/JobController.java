package com.jobtracker.job;

import com.jobtracker.job.dto.CreateJobRequest;
import com.jobtracker.job.dto.DuplicateJobRecordResponse;
import com.jobtracker.job.dto.JobApplicationResponse;
import com.jobtracker.job.dto.JobUploadResponse;
import com.jobtracker.job.dto.UpdateJobStatusRequest;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @PostMapping(path = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public JobUploadResponse upload(@RequestPart("file") MultipartFile file) {
        return jobService.importTextFile(file);
    }

    @PostMapping
    public JobUploadResponse create(@Valid @RequestBody CreateJobRequest request) {
        return jobService.createManualJob(request);
    }

    @GetMapping
    public List<JobApplicationResponse> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) JobStatus status,
            @RequestParam(required = false) String search
    ) {
        return jobService.getJobs(date, status, search);
    }

    @GetMapping("/duplicates")
    public List<DuplicateJobRecordResponse> listDuplicates(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String search
    ) {
        return jobService.getDuplicates(date, search);
    }

    @PatchMapping("/{id}/status")
    public JobApplicationResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateJobStatusRequest request) {
        return jobService.updateStatus(id, request);
    }
}
