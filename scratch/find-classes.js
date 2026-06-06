const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, files);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = walk('./src');
const classSet = new Set();

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Match both className="..." and className={`...`}
  const regex = /className=(?:["']([^"']*)["']|\{`([^`]*)`\})/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const clsString = match[1] || match[2] || '';
    clsString.split(/\s+/).forEach(c => {
      // Remove dynamic interpolation parts for basic analysis
      const clean = c.replace(/\$\{.*?\}/g, '').trim();
      if (clean) classSet.add(clean);
    });
  }
});

const relevantClasses = Array.from(classSet)
  .filter(c => c.includes('white') || c.includes('slate-') || c.includes('black'))
  .sort();
  
console.log(relevantClasses.join('\n'));
