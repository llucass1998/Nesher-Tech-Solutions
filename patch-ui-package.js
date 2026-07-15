const fs = require('fs');
const file = 'packages/ui/package.json';
let json = JSON.parse(fs.readFileSync(file, 'utf8'));
json.name = '@logipeople/ui';
fs.writeFileSync(file, JSON.stringify(json, null, 2));
