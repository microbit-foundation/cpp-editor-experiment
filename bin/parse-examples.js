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
        result.editorjson = fs.readFileSync(path.join(dir, "editor.json"), "utf-8");
    } catch {}

    return result;
}

function writeExamplesJSON(examples) {
    const json = {
        result: examples.map((example) => {
            return {
                _id: example.id,
                name: example.name,
                image:{ 
                    _type: "simpleImage",
                    alt: "img",
                    asset: "https://picsum.photos/200/300" //placeholder
                },
                content: [{
                    main: example.content.source,
                    _key: 0,
                    _type: "cpp"
                },{
                    _type: "block",
                    _key: 1,
                    children: [
                        example.content.readme,
                    ],
                    markDefs: [
                        ""
                    ],
                    style: ""
                }],
                language: "en",
                slug:{
                    _type: "slug",
                    current: example.name,
                }
            }
        })
        
        // [{
        //     _id:1,
        //     name:"Blink Display",
        //     image:{
        //         _type: "simpleImage",
        //         alt: "img",
        //         asset: "https://picsum.photos/200/300"
        //     },
        //     content: [{
        //         _type: "block",
        //         _key: 0,
        //         children: [
        //             "Hello World",
        //             "This is an auto generated example"
        //         ],
        //         markDefs: [
        //             ""
        //         ],
        //         style: ""
        //     }],
        //     language:"en",
        //     slug:{
        //         "_type":"slug",
        //         "current":"hi"
        //     }
        // }]
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