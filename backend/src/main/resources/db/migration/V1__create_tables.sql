create sequence if not exists job_serial_no_seq start 1 increment 1;

create table if not exists job_applications (
    id bigserial primary key,
    serial_no bigint not null default nextval('job_serial_no_seq'),
    job_url text not null unique,
    company_name text,
    source_type varchar(32) not null,
    status varchar(32) not null,
    uploaded_at timestamp with time zone not null,
    applied_at timestamp with time zone,
    status_updated_at timestamp with time zone not null
);

create unique index if not exists uk_job_applications_serial_no on job_applications(serial_no);
create index if not exists idx_job_applications_uploaded_at on job_applications(uploaded_at);
create index if not exists idx_job_applications_status on job_applications(status);

create table if not exists recruiter_contacts (
    id bigserial primary key,
    company_name text not null,
    recruiter_email text not null,
    created_at timestamp with time zone not null,
    constraint uk_recruiter_company_email unique (company_name, recruiter_email)
);

create index if not exists idx_recruiter_company_name on recruiter_contacts(company_name);
