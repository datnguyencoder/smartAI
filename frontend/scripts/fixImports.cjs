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

const replacements = {
  'ModalTable': 'Modal, Table',
  'ModalSwitch': 'Modal, Switch',
  'ModalSpace': 'Modal, Space',
  'ModalTag': 'Modal, Tag',
  'InputTable': 'Input, Table',
  'InputButton': 'Input, Button',
  'ButtonTable': 'Button, Table',
  'ButtonModal': 'Button, Modal',
  'Buttonmessage': 'Button, message',
  'TableDatePicker': 'Table, DatePicker',
  'TabsCheckbox': 'Tabs, Checkbox',
  'ProgressSteps': 'Progress, Steps'
};

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('antd')) {
    for (const [bad, good] of Object.entries(replacements)) {
      if (content.includes(bad)) {
        content = content.replace(new RegExp(`\\b${bad}\\b`, 'g'), good);
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', file);
  }
});
