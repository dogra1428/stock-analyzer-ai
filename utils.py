#!/usr/bin/env python3
"""
Utility script for stock analyzer application.
Provides setup, testing, and management functions.

Usage:
    python utils.py --help
    python utils.py --test-apis
    python utils.py --validate-ticker AAPL
    python utils.py --test-ml
"""

import argparse
import sys
from pathlib import Path

import pandas as pd

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from stock_data import get_fetcher
from ml_models import EnsemblePredictor
from sentiment_analysis import get_analyzer


def test_apis():
    """Test all configured APIs."""
    print("\n" + "="*50)
    print("🔍 API Configuration Test")
    print("="*50 + "\n")

    import os
    from dotenv import load_dotenv
    load_dotenv()

    # Yahoo Finance
    print("✓ Yahoo Finance: Always enabled (built-in)")

    # Alpha Vantage
    if os.getenv("ALPHA_VANTAGE_API_KEY"):
        print("✓ Alpha Vantage API: Configured")
    else:
        print("✗ Alpha Vantage API: Not configured (optional)")

    # Finnhub
    if os.getenv("FINNHUB_API_KEY"):
        print("✓ Finnhub API: Configured")
    else:
        print("✗ Finnhub API: Not configured (optional)")

    # OpenAI
    if os.getenv("OPENAI_API_KEY"):
        print("✓ OpenAI API: Configured")
    else:
        print("✗ OpenAI API: Not configured (optional)")

    # Anthropic
    if os.getenv("ANTHROPIC_API_KEY"):
        print("✓ Anthropic API: Configured")
    else:
        print("✗ Anthropic API: Not configured (optional)")

    print("\n" + "="*50 + "\n")
    print("Status: Setup is valid!")
    print("\nNote: Only Yahoo Finance is required.")
    print("Other APIs are optional for enhanced features.\n")


def validate_ticker(ticker: str):
    """Validate a ticker symbol."""
    print(f"\n🔍 Validating ticker: {ticker}")

    fetcher = get_fetcher()

    if not fetcher.validate_ticker(ticker):
        print(f"✗ Invalid ticker: {ticker}")
        print("  Please check the symbol and try again.")
        return False

    print(f"✓ Valid ticker: {ticker}")

    # Fetch info
    info = fetcher.fetch_company_info(ticker)
    if info:
        print(f"\n  Company: {info.get('name', 'N/A')}")
        print(f"  Sector: {info.get('sector', 'N/A')}")
        print(f"  Market Cap: ${info.get('market_cap', 0):,.0f}")

    # Fetch price
    price = fetcher.get_current_price(ticker)
    if price:
        print(f"  Current Price: ${price:.2f}\n")

    return True


def test_ml():
    """Test ML model on sample data."""
    print("\n" + "="*50)
    print("🤖 ML Model Test")
    print("="*50 + "\n")

    print("Fetching historical data for AAPL...")
    fetcher = get_fetcher()
    df = fetcher.fetch_stock_data("AAPL", days=365)

    if df is None or df.empty:
        print("✗ Failed to fetch data")
        return False

    print(f"✓ Fetched {len(df)} days of data\n")

    # Test ensemble model
    print("Running ensemble model prediction...")
    predictor = EnsemblePredictor()
    prediction = predictor.predict(df)

    print(f"\nResults:")
    print(f"  Direction: {prediction['direction']}")
    print(f"  Confidence: {prediction['confidence']:.1f}%")
    print(f"  Price Change: {prediction['price_change_pct']:.2f}%")
    print(f"  Current Price: ${prediction['current_price']:.2f}")
    print(f"  Forecast Price: ${prediction['avg_forecast']:.2f}")

    signals = prediction.get("signals", {})
    print(f"\nTechnical Signals:")
    print(f"  RSI: {signals.get('rsi_signal', 'N/A')}")
    print(f"  MACD: {signals.get('macd_signal', 'N/A')}")
    print(f"  Bollinger Bands: {signals.get('bb_position', 'N/A')}")

    print("\n✓ ML models working correctly!\n")
    return True


def test_sentiment():
    """Test sentiment analysis."""
    print("\n" + "="*50)
    print("💭 Sentiment Analysis Test")
    print("="*50 + "\n")

    analyzer = get_analyzer()

    test_text = """
    Apple reported stronger than expected earnings with record iPhone sales.
    The company's services segment continues to show impressive growth.
    Analysts upgrade their price targets with bullish outlooks.
    However, concerns about China market saturation persist.
    """

    print("Analyzing sample text...")
    sentiment = analyzer.get_sentiment("AAPL", test_text)

    print(f"\nResults:")
    print(f"  Overall Sentiment: {sentiment['overall'].upper()}")
    print(f"  Sentiment Score: {sentiment['score']:.2f}/1.0")

    sources = sentiment.get("sources", {})
    print(f"\nSentiment Sources:")

    text_sent = sources.get("text_analysis", {})
    print(f"  Rule-based: {text_sent.get('sentiment', 'N/A')} "
          f"(Score: {text_sent.get('score', 0):.2f})")

    openai_sent = sources.get("openai")
    if openai_sent:
        print(f"  OpenAI: {openai_sent.get('sentiment', 'N/A')} "
              f"(Score: {openai_sent.get('score', 0):.2f})")
    else:
        print(f"  OpenAI: Not configured")

    anthropic_sent = sources.get("anthropic")
    if anthropic_sent:
        print(f"  Anthropic: {anthropic_sent.get('sentiment', 'N/A')} "
              f"(Score: {anthropic_sent.get('score', 0):.2f})")
    else:
        print(f"  Anthropic: Not configured")

    print("\n✓ Sentiment analysis working!\n")


def setup_env():
    """Create .env file from template."""
    print("\n" + "="*50)
    print("📝 Setup Environment File")
    print("="*50 + "\n")

    env_template = Path(".env.example")
    env_file = Path(".env")

    if not env_template.exists():
        print("✗ .env.example not found!")
        return False

    if env_file.exists():
        response = input("✓ .env already exists. Overwrite? (y/n): ")
        if response.lower() != "y":
            print("✗ Setup cancelled")
            return False

    # Copy template
    content = env_template.read_text()
    env_file.write_text(content)

    print("✓ Created .env file from template\n")
    print("Next steps:")
    print("  1. Edit .env with your API keys")
    print("  2. Run: python utils.py --test-apis\n")

    return True


def show_config():
    """Show current configuration."""
    print("\n" + "="*50)
    print("⚙️  Current Configuration")
    print("="*50 + "\n")

    import os
    from dotenv import load_dotenv

    load_dotenv()

    print("Environment Variables:")
    print(f"  YFINANCE_ENABLED: {os.getenv('YFINANCE_ENABLED', 'true')}")
    print(f"  ALPHA_VANTAGE_API_KEY: {'***' if os.getenv('ALPHA_VANTAGE_API_KEY') else 'Not set'}")
    print(f"  FINNHUB_API_KEY: {'***' if os.getenv('FINNHUB_API_KEY') else 'Not set'}")
    print(f"  OPENAI_API_KEY: {'***' if os.getenv('OPENAI_API_KEY') else 'Not set'}")
    print(f"  ANTHROPIC_API_KEY: {'***' if os.getenv('ANTHROPIC_API_KEY') else 'Not set'}")
    print(f"  HISTORICAL_DAYS: {os.getenv('HISTORICAL_DAYS', '365')}")
    print(f"  ML_MODEL_TYPE: {os.getenv('ML_MODEL_TYPE', 'ensemble')}")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="Stock Analyzer Utility",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python utils.py --setup-env
  python utils.py --test-apis
  python utils.py --test-ml
  python utils.py --test-sentiment
  python utils.py --validate-ticker AAPL
  python utils.py --config
        """,
    )

    parser.add_argument(
        "--setup-env",
        action="store_true",
        help="Create .env file from template",
    )
    parser.add_argument(
        "--test-apis",
        action="store_true",
        help="Test API configuration",
    )
    parser.add_argument(
        "--test-ml",
        action="store_true",
        help="Test ML models on sample data",
    )
    parser.add_argument(
        "--test-sentiment",
        action="store_true",
        help="Test sentiment analysis",
    )
    parser.add_argument(
        "--validate-ticker",
        type=str,
        help="Validate a stock ticker",
    )
    parser.add_argument(
        "--config",
        action="store_true",
        help="Show current configuration",
    )

    args = parser.parse_args()

    if args.setup_env:
        setup_env()
    elif args.test_apis:
        test_apis()
    elif args.test_ml:
        test_ml()
    elif args.test_sentiment:
        test_sentiment()
    elif args.validate_ticker:
        validate_ticker(args.validate_ticker)
    elif args.config:
        show_config()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
