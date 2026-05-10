const fs = require('fs');
const path = require('path');

const apps = [
  'd:\\ĐA NEN TANG giua ki\\GuGuGaGa\\gugugaga\\lib\\models',
  'd:\\ĐA NEN TANG giua ki\\GuGuGaGa\\gugugaga shipper\\chickengoo\\lib\\models'
];

const patterns = [
  { from: /final int id;/g, to: 'final String id;' },
  { from: /final int categoryId;/g, to: 'final String categoryId;' },
  { from: /final int userId;/g, to: 'final String userId;' },
  { from: /final int branchId;/g, to: 'final String branchId;' },
  { from: /final int orderId;/g, to: 'final String orderId;' },
  { from: /final int\? productId;/g, to: 'final String? productId;' },
  { from: /final int\? comboId;/g, to: 'final String? comboId;' },
  { from: /final int comboId;/g, to: 'final String comboId;' },
  { from: /final int productId;/g, to: 'final String productId;' },
];

for (const dir of apps) {
  if (!fs.existsSync(dir)) continue;
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.dart'));
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    let modified = false;
    for (const { from, to } of patterns) {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
}
