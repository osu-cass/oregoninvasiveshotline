#!/bin/sh
set -e

# Process LOAD_BALANCER_IPS environment variable
if [ -n "$LOAD_BALANCER_IPS" ]; then
    # Convert comma-separated IPs to nginx set_real_ip_from directives
    REAL_IP_FROM=""
    IFS=','
    for ip in $LOAD_BALANCER_IPS; do
        # Trim whitespace
        ip=$(echo "$ip" | xargs)
        REAL_IP_FROM="${REAL_IP_FROM}set_real_ip_from ${ip};"$'\n'
    done
    export LOAD_BALANCER_IPS="$REAL_IP_FROM"
else
    # Default to accept from any IP
    export LOAD_BALANCER_IPS="set_real_ip_from 0.0.0.0/0;"
fi

# Substitute environment variables in the template
envsubst '${LOAD_BALANCER_IPS}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Execute the original nginx entrypoint with nginx daemon command
exec /docker-entrypoint.sh nginx -g "daemon off;"
