# 🚀 Deployment Guide

Complete instructions for deploying the Stock Analyzer AI application to cloud platforms and production environments.

---

## Table of Contents

1. [Local Development](#local-development)
2. [Streamlit Cloud (Easiest)](#streamlit-cloud)
3. [Heroku Deployment](#heroku-deployment)
4. [AWS Deployment](#aws-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Production Best Practices](#production-best-practices)

---

## Local Development

### Setup (5 minutes)

```bash
# 1. Clone or download project
cd stock-analyzer

# 2. Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure APIs
cp .env.example .env
# Edit .env with your API keys (or leave as-is for free-only mode)

# 5. Run application
streamlit run app.py
```

Application opens at: `http://localhost:8501`

### Development Server Features

- **Hot reload**: Changes to code auto-reload in browser
- **Debug mode**: Set `DEBUG_MODE=true` in `.env`
- **Cache control**: Clear with `streamlit cache clear`
- **Session state**: Preserved across reruns

---

## Streamlit Cloud (Easiest)

**Best for**: Quick deployment, personal projects, free hosting

**Time Required**: 15 minutes

**Cost**: FREE tier available

### Steps

#### 1. Prepare Repository

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create GitHub repository
# Visit: https://github.com/new
# Upload code to GitHub
```

#### 2. Create Streamlit Cloud Account

```
1. Visit: https://streamlit.io/cloud
2. Click "Sign up"
3. Sign in with GitHub account
4. Authorize Streamlit to access your repos
```

#### 3. Deploy Application

```
1. Click "New app" button
2. Select your repository
3. Select branch: main
4. Set main file path: app.py
5. Click "Deploy"
```

Streamlit builds and deploys automatically. App opens in 1-2 minutes.

#### 4. Configure Secrets

```
1. Click "Settings" (gear icon)
2. Go to "Secrets" tab
3. Paste your .env file content:

YFINANCE_ENABLED=true
ALPHA_VANTAGE_API_KEY=your_key
OPENAI_API_KEY=your_key
... etc

4. Save
5. App automatically reloads with secrets
```

#### 5. Share Your App

```
URL format: https://stock-analyzer-username.streamlit.app
Share with anyone - no authentication needed
```

### Streamlit Cloud Benefits

✅ Free tier (unlimited apps)
✅ Custom domain support
✅ Built-in SSL/HTTPS
✅ Automatic deployments from GitHub
✅ Secrets management
✅ Community support

### Streamlit Cloud Limits

⚠️ Free tier: 1 GB RAM
⚠️ Timeout: 24 hours (then sleep)
⚠️ No persistent storage
⚠️ No background jobs

---

## Heroku Deployment

**Best for**: Small teams, simple backend, easy scaling

**Time Required**: 20 minutes

**Cost**: Free tier removed (from Nov 2022), $7+/month for basic dyno

### Prerequisites

- Heroku account (https://www.heroku.com)
- Heroku CLI installed
- Git repository

### Steps

#### 1. Create Heroku App

```bash
# Install Heroku CLI
# macOS: brew tap heroku/brew && brew install heroku
# Windows: Download from https://devcenter.heroku.com/articles/heroku-cli

# Log in
heroku login

# Create app
heroku create your-app-name

# Set region (optional)
heroku create your-app-name --region eu
```

#### 2. Create Procfile

Create file: `Procfile`

```
web: streamlit run app.py --server.port=$PORT --server.address=0.0.0.0
```

#### 3. Create requirements.txt

```bash
# Already created, but verify it includes all dependencies
pip freeze > requirements.txt
```

#### 4. Create runtime.txt

Create file: `runtime.txt`

```
python-3.10.13
```

#### 5. Create .streamlit/config.toml

Create directory and file: `.streamlit/config.toml`

```toml
[client]
showErrorDetails = false
toolbarMode = "minimal"

[logger]
level = "error"

[server]
headless = true
enableXsrfProtection = true
enableCORS = false
```

#### 6. Add Secrets

```bash
# Create .env file with API keys
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set ANTHROPIC_API_KEY=sk-ant-...
heroku config:set ALPHA_VANTAGE_API_KEY=...
heroku config:set FINNHUB_API_KEY=...
```

#### 7. Deploy

```bash
git add .
git commit -m "Add Heroku config"
git push heroku main
```

#### 8. View Live Application

```bash
heroku open
```

App URL: `https://your-app-name.herokuapp.com`

### Heroku Monitoring

```bash
# View logs
heroku logs --tail

# View app info
heroku apps:info

# Scale dynos
heroku ps:scale web=2

# View config
heroku config
```

---

## AWS Deployment

**Best for**: Production apps, high traffic, auto-scaling

**Time Required**: 45 minutes

**Cost**: $5-50+/month (depending on usage)

### Option A: AWS Elastic Beanstalk (Easiest)

#### Setup

```bash
# 1. Install AWS CLI and EB CLI
pip install awsebcli

# 2. Configure AWS credentials
aws configure

# 3. Create Elastic Beanstalk app
eb init -p python-3.10 stock-analyzer
eb create stock-analyzer-env

# 4. Deploy
eb deploy

# 5. Open app
eb open
```

#### Monitor

```bash
# View logs
eb logs

# SSH into instance
eb ssh

# Scale up
eb scale 3

# Check health
eb status
```

### Option B: AWS EC2 + Nginx (More Control)

#### Launch EC2 Instance

```bash
# 1. Go to AWS Console → EC2 → Instances → Launch Instance
# 2. Select: Ubuntu 22.04 LTS
# 3. Instance type: t3.micro (free tier eligible)
# 4. Configure security groups:
#    - Allow SSH (port 22)
#    - Allow HTTP (port 80)
#    - Allow HTTPS (port 443)
# 5. Launch and create key pair
```

#### Connect and Setup

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install -y python3.10 python3-pip python3-venv nginx

# Clone repository
git clone https://github.com/your-username/stock-analyzer.git
cd stock-analyzer

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python packages
pip install -r requirements.txt

# Create .env with API keys
nano .env
# Paste API keys
```

#### Configure Nginx

Create: `/etc/nginx/sites-available/stock-analyzer`

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8501;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/stock-analyzer /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

#### Run Streamlit as Service

Create: `/etc/systemd/system/streamlit.service`

```ini
[Unit]
Description=Streamlit Stock Analyzer
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/stock-analyzer
Environment="PATH=/home/ubuntu/stock-analyzer/venv/bin"
ExecStart=/home/ubuntu/stock-analyzer/venv/bin/streamlit run app.py --server.port=8501 --server.address=0.0.0.0
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable streamlit
sudo systemctl start streamlit

# Check status
sudo systemctl status streamlit
```

#### SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## Docker Deployment

**Best for**: Consistent environments, containerization, Kubernetes

### Dockerfile

Create: `Dockerfile`

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create .streamlit directory
RUN mkdir -p ~/.streamlit

# Create config file
RUN echo "[server]" > ~/.streamlit/config.toml && \
    echo "headless = true" >> ~/.streamlit/config.toml && \
    echo "enableXsrfProtection = false" >> ~/.streamlit/config.toml && \
    echo "port = 8501" >> ~/.streamlit/config.toml && \
    echo "[client]" >> ~/.streamlit/config.toml && \
    echo "showErrorDetails = false" >> ~/.streamlit/config.toml

# Expose port
EXPOSE 8501

# Health check
HEALTHCHECK CMD curl --fail http://localhost:8501/_stcore/health || exit 1

# Run app
CMD ["streamlit", "run", "app.py", "--server.address=0.0.0.0"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  stock-analyzer:
    build: .
    ports:
      - "8501:8501"
    environment:
      - YFINANCE_ENABLED=true
      - ALPHA_VANTAGE_API_KEY=${ALPHA_VANTAGE_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
```

### Build and Run

```bash
# Build image
docker build -t stock-analyzer .

# Run container
docker run -p 8501:8501 \
  -e OPENAI_API_KEY=sk-... \
  stock-analyzer

# Or with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Production Best Practices

### 1. Security

```python
# In app.py - Add authentication (example)
import streamlit as st

def check_password():
    """Returns True if user has entered correct password."""
    if "password_correct" not in st.session_state:
        st.session_state.password_correct = False

    if not st.session_state.password_correct:
        password = st.text_input("Password:", type="password")
        if password == st.secrets.get("APP_PASSWORD", ""):
            st.session_state.password_correct = True
        else:
            st.error("Incorrect password")
            return False
    
    return True

if not check_password():
    st.stop()

# Rest of app...
```

### 2. Error Handling

```python
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

try:
    # Your code
except Exception as e:
    logger.error(f"Error: {e}", exc_info=True)
    st.error("An error occurred. Please try again.")
```

### 3. Performance Optimization

```python
# Cache heavily used functions
@st.cache_data(ttl=3600)  # Cache for 1 hour
def fetch_data(ticker):
    return get_fetcher().fetch_stock_data(ticker)

# Use session state for user inputs
if "ticker" not in st.session_state:
    st.session_state.ticker = "AAPL"

# Lazy load components
if st.checkbox("Show technical analysis"):
    st.plotly_chart(create_technical_chart(df, ticker))
```

### 4. Monitoring

```bash
# Setup monitoring with Sentry
pip install sentry-sdk

import sentry_sdk
sentry_sdk.init(
    dsn="https://your-sentry-dsn@sentry.io/123456",
    traces_sample_rate=0.1
)
```

### 5. Database Integration (PostgreSQL)

```python
import psycopg2
from sqlalchemy import create_engine

# Connection string from environment
db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)

# Save portfolio to database
def save_portfolio(user_id, ticker, shares):
    with engine.connect() as conn:
        conn.execute(
            "INSERT INTO portfolios (user_id, ticker, shares) VALUES (%s, %s, %s)",
            (user_id, ticker, shares)
        )
        conn.commit()
```

### 6. Rate Limiting

```python
from ratelimit import limits, sleep_and_retry
import time

@sleep_and_retry
@limits(calls=5, period=60)  # 5 calls per 60 seconds
def fetch_stock_data_limited(ticker):
    return fetch_data(ticker)
```

### 7. Backup Strategy

```bash
# Daily backup script
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
tar -czf backup_$TIMESTAMP.tar.gz /app/data /app/logs
aws s3 cp backup_$TIMESTAMP.tar.gz s3://your-backup-bucket/
```

---

## Comparison Table

| Platform | Cost | Setup Time | Scalability | Best For |
|----------|------|-----------|-------------|----------|
| **Streamlit Cloud** | Free | 5 min | Low | Personal, learning |
| **Heroku** | $7+/mo | 20 min | Medium | Small teams |
| **AWS Elastic Beanstalk** | $10+/mo | 30 min | High | Growing apps |
| **AWS EC2** | $5+/mo | 45 min | Very High | Full control |
| **Docker + K8s** | $20+/mo | 60 min | Unlimited | Enterprise |

---

## Environment Variables for Production

```env
# Security
APP_PASSWORD=your_secure_password
SECRET_KEY=your_secret_key

# APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
ALPHA_VANTAGE_API_KEY=...
FINNHUB_API_KEY=...

# Database (if applicable)
DATABASE_URL=postgresql://user:pass@localhost/dbname
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=INFO
SENTRY_DSN=https://...

# Performance
CACHE_TTL=3600
MAX_WORKERS=4
```

---

## Troubleshooting Deployment

### App Crashes on Startup

```bash
# Check logs
heroku logs --tail
streamlit logs

# Verify dependencies
pip list
pip install -r requirements.txt --upgrade

# Check Python version
python --version
```

### Out of Memory

```bash
# Streamlit cloud: Use smaller cache TTL
@st.cache_data(ttl=300)  # 5 minutes instead of 1 hour

# Heroku: Upgrade dyno size
heroku ps:resize web=standard-1x
```

### Slow Performance

```python
# Profile code
import cProfile
cProfile.run('fetch_and_cache_data("AAPL")')

# Use profiling decorator
from functools import wraps
import time

def timer(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.time()-start:.2f}s")
        return result
    return wrapper
```

---

## Support & Resources

- **Streamlit Docs**: https://docs.streamlit.io/
- **Streamlit Cloud**: https://streamlit.io/cloud
- **Heroku Docs**: https://devcenter.heroku.com/
- **AWS Docs**: https://docs.aws.amazon.com/
- **Docker Docs**: https://docs.docker.com/

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready
