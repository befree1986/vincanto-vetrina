const fs = require('fs');
const lines = fs.readFileSync('src/pages/AdminPanelPro.tsx', 'utf8').split('\n');
const returns = lines.findIndex(l => l.includes('<div className="admin-panel-pro'));
console.log('div admin-panel-pro at:', returns);
if (returns > -1) {
    console.log(lines.slice(returns, returns + 50).join('\n'));
}
