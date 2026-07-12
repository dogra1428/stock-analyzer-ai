"""
stock_data.py — Financial data fetching from multiple sources.
Handles yfinance, Alpha Vantage, and Finnhub APIs with fallback logic.
"""

import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple

import numpy as np
import pandas as pd
import requests
import yfinance as yf
from dotenv import load_dotenv

load_dotenv()


class StockDataFetcher:
    """Unified interface for fetching stock data from multiple sources."""

    def __init__(self):
        self.alpha_vantage_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        self.finnhub_key = os.getenv("FINNHUB_API_KEY")
        self.use_yfinance = os.getenv("YFINANCE_ENABLED", "true").lower() == "true"
        self.historical_days = int(os.getenv("HISTORICAL_DAYS", "365"))

    def fetch_stock_data(
        self, ticker: str, days: Optional[int] = None
    ) -> Optional[pd.DataFrame]:
        """
        Fetch historical stock data.
        
        Args:
            ticker: Stock symbol (e.g., 'AAPL')
            days: Number of days of history (uses HISTORICAL_DAYS from env if None)
        
        Returns:
            DataFrame with OHLCV data or None if fetch fails
        """
        if days is None:
            days = self.historical_days

        try:
            # Map days to a yfinance period
            if days <= 5:
                period = "5d"
            elif days <= 30:
                period = "1mo"
            elif days <= 90:
                period = "3mo"
            elif days <= 180:
                period = "6mo"
            elif days <= 365:
                period = "1y"
            elif days <= 730:
                period = "2y"
            else:
                period = "5y"

            if self.use_yfinance:
                return self._fetch_yfinance(ticker, None, None, period=period)
            elif self.alpha_vantage_key:
                return self._fetch_alpha_vantage(ticker, days)
            else:
                return None
        except Exception as e:
            print(f"[ERROR] Failed to fetch {ticker}: {e}")
            return None

    def _fetch_yfinance(
        self, ticker: str, start_date: Optional[datetime], end_date: Optional[datetime], period: Optional[str] = None
    ) -> pd.DataFrame:
        """Fetch from Yahoo Finance."""
        if period:
            df = yf.download(ticker, period=period, progress=False)
        else:
            df = yf.download(ticker, start=start_date, end=end_date, progress=False)
            
        if df.empty:
            raise ValueError(f"No data found for {ticker}")
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        df.index.name = "Date"
        return df.reset_index()

    def _fetch_alpha_vantage(self, ticker: str, days: int) -> Optional[pd.DataFrame]:
        """Fetch from Alpha Vantage API."""
        url = "https://www.alphavantage.co/query"
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": ticker,
            "outputsize": "full" if days > 100 else "compact",
            "apikey": self.alpha_vantage_key,
        }

        response = requests.get(url, params=params, timeout=10)
        data = response.json()

        if "Error Message" in data:
            raise ValueError(data["Error Message"])
        if "Time Series (Daily)" not in data:
            raise ValueError(f"Unexpected response format for {ticker}")

        time_series = data["Time Series (Daily)"]
        records = []
        for date_str, ohlcv in time_series.items():
            records.append(
                {
                    "Date": datetime.strptime(date_str, "%Y-%m-%d"),
                    "Open": float(ohlcv["1. open"]),
                    "High": float(ohlcv["2. high"]),
                    "Low": float(ohlcv["3. low"]),
                    "Close": float(ohlcv["4. close"]),
                    "Volume": int(float(ohlcv["5. volume"])),
                }
            )

        df = pd.DataFrame(records).sort_values("Date")
        return df.head(days) if len(df) > days else df

    def fetch_company_info(self, ticker: str) -> Dict:
        """Fetch company information and key metrics."""
        try:
            stock = yf.Ticker(ticker)
            info = stock.info or {}

            # Helper to get float or default
            def get_float(val, default=0.0):
                if val is None or val == "N/A":
                    return default
                try:
                    return float(val)
                except ValueError:
                    return default

            name = info.get("longName") or info.get("shortName") or ticker
            sector = info.get("sector", "N/A")
            market_cap = get_float(info.get("marketCap"), 0.0)
            pe_ratio = info.get("trailingPE")
            if pe_ratio is None or pe_ratio == "N/A":
                pe_ratio = "N/A"
            else:
                pe_ratio = get_float(pe_ratio)
                
            div_yield = get_float(info.get("dividendYield"), 0.0)
            high_52 = get_float(info.get("fiftyTwoWeekHigh") or info.get("regularMarketDayHigh"), 0.0)
            low_52 = get_float(info.get("fiftyTwoWeekLow") or info.get("regularMarketDayLow"), 0.0)
            description = info.get("longBusinessSummary", "")
            eps = info.get("trailingEps")
            if eps is None or eps == "N/A":
                eps = "N/A"
            else:
                eps = get_float(eps)
                
            free_cf = info.get("freeCashflow")
            if free_cf is None or free_cf == "N/A":
                free_cf = "N/A"
            else:
                free_cf = get_float(free_cf)

            return {
                "name": name,
                "sector": sector,
                "market_cap": market_cap,
                "pe_ratio": pe_ratio,
                "dividend_yield": div_yield,
                "52_week_high": high_52,
                "52_week_low": low_52,
                "description": description,
                "eps": eps,
                "free_cash_flow": free_cf,
            }
        except Exception as e:
            print(f"[ERROR] Failed to fetch info for {ticker}: {e}")
            return {
                "name": ticker,
                "sector": "N/A",
                "market_cap": 0.0,
                "pe_ratio": "N/A",
                "dividend_yield": 0.0,
                "52_week_high": 0.0,
                "52_week_low": 0.0,
                "description": "",
                "eps": "N/A",
                "free_cash_flow": "N/A"
            }

    def validate_ticker(self, ticker: str) -> bool:
        """Check if a ticker symbol is valid."""
        try:
            # First try downloading a small slice of data (highly robust for global tickers)
            df = yf.download(ticker.upper(), period="5d", progress=False)
            if df is not None and not df.empty:
                return True
            # Fallback to info check
            stock = yf.Ticker(ticker.upper())
            info = stock.info
            return info is not None and len(info) > 0
        except Exception:
            return False

    def get_current_price(self, ticker: str) -> Optional[float]:
        """Get the latest closing price for a ticker."""
        try:
            stock = yf.Ticker(ticker)
            info = stock.info or {}
            price = info.get("currentPrice") or info.get("regularMarketPrice")
            if price is not None:
                return float(price)
            # Fallback to historical download
            df = yf.download(ticker.upper(), period="5d", progress=False)
            if df is not None and not df.empty:
                if isinstance(df.columns, pd.MultiIndex):
                    df.columns = df.columns.get_level_values(0)
                return float(df["Close"].iloc[-1])
            return None
        except Exception:
            return None

    def fetch_intraday_data(self, ticker: str, interval: str = "1h") -> Optional[pd.DataFrame]:
        """Fetch intraday data at specified interval (1m, 5m, 15m, 30m, 1h, daily)."""
        try:
            df = yf.download(ticker, period="5d", interval=interval, progress=False)
            if df.empty:
                return None
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
            df.index.name = "DateTime"
            return df.reset_index()
        except Exception as e:
            print(f"[ERROR] Failed to fetch intraday data for {ticker}: {e}")
            return None


# Singleton instance
_fetcher = None


def get_fetcher() -> StockDataFetcher:
    """Get or create the singleton fetcher instance."""
    global _fetcher
    if _fetcher is None:
        _fetcher = StockDataFetcher()
    return _fetcher
