const fs = require('fs');
const path = require('path');

const referenceTopics = {}
const referenceDir = path.join(__dirname, '../reference')

const files = fs.readdirSync(referenceDir);
for (const file of files) {
    const filePath = path.join(referenceDir, file);

    if(!file.endsWith(".md")) continue;

    try {
        referenceTopics[file] = fs.readFileSync(filePath, "utf-8");
    } catch (e) {
        console.error(`Failed to parse ${file}`)
        console.error(e);
    }
}

fs.writeFileSync(
    path.join(__dirname, "../public/reference.json"),
    JSON.stringify({
        result: referenceTopics
    })
);