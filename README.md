# PawsConnect

[![CI](https://github.com/ccalimlimmark007/pawsconnect/actions/workflows/tests.yml/badge.svg)](https://github.com/ccalimlimmark007/pawsconnect/actions/workflows/tests.yml)

A pet adoption platform built with Laravel 12, Inertia.js, and React.

## Stack

- **Backend** — Laravel 12, Laravel Fortify (auth), Laravel Sanctum (API tokens), Spatie Activity Log
- **Frontend** — React 19, TypeScript, Inertia.js v2, Tailwind CSS v4, shadcn/ui
- **Database** — SQLite (local/test), MariaDB (production via XAMPP)
- **Storage** — Local disk (dev), AWS S3 / Cloudflare R2 (production)

## Features

- Pet listings with filtering, search, and pagination
- Adopter preference profiles and pet matching / recommendation engine (100-pt weighted score)
- Adoption application flow with document uploads and home visit scheduling
- Role-based access control — adopter, shelter_staff, admin
- REST API (`/api/v1`) with Bearer token authentication
- API token management UI at **Settings → API Tokens**

## Local setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm install
npm run dev
```

Then visit `http://localhost:8000`.

**Seeded accounts**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pawsconnect.test | password |
| Shelter staff | shelter@pawsconnect.test | password |
| Adopter | adopter@pawsconnect.test | password |

## Running tests

```bash
# All tests
./vendor/bin/pest

# PHP code style check (read-only)
./vendor/bin/pint --test

# TypeScript type check
npm run types

# ESLint
npm run lint:check
```

## CI

Every push and pull request to `main` runs four parallel jobs via GitHub Actions:

| Job | Command | Description |
|-----|---------|-------------|
| Tests (PHP 8.2) | `./vendor/bin/pest --ci` | Pest feature + unit tests |
| Tests (PHP 8.4) | `./vendor/bin/pest --ci` | Same on latest PHP |
| PHP Code Style | `./vendor/bin/pint --test` | Pint style check (no auto-fix) |
| TypeScript | `npm run types` | `tsc --noEmit` |
| JS/TS Lint | `npm run lint:check` | ESLint |

**Blocking PR merges**: enable branch protection on `main` in **GitHub → Settings → Branches → Add rule**, then check *Require status checks to pass before merging* and select the five jobs above (`Tests (PHP 8.2)`, `Tests (PHP 8.4)`, `PHP Code Style`, `TypeScript`, `JS/TS Lint`).

## API

See [docs/API.md](docs/API.md) for the full REST API reference.
