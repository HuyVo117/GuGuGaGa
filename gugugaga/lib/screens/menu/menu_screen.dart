import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../models/category.dart';
import '../../models/product.dart';
import '../../models/combo.dart';
import '../../providers/cart_provider.dart';
import '../../providers/favorite_provider.dart';
import '../product/product_detail_screen.dart';
import '../combo/combo_detail_screen.dart';
import '../cart/cart_screen.dart';
import '../chat/chat_screen.dart';

class MenuScreen extends StatefulWidget {
  final String? initialCategoryId;
  final String? initialParentCategory;
  const MenuScreen({super.key, this.initialCategoryId, this.initialParentCategory});

  @override
  State<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen> {
  final ApiService _apiService = ApiService();
  String? _selectedParentCategory;
  String? _selectedSubCategoryId;
  List<Product> _products = [];
  List<Combo> _combos = [];
  List<Category> _categories = [];
  bool _isLoading = true;

  // Grouping mapping of Parent Categories to sub-category Display Names from DB
  final Map<String, List<String>> _parentCategoryMapping = {
    "Các Loại Bánh": [
      "Bánh Bèo",
      "Bánh Bột Lọc",
      "Bánh Căn",
      "Bánh Chưng",
      "Bánh Cuốn",
      "Bánh Đúc",
      "Bánh Giò",
      "Bánh Khọt",
      "Bánh Mì",
      "Bánh Pía",
      "Bánh Tét",
      "Bánh Tráng Nướng",
      "Bánh Xèo"
    ],
    "Bún, Phở & Mỳ": [
      "Bún Bò Huế",
      "Bún Đậu Mắm Tôm",
      "Bún Mắm",
      "Bún Riêu",
      "Bún Thịt Nướng",
      "Bánh Canh",
      "Cao Lầu",
      "Hủ Tiếu",
      "Mỳ Quảng",
      "Phở"
    ],
    "Cơm, Xôi & Cháo": [
      "Cơm Tấm",
      "Cháo Lòng",
      "Xôi Xéo"
    ],
    "Canh & Cá Kho": [
      "Cá Kho Tộ",
      "Canh Chua"
    ],
    "Món Ăn Vặt": [
      "Gỏi Cuốn",
      "Nem Chua"
    ]
  };

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });
    try {
      final categories = await _apiService.getCategories();
      _categories = categories;

      if (widget.initialParentCategory != null) {
        _selectedParentCategory = widget.initialParentCategory;
        _selectedSubCategoryId = null;
      } else if (widget.initialCategoryId != null) {
        // Resolve parent category matching the initial category ID
        final initialCat = categories.firstWhere(
          (cat) => cat.id == widget.initialCategoryId,
          orElse: () => Category(id: '', name: ''),
        );
        
        if (initialCat.name.isNotEmpty) {
          String? foundParent;
          _parentCategoryMapping.forEach((parent, subList) {
            if (subList.contains(initialCat.name)) {
              foundParent = parent;
            }
          });
          
          if (foundParent != null) {
            _selectedParentCategory = foundParent;
            _selectedSubCategoryId = widget.initialCategoryId;
          }
        }
      } else {
        // Default to the first parent category to avoid showing all 30 at once
        _selectedParentCategory = _parentCategoryMapping.keys.first;
        _selectedSubCategoryId = null;
      }

      // Load products based on selections
      List<Product> products = [];
      List<Combo> combos = [];
      
      if (_selectedSubCategoryId != null) {
        products = await _apiService.getProducts(categoryId: _selectedSubCategoryId);
        combos = await _apiService.getCombos(categoryId: _selectedSubCategoryId);
      } else if (_selectedParentCategory != null) {
        final allProducts = await _apiService.getProducts(categoryId: null);
        final allCombos = await _apiService.getCombos(categoryId: null);
        final allowedCategoryNames = _parentCategoryMapping[_selectedParentCategory] ?? [];
        products = allProducts.where((p) => allowedCategoryNames.contains(p.category.name)).toList();
        combos = allCombos.where((c) => allowedCategoryNames.contains(c.category.name)).toList();
      } else {
        products = await _apiService.getProducts(categoryId: null);
        combos = await _apiService.getCombos(categoryId: null);
      }

      if (mounted) {
        setState(() {
          _products = products;
          _combos = combos;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading menu data: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _selectParentCategory(String? parentCategory) async {
    setState(() {
      _selectedParentCategory = parentCategory;
      _selectedSubCategoryId = null; // Reset sub-category selection
      _isLoading = true;
    });

    try {
      if (parentCategory == null) {
        // "Tất cả"
        final products = await _apiService.getProducts(categoryId: null);
        final combos = await _apiService.getCombos(categoryId: null);
        if (mounted) {
          setState(() {
            _products = products;
            _combos = combos;
            _isLoading = false;
          });
        }
      } else {
        // Parent category selected - get all products, filter client-side
        final allProducts = await _apiService.getProducts(categoryId: null);
        final allCombos = await _apiService.getCombos(categoryId: null);
        
        final allowedCategoryNames = _parentCategoryMapping[parentCategory] ?? [];
        
        if (mounted) {
          setState(() {
            _products = allProducts.where((p) => allowedCategoryNames.contains(p.category.name)).toList();
            _combos = allCombos.where((c) => allowedCategoryNames.contains(c.category.name)).toList();
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      print('Error filtering by parent category: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _selectSubCategory(String? subCategoryId) async {
    setState(() {
      _selectedSubCategoryId = subCategoryId;
      _isLoading = true;
    });

    try {
      if (subCategoryId == null) {
        // "Tất cả" inside this parent category group
        final allProducts = await _apiService.getProducts(categoryId: null);
        final allCombos = await _apiService.getCombos(categoryId: null);
        
        final allowedCategoryNames = _parentCategoryMapping[_selectedParentCategory] ?? [];
        
        if (mounted) {
          setState(() {
            _products = allProducts.where((p) => allowedCategoryNames.contains(p.category.name)).toList();
            _combos = allCombos.where((c) => allowedCategoryNames.contains(c.category.name)).toList();
            _isLoading = false;
          });
        }
      } else {
        // Specific sub-category ID selected
        final products = await _apiService.getProducts(categoryId: subCategoryId);
        final combos = await _apiService.getCombos(categoryId: subCategoryId);
        if (mounted) {
          setState(() {
            _products = products;
            _combos = combos;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      print('Error filtering by sub category: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartProvider = Provider.of<CartProvider>(context);
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thực đơn'),
        backgroundColor: Colors.red.shade700,
        foregroundColor: Colors.white,
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const CartScreen(),
                    ),
                  );
                },
              ),
              if (cartProvider.itemCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      '${cartProvider.itemCount}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Parent Categories Slider
                Container(
                  height: 60,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _ParentCategoryChip(
                        name: 'Tất cả',
                        isSelected: _selectedParentCategory == null,
                        onTap: () => _selectParentCategory(null),
                      ),
                      ..._parentCategoryMapping.keys.map(
                        (parentName) => _ParentCategoryChip(
                          name: parentName,
                          isSelected: _selectedParentCategory == parentName,
                          onTap: () => _selectParentCategory(parentName),
                        ),
                      ),
                    ],
                  ),
                ),
                // Sub-categories Slider (Only show if a parent category is selected)
                if (_selectedParentCategory != null)
                  Container(
                    height: 50,
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      border: Border(
                        bottom: BorderSide(color: Colors.grey.shade200, width: 0.5),
                      ),
                    ),
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        _SubCategoryChip(
                          name: 'Tất cả ${_selectedParentCategory == "Các Loại Bánh" ? "Bánh" : _selectedParentCategory == "Bún, Phở & Mỳ" ? "Bún/Phở" : _selectedParentCategory == "Cơm, Xôi & Cháo" ? "Cơm/Cháo" : "Món"}',
                          isSelected: _selectedSubCategoryId == null,
                          onTap: () => _selectSubCategory(null),
                        ),
                        ..._categories
                            .where((cat) => (_parentCategoryMapping[_selectedParentCategory] ?? []).contains(cat.name))
                            .map(
                              (category) => _SubCategoryChip(
                                name: category.name,
                                isSelected: _selectedSubCategoryId == category.id,
                                onTap: () => _selectSubCategory(category.id),
                              ),
                            ),
                      ],
                    ),
                  ),
                // Products and Combos
                Expanded(
                  child: _products.isEmpty && _combos.isEmpty
                      ? const Center(
                          child: Text('Không có sản phẩm nào'),
                        )
                      : ListView(
                          padding: const EdgeInsets.all(16),
                          children: [
                            // Combos Section
                            if (_combos.isNotEmpty) ...[
                              Container(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                child: const Row(
                                  children: [
                                    Icon(Icons.star, color: Colors.orange),
                                    SizedBox(width: 8),
                                    Text(
                                      'Combo Siêu Hời',
                                      style: TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.orange,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 12),
                              ..._combos.map(
                                (combo) => _ComboCard(
                                  combo: combo,
                                  currencyFormat: currencyFormat,
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => ComboDetailScreen(
                                          combo: combo,
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                              const SizedBox(height: 24),
                            ],
                            // Products Section
                            if (_selectedParentCategory != null) ...[
                              // Single Category or Parent Group View
                              if (_products.isNotEmpty) ...[
                                Text(
                                  _selectedSubCategoryId != null
                                      ? _categories.firstWhere((cat) => cat.id == _selectedSubCategoryId, orElse: () => Category(id: '', name: '')).name
                                      : _selectedParentCategory!,
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                ..._products.map(
                                  (product) => _ProductCard(
                                    product: product,
                                    currencyFormat: currencyFormat,
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) =>
                                              ProductDetailScreen(
                                            product: product,
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ],
                            ] else ...[
                              // All Categories View (Grouped)
                              ..._buildGroupedProducts(context, currencyFormat),
                            ],
                          ],
                        ),
                ),
              ],
            ),
    );
  }
  List<Widget> _buildGroupedProducts(
      BuildContext context, NumberFormat currencyFormat) {
    List<Widget> widgets = [];
    
    // Group products by category
    Map<String, List<Product>> groupedProducts = {};
    for (var product in _products) {
      if (!groupedProducts.containsKey(product.category.name)) {
        groupedProducts[product.category.name] = [];
      }
      groupedProducts[product.category.name]!.add(product);
    }

    // Create widgets for each group
    groupedProducts.forEach((categoryName, products) {
      widgets.add(
        Padding(
          padding: const EdgeInsets.only(bottom: 12, top: 12),
          child: Text(
            categoryName,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.red,
            ),
          ),
        ),
      );
      widgets.addAll(
        products.map(
          (product) => _ProductCard(
            product: product,
            currencyFormat: currencyFormat,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ProductDetailScreen(
                    product: product,
                  ),
                ),
              );
            },
          ),
        ),
      );
      widgets.add(const SizedBox(height: 12));
    });

    return widgets;
  }
}

class _ParentCategoryChip extends StatelessWidget {
  final String name;
  final bool isSelected;
  final VoidCallback onTap;

  const _ParentCategoryChip({
    required this.name,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.red.shade700 : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(25),
        ),
        child: Center(
          child: Text(
            name,
            style: TextStyle(
              color: isSelected ? Colors.white : Colors.black87,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }
}

class _SubCategoryChip extends StatelessWidget {
  final String name;
  final bool isSelected;
  final VoidCallback onTap;

  const _SubCategoryChip({
    required this.name,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? Colors.orange.shade700 : Colors.white,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(
            color: isSelected ? Colors.orange.shade700 : Colors.grey.shade300,
            width: 1,
          ),
        ),
        child: Center(
          child: Text(
            name,
            style: TextStyle(
              color: isSelected ? Colors.white : Colors.grey.shade700,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final Product product;
  final NumberFormat currencyFormat;
  final VoidCallback onTap;

  const _ProductCard({
    required this.product,
    required this.currencyFormat,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: product.image != null && product.image!.isNotEmpty
                      ? Image.network(
                          product.image!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return const Center(
                              child: Icon(Icons.broken_image, size: 40),
                            );
                          },
                        )
                      : const Center(
                          child: Text(
                            '🍗',
                            style: TextStyle(fontSize: 40),
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (product.desc != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        product.desc!,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 8),
                    Text(
                      currencyFormat.format(product.price),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.red.shade700,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Consumer<FavoriteProvider>(
                builder: (context, favoriteProvider, child) {
                  final isFav = favoriteProvider.isFavorite(product.id);
                  return IconButton(
                    icon: Icon(
                      isFav ? Icons.favorite : Icons.favorite_border,
                      color: isFav ? Colors.red : Colors.grey.shade400,
                    ),
                    onPressed: () {
                      favoriteProvider.toggleFavorite(product.id);
                    },
                  );
                },
              ),
              IconButton(
                icon: Icon(Icons.chat_outlined, color: Colors.red.shade700),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ChatScreen(product: product),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ComboCard extends StatelessWidget {
  final Combo combo;
  final NumberFormat currencyFormat;
  final VoidCallback onTap;

  const _ComboCard({
    required this.combo,
    required this.currencyFormat,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: Colors.orange.shade50,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.orange.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: combo.image != null && combo.image!.isNotEmpty
                      ? Image.network(
                          combo.image!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return const Center(
                              child: Icon(Icons.broken_image, size: 40),
                            );
                          },
                        )
                      : const Center(
                          child: Text(
                            '🍱',
                            style: TextStyle(fontSize: 40),
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.orange.shade700,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'COMBO',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      combo.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (combo.desc != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        combo.desc!,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 8),
                    Text(
                      currencyFormat.format(combo.price),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.red.shade700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

