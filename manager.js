const { getBreachesDB } = require('./scripts/db');
const fs = require('fs');

async function run() {
    const db = await getBreachesDB();
    const data = db.data;
    
    fs.writeFileSync("./data.txt", "");
    data.breaches
        .filter((item) => !item.IsRetired)
        .forEach((item) => {
            fs.appendFileSync("./data.txt", `${item.Name}:${item.slug}\n`);
        });
}

run().catch(console.error);
