# 🔑 API Setup Guide

Complete step-by-step instructions for configuring all optional APIs. **Note: Yahoo Finance (free) is enabled by default and requires no setup.**

---

## Quick Start (Yahoo Finance Only)

**Time Required**: 2 minutes

1. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Keep default settings:
   ```env
   YFINANCE_ENABLED=true
   ```

3. Run the app:
   ```bash
   streamlit run app.py
   ```

Done! You're ready to analyze stocks. No API keys needed.

---

## Enhanced Setup (Recommended for Production)

Follow any or all of these sections to unlock additional features.

---

### 1. Alpha Vantage (Optional - Extended Data)

**What you get:**
- Intraday data (5-minute intervals)
- 20+ technical indicators
- Batch processing support
- Free tier: 500 calls/day, 5 calls/minute

**Steps:**

1. **Visit the website**
   - Go to: https://www.alphavantage.co/
   - Click "GET FREE API KEY" button (top-right)

2. **Sign up**
   - Enter email address
   - Confirm email (check spam folder)
   - You'll receive your API key immediately

3. **Copy your API key**
   - Example: `ABCD1234EFGH5678`
   - Store it safely

4. **Add to .env**
   ```env
   ALPHA_VANTAGE_API_KEY=ABCD1234EFGH5678
   ```

5. **Test it**
   - Restart Streamlit app
   - Try analyzing a ticker
   - Should load faster with more data

**Troubleshooting:**
- "API call frequency" error: Wait 1 minute between requests
- "Empty data" error: Try a different ticker
- No key received: Check spam folder or resend via website

---

### 2. Finnhub (Optional - Real-Time Data)

**What you get:**
- Real-time streaming quotes
- Company news and press releases
- Earnings calendar
- Analyst recommendations
- Free tier: 60 calls/minute

**Steps:**

1. **Visit the website**
   - Go to: https://finnhub.io/
   - Click "Sign up" (top-right)

2. **Create account**
   - Email address
   - Password
   - Create account
   - Email verification (check spam)

3. **Get API key**
   - Log in
   - Go to Dashboard
   - Your API key is displayed
   - Example: `cxxxxxxxxxxxxxxxx`

4. **Add to .env**
   ```env
   FINNHUB_API_KEY=cxxxxxxxxxxxxxxxx
   ```

5. **Test it**
   - Reload app
   - Should have access to latest company news
   - Real-time price updates available

**Troubleshooting:**
- "Unauthorized" error: API key is incorrect
- 403 error: Account tier doesn't support this endpoint
- No data: Check API key permissions in dashboard

---

### 3. OpenAI (Optional - AI Sentiment Analysis)

**What you get:**
- Advanced sentiment analysis using GPT-3.5-turbo
- Market trend interpretation
- Custom analysis prompts
- Professional sentiment scoring
- Pricing: ~$0.0015 per analysis

**Steps:**

1. **Visit OpenAI**
   - Go to: https://platform.openai.com/
   - Sign up for free account (if needed)
   - Go to Dashboard

2. **Create API key**
   - Click "API keys" (left sidebar)
   - Click "Create new secret key"
   - Give it a name (e.g., "Stock Analyzer")
   - Click "Create secret key"
   - Copy the key (example: `sk-abc...xyz`)
   - **IMPORTANT**: Save immediately, won't show again

3. **Add billing**
   - Go to "Billing" → "Overview"
   - Click "Set up paid account"
   - Add payment method
   - Set spending limit (e.g., $10/month for safety)

4. **Add to .env**
   ```env
   OPENAI_API_KEY=sk-abc...xyz
   ```

5. **Test it**
   - Reload app
   - Sentiment analysis will now show "OpenAI" as source
   - More accurate sentiment detection

**Cost Management:**
- Sentiment analysis: $0.0015 per call (estimate)
- Max 10 analyses per stock = ~$0.015 per stock
- Monthly budget: $10 = ~665 stocks analyzed
- Disable in code if costs concern you

**Troubleshooting:**
- "Invalid API key": Copy from dashboard again
- "Rate limit exceeded": Free tier limited to 3 requests/minute
- "Billing issue": Add payment method in billing settings
- "No balance": Set spending limit in settings

---

### 4. Anthropic Claude (Optional - Alternative AI)

**What you get:**
- Alternative to OpenAI
- Claude's advanced reasoning
- Lower API costs
- Similar sentiment analysis quality
- Pricing: ~$0.0003 per analysis

**Steps:**

1. **Visit Anthropic Console**
   - Go to: https://console.anthropic.com/
   - Click "Sign up"
   - Use Google account or email
   - Verify email address

2. **Create API key**
   - Go to "API keys" (top menu)
   - Click "Create key"
   - Give it a name (e.g., "Stock Analyzer")
   - Copy the key: `sk-ant-abc...xyz`
   - **Save immediately**

3. **Add billing** (if not enabled)
   - Go to "Plans" → "Usage"
   - Click "Enable paid plan"
   - Add payment method
   - Set spending limit ($10 recommended)

4. **Add to .env**
   ```env
   ANTHROPIC_API_KEY=sk-ant-abc...xyz
   ```

5. **Test it**
   - Reload app
   - Sentiment analysis shows "Anthropic" source
   - Haiku model used (faster, cheaper)

**Cost Management:**
- Input: $0.00080 per 1M tokens
- Output: $0.0024 per 1M tokens
- Sentiment analysis: ~$0.0003 per call
- Very cost-effective for frequent use

**Troubleshooting:**
- "Invalid API key": Check console dashboard
- "No credits": Add payment method
- Billing issues: Contact Anthropic support
- Not working: Verify key format (starts with sk-ant-)

---

## Environment File Complete Example

Here's a fully configured `.env` file:

```env
# ============ FINANCIAL DATA ============

# Yahoo Finance (built-in, always free)
YFINANCE_ENABLED=true

# Alpha Vantage (optional, free tier: 500 calls/day)
# Get key: https://www.alphavantage.co/
ALPHA_VANTAGE_API_KEY=DEMO

# Finnhub (optional, free tier: 60 calls/min)
# Get key: https://finnhub.io/
FINNHUB_API_KEY=your_finnhub_key_here

# ============ AI / SENTIMENT ANALYSIS ============

# OpenAI GPT (optional, paid)
# Get key: https://platform.openai.com/api-keys
# Cost: ~$0.0015 per sentiment analysis
OPENAI_API_KEY=sk-your_openai_key_here

# Anthropic Claude (optional, paid, cheaper than OpenAI)
# Get key: https://console.anthropic.com/
# Cost: ~$0.0003 per sentiment analysis
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here

# ============ APPLICATION SETTINGS ============

# Enable/disable debug logging
DEBUG_MODE=false

# How many days of historical data to fetch by default
HISTORICAL_DAYS=365

# How often to refresh cached data (seconds)
REFRESH_INTERVAL=300

# ML model type: lstm, arima, or ensemble
ML_MODEL_TYPE=ensemble

# Timezone for data processing
TIMEZONE=UTC
```

---

## Cost Breakdown

| Service | Free Tier | Cost | Usage |
|---------|-----------|------|-------|
| **Yahoo Finance** | Unlimited | $0 | Primary data source |
| **Alpha Vantage** | 500 calls/day | Free | Extended data |
| **Finnhub** | 60 calls/min | Free | Real-time data |
| **OpenAI** | - | $0.0015/analysis | Sentiment analysis |
| **Anthropic** | - | $0.0003/analysis | Sentiment analysis |

**Estimated Monthly Cost:**
- Free-only setup: $0
- With OpenAI: $5-15 (depending on usage)
- With Anthropic: $1-5 (more cost-effective)
- Premium setup (all): $10-20

---

## Security Best Practices

1. **Never commit .env to git**
   ```bash
   echo ".env" >> .gitignore
   ```

2. **Rotate keys regularly**
   - Every 90 days for production
   - Immediately if exposed

3. **Use environment variables in production**
   ```bash
   export OPENAI_API_KEY="your_key"
   streamlit run app.py
   ```

4. **Set spending limits**
   - OpenAI: $10/month default
   - Anthropic: $10/month default
   - Prevents unexpected charges

5. **Monitor usage**
   - Check dashboards weekly
   - Review API call logs
   - Set up billing alerts

---

## Disabling APIs if Needed

If you want to disable certain APIs:

**Disable Alpha Vantage:**
```env
ALPHA_VANTAGE_API_KEY=
```

**Disable OpenAI:**
```env
OPENAI_API_KEY=
```

**Disable all AI sentiment:**
- Remove both OPENAI_API_KEY and ANTHROPIC_API_KEY
- App falls back to rule-based sentiment

---

## Testing Your Setup

Run this Python script to verify all APIs:

```python
# test_apis.py
import os
from dotenv import load_dotenv

load_dotenv()

print("✓ Yahoo Finance: Always enabled (built-in)")

if os.getenv("ALPHA_VANTAGE_API_KEY"):
    print("✓ Alpha Vantage: Enabled")
else:
    print("✗ Alpha Vantage: Not configured")

if os.getenv("FINNHUB_API_KEY"):
    print("✓ Finnhub: Enabled")
else:
    print("✗ Finnhub: Not configured")

if os.getenv("OPENAI_API_KEY"):
    print("✓ OpenAI: Enabled")
else:
    print("✗ OpenAI: Not configured")

if os.getenv("ANTHROPIC_API_KEY"):
    print("✓ Anthropic: Enabled")
else:
    print("✗ Anthropic: Not configured")

print("\nConfiguration complete!")
```

Run with:
```bash
python test_apis.py
```

---

## Troubleshooting API Issues

### General Steps
1. Verify key is correct (copy from source again)
2. Check internet connection
3. Ensure billing/quota not exceeded
4. Review error message carefully
5. Check API service status page

### API-Specific Issues

**Alpha Vantage**
- If "Invalid API call": Key is wrong or service is down
- If "Thank you for using Alpha Vantage!": API is working
- Free tier: 5 calls per minute, 500/day

**Finnhub**
- Requires HTTPS
- Check permissions in dashboard
- Some endpoints require premium tier

**OpenAI**
- Billing must be active (not free trial after credits expire)
- Check "Usage" in dashboard
- Verify model is accessible (gpt-3.5-turbo recommended)

**Anthropic**
- New accounts may have rate limits
- Contact support if repeatedly rate limited
- Haiku model recommended (cheapest)

---

## Additional Resources

- [API Keys Management Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Alpha Vantage Documentation](https://www.alphavantage.co/documentation/)
- [Finnhub API Documentation](https://finnhub.io/docs/api/)

---

## Still Having Issues?

1. **Check the .env file exists** in the root directory
2. **Verify no typos** in variable names
3. **Ensure quotes** are removed from values
4. **Check file permissions** (readable by app)
5. **Restart Streamlit** after .env changes
6. **Clear browser cache** (Ctrl+Shift+Del)
7. **Review console output** for error messages

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready
