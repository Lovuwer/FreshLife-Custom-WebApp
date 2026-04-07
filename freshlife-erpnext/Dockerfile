FROM frappe/bench:latest

USER frappe
WORKDIR /home/frappe

# Initialize bench with Frappe v15
RUN bench init --frappe-branch version-15 frappe-bench --skip-redis-config-generation

WORKDIR /home/frappe/frappe-bench

# Install ERPNext
RUN bench get-app erpnext --branch version-15

# Install custom FreshLife app
RUN bench get-app freshlife https://github.com/your-org/freshlife.git

# Install Supervisor for multi-process management
USER root
RUN apt-get update && apt-get install -y supervisor && rm -rf /var/lib/apt/lists/*
COPY supervisord.conf /etc/supervisord.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER frappe

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
