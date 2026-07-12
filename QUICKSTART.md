# ⚡ Quick Start Guide (5 minutes)

Get the Stock Analyzer AI running in 5 minutes with **zero API keys required** for basic functionality!

---

## 🚀 Install & Run (4 steps)

### Step 1: Extract Files
```bash
# Extract the downloaded zip file
unzip stock-analyzer-main.zip
cd stock-analyzer
```

### Step 2: Create Virtual Environment
```bash
# macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Windows (PowerShell)
python -m venv venv
venv\Scripts\Activate.ps1

# Windows (Command Prompt)
python -m venv venv
venv\Scripts\activate.bat
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

This takes ~2-3 minutes on first run.

### Step 4: Run Application
```bash
streamlit run app.py
```

**Your app is live!** Browser opens automatically at `http://localhost:8501`

---

## 🎯 Try It Now

1. **Default ticker loaded**: AAPL (Apple)
2. **Click button**: "🔍 Analyze"
3. **Watch it work**:
   - Real-time price data loads
   - AI prediction displays (30-day forecast)
   - Technical charts render
   - Sentiment analysis completes

---

## 📊 What You Can Do (Free)

### ✅ Without Any API Keys
- View real-time stock prices
- See 1-year historical data
- Get AI predictions (LSTM + ARIMA ensemble)
- Technical indicators (RSI, MACD, Bollinger Bands)
- Add stocks to portfolio
- Track multiple tickers

### ⭐ With Optional Free APIs
- Enhanced data sources
- Intraday analysis
- News sentiment
- Advanced forecasting

### 🔑 With Paid APIs (Optional)
- AI sentiment analysis (OpenAI/Anthropic)
- More accurate predictions
- Custom analysis

---

## 🧪 Test It

### Quick Test Script
```bash
# Test if everything works
python utils.py --test-apis
python utils.py --test-ml
python utils.py --validate-ticker AAPL
```

---

## 📖 Next Steps

### To Add Optional Features
1. **Get free API keys** (see `API_SETUP.md`):
   - Alpha Vantage: https://alphavantage.co
   - Finnhub: https://finnhub.io
   
2. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env`** and add your keys:
   ```
   ALPHA_VANTAGE_API_KEY=your_key_here
   FINNHUB_API_KEY=your_key_here
   ```

4. **Restart app**:
   ```
   streamlit run app.py
   ```

---

## 🆘 Common Issues

### **"ModuleNotFoundError: No module named 'streamlit'"**
```bash
# Install all requirements again
pip install -r requirements.txt --upgrade
```

### **"Port 8501 already in use"**
```bash
# Use different port
streamlit run app.py --server.port 8502
```

### **"No data found for ticker"**
- Check ticker spelling (e.g., AAPL not aapl)
- Use well-known tickers: MSFT, GOOGL, TSLA
- Check internet connection

### **Slow performance**
- Close other apps to free up RAM
- Reduce historical days in settings
- Clear Streamlit cache: `streamlit cache clear`

---

## 📱 Mobile Access

App is **fully responsive**! Access from phone:

1. Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac)
2. Open on phone: `http://YOUR_IP:8501`
3. Full features work on mobile

---

## 🎨 Features Overview

### 💹 Price Chart
- Historical data + AI forecast
- Confidence bands
- Interactive hover details
- Zoom and pan support

### 🤖 AI Prediction
- 30-day price forecast
- Confidence percentage
- Bullish/Bearish/Neutral signal
- Multiple models (LSTM, ARIMA, ensemble)

### 📊 Technical Indicators
- RSI (overbought/oversold)
- MACD (momentum)
- Bollinger Bands (volatility)
- Momentum oscillator

### 💭 Sentiment Analysis
- Market sentiment score
- News context analysis
- Multiple sources
- Confidence rating

### 💼 Portfolio Tracking
- Add unlimited stocks
- Track shares owned
- Calculate total value
- View allocation

---

## 🔧 Customize Appearance

### Change Default Ticker
Edit `app.py`, find:
```python
if "current_ticker" not in st.session_state:
    st.session_state.current_ticker = "AAPL"  # Change this
```

### Change Analysis Days
In app sidebar, move slider to desired range (30-730 days)

### Change Model Type
In sidebar: "Prediction Model" → Select ensemble/lstm/arima

---

## 📚 Learn More

| Document | Purpose |
|----------|---------|
| `README.md` | Full documentation & architecture |
| `API_SETUP.md` | Detailed API configuration guide |
| `DEPLOYMENT.md` | Deploy to cloud (Heroku, AWS, etc.) |
| `utils.py --help` | Utility commands and testing |

---

## 🎯 Common Workflows

### Analyze a Stock
```
1. Enter ticker in sidebar (e.g., TSLA)
2. Click "🔍 Analyze"
3. View prediction and charts
4. Check technical signals
5. Read sentiment analysis
```

### Track a Portfolio
```
1. Analyze first stock
2. Add to portfolio in sidebar
3. Enter number of shares
4. Repeat for other stocks
5. View portfolio summary at bottom
6. See allocation pie chart
```

### Export Data
```
# Scroll to "Recent Data" table
# Click download icon (top-right of table)
# Choose CSV format
# Open in Excel/Google Sheets
```

---

## 💡 Pro Tips

1. **Compare models**: Change "Prediction Model" to see different forecasts
2. **Quick ticker test**: Use `python utils.py --validate-ticker GOOGL`
3. **Clear cache**: `streamlit cache clear` if data looks stale
4. **Terminal tips**: 
   - `Ctrl+C` to stop the app
   - `Ctrl+Shift+R` to refresh browser
   - Check browser console (F12) for errors

---

## 🚀 Ready to Deploy?

**Deploy to free cloud in 5 minutes:**

### Streamlit Cloud (Recommended)
1. Push code to GitHub
2. Visit https://streamlit.io/cloud
3. Click "New app"
4. Select your repository
5. Done! Live at `https://your-app-name.streamlit.app`

See `DEPLOYMENT.md` for other options (Heroku, AWS, Docker).

---

## 📞 Getting Help

1. **Check README.md** → Full documentation
2. **Check API_SETUP.md** → API configuration
3. **Run tests** → `python utils.py --test-apis`
4. **Review error messages** → Often tells you what's wrong
5. **Check console output** → `streamlit run app.py` shows detailed logs

---

## ✨ Easter Egg

This application honors Python tradition! Try this in your terminal:
```python
python -c "import antigravity"
```

You'll understand why it's hidden in our code! 🪂

---

## 📈 Next Advanced Features

Already built-in and ready to use:
- ✅ Multi-source API fallback
- ✅ Technical indicator analysis
- ✅ Portfolio tracking
- ✅ Sentiment analysis
- ✅ Multiple ML models
- ✅ Mobile responsive design
- ✅ Real-time price updates
- ✅ Confidence scoring

Coming soon (in enhancement roadmap):
- 📋 User authentication
- 🔔 Email/SMS alerts
- 📊 Advanced portfolio analysis
- 🤖 Transformer models
- 📱 Native mobile app

---

## 🎓 What You're Running

```
✅ LSTM Neural Network Model
✅ ARIMA Statistical Model
✅ Technical Analysis (7+ indicators)
✅ Sentiment Analysis (NLP)
✅ Multi-source data fetching
✅ Ensemble predictions
✅ Interactive Plotly charts
✅ Real-time Streamlit UI
✅ Mobile-responsive design
✅ Error handling & caching
```

---

**Everything is ready! Start analyzing stocks now!** 📈

Good luck with your investments! 🚀

---

**Last Updated**: 2024 | **Version**: 1.0 | **Status**: Production Ready
