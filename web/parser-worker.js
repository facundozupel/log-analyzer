// Web Worker for streaming log parsing
// Processes files in chunks to avoid memory issues

// Bot patterns
const BOT_PATTERNS = [
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
    { pattern: /bingbot/i, name: 'Bingbot', category: 'Search Engine' },
    { pattern: /Slurp/i, name: 'Yahoo Slurp', category: 'Search Engine' },
    { pattern: /DuckDuckBot/i, name: 'DuckDuckBot', category: 'Search Engine' },
    { pattern: /Baiduspider/i, name: 'Baiduspider', category: 'Search Engine' },
    { pattern: /YandexBot/i, name: 'YandexBot', category: 'Search Engine' },
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
    { pattern: /AhrefsBot/i, name: 'AhrefsBot', category: 'SEO Tool' },
    { pattern: /SemrushBot/i, name: 'SemrushBot', category: 'SEO Tool' },
    { pattern: /MJ12bot/i, name: 'MJ12bot', category: 'SEO Tool' },
    { pattern: /DotBot/i, name: 'DotBot', category: 'SEO Tool' },
    { pattern: /Screaming Frog/i, name: 'Screaming Frog', category: 'SEO Tool' },
    { pattern: /rogerbot/i, name: 'Rogerbot', category: 'SEO Tool' },
    { pattern: /facebookexternalhit/i, name: 'Facebook', category: 'Social Media' },
    { pattern: /Twitterbot/i, name: 'Twitterbot', category: 'Social Media' },
    { pattern: /LinkedInBot/i, name: 'LinkedInBot', category: 'Social Media' },
    { pattern: /Pinterest/i, name: 'Pinterest', category: 'Social Media' },
    { pattern: /Slackbot/i, name: 'Slackbot', category: 'Social Media' },
    { pattern: /TelegramBot/i, name: 'TelegramBot', category: 'Social Media' },
    { pattern: /WhatsApp/i, name: 'WhatsApp', category: 'Social Media' },
    { pattern: /UptimeRobot/i, name: 'UptimeRobot', category: 'Monitoring' },
    { pattern: /Pingdom/i, name: 'Pingdom', category: 'Monitoring' },
    { pattern: /StatusCake/i, name: 'StatusCake', category: 'Monitoring' },
    { pattern: /bot/i, name: 'Unknown Bot', category: 'Other' },
    { pattern: /crawler/i, name: 'Unknown Crawler', category: 'Other' },
    { pattern: /spider/i, name: 'Unknown Spider', category: 'Other' },
];

const LOG_REGEX = /^\[([^\]]*)\]:::\[([^\]]*)\]:::([0-9a-fA-F:., ]+)\s+-\s+-\s+\[([^\]]+)\]\s+"(\w+)\s+([^\s]+)\s+[^"]*"\s+(\d+)\s+(\d+)\s+"([^"]*)"\s+"([^"]*)"(?:\s+"[^"]*")?/;

function parseLogLine(line) {
    const match = line.match(LOG_REGEX);
    if (!match) return null;
    const [, server, domain, ips, datetime, method, url, status, bytes, referer, userAgent] = match;
    return {
        server, domain,
        ips: ips.split(',').map(ip => ip.trim()),
        datetime, method, url,
        statusCode: parseInt(status, 10),
        bytesSent: parseInt(bytes, 10) || 0,
        referer, userAgent,
        isBot: false, botName: '', botCategory: '',
        isGoogle: false, isAI: false,
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

// Streaming stats accumulator - doesn't store individual entries
class StatsAccumulator {
    constructor() {
        this.totalRequests = 0;
        this.totalBytes = 0;
        this.uniqueUrls = new Set();
        this.uniqueIps = new Set();
        this.botRequests = 0;
        this.humanRequests = 0;
        this.statusDistribution = {};
        this.hitsByUrl = {};
        this.hitsByBot = {};
        this.hitsByCategory = {};
        this.hitsByHour = {};
        this.hitsByDate = {};
        this.hitsByMethod = {};
        this.hitsByDomain = {};
        this.hitsByServer = {};
        this.googleBotUrls = {};
        this.aiBotUrls = {};
        this.urlStatusCodes = {};
        this.totalLines = 0;
        this.parsedLines = 0;
        this.failedLines = 0;
        this.failedExamples = [];
    }

    addEntry(entry) {
        this.totalRequests++;
        this.totalBytes += entry.bytesSent;
        this.uniqueUrls.add(entry.url);
        entry.ips.forEach(ip => this.uniqueIps.add(ip));

        if (entry.isBot) this.botRequests++;
        else this.humanRequests++;

        this.statusDistribution[entry.statusCode] = (this.statusDistribution[entry.statusCode] || 0) + 1;

        let dateStr = '';
        const dateMatch = entry.datetime.match(/(\d{2})\/(\w{3})\/(\d{4}):(\d{2})/);
        if (dateMatch) {
            const [, day, month, year, hour] = dateMatch;
            const monthNum = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
                              Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' }[month] || '01';
            dateStr = `${year}-${monthNum}-${day}`;
            const hourKey = `${dateStr} ${hour}:00`;
            this.hitsByDate[dateStr] = (this.hitsByDate[dateStr] || 0) + 1;
            this.hitsByHour[hourKey] = (this.hitsByHour[hourKey] || 0) + 1;
        }

        // URL stats
        if (!this.hitsByUrl[entry.url]) {
            this.hitsByUrl[entry.url] = {
                hits: 0, botHits: 0, humanHits: 0, bytesTotal: 0,
                statusCodes: {}, firstSeen: dateStr, lastSeen: dateStr
            };
        }
        const urlStats = this.hitsByUrl[entry.url];
        urlStats.hits++;
        urlStats.bytesTotal += entry.bytesSent;
        urlStats.statusCodes[entry.statusCode] = (urlStats.statusCodes[entry.statusCode] || 0) + 1;
        if (dateStr && dateStr > urlStats.lastSeen) urlStats.lastSeen = dateStr;
        if (dateStr && (!urlStats.firstSeen || dateStr < urlStats.firstSeen)) urlStats.firstSeen = dateStr;
        if (entry.isBot) urlStats.botHits++;
        else urlStats.humanHits++;

        // URL status codes
        if (!this.urlStatusCodes[entry.url]) {
            this.urlStatusCodes[entry.url] = { hits: 0, statusCodes: {}, bots: [], botHits: 0, humanHits: 0 };
        }
        this.urlStatusCodes[entry.url].hits++;
        this.urlStatusCodes[entry.url].statusCodes[entry.statusCode] =
            (this.urlStatusCodes[entry.url].statusCodes[entry.statusCode] || 0) + 1;
        if (entry.isBot) {
            if (!this.urlStatusCodes[entry.url].bots.includes(entry.botName)) {
                this.urlStatusCodes[entry.url].bots.push(entry.botName);
            }
            this.urlStatusCodes[entry.url].botHits++;
        } else {
            this.urlStatusCodes[entry.url].humanHits++;
        }

        // Bot stats
        if (entry.isBot && entry.botName) {
            if (!this.hitsByBot[entry.botName]) {
                this.hitsByBot[entry.botName] = {
                    hits: 0, category: entry.botCategory, uniqueUrls: [],
                    totalBytes: 0, isGoogle: entry.isGoogle, isAI: entry.isAI
                };
            }
            this.hitsByBot[entry.botName].hits++;
            if (!this.hitsByBot[entry.botName].uniqueUrls.includes(entry.url)) {
                this.hitsByBot[entry.botName].uniqueUrls.push(entry.url);
            }
            this.hitsByBot[entry.botName].totalBytes += entry.bytesSent;
            this.hitsByCategory[entry.botCategory] = (this.hitsByCategory[entry.botCategory] || 0) + 1;

            // Google bot URLs
            if (entry.isGoogle) {
                if (!this.googleBotUrls[entry.url]) {
                    this.googleBotUrls[entry.url] = {
                        hits: 0, totalBytes: 0, statusCodes: {},
                        firstSeen: dateStr, lastSeen: dateStr, bots: []
                    };
                }
                const gUrl = this.googleBotUrls[entry.url];
                gUrl.hits++;
                gUrl.totalBytes += entry.bytesSent;
                gUrl.statusCodes[entry.statusCode] = (gUrl.statusCodes[entry.statusCode] || 0) + 1;
                if (!gUrl.bots.includes(entry.botName)) gUrl.bots.push(entry.botName);
                if (dateStr && dateStr > gUrl.lastSeen) gUrl.lastSeen = dateStr;
                if (dateStr && (!gUrl.firstSeen || dateStr < gUrl.firstSeen)) gUrl.firstSeen = dateStr;
            }

            // AI bot URLs
            if (entry.isAI) {
                if (!this.aiBotUrls[entry.url]) {
                    this.aiBotUrls[entry.url] = {
                        hits: 0, totalBytes: 0, statusCodes: {},
                        firstSeen: dateStr, lastSeen: dateStr, bots: []
                    };
                }
                const aiUrl = this.aiBotUrls[entry.url];
                aiUrl.hits++;
                aiUrl.totalBytes += entry.bytesSent;
                aiUrl.statusCodes[entry.statusCode] = (aiUrl.statusCodes[entry.statusCode] || 0) + 1;
                if (!aiUrl.bots.includes(entry.botName)) aiUrl.bots.push(entry.botName);
                if (dateStr && dateStr > aiUrl.lastSeen) aiUrl.lastSeen = dateStr;
                if (dateStr && (!aiUrl.firstSeen || dateStr < aiUrl.firstSeen)) aiUrl.firstSeen = dateStr;
            }
        }

        this.hitsByMethod[entry.method] = (this.hitsByMethod[entry.method] || 0) + 1;
        this.hitsByDomain[entry.domain] = (this.hitsByDomain[entry.domain] || 0) + 1;
        this.hitsByServer[entry.server] = (this.hitsByServer[entry.server] || 0) + 1;
    }

    addFailedLine(line) {
        this.failedLines++;
        if (this.failedExamples.length < 5) {
            this.failedExamples.push(line.substring(0, 200));
        }
    }

    toJSON() {
        return {
            totalRequests: this.totalRequests,
            totalBytes: this.totalBytes,
            uniqueUrls: Array.from(this.uniqueUrls),
            uniqueIps: Array.from(this.uniqueIps),
            botRequests: this.botRequests,
            humanRequests: this.humanRequests,
            verifiedGooglebotRequests: 0,
            statusDistribution: this.statusDistribution,
            hitsByUrl: this.hitsByUrl,
            hitsByBot: this.hitsByBot,
            hitsByCategory: this.hitsByCategory,
            hitsByHour: this.hitsByHour,
            hitsByDate: this.hitsByDate,
            hitsByMethod: this.hitsByMethod,
            hitsByDomain: this.hitsByDomain,
            hitsByServer: this.hitsByServer,
            googleBotUrls: this.googleBotUrls,
            aiBotUrls: this.aiBotUrls,
            urlStatusCodes: this.urlStatusCodes,
            totalLines: this.totalLines,
            parsedLines: this.parsedLines,
            failedLines: this.failedLines,
            failedExamples: this.failedExamples,
            entryCount: this.parsedLines,
        };
    }
}

// Process a chunk of text, handling line boundaries
function processChunk(text, stats, isLastChunk) {
    const lines = text.split('\n');

    // If not the last chunk, the last line might be incomplete
    // Return it to be prepended to the next chunk
    let remainder = '';
    if (!isLastChunk && lines.length > 0) {
        remainder = lines.pop();
    }

    for (const line of lines) {
        if (!line.trim()) continue;
        stats.totalLines++;

        const entry = parseLogLine(line);
        if (!entry) {
            stats.addFailedLine(line);
            continue;
        }

        stats.parsedLines++;
        detectBot(entry);
        stats.addEntry(entry);
    }

    return remainder;
}

// Handle messages from main thread
self.onmessage = async function(e) {
    const { type, chunk, isFirstChunk, isLastChunk, fileIndex, totalFiles, remainder: prevRemainder } = e.data;

    if (type === 'init') {
        // Initialize new stats accumulator for this parsing session
        self.stats = new StatsAccumulator();
        self.postMessage({ type: 'ready' });
    }
    else if (type === 'chunk') {
        try {
            // Prepend remainder from previous chunk
            const text = (prevRemainder || '') + chunk;

            // Process this chunk
            const remainder = processChunk(text, self.stats, isLastChunk);

            // Report progress
            self.postMessage({
                type: 'chunk-done',
                fileIndex,
                totalFiles,
                remainder,
                linesProcessed: self.stats.parsedLines,
                isLastChunk
            });

            // If last chunk, send final stats
            if (isLastChunk) {
                self.postMessage({
                    type: 'file-done',
                    fileIndex,
                    stats: self.stats.toJSON()
                });
            }
        } catch (error) {
            self.postMessage({
                type: 'error',
                fileIndex,
                error: error.message
            });
        }
    }
    else if (type === 'reset-stats') {
        // Reset for next file
        self.stats = new StatsAccumulator();
        self.postMessage({ type: 'ready' });
    }
};
