#!/bin/bash

declare -a params=("ACCESS_KEY_ID_AWS" "SECRET_ACCESS_KEY_AWS" "GITHUB_TOKEN" "LOG_LEVEL" "LOG_FILE" "S3_BUCKET_NAME" "DATABASE_URL")

echo "" > /var/app/current/.env

for param in "${params[@]}"
do
    value=$(aws ssm get-parameter --name "$param" --with-decryption --query "Parameter.Value" --output text 2>/var/log/env_creation_error.log)
    if [ $? -eq 0 ]; then
        echo "$param=$value" >> /var/app/current/.env
        echo "Fetched parameter: $param" >> /var/log/env_creation_success.log
    else
        echo "Error fetching parameter: $param" >> /var/log/env_creation_error.log
    fi
done

echo "Env file creation completed." >> /var/log/env_creation_success.log