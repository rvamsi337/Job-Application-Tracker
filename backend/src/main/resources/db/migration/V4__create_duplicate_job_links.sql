create table if not exists duplicate_job_links (
    id bigserial primary key,
    job_url text not null,
    company_name text,
    source_type varchar(32) not null,
    original_uploaded_at timestamp with time zone not null,
    duplicate_detected_at timestamp with time zone not null
);

create index if not exists idx_duplicate_job_links_detected_at on duplicate_job_links(duplicate_detected_at);
create index if not exists idx_duplicate_job_links_job_url on duplicate_job_links(job_url);
