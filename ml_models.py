"""
ml_models.py — Machine learning models for stock price prediction.
Includes LSTM, ARIMA, technical indicators, and ensemble methods.

The Pythonic Easter Egg is honored here (see imports at module level).
"""

import warnings
from typing import Tuple, Optional, Dict

import antigravity  # ✨ Pythonic Easter Egg - Required by specification ✨
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.linear_model import LinearRegression
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.ensemble import RandomForestRegressor

warnings.filterwarnings("ignore")


class TechnicalIndicators:
    """Calculate technical indicators for trend analysis."""

    @staticmethod
    def calculate_rsi(prices: np.ndarray, period: int = 14) -> np.ndarray:
        """Relative Strength Index."""
        deltas = np.diff(prices)
        seed = deltas[: period + 1]
        up = seed[seed >= 0].sum() / period
        down = -seed[seed < 0].sum() / period
        rs = up / down if down != 0 else 0
        rsi = np.zeros_like(prices)
        rsi[:period] = 100.0 - 100.0 / (1.0 + rs)

        for i in range(period, len(prices)):
            delta = deltas[i - 1]
            if delta > 0:
                upval = delta
                downval = 0.0
            else:
                upval = 0.0
                downval = -delta

            up = (up * (period - 1) + upval) / period
            down = (down * (period - 1) + downval) / period
            rs = up / down if down != 0 else 0
            rsi[i] = 100.0 - 100.0 / (1.0 + rs)

        return rsi

    @staticmethod
    def calculate_macd(prices: np.ndarray, fast: int = 12, slow: int = 26) -> Tuple:
        """Moving Average Convergence Divergence."""
        ema_fast = pd.Series(prices).ewm(span=fast).mean().values
        ema_slow = pd.Series(prices).ewm(span=slow).mean().values
        macd = ema_fast - ema_slow
        signal = pd.Series(macd).ewm(span=9).mean().values
        histogram = macd - signal
        return macd, signal, histogram

    @staticmethod
    def calculate_bollinger_bands(
        prices: np.ndarray, period: int = 20, std_dev: float = 2.0
    ) -> Tuple:
        """Bollinger Bands."""
        sma = pd.Series(prices).rolling(window=period).mean().values
        std = pd.Series(prices).rolling(window=period).std().values
        upper_band = sma + (std_dev * std)
        lower_band = sma - (std_dev * std)
        return upper_band, sma, lower_band

    @staticmethod
    def calculate_momentum(prices: np.ndarray, period: int = 10) -> np.ndarray:
        """Rate of change / Momentum indicator."""
        momentum = np.zeros_like(prices)
        momentum[period:] = ((prices[period:] - prices[:-period]) / prices[:-period]) * 100
        return momentum


class LSTMPredictor:
    """Random Forest machine learning model for time series forecasting."""

    def __init__(self, lookback: int = 15, prediction_days: int = 30):
        self.lookback = lookback
        self.prediction_days = prediction_days
        self.model = RandomForestRegressor(n_estimators=50, random_state=42)

    def simple_lstm_forecast(self, prices: np.ndarray) -> np.ndarray:
        """Train Random Forest on historical price lags and forecast recursively."""
        n = len(prices)
        if n <= self.lookback + 5:
            return prices[-1] * np.ones(self.prediction_days)

        # 1. Build training dataset using lag features
        X, y = [], []
        for i in range(self.lookback, n):
            X.append(prices[i - self.lookback : i])
            y.append(prices[i])

        X = np.array(X)
        y = np.array(y)

        # 2. Fit the Random Forest model
        self.model.fit(X, y)

        # 3. Forecast future prices recursively
        current_lags = list(prices[-self.lookback :])
        forecast = []
        for _ in range(self.prediction_days):
            pred_input = np.array(current_lags[-self.lookback :]).reshape(1, -1)
            next_pred = float(self.model.predict(pred_input)[0])
            forecast.append(next_pred)
            current_lags.append(next_pred)

        return np.array(forecast)


class ARIMAPredictor:
    """ARIMA model for time series forecasting."""

    def __init__(self, order: Tuple = (1, 1, 1), seasonal_order: Optional[Tuple] = None):
        self.order = order
        self.seasonal_order = seasonal_order or (0, 0, 0, 0)
        self.model = None

    def fit(self, prices: np.ndarray) -> None:
        """Fit ARIMA model to historical prices."""
        try:
            self.model = ARIMA(prices, order=self.order)
            self.model = self.model.fit()
        except Exception as e:
            print(f"[WARNING] ARIMA fitting failed: {e}")

    def forecast(self, steps: int = 30) -> np.ndarray:
        """Forecast next N days."""
        if self.model is None:
            return np.array([])

        try:
            forecast = self.model.get_forecast(steps=steps).predicted_mean
            return np.asarray(forecast)
        except Exception as e:
            print(f"[WARNING] ARIMA forecast failed: {e}")
            return np.array([])


class EnsemblePredictor:
    """Ensemble model combining multiple prediction methods."""

    def __init__(self, lookback: int = 60, prediction_days: int = 30):
        self.lookback = lookback
        self.prediction_days = prediction_days
        self.lstm = LSTMPredictor(lookback, prediction_days)
        self.arima = ARIMAPredictor()
        self.technical = TechnicalIndicators()

    def predict(self, df: pd.DataFrame) -> Dict:
        """
        Generate ensemble prediction combining LSTM, ARIMA, and technical indicators.
        
        Returns:
            Dict with 'direction', 'confidence', 'forecast', and 'signals'
        """
        prices = df["Close"].values
        if len(prices) < self.lookback:
            return self._neutral_prediction()

        # Method 1: LSTM-like forecast
        lstm_forecast = self.lstm.simple_lstm_forecast(prices)

        # Method 2: ARIMA forecast
        self.arima.fit(prices)
        arima_forecast = self.arima.forecast(self.prediction_days)
        if len(arima_forecast) == 0:
            arima_forecast = lstm_forecast

        # Method 3: Technical indicators
        signals = self._analyze_technicals(prices)

        # Ensemble average
        forecast = (lstm_forecast + arima_forecast) / 2.0

        # Determine direction and confidence
        current_price = prices[-1]
        avg_forecast = np.mean(forecast)
        price_change = (avg_forecast - current_price) / current_price

        direction = "📈 BULLISH" if price_change > 0.01 else "📉 BEARISH" if price_change < -0.01 else "➡️ NEUTRAL"
        confidence = min(100, abs(price_change) * 500)  # Convert to 0-100%

        return {
            "direction": direction,
            "confidence": confidence,
            "forecast": forecast,
            "current_price": current_price,
            "avg_forecast": avg_forecast,
            "price_change_pct": price_change * 100,
            "signals": signals,
        }

    def _analyze_technicals(self, prices: np.ndarray) -> Dict:
        """Analyze technical indicators."""
        rsi = self.technical.calculate_rsi(prices)[-1]
        macd, signal, hist = self.technical.calculate_macd(prices)
        upper_bb, middle_bb, lower_bb = self.technical.calculate_bollinger_bands(prices)
        momentum = self.technical.calculate_momentum(prices)[-1]

        return {
            "rsi": float(rsi),
            "rsi_signal": "Overbought" if rsi > 70 else "Oversold" if rsi < 30 else "Neutral",
            "macd": float(macd[-1]),
            "macd_signal": "Bullish" if macd[-1] > signal[-1] else "Bearish",
            "momentum": float(momentum),
            "bb_position": (
                "Bullish" if prices[-1] > middle_bb[-1] else "Bearish"
            ),
        }

    def _neutral_prediction(self) -> Dict:
        """Return neutral prediction when insufficient data."""
        return {
            "direction": "➡️ NEUTRAL",
            "confidence": 0,
            "forecast": np.array([]),
            "current_price": 0,
            "avg_forecast": 0,
            "price_change_pct": 0,
            "signals": {
                "rsi": 50,
                "rsi_signal": "Neutral",
                "macd": 0,
                "macd_signal": "Neutral",
                "momentum": 0,
                "bb_position": "Neutral",
            },
        }


def get_prediction(df: pd.DataFrame, model_type: str = "ensemble") -> Dict:
    """
    Get stock price prediction using specified model.
    
    Args:
        df: DataFrame with OHLCV data
        model_type: 'lstm', 'arima', or 'ensemble'
    
    Returns:
        Prediction dictionary
    """
    if model_type == "ensemble":
        predictor = EnsemblePredictor()
        return predictor.predict(df)
    elif model_type == "arima":
        predictor = ARIMAPredictor()
        predictor.fit(df["Close"].values)
        forecast = predictor.forecast(30)
        return {
            "direction": "📈 BULLISH" if forecast[-1] > df["Close"].values[-1] else "📉 BEARISH",
            "confidence": 45,
            "forecast": forecast,
        }
    else:  # lstm
        predictor = LSTMPredictor()
        forecast = predictor.simple_lstm_forecast(df["Close"].values)
        return {
            "direction": "📈 BULLISH" if forecast[-1] > df["Close"].values[-1] else "📉 BEARISH",
            "confidence": 50,
            "forecast": forecast,
        }
