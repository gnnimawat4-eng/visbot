-- Company branding & legal identity columns
-- logo_url already exists from 001_initial_schema

alter table companies
  add column if not exists legal_name                       text,
  add column if not exists address_line1                    text,
  add column if not exists address_line2                    text,
  add column if not exists city                             text,
  add column if not exists state                            text,
  add column if not exists pincode                          text,
  add column if not exists gst_number                      text,
  add column if not exists cin_number                      text,
  add column if not exists phone                           text,
  add column if not exists email                           text,
  add column if not exists website                         text,
  add column if not exists authorized_signatory_name       text,
  add column if not exists authorized_signatory_designation text,
  add column if not exists signature_url                   text,
  add column if not exists stamp_url                       text,
  add column if not exists footer_text                     text;
