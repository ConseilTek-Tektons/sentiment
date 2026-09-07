create extension if not exists pgcrypto;
create schema if not exists directory;
create schema if not exists responses;
create schema if not exists app;

create table directory.organisation (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table directory.team (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references directory.organisation(id) on delete cascade,
  name text not null,
  parent_team_id uuid references directory.team(id),
  manager_subject text,
  unique (organisation_id, name)
);

create table directory.person (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references directory.organisation(id) on delete cascade,
  identity_subject text not null,
  email text not null,
  display_name text not null,
  team_id uuid references directory.team(id),
  location text,
  started_on date,
  active boolean not null default true,
  unique (organisation_id, identity_subject)
);

-- The responses schema deliberately has no foreign key to directory.person.
-- anonymous_subject_hash is salted per cycle and cannot be joined outside the analytics service.
create table responses.survey_cycle (
  id uuid primary key default gen_random_uuid(),
  organisation_key uuid not null,
  name text not null,
  kind text not null check (kind in ('pulse', 'annual', 'lifecycle')),
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  minimum_respondents integer not null default 5 check (minimum_respondents >= 5),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'live', 'closed')),
  check (closes_at > opens_at)
);

create table responses.question (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references responses.survey_cycle(id) on delete cascade,
  prompt text not null,
  driver text not null,
  response_type text not null check (response_type in ('scale', 'text', 'choice')),
  position integer not null,
  configuration jsonb not null default '{}'::jsonb,
  unique (cycle_id, position)
);

create table responses.survey_response (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references responses.survey_cycle(id) on delete cascade,
  question_id uuid not null references responses.question(id) on delete cascade,
  anonymous_subject_hash text not null,
  score numeric(5,2),
  comment text,
  dimensions jsonb not null,
  submitted_at timestamptz not null default now(),
  unique (cycle_id, question_id, anonymous_subject_hash),
  check (score is null or score between 0 and 100)
);

create index survey_response_cycle_idx on responses.survey_response (cycle_id);
create index survey_response_dimensions_idx on responses.survey_response using gin (dimensions);

create or replace function app.cohort_scores(
  requested_cycle uuid,
  dimension_name text,
  requested_minimum integer default 5
) returns table (cohort text, respondents bigint, score numeric)
language sql
security definer
set search_path = responses, pg_temp
as $$
  select
    sr.dimensions ->> dimension_name as cohort,
    count(distinct sr.anonymous_subject_hash) as respondents,
    round(avg(sr.score), 1) as score
  from responses.survey_response sr
  where sr.cycle_id = requested_cycle
    and sr.score is not null
    and sr.dimensions ? dimension_name
  group by sr.dimensions ->> dimension_name
  having count(distinct sr.anonymous_subject_hash) >= greatest(requested_minimum, 5)
  order by cohort;
$$;

create table app.review_cycle (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references directory.organisation(id) on delete cascade,
  name text not null,
  stage text not null,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  visibility_policy jsonb not null default '{}'::jsonb
);

create table app.review_packet (
  id uuid primary key default gen_random_uuid(),
  review_cycle_id uuid not null references app.review_cycle(id) on delete cascade,
  subject_person_id uuid not null references directory.person(id),
  reviewer_person_id uuid not null references directory.person(id),
  relation text not null check (relation in ('self', 'manager', 'peer', 'upward')),
  rating numeric(4,2),
  submitted_at timestamptz,
  unique (review_cycle_id, subject_person_id, reviewer_person_id, relation)
);

create table app.goal (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references directory.organisation(id) on delete cascade,
  owner_person_id uuid not null references directory.person(id),
  parent_goal_id uuid references app.goal(id),
  title text not null,
  progress numeric(5,2) not null default 0 check (progress between 0 and 100),
  status text not null default 'on_track' check (status in ('on_track', 'at_risk', 'blocked', 'complete')),
  due_on date not null
);

create table app.action_plan (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references directory.organisation(id) on delete cascade,
  source_cycle_id uuid not null,
  title text not null,
  owner_subject text not null,
  status text not null default 'planned',
  due_on date not null,
  evidence jsonb not null default '[]'::jsonb
);

create table app.audit_event (
  id bigint generated always as identity primary key,
  organisation_id uuid not null,
  actor_subject text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table app.role_policy (
  organisation_id uuid not null references directory.organisation(id) on delete cascade,
  role_key text not null,
  permissions text[] not null default '{}',
  updated_by text not null,
  updated_at timestamptz not null default now(),
  primary key (organisation_id, role_key)
);

revoke all on function app.cohort_scores(uuid, text, integer) from public;
