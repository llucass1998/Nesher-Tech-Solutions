const fs = require('fs');
const file = 'apps/logidesk-web/package.json';
let json = JSON.parse(fs.readFileSync(file, 'utf8'));
json.dependencies['@logipeople/ui'] = '0.1.0';
fs.writeFileSync(file, JSON.stringify(json, null, 2));
