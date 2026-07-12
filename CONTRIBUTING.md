# Contributing to ApexTrade AI Stock Analyzer

Thank you for your interest in contributing to the Stock Analyzer AI application! We welcome contributions from developers of all skill levels to help make this project even better.

## How to Contribute

### 1. Reporting Bugs
If you find a bug or error, please open a GitHub Issue and include:
- A clear description of the problem.
- Steps to reproduce the issue.
- Screen captures or traceback logs.
- Details about your environment (Python version, Operating System).

### 2. Suggesting Enhancements
We welcome ideas for new features, ML models, or UI improvements! Please open a GitHub Issue describing:
- The feature you want to add.
- The use-case or problem it solves.
- Any suggested libraries or models to use.

### 3. Pull Requests
To submit code changes:
1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/stock-analyzer.git
   cd stock-analyzer
   ```
3. Create a **feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. Make your changes and make sure your code builds. Run tests:
   ```bash
   python utils.py --test-ml
   python utils.py --test-apis
   ```
5. **Commit** your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat: add support for new technical indicator"
   ```
6. **Push** to your fork:
   ```bash
   git push origin feature/amazing-feature
   ```
7. Open a **Pull Request** on the main repository.

## Development Setup

See the [README.md](README.md) and [QUICKSTART.md](QUICKSTART.md) files for instructions on installing dependencies and running the local development servers.

## Code Style
- Keep code clean, documented, and type-hinted where possible.
- Use Python's PEP 8 guidelines.
- Do not check in sensitive files (like `.env` or `*.db`). The included `.gitignore` will manage this automatically.

Thank you for contributing! 🚀
