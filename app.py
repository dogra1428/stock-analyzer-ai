"""
Stock Analysis AI Application
==============================
A real-time stock analysis dashboard with AI predictions, technical analysis, and sentiment.

Run with:
    streamlit run app.py

Architecture:
    - Frontend: Streamlit (auto-responsive for mobile/desktop)
    - Backend: Python with FastAPI-ready structure
    - Data: yfinance (Yahoo Finance)
    - AI/ML: LSTM, ARIMA, ensemble models + LLM sentiment (optional)
    - Charts: Plotly (interactive)
"""

import os
from datetime import datetime, timedelta
from typing import Optional, List

import antigravity  # ✨ Easter Egg - Pythonic tradition ✨
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import streamlit as st
from dotenv import load_dotenv

from stock_data import get_fetcher
from ml_models import get_prediction, TechnicalIndicators
from sentiment_analysis import get_analyzer

# ====================== Configuration ======================
load_dotenv()

st.set_page_config(
    page_title="ApexTrade AI",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for responsive mobile design
st.markdown(
    """
    <style>
        /* Mobile-friendly adjustments */
        @media (max-width: 768px) {
            .stMetricLabel { font-size: 12px; }
            .stMetricValue { font-size: 18px; }
        }
        
        /* Dark theme optimization */
        :root {
            --primary: #00D9FF;
            --success: #00FF41;
            --danger: #FF6B6B;
            --warning: #FFD93D;
        }
        
        .metric-card {
            background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
            border-radius: 10px;
            padding: 20px;
            border: 1px solid #404055;
        }
        
        .prediction-box {
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            font-weight: bold;
        }
        
        .bullish {
            background-color: rgba(0, 255, 65, 0.2);
            color: #00FF41;
            border: 1px solid #00FF41;
        }
        
        .bearish {
            background-color: rgba(255, 107, 107, 0.2);
            color: #FF6B6B;
            border: 1px solid #FF6B6B;
        }
        
        .neutral {
            background-color: rgba(255, 217, 61, 0.2);
            color: #FFD93D;
            border: 1px solid #FFD93D;
        }
    </style>
    """,
    unsafe_allow_html=True,
)

# ====================== State Management ======================

if "portfolio" not in st.session_state:
    st.session_state.portfolio = []

if "cache" not in st.session_state:
    st.session_state.cache = {}

if "cache_time" not in st.session_state:
    st.session_state.cache_time = {}


# ====================== Helper Functions ======================

@st.cache_data(ttl=300)
def fetch_and_cache_data(ticker: str, days: int = 365):
    """Fetch stock data with caching."""
    fetcher = get_fetcher()
    return fetcher.fetch_stock_data(ticker, days)


@st.cache_data(ttl=300)
def fetch_company_info(ticker: str):
    """Fetch company info with caching."""
    fetcher = get_fetcher()
    return fetcher.fetch_company_info(ticker)


def is_valid_ticker(ticker: str) -> bool:
    """Validate ticker symbol."""
    fetcher = get_fetcher()
    return fetcher.validate_ticker(ticker)


def get_current_price(ticker: str) -> Optional[float]:
    """Get current price for ticker."""
    fetcher = get_fetcher()
    return fetcher.get_current_price(ticker)


def format_currency(value: float) -> str:
    """Format value as currency."""
    if value >= 1_000_000:
        return f"${value/1_000_000:.2f}M"
    elif value >= 1_000:
        return f"${value/1_000:.2f}K"
    return f"${value:.2f}"


def format_percentage(value: float) -> str:
    """Format value as percentage with color."""
    sign = "+" if value > 0 else ""
    return f"{sign}{value:.2f}%"


# ====================== Charts ======================

def create_price_chart(df: pd.DataFrame, ticker: str, prediction: Optional[dict] = None) -> go.Figure:
    """Create interactive price chart with optional forecast."""
    fig = go.Figure()

    # Historical prices
    fig.add_trace(
        go.Scatter(
            x=df["Date"],
            y=df["Close"],
            mode="lines",
            name="Historical Price",
            line=dict(color="#00D9FF", width=2),
            hovertemplate="<b>%{x|%Y-%m-%d}</b><br>Price: $%{y:.2f}<extra></extra>",
        )
    )

    # Add prediction if available
    if prediction and len(prediction.get("forecast", [])) > 0:
        forecast = prediction["forecast"]
        last_date = df["Date"].iloc[-1]
        future_dates = pd.date_range(start=last_date, periods=len(forecast), freq="D")

        fig.add_trace(
            go.Scatter(
                x=future_dates,
                y=forecast,
                mode="lines",
                name="AI Forecast (30d)",
                line=dict(color="#00FF41", width=2, dash="dash"),
                hovertemplate="<b>%{x|%Y-%m-%d}</b><br>Forecast: $%{y:.2f}<extra></extra>",
            )
        )

        # Add confidence band
        std_dev = np.std(forecast)
        upper_band = forecast + std_dev
        lower_band = forecast - std_dev

        fig.add_trace(
            go.Scatter(
                x=future_dates,
                y=upper_band,
                fill=None,
                mode="lines",
                line_color="rgba(0,255,65,0)",
                showlegend=False,
            )
        )

        fig.add_trace(
            go.Scatter(
                x=future_dates,
                y=lower_band,
                fill="tonexty",
                mode="lines",
                line_color="rgba(0,255,65,0)",
                name="Confidence Band",
                fillcolor="rgba(0,255,65,0.1)",
                showlegend=True,
            )
        )

    fig.update_layout(
        title=f"{ticker} - Historical & Predicted Price",
        xaxis_title="Date",
        yaxis_title="Price (USD)",
        hovermode="x unified",
        template="plotly_dark",
        height=500,
        margin=dict(l=0, r=0, t=40, b=0),
        font=dict(family="Courier New, monospace"),
    )

    return fig


def create_technical_chart(df: pd.DataFrame, ticker: str) -> go.Figure:
    """Create technical indicators chart."""
    prices = df["Close"].values
    ti = TechnicalIndicators()

    rsi = ti.calculate_rsi(prices)
    macd, signal, histogram = ti.calculate_macd(prices)
    momentum = ti.calculate_momentum(prices)

    fig = go.make_subplots(
        rows=3, cols=1,
        shared_xaxes=True,
        subplot_titles=("RSI", "MACD", "Momentum"),
        specs=[[{}], [{}], [{}]],
    )

    # RSI
    fig.add_trace(
        go.Scatter(
            x=df["Date"],
            y=rsi,
            name="RSI",
            line=dict(color="#00D9FF"),
            showlegend=True,
        ),
        row=1, col=1,
    )
    fig.add_hline(y=70, line_dash="dash", line_color="red", row=1, col=1)
    fig.add_hline(y=30, line_dash="dash", line_color="green", row=1, col=1)

    # MACD
    fig.add_trace(
        go.Scatter(
            x=df["Date"],
            y=macd,
            name="MACD",
            line=dict(color="#00FF41"),
        ),
        row=2, col=1,
    )
    fig.add_trace(
        go.Scatter(
            x=df["Date"],
            y=signal,
            name="Signal",
            line=dict(color="#FFD93D"),
        ),
        row=2, col=1,
    )

    # Momentum
    fig.add_trace(
        go.Scatter(
            x=df["Date"],
            y=momentum,
            name="Momentum",
            line=dict(color="#FF6B6B"),
            fill="tozeroy",
            fillcolor="rgba(255, 107, 107, 0.2)",
        ),
        row=3, col=1,
    )

    fig.update_layout(
        title=f"{ticker} - Technical Indicators",
        template="plotly_dark",
        height=700,
        hovermode="x unified",
        font=dict(family="Courier New, monospace"),
    )

    return fig


def create_allocation_chart(portfolio: List[dict]) -> go.Figure:
    """Create portfolio allocation pie chart."""
    if not portfolio:
        return None

    labels = [item["ticker"] for item in portfolio]
    values = [item.get("shares", 0) for item in portfolio]

    fig = go.Figure(data=[go.Pie(labels=labels, values=values)])
    fig.update_layout(
        title="Portfolio Allocation by Shares",
        template="plotly_dark",
        height=400,
    )

    return fig


# ====================== Main App Layout ======================

def main():
    # Header
    st.markdown("# 📈 Stock Analysis AI")
    st.markdown(
        "Real-time stock analysis with AI predictions, technical indicators, and sentiment analysis"
    )

    # Sidebar
    with st.sidebar:
        st.header("⚙️ Configuration")

        # Ticker input
        ticker_input = st.text_input(
            "Stock Ticker",
            value="AAPL",
            placeholder="Enter ticker (e.g., AAPL, TSLA, GOOGL)",
        ).upper()

        # Validate and search
        col1, col2 = st.columns([3, 1])
        with col1:
            search_button = st.button("🔍 Analyze", use_container_width=True)
        with col2:
            st.write("")  # spacing

        if search_button:
            if not ticker_input:
                st.error("Please enter a ticker symbol")
            elif not is_valid_ticker(ticker_input):
                st.error(f"'{ticker_input}' is not a valid ticker")
            else:
                st.session_state.current_ticker = ticker_input
                if ticker_input not in st.session_state.portfolio:
                    st.session_state.portfolio.append(
                        {"ticker": ticker_input, "shares": 0, "buy_price": 0}
                    )

        st.divider()

        # Analysis options
        st.subheader("Analysis Options")
        days = st.slider("Historical Days", 30, 730, 365, 30)
        model_type = st.selectbox(
            "Prediction Model",
            ["ensemble", "lstm", "arima"],
            help="Ensemble: combines multiple models for best accuracy",
        )

        st.divider()

        # Portfolio management
        st.subheader("📊 Your Portfolio")
        if st.session_state.portfolio:
            for i, item in enumerate(st.session_state.portfolio):
                col1, col2, col3 = st.columns([2, 1, 1])
                with col1:
                    st.write(f"**{item['ticker']}**")
                with col2:
                    shares = st.number_input(
                        "Shares",
                        value=item["shares"],
                        key=f"shares_{i}",
                        min_value=0,
                        max_value=10000,
                    )
                    st.session_state.portfolio[i]["shares"] = shares
                with col3:
                    if st.button("❌", key=f"remove_{i}"):
                        st.session_state.portfolio.pop(i)
                        st.rerun()
        else:
            st.info("No stocks in portfolio yet")

        st.divider()

        # API Settings info
        with st.expander("🔑 API Keys", expanded=False):
            st.markdown("""
            ### Configure APIs
            
            Create a `.env` file with:
            ```
            YFINANCE_ENABLED=true
            ALPHA_VANTAGE_API_KEY=your_key
            FINNHUB_API_KEY=your_key
            OPENAI_API_KEY=your_key
            ANTHROPIC_API_KEY=your_key
            ```
            
            - **Yahoo Finance**: Free (no key)
            - **Alpha Vantage**: https://www.alphavantage.co/
            - **Finnhub**: https://finnhub.io/
            - **OpenAI**: https://platform.openai.com/
            - **Anthropic**: https://console.anthropic.com/
            """)

    # Main content
    if "current_ticker" not in st.session_state:
        st.session_state.current_ticker = "AAPL"

    ticker = st.session_state.current_ticker

    # Fetch data
    with st.spinner(f"📥 Fetching data for {ticker}..."):
        df = fetch_and_cache_data(ticker, days)
        company_info = fetch_company_info(ticker)

    if df is None or df.empty:
        st.error(f"Could not fetch data for {ticker}")
        return

    # Get prediction
    with st.spinner("🤖 Generating AI prediction..."):
        prediction = get_prediction(df, model_type)

    # Key metrics
    st.subheader(f"{ticker} - Key Metrics")

    col1, col2, col3, col4, col5 = st.columns(5)

    with col1:
        current_price = df["Close"].iloc[-1]
        st.metric(
            "Current Price",
            format_currency(current_price),
            delta=f"{(df['Close'].iloc[-1] - df['Close'].iloc[-5]) / df['Close'].iloc[-5] * 100:.2f}% (5d)",
        )

    with col2:
        st.metric(
            "Day Change",
            f"${df['Close'].iloc[-1] - df['Close'].iloc[-2]:.2f}",
            delta_color="off",
        )

    with col3:
        st.metric("52-Week High", format_currency(company_info.get("52_week_high", 0)))

    with col4:
        st.metric("52-Week Low", format_currency(company_info.get("52_week_low", 0)))

    with col5:
        st.metric("Market Cap", format_currency(company_info.get("market_cap", 0)))

    st.divider()

    # AI Prediction Box
    col1, col2 = st.columns([2, 1])

    with col1:
        st.subheader("🤖 AI Prediction")
        direction = prediction.get("direction", "➡️ NEUTRAL")
        confidence = prediction.get("confidence", 0)
        price_change = prediction.get("price_change_pct", 0)

        # Color-coded prediction
        if "BULLISH" in direction:
            css_class = "bullish"
            emoji = "📈"
        elif "BEARISH" in direction:
            css_class = "bearish"
            emoji = "📉"
        else:
            css_class = "neutral"
            emoji = "➡️"

        st.markdown(
            f"""
            <div class="prediction-box {css_class}">
                <div style="font-size: 24px; margin-bottom: 10px;">{emoji} {direction}</div>
                <div>Confidence: {confidence:.1f}%</div>
                <div>Expected Change: {format_percentage(price_change)}</div>
                <div style="font-size: 12px; margin-top: 10px;">30-day forecast</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with col2:
        st.subheader("📊 Company Info")
        st.write(f"**Name:** {company_info.get('name', 'N/A')}")
        st.write(f"**Sector:** {company_info.get('sector', 'N/A')}")
        st.write(f"**P/E Ratio:** {company_info.get('pe_ratio', 'N/A')}")
        st.write(f"**Dividend Yield:** {format_percentage(company_info.get('dividend_yield', 0) * 100)}")

    st.divider()

    # Charts
    col1, col2 = st.columns([3, 1])

    with col1:
        st.subheader("📈 Price Chart & Forecast")
        price_fig = create_price_chart(df, ticker, prediction)
        st.plotly_chart(price_fig, use_container_width=True)

    with col2:
        st.subheader("📡 Signals")
        signals = prediction.get("signals", {})
        st.write(f"**RSI**: {signals.get('rsi_signal', 'N/A')}")
        st.write(f"**MACD**: {signals.get('macd_signal', 'N/A')}")
        st.write(f"**BB**: {signals.get('bb_position', 'N/A')}")

    # Technical analysis
    st.subheader("🔧 Technical Analysis")
    tech_fig = create_technical_chart(df, ticker)
    st.plotly_chart(tech_fig, use_container_width=True)

    # Sentiment analysis
    st.subheader("💭 Market Sentiment")
    analyzer = get_analyzer()
    sentiment = analyzer.get_sentiment(
        ticker,
        f"{company_info.get('description', '')} Current price: ${current_price:.2f}",
    )

    col1, col2, col3 = st.columns(3)
    with col1:
        sentiment_score = sentiment.get("score", 0.5)
        sentiment_text = sentiment.get("overall", "neutral").upper()
        st.metric("Overall Sentiment", sentiment_text, f"Score: {sentiment_score:.2f}")

    with col2:
        sources = sentiment.get("sources", {})
        text_sent = sources.get("text_analysis", {})
        st.metric("Text Analysis", text_sent.get("sentiment", "N/A"))

    with col3:
        st.metric("Available LLM Analysis", "OpenAI/Anthropic" if sentiment["sources"]["openai"] or sentiment["sources"]["anthropic"] else "Configure API keys")

    st.divider()

    # Data table
    st.subheader("📋 Recent Data")
    display_df = df[["Date", "Open", "High", "Low", "Close", "Volume"]].tail(10).copy()
    display_df["Close"] = display_df["Close"].apply(lambda x: f"${x:.2f}")
    display_df["Open"] = display_df["Open"].apply(lambda x: f"${x:.2f}")
    display_df["High"] = display_df["High"].apply(lambda x: f"${x:.2f}")
    display_df["Low"] = display_df["Low"].apply(lambda x: f"${x:.2f}")
    st.dataframe(display_df, use_container_width=True)

    st.divider()

    # Portfolio summary
    if st.session_state.portfolio:
        st.subheader("💼 Portfolio Summary")
        col1, col2 = st.columns([2, 1])

        with col1:
            portfolio_data = []
            total_value = 0
            for item in st.session_state.portfolio:
                price = get_current_price(item["ticker"])
                if price:
                    value = price * item["shares"]
                    total_value += value
                    portfolio_data.append(
                        {
                            "Ticker": item["ticker"],
                            "Shares": item["shares"],
                            "Price": f"${price:.2f}",
                            "Value": f"${value:.2f}",
                        }
                    )

            if portfolio_data:
                portfolio_df = pd.DataFrame(portfolio_data)
                st.dataframe(portfolio_df, use_container_width=True)
                st.metric("Total Portfolio Value", format_currency(total_value))

        with col2:
            if len(st.session_state.portfolio) > 1:
                alloc_fig = create_allocation_chart(st.session_state.portfolio)
                if alloc_fig:
                    st.plotly_chart(alloc_fig, use_container_width=True)


if __name__ == "__main__":
    main()
