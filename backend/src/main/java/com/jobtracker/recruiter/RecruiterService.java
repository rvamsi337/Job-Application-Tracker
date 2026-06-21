package com.jobtracker.recruiter;

import com.jobtracker.config.AppTimeZone;
import com.jobtracker.recruiter.dto.RecruiterContactRequest;
import com.jobtracker.recruiter.dto.RecruiterContactResponse;
import com.jobtracker.recruiter.dto.RecruiterUploadResponse;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import jakarta.persistence.EntityNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class RecruiterService {

    private final RecruiterContactRepository recruiterContactRepository;
    private final Clock clock;

    @Autowired
    public RecruiterService(RecruiterContactRepository recruiterContactRepository) {
        this(recruiterContactRepository, Clock.system(AppTimeZone.ZONE_ID));
    }

    RecruiterService(RecruiterContactRepository recruiterContactRepository, Clock clock) {
        this.recruiterContactRepository = recruiterContactRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<RecruiterContactResponse> list(String search) {
        List<RecruiterContact> contacts = search == null || search.isBlank()
                ? recruiterContactRepository.findAllByOrderByCompanyNameAsc()
                : recruiterContactRepository.findByCompanyNameContainingIgnoreCaseOrRecruiterNameContainingIgnoreCaseOrRecruiterEmailContainingIgnoreCaseOrderByCompanyNameAsc(search, search, search);
        return contacts.stream().map(RecruiterContactResponse::from).toList();
    }

    @Transactional
    public RecruiterContactResponse create(RecruiterContactRequest request) {
        validateDuplicate(request.companyName(), request.recruiterEmail(), null);
        RecruiterContact contact = new RecruiterContact();
        contact.setCompanyName(request.companyName().trim());
        contact.setRecruiterName(normalizeOptionalField(request.recruiterName()));
        contact.setRecruiterEmail(request.recruiterEmail().trim().toLowerCase());
        contact.setMobileNumber(normalizeMobileNumber(request.mobileNumber()));
        contact.setCreatedAt(OffsetDateTime.now(clock));
        return RecruiterContactResponse.from(recruiterContactRepository.save(contact));
    }

    @Transactional
    public RecruiterContactResponse update(Long id, RecruiterContactRequest request) {
        RecruiterContact contact = recruiterContactRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Recruiter contact not found"));
        validateDuplicate(request.companyName(), request.recruiterEmail(), id);
        contact.setCompanyName(request.companyName().trim());
        contact.setRecruiterName(normalizeOptionalField(request.recruiterName()));
        contact.setRecruiterEmail(request.recruiterEmail().trim().toLowerCase());
        contact.setMobileNumber(normalizeMobileNumber(request.mobileNumber()));
        return RecruiterContactResponse.from(recruiterContactRepository.save(contact));
    }

    @Transactional
    public void delete(Long id) {
        if (!recruiterContactRepository.existsById(id)) {
            throw new EntityNotFoundException("Recruiter contact not found");
        }
        recruiterContactRepository.deleteById(id);
    }

    @Transactional
    public RecruiterUploadResponse importCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please upload a non-empty CSV file");
        }
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase().endsWith(".csv")) {
            throw new IllegalArgumentException("Only CSV files are supported");
        }

        List<RecruiterContactResponse> inserted = new ArrayList<>();
        List<String> duplicates = new ArrayList<>();
        List<String> invalidLines = new ArrayList<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String[] values;
            while ((values = reader.readNext()) != null) {
                if (values.length < 2) {
                    invalidLines.add(String.join(",", values));
                    continue;
                }
                String companyName = values[0].trim();
                String recruiterName = null;
                String recruiterEmail;
                String mobileNumber = null;
                if (values.length == 2) {
                    recruiterEmail = values[1].trim().toLowerCase();
                } else {
                    recruiterName = normalizeOptionalField(values[1]);
                    recruiterEmail = values[2].trim().toLowerCase();
                    if (values.length >= 4) {
                        mobileNumber = normalizeMobileNumber(values[3]);
                    }
                }
                if (companyName.isBlank() || recruiterEmail.isBlank()) {
                    invalidLines.add(String.join(",", values));
                    continue;
                }
                if (recruiterContactRepository.findByCompanyNameIgnoreCaseAndRecruiterEmailIgnoreCase(companyName, recruiterEmail).isPresent()) {
                    duplicates.add(companyName + " <" + recruiterEmail + ">");
                    continue;
                }

                RecruiterContact contact = new RecruiterContact();
                contact.setCompanyName(companyName);
                contact.setRecruiterName(recruiterName);
                contact.setRecruiterEmail(recruiterEmail);
                contact.setMobileNumber(mobileNumber);
                contact.setCreatedAt(OffsetDateTime.now(clock));
                inserted.add(RecruiterContactResponse.from(recruiterContactRepository.save(contact)));
            }
        } catch (IOException | CsvValidationException exception) {
            throw new IllegalArgumentException("Unable to read CSV file");
        }

        return new RecruiterUploadResponse(inserted, duplicates, invalidLines);
    }

    private void validateDuplicate(String companyName, String recruiterEmail, Long currentId) {
        recruiterContactRepository.findByCompanyNameIgnoreCaseAndRecruiterEmailIgnoreCase(companyName.trim(), recruiterEmail.trim())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(currentId)) {
                        throw new IllegalArgumentException("Recruiter contact already exists for this company and email");
                    }
                });
    }

    private String normalizeMobileNumber(String mobileNumber) {
        return normalizeOptionalField(mobileNumber);
    }

    private String normalizeOptionalField(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }
}
