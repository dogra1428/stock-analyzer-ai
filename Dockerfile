FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONIOENCODING=utf-8

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create Streamlit configuration directory and default config
RUN mkdir -p /root/.streamlit && \
    echo '[server]' > /root/.streamlit/config.toml && \
    echo 'headless = true' >> /root/.streamlit/config.toml && \
    echo 'enableXsrfProtection = false' >> /root/.streamlit/config.toml && \
    echo 'port = 8501' >> /root/.streamlit/config.toml && \
    echo 'address = "0.0.0.0"' >> /root/.streamlit/config.toml && \
    echo '[client]' >> /root/.streamlit/config.toml && \
    echo 'showErrorDetails = false' >> /root/.streamlit/config.toml

# Expose ports for both frontends
EXPOSE 8501
EXPOSE 8000

# Default command starts the Streamlit dashboard
CMD ["streamlit", "run", "app.py"]
