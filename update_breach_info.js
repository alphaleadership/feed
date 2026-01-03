const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const BREACHES_JSON_PATH = 'source/_data/breaches.json';
const URL_TO_SCRAPE = 'https://bonjourlafuite.eu.org/';

// Helper to normalize strings for matching
const normalizeString = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize("NFD") // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()']/g, "") // Remove special characters
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single one
        .trim();
};

const run = async () => {
    try {
        // 1. Fetch data from the URL
        console.log(`Fetching data from ${URL_TO_SCRAPE}...`);
        const { data: html } = await axios.get(URL_TO_SCRAPE);
        const $ = cheerio.load(html);

        // 2. Scrape data and create a map
        const scrapedData = new Map();
        $('.timeline-entry').each((i, element) => {
            const name = $('h2', element).text().trim();
            const normalizedName = normalizeString(name);

            const descriptionP = $('.timeline-description p', element).first();
            const p_text = descriptionP.text();
            
            const victimMatch = p_text.trim().match(/^([\d\s.,]+)/);
            
            if (normalizedName && victimMatch && victimMatch[1]) {
                const victimCountText = victimMatch[1].trim();
                scrapedData.set(normalizedName, victimCountText);
            }
        });
        console.log(`Found ${scrapedData.size} potential breaches with victim counts from the URL.`);

        // 3. Load the local breaches.json file
        console.log(`Loading local data from ${BREACHES_JSON_PATH}...`);
        const localData = JSON.parse(fs.readFileSync(BREACHES_JSON_PATH, 'utf-8'));

        // 4. Iterate and update local data
        let updatedCount = 0;
        localData.breaches.forEach(breach => {
            const normalizedBreachName = normalizeString(breach.Name);
            const normalizedBreachTitle = normalizeString(breach.Title);

            const key = [normalizedBreachName, normalizedBreachTitle].find(k => scrapedData.has(k));

            if (key) {
                const victimText = scrapedData.get(key);
                
                const victimCount = parseInt(victimText.replace(/[\s,.]/g, ''), 10);
                if (!isNaN(victimCount)) {
                    breach.pwnCountFr = victimCount;
                    breach.sourceFr = URL_TO_SCRAPE;
                    breach.victimTextFr = victimText.trim();
                    updatedCount++;
                }
            }
        });

        console.log(`Updated ${updatedCount} records in the local data.`);

        // 5. Save the updated file
        console.log(`Saving updated data back to ${BREACHES_JSON_PATH}...`);
        fs.writeFileSync(BREACHES_JSON_PATH, JSON.stringify(localData, null, 2));

        console.log('Update complete!');

    } catch (error) {
        console.error('An error occurred:', error.message);
    }
};

run();
