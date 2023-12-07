#!/bin/bash

# Fetch the current instance ID
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)

LOG_FILE="/var/app/current/combinedaws.log"
LOG_GROUP_NAME="/aws/elasticbeanstalk/ECE461-PackageRegistry-custom-logs"
LOG_STREAM_NAME="${INSTANCE_ID}"

# Create a CloudWatch Logs configuration file
cat <<EOF > /etc/awslogs/config/combinedawslog.conf
[custom_log_file]
datetime_format = %b %d %H:%M:%S
file = ${LOG_FILE}
buffer_duration = 5000
log_stream_name = ${LOG_STREAM_NAME}
initial_position = start_of_file
log_group_name = ${LOG_GROUP_NAME}
EOF

# Restart the CloudWatch Logs agent
systemctl restart awslogsd

