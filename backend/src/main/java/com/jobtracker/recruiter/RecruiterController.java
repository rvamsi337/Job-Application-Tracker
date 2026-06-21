package com.jobtracker.recruiter;

import com.jobtracker.recruiter.dto.RecruiterContactRequest;
import com.jobtracker.recruiter.dto.RecruiterContactResponse;
import com.jobtracker.recruiter.dto.RecruiterUploadResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/recruiters")
public class RecruiterController {

    private final RecruiterService recruiterService;

    public RecruiterController(RecruiterService recruiterService) {
        this.recruiterService = recruiterService;
    }

    @GetMapping
    public List<RecruiterContactResponse> list(@RequestParam(required = false) String search) {
        return recruiterService.list(search);
    }

    @PostMapping
    public RecruiterContactResponse create(@Valid @RequestBody RecruiterContactRequest request) {
        return recruiterService.create(request);
    }

    @PatchMapping("/{id}")
    public RecruiterContactResponse update(@PathVariable Long id, @Valid @RequestBody RecruiterContactRequest request) {
        return recruiterService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        recruiterService.delete(id);
    }

    @PostMapping(path = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public RecruiterUploadResponse upload(@RequestPart("file") MultipartFile file) {
        return recruiterService.importCsv(file);
    }
}
