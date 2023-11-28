#!/bin/bash

# Declare your parameters
declare -a params=("ACCESS_KEY_ID_AWS" "SECRET_ACCESS_KEY_AWS" "GITHUB_TOKEN" "LOG_LEVEL" "LOG_FILE" "S3_BUCKET_NAME" "DATABASE_URL")

# Specify the staging directory
staging_dir="/var/app/staging"

# Create or clear the .env file in the staging directory
echo "" > "$staging_dir/.env"

# Fetch each parameter and append to the .env file
for param in "${params[@]}"
do
    value=$(aws ssm get-parameter --name "$param" --with-decryption --query "Parameter.Value" --output text 2>/var/log/env_creation_error.log)
    if [ $? -eq 0 ]; then
        echo "$param=$value" >> "$staging_dir/.env"
        echo "Fetched parameter: $param" >> /var/log/env_creation_success.log
    else
        echo "Error fetching parameter: $param" >> /var/log/env_creation_error.log
    fi
done

echo "Env file creation completed." >> /var/log/env_creation_success.log

