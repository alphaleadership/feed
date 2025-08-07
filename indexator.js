const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, './source/CVE');
const termsToReplaceRaw = fs.readFileSync('terme.txt', 'utf8').trim();
const termsToReplace = termsToReplaceRaw ? termsToReplaceRaw.split('\n').map(term => ({
    search: `${term}`,
    replace: ` [[${term}]]`
})) : [];
function replaceTermsInFile(filePath) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.log(err);
            return;
        }

        // Delete rejected CVEs
        if (data.toLowerCase().includes("description : rejected") ||
            data.includes("Rejected reason: ** REJECT ** DO NOT USE THIS CANDIDATE NUMBER")) {
            fs.unlink(filePath, err => {
                if (err) {
                    console.log(err);
                }
            });
            return;
        }

        // Process file content
        let result = data.replace(/[[\\]\]/g, "").replace(/[[ \\\\] \\ \\ ]]/g, "");
        let modified = false;
        
        // Apply term replacements
        for (const term of termsToReplace) {
            const searchPattern = new RegExp(term.search, 'g');
            const searchPatternWithParens = new RegExp("(" + term.search + ")", 'g');

            if (searchPattern.test(result) || searchPatternWithParens.test(result)) {
                modified = true;
                result = result.replace(searchPattern, term.replace)
                           .replace(searchPatternWithParens, term.replace);
            }
        }

        // Find new terms to add
        const regex = /[[\\w+]]\]\]]/g;
        let match;
        let newTerms = [];

        while ((match = regex.exec(result)) !== null) {
            const term = match[0].replace(/[[\\]\]/g, ''); 
            if (!termsToReplace.some(t => t.replace === ` [[${term}]]`) &&
                !newTerms.includes(term)) {
                newTerms.push(term);
            }
        }

        // Add new terms if found
        if (newTerms.length > 0) {
            fs.appendFile('terme.txt', newTerms.join('\n') + '\n', 'utf8', err => {
                if (err) {
                    console.log(err);
                }
                // Add new terms to our in-memory array
                for (const term of newTerms) {
                    termsToReplace.push({
                        search: ` ${term}`,
                        replace: ` [[${term}]]`
                    });
                }
            });
        }

        // Only write back if modified
        if (modified) {
            fs.writeFile(filePath, result.replace(/[[\\]\]/g, ""), 'utf8', err => {
                if (err) {
                    console.log(err);
                }
            });
        }
    });
}

function walkDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
            walkDir(itemPath);
        } else if (stats.isFile() && path.extname(item) === '.md') {
            replaceTermsInFile(itemPath);
        }
    }
}

//walkDir(directoryPath);
