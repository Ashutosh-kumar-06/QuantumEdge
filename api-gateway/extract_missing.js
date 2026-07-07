const fs = require('fs');
const path = require('path');
const seedStr = fs.readFileSync('seed.js', 'utf8');

// Use regex or eval to get the curriculum array
// Since it's a JS file, we can just extract the curriculum array via eval
const match = seedStr.match(/const curriculum = (\[[\s\S]*?\]);\n\nconst fs = require/);
if (match) {
    const curriculumCode = match[1];
    const curriculum = eval(curriculumCode);
    
    curriculum.forEach(mod => {
        const filePath = path.join(__dirname, 'content', `${mod.id}.md`);
        if (!fs.existsSync(filePath)) {
            console.log(`Creating missing file: ${mod.id}.md`);
            fs.writeFileSync(filePath, mod.content, 'utf8');
        }
    });
} else {
    console.error("Could not parse curriculum from seed.js");
}
