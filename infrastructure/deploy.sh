#!/bin/bash
# Deployment script for GCP Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
    echo -e "${RED}Error: GOOGLE_CLOUD_PROJECT environment variable is not set${NC}"
    exit 1
fi

PROJECT_ID=$GOOGLE_CLOUD_PROJECT
REGION=${REGION:-us-central1}
SERVICE_NAME="story-builders"

echo -e "${GREEN}Deploying Story Builders to GCP Cloud Run${NC}"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Build and deploy
echo -e "${YELLOW}Building Docker image...${NC}"
gcloud builds submit --config=infrastructure/cloudbuild.yaml

echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo "Get the service URL:"
echo "  gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'"
echo ""
echo "View logs:"
echo "  gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\" --limit 50 --format json"
