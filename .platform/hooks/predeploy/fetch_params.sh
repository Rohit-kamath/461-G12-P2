#!/bin/bash

declare -a params=("ACCESS_KEY_ID_AWS" "SECRET_ACCESS_KEY_AWS" "GITHUB_TOKEN" "LOG_LEVEL" "LOG_FILE" "S3_BUCKET_NAME" "DATABASE_URL")

echo "" > /var/app/current/.env

for param in "${params[@]}"
do
    value=$(aws ssm get-parameter --name "$param" --with-decryption --query "Parameter.Value" --output text)
    echo "$param=$value" >> /var/app/current/.env
done