@'
# VEGAH Cloud Platform

A containerized job-processing platform built with Next.js, NestJS, PostgreSQL, Redis, and BullMQ. The platform exposes REST APIs for submitting and retrieving jobs, while a background worker processes queued jobs asynchronously.

## Architecture

The application consists of five Docker Compose services:

| Service | Technology | Responsibility |
|---|---|---|
| Frontend | Next.js, React | Web application |
| Backend | NestJS, TypeScript | REST API and job management |
| Worker | NestJS, BullMQ | Asynchronous job processing |
| Database | PostgreSQL 16 | Persistent job data |
| Queue | Redis 7 | Job queue and background processing |

### Job processing flow

1. A client submits a task to the backend.
2. The backend creates a job record in PostgreSQL.
3. The backend adds the job to the BullMQ queue in Redis.
4. The worker retrieves and processes the queued job.
5. The job result and status are persisted in PostgreSQL.
6. The client retrieves the job status and result through the backend API.

## Technology Stack

- Frontend: Next.js 16, React 19, TypeScript
- Backend: NestJS 12, Node.js 22, TypeScript
- Background processing: BullMQ
- Queue: Redis 7
- Database: PostgreSQL 16
- Containerization: Docker and Docker Compose
- CI/CD: GitHub Actions
- Container registry: GitHub Container Registry (GHCR)
- Cloud deployment target: AWS EC2

## Prerequisites

Install the following:

- Git
- Docker Desktop with Docker Compose
- Node.js 22 or later (for running applications outside Docker)

## Local Development Setup

### 1. Clone the repository

```powershell
git clone https://github.com/Vivek-Venugopal-Gits/vegah-cloud-platform.git
cd vegah-cloud-platform