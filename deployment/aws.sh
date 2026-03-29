#!/usr/bin/env bash
# =============================================================================
# OpenChat — Amazon Web Services deployment
# =============================================================================
# Deploys the app to AWS App Runner and provisions an RDS (PostgreSQL) instance.
#
# Prerequisites:
#   AWS CLI installed and configured  (aws configure)
#   Docker installed (used to build and push the image)
#
# Usage:
#   chmod +x deployment/aws.sh
#   ./deployment/aws.sh
#
# Override defaults by setting env vars before running:
#   AWS_REGION=eu-west-1 APP_NAME=openchat ./deployment/aws.sh
# =============================================================================
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
AWS_REGION="${AWS_REGION:-us-east-1}"
APP_NAME="${APP_NAME:-openchat}"
DB_INSTANCE="${DB_INSTANCE:-openchat-db}"
DB_NAME="${DB_NAME:-openchat}"
DB_USER="${DB_USER:-openchat}"
ECR_REPO="${ECR_REPO:-${APP_NAME}}"

# ── Helpers ───────────────────────────────────────────────────────────────────
info()  { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[1;32m[OK]\033[0m    $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m  $*"; }
die()   { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; exit 1; }

command -v aws    &>/dev/null || die "aws CLI not found. Install from https://aws.amazon.com/cli/"
command -v docker &>/dev/null || die "docker not found. Install from https://docs.docker.com/get-docker/"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_URI="${ECR_REGISTRY}/${ECR_REPO}:latest"

info "Deploying OpenChat to AWS"
info "  Account : $ACCOUNT_ID"
info "  Region  : $AWS_REGION"
info "  App     : $APP_NAME"

# ── ECR repository ────────────────────────────────────────────────────────────
info "Creating ECR repository (if needed)..."
aws ecr describe-repositories --repository-names "$ECR_REPO" \
  --region "$AWS_REGION" &>/dev/null || \
aws ecr create-repository --repository-name "$ECR_REPO" \
  --region "$AWS_REGION" --image-scanning-configuration scanOnPush=true

# ── Build and push image ──────────────────────────────────────────────────────
info "Building Docker image..."
docker build -t "$ECR_REPO:latest" .

info "Pushing image to ECR..."
aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$ECR_REGISTRY"
docker tag "${ECR_REPO}:latest" "$IMAGE_URI"
docker push "$IMAGE_URI"

# ── RDS (PostgreSQL) ──────────────────────────────────────────────────────────
DB_PASS=$(openssl rand -base64 24 | tr -d '+/=' | head -c 24)

if aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE" \
   --region "$AWS_REGION" &>/dev/null; then
  warn "RDS instance '$DB_INSTANCE' already exists — skipping creation."
  DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE" \
    --region "$AWS_REGION" \
    --query "DBInstances[0].Endpoint.Address" --output text)
  warn "Using existing endpoint: $DB_ENDPOINT"
  warn "Update the DATABASE_URL secret manually if the password changed."
else
  info "Creating RDS PostgreSQL instance (this takes ~10 min)..."
  aws rds create-db-instance \
    --db-instance-identifier "$DB_INSTANCE" \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version "15" \
    --master-username "$DB_USER" \
    --master-user-password "$DB_PASS" \
    --db-name "$DB_NAME" \
    --allocated-storage 20 \
    --publicly-accessible \
    --region "$AWS_REGION"

  info "Waiting for RDS to become available..."
  aws rds wait db-instance-available \
    --db-instance-identifier "$DB_INSTANCE" \
    --region "$AWS_REGION"

  DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE" \
    --region "$AWS_REGION" \
    --query "DBInstances[0].Endpoint.Address" --output text)
fi

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_ENDPOINT}:5432/${DB_NAME}"

# ── Secrets Manager ───────────────────────────────────────────────────────────
info "Storing DATABASE_URL in AWS Secrets Manager..."
SECRET_NAME="openchat/database-url"
aws secretsmanager create-secret \
  --name "$SECRET_NAME" \
  --secret-string "$DATABASE_URL" \
  --region "$AWS_REGION" 2>/dev/null || \
aws secretsmanager update-secret \
  --secret-id "$SECRET_NAME" \
  --secret-string "$DATABASE_URL" \
  --region "$AWS_REGION"

SECRET_ARN=$(aws secretsmanager describe-secret \
  --secret-id "$SECRET_NAME" \
  --region "$AWS_REGION" \
  --query "ARN" --output text)

# ── IAM role for App Runner ───────────────────────────────────────────────────
ROLE_NAME="${APP_NAME}-apprunner-role"
TRUST_POLICY='{
  "Version":"2012-10-17",
  "Statement":[{
    "Effect":"Allow",
    "Principal":{"Service":"tasks.apprunner.amazonaws.com"},
    "Action":"sts:AssumeRole"
  }]
}'

info "Creating IAM role for App Runner (if needed)..."
aws iam get-role --role-name "$ROLE_NAME" &>/dev/null || \
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY"

aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly

# Inline policy to read the secret
POLICY_DOC=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue"],
    "Resource": "$SECRET_ARN"
  }]
}
EOF
)
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "read-db-secret" \
  --policy-document "$POLICY_DOC"

ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query "Role.Arn" --output text)

# ── App Runner service ────────────────────────────────────────────────────────
info "Deploying App Runner service..."
SERVICE_CONFIG=$(cat <<EOF
{
  "ServiceName": "${APP_NAME}",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "${IMAGE_URI}",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentSecrets": {
          "DATABASE_URL": "${SECRET_ARN}"
        },
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production"
        }
      }
    },
    "AutoDeploymentsEnabled": true,
    "AuthenticationConfiguration": {
      "AccessRoleArn": "${ROLE_ARN}"
    }
  },
  "InstanceConfiguration": {
    "Cpu": "1 vCPU",
    "Memory": "2 GB"
  }
}
EOF
)

if aws apprunner list-services --region "$AWS_REGION" \
   --query "ServiceSummaryList[?ServiceName=='${APP_NAME}']" \
   --output text | grep -q "$APP_NAME"; then
  warn "App Runner service already exists — triggering redeployment..."
  SERVICE_ARN=$(aws apprunner list-services --region "$AWS_REGION" \
    --query "ServiceSummaryList[?ServiceName=='${APP_NAME}'].ServiceArn" \
    --output text)
  aws apprunner start-deployment --service-arn "$SERVICE_ARN" --region "$AWS_REGION"
else
  aws apprunner create-service \
    --cli-input-json "$SERVICE_CONFIG" \
    --region "$AWS_REGION"
  SERVICE_ARN=$(aws apprunner list-services --region "$AWS_REGION" \
    --query "ServiceSummaryList[?ServiceName=='${APP_NAME}'].ServiceArn" \
    --output text)
fi

info "Waiting for service to become running..."
aws apprunner wait service-running --service-arn "$SERVICE_ARN" --region "$AWS_REGION" 2>/dev/null || true

SERVICE_URL=$(aws apprunner describe-service \
  --service-arn "$SERVICE_ARN" \
  --region "$AWS_REGION" \
  --query "Service.ServiceUrl" --output text)

# ── Done ──────────────────────────────────────────────────────────────────────
ok "Deployment complete!"
echo ""
echo "  App URL : https://$SERVICE_URL"
echo "  DB host : $DB_ENDPOINT"
echo ""
echo "  Open your browser at https://$SERVICE_URL"
echo "  Visit https://$SERVICE_URL/settings to configure your LLM provider."
