"""
sentiment_analysis.py — Sentiment analysis for stocks using multiple approaches.
Includes rule-based analysis, LLM integration (optional), and news sentiment.
"""

import os
from typing import Dict, Optional

import requests
import xml.etree.ElementTree as ET
from dotenv import load_dotenv

load_dotenv()


class SentimentAnalyzer:
    """Analyze sentiment from various sources."""

    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")

    def analyze_text_sentiment(self, text: str) -> Dict:
        """
        Simple rule-based sentiment analysis.
        
        Returns:
            {'sentiment': 'positive'|'negative'|'neutral', 'score': 0-1}
        """
        bullish_keywords = [
            "surge", "rally", "boom", "breakout", "breakthrough", "soaring",
            "gains", "profit", "strong", "upgrade", "beat", "growth", "expand",
            "recover", "bullish", "buy", "undervalued", "opportunity"
        ]
        bearish_keywords = [
            "crash", "plunge", "collapse", "loss", "decline", "weak",
            "downgrade", "miss", "risk", "caution", "sell", "overvalued",
            "bearish", "tumble", "slump", "recession", "warning"
        ]

        text_lower = text.lower()
        bullish_count = sum(text_lower.count(word) for word in bullish_keywords)
        bearish_count = sum(text_lower.count(word) for word in bearish_keywords)

        if bullish_count > bearish_count:
            sentiment = "positive"
            score = min(1.0, bullish_count / (bullish_count + bearish_count + 1))
        elif bearish_count > bullish_count:
            sentiment = "negative"
            score = min(1.0, bearish_count / (bullish_count + bearish_count + 1))
        else:
            sentiment = "neutral"
            score = 0.5

        return {"sentiment": sentiment, "score": score, "bullish": bullish_count, "bearish": bearish_count}

    def analyze_with_openai(self, text: str, ticker: str, api_key: Optional[str] = None) -> Optional[Dict]:
        """
        Use OpenAI GPT to analyze sentiment (requires API key).
        """
        key = api_key or self.openai_key
        if not key:
            return None

        try:
            import openai

            openai.api_key = key
            prompt = f"""Analyze the sentiment for {ticker} based on this text:
            
{text}

Respond ONLY with JSON: {{"sentiment": "positive"|"negative"|"neutral", "score": 0.0-1.0, "reasoning": "brief explanation"}}"""

            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=150,
            )

            import json

            result = json.loads(response["choices"][0]["message"]["content"])
            return result
        except Exception as e:
            print(f"[WARNING] OpenAI sentiment analysis failed: {e}")
            return None

    def analyze_with_anthropic(self, text: str, ticker: str) -> Optional[Dict]:
        """
        Use Anthropic Claude to analyze sentiment (requires API key).
        """
        if not self.anthropic_key:
            return None

        try:
            import anthropic

            client = anthropic.Anthropic(api_key=self.anthropic_key)
            prompt = f"""Analyze the sentiment for {ticker} based on this text:
            
{text}

Respond ONLY with JSON: {{"sentiment": "positive"|"negative"|"neutral", "score": 0.0-1.0, "reasoning": "brief explanation"}}"""

            message = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=150,
                messages=[{"role": "user", "content": prompt}],
            )

            import json

            result = json.loads(message.content[0].text)
            return result
        except Exception as e:
            print(f"[WARNING] Anthropic sentiment analysis failed: {e}")
            return None

    def fetch_ticker_news(self, ticker: str) -> str:
        """Fetch live news headlines from Yahoo Finance RSS feed."""
        url = f"https://finance.yahoo.com/rss/headline?s={ticker}"
        try:
            response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            if response.status_code == 200:
                root = ET.fromstring(response.content)
                headlines = []
                for item in root.findall(".//item"):
                    title = item.find("title")
                    if title is not None and title.text:
                        headlines.append(title.text)
                return "\n".join(headlines)
        except Exception as e:
            print(f"[WARNING] Failed to fetch news for {ticker}: {e}")
        return ""

    def get_sentiment(self, ticker: str, context: str = "", openai_key: Optional[str] = None) -> Dict:
        """
        Get comprehensive sentiment analysis for a ticker.
        
        Returns:
            {
                'overall': 'positive'|'negative'|'neutral',
                'score': 0.0-1.0,
                'sources': {
                    'text_analysis': {...},
                    'openai': {...} or None,
                    'anthropic': {...} or None
                }
            }
        """
        # Fetch live news headlines
        news_text = self.fetch_ticker_news(ticker)
        combined_text = f"{news_text}\n{context}".strip()

        # Start with text analysis
        text_result = self.analyze_text_sentiment(combined_text)

        # Try LLM analysis
        openai_result = self.analyze_with_openai(combined_text, ticker, api_key=openai_key)

        # Aggregate results
        scores = [text_result["score"]]
        if openai_result:
            scores.append(openai_result.get("score", 0.5))

        avg_score = sum(scores) / len(scores)
        overall = "positive" if avg_score > 0.6 else "negative" if avg_score < 0.4 else "neutral"

        return {
            "overall": overall,
            "score": avg_score,
            "sources": {
                "text_analysis": text_result,
                "openai": openai_result,
                "anthropic": None,
            },
        }


def get_analyzer() -> SentimentAnalyzer:
    """Get singleton sentiment analyzer."""
    return SentimentAnalyzer()
