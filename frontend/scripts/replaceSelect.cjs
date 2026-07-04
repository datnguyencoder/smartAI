const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Check if it imports Select from antd
  if (/import\s+\{.*?\bSelect\b.*?\}.*?from\s+['"]antd['"]/.test(content)) {
    // Remove Select from the antd import
    content = content.replace(/(import\s+\{[^\}]*?)\bSelect\b,?\s*([^\}]*\}.*?from\s+['"]antd['"])/, (match, p1, p2) => {
      // If p1 ends with comma, remove it or just clean up
      let cleanP1 = p1.trim();
      if (cleanP1.endsWith(',')) cleanP1 = cleanP1.slice(0, -1);
      
      return `${cleanP1}${p2}`;
    });
    
    // Clean up empty imports like import {  } from 'antd'
    content = content.replace(/import\s+\{\s*,\s*\}/g, 'import { }');
    content = content.replace(/import\s+\{\s*\}\s*from\s+['"]antd['"];?\n?/g, '');
    
    // Add import { Select } from '@/components/ui'
    if (!content.includes("import { Select } from '@/components/ui'")) {
      const importUiMatch = content.match(/import\s+\{[^\}]*\}\s+from\s+['"]@\/components\/ui['"];?/);
      if (importUiMatch) {
        // Add to existing ui import
        content = content.replace(/(import\s+\{[^\}]*?)(\}\s+from\s+['"]@\/components\/ui['"];?)/, "$1, Select $2");
      } else {
        // Add new import
        content = `import { Select } from '@/components/ui';\n` + content;
      }
    }
    
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
  }
});
