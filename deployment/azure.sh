#!/usr/bin/env bash
# =============================================================================
# OpenChat — Microsoft Azure deployment
# =============================================================================
# Deploys the app to Azure Container Apps and provisions an Azure Database
# for PostgreSQL (Flexible Server).
#
# Prerequisites:
#   Azure CLI installed and logged in  (az login)
#   Docker installed
#
# Usage:
#   chmod +x deployment/azure.sh
#   ./deployment/azure.sh
#
# Override defaults by setting env vars before running:
#   LOCATION=westeurope RESOURCE_GROUP=my-rg ./deployment/azure.sh
# =============================================================================
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
LOCATION="${LOCATION:-eastus}"
RESOURCE_GROUP="${RESOURCE_GROUP:-openchat-rg}"
APP_NAME="${APP_NAME:-openchat}"
ACR_NAME="${ACR_NAME:-openchat$(openssl rand -hex 4)}"  # must be globally unique
DB_SERVER="${DB_SERVER:-openchat-db-$(openssl rand -hex 4)}"
DB_NAME="${DB_NAME:-openchat}"
DB_USER="${DB_USER:-openchat}"
CONTAINER_ENV="${CONTAINER_ENV:-openchat-env}"
KEYVAULT_NAME="${KEYVAULT_NAME:-openchat-kv-$(openssl rand -hex 4)}"

# ── Helpers ───────────────────────────────────────────────────────────────────
info()  { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[1;32m[OK]\033[0m    $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m  $*"; }
die()   { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; exit 1; }

command -v az     &>/dev/null || die "Azure CLI not found. Install from https://aka.ms/installazureclimacos"
command -v docker &>/dev/null || die "docker not found. Install from https://docs.docker.com/get-docker/"

info "Deploying OpenChat to Azure"
info "  Location       : $LOCATION"
info "  Resource Group : $RESOURCE_GROUP"
info "  App Name       : $APP_NAME"

# ── Resource Group ────────────────────────────────────────────────────────────
info "Creating resource group '$RESOURCE_GROUP'..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none

# ── Azure Container Registry ──────────────────────────────────────────────────
info "Creating Azure Container Registry '$ACR_NAME'..."
az acr create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACR_NAME" \
  --sku Basic \
  --admin-enabled true \
  --output none

ACR_LOGIN_SERVER=$(az acr show \
  --name "$ACR_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "loginServer" --output tsv)
IMAGE_URI="${ACR_LOGIN_SERVER}/${APP_NAME}:latest"

# ── Build and push image ──────────────────────────────────────────────────────
info "Building and pushing Docker image to ACR..."
az acr login --name "$ACR_NAME"
docker build -t "$APP_NAME:latest" .
docker tag "${APP_NAME}:latest" "$IMAGE_URI"
docker push "$IMAGE_URI"

# ── Azure Database for PostgreSQL ─────────────────────────────────────────────
DB_PASS=$(openssl rand -base64 24 | tr -d '+/=' | head -c 24)
ADMIN_USER="pgadmin"

info "Creating PostgreSQL Flexible Server '$DB_SERVER' (this takes ~5 min)..."
az postgres flexible-server create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DB_SERVER" \
  --location "$LOCATION" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 15 \
  --admin-user "$ADMIN_USER" \
  --admin-password "$DB_PASS" \
  --public-access 0.0.0.0 \
  --output none

az postgres flexible-server db create \
  --resource-group "$RESOURCE_GROUP" \
  --server-name "$DB_SERVER" \
  --database-name "$DB_NAME" \
  --output none

DB_HOST="${DB_SERVER}.postgres.database.azure.com"
DATABASE_URL="postgresql://${ADMIN_USER}:${DB_PASS}@${DB_HOST}:5432/${DB_NAME}?sslmode=require"

# ── Key Vault ─────────────────────────────────────────────────────────────────
info "Creating Key Vault '$KEYVAULT_NAME'..."
az keyvault create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$KEYVAULT_NAME" \
  --location "$LOCATION" \
  --output none

az keyvault secret set \
  --vault-name "$KEYVAULT_NAME" \
  --name "database-url" \
  --value "$DATABASE_URL" \
  --output none

# ── Container Apps Environment ────────────────────────────────────────────────
info "Creating Container Apps environment '$CONTAINER_ENV'..."
az containerapp env create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CONTAINER_ENV" \
  --location "$LOCATION" \
  --output none

# ── Managed Identity for Container App ───────────────────────────────────────
info "Creating managed identity..."
IDENTITY_NAME="${APP_NAME}-identity"
az identity create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$IDENTITY_NAME" \
  --output none

IDENTITY_ID=$(az identity show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$IDENTITY_NAME" \
  --query "id" --output tsv)

IDENTITY_PRINCIPAL=$(az identity show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$IDENTITY_NAME" \
  --query "principalId" --output tsv)

# Grant access to Key Vault and ACR
az keyvault set-policy \
  --name "$KEYVAULT_NAME" \
  --object-id "$IDENTITY_PRINCIPAL" \
  --secret-permissions get list \
  --output none

ACR_ID=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query "id" --output tsv)
az role assignment create \
  --assignee "$IDENTITY_PRINCIPAL" \
  --role AcrPull \
  --scope "$ACR_ID" \
  --output none

# ── Deploy Container App ──────────────────────────────────────────────────────
info "Deploying Container App '$APP_NAME'..."
az containerapp create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME" \
  --environment "$CONTAINER_ENV" \
  --image "$IMAGE_URI" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --user-assigned "$IDENTITY_ID" \
  --registry-identity "$IDENTITY_ID" \
  --target-port 3000 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 5 \
  --cpu 0.5 --memory 1.0Gi \
  --secrets "db-url=${DATABASE_URL}" \
  --env-vars \
    "NODE_ENV=production" \
    "DATABASE_URL=secretref:db-url" \
  --output none

APP_URL=$(az containerapp show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME" \
  --query "properties.configuration.ingress.fqdn" --output tsv)

# ── Done ──────────────────────────────────────────────────────────────────────
ok "Deployment complete!"
echo ""
echo "  App URL    : https://$APP_URL"
echo "  DB Server  : $DB_HOST"
echo "  Key Vault  : $KEYVAULT_NAME"
echo ""
echo "  Open your browser at https://$APP_URL"
echo "  Visit https://$APP_URL/settings to configure your LLM provider."
