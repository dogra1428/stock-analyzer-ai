// State Management
let currentStockData = null;
let portfolio = JSON.parse(localStorage.getItem('stock_portfolio')) || [];
let transactions = JSON.parse(localStorage.getItem('portfolio_transactions')) || [];
let alerts = JSON.parse(localStorage.getItem('stock_alerts')) || [];
let triggeredAlerts = JSON.parse(localStorage.getItem('triggered_alerts')) || [];
let currentTimeframe = 'long'; // 'long' or 'short'
let currentCategory = 'us';
let explorerSearchQuery = '';
let explorerActiveCategory = 'all';

let authToken = sessionStorage.getItem('auth_token') || null;
let currentUsername = sessionStorage.getItem('auth_user') || null;
let authMode = 'login'; // 'login' or 'register'

async function apiFetch(url, options = {}) {
    if (!options.headers) {
        options.headers = {};
    }
    if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
    }
    return fetch(url, options);
}

function updateProfileUI() {
    const area = document.getElementById('userProfileArea');
    if (!area) return;
    
    if (authToken && currentUsername) {
        area.innerHTML = `
            <span class="profile-name-badge">
                <i data-lucide="user" style="width:14px; height:14px;"></i> ${currentUsername}
            </span>
            <span class="sync-status-badge synced">Synced</span>
            <button class="logout-btn-header" onclick="handleLogout()" title="Log Out">
                <i data-lucide="log-out"></i>
            </button>
        `;
    } else {
        area.innerHTML = `
            <span class="sync-status-badge local" style="margin-right: 6px;">Guest</span>
            <button class="primary-btn sm" style="width: auto; padding: 6px 12px; font-size: 12px; border-radius: 8px;" onclick="openAuthModal()">
                <i data-lucide="log-in" style="width: 14px; height: 14px;"></i> Sign In
            </button>
        `;
    }
    lucide.createIcons();
}

const explorerAssets = [
    // US Stocks
    { ticker: 'AAPL', name: 'Apple Inc.', desc: 'Consumer electronics, software & services giant.', category: 'us', icon: '🍏' },
    { ticker: 'MSFT', name: 'Microsoft Corp.', desc: 'Software, cloud computing (Azure) & enterprise leader.', category: 'us', icon: '💻' },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', desc: 'GPU pioneer driving global AI and deep learning hardware.', category: 'us', icon: '🧠' },
    { ticker: 'TSLA', name: 'Tesla Inc.', desc: 'Electric vehicles, battery storage & clean energy innovator.', category: 'us', icon: '🚗' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', desc: 'Google parent company leading search, advertising & AI.', category: 'us', icon: '🔍' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', desc: 'E-commerce, cloud computing (AWS) & digital streaming leader.', category: 'us', icon: '📦' },
    { ticker: 'META', name: 'Meta Platforms Inc.', desc: 'Social connection technologies, VR & metaverse.', category: 'us', icon: '👥' },
    { ticker: 'NFLX', name: 'Netflix Inc.', desc: 'Subscription streaming entertainment & original content.', category: 'us', icon: '🎬' },
    { ticker: 'AMD', name: 'Advanced Micro Devices', desc: 'Semiconductors, CPUs & graphics processors manufacturer.', category: 'us', icon: '⚡' },
    { ticker: 'JPM', name: 'JPMorgan Chase & Co.', desc: 'Leading financial services firm & largest bank in the US.', category: 'us', icon: '🏦' },

    // Indian Stocks
    { ticker: 'RELIANCE.NS', name: 'Reliance Industries', desc: 'Energy, retail, and telecommunications conglomerate.', category: 'in', icon: '🇮🇳' },
    { ticker: 'TCS.NS', name: 'Tata Consultancy Services', desc: 'IT consulting, technology services & solutions leader.', category: 'in', icon: '👔' },
    { ticker: 'HDFCBANK.NS', name: 'HDFC Bank', desc: 'India\'s largest private sector bank by assets.', category: 'in', icon: '💳' },
    { ticker: 'INFY.NS', name: 'Infosys Ltd.', desc: 'Digital services, consulting, & outsourcing pioneer.', category: 'in', icon: '💻' },
    { ticker: 'TMCV.NS', name: 'Tata Motors', desc: 'Commercial & passenger vehicle manufacturer leading India\'s EV transition.', category: 'in', icon: '🚚' },
    { ticker: 'ICICIBANK.NS', name: 'ICICI Bank', desc: 'Large Indian private sector banking & financial services.', category: 'in', icon: '🏦' },
    { ticker: 'BHARTIARTL.NS', name: 'Bharti Airtel', desc: 'Global telecommunication services provider.', category: 'in', icon: '📶' },
    { ticker: 'SBIN.NS', name: 'State Bank of India', desc: 'Fortune 500 public sector bank and financial services company.', category: 'in', icon: '🏢' },
    { ticker: 'ITC.NS', name: 'ITC Limited', desc: 'Conglomerate spanning FMCG, hotels, and paperboards.', category: 'in', icon: '🏭' },
    { ticker: 'LTIM.NS', name: 'LTIMindtree', desc: 'Global technology consulting and digital solutions company.', category: 'in', icon: '🚀' },

    // Cryptocurrencies
    { ticker: 'BTC-USD', name: 'Bitcoin', desc: 'Decentralized digital currency, the pioneer cryptocurrency.', category: 'crypto', icon: '🪙' },
    { ticker: 'ETH-USD', name: 'Ethereum', desc: 'Smart contract network driving DeFi, NFTs & web3.', category: 'crypto', icon: '🔷' },
    { ticker: 'SOL-USD', name: 'Solana', desc: 'High-performance, ultra-fast blockchain.', category: 'crypto', icon: '☀️' },
    { ticker: 'BNB-USD', name: 'BNB', desc: 'Ecosystem token powering BNB Chain & Binance.', category: 'crypto', icon: '🔶' },
    { ticker: 'ADA-USD', name: 'Cardano', desc: 'Academic research-driven blockchain.', category: 'crypto', icon: '₳' },
    { ticker: 'XRP-USD', name: 'Ripple', desc: 'Digital asset designed for fast international settlements.', category: 'crypto', icon: '✕' },
    { ticker: 'DOGE-USD', name: 'Dogecoin', desc: 'Open-source peer-to-peer cryptocurrency.', category: 'crypto', icon: '🐕' },
    { ticker: 'DOT-USD', name: 'Polkadot', desc: 'Sharded multi-chain network enabling transfers.', category: 'crypto', icon: '●' },
    { ticker: 'AVAX-USD', name: 'Avalanche', desc: 'Decentralized smart contracts platform.', category: 'crypto', icon: '🔺' },
    { ticker: 'LINK-USD', name: 'Chainlink', desc: 'Oracle network connecting contracts to real data.', category: 'crypto', icon: '🔗' },

    // Forex
    { ticker: 'EURUSD=X', name: 'EUR / USD', desc: 'Euro vs. United States Dollar.', category: 'forex', icon: '🇪🇺' },
    { ticker: 'GBPUSD=X', name: 'GBP / USD', desc: 'British Pound vs. United States Dollar.', category: 'forex', icon: '🇬🇧' },
    { ticker: 'USDJPY=X', name: 'USD / JPY', desc: 'United States Dollar vs. Japanese Yen.', category: 'forex', icon: '🇯🇵' },
    { ticker: 'AUDUSD=X', name: 'AUD / USD', desc: 'Australian Dollar vs. United States Dollar.', category: 'forex', icon: '🇦🇺' },
    { ticker: 'GBPJPY=X', name: 'GBP / JPY', desc: 'British Pound vs. Japanese Yen.', category: 'forex', icon: '💹' },
    { ticker: 'USDCAD=X', name: 'USD / CAD', desc: 'United States Dollar vs. Canadian Dollar.', category: 'forex', icon: '🇨🇦' },
    { ticker: 'USDCHF=X', name: 'USD / CHF', desc: 'United States Dollar vs. Swiss Franc.', category: 'forex', icon: '🇨🇭' },
    { ticker: 'EURGBP=X', name: 'EUR / GBP', desc: 'Euro vs. British Pound.', category: 'forex', icon: '💱' },
    { ticker: 'EURJPY=X', name: 'EUR / JPY', desc: 'Euro vs. Japanese Yen.', category: 'forex', icon: '💶' },
    { ticker: 'AUDJPY=X', name: 'AUD / JPY', desc: 'Australian Dollar vs. Japanese Yen.', category: 'forex', icon: '🐨' },

    // Commodities
    { ticker: 'GC=F', name: 'Gold Futures', desc: 'Gold futures contract, safe-haven precious metal.', category: 'commodities', icon: '🏆' },
    { ticker: 'SI=F', name: 'Silver Futures', desc: 'Silver futures contract, industrial & precious metal.', category: 'commodities', icon: '🥈' },
    { ticker: 'CL=F', name: 'Crude Oil Futures', desc: 'WTI Light Sweet Crude Oil futures, global benchmark.', category: 'commodities', icon: '🛢️' },
    { ticker: 'BZ=F', name: 'Brent Crude Oil', desc: 'Brent Crude futures, international oil benchmark.', category: 'commodities', icon: '🌊' },
    { ticker: 'NG=F', name: 'Natural Gas Futures', desc: 'Henry Hub Natural Gas futures contract.', category: 'commodities', icon: '🔥' },
    { ticker: 'HG=F', name: 'Copper Futures', desc: 'Copper futures contract, economic indicator.', category: 'commodities', icon: '🧱' },
    { ticker: 'ZC=F', name: 'Corn Futures', desc: 'Agricultural Corn futures contract traded on CBOT.', category: 'commodities', icon: '🌽' },
    { ticker: 'ZS=F', name: 'Soybean Futures', desc: 'Agricultural Soybean futures contract traded on CBOT.', category: 'commodities', icon: '🌱' },
    { ticker: 'ZW=F', name: 'Wheat Futures', desc: 'Agricultural Wheat futures contract traded on CBOT.', category: 'commodities', icon: '🌾' },
    { ticker: 'PL=F', name: 'Platinum Futures', desc: 'Platinum futures contract, rare precious metal.', category: 'commodities', icon: '⛓️' }
];

// Charts singletons
let priceChart = null;
let confidenceGauge = null;
let allocationChart = null;
let rsiChart = null;
let macdChart = null;

// Suggested Tickers lists
const tickerSuggestions = {
    us: ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META'],
    in: ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'TMCV.NS'],
    crypto: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'ADA-USD'],
    forex: ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'GBPJPY=X'],
    commodities: ['GC=F', 'GLD', 'SI=F', 'SLV', 'CL=F', 'USO']
};

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.setAttribute('data-lucide', 'moon');
        }
    }

    // Render Icons
    lucide.createIcons();
    
    // Load Portfolio & suggestions
    syncWatchlistSharesFromTransactions();
    renderPortfolioList();
    updatePortfolioValue();
    switchSuggestions(null, 'us');
    updateAlertsCount();
    
    // Fetch live ticker tape indices
    fetchTickerTape();
    setInterval(fetchTickerTape, 60000); // refresh every minute
    setInterval(backgroundAlertCheck, 60000); // run active alert check
    
    // Bind Event Listeners
    document.getElementById('searchForm').addEventListener('submit', handleSearch);
    document.getElementById('daysRange').addEventListener('input', (e) => {
        document.getElementById('daysVal').innerText = e.target.value;
    });
    document.getElementById('updateHoldingBtn').addEventListener('click', handleUpdateHolding);
    
    // Bind Overlays Checkbox listeners
    document.getElementById('checkBB').addEventListener('change', updateChartSeries);
    document.getElementById('checkSMA50').addEventListener('change', updateChartSeries);
    document.getElementById('checkSMA200').addEventListener('change', updateChartSeries);

    // Bind DCF Sliders
    document.getElementById('dcfGrowth').addEventListener('input', handleDcfSliderUpdate);
    document.getElementById('dcfWacc').addEventListener('input', handleDcfSliderUpdate);
    document.getElementById('dcfTerminal').addEventListener('input', handleDcfSliderUpdate);

    // Bind Transaction Form
    document.getElementById('transactionForm').addEventListener('submit', handleAddTransaction);

    // Bind Alert Form
    document.getElementById('alertForm').addEventListener('submit', handleAddAlert);

    // Bind Theme Toggle Button
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleAppTheme);
    }

    // Initialize transaction date input to today
    document.getElementById('txDate').valueAsDate = new Date();

    // Initialize OpenAI Key status badge
    updateOpenAiBadge();

    // Bind settings modal controls
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveKeyBtn = document.getElementById('saveKeyBtn');
    const clearKeyBtn = document.getElementById('clearKeyBtn');
    const openaiKeyInput = document.getElementById('openaiKeyInput');

    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            openaiKeyInput.value = localStorage.getItem('openai_api_key') || '';
            settingsModal.style.display = 'flex';
        });
    }

    if (closeSettingsBtn && settingsModal) {
        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
    }

    // Close on backdrop click
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        });
    }

    if (saveKeyBtn && settingsModal) {
        saveKeyBtn.addEventListener('click', () => {
            const key = openaiKeyInput.value.trim();
            if (key) {
                localStorage.setItem('openai_api_key', key);
            } else {
                localStorage.removeItem('openai_api_key');
            }
            updateOpenAiBadge();
            settingsModal.style.display = 'none';
            // Trigger analysis refresh if a stock is loaded
            if (currentStockData) {
                analyzeTicker(currentStockData.ticker, document.getElementById('daysRange').value, currentTimeframe);
            }
        });
    }

    if (clearKeyBtn && settingsModal) {
        clearKeyBtn.addEventListener('click', () => {
            localStorage.removeItem('openai_api_key');
            openaiKeyInput.value = '';
            updateOpenAiBadge();
            settingsModal.style.display = 'none';
            if (currentStockData) {
                analyzeTicker(currentStockData.ticker, document.getElementById('daysRange').value, currentTimeframe);
            }
        });
    }

    // Centerpiece Search Form
    const centerSearchForm = document.getElementById('centerSearchForm');
    if (centerSearchForm) {
        centerSearchForm.addEventListener('submit', handleCenterSearch);
    }

    // Explorer search input listener
    const explorerSearchInput = document.getElementById('explorerSearchInput');
    if (explorerSearchInput) {
        explorerSearchInput.addEventListener('input', (e) => {
            explorerSearchQuery = e.target.value;
            renderExplorerGrid();
        });
    }

    // Auth Form & Modal Bindings
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', handleAuthSubmit);
    }

    const closeAuthBtn = document.getElementById('closeAuthBtn');
    if (closeAuthBtn) {
        closeAuthBtn.addEventListener('click', closeAuthModal);
    }

    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                closeAuthModal();
            }
        });
    }

    // Initialize user profile & database loading
    updateProfileUI();
    if (authToken) {
        loadUserDataFromDatabase();
    }

    // Set initial view
    switchView('dashboard');
});

// Fetch Ticker Tape Marquee
async function fetchTickerTape() {
    try {
        const response = await fetch('/api/indices');
        if (!response.ok) return;
        const data = await response.json();
        
        const wrapper = document.getElementById('tickerTapeWrapper');
        if (data.length === 0) return;
        
        const itemsHtml = data.map(item => {
            const isPos = item.change >= 0;
            return `
                <div class="ticker-item" onclick="loadTickerDirect('${item.ticker}')" style="cursor: pointer;">
                    <span class="name">${item.name}</span>
                    <span class="price font-mono">$${item.price.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                    <span class="change font-mono ${isPos ? 'text-success' : 'text-danger'}">
                        ${isPos ? '▲' : '▼'} ${item.change_pct.toFixed(2)}%
                    </span>
                </div>
            `;
        });
        
        // Double it to loop infinitely
        wrapper.innerHTML = [...itemsHtml, ...itemsHtml].join('');
    } catch (err) {
        console.error('Ticker tape fetch error:', err);
    }
}

function loadTickerDirect(ticker) {
    document.getElementById('tickerInput').value = ticker;
    analyzeTicker(ticker, document.getElementById('daysRange').value, currentTimeframe);
}

// Global Suggestions tab switcher
function switchSuggestions(e, category) {
    currentCategory = category;
    
    // Highlight tab
    const tabs = document.querySelectorAll('.s-tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    if (e) {
        e.target.classList.add('active');
    } else {
        // Find by category matching text
        tabs.forEach(t => {
            if (t.innerText.toLowerCase() === category) t.classList.add('active');
        });
    }
    
    // Populate list
    const list = document.getElementById('suggestionList');
    list.innerHTML = '';
    
    tickerSuggestions[category].forEach(ticker => {
        const span = document.createElement('span');
        span.className = 's-item';
        span.innerText = ticker;
        span.onclick = () => {
            document.getElementById('tickerInput').value = ticker;
            analyzeTicker(ticker, document.getElementById('daysRange').value, currentTimeframe);
        };
        list.appendChild(span);
    });
}

// Timeframe Toggler (short vs long)
async function toggleTimeframe(timeframe) {
    if (!currentStockData || currentTimeframe === timeframe) return;
    currentTimeframe = timeframe;
    
    // Toggle active classes
    document.getElementById('tfLongBtn').classList.toggle('active', timeframe === 'long');
    document.getElementById('tfShortBtn').classList.toggle('active', timeframe === 'short');
    
    // Re-analyze
    const ticker = currentStockData.ticker;
    const days = document.getElementById('daysRange').value;
    await analyzeTicker(ticker, days, timeframe);
}

// Search Form Handler
async function handleSearch(e) {
    e.preventDefault();
    const ticker = document.getElementById('tickerInput').value.trim().toUpperCase();
    const days = document.getElementById('daysRange').value;
    if (!ticker) return;
    
    await analyzeTicker(ticker, days, currentTimeframe);
}

// Core API Call
async function analyzeTicker(ticker, days, timeframe = 'long') {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const tickerInput = document.getElementById('tickerInput');
    
    // Set loading state
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `<span>Loading...</span><i class="animate-pulse" data-lucide="loader"></i>`;
    lucide.createIcons();
    
    try {
        const openaiKey = localStorage.getItem('openai_api_key') || '';
        const headers = {};
        if (openaiKey) {
            headers['X-OpenAI-Key'] = openaiKey;
        }
        const response = await fetch(`/api/analyze?ticker=${encodeURIComponent(ticker)}&days=${days}&timeframe=${timeframe}`, {
            headers: headers
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to analyze ticker');
        }
        
        const data = await response.json();
        currentStockData = data;
        
        // Show grid, timeframe bar, navigation tab bar and hide empty state
        document.getElementById('emptyState').style.display = 'none';
        const dbView = document.getElementById('dashboardView');
        if (dbView) dbView.style.display = 'block';
        switchDashboardSlide('charts');
        document.getElementById('viewNav').style.display = 'flex';
        document.getElementById('timeframeToggleBar').style.display = 'flex';
        
        // Update header & badges
        document.getElementById('companyName').innerText = data.company_name;
        const badge = document.getElementById('tickerBadge');
        badge.innerText = data.ticker;
        badge.style.display = 'block';
        
        // Gold highlight style if analyzing Gold
        const isGold = (data.ticker === 'GC=F' || data.ticker === 'GLD');
        if (isGold) {
            badge.classList.add('gold-ticker');
        } else {
            badge.classList.remove('gold-ticker');
        }
        
        // Highlight active timeframe view
        document.getElementById('tfLongBtn').classList.toggle('active', timeframe === 'long');
        document.getElementById('tfShortBtn').classList.toggle('active', timeframe === 'short');
        
        // API status keys
        updateOpenAiBadge(data.sentiment.openai_active);
        
        // Update dashboard elements
        updateKeyStats(data);
        updatePrediction(data, timeframe);
        updateSentiment(data);
        updateSignals(data);
        updateHistoricalTable(data.historical_data);
        
        // Render/refresh charts
        renderPriceChart(data);
        renderRsiChart(data);
        renderMacdChart(data);
        
        // Initialize DCF Valuation
        initDcfCalculator(data);
        
        // Populate Peer Matrix
        renderPeersMatrix(data.peers);
        
        // Update investment suitability scorecard progress bars
        updateScorecard(data.scores);
        
        // Update allocation selector
        updateHoldingSection(data.ticker);
        
        // Check alerts
        checkAlertsForTicker(data.ticker, data.current_price, data.prediction.signals.rsi);
        
        // Auto add to portfolio list with 0 shares if not present
        if (!portfolio.some(item => item.ticker === data.ticker)) {
            portfolio.push({ ticker: data.ticker, shares: 0 });
            savePortfolio();
            renderPortfolioList();
        }
        
        // Highlight active portfolio item
        highlightActivePortfolioItem(data.ticker);
        
        // Switch to current active tab view (default to dashboard)
        const activeTab = document.querySelector('.nav-tab-btn.active');
        let viewName = activeTab ? activeTab.getAttribute('onclick').match(/'([^']+)'/)[1] : 'dashboard';
        if (viewName === 'explorer') {
            viewName = 'dashboard';
        }
        switchView(viewName);
        
    } catch (err) {
        alert(err.message);
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = `<span>Analyze</span><i data-lucide="arrow-right"></i>`;
        lucide.createIcons();
    }
}

// Update OpenAI Key Status Indicator Badge
function updateOpenAiBadge(isServerActive = false) {
    const hasLocalKey = !!localStorage.getItem('openai_api_key');
    const badge = document.getElementById('openaiStatus');
    if (badge) {
        if (isServerActive || hasLocalKey) {
            badge.classList.add('active');
            badge.classList.remove('success', 'danger');
            badge.innerHTML = `<i data-lucide="check-circle"></i> OpenAI Connected`;
        } else {
            badge.classList.remove('active', 'success');
            badge.innerHTML = `<i data-lucide="key"></i> OpenAI (Off)`;
        }
        lucide.createIcons();
    }
}

// Format Helper
function formatCurrency(val) {
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Update Top Row Key Cards
function updateKeyStats(data) {
    document.getElementById('currentPrice').innerText = `$${data.current_price.toFixed(2)}`;
    
    const changeText = `${data.day_change >= 0 ? '+' : ''}${data.day_change.toFixed(2)} (${data.day_change_pct >= 0 ? '+' : ''}${data.day_change_pct.toFixed(2)}%)`;
    const dayChangeEl = document.getElementById('dayChange');
    dayChangeEl.innerText = changeText;
    
    const iconBox = document.getElementById('dayChangeIconBox');
    dayChangeEl.className = 'stat-value font-mono';
    iconBox.className = 'stat-icon-wrapper';
    
    if (data.day_change >= 0) {
        dayChangeEl.classList.add('text-success');
        iconBox.classList.add('green');
        iconBox.innerHTML = `<i data-lucide="trending-up" class="text-success"></i>`;
    } else {
        dayChangeEl.classList.add('text-danger');
        iconBox.classList.add('red');
        iconBox.innerHTML = `<i data-lucide="trending-down" class="text-danger"></i>`;
    }
    
    document.getElementById('high52Week').innerText = `$${data.high_52week.toFixed(2)}`;
    document.getElementById('low52Week').innerText = `$${data.low_52week.toFixed(2)}`;
    document.getElementById('marketCap').innerText = formatCurrency(data.market_cap);
    
    lucide.createIcons();
}

// Update ML Prediction Widget
function updatePrediction(data, timeframe) {
    const pred = data.prediction;
    const directionEl = document.getElementById('directionBadge');
    
    directionEl.innerText = pred.direction;
    directionEl.className = 'badge';
    
    document.getElementById('forecastDir').innerText = pred.direction;
    
    const changeValEl = document.getElementById('expectedChange');
    const rangeLabel = document.getElementById('forecastRangeLabel');
    
    if (timeframe === 'long') {
        changeValEl.innerText = `${pred.price_change_pct >= 0 ? '+' : ''}${pred.price_change_pct.toFixed(2)}%`;
        changeValEl.className = 'value font-mono';
        rangeLabel.innerText = "Expected Change (30d)";
        
        if (pred.direction.includes('BULLISH')) {
            directionEl.classList.add('bullish');
            changeValEl.classList.add('text-success');
        } else if (pred.direction.includes('BEARISH')) {
            directionEl.classList.add('bearish');
            changeValEl.classList.add('text-danger');
        } else {
            directionEl.classList.add('neutral');
            changeValEl.classList.add('text-warning');
        }
    } else {
        // Intraday doesn't support 30D forecasting models
        changeValEl.innerText = 'N/A';
        changeValEl.className = 'value font-mono text-warning';
        rangeLabel.innerText = "Intraday Range (5d)";
        directionEl.className = 'badge neutral';
        directionEl.innerText = '➡️ INTRADAY';
    }
    
    // Render Radial confidence gauge (based on trend confidence or day change if short-term)
    const gaugeValue = timeframe === 'long' ? pred.confidence : Math.min(100, Math.abs(data.day_change_pct) * 10);
    const options = {
        series: [gaugeValue],
        chart: {
            height: 180,
            type: 'radialBar',
            sparkline: { enabled: true }
        },
        plotOptions: {
            radialBar: {
                startAngle: -90,
                endAngle: 90,
                track: {
                    background: 'rgba(255,255,255,0.05)',
                    strokeWidth: '97%',
                },
                dataLabels: {
                    name: { show: false },
                    value: {
                        offsetY: -2,
                        fontSize: '22px',
                        fontWeight: '700',
                        color: '#f8fafc',
                        formatter: (val) => `${val.toFixed(1)}%`
                    }
                }
            }
        },
        fill: {
            colors: [timeframe === 'short' ? '#00d9ff' : pred.direction.includes('BULLISH') ? '#00ff66' : pred.direction.includes('BEARISH') ? '#ff4d66' : '#ffd200']
        },
        stroke: { lineCap: 'round' }
    };
    
    if (confidenceGauge) {
        confidenceGauge.destroy();
    }
    confidenceGauge = new ApexCharts(document.querySelector("#confidenceGauge"), options);
    confidenceGauge.render();
}

// Update Market Sentiment index Card
function updateSentiment(data) {
    const sent = data.sentiment;
    const scoreVal = sent.score;
    const badge = document.getElementById('sentimentBadge');
    
    badge.innerText = sent.overall.toUpperCase();
    badge.className = 'badge';
    
    const scoreEl = document.getElementById('sentimentScore');
    scoreEl.innerText = scoreVal.toFixed(2);
    scoreEl.className = 'score-value font-mono';
    
    if (sent.overall === 'positive') {
        badge.classList.add('bullish');
        scoreEl.style.color = 'var(--success)';
    } else if (sent.overall === 'negative') {
        badge.classList.add('bearish');
        scoreEl.style.color = 'var(--danger)';
    } else {
        badge.classList.add('neutral');
        scoreEl.style.color = 'var(--warning)';
    }
    
    document.getElementById('bullishCount').innerText = sent.text_analysis.bullish || 0;
    document.getElementById('bearishCount').innerText = sent.text_analysis.bearish || 0;
}

// Update Technical Indicator Signals Table
function updateSignals(data) {
    const signals = data.prediction.signals;
    
    // RSI
    document.getElementById('rsiVal').innerText = signals.rsi ? signals.rsi.toFixed(1) : 'N/A';
    const rsiBadge = document.getElementById('rsiSignal');
    rsiBadge.innerText = signals.rsi_signal || 'N/A';
    rsiBadge.className = `signal-badge ${signals.rsi_signal?.toLowerCase() || 'neutral'}`;
    
    // MACD
    document.getElementById('macdVal').innerText = signals.macd ? signals.macd.toFixed(3) : 'N/A';
    const macdBadge = document.getElementById('macdSignal');
    macdBadge.innerText = signals.macd_signal || 'N/A';
    macdBadge.className = `signal-badge ${signals.macd_signal?.toLowerCase() || 'neutral'}`;
    
    // Bollinger bands
    const bbBadge = document.getElementById('bbSignal');
    bbBadge.innerText = signals.bb_position || 'N/A';
    bbBadge.className = `signal-badge ${signals.bb_position?.toLowerCase() || 'neutral'}`;
    
    // Momentum
    document.getElementById('momentumVal').innerText = signals.momentum ? `${signals.momentum.toFixed(2)}%` : 'N/A';
    const momBadge = document.getElementById('momentumSignal');
    momBadge.innerText = signals.momentum > 0 ? 'BULLISH' : signals.momentum < 0 ? 'BEARISH' : 'NEUTRAL';
    momBadge.className = `signal-badge ${signals.momentum > 0 ? 'bullish' : signals.momentum < 0 ? 'bearish' : 'neutral'}`;
}

// Update suitability scorecard profile progress bars
function updateScorecard(scores) {
    const traderBar = document.getElementById('traderScoreBar');
    const investorBar = document.getElementById('investorScoreBar');
    
    document.getElementById('traderScoreVal').innerText = `${scores.trader_score}%`;
    document.getElementById('investorScoreVal').innerText = `${scores.investor_score}%`;
    
    traderBar.style.width = `${scores.trader_score}%`;
    investorBar.style.width = `${scores.investor_score}%`;
}

// Render Price Chart with dynamic SMA/BB checkbox overlays, Crossover Indicators, and Candlestick toggle
function renderPriceChart(data) {
    const historical = data.historical_data;
    const forecast = data.prediction.forecast;
    const isLongTimeframe = data.timeframe === 'long';
    
    const dates = historical.map(h => h.date);
    const prices = historical.map(h => h.close);
    
    // 1. Core Series (Historical close or candlestick)
    let coreSeries;
    let coreType;
    let coreName;
    if (currentChartType === 'candlestick') {
        coreType = 'candlestick';
        coreName = 'Price OHLC';
        coreSeries = historical.map(h => ({
            x: h.date,
            y: [h.open, h.high, h.low, h.close]
        }));
    } else {
        coreType = 'area';
        coreName = 'Close Price';
        coreSeries = prices.map((p, idx) => ({ x: dates[idx], y: p }));
    }
    
    const activeSeries = [{
        name: coreName,
        type: coreType,
        data: coreSeries
    }];
    
    const activeColors = [currentChartType === 'candlestick' ? '#ffffff' : '#00d9ff'];
    const activeWidths = [currentChartType === 'candlestick' ? 1.5 : 2.5];
    const activeDashes = [0];
    const activeFills = [currentChartType === 'candlestick' ? 'solid' : 'gradient'];
    
    // 2. AI Forecast (only long-term)
    if (isLongTimeframe && forecast && forecast.length > 0) {
        document.getElementById('forecastLegend').style.display = 'inline-flex';
        document.getElementById('confidenceLegend').style.display = 'inline-flex';
        
        const futureDates = [];
        let lastDate = new Date(dates[dates.length - 1]);
        
        for (let i = 0; i < forecast.length; i++) {
            lastDate.setDate(lastDate.getDate() + 1);
            const y = lastDate.getFullYear();
            const m = String(lastDate.getMonth() + 1).padStart(2, '0');
            const d = String(lastDate.getDate()).padStart(2, '0');
            futureDates.push(`${y}-${m}-${d}`);
        }
        
        const forecastSeries = [{ x: dates[dates.length - 1], y: prices[prices.length - 1] }];
        futureDates.forEach((d, idx) => {
            forecastSeries.push({ x: d, y: forecast[idx] });
        });
        
        activeSeries.push({
            name: 'AI Forecast (30d)',
            type: 'line',
            data: forecastSeries
        });
        activeColors.push('#00ff66');
        activeWidths.push(2.5);
        activeDashes.push(5);
        activeFills.push('solid');
        
        // Confidence bands
        const stdDev = getStandardDeviation(forecast);
        const upperSeries = [{ x: dates[dates.length - 1], y: prices[prices.length - 1] }];
        const lowerSeries = [{ x: dates[dates.length - 1], y: prices[prices.length - 1] }];
        futureDates.forEach((d, idx) => {
            upperSeries.push({ x: d, y: forecast[idx] + stdDev });
            lowerSeries.push({ x: d, y: Math.max(0, forecast[idx] - stdDev) });
        });
        
        activeSeries.push({
            name: 'Range Upper',
            type: 'line',
            data: upperSeries
        });
        activeSeries.push({
            name: 'Range Lower',
            type: 'line',
            data: lowerSeries
        });
        
        activeColors.push('rgba(0, 255, 102, 0.2)', 'rgba(0, 255, 102, 0.2)');
        activeWidths.push(1, 1);
        activeDashes.push(3, 3);
        activeFills.push('solid', 'solid');
    } else {
        document.getElementById('forecastLegend').style.display = 'none';
        document.getElementById('confidenceLegend').style.display = 'none';
    }
    
    // 3. Technical Indicator Overlays
    const showBB = document.getElementById('checkBB').checked;
    const showSMA50 = document.getElementById('checkSMA50').checked;
    const showSMA200 = document.getElementById('checkSMA200').checked;
    
    if (showBB) {
        const bbUpper = historical.map((h, idx) => ({ x: dates[idx], y: h.bb_upper }));
        const bbLower = historical.map((h, idx) => ({ x: dates[idx], y: h.bb_lower }));
        
        activeSeries.push({
            name: 'Bollinger Band Upper',
            type: 'line',
            data: bbUpper
        });
        activeSeries.push({
            name: 'Bollinger Band Lower',
            type: 'line',
            data: bbLower
        });
        
        activeColors.push('rgba(191, 90, 242, 0.4)', 'rgba(191, 90, 242, 0.4)');
        activeWidths.push(1, 1);
        activeDashes.push(2, 2);
        activeFills.push('solid', 'solid');
    }
    
    if (showSMA50) {
        const sma50 = historical.map((h, idx) => ({ x: dates[idx], y: h.sma_50 }));
        activeSeries.push({
            name: 'SMA 50',
            type: 'line',
            data: sma50
        });
        activeColors.push('#ffb700');
        activeWidths.push(1.5);
        activeDashes.push(0);
        activeFills.push('solid');
    }
    
    if (showSMA200) {
        const sma200 = historical.map((h, idx) => ({ x: dates[idx], y: h.sma_200 }));
        activeSeries.push({
            name: 'SMA 200',
            type: 'line',
            data: sma200
        });
        activeColors.push('#ff4d66');
        activeWidths.push(1.8);
        activeDashes.push(0);
        activeFills.push('solid');
    }
    
    // 4. Calculate SMA Crossovers (Golden / Death Cross)
    const crossovers = [];
    for (let i = 1; i < historical.length; i++) {
        const prev = historical[i - 1];
        const curr = historical[i];
        if (prev.sma_50 && prev.sma_200 && curr.sma_50 && curr.sma_200) {
            const prevAbove = prev.sma_50 >= prev.sma_200;
            const currAbove = curr.sma_50 >= curr.sma_200;
            if (!prevAbove && currAbove) {
                crossovers.push({ date: curr.date, price: curr.close, type: 'golden' });
            } else if (prevAbove && !currAbove) {
                crossovers.push({ date: curr.date, price: curr.close, type: 'death' });
            }
        }
    }
    
    const options = {
        series: activeSeries,
        chart: {
            height: 380,
            type: 'line',
            toolbar: { show: false },
            background: 'transparent',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: { enabled: true, delay: 150 },
                dynamicAnimation: { enabled: true, speed: 350 }
            }
        },
        theme: { mode: 'dark' },
        stroke: {
            width: activeWidths,
            dashArray: activeDashes,
            curve: 'smooth'
        },
        fill: {
            type: activeFills,
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.25,
                opacityTo: 0.0,
                stops: [0, 90, 100]
            }
        },
        colors: activeColors,
        plotOptions: {
            candlestick: {
                colors: {
                    upward: '#00ff66',
                    downward: '#ff3e60'
                },
                wick: {
                    useFillColor: true
                }
            }
        },
        xaxis: {
            type: 'datetime',
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
                style: { colors: '#94a3b8', fontFamily: 'Outfit, sans-serif' }
            }
        },
        yaxis: {
            labels: {
                formatter: (val) => val ? `$${val.toFixed(2)}` : '',
                style: { colors: '#94a3b8', fontFamily: 'Outfit, sans-serif' }
            }
        },
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.04)',
            xaxis: { lines: { show: true } }
        },
        legend: { show: false },
        annotations: {
            points: crossovers.map(c => {
                const isGolden = c.type === 'golden';
                return {
                    x: new Date(c.date).getTime(),
                    y: c.price,
                    marker: {
                        size: 6,
                        fillColor: isGolden ? '#00ff66' : '#ff3e60',
                        strokeColor: '#05050a',
                        strokeWidth: 2,
                    },
                    label: {
                        borderColor: isGolden ? '#00ff66' : '#ff3e60',
                        borderWidth: 1,
                        style: {
                            color: '#fff',
                            background: isGolden ? 'rgba(0, 255, 102, 0.95)' : 'rgba(255, 62, 96, 0.95)',
                            fontSize: '9px',
                            fontFamily: 'Outfit, sans-serif'
                        },
                        text: isGolden ? 'GOLDEN CROSS' : 'DEATH CROSS'
                    }
                };
            })
        },
        tooltip: {
            shared: true,
            intersect: false,
            theme: 'dark',
            x: { format: isLongTimeframe ? 'dd MMM yyyy' : 'dd MMM HH:mm' },
            y: {
                formatter: (val) => val ? `$${val.toFixed(2)}` : 'N/A'
            }
        }
    };
    
    if (priceChart) {
        priceChart.destroy();
    }
    priceChart = new ApexCharts(document.querySelector("#priceForecastChart"), options);
    priceChart.render();
}

// Overlays trigger refresh
function updateChartSeries() {
    if (!currentStockData) return;
    renderPriceChart(currentStockData);
}

// Math helper for confidence bands
function getStandardDeviation(arr) {
    if (arr.length === 0) return 0;
    const n = arr.length;
    const mean = arr.reduce((a, b) => a + b) / n;
    return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}

// Populate Recent Data Table (OHLCV)
function updateHistoricalTable(history) {
    const tbody = document.getElementById('historicalTableBody');
    tbody.innerHTML = '';
    
    const recent = [...history].reverse().slice(0, 10);
    
    recent.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.date}</td>
            <td>$${row.open.toFixed(2)}</td>
            <td>$${row.high.toFixed(2)}</td>
            <td>$${row.low.toFixed(2)}</td>
            <td>$${row.close.toFixed(2)}</td>
            <td>${row.volume.toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Portfolio Section Handlers
async function savePortfolio() {
    localStorage.setItem('stock_portfolio', JSON.stringify(portfolio));
    if (authToken) {
        try {
            await apiFetch('/api/watchlist/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: portfolio.map(item => ({ ticker: item.ticker, shares: item.shares })) })
            });
        } catch (err) {
            console.error("Failed to sync portfolio watchlist to database:", err);
        }
    }
}

function renderPortfolioList() {
    const list = document.getElementById('portfolioList');
    list.innerHTML = '';
    
    portfolio.forEach(item => {
        const div = document.createElement('div');
        div.className = 'portfolio-item';
        div.id = `portItem-${item.ticker}`;
        div.onclick = () => loadPortfolioItem(item.ticker);
        
        div.innerHTML = `
            <div class="left">
                <span class="ticker font-mono">${item.ticker}</span>
                <span class="shares">${item.shares || 0} shares</span>
            </div>
            <div class="right">
                <button class="remove-btn" onclick="removePortfolioItem(event, '${item.ticker}')">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        list.appendChild(div);
    });
    
    lucide.createIcons();
}

function highlightActivePortfolioItem(ticker) {
    const items = document.querySelectorAll('.portfolio-item');
    items.forEach(el => el.classList.remove('active'));
    
    const activeEl = document.getElementById(`portItem-${ticker}`);
    if (activeEl) {
        activeEl.classList.add('active');
    }
}

function loadPortfolioItem(ticker) {
    document.getElementById('tickerInput').value = ticker;
    const days = document.getElementById('daysRange').value;
    analyzeTicker(ticker, days, currentTimeframe);
}

function removePortfolioItem(e, ticker) {
    e.stopPropagation();
    portfolio = portfolio.filter(item => item.ticker !== ticker);
    savePortfolio();
    renderPortfolioList();
    updatePortfolioValue();
    
    // Reset page if currently active is deleted
    if (currentStockData && currentStockData.ticker === ticker) {
        currentStockData = null;
        const dbView = document.getElementById('dashboardView');
        if (dbView) dbView.style.display = 'none';
        const viewNav = document.getElementById('viewNav');
        if (viewNav) viewNav.style.display = 'none';
        document.getElementById('emptyState').style.display = 'flex';
        document.getElementById('tickerBadge').style.display = 'none';
        document.getElementById('timeframeToggleBar').style.display = 'none';
        document.getElementById('companyName').innerText = 'Enter a stock ticker';
    }
}

function updateHoldingSection(ticker) {
    const item = portfolio.find(item => item.ticker === ticker);
    const sharesInput = document.getElementById('sharesInput');
    sharesInput.value = item ? item.shares : 0;
    
    updateHoldingDisplay();
}

function handleUpdateHolding() {
    if (!currentStockData) return;
    const ticker = currentStockData.ticker;
    const shares = parseFloat(document.getElementById('sharesInput').value) || 0;
    
    const item = portfolio.find(item => item.ticker === ticker);
    if (item) {
        item.shares = shares;
    } else {
        portfolio.push({ ticker, shares });
    }
    
    savePortfolio();
    renderPortfolioList();
    updatePortfolioValue();
    updateHoldingDisplay();
    highlightActivePortfolioItem(ticker);
}

function updateHoldingDisplay() {
    if (!currentStockData) return;
    const ticker = currentStockData.ticker;
    const item = portfolio.find(item => item.ticker === ticker);
    const shares = item ? item.shares : 0;
    
    const value = shares * currentStockData.current_price;
    document.getElementById('holdingValue').innerText = `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const total = calculateEstimatedPortfolioValue();
    const weight = total > 0 ? (value / total) * 100 : 0;
    document.getElementById('holdingWeight').innerText = `${weight.toFixed(2)}%`;
}

function calculateEstimatedPortfolioValue() {
    let total = 0;
    portfolio.forEach(item => {
        if (currentStockData && item.ticker === currentStockData.ticker) {
            total += item.shares * currentStockData.current_price;
        } else {
            const savedPrice = parseFloat(localStorage.getItem(`price-${item.ticker}`)) || 0;
            total += item.shares * savedPrice;
        }
    });
    return total;
}

function updatePortfolioValue() {
    if (currentStockData) {
        localStorage.setItem(`price-${currentStockData.ticker}`, currentStockData.current_price);
    }
    
    const total = calculateEstimatedPortfolioValue();
    const box = document.getElementById('portfolioSummaryBox');
    
    if (portfolio.length > 0 && total > 0) {
        if (box) box.style.display = 'block';
        const totalValEl = document.getElementById('portfolioTotalValue');
        if (totalValEl) {
            totalValEl.innerText = `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        renderAllocationChart();
    } else {
        if (box) box.style.display = 'none';
    }
}

function renderAllocationChart() {
    const list = portfolio.filter(item => item.shares > 0);
    if (list.length === 0) {
        if (allocationChart) {
            allocationChart.destroy();
            allocationChart = null;
        }
        return;
    }
    
    const labels = list.map(item => item.ticker);
    const series = list.map(item => {
        if (currentStockData && item.ticker === currentStockData.ticker) {
            return item.shares * currentStockData.current_price;
        }
        const savedPrice = parseFloat(localStorage.getItem(`price-${item.ticker}`)) || 0;
        return item.shares * savedPrice;
    });
    
    const options = {
        series: series,
        chart: {
            height: 160,
            type: 'donut',
            background: 'transparent'
        },
        labels: labels,
        stroke: { show: false },
        dataLabels: { enabled: false },
        legend: { show: false },
        theme: { mode: 'dark' },
        colors: ['#00d9ff', '#00ff66', '#bf5af2', '#ffb700', '#ff3e60', '#ff9f43'],
        tooltip: {
            y: {
                formatter: (val) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
        }
    };
    
    if (allocationChart) {
        allocationChart.destroy();
    }
    
    const chartEl = document.querySelector("#allocationChart");
    if (chartEl) {
        allocationChart = new ApexCharts(chartEl, options);
        allocationChart.render();
    }
}

// Switch Tab Views
// Switch Tab Views
function switchView(viewName) {
    const views = ['dashboardView', 'backtesterView', 'portfolioView', 'alertsView', 'explorerView'];
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.style.display = 'none';
    });
    
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.style.display = 'none';
    
    if (viewName === 'dashboard') {
        if (!currentStockData) {
            if (emptyState) emptyState.style.display = 'flex';
            const tfBar = document.getElementById('timeframeToggleBar');
            if (tfBar) tfBar.style.display = 'none';
        } else {
            const target = document.getElementById('dashboardView');
            if (target) target.style.display = 'block';
            const tfBar = document.getElementById('timeframeToggleBar');
            if (tfBar) tfBar.style.display = 'flex';
        }
    } else {
        const target = document.getElementById(`${viewName}View`);
        if (target) {
            target.style.display = 'block';
        }
        const tfBar = document.getElementById('timeframeToggleBar');
        if (tfBar) tfBar.style.display = 'none';
    }
    
    const tabs = document.querySelectorAll('.nav-tab-btn');
    tabs.forEach(tab => {
        const onclickAttr = tab.getAttribute('onclick') || '';
        const matches = onclickAttr.includes(viewName);
        tab.classList.toggle('active', matches);
    });
    
    if (viewName === 'portfolio') {
        renderPortfolioCostMarketPL();
        renderPortfolioDetailsAllocationChart();
        if (typeof renderLedgerTable === 'function') renderLedgerTable();
    }
    if (viewName === 'alerts') {
        renderAlertsList();
        renderTriggeredAlertsLog();
    }
    if (viewName === 'explorer') {
        renderExplorerGrid();
    }
}

// Toggle Candlestick/Area Price Chart Type
let currentChartType = 'area';
function toggleChartType(type) {
    if (currentChartType === type) return;
    currentChartType = type;
    
    document.getElementById('chartAreaBtn').classList.toggle('active', type === 'area');
    document.getElementById('chartCandleBtn').classList.toggle('active', type === 'candlestick');
    
    if (currentStockData) {
        renderPriceChart(currentStockData);
    }
}

// Render RSI Subplot Chart
function renderRsiChart(data) {
    const historical = data.historical_data;
    const dates = historical.map(h => h.date);
    const rsiValues = historical.map(h => h.rsi);
    
    const series = [{
        name: 'RSI',
        data: rsiValues.map((r, idx) => ({ x: dates[idx], y: r }))
    }];
    
    const options = {
        series: series,
        chart: {
            height: 140,
            type: 'line',
            toolbar: { show: false },
            background: 'transparent',
            animations: { enabled: false }
        },
        theme: { mode: 'dark' },
        stroke: { width: 1.5, curve: 'smooth' },
        colors: ['#bf5af2'],
        xaxis: {
            type: 'datetime',
            labels: { show: false },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            min: 0,
            max: 100,
            tickAmount: 2,
            labels: {
                style: { colors: '#94a3b8', fontFamily: 'Outfit, sans-serif' }
            }
        },
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.04)',
            yaxis: { lines: { show: true } }
        },
        annotations: {
            yaxis: [
                {
                    y: 70,
                    borderColor: '#ff3e60',
                    borderWidth: 1,
                    strokeDashArray: 3,
                    label: {
                        style: { color: '#fff', background: '#ff3e60', fontFamily: 'Outfit, sans-serif' },
                        text: '70'
                    }
                },
                {
                    y: 30,
                    borderColor: '#00ff66',
                    borderWidth: 1,
                    strokeDashArray: 3,
                    label: {
                        style: { color: '#fff', background: '#00ff66', fontFamily: 'Outfit, sans-serif' },
                        text: '30'
                    }
                }
            ]
        },
        tooltip: {
            theme: 'dark',
            x: { format: data.timeframe === 'long' ? 'dd MMM yyyy' : 'dd MMM HH:mm' }
        }
    };
    
    if (rsiChart) {
        rsiChart.destroy();
    }
    rsiChart = new ApexCharts(document.querySelector("#rsiSubplotChart"), options);
    rsiChart.render();
}

// Render MACD Subplot Chart
function renderMacdChart(data) {
    const historical = data.historical_data;
    const dates = historical.map(h => h.date);
    
    const macdSeries = historical.map((h, idx) => ({ x: dates[idx], y: h.macd }));
    const signalSeries = historical.map((h, idx) => ({ x: dates[idx], y: h.macd_signal }));
    const histSeries = historical.map((h, idx) => ({ x: dates[idx], y: h.macd_hist }));
    
    const series = [
        {
            name: 'MACD Histogram',
            type: 'bar',
            data: histSeries
        },
        {
            name: 'MACD',
            type: 'line',
            data: macdSeries
        },
        {
            name: 'Signal',
            type: 'line',
            data: signalSeries
        }
    ];
    
    const options = {
        series: series,
        chart: {
            height: 160,
            type: 'line',
            toolbar: { show: false },
            background: 'transparent',
            animations: { enabled: false }
        },
        theme: { mode: 'dark' },
        stroke: {
            width: [0, 1.5, 1.5],
            curve: 'smooth'
        },
        colors: ['#ffb700', '#00d9ff', '#ff3e60'],
        fill: {
            opacity: [0.6, 1, 1]
        },
        xaxis: {
            type: 'datetime',
            labels: {
                style: { colors: '#94a3b8', fontFamily: 'Outfit, sans-serif' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                style: { colors: '#94a3b8', fontFamily: 'Outfit, sans-serif' }
            }
        },
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.04)',
            xaxis: { lines: { show: true } }
        },
        legend: { show: false },
        tooltip: {
            shared: true,
            theme: 'dark',
            x: { format: data.timeframe === 'long' ? 'dd MMM yyyy' : 'dd MMM HH:mm' }
        }
    };
    
    if (macdChart) {
        macdChart.destroy();
    }
    macdChart = new ApexCharts(document.querySelector("#macdSubplotChart"), options);
    macdChart.render();
}

// Initialise DCF Parameters
function initDcfCalculator(data) {
    let eps = parseFloat(data.eps);
    if (isNaN(eps) || eps <= 0) {
        const price = parseFloat(data.current_price);
        const pe = parseFloat(data.pe_ratio);
        if (!isNaN(pe) && pe > 0) {
            eps = price / pe;
        } else {
            eps = 2.0;
        }
    }
    
    document.getElementById('dcfGrowth').value = 8;
    document.getElementById('dcfGrowthVal').innerText = '8';
    
    document.getElementById('dcfWacc').value = 10;
    document.getElementById('dcfWaccVal').innerText = '10';
    
    document.getElementById('dcfTerminal').value = 2.5;
    document.getElementById('dcfTerminalVal').innerText = '2.5';
    
    calculateDCF(eps, data.current_price);
}

// DCF Slider Update Handler
function handleDcfSliderUpdate() {
    if (!currentStockData) return;
    
    const growth = parseFloat(document.getElementById('dcfGrowth').value);
    document.getElementById('dcfGrowthVal').innerText = growth;
    
    const wacc = parseFloat(document.getElementById('dcfWacc').value);
    document.getElementById('dcfWaccVal').innerText = wacc;
    
    const terminal = parseFloat(document.getElementById('dcfTerminal').value);
    document.getElementById('dcfTerminalVal').innerText = terminal;
    
    let eps = parseFloat(currentStockData.eps);
    if (isNaN(eps) || eps <= 0) {
        const price = parseFloat(currentStockData.current_price);
        const pe = parseFloat(currentStockData.pe_ratio);
        if (!isNaN(pe) && pe > 0) {
            eps = price / pe;
        } else {
            eps = 2.0;
        }
    }
    
    calculateDCF(eps, currentStockData.current_price);
}

// Perform Discounted Cash Flow valuation
function calculateDCF(eps, currentPrice) {
    const growthRate = parseFloat(document.getElementById('dcfGrowth').value) / 100;
    const discountRate = parseFloat(document.getElementById('dcfWacc').value) / 100;
    const terminalRate = parseFloat(document.getElementById('dcfTerminal').value) / 100;
    
    let cashFlows = [];
    let currentCF = eps;
    for (let i = 1; i <= 10; i++) {
        currentCF = currentCF * (1 + growthRate);
        cashFlows.push(currentCF);
    }
    
    let dcfVal = 0;
    for (let i = 0; i < 10; i++) {
        dcfVal += cashFlows[i] / Math.pow(1 + discountRate, i + 1);
    }
    
    const terminalValue = (cashFlows[9] * (1 + terminalRate)) / (discountRate - terminalRate);
    const discountedTerminalValue = terminalValue / Math.pow(1 + discountRate, 10);
    
    const intrinsicValue = dcfVal + discountedTerminalValue;
    const marginOfSafety = ((intrinsicValue - currentPrice) / intrinsicValue) * 100;
    
    document.getElementById('dcfValue').innerText = `$${intrinsicValue.toFixed(2)}`;
    
    const marginEl = document.getElementById('dcfMargin');
    const badgeEl = document.getElementById('dcfBadge');
    
    marginEl.innerText = `${marginOfSafety >= 0 ? '+' : ''}${marginOfSafety.toFixed(2)}%`;
    marginEl.className = 'val font-mono';
    badgeEl.className = 'badge';
    
    if (marginOfSafety > 20) {
        marginEl.classList.add('text-success');
        badgeEl.classList.add('bullish');
        badgeEl.innerText = 'UNDERVALUED';
    } else if (marginOfSafety < -10) {
        marginEl.classList.add('text-danger');
        badgeEl.classList.add('bearish');
        badgeEl.innerText = 'OVERVALUED';
    } else {
        marginEl.classList.add('text-warning');
        badgeEl.classList.add('neutral');
        badgeEl.innerText = 'FAIR VALUE';
    }
}

// Populate Peer Matrix Grid
function renderPeersMatrix(peers) {
    const tbody = document.getElementById('peersTableBody');
    tbody.innerHTML = '';
    
    if (!peers || peers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No industry peers data available</td></tr>';
        return;
    }
    
    peers.forEach(peer => {
        const pe = typeof peer.pe_ratio === 'number' ? peer.pe_ratio.toFixed(1) : peer.pe_ratio;
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onclick = () => loadTickerDirect(peer.ticker);
        tr.innerHTML = `
            <td class="font-mono" style="color:var(--primary); font-weight:600;">${peer.ticker}</td>
            <td class="font-mono">$${peer.price.toFixed(2)}</td>
            <td class="font-mono">${pe}</td>
            <td class="font-mono">${formatCurrency(peer.market_cap)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Run Backtesting engine simulation
function runStrategyBacktest() {
    if (!currentStockData) {
        alert("Please load a stock ticker first!");
        return;
    }
    
    const strategy = document.getElementById('backtestStrategy').value;
    const historical = currentStockData.historical_data;
    
    if (historical.length < 10) {
        alert("Not enough historical data to run backtest!");
        return;
    }
    
    let cash = 10000;
    let shares = 0;
    let trades = [];
    let activeTrade = null;
    let completedTradesCount = 0;
    let winningTradesCount = 0;
    
    let portfolioHistory = [];
    let initialPrice = historical[0].close;
    let finalPrice = historical[historical.length - 1].close;
    
    for (let i = 0; i < historical.length; i++) {
        const day = historical[i];
        const price = day.close;
        const date = day.date;
        
        let signal = 'neutral';
        
        if (strategy === 'rsi') {
            const rsi = day.rsi;
            if (rsi && rsi < 30) {
                signal = 'buy';
            } else if (rsi && rsi > 70) {
                signal = 'sell';
            }
        } else if (strategy === 'sma') {
            if (i > 0) {
                const prev = historical[i - 1];
                if (prev.sma_50 && prev.sma_200 && day.sma_50 && day.sma_200) {
                    const prevCross = prev.sma_50 - prev.sma_200;
                    const currCross = day.sma_50 - day.sma_200;
                    if (prevCross <= 0 && currCross > 0) {
                        signal = 'buy';
                    } else if (prevCross >= 0 && currCross < 0) {
                        signal = 'sell';
                    }
                }
            }
        }
        
        if (signal === 'buy' && shares === 0 && cash > 0) {
            shares = cash / price;
            const txValue = cash;
            cash = 0;
            activeTrade = { type: 'BUY', date, price, shares, value: txValue, pnl: 0 };
            trades.push(activeTrade);
        } else if (signal === 'sell' && shares > 0) {
            const txValue = shares * price;
            const pnl = txValue - activeTrade.value;
            const pnlPct = (pnl / activeTrade.value) * 100;
            
            trades.push({ type: 'SELL', date, price, shares, value: txValue, pnl: pnlPct });
            
            completedTradesCount++;
            if (pnl > 0) winningTradesCount++;
            
            cash = txValue;
            shares = 0;
            activeTrade = null;
        }
        
        const currentPortfolioValue = cash + (shares * price);
        portfolioHistory.push(currentPortfolioValue);
    }
    
    if (shares > 0) {
        const finalValue = shares * finalPrice;
        const pnl = finalValue - activeTrade.value;
        const pnlPct = (pnl / activeTrade.value) * 100;
        trades.push({ type: 'SELL (EOF)', date: historical[historical.length - 1].date, price: finalPrice, shares, value: finalValue, pnl: pnlPct });
        
        completedTradesCount++;
        if (pnl > 0) winningTradesCount++;
        cash = finalValue;
        shares = 0;
    }
    
    const finalPortfolioValue = cash;
    const strategyReturn = ((finalPortfolioValue - 10000) / 10000) * 100;
    const buyHoldReturn = ((finalPrice - initialPrice) / initialPrice) * 100;
    const winRate = completedTradesCount > 0 ? (winningTradesCount / completedTradesCount) * 100 : 0;
    
    let maxDrawdown = 0;
    let peak = 10000;
    portfolioHistory.forEach(val => {
        if (val > peak) {
            peak = val;
        }
        const dd = ((peak - val) / peak) * 100;
        if (dd > maxDrawdown) {
            maxDrawdown = dd;
        }
    });
    
    document.getElementById('btStrategyReturn').innerText = `${strategyReturn.toFixed(2)}%`;
    document.getElementById('btHoldReturn').innerText = `${buyHoldReturn.toFixed(2)}%`;
    document.getElementById('btWinRate').innerText = `${winRate.toFixed(1)}%`;
    document.getElementById('btMaxDrawdown').innerText = `${maxDrawdown.toFixed(2)}%`;
    
    const stratRetEl = document.getElementById('btStrategyReturn');
    stratRetEl.className = `stat-value font-mono ${strategyReturn >= 0 ? 'text-success' : 'text-danger'}`;
    
    const winRateIcon = document.getElementById('btWinRateIcon');
    winRateIcon.className = 'stat-icon-wrapper';
    if (winRate >= 50) {
        winRateIcon.classList.add('green');
        winRateIcon.innerHTML = `<i class="text-success" data-lucide="award"></i>`;
    } else {
        winRateIcon.classList.add('purple');
        winRateIcon.innerHTML = `<i class="text-warning" data-lucide="percent"></i>`;
    }
    
    const tbody = document.getElementById('backtestTradesTableBody');
    tbody.innerHTML = '';
    
    if (trades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No trades executed during backtest. Try another strategy or range.</td></tr>';
    } else {
        trades.forEach(t => {
            const isBuy = t.type.includes('BUY');
            const tr = document.createElement('tr');
            const pnlText = isBuy ? '—' : `${t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}%`;
            const pnlClass = isBuy ? '' : t.pnl >= 0 ? 'text-success font-mono' : 'text-danger font-mono';
            
            tr.innerHTML = `
                <td><span class="signal-badge ${isBuy ? 'bullish' : 'bearish'}">${t.type}</span></td>
                <td>${t.date}</td>
                <td class="font-mono">$${t.price.toFixed(2)}</td>
                <td class="font-mono">${t.shares.toFixed(3)}</td>
                <td class="font-mono">$${t.value.toFixed(2)}</td>
                <td class="${pnlClass}">${pnlText}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    document.getElementById('backtestStats').style.display = 'block';
    lucide.createIcons();
    
    plotTradeMarkersOnPriceChart(trades);
}

// Plot trade transaction execution markers on price chart
function plotTradeMarkersOnPriceChart(trades) {
    if (!priceChart || !currentStockData) return;
    
    const points = trades.map(t => {
        const isBuy = t.type.includes('BUY');
        return {
            x: new Date(t.date).getTime(),
            y: t.price,
            marker: {
                size: 7,
                fillColor: isBuy ? '#00ff66' : '#ff3e60',
                strokeColor: '#05050a',
                strokeWidth: 2,
                shape: isBuy ? 'triangle' : 'circle'
            },
            label: {
                borderColor: isBuy ? '#00ff66' : '#ff3e60',
                borderWidth: 1,
                style: {
                    color: '#fff',
                    background: isBuy ? 'rgba(0, 255, 102, 0.9)' : 'rgba(255, 62, 96, 0.9)',
                    fontSize: '9px',
                    fontFamily: 'Outfit, sans-serif'
                },
                text: isBuy ? 'BUY' : 'SELL'
            }
        };
    });
    
    priceChart.updateOptions({
        annotations: {
            points: points
        }
    });
}

// Handle Adding new transaction
async function handleAddTransaction(e) {
    e.preventDefault();
    const ticker = document.getElementById('txTicker').value.trim().toUpperCase();
    const type = document.getElementById('txType').value;
    const price = parseFloat(document.getElementById('txPrice').value);
    const shares = parseFloat(document.getElementById('txShares').value);
    const date = document.getElementById('txDate').value;
    
    if (!ticker || isNaN(price) || isNaN(shares) || !date) return;
    
    const tx = {
        id: Date.now().toString(),
        ticker,
        type,
        price,
        shares,
        date
    };
    
    if (authToken) {
        try {
            await apiFetch('/api/transactions/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: tx.date,
                    ticker: tx.ticker,
                    type: tx.type,
                    shares: parseFloat(tx.shares),
                    price: parseFloat(tx.price),
                    total: parseFloat(tx.shares * tx.price)
                })
            });
            await loadUserDataFromDatabase();
        } catch (err) {
            console.error("Failed to save transaction to database:", err);
        }
    } else {
        transactions.push(tx);
        localStorage.setItem('portfolio_transactions', JSON.stringify(transactions));
        syncWatchlistSharesFromTransactions();
        renderLedgerTable();
        renderPortfolioCostMarketPL();
        renderPortfolioDetailsAllocationChart();
    }
    
    document.getElementById('transactionForm').reset();
    document.getElementById('txDate').valueAsDate = new Date();
}

// Sync Watchlist shares count based on logged transactions
function syncWatchlistSharesFromTransactions() {
    const netShares = {};
    transactions.forEach(t => {
        if (!netShares[t.ticker]) netShares[t.ticker] = 0;
        if (t.type === 'BUY') {
            netShares[t.ticker] += t.shares;
        } else {
            netShares[t.ticker] -= t.shares;
        }
    });
    
    portfolio.forEach(item => {
        item.shares = netShares[item.ticker] || 0;
        if (item.shares < 0) item.shares = 0;
    });
    
    Object.keys(netShares).forEach(ticker => {
        if (!portfolio.some(item => item.ticker === ticker)) {
            portfolio.push({ ticker, shares: Math.max(0, netShares[ticker]) });
        }
    });
    
    savePortfolio();
    renderPortfolioList();
}

// Render Transaction History Logs table
function renderLedgerTable() {
    const tbody = document.getElementById('ledgerTableBody');
    tbody.innerHTML = '';
    
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No transaction records found</td></tr>';
        return;
    }
    
    sorted.forEach(t => {
        const totalVal = t.shares * t.price;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.date}</td>
            <td class="font-mono" style="color:var(--primary); font-weight:600;">${t.ticker}</td>
            <td><span class="signal-badge ${t.type === 'BUY' ? 'bullish' : 'bearish'}">${t.type}</span></td>
            <td class="font-mono">${t.shares.toFixed(3)}</td>
            <td class="font-mono">$${t.price.toFixed(2)}</td>
            <td class="font-mono">$${totalVal.toFixed(2)}</td>
            <td>
                <button class="remove-btn" onclick="deleteTransaction('${t.id}')">
                    <i data-lucide="trash-2" style="color:var(--danger); width:16px; height:16px;"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    lucide.createIcons();
}

// Delete logged transaction
async function deleteTransaction(id) {
    if (authToken) {
        try {
            await apiFetch('/api/transactions/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: parseInt(id) })
            });
            await loadUserDataFromDatabase();
        } catch (err) {
            console.error("Failed to delete transaction from database:", err);
        }
    } else {
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('portfolio_transactions', JSON.stringify(transactions));
        syncWatchlistSharesFromTransactions();
        renderLedgerTable();
        renderPortfolioCostMarketPL();
        renderPortfolioDetailsAllocationChart();
    }
}

// Clear all logged transactions
async function clearAllTransactions() {
    if (confirm("Are you sure you want to delete all logged transactions?")) {
        if (authToken) {
            try {
                await apiFetch('/api/transactions/clear', { method: 'POST' });
                await loadUserDataFromDatabase();
            } catch (err) {
                console.error("Failed to clear transactions from database:", err);
            }
        } else {
            transactions = [];
            localStorage.setItem('portfolio_transactions', JSON.stringify(transactions));
            syncWatchlistSharesFromTransactions();
            renderLedgerTable();
            renderPortfolioCostMarketPL();
            renderPortfolioDetailsAllocationChart();
        }
    }
}

// Render Portfolio statistics (Cost, Market Value, CAGR)
function renderPortfolioCostMarketPL() {
    let totalCostBasis = 0;
    let totalMarketValue = 0;
    let totalRealizedPnL = 0;
    
    const tickerStates = {};
    const chronologicalTxs = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let firstTxDate = null;
    if (chronologicalTxs.length > 0) {
        firstTxDate = new Date(chronologicalTxs[0].date);
    }
    
    chronologicalTxs.forEach(t => {
        if (!tickerStates[t.ticker]) {
            tickerStates[t.ticker] = { shares: 0, costBasis: 0, averageCost: 0, realizedPnL: 0 };
        }
        
        const state = tickerStates[t.ticker];
        if (t.type === 'BUY') {
            state.shares += t.shares;
            state.costBasis += t.shares * t.price;
            state.averageCost = state.shares > 0 ? state.costBasis / state.shares : 0;
        } else {
            const sellShares = Math.min(t.shares, state.shares);
            const profit = sellShares * (t.price - state.averageCost);
            state.realizedPnL += profit;
            state.shares -= sellShares;
            state.costBasis = state.shares * state.averageCost;
        }
    });
    
    Object.keys(tickerStates).forEach(ticker => {
        const state = tickerStates[ticker];
        let currentPrice = 0;
        if (currentStockData && ticker === currentStockData.ticker) {
            currentPrice = currentStockData.current_price;
        } else {
            currentPrice = parseFloat(localStorage.getItem(`price-${ticker}`)) || state.averageCost;
        }
        
        if (state.shares > 0) {
            totalCostBasis += state.costBasis;
            totalMarketValue += state.shares * currentPrice;
        }
        totalRealizedPnL += state.realizedPnL;
    });
    
    const totalPnL = (totalMarketValue - totalCostBasis) + totalRealizedPnL;
    const totalReturnPct = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;
    
    let cagrText = '0.00%';
    if (firstTxDate) {
        const years = (Date.now() - firstTxDate.getTime()) / (365.25 * 24 * 3600 * 1000);
        if (years > 0.05) {
            const ratio = (totalMarketValue + totalRealizedPnL) / (totalCostBasis || 1);
            if (ratio > 0) {
                const cagr = (Math.pow(ratio, 1 / years) - 1) * 100;
                cagrText = `${cagr.toFixed(2)}%`;
            }
        } else {
            cagrText = `${totalReturnPct.toFixed(2)}% (Real)`;
        }
    }
    
    document.getElementById('portCostValue').innerText = `$${totalCostBasis.toFixed(2)}`;
    document.getElementById('portMarketValue').innerText = `$${totalMarketValue.toFixed(2)}`;
    document.getElementById('portPlValue').innerText = `$${totalPnL.toFixed(2)} (${totalReturnPct.toFixed(2)}%)`;
    document.getElementById('portCagrValue').innerText = cagrText;
    
    const portPlValEl = document.getElementById('portPlValue');
    portPlValEl.className = `stat-value font-mono ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`;
    
    const iconWrapper = document.getElementById('portPlIcon');
    iconWrapper.className = 'stat-icon-wrapper';
    if (totalPnL >= 0) {
        iconWrapper.classList.add('green');
        iconWrapper.innerHTML = `<i class="text-success" data-lucide="trending-up"></i>`;
    } else {
        iconWrapper.classList.add('red');
        iconWrapper.innerHTML = `<i class="text-danger" data-lucide="trending-down"></i>`;
    }
    
    lucide.createIcons();
}

// Render portfolio view asset allocation donut chart
let detailsAllocationChart = null;
function renderPortfolioDetailsAllocationChart() {
    const activeHoldings = [];
    const tickerStates = {};
    const chronologicalTxs = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    chronologicalTxs.forEach(t => {
        if (!tickerStates[t.ticker]) {
            tickerStates[t.ticker] = { shares: 0, costBasis: 0, averageCost: 0 };
        }
        const state = tickerStates[t.ticker];
        if (t.type === 'BUY') {
            state.shares += t.shares;
            state.costBasis += t.shares * t.price;
            state.averageCost = state.costBasis / state.shares;
        } else {
            const sellShares = Math.min(t.shares, state.shares);
            state.shares -= sellShares;
            state.costBasis = state.shares * state.averageCost;
        }
    });
    
    Object.keys(tickerStates).forEach(ticker => {
        const state = tickerStates[ticker];
        if (state.shares > 0) {
            let currentPrice = 0;
            if (currentStockData && ticker === currentStockData.ticker) {
                currentPrice = currentStockData.current_price;
            } else {
                currentPrice = parseFloat(localStorage.getItem(`price-${ticker}`)) || state.averageCost;
            }
            activeHoldings.push({
                ticker,
                value: state.shares * currentPrice
            });
        }
    });
    
    if (activeHoldings.length === 0) {
        if (detailsAllocationChart) {
            detailsAllocationChart.destroy();
            detailsAllocationChart = null;
        }
        document.getElementById('portfolioDetailsAllocationChart').innerHTML = '<div style="text-align:center; padding: 40px; color:var(--text-secondary);">No active holdings to display allocation</div>';
        return;
    }
    
    const labels = activeHoldings.map(h => h.ticker);
    const series = activeHoldings.map(h => h.value);
    
    const options = {
        series: series,
        chart: {
            height: 240,
            type: 'donut',
            background: 'transparent'
        },
        labels: labels,
        stroke: { show: false },
        dataLabels: { enabled: true, style: { fontFamily: 'Outfit, sans-serif' } },
        legend: { show: true, position: 'bottom', labels: { colors: '#94a3b8' } },
        theme: { mode: 'dark' },
        colors: ['#00d9ff', '#00ff66', '#bf5af2', '#ffb700', '#ff3e60', '#ff9f43'],
        tooltip: {
            y: {
                formatter: (val) => `$${val.toFixed(2)}`
            }
        }
    };
    
    if (detailsAllocationChart) {
        detailsAllocationChart.destroy();
    }
    detailsAllocationChart = new ApexCharts(document.querySelector("#portfolioDetailsAllocationChart"), options);
    detailsAllocationChart.render();
}

// Handle Add Alert Submit
async function handleAddAlert(e) {
    e.preventDefault();
    const ticker = document.getElementById('alertTicker').value.trim().toUpperCase();
    const metric = document.getElementById('alertMetric').value;
    const condition = document.getElementById('alertCondition').value;
    const value = parseFloat(document.getElementById('alertValue').value);
    
    if (!ticker || isNaN(value)) return;
    
    const alertItem = {
        id: Date.now().toString(),
        ticker,
        metric,
        condition,
        value,
        active: true
    };
    
    if (authToken) {
        try {
            const res = await apiFetch('/api/alerts/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticker: alertItem.ticker,
                    metric: alertItem.metric,
                    condition: alertItem.condition,
                    value: alertItem.value,
                    muted: 0
                })
            });
            if (res.ok) {
                await loadUserDataFromDatabase();
            }
        } catch (err) {
            console.error("Failed to add alert to database:", err);
        }
    } else {
        alerts.push(alertItem);
        saveAlerts();
        renderAlertsList();
        updateAlertsCount();
        checkAllAlerts();
    }
    
    document.getElementById('alertForm').reset();
}

async function saveAlerts() {
    localStorage.setItem('stock_alerts', JSON.stringify(alerts));
    if (authToken) {
        try {
            await apiFetch('/api/alerts/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alerts: alerts.map(a => ({
                    ticker: a.ticker,
                    metric: a.metric,
                    condition: a.condition,
                    value: parseFloat(a.value) || 0,
                    muted: a.active ? 0 : 1
                })) })
            });
        } catch (err) {
            console.error("Failed to sync alerts to database:", err);
        }
    }
}

function saveTriggeredAlerts() {
    localStorage.setItem('triggered_alerts', JSON.stringify(triggeredAlerts));
}

function updateAlertsCount() {
    const active = alerts.filter(a => a.active).length;
    const badge = document.getElementById('activeAlertsCount');
    if (active > 0) {
        badge.innerText = active;
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

function updateAlertFormOptions() {
    const metric = document.getElementById('alertMetric').value;
    const valInput = document.getElementById('alertValue');
    if (metric === 'rsi') {
        valInput.min = 0;
        valInput.max = 100;
        valInput.value = 50;
        valInput.step = 1;
    } else {
        valInput.min = 0.01;
        valInput.max = '';
        valInput.value = '';
        valInput.step = 0.01;
    }
}

// Render active alerts enabled listing
function renderAlertsList() {
    const list = document.getElementById('activeAlertsList');
    list.innerHTML = '';
    
    if (alerts.length === 0) {
        list.innerHTML = '<div style="color:var(--text-secondary); text-align:center; padding: 20px;">No alerts enabled. Create one on the left.</div>';
        return;
    }
    
    alerts.forEach(a => {
        const div = document.createElement('div');
        div.className = `alert-item-card card ${a.active ? '' : 'disabled'}`;
        div.style.padding = '12px 18px';
        div.style.marginBottom = '12px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'space-between';
        
        div.innerHTML = `
            <div>
                <span class="font-mono" style="color:var(--primary); font-weight:700; font-size:16px;">${a.ticker}</span>
                <span style="margin: 0 8px; color:var(--text-secondary);">${a.metric.toUpperCase()} ${a.condition === 'above' ? '▲' : '▼'} ${a.value}</span>
                <span class="badge ${a.active ? 'bullish' : 'neutral'}" style="font-size:10px;">${a.active ? 'ACTIVE' : 'MUTED'}</span>
            </div>
            <div style="display:flex; gap: 8px;">
                <button class="remove-btn" onclick="toggleAlertMute('${a.id}')" style="background:rgba(255,255,255,0.05); color:#fff; border-radius:6px; padding:4px 8px; font-size:11px;">
                    ${a.active ? 'Mute' : 'Unmute'}
                </button>
                <button class="remove-btn" onclick="deleteAlert('${a.id}')" style="color:var(--danger);">
                    <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
                </button>
            </div>
        `;
        list.appendChild(div);
    });
    
    lucide.createIcons();
}

async function toggleAlertMute(id) {
    if (authToken) {
        try {
            await apiFetch('/api/alerts/toggle-mute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: parseInt(id) })
            });
            await loadUserDataFromDatabase();
        } catch (err) {
            console.error("Failed to toggle alert mute in database:", err);
        }
    } else {
        const alertItem = alerts.find(a => a.id === id);
        if (alertItem) {
            alertItem.active = !alertItem.active;
            saveAlerts();
            renderAlertsList();
            updateAlertsCount();
        }
    }
}

async function deleteAlert(id) {
    if (authToken) {
        try {
            await apiFetch('/api/alerts/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: parseInt(id) })
            });
            await loadUserDataFromDatabase();
        } catch (err) {
            console.error("Failed to delete alert from database:", err);
        }
    } else {
        alerts = alerts.filter(a => a.id !== id);
        saveAlerts();
        renderAlertsList();
        updateAlertsCount();
    }
}

// Compare target alert parameters and dispatch warning banners
function checkAlertsForTicker(ticker, price, rsi) {
    let triggeredCount = 0;
    
    alerts.forEach(a => {
        if (a.ticker === ticker && a.active) {
            let triggered = false;
            let currentVal = 0;
            
            if (a.metric === 'price') {
                currentVal = price;
                if (a.condition === 'above' && price >= a.value) triggered = true;
                if (a.condition === 'below' && price <= a.value) triggered = true;
            } else if (a.metric === 'rsi') {
                currentVal = rsi;
                if (rsi) {
                    if (a.condition === 'above' && rsi >= a.value) triggered = true;
                    if (a.condition === 'below' && rsi <= a.value) triggered = true;
                }
            }
            
            if (triggered) {
                a.active = false;
                triggeredCount++;
                
                const logItem = {
                    timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString(),
                    ticker: a.ticker,
                    condition: `${a.metric.toUpperCase()} ${a.condition === 'above' ? 'crossed above' : 'crossed below'} ${a.value}`,
                    triggeredValue: currentVal.toFixed(2),
                    details: `Threshold of ${a.value} reached.`
                };
                
                if (authToken) {
                    apiFetch('/api/alerts/save-triggered', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            timestamp: logItem.timestamp,
                            ticker: logItem.ticker,
                            condition: logItem.condition,
                            triggeredValue: parseFloat(logItem.triggeredValue),
                            details: logItem.details
                        })
                    }).then(() => {
                        apiFetch('/api/alerts/toggle-mute', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: parseInt(a.id) })
                        }).then(() => loadUserDataFromDatabase());
                    });
                } else {
                    triggeredAlerts.push(logItem);
                    saveTriggeredAlerts();
                    renderTriggeredAlertsLog();
                }
                
                showNotificationBanner(logItem);
            }
        }
    });
    
    if (triggeredCount > 0 && !authToken) {
        saveAlerts();
        saveTriggeredAlerts();
        updateAlertsCount();
        renderAlertsList();
        renderTriggeredAlertsLog();
    }
}

function showNotificationBanner(logItem) {
    const banner = document.createElement('div');
    banner.style.position = 'fixed';
    banner.style.bottom = '24px';
    banner.style.right = '24px';
    banner.style.background = 'rgba(10, 10, 25, 0.9)';
    banner.style.border = '2px solid var(--primary)';
    banner.style.borderRadius = '12px';
    banner.style.padding = '16px 20px';
    banner.style.color = '#fff';
    banner.style.zIndex = '9999';
    banner.style.boxShadow = '0 0 15px var(--primary-glow)';
    banner.style.display = 'flex';
    banner.style.flexDirection = 'column';
    banner.style.gap = '6px';
    banner.style.backdropFilter = 'blur(10px)';
    
    banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap: 40px;">
            <span style="font-weight:700; color:var(--primary); font-size:16px;">🔔 Alert Triggered!</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; font-weight:bold; font-size:16px;">&times;</button>
        </div>
        <div style="font-size: 14px; margin-top: 4px;">
            <strong>${logItem.ticker}</strong>: ${logItem.condition}
        </div>
        <div style="font-size:12px; color:var(--text-secondary);">
            Triggered at value: ${logItem.triggeredValue}
        </div>
    `;
    
    document.body.appendChild(banner);
    setTimeout(() => { if (banner) banner.remove(); }, 7000);
    
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(`ApexTrade AI: ${logItem.ticker} Alert`, {
            body: `${logItem.condition} at ${logItem.triggeredValue}`
        });
    }
}

function renderTriggeredAlertsLog() {
    const tbody = document.getElementById('triggeredAlertsTableBody');
    tbody.innerHTML = '';
    
    const sorted = [...triggeredAlerts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No alerts triggered yet</td></tr>';
        return;
    }
    
    sorted.forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${log.timestamp}</td>
            <td class="font-mono" style="color:var(--primary); font-weight:600;">${log.ticker}</td>
            <td><span class="signal-badge neutral">${log.condition}</span></td>
            <td class="font-mono">${log.triggeredValue}</td>
            <td>${log.details}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function clearTriggeredAlertsLog() {
    if (confirm("Are you sure you want to clear the triggered alerts log?")) {
        if (authToken) {
            try {
                await apiFetch('/api/alerts/clear-triggered', { method: 'POST' });
                await loadUserDataFromDatabase();
            } catch (err) {
                console.error("Failed to clear alert logs from database:", err);
            }
        } else {
            triggeredAlerts = [];
            saveTriggeredAlerts();
            renderTriggeredAlertsLog();
        }
    }
}

// Trigger checks for all active alerts
function checkAllAlerts() {
    if (currentStockData) {
        checkAlertsForTicker(
            currentStockData.ticker,
            currentStockData.current_price,
            currentStockData.prediction.signals.rsi
        );
    }
}

// Background checking for watched symbols
async function backgroundAlertCheck() {
    const activeAlertTickers = [...new Set(alerts.filter(a => a.active).map(a => a.ticker))];
    if (activeAlertTickers.length === 0) return;
    
    for (const t of activeAlertTickers) {
        try {
            const res = await fetch(`/api/analyze?ticker=${encodeURIComponent(t)}&timeframe=short`);
            if (res.ok) {
                const data = await res.json();
                const currentPrice = data.current_price;
                const currentRsi = data.prediction.signals.rsi;
                checkAlertsForTicker(t, currentPrice, currentRsi);
            }
        } catch (e) {
            console.error("Alert background check error for ticker " + t, e);
        }
    }
}

// Toggle App Light/Dark Theme
function toggleAppTheme() {
    const body = document.body;
    body.classList.toggle('light-theme');
    
    const themeIcon = document.getElementById('themeIcon');
    const isLight = body.classList.contains('light-theme');
    
    if (themeIcon) {
        themeIcon.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
        lucide.createIcons();
    }
    
    // Save preference
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    
    // Dynamically update theme for all active charts
    updateAllChartsTheme();
}

// Update options for all active ApexCharts instances
function updateAllChartsTheme() {
    const isLight = document.body.classList.contains('light-theme');
    const mode = isLight ? 'light' : 'dark';
    
    const chartInstances = [
        { instance: priceChart, selector: '#priceForecastChart' },
        { instance: rsiChart, selector: '#rsiSubplotChart' },
        { instance: macdChart, selector: '#macdSubplotChart' },
        { instance: confidenceGauge, selector: '#confidenceGauge' },
        { instance: allocationChart, selector: '#allocationChart' },
        { instance: detailsAllocationChart, selector: '#portfolioDetailsAllocationChart' }
    ];
    
    chartInstances.forEach(item => {
        if (item.instance) {
            try {
                item.instance.updateOptions({
                    theme: { mode: mode }
                });
            } catch (err) {
                console.error("Failed to update chart theme for " + item.selector, err);
            }
        }
    });
}

// Switch between Segmented Slide Panels in the Dashboard Grid
function switchDashboardSlide(slideId) {
    // Hide all slides
    document.getElementById('slideCharts').style.display = 'none';
    document.getElementById('slideAI').style.display = 'none';
    document.getElementById('slideStats').style.display = 'none';
    
    // Show selected slide
    const slidePanel = document.getElementById(`slide${slideId.charAt(0).toUpperCase() + slideId.slice(1)}`);
    if (slidePanel) {
        slidePanel.style.display = 'block';
    }
    
    // Reset active button class in subnav
    document.getElementById('btnSlideCharts').classList.remove('active');
    document.getElementById('btnSlideAI').classList.remove('active');
    document.getElementById('btnSlideStats').classList.remove('active');
    
    // Set active button
    const subnavBtn = document.getElementById(`btnSlide${slideId.charAt(0).toUpperCase() + slideId.slice(1)}`);
    if (subnavBtn) {
        subnavBtn.classList.add('active');
    }
    
    // Redraw confidence gauge if active slide is AI
    if (slideId === 'ai' && currentStockData) {
        updatePrediction(currentStockData, currentTimeframe);
    }
    
    // Trigger window resize to ensure ApexCharts updates width constraints inside flex/grid slides
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 50);
}

// ==========================================
// Market Explorer Logic
// ==========================================

function renderExplorerGrid() {
    const grid = document.getElementById('explorerGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const filtered = explorerAssets.filter(asset => {
        const matchesCategory = explorerActiveCategory === 'all' || asset.category === explorerActiveCategory;
        const matchesSearch = asset.ticker.toLowerCase().includes(explorerSearchQuery.toLowerCase()) || 
                              asset.name.toLowerCase().includes(explorerSearchQuery.toLowerCase()) || 
                              asset.desc.toLowerCase().includes(explorerSearchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="no-results card" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
                <i data-lucide="info" style="width: 48px; height: 48px; margin-bottom: 12px; color: var(--primary);"></i>
                <p style="font-size: 15px; font-weight: 500;">No assets found matching your criteria.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    filtered.forEach(asset => {
        const card = document.createElement('div');
        card.className = 'explorer-asset-card card';
        
        // Highlight if this is the active analyzed asset
        const isCurrent = currentStockData && currentStockData.ticker === asset.ticker;
        if (isCurrent) {
            card.classList.add('current-active-asset');
        }
        
        card.innerHTML = `
            <div class="explorer-card-header">
                <span class="explorer-asset-icon">${asset.icon}</span>
                <span class="explorer-asset-badge font-mono">${asset.ticker}</span>
            </div>
            <div class="explorer-card-body">
                <h3>${asset.name}</h3>
                <p>${asset.desc}</p>
            </div>
            <div class="explorer-card-footer">
                <button class="primary-btn sm" onclick="loadTickerFromExplorer('${asset.ticker}')">
                    <span>Analyze & Predict</span>
                    <i data-lucide="arrow-right"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
    
    lucide.createIcons();
}

function filterExplorerCategory(cat) {
    explorerActiveCategory = cat;
    
    const buttons = document.querySelectorAll('.explorer-cat-btn');
    buttons.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick') || '';
        const matches = onclickAttr.includes(`'${cat}'`);
        btn.classList.toggle('active', matches);
    });
    
    renderExplorerGrid();
}

function loadTickerFromExplorer(ticker) {
    document.getElementById('tickerInput').value = ticker;
    document.getElementById('centerTickerInput').value = ticker;
    
    switchView('dashboard');
    analyzeTicker(ticker, document.getElementById('daysRange').value, currentTimeframe);
}

async function handleCenterSearch(e) {
    e.preventDefault();
    const ticker = document.getElementById('centerTickerInput').value.trim().toUpperCase();
    const days = document.getElementById('daysRange').value;
    if (!ticker) return;
    
    document.getElementById('tickerInput').value = ticker;
    await analyzeTicker(ticker, days, currentTimeframe);
}

// ==========================================
// Authentication & User Cloud Sync Methods
// ==========================================

function openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'flex';
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('authForm').reset();
    }
}

function switchAuthTab(tab) {
    authMode = tab;
    
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');
    const authModalTitle = document.getElementById('authModalTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    
    if (tab === 'login') {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        authModalTitle.innerHTML = '<i data-lucide="user"></i> Sign In to ApexTrade';
        authSubmitBtn.querySelector('span').innerText = 'Sign In';
        authSubmitBtn.querySelector('i').setAttribute('data-lucide', 'log-in');
    } else {
        tabLoginBtn.classList.remove('active');
        tabRegisterBtn.classList.add('active');
        authModalTitle.innerHTML = '<i data-lucide="user-plus"></i> Create Account';
        authSubmitBtn.querySelector('span').innerText = 'Register';
        authSubmitBtn.querySelector('i').setAttribute('data-lucide', 'user-plus');
    }
    lucide.createIcons();
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('authUsernameInput').value.trim();
    const password = document.getElementById('authPasswordInput').value;
    
    if (!username || !password) return;
    
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const submitBtn = document.getElementById('authSubmitBtn');
    
    submitBtn.disabled = true;
    submitBtn.querySelector('span').innerText = authMode === 'login' ? 'Signing In...' : 'Registering...';
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Authentication failed');
        }
        
        const data = await response.json();
        authToken = data.token;
        currentUsername = data.username;
        
        sessionStorage.setItem('auth_token', authToken);
        sessionStorage.setItem('auth_user', currentUsername);
        
        // Save OpenAI key if returned
        if (data.openai_key) {
            localStorage.setItem('openai_api_key', data.openai_key);
            updateOpenAiBadge();
        }
        
        // Sync local guest data to server
        await syncLocalDataToDatabase();
        
        // Load cloud database watchlist & ledger
        await loadUserDataFromDatabase();
        
        updateProfileUI();
        closeAuthModal();
        
    } catch (err) {
        alert(err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').innerText = authMode === 'login' ? 'Sign In' : 'Register';
        lucide.createIcons();
    }
}

function handleLogout() {
    if (confirm("Are you sure you want to log out?")) {
        authToken = null;
        currentUsername = null;
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
        
        // Reload offline guest data from local storage
        portfolio = JSON.parse(localStorage.getItem('stock_portfolio')) || [];
        transactions = JSON.parse(localStorage.getItem('portfolio_transactions')) || [];
        alerts = JSON.parse(localStorage.getItem('stock_alerts')) || [];
        triggeredAlerts = JSON.parse(localStorage.getItem('triggered_alerts')) || [];
        
        updateProfileUI();
        renderPortfolioList();
        updatePortfolioValue();
        syncWatchlistSharesFromTransactions();
        renderLedgerTable();
        renderPortfolioCostMarketPL();
        renderPortfolioDetailsAllocationChart();
        renderAlertsList();
        renderTriggeredAlertsLog();
        updateAlertsCount();
        
        // Refresh OpenAi status
        updateOpenAiBadge();
    }
}

async function loadUserDataFromDatabase() {
    if (!authToken) return;
    try {
        const resWatchlist = await apiFetch('/api/watchlist');
        if (resWatchlist.ok) {
            portfolio = await resWatchlist.json();
            renderPortfolioList();
            updatePortfolioValue();
        }
        
        const resTxs = await apiFetch('/api/transactions');
        if (resTxs.ok) {
            transactions = await resTxs.json();
            syncWatchlistSharesFromTransactions();
            renderLedgerTable();
            renderPortfolioCostMarketPL();
            renderPortfolioDetailsAllocationChart();
        }
        
        const resAlerts = await apiFetch('/api/alerts');
        if (resAlerts.ok) {
            const data = await resAlerts.json();
            alerts = data.alerts.map(a => ({
                id: a.id.toString(),
                ticker: a.ticker,
                metric: a.metric,
                condition: a.condition,
                value: a.value,
                active: !a.muted
            }));
            triggeredAlerts = data.logs.map(l => ({
                id: l.id.toString(),
                timestamp: l.timestamp,
                ticker: l.ticker,
                condition: l.condition,
                triggeredValue: l.triggeredValue,
                details: l.details
            }));
            
            renderAlertsList();
            renderTriggeredAlertsLog();
            updateAlertsCount();
        }
        
        const resProfile = await apiFetch('/api/auth/profile');
        if (resProfile.ok) {
            const data = await resProfile.json();
            if (data.openai_key) {
                localStorage.setItem('openai_api_key', data.openai_key);
                updateOpenAiBadge();
            }
        }
    } catch (err) {
        console.error("Failed to load user data from database:", err);
    }
}

async function syncLocalDataToDatabase() {
    if (!authToken) return;
    try {
        if (portfolio.length > 0) {
            await apiFetch('/api/watchlist/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: portfolio.map(item => ({ ticker: item.ticker, shares: item.shares })) })
            });
        }
        
        if (transactions.length > 0) {
            await apiFetch('/api/transactions/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactions: transactions.map(t => ({
                    date: t.date,
                    ticker: t.ticker,
                    type: t.type,
                    shares: parseFloat(t.shares) || 0,
                    price: parseFloat(t.price) || 0,
                    total: parseFloat(t.shares * t.price) || 0
                })) })
            });
        }
        
        if (alerts.length > 0) {
            await apiFetch('/api/alerts/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alerts: alerts.map(a => ({
                    ticker: a.ticker,
                    metric: a.metric,
                    condition: a.condition,
                    value: parseFloat(a.value) || 0,
                    muted: a.active ? 0 : 1
                })) })
            });
        }
    } catch (err) {
        console.error("Local data synchronization error:", err);
    }
}

// Bind methods to window for global inline onclick event handling
window.switchAuthTab = switchAuthTab;
window.handleLogout = handleLogout;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
