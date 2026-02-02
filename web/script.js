// Log Parser - JavaScript Implementation
// Mirrors the Rust parser logic for browser use

// Bot patterns (same as Rust version)
const BOT_PATTERNS = [
    // Search Engines - Google
    { pattern: /Googlebot/i, name: 'Googlebot', category: 'Search Engine', isGoogle: true },
    { pattern: /Googlebot-Image/i, name: 'Googlebot-Image', category: 'Search Engine', isGoogle: true },
    { pattern: /Googlebot-Video/i, name: 'Googlebot-Video', category: 'Search Engine', isGoogle: true },
    { pattern: /Googlebot-News/i, name: 'Googlebot-News', category: 'Search Engine', isGoogle: true },
    { pattern: /Storebot-Google/i, name: 'Storebot-Google', category: 'Search Engine', isGoogle: true },
    { pattern: /Google-InspectionTool/i, name: 'Google-InspectionTool', category: 'Search Engine', isGoogle: true },
    { pattern: /GoogleOther/i, name: 'GoogleOther', category: 'Search Engine', isGoogle: true },
    { pattern: /AdsBot-Google/i, name: 'AdsBot-Google', category: 'Advertising', isGoogle: true },
    { pattern: /Mediapartners-Google/i, name: 'Mediapartners-Google', category: 'Advertising', isGoogle: true },
    { pattern: /Google-Extended/i, name: 'Google-Extended', category: 'LLM Bot', isGoogle: true },

    // Other Search Engines
    { pattern: /bingbot/i, name: 'Bingbot', category: 'Search Engine' },
    { pattern: /Slurp/i, name: 'Yahoo Slurp', category: 'Search Engine' },
    { pattern: /DuckDuckBot/i, name: 'DuckDuckBot', category: 'Search Engine' },
    { pattern: /Baiduspider/i, name: 'Baiduspider', category: 'Search Engine' },
    { pattern: /YandexBot/i, name: 'YandexBot', category: 'Search Engine' },

    // LLM/AI Bots
    { pattern: /GPTBot/i, name: 'GPTBot', category: 'LLM Bot', isAI: true },
    { pattern: /ChatGPT-User/i, name: 'ChatGPT-User', category: 'LLM Bot', isAI: true },
    { pattern: /OAI-SearchBot/i, name: 'OAI-SearchBot', category: 'LLM Bot', isAI: true },
    { pattern: /Claude-Web/i, name: 'Claude-Web', category: 'LLM Bot', isAI: true },
    { pattern: /ClaudeBot/i, name: 'ClaudeBot', category: 'LLM Bot', isAI: true },
    { pattern: /anthropic-ai/i, name: 'Anthropic', category: 'LLM Bot', isAI: true },
    { pattern: /Applebot-Extended/i, name: 'Applebot-Extended', category: 'LLM Bot', isAI: true },
    { pattern: /Bytespider/i, name: 'Bytespider', category: 'LLM Bot', isAI: true },
    { pattern: /CCBot/i, name: 'CCBot', category: 'LLM Bot', isAI: true },
    { pattern: /cohere-ai/i, name: 'Cohere', category: 'LLM Bot', isAI: true },
    { pattern: /Diffbot/i, name: 'Diffbot', category: 'LLM Bot', isAI: true },
    { pattern: /FacebookBot/i, name: 'FacebookBot', category: 'LLM Bot', isAI: true },
    { pattern: /omgili/i, name: 'Omgili', category: 'LLM Bot', isAI: true },
    { pattern: /PerplexityBot/i, name: 'PerplexityBot', category: 'LLM Bot', isAI: true },

    // SEO Tools
    { pattern: /AhrefsBot/i, name: 'AhrefsBot', category: 'SEO Tool' },
    { pattern: /SemrushBot/i, name: 'SemrushBot', category: 'SEO Tool' },
    { pattern: /MJ12bot/i, name: 'MJ12bot', category: 'SEO Tool' },
    { pattern: /DotBot/i, name: 'DotBot', category: 'SEO Tool' },
    { pattern: /Screaming Frog/i, name: 'Screaming Frog', category: 'SEO Tool' },
    { pattern: /rogerbot/i, name: 'Rogerbot', category: 'SEO Tool' },

    // Social Media
    { pattern: /facebookexternalhit/i, name: 'Facebook', category: 'Social Media' },
    { pattern: /Twitterbot/i, name: 'Twitterbot', category: 'Social Media' },
    { pattern: /LinkedInBot/i, name: 'LinkedInBot', category: 'Social Media' },
    { pattern: /Pinterest/i, name: 'Pinterest', category: 'Social Media' },
    { pattern: /Slackbot/i, name: 'Slackbot', category: 'Social Media' },
    { pattern: /TelegramBot/i, name: 'TelegramBot', category: 'Social Media' },
    { pattern: /WhatsApp/i, name: 'WhatsApp', category: 'Social Media' },

    // Monitoring
    { pattern: /UptimeRobot/i, name: 'UptimeRobot', category: 'Monitoring' },
    { pattern: /Pingdom/i, name: 'Pingdom', category: 'Monitoring' },
    { pattern: /StatusCake/i, name: 'StatusCake', category: 'Monitoring' },

    // Generic
    { pattern: /bot/i, name: 'Unknown Bot', category: 'Other' },
    { pattern: /crawler/i, name: 'Unknown Crawler', category: 'Other' },
    { pattern: /spider/i, name: 'Unknown Spider', category: 'Other' },
];

// Log line regex - supports optional extra ID field at the end
// IP field can have spaces after commas: "66.249.72.164, 172.71.1.151"
const LOG_REGEX = /^\[([^\]]*)\]:::\[([^\]]*)\]:::([0-9a-fA-F:., ]+)\s+-\s+-\s+\[([^\]]+)\]\s+"(\w+)\s+([^\s]+)\s+[^"]*"\s+(\d+)\s+(\d+)\s+"([^"]*)"\s+"([^"]*)"(?:\s+"[^"]*")?/;

function parseLogLine(line) {
    const match = line.match(LOG_REGEX);
    if (!match) return null;

    const [, server, domain, ips, datetime, method, url, status, bytes, referer, userAgent] = match;

    return {
        server,
        domain,
        ips: ips.split(',').map(ip => ip.trim()),
        datetime,
        method,
        url,
        statusCode: parseInt(status, 10),
        bytesSent: parseInt(bytes, 10) || 0,
        referer,
        userAgent,
        isBot: false,
        botName: '',
        botCategory: '',
        isGoogle: false,
        isAI: false,
    };
}

function detectBot(entry) {
    for (const bot of BOT_PATTERNS) {
        if (bot.pattern.test(entry.userAgent)) {
            entry.isBot = true;
            entry.botName = bot.name;
            entry.botCategory = bot.category;
            entry.isGoogle = bot.isGoogle || false;
            entry.isAI = bot.isAI || false;
            return;
        }
    }
}

function parseLogs(content, collectEntries = false) {
    const stats = {
        totalRequests: 0,
        totalBytes: 0,
        uniqueUrls: new Set(),
        uniqueIps: new Set(),
        botRequests: 0,
        humanRequests: 0,
        verifiedGooglebotRequests: 0,
        statusDistribution: {},
        hitsByUrl: {},
        hitsByBot: {},
        hitsByCategory: {},
        hitsByHour: {},
        hitsByDate: {},
        hitsByMethod: {},
        hitsByDomain: {},
        hitsByServer: {},
        // New: Detailed bot-URL tracking
        googleBotUrls: {},  // { url: { hits, totalBytes, statusCodes: {}, firstSeen, lastSeen, bots: Set } }
        aiBotUrls: {},      // Same structure
        urlStatusCodes: {}, // { url: { hits, statusCodes: {}, bots: Set, isBot } }
        // Parsing stats
        totalLines: 0,
        parsedLines: 0,
        failedLines: 0,
        failedExamples: [],  // Store first few failed lines for debugging
    };

    const entries = [];
    const lines = content.split('\n');

    for (const line of lines) {
        if (!line.trim()) continue;

        stats.totalLines++;
        const entry = parseLogLine(line);
        if (!entry) {
            stats.failedLines++;
            // Store first 5 failed lines for debugging
            if (stats.failedExamples.length < 5) {
                stats.failedExamples.push(line.substring(0, 200));
            }
            continue;
        }
        stats.parsedLines++;

        detectBot(entry);

        if (collectEntries) {
            entries.push(entry);
        }

        stats.totalRequests++;
        stats.totalBytes += entry.bytesSent;
        stats.uniqueUrls.add(entry.url);
        entry.ips.forEach(ip => stats.uniqueIps.add(ip));

        if (entry.isBot) {
            stats.botRequests++;
        } else {
            stats.humanRequests++;
        }

        // Status codes
        stats.statusDistribution[entry.statusCode] = (stats.statusDistribution[entry.statusCode] || 0) + 1;

        // Parse date for tracking
        let dateStr = '';
        const dateMatch = entry.datetime.match(/(\d{2})\/(\w{3})\/(\d{4}):(\d{2})/);
        if (dateMatch) {
            const [, day, month, year, hour] = dateMatch;
            const monthNum = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
                              Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' }[month] || '01';
            dateStr = `${year}-${monthNum}-${day}`;
            const hourKey = `${dateStr} ${hour}:00`;
            stats.hitsByDate[dateStr] = (stats.hitsByDate[dateStr] || 0) + 1;
            stats.hitsByHour[hourKey] = (stats.hitsByHour[hourKey] || 0) + 1;
        }

        // URL stats (enhanced)
        if (!stats.hitsByUrl[entry.url]) {
            stats.hitsByUrl[entry.url] = {
                hits: 0,
                botHits: 0,
                humanHits: 0,
                bytesTotal: 0,
                statusCodes: {},
                firstSeen: dateStr,
                lastSeen: dateStr,
            };
        }
        const urlStats = stats.hitsByUrl[entry.url];
        urlStats.hits++;
        urlStats.bytesTotal += entry.bytesSent;
        urlStats.statusCodes[entry.statusCode] = (urlStats.statusCodes[entry.statusCode] || 0) + 1;
        if (dateStr && dateStr > urlStats.lastSeen) urlStats.lastSeen = dateStr;
        if (dateStr && dateStr < urlStats.firstSeen) urlStats.firstSeen = dateStr;

        if (entry.isBot) {
            urlStats.botHits++;
        } else {
            urlStats.humanHits++;
        }

        // URL status codes tracking
        if (!stats.urlStatusCodes[entry.url]) {
            stats.urlStatusCodes[entry.url] = {
                hits: 0,
                statusCodes: {},
                bots: new Set(),
                botHits: 0,
                humanHits: 0,
            };
        }
        stats.urlStatusCodes[entry.url].hits++;
        stats.urlStatusCodes[entry.url].statusCodes[entry.statusCode] =
            (stats.urlStatusCodes[entry.url].statusCodes[entry.statusCode] || 0) + 1;
        if (entry.isBot) {
            stats.urlStatusCodes[entry.url].bots.add(entry.botName);
            stats.urlStatusCodes[entry.url].botHits++;
        } else {
            stats.urlStatusCodes[entry.url].humanHits++;
        }

        // Bot stats
        if (entry.isBot && entry.botName) {
            if (!stats.hitsByBot[entry.botName]) {
                stats.hitsByBot[entry.botName] = {
                    hits: 0,
                    category: entry.botCategory,
                    uniqueUrls: new Set(),
                    totalBytes: 0,
                    isGoogle: entry.isGoogle,
                    isAI: entry.isAI,
                };
            }
            stats.hitsByBot[entry.botName].hits++;
            stats.hitsByBot[entry.botName].uniqueUrls.add(entry.url);
            stats.hitsByBot[entry.botName].totalBytes += entry.bytesSent;

            // Category stats
            stats.hitsByCategory[entry.botCategory] = (stats.hitsByCategory[entry.botCategory] || 0) + 1;

            // Google bot URL tracking
            if (entry.isGoogle) {
                if (!stats.googleBotUrls[entry.url]) {
                    stats.googleBotUrls[entry.url] = {
                        hits: 0,
                        totalBytes: 0,
                        statusCodes: {},
                        firstSeen: dateStr,
                        lastSeen: dateStr,
                        bots: new Set(),
                    };
                }
                const gUrl = stats.googleBotUrls[entry.url];
                gUrl.hits++;
                gUrl.totalBytes += entry.bytesSent;
                gUrl.statusCodes[entry.statusCode] = (gUrl.statusCodes[entry.statusCode] || 0) + 1;
                gUrl.bots.add(entry.botName);
                if (dateStr && dateStr > gUrl.lastSeen) gUrl.lastSeen = dateStr;
                if (dateStr && dateStr < gUrl.firstSeen) gUrl.firstSeen = dateStr;
            }

            // AI bot URL tracking
            if (entry.isAI) {
                if (!stats.aiBotUrls[entry.url]) {
                    stats.aiBotUrls[entry.url] = {
                        hits: 0,
                        totalBytes: 0,
                        statusCodes: {},
                        firstSeen: dateStr,
                        lastSeen: dateStr,
                        bots: new Set(),
                    };
                }
                const aiUrl = stats.aiBotUrls[entry.url];
                aiUrl.hits++;
                aiUrl.totalBytes += entry.bytesSent;
                aiUrl.statusCodes[entry.statusCode] = (aiUrl.statusCodes[entry.statusCode] || 0) + 1;
                aiUrl.bots.add(entry.botName);
                if (dateStr && dateStr > aiUrl.lastSeen) aiUrl.lastSeen = dateStr;
                if (dateStr && dateStr < aiUrl.firstSeen) aiUrl.firstSeen = dateStr;
            }
        }

        // Method stats
        stats.hitsByMethod[entry.method] = (stats.hitsByMethod[entry.method] || 0) + 1;

        // Domain stats
        stats.hitsByDomain[entry.domain] = (stats.hitsByDomain[entry.domain] || 0) + 1;

        // Server stats
        stats.hitsByServer[entry.server] = (stats.hitsByServer[entry.server] || 0) + 1;
    }

    if (collectEntries) {
        return { stats, entries };
    }
    return stats;
}

function mergeStats(stats1, stats2) {
    const merged = {
        totalRequests: stats1.totalRequests + stats2.totalRequests,
        totalBytes: stats1.totalBytes + stats2.totalBytes,
        uniqueUrls: new Set([...stats1.uniqueUrls, ...stats2.uniqueUrls]),
        uniqueIps: new Set([...stats1.uniqueIps, ...stats2.uniqueIps]),
        botRequests: stats1.botRequests + stats2.botRequests,
        humanRequests: stats1.humanRequests + stats2.humanRequests,
        verifiedGooglebotRequests: stats1.verifiedGooglebotRequests + stats2.verifiedGooglebotRequests,
        statusDistribution: { ...stats1.statusDistribution },
        hitsByUrl: {},
        hitsByBot: {},
        hitsByCategory: { ...stats1.hitsByCategory },
        hitsByHour: { ...stats1.hitsByHour },
        hitsByDate: { ...stats1.hitsByDate },
        hitsByMethod: { ...stats1.hitsByMethod },
        hitsByDomain: { ...stats1.hitsByDomain },
        hitsByServer: { ...stats1.hitsByServer },
        googleBotUrls: {},
        aiBotUrls: {},
        urlStatusCodes: {},
        // Parsing stats
        totalLines: (stats1.totalLines || 0) + (stats2.totalLines || 0),
        parsedLines: (stats1.parsedLines || 0) + (stats2.parsedLines || 0),
        failedLines: (stats1.failedLines || 0) + (stats2.failedLines || 0),
        failedExamples: [...(stats1.failedExamples || []), ...(stats2.failedExamples || [])].slice(0, 5),
    };

    // Merge status distribution
    for (const [code, count] of Object.entries(stats2.statusDistribution)) {
        merged.statusDistribution[code] = (merged.statusDistribution[code] || 0) + count;
    }

    // Merge URL stats
    for (const stats of [stats1, stats2]) {
        for (const [url, urlStats] of Object.entries(stats.hitsByUrl)) {
            if (!merged.hitsByUrl[url]) {
                merged.hitsByUrl[url] = {
                    hits: 0, botHits: 0, humanHits: 0, bytesTotal: 0,
                    statusCodes: {}, firstSeen: urlStats.firstSeen, lastSeen: urlStats.lastSeen
                };
            }
            merged.hitsByUrl[url].hits += urlStats.hits;
            merged.hitsByUrl[url].botHits += urlStats.botHits;
            merged.hitsByUrl[url].humanHits += urlStats.humanHits;
            merged.hitsByUrl[url].bytesTotal += urlStats.bytesTotal;
            for (const [code, count] of Object.entries(urlStats.statusCodes || {})) {
                merged.hitsByUrl[url].statusCodes[code] = (merged.hitsByUrl[url].statusCodes[code] || 0) + count;
            }
            if (urlStats.lastSeen > merged.hitsByUrl[url].lastSeen) merged.hitsByUrl[url].lastSeen = urlStats.lastSeen;
            if (urlStats.firstSeen < merged.hitsByUrl[url].firstSeen) merged.hitsByUrl[url].firstSeen = urlStats.firstSeen;
        }
    }

    // Merge bot stats
    for (const stats of [stats1, stats2]) {
        for (const [bot, botStats] of Object.entries(stats.hitsByBot)) {
            if (!merged.hitsByBot[bot]) {
                merged.hitsByBot[bot] = {
                    hits: 0, category: botStats.category, uniqueUrls: new Set(),
                    totalBytes: 0, isGoogle: botStats.isGoogle, isAI: botStats.isAI
                };
            }
            merged.hitsByBot[bot].hits += botStats.hits;
            merged.hitsByBot[bot].totalBytes += botStats.totalBytes;
            botStats.uniqueUrls.forEach(url => merged.hitsByBot[bot].uniqueUrls.add(url));
        }
    }

    // Merge Google bot URLs
    for (const stats of [stats1, stats2]) {
        for (const [url, urlStats] of Object.entries(stats.googleBotUrls)) {
            if (!merged.googleBotUrls[url]) {
                merged.googleBotUrls[url] = {
                    hits: 0, totalBytes: 0, statusCodes: {},
                    firstSeen: urlStats.firstSeen, lastSeen: urlStats.lastSeen, bots: new Set()
                };
            }
            merged.googleBotUrls[url].hits += urlStats.hits;
            merged.googleBotUrls[url].totalBytes += urlStats.totalBytes;
            for (const [code, count] of Object.entries(urlStats.statusCodes)) {
                merged.googleBotUrls[url].statusCodes[code] = (merged.googleBotUrls[url].statusCodes[code] || 0) + count;
            }
            urlStats.bots.forEach(bot => merged.googleBotUrls[url].bots.add(bot));
            if (urlStats.lastSeen > merged.googleBotUrls[url].lastSeen) merged.googleBotUrls[url].lastSeen = urlStats.lastSeen;
            if (urlStats.firstSeen < merged.googleBotUrls[url].firstSeen) merged.googleBotUrls[url].firstSeen = urlStats.firstSeen;
        }
    }

    // Merge AI bot URLs
    for (const stats of [stats1, stats2]) {
        for (const [url, urlStats] of Object.entries(stats.aiBotUrls)) {
            if (!merged.aiBotUrls[url]) {
                merged.aiBotUrls[url] = {
                    hits: 0, totalBytes: 0, statusCodes: {},
                    firstSeen: urlStats.firstSeen, lastSeen: urlStats.lastSeen, bots: new Set()
                };
            }
            merged.aiBotUrls[url].hits += urlStats.hits;
            merged.aiBotUrls[url].totalBytes += urlStats.totalBytes;
            for (const [code, count] of Object.entries(urlStats.statusCodes)) {
                merged.aiBotUrls[url].statusCodes[code] = (merged.aiBotUrls[url].statusCodes[code] || 0) + count;
            }
            urlStats.bots.forEach(bot => merged.aiBotUrls[url].bots.add(bot));
            if (urlStats.lastSeen > merged.aiBotUrls[url].lastSeen) merged.aiBotUrls[url].lastSeen = urlStats.lastSeen;
            if (urlStats.firstSeen < merged.aiBotUrls[url].firstSeen) merged.aiBotUrls[url].firstSeen = urlStats.firstSeen;
        }
    }

    // Merge URL status codes
    for (const stats of [stats1, stats2]) {
        for (const [url, urlStats] of Object.entries(stats.urlStatusCodes)) {
            if (!merged.urlStatusCodes[url]) {
                merged.urlStatusCodes[url] = {
                    hits: 0, statusCodes: {}, bots: new Set(), botHits: 0, humanHits: 0
                };
            }
            merged.urlStatusCodes[url].hits += urlStats.hits;
            merged.urlStatusCodes[url].botHits += urlStats.botHits;
            merged.urlStatusCodes[url].humanHits += urlStats.humanHits;
            for (const [code, count] of Object.entries(urlStats.statusCodes)) {
                merged.urlStatusCodes[url].statusCodes[code] = (merged.urlStatusCodes[url].statusCodes[code] || 0) + count;
            }
            urlStats.bots.forEach(bot => merged.urlStatusCodes[url].bots.add(bot));
        }
    }

    // Merge other maps
    for (const key of ['hitsByCategory', 'hitsByHour', 'hitsByDate', 'hitsByMethod', 'hitsByDomain', 'hitsByServer']) {
        for (const [k, v] of Object.entries(stats2[key])) {
            merged[key][k] = (merged[key][k] || 0) + v;
        }
    }

    return merged;
}

// Store processed stats globally for filtering/sorting
let globalStats = null;
let rawLogEntries = []; // Store raw entries for filtering

// Global filters state
const globalFilters = {
    dateStart: null,
    dateEnd: null,
    domain: '',
    server: '',
};

// Sorting state
const sortState = {
    google: { column: 'hits', direction: 'desc' },
    ai: { column: 'hits', direction: 'desc' },
    urls: { column: 'hits', direction: 'desc' },
    bots: { column: 'hits', direction: 'desc' },
    logs: { column: 'datetime', direction: 'desc' },
};

// Pagination state
const pagination = {
    google: { page: 0, pageSize: 50, data: [], filtered: [] },
    ai: { page: 0, pageSize: 50, data: [], filtered: [] },
    urls: { page: 0, pageSize: 50, data: [], filtered: [] },
    status: { page: 0, pageSize: 50, data: [], filtered: [] },
    logs: { page: 0, pageSize: 100, data: [], filtered: [] },
};

// UI Code
let selectedFiles = [];

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const filesUl = document.getElementById('files');
const clearBtn = document.getElementById('clear-btn');
const analyzeBtn = document.getElementById('analyze-btn');
const uploadSection = document.getElementById('upload-section');
const loadingSection = document.getElementById('loading');
const resultsSection = document.getElementById('results');

// Tab navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show corresponding tab content
        const tabId = btn.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabId}`).classList.add('active');
    });
});

// Drag and drop handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    for (const file of files) {
        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.push(file);
        }
    }
    updateFileList();
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatNumber(num) {
    return num.toLocaleString();
}

function updateFileList() {
    if (selectedFiles.length === 0) {
        fileList.classList.add('hidden');
        return;
    }

    fileList.classList.remove('hidden');
    filesUl.innerHTML = selectedFiles.map((file, index) => `
        <li>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatBytes(file.size)}</span>
            <button class="remove-file" data-index="${index}">&times;</button>
        </li>
    `).join('');

    filesUl.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index, 10);
            selectedFiles.splice(index, 1);
            updateFileList();
        });
    });
}

clearBtn.addEventListener('click', () => {
    selectedFiles = [];
    updateFileList();
    fileInput.value = '';
});

analyzeBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    uploadSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');

    try {
        let combinedStats = null;
        rawLogEntries = [];

        for (const file of selectedFiles) {
            const content = await file.text();
            const result = parseLogs(content, true);

            if (combinedStats === null) {
                combinedStats = result.stats;
            } else {
                combinedStats = mergeStats(combinedStats, result.stats);
            }
            rawLogEntries = rawLogEntries.concat(result.entries);
        }

        globalStats = combinedStats;
        initializeGlobalFilters(combinedStats);
        displayResults(combinedStats);
    } catch (error) {
        console.error('Error parsing logs:', error);
        alert('Error parsing logs: ' + error.message);
        uploadSection.classList.remove('hidden');
    } finally {
        loadingSection.classList.add('hidden');
    }
});

function displayResults(stats) {
    resultsSection.classList.remove('hidden');

    // Overview tab
    displayOverview(stats);

    // Log Lines tab
    displayLogLines();

    // Google Bots tab
    displayGoogleBots(stats);

    // AI Bots tab
    displayAIBots(stats);

    // All Bots tab
    displayAllBots(stats);

    // URLs tab
    displayUrls(stats);

    // Status Codes tab
    displayStatusCodes(stats);

    // Raw JSON
    const summary = statsToSummary(stats);
    document.getElementById('raw-json').textContent = JSON.stringify(summary, null, 2);

    // Toggle raw JSON
    const toggleBtn = document.querySelector('.toggle-btn');
    const rawJson = document.getElementById('raw-json');
    toggleBtn.onclick = () => {
        rawJson.classList.toggle('hidden');
        toggleBtn.textContent = rawJson.classList.contains('hidden') ? 'Show' : 'Hide';
    };
}

function displayOverview(stats) {
    const botPercentage = stats.totalRequests > 0
        ? (stats.botRequests / stats.totalRequests) * 100
        : 0;

    // Show parsing warning if there are failed lines
    const warningEl = document.getElementById('parsing-warning');
    const statsEl = document.getElementById('parsing-stats');
    const examplesEl = document.getElementById('failed-examples');

    if (stats.failedLines && stats.failedLines > 0) {
        const failedPercent = ((stats.failedLines / stats.totalLines) * 100).toFixed(1);
        statsEl.textContent = `${formatNumber(stats.failedLines)} of ${formatNumber(stats.totalLines)} lines (${failedPercent}%) could not be parsed. They may have a different log format.`;
        examplesEl.textContent = (stats.failedExamples || []).join('\n\n');
        warningEl.classList.remove('hidden');
    } else {
        warningEl.classList.add('hidden');
    }

    document.getElementById('total-requests').textContent = formatNumber(stats.totalRequests);
    document.getElementById('unique-urls').textContent = formatNumber(stats.uniqueUrls.size);
    document.getElementById('unique-ips').textContent = formatNumber(stats.uniqueIps.size);
    document.getElementById('total-bytes').textContent = formatBytes(stats.totalBytes);

    document.getElementById('bot-requests').textContent = formatNumber(stats.botRequests);
    document.getElementById('bot-percentage').textContent = `${botPercentage.toFixed(1)}%`;
    document.getElementById('human-requests').textContent = formatNumber(stats.humanRequests);
    document.getElementById('verified-googlebot').textContent = formatNumber(stats.verifiedGooglebotRequests);

    renderBarChart('status-codes', stats.statusDistribution, stats.totalRequests);
    renderBarChart('methods', stats.hitsByMethod, stats.totalRequests);
    renderBarChart('bot-categories', stats.hitsByCategory, stats.botRequests);
    renderBarChart('domains', stats.hitsByDomain, stats.totalRequests);
    renderBarChart('servers', stats.hitsByServer, stats.totalRequests);
    renderBarChart('traffic-date', stats.hitsByDate, stats.totalRequests, true);
}

function displayLogLines() {
    // Use rawLogEntries directly
    pagination.logs.data = rawLogEntries.map((entry, index) => ({
        ...entry,
        index,
        ipsStr: entry.ips.join(', '),
    }));
    pagination.logs.filtered = [...pagination.logs.data];
    pagination.logs.page = 0;

    renderLogLinesTable();
    setupTableSorting('log-lines-table', 'logs', renderLogLinesTable);

    // Search handler
    const searchInput = document.getElementById('logs-search');
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    newSearchInput.addEventListener('input', (e) => {
        filterLogLines(
            e.target.value,
            document.getElementById('logs-bot-filter').value,
            document.getElementById('logs-status-filter').value
        );
    });

    // Bot filter handler
    const filterSelect = document.getElementById('logs-bot-filter');
    const newFilterSelect = filterSelect.cloneNode(true);
    filterSelect.parentNode.replaceChild(newFilterSelect, filterSelect);
    newFilterSelect.addEventListener('change', (e) => {
        filterLogLines(
            document.getElementById('logs-search').value,
            e.target.value,
            document.getElementById('logs-status-filter').value
        );
    });

    // Status code filter handler
    const statusFilter = document.getElementById('logs-status-filter');
    const newStatusFilter = statusFilter.cloneNode(true);
    statusFilter.parentNode.replaceChild(newStatusFilter, statusFilter);
    newStatusFilter.addEventListener('change', (e) => {
        filterLogLines(
            document.getElementById('logs-search').value,
            document.getElementById('logs-bot-filter').value,
            e.target.value
        );
    });

    // Pagination
    const prevBtn = document.getElementById('logs-prev-btn');
    const newPrevBtn = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    newPrevBtn.addEventListener('click', () => {
        if (pagination.logs.page > 0) {
            pagination.logs.page--;
            renderLogLinesTable();
        }
    });

    const nextBtn = document.getElementById('logs-next-btn');
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    newNextBtn.addEventListener('click', () => {
        const maxPage = Math.ceil(pagination.logs.filtered.length / pagination.logs.pageSize) - 1;
        if (pagination.logs.page < maxPage) {
            pagination.logs.page++;
            renderLogLinesTable();
        }
    });
}

function filterLogLines(search, botFilter, statusFilter) {
    pagination.logs.filtered = pagination.logs.data.filter(row => {
        const matchesSearch = !search ||
            row.url.toLowerCase().includes(search.toLowerCase()) ||
            row.ipsStr.toLowerCase().includes(search.toLowerCase()) ||
            row.userAgent.toLowerCase().includes(search.toLowerCase()) ||
            row.botName.toLowerCase().includes(search.toLowerCase());

        let matchesBot = true;
        if (botFilter === 'bot') matchesBot = row.isBot;
        else if (botFilter === 'human') matchesBot = !row.isBot;

        let matchesStatus = true;
        if (statusFilter) {
            const code = row.statusCode;
            if (statusFilter === '2xx') matchesStatus = code >= 200 && code < 300;
            else if (statusFilter === '3xx') matchesStatus = code >= 300 && code < 400;
            else if (statusFilter === '4xx') matchesStatus = code >= 400 && code < 500;
            else if (statusFilter === '5xx') matchesStatus = code >= 500 && code < 600;
        }

        return matchesSearch && matchesBot && matchesStatus;
    });
    pagination.logs.page = 0;
    renderLogLinesTable();
}

let selectedLogIndex = null;

function renderLogLinesTable() {
    const { page, pageSize, filtered } = pagination.logs;
    const start = page * pageSize;
    const end = start + pageSize;
    const pageData = filtered.slice(start, end);

    const tbody = document.querySelector('#log-lines-table tbody');
    tbody.innerHTML = pageData.map((row, idx) => {
        const globalIdx = start + idx;
        const statusClass = row.statusCode >= 500 ? 's5xx' :
                           row.statusCode >= 400 ? 's4xx' :
                           row.statusCode >= 300 ? 's3xx' : 's2xx';
        const selectedClass = selectedLogIndex === globalIdx ? 'selected' : '';
        return `
        <tr class="${selectedClass}" data-index="${globalIdx}">
            <td>${row.datetime}</td>
            <td>${row.method}</td>
            <td title="${row.url}">${row.url}</td>
            <td class="num"><span class="status-pill ${statusClass}">${row.statusCode}</span></td>
            <td class="num">${formatBytes(row.bytesSent)}</td>
            <td>${row.isBot ? `<span class="bot-pill">${row.botName}</span>` : '<span style="color: var(--success);">Human</span>'}</td>
            <td title="${row.ipsStr}">${row.ips[0]}</td>
            <td>${row.domain}</td>
        </tr>
    `}).join('');

    // Add click handlers to rows
    tbody.querySelectorAll('tr').forEach(tr => {
        tr.addEventListener('click', () => {
            const idx = parseInt(tr.dataset.index, 10);
            selectLogRow(idx);
        });
    });

    const total = filtered.length;
    const showing = Math.min(end, total);
    document.getElementById('logs-table-info').textContent =
        `Showing ${start + 1}-${showing} of ${total} lines`;

    document.getElementById('logs-prev-btn').disabled = page === 0;
    document.getElementById('logs-next-btn').disabled = end >= total;
}

function selectLogRow(index) {
    selectedLogIndex = index;
    const entry = pagination.logs.filtered[index];

    // Update selected row styling
    document.querySelectorAll('#log-lines-table tbody tr').forEach(tr => {
        tr.classList.remove('selected');
        if (parseInt(tr.dataset.index, 10) === index) {
            tr.classList.add('selected');
        }
    });

    // Show detail panel
    showLogDetail(entry);
}

function showLogDetail(entry) {
    const panel = document.getElementById('log-detail-panel');
    const content = document.getElementById('log-detail-content');

    const fields = [
        ['Row', selectedLogIndex + 1],
        ['DateTime', entry.datetime],
        ['Method', entry.method],
        ['URL', entry.url],
        ['Status Code', entry.statusCode],
        ['Bytes Sent', `${entry.bytesSent} (${formatBytes(entry.bytesSent)})`],
        ['Is Bot', entry.isBot ? 'Yes' : 'No'],
        ['Bot Name', entry.botName || '-'],
        ['Bot Category', entry.botCategory || '-'],
        ['Is Google Bot', entry.isGoogle ? 'Yes' : 'No'],
        ['Is AI Bot', entry.isAI ? 'Yes' : 'No'],
        ['IP Addresses', entry.ips.join(', ')],
        ['Domain', entry.domain],
        ['Server', entry.server],
        ['Referer', entry.referer || '-'],
        ['User Agent', entry.userAgent],
    ];

    content.innerHTML = fields.map(([name, value]) => `
        <div class="detail-row">
            <div class="detail-name">${name}</div>
            <div class="detail-value">${value}</div>
        </div>
    `).join('');

    panel.classList.remove('hidden');

    // Setup close button
    const closeBtn = document.getElementById('close-detail-btn');
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener('click', () => {
        panel.classList.add('hidden');
        selectedLogIndex = null;
        document.querySelectorAll('#log-lines-table tbody tr').forEach(tr => {
            tr.classList.remove('selected');
        });
    });
}

function displayGoogleBots(stats) {
    // Calculate Google stats
    const googleUrls = Object.entries(stats.googleBotUrls);
    const totalHits = googleUrls.reduce((sum, [, data]) => sum + data.hits, 0);
    const totalBytes = googleUrls.reduce((sum, [, data]) => sum + data.totalBytes, 0);
    const avgBytes = totalHits > 0 ? totalBytes / totalHits : 0;

    // Calculate error rate
    let errorHits = 0;
    googleUrls.forEach(([, data]) => {
        for (const [code, count] of Object.entries(data.statusCodes)) {
            if (parseInt(code) >= 400) errorHits += count;
        }
    });
    const errorRate = totalHits > 0 ? (errorHits / totalHits) * 100 : 0;

    document.getElementById('google-total-hits').textContent = formatNumber(totalHits);
    document.getElementById('google-unique-urls').textContent = formatNumber(googleUrls.length);
    document.getElementById('google-avg-bytes').textContent = formatBytes(avgBytes);
    document.getElementById('google-error-rate').textContent = `${errorRate.toFixed(1)}%`;

    // Google bot types chart
    const googleBots = {};
    for (const [bot, data] of Object.entries(stats.hitsByBot)) {
        if (data.isGoogle) {
            googleBots[bot] = data.hits;
        }
    }
    renderBarChart('google-bot-types', googleBots, totalHits, false, 'google');

    // Populate filter dropdown
    const filterSelect = document.getElementById('google-bot-filter');
    filterSelect.innerHTML = '<option value="">All Google Bots</option>';
    Object.keys(googleBots).sort().forEach(bot => {
        filterSelect.innerHTML += `<option value="${bot}">${bot}</option>`;
    });

    // Prepare table data
    pagination.google.data = googleUrls.map(([url, data]) => ({
        url,
        hits: data.hits,
        avgBytes: data.hits > 0 ? data.totalBytes / data.hits : 0,
        statusCodes: data.statusCodes,
        lastSeen: data.lastSeen,
        bots: Array.from(data.bots),
    })).sort((a, b) => b.hits - a.hits);

    pagination.google.filtered = [...pagination.google.data];
    pagination.google.page = 0;

    renderGoogleTable();
    setupTableSorting('google-urls-table', 'google', renderGoogleTable);

    // Search handler (remove old listeners by cloning)
    const searchInput = document.getElementById('google-url-search');
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    newSearchInput.addEventListener('input', (e) => {
        filterGoogleTable(e.target.value, filterSelect.value);
    });

    // Filter handler
    const newFilterSelect = filterSelect.cloneNode(true);
    filterSelect.parentNode.replaceChild(newFilterSelect, filterSelect);
    newFilterSelect.addEventListener('change', (e) => {
        filterGoogleTable(document.getElementById('google-url-search').value, e.target.value);
    });

    // Pagination
    const prevBtn = document.getElementById('google-prev-btn');
    const newPrevBtn = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    newPrevBtn.addEventListener('click', () => {
        if (pagination.google.page > 0) {
            pagination.google.page--;
            renderGoogleTable();
        }
    });

    const nextBtn = document.getElementById('google-next-btn');
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    newNextBtn.addEventListener('click', () => {
        const maxPage = Math.ceil(pagination.google.filtered.length / pagination.google.pageSize) - 1;
        if (pagination.google.page < maxPage) {
            pagination.google.page++;
            renderGoogleTable();
        }
    });
}

function filterGoogleTable(search, botFilter) {
    pagination.google.filtered = pagination.google.data.filter(row => {
        const matchesSearch = !search || row.url.toLowerCase().includes(search.toLowerCase());
        const matchesBot = !botFilter || row.bots.includes(botFilter);
        return matchesSearch && matchesBot;
    });
    pagination.google.page = 0;
    renderGoogleTable();
}

function renderGoogleTable() {
    const { page, pageSize, filtered } = pagination.google;
    const start = page * pageSize;
    const end = start + pageSize;
    const pageData = filtered.slice(start, end);

    const tbody = document.querySelector('#google-urls-table tbody');
    tbody.innerHTML = pageData.map(row => `
        <tr>
            <td title="${row.url}">${row.url}</td>
            <td class="num">${formatNumber(row.hits)}</td>
            <td class="num">${formatBytes(row.avgBytes)}</td>
            <td>${renderStatusPills(row.statusCodes)}</td>
            <td>${row.lastSeen || '-'}</td>
        </tr>
    `).join('');

    const total = filtered.length;
    const showing = Math.min(end, total);
    document.getElementById('google-table-info').textContent =
        `Showing ${start + 1}-${showing} of ${total} URLs`;

    document.getElementById('google-prev-btn').disabled = page === 0;
    document.getElementById('google-next-btn').disabled = end >= total;
}

function displayAIBots(stats) {
    // Calculate AI stats
    const aiUrls = Object.entries(stats.aiBotUrls);
    const totalHits = aiUrls.reduce((sum, [, data]) => sum + data.hits, 0);
    const totalBytes = aiUrls.reduce((sum, [, data]) => sum + data.totalBytes, 0);
    const avgBytes = totalHits > 0 ? totalBytes / totalHits : 0;

    // Count unique AI bots
    const aiBots = {};
    for (const [bot, data] of Object.entries(stats.hitsByBot)) {
        if (data.isAI) {
            aiBots[bot] = data.hits;
        }
    }

    document.getElementById('ai-total-hits').textContent = formatNumber(totalHits);
    document.getElementById('ai-unique-urls').textContent = formatNumber(aiUrls.length);
    document.getElementById('ai-avg-bytes').textContent = formatBytes(avgBytes);
    document.getElementById('ai-bot-count').textContent = formatNumber(Object.keys(aiBots).length);

    // AI bot types chart
    renderBarChart('ai-bot-types', aiBots, totalHits, false, 'ai');

    // Populate filter dropdown
    const filterSelect = document.getElementById('ai-bot-filter');
    filterSelect.innerHTML = '<option value="">All AI Bots</option>';
    Object.keys(aiBots).sort().forEach(bot => {
        filterSelect.innerHTML += `<option value="${bot}">${bot}</option>`;
    });

    // Prepare table data
    pagination.ai.data = aiUrls.map(([url, data]) => ({
        url,
        hits: data.hits,
        avgBytes: data.hits > 0 ? data.totalBytes / data.hits : 0,
        statusCodes: data.statusCodes,
        bots: Array.from(data.bots),
    })).sort((a, b) => b.hits - a.hits);

    pagination.ai.filtered = [...pagination.ai.data];
    pagination.ai.page = 0;

    renderAITable();
    setupTableSorting('ai-urls-table', 'ai', renderAITable);

    // Search handler (clone to remove old listeners)
    const searchInput = document.getElementById('ai-url-search');
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    newSearchInput.addEventListener('input', (e) => {
        filterAITable(e.target.value, document.getElementById('ai-bot-filter').value);
    });

    // Filter handler
    const newFilterSelect = filterSelect.cloneNode(true);
    filterSelect.parentNode.replaceChild(newFilterSelect, filterSelect);
    newFilterSelect.addEventListener('change', (e) => {
        filterAITable(document.getElementById('ai-url-search').value, e.target.value);
    });

    // Pagination
    const prevBtn = document.getElementById('ai-prev-btn');
    const newPrevBtn = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    newPrevBtn.addEventListener('click', () => {
        if (pagination.ai.page > 0) {
            pagination.ai.page--;
            renderAITable();
        }
    });

    const nextBtn = document.getElementById('ai-next-btn');
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    newNextBtn.addEventListener('click', () => {
        const maxPage = Math.ceil(pagination.ai.filtered.length / pagination.ai.pageSize) - 1;
        if (pagination.ai.page < maxPage) {
            pagination.ai.page++;
            renderAITable();
        }
    });
}

function filterAITable(search, botFilter) {
    pagination.ai.filtered = pagination.ai.data.filter(row => {
        const matchesSearch = !search || row.url.toLowerCase().includes(search.toLowerCase());
        const matchesBot = !botFilter || row.bots.includes(botFilter);
        return matchesSearch && matchesBot;
    });
    pagination.ai.page = 0;
    renderAITable();
}

function renderAITable() {
    const { page, pageSize, filtered } = pagination.ai;
    const start = page * pageSize;
    const end = start + pageSize;
    const pageData = filtered.slice(start, end);

    const tbody = document.querySelector('#ai-urls-table tbody');
    tbody.innerHTML = pageData.map(row => `
        <tr>
            <td title="${row.url}">${row.url}</td>
            <td class="num">${formatNumber(row.hits)}</td>
            <td class="num">${formatBytes(row.avgBytes)}</td>
            <td>${renderStatusPills(row.statusCodes)}</td>
            <td>${renderBotPills(row.bots)}</td>
        </tr>
    `).join('');

    const total = filtered.length;
    const showing = Math.min(end, total);
    document.getElementById('ai-table-info').textContent =
        `Showing ${start + 1}-${showing} of ${total} URLs`;

    document.getElementById('ai-prev-btn').disabled = page === 0;
    document.getElementById('ai-next-btn').disabled = end >= total;
}

function displayAllBots(stats) {
    // Prepare bots data for sorting and export
    pagination.bots = pagination.bots || { data: [], filtered: [] };
    pagination.bots.data = Object.entries(stats.hitsByBot).map(([name, data]) => ({
        name,
        category: data.category,
        hits: data.hits,
        urls: data.uniqueUrls.size,
        totalBytes: data.totalBytes,
        avgBytes: data.hits > 0 ? data.totalBytes / data.hits : 0,
    })).sort((a, b) => b.hits - a.hits);

    pagination.bots.filtered = [...pagination.bots.data];

    renderBotsTable();
    setupTableSorting('top-bots', 'bots', renderBotsTable);
}

function renderBotsTable() {
    const data = pagination.bots.filtered.slice(0, 100);
    const tbody = document.querySelector('#top-bots tbody');
    tbody.innerHTML = data.map(row => `
        <tr>
            <td>${row.name}</td>
            <td>${row.category}</td>
            <td class="num">${formatNumber(row.hits)}</td>
            <td class="num">${formatNumber(row.urls)}</td>
            <td class="num">${formatBytes(row.avgBytes)}</td>
        </tr>
    `).join('');
}

function displayUrls(stats) {
    // Prepare URL data
    pagination.urls.data = Object.entries(stats.hitsByUrl).map(([url, data]) => ({
        url,
        hits: data.hits,
        botHits: data.botHits,
        humanHits: data.humanHits,
        avgBytes: data.hits > 0 ? data.bytesTotal / data.hits : 0,
        statusCodes: data.statusCodes,
    })).sort((a, b) => b.hits - a.hits);

    pagination.urls.filtered = [...pagination.urls.data];
    pagination.urls.page = 0;

    renderUrlsTable();
    setupTableSorting('top-urls', 'urls', renderUrlsTable);

    // Search handler (clone to remove old listeners)
    const searchInput = document.getElementById('urls-search');
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    newSearchInput.addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();
        pagination.urls.filtered = pagination.urls.data.filter(row =>
            row.url.toLowerCase().includes(search)
        );
        pagination.urls.page = 0;
        renderUrlsTable();
    });

    // Pagination
    const prevBtn = document.getElementById('urls-prev-btn');
    const newPrevBtn = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    newPrevBtn.addEventListener('click', () => {
        if (pagination.urls.page > 0) {
            pagination.urls.page--;
            renderUrlsTable();
        }
    });

    const nextBtn = document.getElementById('urls-next-btn');
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    newNextBtn.addEventListener('click', () => {
        const maxPage = Math.ceil(pagination.urls.filtered.length / pagination.urls.pageSize) - 1;
        if (pagination.urls.page < maxPage) {
            pagination.urls.page++;
            renderUrlsTable();
        }
    });
}

function renderUrlsTable() {
    const { page, pageSize, filtered } = pagination.urls;
    const start = page * pageSize;
    const end = start + pageSize;
    const pageData = filtered.slice(start, end);

    const tbody = document.querySelector('#top-urls tbody');
    tbody.innerHTML = pageData.map(row => `
        <tr>
            <td title="${row.url}">${row.url}</td>
            <td class="num">${formatNumber(row.hits)}</td>
            <td class="num">${formatNumber(row.botHits)}</td>
            <td class="num">${formatNumber(row.humanHits)}</td>
            <td class="num">${formatBytes(row.avgBytes)}</td>
            <td>${renderStatusPills(row.statusCodes)}</td>
        </tr>
    `).join('');

    const total = filtered.length;
    const showing = Math.min(end, total);
    document.getElementById('urls-table-info').textContent =
        `Showing ${start + 1}-${showing} of ${total} URLs`;

    document.getElementById('urls-prev-btn').disabled = page === 0;
    document.getElementById('urls-next-btn').disabled = end >= total;
}

function displayStatusCodes(stats) {
    // Calculate status code groups
    let s2xx = 0, s3xx = 0, s4xx = 0, s5xx = 0;
    for (const [code, count] of Object.entries(stats.statusDistribution)) {
        const c = parseInt(code);
        if (c >= 200 && c < 300) s2xx += count;
        else if (c >= 300 && c < 400) s3xx += count;
        else if (c >= 400 && c < 500) s4xx += count;
        else if (c >= 500) s5xx += count;
    }

    document.getElementById('status-2xx').textContent = formatNumber(s2xx);
    document.getElementById('status-3xx').textContent = formatNumber(s3xx);
    document.getElementById('status-4xx').textContent = formatNumber(s4xx);
    document.getElementById('status-5xx').textContent = formatNumber(s5xx);

    // Status distribution chart
    renderBarChart('status-codes-detail', stats.statusDistribution, stats.totalRequests);

    // Populate filter
    const filterSelect = document.getElementById('status-filter');
    filterSelect.innerHTML = '<option value="">All Status Codes</option>';
    Object.keys(stats.statusDistribution).sort().forEach(code => {
        filterSelect.innerHTML += `<option value="${code}">${code}</option>`;
    });

    // Prepare table data with inconsistency detection
    pagination.status.data = Object.entries(stats.urlStatusCodes).map(([url, data]) => {
        const codes = Object.keys(data.statusCodes);
        const isInconsistent = codes.length > 1;
        return {
            url,
            hits: data.hits,
            statusCodes: data.statusCodes,
            isInconsistent,
        };
    }).sort((a, b) => b.hits - a.hits);

    pagination.status.filtered = [...pagination.status.data];
    pagination.status.page = 0;

    renderStatusTable();

    // Filter handler
    filterSelect.addEventListener('change', (e) => {
        const code = e.target.value;
        if (code) {
            pagination.status.filtered = pagination.status.data.filter(row =>
                row.statusCodes[code] !== undefined
            );
        } else {
            pagination.status.filtered = [...pagination.status.data];
        }
        pagination.status.page = 0;
        renderStatusTable();
    });
}

function renderStatusTable() {
    const { page, pageSize, filtered } = pagination.status;
    const start = page * pageSize;
    const end = start + pageSize;
    const pageData = filtered.slice(start, end);

    const tbody = document.querySelector('#status-urls-table tbody');
    tbody.innerHTML = pageData.map(row => `
        <tr>
            <td title="${row.url}">${row.url}</td>
            <td class="num">${formatNumber(row.hits)}</td>
            <td>${renderStatusPills(row.statusCodes)}</td>
            <td>${row.isInconsistent ? '<span class="flag-inconsistent">Yes</span>' : '-'}</td>
        </tr>
    `).join('');
}

function renderStatusPills(statusCodes) {
    return Object.entries(statusCodes)
        .sort((a, b) => b[1] - a[1])
        .map(([code, count]) => {
            const c = parseInt(code);
            let cls = '';
            if (c >= 200 && c < 300) cls = 's2xx';
            else if (c >= 300 && c < 400) cls = 's3xx';
            else if (c >= 400 && c < 500) cls = 's4xx';
            else if (c >= 500) cls = 's5xx';
            return `<span class="status-pill ${cls}">${code}: ${count}</span>`;
        }).join(' ');
}

function renderBotPills(bots) {
    return bots.slice(0, 3).map(bot =>
        `<span class="bot-pill">${bot}</span>`
    ).join(' ') + (bots.length > 3 ? ` +${bots.length - 3}` : '');
}

function renderBarChart(elementId, data, total, sortByKey = false, barClass = '') {
    const container = document.getElementById(elementId);
    let entries = Object.entries(data);

    if (sortByKey) {
        entries.sort((a, b) => a[0].localeCompare(b[0]));
    } else {
        entries.sort((a, b) => b[1] - a[1]);
    }

    entries = entries.slice(0, 15);

    if (entries.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No data</p>';
        return;
    }

    const maxValue = Math.max(...entries.map(e => e[1]));

    container.innerHTML = entries.map(([label, value]) => {
        const percentage = (value / maxValue) * 100;
        return `
            <div class="bar-row">
                <span class="bar-label" title="${label}">${label}</span>
                <div class="bar-container">
                    <div class="bar ${barClass}" style="width: ${percentage}%">
                        <span class="bar-value">${formatNumber(value)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function statsToSummary(stats, topN = 100) {
    const botPercentage = stats.totalRequests > 0
        ? (stats.botRequests / stats.totalRequests) * 100
        : 0;

    const topUrls = Object.entries(stats.hitsByUrl)
        .sort((a, b) => b[1].hits - a[1].hits)
        .slice(0, topN)
        .map(([url, data]) => [url, data]);

    const topBots = Object.entries(stats.hitsByBot)
        .sort((a, b) => b[1].hits - a[1].hits)
        .slice(0, topN)
        .map(([name, data]) => [name, {
            hits: data.hits,
            category: data.category,
            unique_urls_count: data.uniqueUrls.size,
            total_bytes: data.totalBytes,
            is_google: data.isGoogle,
            is_ai: data.isAI,
        }]);

    return {
        total_requests: stats.totalRequests,
        total_bytes: stats.totalBytes,
        unique_urls_count: stats.uniqueUrls.size,
        unique_ips_count: stats.uniqueIps.size,
        bot_requests: stats.botRequests,
        human_requests: stats.humanRequests,
        verified_googlebot_requests: stats.verifiedGooglebotRequests,
        bot_percentage: botPercentage,
        status_distribution: stats.statusDistribution,
        top_urls: topUrls,
        top_bots: topBots,
        hits_by_category: stats.hitsByCategory,
        hits_by_date: stats.hitsByDate,
        hits_by_method: stats.hitsByMethod,
        hits_by_domain: stats.hitsByDomain,
        hits_by_server: stats.hitsByServer,
    };
}

// ============================================
// GLOBAL FILTERS
// ============================================

function initializeGlobalFilters(stats) {
    // Populate domain filter
    const domainSelect = document.getElementById('filter-domain');
    domainSelect.innerHTML = '<option value="">All Domains</option>';
    Object.keys(stats.hitsByDomain).sort().forEach(domain => {
        if (domain) domainSelect.innerHTML += `<option value="${domain}">${domain}</option>`;
    });

    // Populate server filter
    const serverSelect = document.getElementById('filter-server');
    serverSelect.innerHTML = '<option value="">All Servers</option>';
    Object.keys(stats.hitsByServer).sort().forEach(server => {
        if (server) serverSelect.innerHTML += `<option value="${server}">${server}</option>`;
    });

    // Set date range from data
    const dates = Object.keys(stats.hitsByDate).sort();
    if (dates.length > 0) {
        document.getElementById('filter-date-start').value = dates[0];
        document.getElementById('filter-date-end').value = dates[dates.length - 1];
    }

    // Apply filters button
    document.getElementById('apply-filters-btn').addEventListener('click', applyGlobalFilters);
    document.getElementById('reset-filters-btn').addEventListener('click', resetGlobalFilters);
}

function applyGlobalFilters() {
    globalFilters.dateStart = document.getElementById('filter-date-start').value || null;
    globalFilters.dateEnd = document.getElementById('filter-date-end').value || null;
    globalFilters.domain = document.getElementById('filter-domain').value;
    globalFilters.server = document.getElementById('filter-server').value;

    // Filter raw entries and rebuild stats
    const filteredEntries = rawLogEntries.filter(entry => {
        // Parse date from entry
        let dateStr = '';
        const dateMatch = entry.datetime.match(/(\d{2})\/(\w{3})\/(\d{4})/);
        if (dateMatch) {
            const [, day, month, year] = dateMatch;
            const monthNum = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
                              Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' }[month] || '01';
            dateStr = `${year}-${monthNum}-${day}`;
        }

        // Date filter
        if (globalFilters.dateStart && dateStr < globalFilters.dateStart) return false;
        if (globalFilters.dateEnd && dateStr > globalFilters.dateEnd) return false;

        // Domain filter
        if (globalFilters.domain && entry.domain !== globalFilters.domain) return false;

        // Server filter
        if (globalFilters.server && entry.server !== globalFilters.server) return false;

        return true;
    });

    // Rebuild stats from filtered entries
    const filteredStats = buildStatsFromEntries(filteredEntries);
    displayResults(filteredStats);
}

function resetGlobalFilters() {
    globalFilters.dateStart = null;
    globalFilters.dateEnd = null;
    globalFilters.domain = '';
    globalFilters.server = '';

    document.getElementById('filter-domain').value = '';
    document.getElementById('filter-server').value = '';

    // Reset date inputs to full range
    const dates = Object.keys(globalStats.hitsByDate).sort();
    if (dates.length > 0) {
        document.getElementById('filter-date-start').value = dates[0];
        document.getElementById('filter-date-end').value = dates[dates.length - 1];
    }

    displayResults(globalStats);
}

function buildStatsFromEntries(entries) {
    const stats = {
        totalRequests: 0,
        totalBytes: 0,
        uniqueUrls: new Set(),
        uniqueIps: new Set(),
        botRequests: 0,
        humanRequests: 0,
        verifiedGooglebotRequests: 0,
        statusDistribution: {},
        hitsByUrl: {},
        hitsByBot: {},
        hitsByCategory: {},
        hitsByHour: {},
        hitsByDate: {},
        hitsByMethod: {},
        hitsByDomain: {},
        hitsByServer: {},
        googleBotUrls: {},
        aiBotUrls: {},
        urlStatusCodes: {},
    };

    for (const entry of entries) {
        stats.totalRequests++;
        stats.totalBytes += entry.bytesSent;
        stats.uniqueUrls.add(entry.url);
        entry.ips.forEach(ip => stats.uniqueIps.add(ip));

        if (entry.isBot) {
            stats.botRequests++;
        } else {
            stats.humanRequests++;
        }

        stats.statusDistribution[entry.statusCode] = (stats.statusDistribution[entry.statusCode] || 0) + 1;

        let dateStr = '';
        const dateMatch = entry.datetime.match(/(\d{2})\/(\w{3})\/(\d{4}):(\d{2})/);
        if (dateMatch) {
            const [, day, month, year, hour] = dateMatch;
            const monthNum = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
                              Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' }[month] || '01';
            dateStr = `${year}-${monthNum}-${day}`;
            const hourKey = `${dateStr} ${hour}:00`;
            stats.hitsByDate[dateStr] = (stats.hitsByDate[dateStr] || 0) + 1;
            stats.hitsByHour[hourKey] = (stats.hitsByHour[hourKey] || 0) + 1;
        }

        if (!stats.hitsByUrl[entry.url]) {
            stats.hitsByUrl[entry.url] = {
                hits: 0, botHits: 0, humanHits: 0, bytesTotal: 0,
                statusCodes: {}, firstSeen: dateStr, lastSeen: dateStr
            };
        }
        const urlStats = stats.hitsByUrl[entry.url];
        urlStats.hits++;
        urlStats.bytesTotal += entry.bytesSent;
        urlStats.statusCodes[entry.statusCode] = (urlStats.statusCodes[entry.statusCode] || 0) + 1;
        if (dateStr > urlStats.lastSeen) urlStats.lastSeen = dateStr;
        if (dateStr < urlStats.firstSeen) urlStats.firstSeen = dateStr;
        if (entry.isBot) urlStats.botHits++;
        else urlStats.humanHits++;

        if (!stats.urlStatusCodes[entry.url]) {
            stats.urlStatusCodes[entry.url] = { hits: 0, statusCodes: {}, bots: new Set(), botHits: 0, humanHits: 0 };
        }
        stats.urlStatusCodes[entry.url].hits++;
        stats.urlStatusCodes[entry.url].statusCodes[entry.statusCode] =
            (stats.urlStatusCodes[entry.url].statusCodes[entry.statusCode] || 0) + 1;
        if (entry.isBot) {
            stats.urlStatusCodes[entry.url].bots.add(entry.botName);
            stats.urlStatusCodes[entry.url].botHits++;
        } else {
            stats.urlStatusCodes[entry.url].humanHits++;
        }

        if (entry.isBot && entry.botName) {
            if (!stats.hitsByBot[entry.botName]) {
                stats.hitsByBot[entry.botName] = {
                    hits: 0, category: entry.botCategory, uniqueUrls: new Set(),
                    totalBytes: 0, isGoogle: entry.isGoogle, isAI: entry.isAI
                };
            }
            stats.hitsByBot[entry.botName].hits++;
            stats.hitsByBot[entry.botName].uniqueUrls.add(entry.url);
            stats.hitsByBot[entry.botName].totalBytes += entry.bytesSent;
            stats.hitsByCategory[entry.botCategory] = (stats.hitsByCategory[entry.botCategory] || 0) + 1;

            if (entry.isGoogle) {
                if (!stats.googleBotUrls[entry.url]) {
                    stats.googleBotUrls[entry.url] = {
                        hits: 0, totalBytes: 0, statusCodes: {},
                        firstSeen: dateStr, lastSeen: dateStr, bots: new Set()
                    };
                }
                const gUrl = stats.googleBotUrls[entry.url];
                gUrl.hits++;
                gUrl.totalBytes += entry.bytesSent;
                gUrl.statusCodes[entry.statusCode] = (gUrl.statusCodes[entry.statusCode] || 0) + 1;
                gUrl.bots.add(entry.botName);
                if (dateStr > gUrl.lastSeen) gUrl.lastSeen = dateStr;
                if (dateStr < gUrl.firstSeen) gUrl.firstSeen = dateStr;
            }

            if (entry.isAI) {
                if (!stats.aiBotUrls[entry.url]) {
                    stats.aiBotUrls[entry.url] = {
                        hits: 0, totalBytes: 0, statusCodes: {},
                        firstSeen: dateStr, lastSeen: dateStr, bots: new Set()
                    };
                }
                const aiUrl = stats.aiBotUrls[entry.url];
                aiUrl.hits++;
                aiUrl.totalBytes += entry.bytesSent;
                aiUrl.statusCodes[entry.statusCode] = (aiUrl.statusCodes[entry.statusCode] || 0) + 1;
                aiUrl.bots.add(entry.botName);
                if (dateStr > aiUrl.lastSeen) aiUrl.lastSeen = dateStr;
                if (dateStr < aiUrl.firstSeen) aiUrl.firstSeen = dateStr;
            }
        }

        stats.hitsByMethod[entry.method] = (stats.hitsByMethod[entry.method] || 0) + 1;
        stats.hitsByDomain[entry.domain] = (stats.hitsByDomain[entry.domain] || 0) + 1;
        stats.hitsByServer[entry.server] = (stats.hitsByServer[entry.server] || 0) + 1;
    }

    return stats;
}

// ============================================
// SORTING
// ============================================

function setupTableSorting(tableId, paginationKey, renderFn) {
    const table = document.getElementById(tableId);
    if (!table) return;

    table.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            const state = sortState[paginationKey];

            // Toggle direction or change column
            if (state.column === column) {
                state.direction = state.direction === 'asc' ? 'desc' : 'asc';
            } else {
                state.column = column;
                state.direction = 'desc';
            }

            // Update UI
            table.querySelectorAll('th').forEach(h => {
                h.classList.remove('sorted-asc', 'sorted-desc');
            });
            th.classList.add(state.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');

            // Sort data
            sortPaginationData(paginationKey, column, state.direction);
            pagination[paginationKey].page = 0;
            renderFn();
        });
    });
}

function sortPaginationData(key, column, direction) {
    const data = pagination[key].filtered;
    const multiplier = direction === 'asc' ? 1 : -1;

    data.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // Handle special cases
        if (column === 'status' || column === 'statusCodes') {
            valA = Object.keys(a.statusCodes || {}).join(',');
            valB = Object.keys(b.statusCodes || {}).join(',');
        }
        if (column === 'bots' && Array.isArray(valA)) {
            valA = valA.join(',');
            valB = valB.join(',');
        }

        if (typeof valA === 'string') {
            return multiplier * valA.localeCompare(valB);
        }
        return multiplier * (valA - valB);
    });
}

// ============================================
// CSV EXPORT
// ============================================

function downloadCSV(filename, headers, rows) {
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
            // Escape quotes and wrap in quotes if contains comma
            const str = String(cell);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

function setupCSVExports() {
    // Google Bots CSV
    document.getElementById('google-export-csv')?.addEventListener('click', () => {
        const headers = ['URL', 'Hits', 'Avg Bytes', 'Status Codes', 'Last Seen', 'Bots'];
        const rows = pagination.google.filtered.map(row => [
            row.url,
            row.hits,
            Math.round(row.avgBytes),
            Object.entries(row.statusCodes).map(([c, n]) => `${c}:${n}`).join('; '),
            row.lastSeen || '',
            row.bots.join('; ')
        ]);
        downloadCSV('google-bots-urls.csv', headers, rows);
    });

    // AI Bots CSV
    document.getElementById('ai-export-csv')?.addEventListener('click', () => {
        const headers = ['URL', 'Hits', 'Avg Bytes', 'Status Codes', 'Bots'];
        const rows = pagination.ai.filtered.map(row => [
            row.url,
            row.hits,
            Math.round(row.avgBytes),
            Object.entries(row.statusCodes).map(([c, n]) => `${c}:${n}`).join('; '),
            row.bots.join('; ')
        ]);
        downloadCSV('ai-bots-urls.csv', headers, rows);
    });

    // All Bots CSV
    document.getElementById('bots-export-csv')?.addEventListener('click', () => {
        const headers = ['Bot', 'Category', 'Hits', 'Unique URLs', 'Total Bytes', 'Avg Bytes'];
        const rows = pagination.bots?.data?.map(row => [
            row.name,
            row.category,
            row.hits,
            row.urls,
            row.totalBytes,
            Math.round(row.avgBytes)
        ]) || [];
        downloadCSV('all-bots.csv', headers, rows);
    });

    // URLs CSV
    document.getElementById('urls-export-csv')?.addEventListener('click', () => {
        const headers = ['URL', 'Total Hits', 'Bot Hits', 'Human Hits', 'Avg Bytes', 'Status Codes'];
        const rows = pagination.urls.filtered.map(row => [
            row.url,
            row.hits,
            row.botHits,
            row.humanHits,
            Math.round(row.avgBytes),
            Object.entries(row.statusCodes).map(([c, n]) => `${c}:${n}`).join('; ')
        ]);
        downloadCSV('all-urls.csv', headers, rows);
    });

    // Log Lines CSV
    document.getElementById('logs-export-csv')?.addEventListener('click', () => {
        const headers = ['DateTime', 'Method', 'URL', 'Status', 'Bytes', 'Is Bot', 'Bot Name', 'Bot Category', 'IPs', 'Domain', 'Server', 'User Agent', 'Referer'];
        const rows = pagination.logs.filtered.map(row => [
            row.datetime,
            row.method,
            row.url,
            row.statusCode,
            row.bytesSent,
            row.isBot ? 'Yes' : 'No',
            row.botName || '',
            row.botCategory || '',
            row.ips.join('; '),
            row.domain,
            row.server,
            row.userAgent,
            row.referer
        ]);
        downloadCSV('log-lines.csv', headers, rows);
    });

    // Status Codes CSV
    document.getElementById('status-export-csv')?.addEventListener('click', () => {
        const headers = ['URL', 'Hits', 'Status Codes', 'Inconsistent'];
        const rows = pagination.status.filtered.map(row => [
            row.url,
            row.hits,
            Object.entries(row.statusCodes).map(([c, n]) => `${c}:${n}`).join('; '),
            row.isInconsistent ? 'Yes' : 'No'
        ]);
        downloadCSV('status-codes.csv', headers, rows);
    });
}

// Initialize sorting and CSV exports after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupCSVExports();
});
