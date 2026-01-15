FROM python:3.12-slim

WORKDIR /app

# Copy dashboard files
COPY index.html .
COPY user_stats.html .
COPY accuracy_metrics.html .
COPY server.py .

# Expose dashboard port
EXPOSE 7896

# Run dashboard server
CMD ["python", "server.py"]
