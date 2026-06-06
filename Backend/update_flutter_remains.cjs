const fs = require('fs');

const files = [
  {
    path: 'd:\\ĐA NEN TANG giua ki\\GuGuGaGa\\gugugaga\\lib\\models\\product.dart',
    replace: [{ from: /Category\(id: 0/g, to: "Category(id: '0'" }]
  },
  {
    path: 'd:\\ĐA NEN TANG giua ki\\GuGuGaGa\\gugugaga\\lib\\models\\combo.dart',
    replace: [{ from: /Category\(id: 0/g, to: "Category(id: '0'" }]
  },
  {
    path: 'd:\\ĐA NEN TANG giua ki\\GuGuGaGa\\gugugaga\\lib\\screens\\menu\\menu_screen.dart',
    replace: [
      { from: /int\? _selectedCategoryId/g, to: "String? _selectedCategoryId" },
      { from: /Category\(id: 0/g, to: "Category(id: '0'" }
    ]
  },
  {
    path: 'd:\\ĐA NEN TANG giua ki\\GuGuGaGa\\gugugaga\\lib\\screens\\notification\\notification_screen.dart',
    replace: [
      { from: /id: 1,/g, to: "id: '1'," },
      { from: /id: 2,/g, to: "id: '2'," }
    ]
  }
];

for (const {path, replace} of files) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    for (const r of replace) {
      content = content.replace(r.from, r.to);
    }
    fs.writeFileSync(path, content, 'utf8');
    console.log('Updated ' + path);
  }
}
