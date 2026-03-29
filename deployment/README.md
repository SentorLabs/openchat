# Deployment Scripts

Each script is self-contained and idempotent — safe to run more than once.

| Script | Platform | Compute | Database |
|---|---|---|---|
| `gcp.sh` | Google Cloud Platform | Cloud Run (serverless) | Cloud SQL PostgreSQL |
| `aws.sh` | Amazon Web Services | App Runner (serverless) | RDS PostgreSQL |
| `azure.sh` | Microsoft Azure | Container Apps (serverless) | Azure Database for PostgreSQL |
| `btp.sh` | SAP Business Technology Platform | Cloud Foundry | PostgreSQL on BTP |

## Quick Start

```bash
# Make executable (first time only)
chmod +x deployment/*.sh

# Deploy to your chosen platform
./deployment/gcp.sh
./deployment/aws.sh
./deployment/azure.sh
./deployment/btp.sh
```

## Configuration

All scripts read optional environment variables so you can override defaults without editing files:

### GCP (`gcp.sh`)

| Variable | Default | Description |
|---|---|---|
| `PROJECT_ID` | current `gcloud` project | GCP project ID |
| `REGION` | `us-central1` | Deployment region |
| `SERVICE_NAME` | `openchat` | Cloud Run service name |
| `DB_INSTANCE` | `openchat-db` | Cloud SQL instance name |

### AWS (`aws.sh`)

| Variable | Default | Description |
|---|---|---|
| `AWS_REGION` | `us-east-1` | AWS region |
| `APP_NAME` | `openchat` | App Runner service name |
| `DB_INSTANCE` | `openchat-db` | RDS instance identifier |

### Azure (`azure.sh`)

| Variable | Default | Description |
|---|---|---|
| `LOCATION` | `eastus` | Azure region |
| `RESOURCE_GROUP` | `openchat-rg` | Resource group name |
| `APP_NAME` | `openchat` | Container App name |

### BTP (`btp.sh`)

| Variable | Default | Description |
|---|---|---|
| `CF_APP_NAME` | `openchat` | CF app name |
| `CF_DB_INSTANCE` | `openchat-db` | CF service instance name |
| `CF_DB_SERVICE_NAME` | `postgresql-db` | CF marketplace service name |
| `CF_DB_PLAN` | `free` | CF service plan |

## After Deployment

Once deployed, visit `https://<your-app-url>/settings` to configure:

- **AI Provider** — OpenAI, Anthropic, Google Gemini, or local Ollama
- **Model** — e.g. `gpt-4o`, `claude-opus-4-6`, `gemini-2.0-flash`
- **API Key** — stored encrypted in your own database, never leaves your infra
- **System Prompt** — shape the personality and focus of your assistant

No environment variable restarts required — settings take effect immediately.

## Prerequisites

| Platform | Required CLIs |
|---|---|
| GCP | `gcloud` (authenticated) |
| AWS | `aws` (configured) + `docker` |
| Azure | `az` (logged in) + `docker` |
| BTP | `cf` v8+ (logged in) |
