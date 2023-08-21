const fs = require('fs');
const path = require('path');

function parseExample(dir) {
    // Parse:
    //  - /source/main.cpp (TODO: multiple files?)
    //  - README.md
    //  - editor.json 

    const result = {};
    result.source = fs.readFileSync(path.join(dir, "source/main.cpp"), "utf-8");
    result.readme = fs.readFileSync(path.join(dir, "README.md"), "utf-8");

    //Optional
    try {
        result.editorjson = JSON.parse(fs.readFileSync(path.join(dir, "editor.json"), "utf-8"));
    } catch {}

    return result;
}

function writeExamplesJSON(examples) {
    const json = {
        result: examples.map((example) => {
            return {
                _id: example.id,
                name: example.name,
                markdownContent: [{_type:"code", content:example.content.source}, {_type:"block", content:example.content.readme}],
                language: "en",
                slug:{
                    _type: "slug",
                    current: example.content.editorjson?.slug || example.name,
                }
            }
        })
    }
    fs.writeFileSync(
        path.join(__dirname, "../public/examples.json"),
        JSON.stringify(json)
    );
    console.log(examples);
}

const ignoreDirs = [
    ".git",
    "Example-Template"
]
const repoDir = path.join(__dirname, '../codal-microbit-examples')

const examples = [];

const files = fs.readdirSync(repoDir);
for (const file of files) {
    const filePath = path.join(repoDir, file);
    const stat = fs.statSync(filePath);

    //maybe just check for correct format xx-name-of-example
    if (stat.isDirectory() && !ignoreDirs.includes(file)) {
        try {
            const nameParts = file.split("-");
            const id = nameParts[0];
            const name = nameParts.slice(1).join("-");  //just incase the name has a '-' in it
            examples.push({
                id,
                name,
                content: parseExample(filePath),
            })
        } catch (e) {
            console.error(`Failed to parse example ${file}`)
            console.error(e);
        }
    }
}

writeExamplesJSON(examples);