#!/usr/bin/env bash
# =============================================================================
# OpenChat — SAP Business Technology Platform (BTP) deployment
# =============================================================================
# Deploys the app to SAP BTP Cloud Foundry and provisions a PostgreSQL service
# instance (via SAP HANA Cloud or PostgreSQL on BTP).
#
# Prerequisites:
#   CF CLI v8+  installed         (https://docs.cloudfoundry.org/cf-cli/)
#   SAP BTP account with CF space available
#   Logged in:  cf login -a API_ENDPOINT -o ORG -s SPACE
#
# Usage:
#   chmod +x deployment/btp.sh
#   ./deployment/btp.sh
#
# Override defaults by setting env vars before running:
#   CF_APP_NAME=myapp CF_DB_SERVICE=postgresql-db ./deployment/btp.sh
#
# Notes on BTP PostgreSQL:
#   The PostgreSQL service name and plan depend on your BTP entitlements.
#   Common options:
#     - "postgresql-db"  / "free"    (PostgreSQL on SAP BTP, free tier)
#     - "postgresql-db"  / "trial"   (trial accounts)
#     - "hana-cloud"     / "hana"    (SAP HANA Cloud)
#   Set CF_DB_SERVICE_NAME and CF_DB_PLAN to match your entitlement.
# =============================================================================
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
CF_APP_NAME="${CF_APP_NAME:-openchat}"
CF_DB_INSTANCE="${CF_DB_INSTANCE:-openchat-db}"
CF_DB_SERVICE_NAME="${CF_DB_SERVICE_NAME:-postgresql-db}"
CF_DB_PLAN="${CF_DB_PLAN:-free}"
CF_MEMORY="${CF_MEMORY:-2G}"
CF_DISK="${CF_DISK:-2G}"
CF_INSTANCES="${CF_INSTANCES:-1}"

# ── Helpers ───────────────────────────────────────────────────────────────────
info()  { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[1;32m[OK]\033[0m    $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m  $*"; }
die()   { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; exit 1; }

command -v cf &>/dev/null || die "CF CLI not found. Install from https://docs.cloudfoundry.org/cf-cli/install-go-cli.html"

# Verify CF login
cf target &>/dev/null || die "Not logged into Cloud Foundry. Run: cf login -a <API> -o <ORG> -s <SPACE>"

CURRENT_TARGET=$(cf target 2>&1 | head -5)
info "Deploying OpenChat to SAP BTP"
echo "$CURRENT_TARGET"
echo ""

# ── PostgreSQL service instance ───────────────────────────────────────────────
if cf service "$CF_DB_INSTANCE" &>/dev/null; then
  warn "Service '$CF_DB_INSTANCE' already exists — skipping creation."
else
  info "Creating PostgreSQL service instance '$CF_DB_INSTANCE'..."
  info "  Service : $CF_DB_SERVICE_NAME"
  info "  Plan    : $CF_DB_PLAN"
  cf create-service "$CF_DB_SERVICE_NAME" "$CF_DB_PLAN" "$CF_DB_INSTANCE" || {
    echo ""
    warn "Service creation failed. Check that you have the '$CF_DB_SERVICE_NAME' / '$CF_DB_PLAN'"
    warn "entitlement in your BTP subaccount."
    warn "Available services: cf marketplace"
    die "Could not create PostgreSQL service."
  }

  info "Waiting for service to be ready..."
  for i in $(seq 1 30); do
    STATUS=$(cf service "$CF_DB_INSTANCE" | grep "status:" | awk '{print $2}' || true)
    if [[ "$STATUS" == "create" ]]; then
      STAGE=$(cf service "$CF_DB_INSTANCE" | grep "message:" | cut -d: -f2- | xargs || true)
      info "  (${i}/30) $STAGE"
    fi
    LAST_OP=$(cf service "$CF_DB_INSTANCE" | grep "type:" | awk '{print $2}' || true)
    if cf service "$CF_DB_INSTANCE" | grep -q "succeeded"; then
      break
    fi
    sleep 10
  done
fi

# ── Ensure manifest.yml references the correct app and service ────────────────
MANIFEST_FILE="manifest.yml"
if [[ ! -f "$MANIFEST_FILE" ]]; then
  die "manifest.yml not found. Run this script from the project root."
fi

# Patch app name and service binding dynamically if they differ from defaults
if ! grep -q "name: ${CF_APP_NAME}" "$MANIFEST_FILE"; then
  warn "manifest.yml app name differs from CF_APP_NAME='${CF_APP_NAME}'."
  warn "Patching manifest.yml in-place..."
  sed -i.bak "s/name: .*/name: ${CF_APP_NAME}/" "$MANIFEST_FILE"
fi

if ! grep -q "\\- ${CF_DB_INSTANCE}" "$MANIFEST_FILE"; then
  warn "manifest.yml service binding differs from CF_DB_INSTANCE='${CF_DB_INSTANCE}'."
  warn "Patching manifest.yml in-place..."
  # Replace the first services list entry
  sed -i.bak "s/- openchat-db/- ${CF_DB_INSTANCE}/" "$MANIFEST_FILE"
fi

# ── Set additional env vars ───────────────────────────────────────────────────
# DATABASE_URL is injected by the service binding (VCAP_SERVICES).
# The app reads VCAP_SERVICES if DATABASE_URL is not set; this is standard CF behaviour.
# You can also set it explicitly below if your app expects a plain DATABASE_URL:
#
#   DB_CREDS=$(cf service-key "$CF_DB_INSTANCE" openchat-key 2>/dev/null | tail -n +2)
#   ... parse and export DATABASE_URL ...
#
# For now we rely on the service binding; the pg library reads VCAP_SERVICES automatically
# via cf-env or you can add a small adapter. See DEPLOY.md for details.

# ── Push application ──────────────────────────────────────────────────────────
info "Pushing application to Cloud Foundry..."
cf push "$CF_APP_NAME" \
  -f "$MANIFEST_FILE" \
  -m "$CF_MEMORY" \
  -k "$CF_DISK" \
  -i "$CF_INSTANCES" \
  --no-start

info "Binding PostgreSQL service to app..."
cf bind-service "$CF_APP_NAME" "$CF_DB_INSTANCE" 2>/dev/null || \
  warn "Service may already be bound."

# ── Parse VCAP_SERVICES and set DATABASE_URL ──────────────────────────────────
info "Creating service key to extract connection details..."
SERVICE_KEY_NAME="openchat-key"
cf create-service-key "$CF_DB_INSTANCE" "$SERVICE_KEY_NAME" 2>/dev/null || true

# Parse connection details from service key
RAW_CREDS=$(cf service-key "$CF_DB_INSTANCE" "$SERVICE_KEY_NAME" 2>/dev/null | tail -n +3)

if echo "$RAW_CREDS" | python3 -c "import sys,json; d=json.load(sys.stdin); \
  creds=d.get('credentials', d); \
  print('postgresql://{}:{}@{}:{}/{}'.format(creds['username'],creds['password'],creds['hostname'],creds['port'],creds['dbname']))" \
  > /tmp/openchat_db_url 2>/dev/null; then
  DATABASE_URL=$(cat /tmp/openchat_db_url)
  rm -f /tmp/openchat_db_url
  info "Setting DATABASE_URL environment variable..."
  cf set-env "$CF_APP_NAME" DATABASE_URL "$DATABASE_URL"
else
  warn "Could not auto-extract DATABASE_URL from service key."
  warn "Set it manually: cf set-env $CF_APP_NAME DATABASE_URL 'postgresql://...'"
fi

cf set-env "$CF_APP_NAME" NODE_ENV production

# ── Start application ─────────────────────────────────────────────────────────
info "Starting application..."
cf start "$CF_APP_NAME"

# ── Show result ───────────────────────────────────────────────────────────────
APP_URL=$(cf app "$CF_APP_NAME" | grep "routes:" | awk '{print $2}')

ok "Deployment complete!"
echo ""
echo "  App URL       : https://$APP_URL"
echo "  CF App Name   : $CF_APP_NAME"
echo "  DB Instance   : $CF_DB_INSTANCE"
echo ""
echo "  Open your browser at https://$APP_URL"
echo "  Visit https://$APP_URL/settings to configure your LLM provider."
echo ""
echo "  Useful CF commands:"
echo "    cf logs $CF_APP_NAME --recent   # view recent logs"
echo "    cf restage $CF_APP_NAME         # rebuild after env var changes"
echo "    cf scale $CF_APP_NAME -i 2      # scale to 2 instances"
