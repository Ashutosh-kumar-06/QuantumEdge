const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, 'content');
const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));

let totalFixed = 0;

for (const file of files) {
    const filePath = path.join(contentDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove stray <MiniSimulator> wrapper tags that subagents sometimes put outside the code block
    content = content.replace(/<MiniSimulator>\s*```simulator/g, '```simulator');
    content = content.replace(/```\s*<\/MiniSimulator>/g, '```');

    // Replace simulator blocks that do not contain 'type:'
    content = content.replace(/```simulator\n([\s\S]*?)```/g, (match, inner) => {
        if (!inner.includes('type:')) {
            totalFixed++;
            // Provide a default valid simulator
            return "```simulator\ntype: circuit-demo\ngates: H,X,M\n```";
        }
        return match;
    });

    // Also fix cases where they put XML inside the simulator block like <MiniSimulator type="..." />
    content = content.replace(/```simulator\n<MiniSimulator type="([^"]+)" \/>\n```/g, (match, typeName) => {
        totalFixed++;
        if (typeName.includes('matrix')) return "```simulator\ntype: circuit-demo\ngates: H,X,M\n```";
        return "```simulator\ntype: circuit-demo\ngates: H,M\n```";
    });

    fs.writeFileSync(filePath, content, 'utf8');
}

console.log(`Fixed ${totalFixed} invalid simulator blocks across ${files.length} markdown files.`);
