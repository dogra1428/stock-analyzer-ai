import os
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
import pandas as pd
import numpy as np

from stock_data import get_fetcher
from ml_models import get_prediction, TechnicalIndicators
from sentiment_analysis import get_analyzer

app = FastAPI(title="ApexTrade AI Backend")

# Serve static files from /static directory
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(static_dir, exist_ok=True)

# Cache helper for scrolling ticker indices to prevent rate limiting
indices_cache = {}
last_indices_fetch = 0

@app.get("/api/indices")
async def get_indices():
    """Fetch major global indices for the scrolling marquee."""
    global last_indices_fetch, indices_cache
    now = datetime.now().timestamp()
    
    # Cache for 10 minutes
    if now - last_indices_fetch < 600 and indices_cache:
        return indices_cache
        
    fetcher = get_fetcher()
    tickers = {
        "^GSPC": "S&P 500",
        "^IXIC": "NASDAQ",
        "^DJI": "DOW JONES",
        "BTC-USD": "Bitcoin",
        "GLD": "Gold",
        "USO": "Crude Oil",
        "^NSEI": "NIFTY 50"
    }
    
    results = []
    for ticker, name in tickers.items():
        try:
            df = fetcher.fetch_stock_data(ticker, days=5)
            if df is not None and not df.empty:
                current = float(df["Close"].iloc[-1])
                prev = float(df["Close"].iloc[-2]) if len(df) > 1 else current
                change = current - prev
                change_pct = (change / prev) * 100 if prev != 0 else 0
                results.append({
                    "ticker": ticker,
                    "name": name,
                    "price": current,
                    "change": change,
                    "change_pct": change_pct
                })
        except Exception:
            continue
            
    if results:
        indices_cache = results
        last_indices_fetch = now
    return results

SECTOR_PEERS = {
    "Technology": ["AAPL", "MSFT", "NVDA", "AVGO"],
    "Financial Services": ["JPM", "BAC", "WFC", "MS"],
    "Consumer Cyclical": ["AMZN", "TSLA", "HD", "MCD"],
    "Healthcare": ["LLY", "UNH", "JNJ", "ABV"],
    "Communication Services": ["GOOGL", "META", "NFLX", "DIS"],
    "Energy": ["XOM", "CVX", "COP", "SLB"],
    "Industrials": ["CAT", "GE", "UNP", "HON"],
    "Consumer Defensive": ["WMT", "PG", "KO", "PEP"],
    "Real Estate": ["PLD", "AMT", "EQIX", "CCI"],
    "Utilities": ["NEE", "SO", "DUK", "AEP"]
}

import asyncio

# In-memory cache for API analysis responses to prevent rate limiting and make repeat queries instant (TTL: 10 minutes)
analysis_cache = {}

async def fetch_peers_data(sector: str, current_ticker: str):
    peers = SECTOR_PEERS.get(sector, ["AAPL", "MSFT", "TSLA", "AMZN"])
    peers = [p for p in peers if p != current_ticker][:4]
    
    fetcher = get_fetcher()
    
    def fetch_single_peer(peer):
        try:
            info = fetcher.fetch_company_info(peer)
            price = fetcher.get_current_price(peer)
            if price:
                return {
                    "ticker": peer,
                    "name": info.get("name", peer),
                    "price": float(price),
                    "market_cap": float(info.get("market_cap", 0)) if info.get("market_cap") else 0.0,
                    "pe_ratio": info.get("pe_ratio", "N/A")
                }
        except Exception:
            pass
        return None

    # Fetch peers in parallel using asyncio threads
    tasks = [asyncio.to_thread(fetch_single_peer, p) for p in peers]
    results = await asyncio.gather(*tasks)
    return [r for r in results if r is not None]

@app.get("/api/analyze")
async def analyze_stock(
    ticker: str,
    days: Optional[int] = 365,
    timeframe: Optional[str] = "long",
    x_openai_key: Optional[str] = Header(None)
):
    ticker = ticker.upper().strip()
    
    # Check cache
    cache_key = (ticker, days, timeframe)
    now = datetime.now().timestamp()
    if cache_key in analysis_cache:
        cached_time, response_data = analysis_cache[cache_key]
        if now - cached_time < 600:  # 10 minute cache TTL
            return response_data
    fetcher = get_fetcher()
    analyzer = get_analyzer()

    # 1. Validate ticker
    if not fetcher.validate_ticker(ticker):
        raise HTTPException(status_code=400, detail=f"Invalid stock ticker: {ticker}")

    try:
        # 2. Fetch data based on timeframe
        if timeframe == "short":
            df = fetcher.fetch_intraday_data(ticker, interval="15m")
            if df is not None and not df.empty:
                df = df.rename(columns={"DateTime": "Date"})
        else:
            df = fetcher.fetch_stock_data(ticker, days=days)
            
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail=f"No stock data found for ticker: {ticker}")

        # 3. Fetch company info
        company_info = fetcher.fetch_company_info(ticker)

        # 4. Generate prediction
        prediction = get_prediction(df, "ensemble")

        # 5. Extract current price and calculate day changes
        current_price = float(df["Close"].iloc[-1])
        prev_price = float(df["Close"].iloc[-2]) if len(df) > 1 else current_price
        day_change = current_price - prev_price
        day_change_pct = (day_change / prev_price) * 100 if prev_price != 0 else 0

        five_days_ago_price = float(df["Close"].iloc[-5]) if len(df) > 4 else float(df["Close"].iloc[0])
        five_day_change_pct = ((current_price - five_days_ago_price) / five_days_ago_price) * 100 if five_days_ago_price != 0 else 0

        # 6. Calculate SMA, Bollinger Bands, RSI, MACD
        close_prices = df["Close"].values
        sma_50_series = df["Close"].rolling(window=min(50, len(df))).mean().values
        sma_200_series = df["Close"].rolling(window=min(200, len(df))).mean().values
        
        sma_20 = df["Close"].rolling(window=min(20, len(df))).mean()
        std_20 = df["Close"].rolling(window=min(20, len(df))).std()
        bb_upper_series = (sma_20 + (2.0 * std_20)).values
        bb_lower_series = (sma_20 - (2.0 * std_20)).values
        bb_middle_series = sma_20.values

        rsi_series = TechnicalIndicators.calculate_rsi(close_prices)
        macd_series, macd_signal_series, macd_hist_series = TechnicalIndicators.calculate_macd(close_prices)

        # 7. Parse historical prices with overlays
        historical_prices = []
        for idx, row in df.iterrows():
            date_val = row["Date"]
            if isinstance(date_val, (pd.Timestamp, datetime)):
                date_str = date_val.strftime("%Y-%m-%d %H:%M" if timeframe == "short" else "%Y-%m-%d")
            else:
                date_str = str(date_val)[:16 if timeframe == "short" else 10]
            
            s50 = sma_50_series[idx]
            s200 = sma_200_series[idx]
            bu = bb_upper_series[idx]
            bl = bb_lower_series[idx]
            bm = bb_middle_series[idx]
            
            rsi_val = rsi_series[idx]
            m_val = macd_series[idx]
            ms_val = macd_signal_series[idx]
            mh_val = macd_hist_series[idx]

            historical_prices.append({
                "date": date_str,
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "volume": int(row["Volume"]),
                "sma_50": float(s50) if not pd.isna(s50) else None,
                "sma_200": float(s200) if not pd.isna(s200) else None,
                "bb_upper": float(bu) if not pd.isna(bu) else None,
                "bb_lower": float(bl) if not pd.isna(bl) else None,
                "bb_middle": float(bm) if not pd.isna(bm) else None,
                "rsi": float(rsi_val) if not pd.isna(rsi_val) else None,
                "macd": float(m_val) if not pd.isna(m_val) else None,
                "macd_signal": float(ms_val) if not pd.isna(ms_val) else None,
                "macd_hist": float(mh_val) if not pd.isna(mh_val) else None
            })

        # 8. Get sentiment
        sentiment = analyzer.get_sentiment(
            ticker,
            f"{company_info.get('description', '')} Current price: ${current_price:.2f}",
            openai_key=x_openai_key
        )

        # Serialize predictions
        forecast = prediction.get("forecast", np.array([])).tolist() if timeframe == "long" else []
        signals = prediction.get("signals", {})

        # 9. Compute Trading & Investing Scores (0-100%)
        # Trader Score calculation
        rsi = signals.get("rsi", 50)
        rsi_contrib = 100 - abs(rsi - 50) * 2  # Closer to oversold/overbought increases trading setups
        macd_signal = signals.get("macd_signal", "Neutral")
        macd_contrib = 100 if macd_signal == "Bullish" else 30
        momentum = signals.get("momentum", 0)
        mom_contrib = 100 if momentum > 0 else 40
        trader_score = (rsi_contrib * 0.4) + (macd_contrib * 0.3) + (mom_contrib * 0.3)
        
        # Investor Score calculation
        pe = company_info.get("pe_ratio", "N/A")
        if isinstance(pe, (int, float)):
            pe_contrib = 100 - abs(pe - 15) * 2.5 if pe > 0 else 20  # Value valuation near 15 P/E
            pe_contrib = max(10, min(100, pe_contrib))
        else:
            pe_contrib = 50  # Neutral
            
        try:
            div = float(company_info.get("dividend_yield", 0.0) or 0.0)
            div_contrib = min(100, div * 1500) if div else 30
        except (ValueError, TypeError):
            div_contrib = 30
        
        try:
            high_52 = float(company_info.get("52_week_high", 0.0) or 0.0)
            low_52 = float(company_info.get("52_week_low", 0.0) or 0.0)
        except (ValueError, TypeError):
            high_52 = 0.0
            low_52 = 0.0
            
        if high_52 > low_52:
            range_pos = (current_price - low_52) / (high_52 - low_52)
            value_contrib = (1 - range_pos) * 100  # Closer to 52-week low yields higher value score
        else:
            value_contrib = 50
            
        investor_score = (pe_contrib * 0.4) + (div_contrib * 0.3) + (value_contrib * 0.3)

        # 9.5 Fetch sector peers comparison data
        peers_data = await fetch_peers_data(company_info.get("sector", "Technology"), ticker)

        # 10. Return response
        response_data = {
            "ticker": ticker,
            "company_name": company_info.get("name", ticker),
            "sector": company_info.get("sector", "N/A"),
            "pe_ratio": company_info.get("pe_ratio", "N/A"),
            "eps": company_info.get("eps", "N/A"),
            "free_cash_flow": company_info.get("free_cash_flow", "N/A"),
            "dividend_yield": float(company_info.get("dividend_yield", 0)) if company_info.get("dividend_yield") else 0.0,
            "high_52week": float(company_info.get("52_week_high", 0)) if company_info.get("52_week_high") else 0.0,
            "low_52week": float(company_info.get("52_week_low", 0)) if company_info.get("52_week_low") else 0.0,
            "market_cap": float(company_info.get("market_cap", 0)) if company_info.get("market_cap") else 0.0,
            "current_price": current_price,
            "day_change": day_change,
            "day_change_pct": day_change_pct,
            "five_day_change_pct": five_day_change_pct,
            "timeframe": timeframe,
            "scores": {
                "trader_score": round(trader_score, 1),
                "investor_score": round(investor_score, 1)
            },
            "prediction": {
                "direction": prediction.get("direction", "➡️ NEUTRAL"),
                "confidence": float(prediction.get("confidence", 0)),
                "price_change_pct": float(prediction.get("price_change_pct", 0)),
                "forecast": forecast,
                "signals": signals
            },
            "sentiment": {
                "overall": sentiment.get("overall", "neutral"),
                "score": float(sentiment.get("score", 0.5)),
                "text_analysis": sentiment.get("sources", {}).get("text_analysis", {}),
                "openai_active": bool(sentiment.get("sources", {}).get("openai")),
                "anthropic_active": bool(sentiment.get("sources", {}).get("anthropic"))
            },
            "historical_data": historical_prices,
            "peers": peers_data
        }
        analysis_cache[cache_key] = (now, response_data)
        return response_data
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# User Accounts, JWT Auth & Synced Databases
# ==========================================
from pydantic import BaseModel

class UserAuth(BaseModel):
    username: str
    password: str

class OpenAIKeyUpdate(BaseModel):
    key: str

# Sync schemas
class WatchlistItemSync(BaseModel):
    ticker: str
    shares: float

class WatchlistSync(BaseModel):
    items: List[WatchlistItemSync]

class WatchlistUpdateShares(BaseModel):
    ticker: str
    shares: float

class TransactionItemSync(BaseModel):
    date: str
    ticker: str
    type: str
    shares: float
    price: float
    total: float

class TransactionSync(BaseModel):
    transactions: List[TransactionItemSync]

class AlertItemSync(BaseModel):
    ticker: str
    metric: str
    condition: str
    value: float
    muted: int

class AlertsSync(BaseModel):
    alerts: List[AlertItemSync]

def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        parts = authorization.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(status_code=401, detail="Unauthorized")
        token = parts[1]
        
        from database import verify_jwt
        payload = verify_jwt(token)
        if not payload or "user_id" not in payload:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return payload["user_id"]
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")

@app.post("/api/auth/register")
async def register(auth: UserAuth):
    from database import get_db_connection, hash_password, create_jwt
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = ?", (auth.username,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already exists")
        
        pwd_hash = hash_password(auth.password)
        cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (auth.username, pwd_hash))
        conn.commit()
        
        cursor.execute("SELECT id FROM users WHERE username = ?", (auth.username,))
        user_row = cursor.fetchone()
        user_id = user_row[0]
        
        token = create_jwt({"user_id": user_id, "username": auth.username})
        return {"token": token, "username": auth.username}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/auth/login")
async def login(auth: UserAuth):
    from database import get_db_connection, verify_password, create_jwt
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, password_hash, openai_key FROM users WHERE username = ?", (auth.username,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid username or password")
            
        user_id, pwd_hash, openai_key = row["id"], row["password_hash"], row["openai_key"]
        if not verify_password(auth.password, pwd_hash):
            raise HTTPException(status_code=401, detail="Invalid username or password")
            
        token = create_jwt({"user_id": user_id, "username": auth.username})
        return {"token": token, "username": auth.username, "openai_key": openai_key}
    finally:
        conn.close()

@app.get("/api/auth/profile")
async def profile(user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT username, openai_key FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return {"username": row["username"], "openai_key": row["openai_key"]}
    finally:
        conn.close()

@app.post("/api/auth/update-key")
async def update_key(data: OpenAIKeyUpdate, user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET openai_key = ? WHERE id = ?", (data.key, user_id))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

# Watchlist API Endpoints
@app.get("/api/watchlist")
async def get_watchlist(user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT ticker, shares FROM watchlist WHERE user_id = ?", (user_id,))
        rows = cursor.fetchall()
        return [{"ticker": r["ticker"], "shares": r["shares"]} for r in rows]
    finally:
        conn.close()

@app.post("/api/watchlist/sync")
async def sync_watchlist(data: WatchlistSync, user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        for item in data.items:
            cursor.execute("""
                INSERT INTO watchlist (user_id, ticker, shares) 
                VALUES (?, ?, ?)
                ON CONFLICT(user_id, ticker) DO UPDATE SET shares = excluded.shares
            """, (user_id, item.ticker, item.shares))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

@app.post("/api/watchlist/add")
async def add_watchlist(data: WatchlistItemSync, user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO watchlist (user_id, ticker, shares) 
            VALUES (?, ?, ?)
            ON CONFLICT(user_id, ticker) DO UPDATE SET shares = excluded.shares
        """, (user_id, data.ticker, data.shares))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

@app.post("/api/watchlist/remove")
async def remove_watchlist(data: WatchlistItemSync, user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM watchlist WHERE user_id = ? AND ticker = ?", (user_id, data.ticker))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

@app.post("/api/watchlist/update-shares")
async def update_watchlist_shares(data: WatchlistUpdateShares, user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE watchlist SET shares = ? WHERE user_id = ? AND ticker = ?", (data.shares, user_id, data.ticker))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

# Transactions API Endpoints
@app.get("/api/transactions")
async def get_transactions(user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, date, ticker, type, shares, price, total FROM transactions WHERE user_id = ?", (user_id,))
        rows = cursor.fetchall()
        return [{
            "id": r["id"],
            "date": r["date"],
            "ticker": r["ticker"],
            "type": r["type"],
            "shares": r["shares"],
            "price": r["price"],
            "total": r["total"]
        } for r in rows]
    finally:
        conn.close()

@app.post("/api/transactions/sync")
async def sync_transactions(data: TransactionSync, user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        for item in data.transactions:
            cursor.execute("""
                INSERT INTO transactions (user_id, date, ticker, type, shares, price, total) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (user_id, item.date, item.ticker, item.type, item.shares, item.price, item.total))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

@app.post("/api/transactions/add")
async def add_transaction(data: TransactionItemSync, user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO transactions (user_id, date, ticker, type, shares, price, total) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, data.date, data.ticker, data.type, data.shares, data.price, data.total))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

class TransactionDelete(BaseModel):
    id: int

@app.post("/api/transactions/delete")
async def delete_transaction(data: TransactionDelete, user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE user_id = ? AND id = ?", (user_id, data.id))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

@app.post("/api/transactions/clear")
async def clear_transactions(user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

# Alerts API Endpoints
@app.get("/api/alerts")
async def get_alerts(user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, ticker, metric, condition, value, muted FROM alerts WHERE user_id = ?", (user_id,))
        alert_rows = cursor.fetchall()
        
        cursor.execute("SELECT id, timestamp, ticker, condition, triggered_value, details FROM triggered_alerts WHERE user_id = ?", (user_id,))
        log_rows = cursor.fetchall()
        
        return {
            "alerts": [{
                "id": r["id"],
                "ticker": r["ticker"],
                "metric": r["metric"],
                "condition": r["condition"],
                "value": r["value"],
                "muted": bool(r["muted"])
            } for r in alert_rows],
            "logs": [{
                "id": r["id"],
                "timestamp": r["timestamp"],
                "ticker": r["ticker"],
                "condition": r["condition"],
                "triggeredValue": r["triggered_value"],
                "details": r["details"]
            } for r in log_rows]
        }
    finally:
        conn.close()

@app.post("/api/alerts/sync")
async def sync_alerts(data: AlertsSync, user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        for item in data.alerts:
            cursor.execute("""
                INSERT INTO alerts (user_id, ticker, metric, condition, value, muted) 
                VALUES (?, ?, ?, ?, ?, ?)
            """, (user_id, item.ticker, item.metric, item.condition, item.value, item.muted))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

@app.post("/api/alerts/add")
async def add_alert(data: AlertItemSync, user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO alerts (user_id, ticker, metric, condition, value, muted) 
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, data.ticker, data.metric, data.condition, data.value, data.muted))
        conn.commit()
        cursor.execute("SELECT last_insert_rowid()")
        new_id = cursor.fetchone()[0]
        return {"status": "success", "id": new_id}
    finally:
        conn.close()

class AlertDeleteToggle(BaseModel):
    id: int

@app.post("/api/alerts/delete")
async def delete_alert(data: AlertDeleteToggle, user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM alerts WHERE user_id = ? AND id = ?", (user_id, data.id))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

@app.post("/api/alerts/toggle-mute")
async def toggle_mute_alert(data: AlertDeleteToggle, user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT muted FROM alerts WHERE user_id = ? AND id = ?", (user_id, data.id))
        row = cursor.fetchone()
        if row:
            new_muted = 0 if row["muted"] else 1
            cursor.execute("UPDATE alerts SET muted = ? WHERE user_id = ? AND id = ?", (new_muted, user_id, data.id))
            conn.commit()
            return {"status": "success", "muted": bool(new_muted)}
        raise HTTPException(status_code=404, detail="Alert not found")
    finally:
        conn.close()

class TriggeredAlertSave(BaseModel):
    timestamp: str
    ticker: str
    condition: str
    triggeredValue: float
    details: str

@app.post("/api/alerts/save-triggered")
async def save_triggered_alert(data: TriggeredAlertSave, user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO triggered_alerts (user_id, timestamp, ticker, condition, triggered_value, details) 
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, data.timestamp, data.ticker, data.condition, data.triggeredValue, data.details))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

@app.post("/api/alerts/clear-triggered")
async def clear_triggered_alerts(user_id: int = Depends(get_current_user_id)):
    from database import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM triggered_alerts WHERE user_id = ?", (user_id,))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

# Mount static directory for UI assets
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def get_index():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("<h2>Frontend index.html not found. Please create static/index.html.</h2>")
