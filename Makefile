PNPM ?= pnpm

.PHONY: install dev build test check up down db-migrate db-seed plan-aws plan-azure

install:
	$(PNPM) install --frozen-lockfile

dev:
	$(PNPM) dev

build:
	$(PNPM) build

test:
	$(PNPM) test

check:
	$(PNPM) check

up:
	docker compose up --build

down:
	docker compose down

db-migrate:
	$(PNPM) db:migrate

db-seed:
	$(PNPM) db:seed

plan-aws:
	terraform -chdir=infra/aws fmt -check
	terraform -chdir=infra/aws init -backend=false
	terraform -chdir=infra/aws validate

plan-azure:
	az bicep build --file infra/azure/main.bicep --stdout >/dev/null
