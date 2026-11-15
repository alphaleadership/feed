/**
 * Registre centralisé des sources de données de fuites.
 * - SOURCES : sources actives (id canonique), type, URL, mapper vers le schéma interne.
 * - BLACKLIST : sources interdites (jamais fetchées).
 * - normalizeSource(value) : normalise toute valeur de champ `source` vers un id canonique.
 */

// Garde-fou : un titre d'article (URL, long, ou > 10 mots) n'est pas un nom de fuite.
// On essaie d'extraire un nom court (avant ':' ou ' - '), sinon l'entrée est ignorée (Name vide).
function shortName(title) {
    const t = String(title || '').trim();
    if (t.toLowerCase().indexOf('http') !== -1) return '';
    if (t.length > 80) return '';
    if (t.split(' ').filter(Boolean).length > 10) return '';
    let cut = t;
    for (const sep of [': ', ' - ', ' – ', ' — ']) {
        const i = cut.indexOf(sep);
        if (i !== -1) cut = cut.slice(0, i);
    }
    cut = cut.trim();
    if (cut.length >= 3 && cut.length <= 60) return cut;
    return t.length <= 60 ? t : '';
}

const rssMapper = (sourceId) => (remote) => ({
    Name: shortName(remote.title),
    Title: remote.title,
    Domain: (() => { try { const h = new URL(remote.link).hostname; return h.startsWith('www.') ? h.slice(4) : h; } catch { return ''; } })(),
    BreachDate: remote.pubDate ? new Date(remote.pubDate).toISOString().split('T')[0] : '1970-01-01',
    PwnCount: 0,
    Description: remote.contentSnippet || remote.content || "",
    DataClasses: remote.categories || [],
    IsSensitive: false,
    IsVerified: true, IsFabricated: false, IsSpam: false, IsRetired: false, IsNative: true,
    LogoPath: "",
    source: sourceId
});

const SOURCES = [
    {
        id: "haveibeenpwned.com",
        name: "Have I Been Pwned",
        url: 'https://haveibeenpwned.com/api/v3/breaches',
        type: 'json',
        enabled: true,
        selector: (data) => data,
        mapper: (remote) => ({
            Name: remote.Name,
            Title: remote.Title,
            Domain: remote.Domain,
            BreachDate: remote.BreachDate,
            PwnCount: remote.PwnCount,
            Description: remote.Description,
            DataClasses: remote.DataClasses,
            IsSensitive: remote.IsSensitive,
            IsVerified: remote.IsVerified,
            IsFabricated: remote.IsFabricated,
            IsSpam: remote.IsSpam,
            IsRetired: remote.IsRetired,
            IsNative: remote.IsNative,
            LogoPath: remote.LogoPath,
            source: "haveibeenpwned.com"
        })
    },
    {
        id: "xposedornot.com",
        name: "XposedOrNot",
        url: 'https://api.xposedornot.com/v1/breaches',
        type: 'json',
        enabled: true,
        selector: (data) => data.exposedBreaches || [],
        mapper: (remote) => ({
            Name: remote.breachID,
            Title: remote.breachID,
            Domain: remote.domain || "",
            BreachDate: remote.breachedDate ? remote.breachedDate.split('T')[0] : '1970-01-01',
            PwnCount: remote.exposedRecords || 0,
            Description: remote.exposureDescription || "",
            DataClasses: remote.exposedData || [],
            IsSensitive: remote.sensitive || false,
            IsVerified: remote.verified || true,
            IsFabricated: false, IsSpam: false, IsRetired: false, IsNative: true,
            LogoPath: remote.logo || "",
            source: "xposedornot.com"
        })
    },
    {
        id: "frenchbreaches.com",
        name: "French Breaches",
        url: 'https://frenchbreaches.com/feed.xml',
        type: 'rss',
        enabled: true,
        selector: (feed) => feed.items || [],
        mapper: rssMapper("frenchbreaches.com")
    },
    {
        id: "databreaches.net",
        name: "DataBreaches.net",
        url: 'https://databreaches.net/feed/',
        type: 'rss',
        enabled: true,
        selector: (feed) => feed.items || [],
        mapper: rssMapper("databreaches.net")
    },
    {
        id: "zataz.com",
        name: "Zataz",
        url: 'https://www.zataz.com/feed/',
        type: 'rss',
        enabled: true,
        selector: (feed) => feed.items || [],
        mapper: rssMapper("zataz.com")
    },
    {
        id: "bing.com/news (fuite de données)",
        name: "Bing News FR - fuites de donnees",
        url: 'https://www.bing.com/news/search?q=fuite+de+donn%C3%A9es+piratage&format=rss&cc=fr&setlang=fr',
        type: 'rss',
        enabled: true,
        selector: (feed) => feed.items || [],
        mapper: rssMapper("bing.com/news (fuite de données)")
    },
    {
        id: "bing.com/news (ransomware)",
        name: "Bing News FR - ransomware",
        url: 'https://www.bing.com/news/search?q=ransomware+victime+France+cyberattaque&format=rss&cc=fr&setlang=fr',
        type: 'rss',
        enabled: true,
        selector: (feed) => feed.items || [],
        mapper: rssMapper("bing.com/news (ransomware)")
    }
];

/** Sources blacklistées : jamais fetchées. */
const BLACKLIST = [
    { id: "christopheboutry.com", reason: "403 legacy_app_only - source blacklistée, ne plus utiliser" }
];

const BLACKLISTED_IDS = BLACKLIST.map(b => b.id);

function isBlacklisted(domainOrId) {
    if (!domainOrId) return false;
    const d = String(domainOrId).toLowerCase();
    return BLACKLISTED_IDS.some(b => d === b || d.includes(b));
}

/**
 * Normalise une valeur de champ `source` :
 * URL complète -> domaine ; domaine connu -> id de source ;
 * blacklisté -> "blacklisted:<domaine>" ; vide -> "Manuel".
 */
function normalizeSource(value) {
    if (!value || !String(value).trim()) return "Manuel";
    let v = String(value).trim();
    if (v.startsWith("http://") || v.startsWith("https://") || v.includes('/')) {
        try { v = new URL(v).hostname; } catch { /* garder tel quel */ }
    }
    v = v.toLowerCase();
    if (v.startsWith("www.")) v = v.slice(4);
    if (v === "manuel") return "Manuel";
    if (v.startsWith("blacklisted:")) return v;
    if (isBlacklisted(v)) return "blacklisted:" + v;
    const bare = v.split(' (')[0];
    const known = SOURCES.find(s => v === s.id || bare === s.id || v.endsWith('.' + s.id) || bare.endsWith('.' + s.id));
    if (known) return known.id;
    return v;
}

module.exports = { SOURCES, BLACKLIST, normalizeSource, isBlacklisted };
