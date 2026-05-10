const fs = require('fs');
const path = require('path');

const files = [
  'd:\\ĐA NEN TANG giua ki\\GuGuGaGa\\gugugaga\\lib\\services\\api_service.dart',
  'd:\\ĐA NEN TANG giua ki\\GuGuGaGa\\gugugaga\\lib\\services\\ai_service.dart',
  'd:\\ĐA NEN TANG giua ki\\GuGuGaGa\\gugugaga\\lib\\providers\\cart_provider.dart',
  'd:\\ĐA NEN TANG giua ki\\GuGuGaGa\\gugugaga\\lib\\providers\\auth_provider.dart'
];

const patterns = [
  { from: /int branchId/g, to: 'String branchId' },
  { from: /int\? branchId/g, to: 'String? branchId' },
  { from: /int cartItemId/g, to: 'String cartItemId' },
  { from: /int orderId/g, to: 'String orderId' },
  { from: /int backendId/g, to: 'String backendId' },
  { from: /final int id;/g, to: 'final String id;' },
  { from: /int forceId/g, to: 'String forceId' },
  { from: /int\? forceId/g, to: 'String? forceId' },
];

for (const filePath of files) {
  if (!fs.existsSync(filePath)) continue;
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
