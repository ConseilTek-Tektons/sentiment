insert into directory.organisation (id, name, slug) values ('00000000-0000-4000-8000-000000000001', 'Northstar', 'northstar') on conflict do nothing;

insert into directory.team (id, organisation_id, name) values
('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Engineering'),
('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'Go-to-market'),
('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'Operations')
on conflict do nothing;

insert into responses.survey_cycle (id, organisation_key, name, kind, opens_at, closes_at, status) values
('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Q3 engagement pulse', 'pulse', '2026-09-01T12:00:00Z', '2026-09-11T21:00:00Z', 'live')
on conflict do nothing;

insert into responses.question (id, cycle_id, prompt, driver, response_type, position) values
('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'I have the tools and information I need to do my best work.', 'Enablement', 'scale', 1),
('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'My manager sets clear priorities.', 'Manager effectiveness', 'scale', 2)
on conflict do nothing;
