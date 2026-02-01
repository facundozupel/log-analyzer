// Log Parser - JavaScript Implementation
// Mirrors the Rust parser logic for browser use

// Bot patterns (same as Rust version)
const BOT_PATTERNS = [
    // Search Engines
    { pattern: /Googlebot/i, name: 'Googlebot', category: 'Search Engine' },
    { pattern: /Googlebot-Image/i, name: 'Googlebot-Image', category: 'Search Engine' },
    { pattern: /Googlebot-Video/i, name: 'Googlebot-Video', category: 'Search Engine' },
    { pattern: /Googlebot-News/i, name: 'Googlebot-News', category: 'Search Engine' },
    { pattern: /Storebot-Google/i, name: 'Storebot-Google', category: 'Search Engine' },
    { pattern: /Google-InspectionTool/i, name: 'Google-InspectionTool', category: 'Search Engine' },
    { pattern: /GoogleOther/i, name: 'GoogleOther', category: 'Search Engine' },
    { pattern: /AdsBot-Google/i, name: 'AdsBot-Google', category: 'Advertising' },
    { pattern: /Mediapartners-Google/i, name: 'Mediapartners-Google', category: 'Advertising' },
    { pattern: /bingbot/i, name: 'Bingbot', category: 'Search Engine' },
    { pattern: /Slurp/i, name: 'Yahoo Slurp', category: 'Search Engine' },
    { pattern: /DuckDuckBot/i, name: 'DuckDuckBot', category: 'Search Engine' },
    { pattern: /Baiduspider/i, name: 'Baiduspider', category: 'Search Engine' },
    { pattern: /YandexBot/i, name: 'YandexBot', category: 'Search Engine' },

    // LLM/AI Bots
    { pattern: /GPTBot/i, name: 'GPTBot', category: 'LLM Bot' },
    { pattern: /ChatGPT-User/i, name: 'ChatGPT-User', category: 'LLM Bot' },
    { pattern: /OAI-SearchBot/i, name: 'OAI-SearchBot', category: 'LLM Bot' },
    { pattern: /Claude-Web/i, name: 'Claude-Web', category: 'LLM Bot' },
    { pattern: /ClaudeBot/i, name: 'ClaudeBot', category: 'LLM Bot' },
    { pattern: /anthropic-ai/i, name: 'Anthropic', category: 'LLM Bot' },
    { pattern: /Applebot-Extended/i, name: 'Applebot-Extended', category: 'LLM Bot' },
    { pattern: /Bytespider/i, name: 'Bytespider', category: 'LLM Bot' },
    { pattern: /CCBot/i, name: 'CCBot', category: 'LLM Bot' },
    { pattern: /cohere-ai/i, name: 'Cohere', category: 'LLM Bot' },
    { pattern: /Diffbot/i, name: 'Diffbot', category: 'LLM Bot' },
    { pattern: /FacebookBot/i, name: 'FacebookBot', category: 'LLM Bot' },
    { pattern: /Google-Extended/i, name: 'Google-Extended', category: 'LLM Bot' },
    { pattern: /omgili/i, name: 'Omgili', category: 'LLM Bot' },
    { pattern: /PerplexityBot/i, name: 'PerplexityBot', category: 'LLM Bot' },

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

// Log line regex - matches the format:
// [server]:::[domain]:::ip1,ip2 - - [dd/Mon/yyyy:HH:MM:SS +0000] "METHOD /path HTTP/1.1" status bytes "referer" "user-agent" "extra"
const LOG_REGEX = /^\[([^\]]*)\]:::\[([^\]]*)\]:::([^\s]+)\s+-\s+-\s+\[([^\]]+)\]\s+"(\w+)\s+([^\s]+)\s+[^"]*"\s+(\d+)\s+(\d+)\s+"([^"]*)"\s+"([^"]*)"/;

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
    };
}

function detectBot(entry) {
    for (const bot of BOT_PATTERNS) {
        if (bot.pattern.test(entry.userAgent)) {
            entry.isBot = true;
            entry.botName = bot.name;
            entry.botCategory = bot.category;
            return;
        }
    }
}

function parseLogs(content) {
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
    };

    const lines = content.split('\n');

    for (const line of lines) {
        if (!line.trim()) continue;

        const entry = parseLogLine(line);
        if (!entry) continue;

        detectBot(entry);

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

        // URL stats
        if (!stats.hitsByUrl[entry.url]) {
            stats.hitsByUrl[entry.url] = { hits: 0, botHits: 0, humanHits: 0, bytesTotal: 0 };
        }
        stats.hitsByUrl[entry.url].hits++;
        stats.hitsByUrl[entry.url].bytesTotal += entry.bytesSent;
        if (entry.isBot) {
            stats.hitsByUrl[entry.url].botHits++;
        } else {
            stats.hitsByUrl[entry.url].humanHits++;
        }

        // Bot stats
        if (entry.isBot && entry.botName) {
            if (!stats.hitsByBot[entry.botName]) {
                stats.hitsByBot[entry.botName] = {
                    hits: 0,
                    category: entry.botCategory,
                    uniqueUrls: new Set(),
                };
            }
            stats.hitsByBot[entry.botName].hits++;
            stats.hitsByBot[entry.botName].uniqueUrls.add(entry.url);

            // Category stats
            stats.hitsByCategory[entry.botCategory] = (stats.hitsByCategory[entry.botCategory] || 0) + 1;
        }

        // Method stats
        stats.hitsByMethod[entry.method] = (stats.hitsByMethod[entry.method] || 0) + 1;

        // Domain stats
        stats.hitsByDomain[entry.domain] = (stats.hitsByDomain[entry.domain] || 0) + 1;

        // Server stats
        stats.hitsByServer[entry.server] = (stats.hitsByServer[entry.server] || 0) + 1;

        // Date/time stats
        const dateMatch = entry.datetime.match(/(\d{2})\/(\w{3})\/(\d{4}):(\d{2})/);
        if (dateMatch) {
            const [, day, month, year, hour] = dateMatch;
            const monthNum = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
                              Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' }[month] || '01';
            const dateKey = `${year}-${monthNum}-${day}`;
            const hourKey = `${dateKey} ${hour}:00`;
            stats.hitsByDate[dateKey] = (stats.hitsByDate[dateKey] || 0) + 1;
            stats.hitsByHour[hourKey] = (stats.hitsByHour[hourKey] || 0) + 1;
        }
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
        hitsByUrl: { ...stats1.hitsByUrl },
        hitsByBot: { ...stats1.hitsByBot },
        hitsByCategory: { ...stats1.hitsByCategory },
        hitsByHour: { ...stats1.hitsByHour },
        hitsByDate: { ...stats1.hitsByDate },
        hitsByMethod: { ...stats1.hitsByMethod },
        hitsByDomain: { ...stats1.hitsByDomain },
        hitsByServer: { ...stats1.hitsByServer },
    };

    // Merge status distribution
    for (const [code, count] of Object.entries(stats2.statusDistribution)) {
        merged.statusDistribution[code] = (merged.statusDistribution[code] || 0) + count;
    }

    // Merge URL stats
    for (const [url, urlStats] of Object.entries(stats2.hitsByUrl)) {
        if (!merged.hitsByUrl[url]) {
            merged.hitsByUrl[url] = { hits: 0, botHits: 0, humanHits: 0, bytesTotal: 0 };
        }
        merged.hitsByUrl[url].hits += urlStats.hits;
        merged.hitsByUrl[url].botHits += urlStats.botHits;
        merged.hitsByUrl[url].humanHits += urlStats.humanHits;
        merged.hitsByUrl[url].bytesTotal += urlStats.bytesTotal;
    }

    // Merge bot stats
    for (const [bot, botStats] of Object.entries(stats2.hitsByBot)) {
        if (!merged.hitsByBot[bot]) {
            merged.hitsByBot[bot] = { hits: 0, category: botStats.category, uniqueUrls: new Set() };
        }
        merged.hitsByBot[bot].hits += botStats.hits;
        botStats.uniqueUrls.forEach(url => merged.hitsByBot[bot].uniqueUrls.add(url));
    }

    // Merge other maps
    for (const key of ['hitsByCategory', 'hitsByHour', 'hitsByDate', 'hitsByMethod', 'hitsByDomain', 'hitsByServer']) {
        for (const [k, v] of Object.entries(stats2[key])) {
            merged[key][k] = (merged[key][k] || 0) + v;
        }
    }

    return merged;
}

function statsToSummary(stats, topN = 100) {
    const botPercentage = stats.totalRequests > 0
        ? (stats.botRequests / stats.totalRequests) * 100
        : 0;

    // Top URLs
    const topUrls = Object.entries(stats.hitsByUrl)
        .sort((a, b) => b[1].hits - a[1].hits)
        .slice(0, topN)
        .map(([url, data]) => [url, data]);

    // Top Bots
    const topBots = Object.entries(stats.hitsByBot)
        .sort((a, b) => b[1].hits - a[1].hits)
        .slice(0, topN)
        .map(([name, data]) => [name, {
            hits: data.hits,
            category: data.category,
            unique_urls_count: data.uniqueUrls.size,
            verified_count: 0,
            unverified_count: 0,
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
        hits_by_hour: stats.hitsByHour,
        hits_by_date: stats.hitsByDate,
        hits_by_method: stats.hitsByMethod,
        hits_by_domain: stats.hitsByDomain,
        hits_by_server: stats.hitsByServer,
    };
}

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

    // Add remove handlers
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

        for (const file of selectedFiles) {
            const content = await file.text();
            const stats = parseLogs(content);

            if (combinedStats === null) {
                combinedStats = stats;
            } else {
                combinedStats = mergeStats(combinedStats, stats);
            }
        }

        const summary = statsToSummary(combinedStats);
        displayResults(summary);
    } catch (error) {
        console.error('Error parsing logs:', error);
        alert('Error parsing logs: ' + error.message);
        uploadSection.classList.remove('hidden');
    } finally {
        loadingSection.classList.add('hidden');
    }
});

function displayResults(summary) {
    resultsSection.classList.remove('hidden');

    // Main stats
    document.getElementById('total-requests').textContent = formatNumber(summary.total_requests);
    document.getElementById('unique-urls').textContent = formatNumber(summary.unique_urls_count);
    document.getElementById('unique-ips').textContent = formatNumber(summary.unique_ips_count);
    document.getElementById('total-bytes').textContent = formatBytes(summary.total_bytes);

    document.getElementById('bot-requests').textContent = formatNumber(summary.bot_requests);
    document.getElementById('bot-percentage').textContent = `${summary.bot_percentage.toFixed(1)}%`;
    document.getElementById('human-requests').textContent = formatNumber(summary.human_requests);
    document.getElementById('verified-googlebot').textContent = formatNumber(summary.verified_googlebot_requests);

    // Bar charts
    renderBarChart('status-codes', summary.status_distribution, summary.total_requests);
    renderBarChart('methods', summary.hits_by_method, summary.total_requests);
    renderBarChart('bot-categories', summary.hits_by_category, summary.bot_requests);
    renderBarChart('domains', summary.hits_by_domain, summary.total_requests);
    renderBarChart('servers', summary.hits_by_server, summary.total_requests);
    renderBarChart('traffic-date', summary.hits_by_date, summary.total_requests, true);

    // Tables
    renderBotsTable(summary.top_bots);
    renderUrlsTable(summary.top_urls);

    // Raw JSON
    document.getElementById('raw-json').textContent = JSON.stringify(summary, null, 2);

    // Toggle raw JSON
    const toggleBtn = document.querySelector('.toggle-btn');
    const rawJson = document.getElementById('raw-json');
    toggleBtn.onclick = () => {
        rawJson.classList.toggle('hidden');
        toggleBtn.textContent = rawJson.classList.contains('hidden') ? 'Show' : 'Hide';
    };
}

function renderBarChart(elementId, data, total, sortByKey = false) {
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
                    <div class="bar" style="width: ${percentage}%">
                        <span class="bar-value">${formatNumber(value)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderBotsTable(topBots) {
    const tbody = document.querySelector('#top-bots tbody');
    tbody.innerHTML = topBots.slice(0, 20).map(([name, data]) => `
        <tr>
            <td>${name}</td>
            <td>${data.category}</td>
            <td>${formatNumber(data.hits)}</td>
            <td>${formatNumber(data.unique_urls_count)}</td>
            <td>${formatNumber(data.verified_count)}</td>
        </tr>
    `).join('');
}

function renderUrlsTable(topUrls) {
    const tbody = document.querySelector('#top-urls tbody');
    tbody.innerHTML = topUrls.slice(0, 20).map(([url, data]) => `
        <tr>
            <td title="${url}">${url}</td>
            <td>${formatNumber(data.hits)}</td>
            <td>${formatNumber(data.botHits)}</td>
            <td>${formatNumber(data.humanHits)}</td>
            <td>${formatBytes(data.bytesTotal)}</td>
        </tr>
    `).join('');
}
