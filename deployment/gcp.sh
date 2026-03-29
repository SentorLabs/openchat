#!/usr/bin/env bash
# =============================================================================
# OpenChat — Google Cloud Platform deployment
# =============================================================================
# Deploys the app to Cloud Run and provisions a Cloud SQL (PostgreSQL) instance.
#
# Prerequisites:
#   gcloud CLI installed and authenticated  (gcloud auth login)
#   Billing enabled on the target project
#
# Usage:
#   chmod +x deployment/gcp.sh
#   ./deployment/gcp.sh
#
# Override defaults by setting env vars before running:
#   PROJECT_ID=my-project REGION=us-central1 ./deployment/gcp.sh
# =============================================================================
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-openchat}"
DB_INSTANCE="${DB_INSTANCE:-openchat-db}"
DB_NAME="${DB_NAME:-openchat}"
DB_USER="${DB_USER:-openchat}"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# ── Helpers ───────────────────────────────────────────────────────────────────
info()  { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[1;32m[OK]\033[0m    $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m  $*"; }
die()   { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; exit 1; }

[[ -z "$PROJECT_ID" ]] && die "PROJECT_ID is not set. Run: gcloud config set project YOUR_PROJECT_ID"

info "Deploying OpenChat to GCP"
info "  Project : $PROJECT_ID"
info "  Region  : $REGION"
info "  Service : $SERVICE_NAME"

# ── Enable APIs ───────────────────────────────────────────────────────────────
info "Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project "$PROJECT_ID" --quiet

# ── Cloud SQL (PostgreSQL) ────────────────────────────────────────────────────
if gcloud sql instances describe "$DB_INSTANCE" --project "$PROJECT_ID" &>/dev/null; then
  warn "Cloud SQL instance '$DB_INSTANCE' already exists — skipping creation."
else
  info "Creating Cloud SQL instance '$DB_INSTANCE' (this takes ~5 min)..."
  gcloud sql instances create "$DB_INSTANCE" \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region="$REGION" \
    --project "$PROJECT_ID"
fi

# Create database and user if they don't exist
gcloud sql databases create "$DB_NAME" \
  --instance="$DB_INSTANCE" --project "$PROJECT_ID" 2>/dev/null || warn "Database already exists."

DB_PASS=$(openssl rand -base64 24 | tr -d '+/=' | head -c 24)
gcloud sql users create "$DB_USER" \
  --instance="$DB_INSTANCE" \
  --password="$DB_PASS" \
  --project "$PROJECT_ID" 2>/dev/null || {
  warn "User may already exist. Resetting password..."
  gcloud sql users set-password "$DB_USER" \
    --instance="$DB_INSTANCE" --password="$DB_PASS" --project "$PROJECT_ID"
}

# Get connection name  (project:region:instance)
INSTANCE_CONN=$(gcloud sql instances describe "$DB_INSTANCE" \
  --project "$PROJECT_ID" --format="value(connectionName)")

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}?host=/cloudsql/${INSTANCE_CONN}"

# ── Store secret ──────────────────────────────────────────────────────────────
info "Storing DATABASE_URL in Secret Manager..."
echo -n "$DATABASE_URL" | gcloud secrets create openchat-db-url \
  --data-file=- --project "$PROJECT_ID" 2>/dev/null || \
echo -n "$DATABASE_URL" | gcloud secrets versions add openchat-db-url \
  --data-file=- --project "$PROJECT_ID"

# ── Build & push image ────────────────────────────────────────────────────────
info "Building and pushing container image..."
gcloud builds submit . \
  --tag "$IMAGE" \
  --project "$PROJECT_ID"

# ── Deploy to Cloud Run ───────────────────────────────────────────────────────
info "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances "$INSTANCE_CONN" \
  --set-secrets "DATABASE_URL=openchat-db-url:latest" \
  --set-env-vars "NODE_ENV=production" \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --project "$PROJECT_ID"

# ── Done ──────────────────────────────────────────────────────────────────────
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region "$REGION" --project "$PROJECT_ID" --format="value(status.url)")

ok "Deployment complete!"
echo ""
echo "  App URL : $SERVICE_URL"
echo "  DB host : $INSTANCE_CONN"
echo ""
echo "  Open your browser at $SERVICE_URL"
echo "  Visit $SERVICE_URL/settings to configure your LLM provider."
