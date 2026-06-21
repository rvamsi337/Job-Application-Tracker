package com.jobtracker.job;

import com.jobtracker.job.dto.DuplicateJobResponse;
import com.jobtracker.job.dto.InvalidJobLineResponse;
import com.jobtracker.job.dto.JobApplicationResponse;
import java.util.ArrayList;
import java.util.List;

public class JobImportResult {

    private final List<JobApplicationResponse> inserted = new ArrayList<>();
    private final List<DuplicateJobResponse> duplicates = new ArrayList<>();
    private final List<InvalidJobLineResponse> invalidLines = new ArrayList<>();

    public List<JobApplicationResponse> getInserted() {
        return inserted;
    }

    public List<DuplicateJobResponse> getDuplicates() {
        return duplicates;
    }

    public List<InvalidJobLineResponse> getInvalidLines() {
        return invalidLines;
    }
}
