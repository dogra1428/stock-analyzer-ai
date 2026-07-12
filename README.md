# 📈 Stock Analysis AI Application

A production-ready real-time stock analysis dashboard with AI-powered predictions, technical indicators, and market sentiment analysis. Built with Streamlit for responsive web and mobile-friendly interface.

---

## 🎯 Features

### Core Features
- ✅ **Real-Time Stock Data**: Live data from Yahoo Finance (free, no key required)
- ✅ **AI Predictions**: Ensemble models (LSTM, ARIMA) for 30-day price forecasting
- ✅ **Technical Analysis**: RSI, MACD, Bollinger Bands, Momentum indicators
- ✅ **Market Sentiment**: Rule-based + LLM-powered sentiment analysis
- ✅ **Interactive Charts**: Plotly-based real-time visualizations
- ✅ **Portfolio Tracking**: Manage multiple stocks with position sizing
- ✅ **Mobile Responsive**: Fully responsive design for desktop and mobile
- ✅ **Multi-Source APIs**: Yahoo Finance, Alpha Vantage, Finnhub support

### Advanced Features
- 🔐 API key configuration for enhanced data sources
- 📊 Technical indicators with overbought/oversold signals
- 💭 Sentiment analysis with OpenAI/Anthropic integration (optional)
- 📈 Confidence-weighted price forecasts
- 🎨 Dark theme optimized for extended viewing

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     STREAMLIT FRONTEND                       │
│  (Responsive Web UI + Mobile-optimized Dashboard)            │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   Price      │  Technical   │  AI          │  Sentiment     │
│   Charts     │  Indicators  │  Prediction  │  Analysis      │
└──────────────┴──────────────┴──────────────┴────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
            ┌───────▼────────┐   ┌──────▼──────────┐
            │   STOCK DATA   │   │   ML MODELS     │
            ├────────────────┤   ├─────────────────┤
            │ • Yahoo Finance│   │ • LSTM Network  │
            │ • Alpha Vantage│   │ • ARIMA Model   │
            │ • Finnhub      │   │ • Ensemble      │
            │ • yfinance lib │   │ • Technical TA  │
            └────────────────┘   └─────────────────┘
                    │                    │
            ┌───────▼──────────────────▼────┐
            │  SENTIMENT ANALYSIS MODULE     │
            ├────────────────────────────────┤
            │ • Rule-based text analysis     │
            │ • OpenAI GPT integration       │
            │ • Anthropic Claude integration │
            └────────────────────────────────┘

Data Flow:
1. User selects ticker in Streamlit UI
2. StockDataFetcher retrieves historical + current data
3. ML Models generate 30-day predictions + confidence scores
4. Technical indicators calculate RSI, MACD, Bollinger Bands
5. Sentiment Analyzer processes market context
6. Results visualized in real-time interactive charts
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10 or higher
- pip or conda
- Internet connection for API calls
- 2GB RAM minimum

### Installation

#### 1. Clone or Download Project
```bash
cd stock-analyzer
```

#### 2. Create Virtual Environment (Recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Configure API Keys

**Step A: Create `.env` file**
```bash
cp .env.example .env
```

**Step B: Edit `.env` and add your API keys**

**Option 1: Free Setup (Recommended for Beginners)**
- Yahoo Finance is already free and built-in via `yfinance`
- Just set `YFINANCE_ENABLED=true` in `.env`
- No API key needed!

**Option 2: Enhanced Data Sources (Optional)**

**Alpha Vantage** (free tier: 5 API calls/minute)
- Visit: https://www.alphavantage.co/
- Click "GET FREE API KEY"
- Add to `.env`:
  ```
  ALPHA_VANTAGE_API_KEY=your_key_here
  ```

**Finnhub** (free tier: 60 API calls/minute)
- Visit: https://finnhub.io/
- Sign up and copy API key
- Add to `.env`:
  ```
  FINNHUB_API_KEY=your_key_here
  ```

**Option 3: AI Sentiment Analysis (Optional)**

**OpenAI GPT** (paid, ~$0.001 per analysis)
- Visit: https://platform.openai.com/api-keys
- Create API key
- Add to `.env`:
  ```
  OPENAI_API_KEY=sk-your_key_here
  ```

**Anthropic Claude** (paid, ~$0.0003 per analysis)
- Visit: https://console.anthropic.com/
- Create API key
- Add to `.env`:
  ```
  ANTHROPIC_API_KEY=your_key_here
  ```

### 5. Run Application

```bash
streamlit run app.py
```

The app will open in your default browser at `http://localhost:8501`

---

## 💻 Usage Guide

### Dashboard Overview

1. **Sidebar - Ticker Input**
   - Enter stock ticker (e.g., AAPL, TSLA, GOOGL)
   - Click "🔍 Analyze" button
   - Select historical period (30-730 days)
   - Choose prediction model (Ensemble recommended)

2. **Main Dashboard - Key Metrics**
   - Current price with 5-day change
   - 52-week highs/lows
   - Market capitalization
   - Company sector info

3. **AI Prediction Box**
   - Direction: 📈 BULLISH / 📉 BEARISH / ➡️ NEUTRAL
   - Confidence score (0-100%)
   - Expected 30-day price change percentage

4. **Price Chart**
   - Historical price data (line chart)
   - AI 30-day forecast (dashed line)
   - Confidence band (shaded area)
   - Hover for exact values

5. **Technical Indicators**
   - RSI (Relative Strength Index)
   - MACD (Moving Average Convergence Divergence)
   - Momentum oscillator
   - Buy/sell signals

6. **Portfolio Tracking**
   - Add multiple stocks
   - Set number of shares
   - View total portfolio value
   - Portfolio allocation pie chart

---

## 📊 AI Prediction Models

### Ensemble Model (Recommended)
Combines three approaches for highest accuracy:

1. **LSTM-like Regression**
   - Uses 60-day lookback window
   - Learns patterns from historical data
   - Projects 30-day trend

2. **ARIMA Model**
   - Statistical time-series forecasting
   - Captures momentum and seasonality
   - Weights recent data more heavily

3. **Technical Indicators**
   - RSI, MACD, Bollinger Bands
   - Buy/sell signal generation
   - Overbought/oversold detection

**How Predictions Are Made:**
- Average all three model outputs
- Calculate confidence based on price change magnitude
- Generate directional signal (up/down/neutral)
- Display 30-day price range

### Other Models

**LSTM Model**
- Neural network-based time series prediction
- Captures complex non-linear patterns
- Higher computational cost
- Better for volatile stocks

**ARIMA Model**
- Classic statistical approach
- Good for trending markets
- Simpler, faster computation
- May underperform in high-volatility periods

---

## 🔐 API Configuration Details

### Environment Variables Reference

```env
# Financial Data
YFINANCE_ENABLED=true                      # Yahoo Finance (built-in, free)
ALPHA_VANTAGE_API_KEY=demo                # Alpha Vantage (optional)
FINNHUB_API_KEY=your_key                  # Finnhub (optional)

# AI/LLM Services
OPENAI_API_KEY=sk-...                     # OpenAI (optional, paid)
ANTHROPIC_API_KEY=sk-ant-...              # Anthropic (optional, paid)

# Application Settings
DEBUG_MODE=false                          # Enable verbose logging
HISTORICAL_DAYS=365                       # Default lookback period
REFRESH_INTERVAL=300                      # Cache refresh in seconds
ML_MODEL_TYPE=ensemble                    # lstm|arima|ensemble
TIMEZONE=UTC                              # Data timezone
```

### Fallback Logic
If one data source fails:
1. Primary: Yahoo Finance (always free)
2. Fallback: Alpha Vantage (if key provided)
3. Fallback: Finnhub (if key provided)
4. Error: Display user-friendly message

---

## 📱 Mobile Responsive Design

The application is fully responsive:

**Desktop (1200px+)**
- 5-column metric layout
- Side-by-side charts
- Full portfolio view

**Tablet (768px - 1199px)**
- 3-column metric layout
- Stacked charts
- Collapsed portfolio

**Mobile (< 768px)**
- Single-column layout
- Full-width charts
- Expandable sidebar
- Touch-optimized buttons

---

## 🐛 Troubleshooting

### Common Issues

**"Invalid ticker" error**
- Ensure ticker is uppercase (e.g., AAPL not aapl)
- Check internet connection
- Try with well-known tickers: AAPL, MSFT, GOOGL, TSLA

**"No data found" error**
- Verify ticker is listed on supported exchange
- Check if ticker has been delisted
- Try fetching different date range

**"API rate limit exceeded"**
- Alpha Vantage: Free tier has 5 calls/minute
- Wait 1 minute before next request
- Upgrade to paid plan for higher limits

**Slow performance**
- Reduce `HISTORICAL_DAYS` (default 365)
- Clear Streamlit cache: `streamlit cache clear`
- Run on faster internet connection
- Check system resources (RAM, CPU)

**LLM integration not working**
- Verify API key is correct in `.env`
- Check API key has billing set up (for OpenAI)
- Ensure API key has required permissions
- See console output for error details

---

## 🎯 Code Structure

```
stock-analyzer/
├── app.py                    # Main Streamlit application
├── stock_data.py            # Financial data fetching module
├── ml_models.py             # LSTM, ARIMA, ensemble models + TechnicalIndicators
├── sentiment_analysis.py    # Sentiment analysis with LLM integration
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

### Key Classes

**StockDataFetcher** (`stock_data.py`)
- Unified interface for multiple data sources
- Caching and error handling
- Company info retrieval

**LSTMPredictor** (`ml_models.py`)
- Prepares data for neural network
- Generates 30-day forecasts
- Handles edge cases

**ARIMAPredictor** (`ml_models.py`)
- Statistical time-series modeling
- Captures trends and seasonality

**EnsemblePredictor** (`ml_models.py`)
- Combines multiple models
- Calculates confidence scores
- Technical indicator analysis

**SentimentAnalyzer** (`sentiment_analysis.py`)
- Rule-based keyword matching
- Optional OpenAI/Anthropic integration
- Aggregates multiple sentiment sources

---

## 🚀 Advanced Features Roadmap

### Phase 1: Enhanced Analytics (Next 2 weeks)
- [ ] Multi-timeframe analysis (1H, 4H, 1D, 1W)
- [ ] Support and resistance level detection
- [ ] Volume profile analysis
- [ ] Options chain integration
- [ ] Earnings calendar

### Phase 2: User System (Next 4 weeks)
- [ ] User authentication (Firebase/Auth0)
- [ ] User accounts with saved portfolios
- [ ] Watchlists and alerts
- [ ] Trade history tracking
- [ ] Performance benchmarking

### Phase 3: Advanced Alerts (Next 6 weeks)
- [ ] SMS alerts (Twilio)
- [ ] Email notifications
- [ ] Webhook integrations
- [ ] Custom alert conditions
- [ ] Alert history log

### Phase 4: Portfolio Management (Next 8 weeks)
- [ ] Position tracking with cost basis
- [ ] Gain/loss calculations
- [ ] Tax-loss harvesting suggestions
- [ ] Dividend tracking
- [ ] Rebalancing recommendations

### Phase 5: Social & Collaboration (Next 10 weeks)
- [ ] Share portfolio with friends
- [ ] Community watchlists
- [ ] Expert analysis integration
- [ ] Peer performance comparison
- [ ] Discussion forums

### Phase 6: Advanced Predictions (Next 12 weeks)
- [ ] Deep learning (TensorFlow/PyTorch)
- [ ] Transformer models (BERT for sentiment)
- [ ] Multivariate analysis
- [ ] Regime detection
- [ ] Volatility forecasting (GARCH)

### Phase 7: Real-Time Data (Future)
- [ ] WebSocket connections for live updates
- [ ] Intraday tick data
- [ ] Market microstructure analysis
- [ ] High-frequency trading metrics
- [ ] Stream processing (Kafka)

### Phase 8: Deployment (Future)
- [ ] AWS/GCP/Azure deployment
- [ ] Docker containerization
- [ ] Kubernetes orchestration
- [ ] CI/CD pipeline
- [ ] Multi-instance load balancing
- [ ] Database persistence (PostgreSQL)
- [ ] Caching layer (Redis)

---

## 📚 Dependencies Overview

| Package | Purpose | Version |
|---------|---------|---------|
| `streamlit` | Web UI framework | 1.32.2 |
| `yfinance` | Stock data fetching | 0.2.32 |
| `plotly` | Interactive charts | 5.18.0 |
| `pandas` | Data manipulation | 2.1.4 |
| `scikit-learn` | ML models | 1.3.2 |
| `statsmodels` | ARIMA models | 0.14.0 |
| `tensorflow` | Neural networks (optional) | 2.15.0 |
| `langchain` | LLM integration | 0.1.0 |
| `requests` | HTTP client | 2.31.0 |
| `python-dotenv` | Environment config | 1.0.0 |

---

## 📖 Learning Resources

### Understanding Stock Analysis
- [Investopedia: Technical Analysis](https://www.investopedia.com/terms/t/technicalanalysis.asp)
- [RSI Indicator Explained](https://www.investopedia.com/terms/r/rsi.asp)
- [MACD Guide](https://www.investopedia.com/terms/m/macd.asp)

### Machine Learning for Finance
- [Time Series Forecasting with Python](https://machinelearningmastery.com/time-series-forecasting/)
- [LSTM for Stock Prediction](https://towardsdatascience.com/lstm-for-time-series-prediction-de90976a05ca)
- [Sentiment Analysis for Trading](https://towardsdatascience.com/sentiment-analysis-for-stock-market-prediction-3216b3c2d7c7)

### API Documentation
- [yfinance Documentation](https://github.com/ranaroussi/yfinance)
- [Alpha Vantage API](https://www.alphavantage.co/documentation/)
- [Finnhub API](https://finnhub.io/docs/api/)

---

## 🎓 Pythonic Easter Egg

This application honors Python tradition with the secret `import antigravity` statement hidden in both:
1. `app.py` - Main application file
2. `ml_models.py` - ML models module

Try running these imports in a Python shell to experience the surprise! 🪂

---

## 📄 License

This project is provided as-is for educational and personal use.

---

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional ML models
- More data sources
- Enhanced mobile UI
- Performance optimizations
- Bug fixes and documentation

---

## ⚠️ Disclaimer

**This application is for educational purposes only. It is NOT financial advice.**

- Stock market predictions are inherently uncertain
- Past performance ≠ future results
- Always do your own research
- Consult a financial advisor before investing
- Use at your own risk

---

## 📞 Support

For issues or questions:
1. Check the **Troubleshooting** section above
2. Review error messages in console
3. Verify API keys and internet connection
4. Check GitHub issues
5. Consult documentation links

---

## 🎉 Happy Analyzing!

Start by analyzing popular stocks:
- **Tech**: AAPL, MSFT, GOOGL, TSLA
- **Finance**: JPM, GS, BAC
- **Healthcare**: JNJ, PFE, UNH
- **Energy**: XOM, CVX
- **Retail**: WMT, AMZN, TGT

Good luck with your investments! 📈

---

**Last Updated**: 2024
**Python Version**: 3.10+
**Streamlit Version**: 1.32.2+
