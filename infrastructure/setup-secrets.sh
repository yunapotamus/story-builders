#!/bin/bash
# Script to set up GCP Secret Manager secrets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
    echo -e "${RED}Error: GOOGLE_CLOUD_PROJECT environment variable is not set${NC}"
    exit 1
fi

PROJECT_ID=$GOOGLE_CLOUD_PROJECT

echo -e "${GREEN}Setting up secrets in GCP Secret Manager${NC}"
echo "Project: $PROJECT_ID"
echo ""

# Enable Secret Manager API
echo -e "${YELLOW}Enabling Secret Manager API...${NC}"
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

# Function to create or update a secret
create_secret() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2

    echo -e "${YELLOW}Creating secret: $SECRET_NAME${NC}"

    # Check if secret exists
    if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID &>/dev/null; then
        echo "Secret $SECRET_NAME already exists, adding new version..."
        echo -n "$SECRET_VALUE" | gcloud secrets versions add $SECRET_NAME --data-file=- --project=$PROJECT_ID
    else
        echo "Creating new secret $SECRET_NAME..."
        echo -n "$SECRET_VALUE" | gcloud secrets create $SECRET_NAME --data-file=- --project=$PROJECT_ID
    fi
}

# Prompt for secrets
echo ""
echo -e "${YELLOW}Enter your Slack Bot Token:${NC}"
read -s SLACK_BOT_TOKEN
create_secret "slack-bot-token" "$SLACK_BOT_TOKEN"

echo ""
echo -e "${YELLOW}Enter your Slack Signing Secret:${NC}"
read -s SLACK_SIGNING_SECRET
create_secret "slack-signing-secret" "$SLACK_SIGNING_SECRET"

echo ""
echo -e "${YELLOW}Enter your Anthropic API Key (or press Enter to skip):${NC}"
read -s ANTHROPIC_API_KEY
if [ ! -z "$ANTHROPIC_API_KEY" ]; then
    create_secret "anthropic-api-key" "$ANTHROPIC_API_KEY"
fi

echo ""
echo -e "${YELLOW}Enter your OpenAI API Key (or press Enter to skip):${NC}"
read -s OPENAI_API_KEY
if [ ! -z "$OPENAI_API_KEY" ]; then
    create_secret "openai-api-key" "$OPENAI_API_KEY"
fi

echo ""
echo -e "${GREEN}Secrets setup complete!${NC}"
echo ""
echo "Grant Cloud Run access to secrets with:"
echo "  gcloud projects add-iam-policy-binding $PROJECT_ID \\"
echo "    --member='serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com' \\"
echo "    --role='roles/secretmanager.secretAccessor'"
