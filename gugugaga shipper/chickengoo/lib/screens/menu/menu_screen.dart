import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../models/category.dart';
import '../../models/product.dart';
import '../../models/combo.dart';
import '../../providers/cart_provider.dart';
import '../product/product_detail_screen.dart';
import '../combo/combo_detail_screen.dart';
import '../cart/cart_screen.dart';

class MenuScreen extends StatefulWidget {
  const MenuScreen({super.key});

  @override
  State<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen> {
  final ApiService _apiService = ApiService();
  int? _selectedCategoryId;
  List<Product> _products = [];
  List<Combo> _combos = [];
  List<Category> _categories = [];
  bool _isLoading = true;

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
      final products = await _apiService.getProducts(categoryId: _selectedCategoryId);
      final combos = await _apiService.getCombos(categoryId: _selectedCategoryId);
      
      if (mounted) {
        setState(() {
          _categories = categories;
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

  Future<void> _filterByCategory(int? categoryId) async {
    setState(() {
      _selectedCategoryId = categoryId;
      _isLoading = true;
    });
    try {
      final products = await _apiService.getProducts(categoryId: categoryId);
      final combos = await _apiService.getCombos(categoryId: categoryId);
      
      if (mounted) {
        setState(() {
          _products = products;
          _combos = combos;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error filtering menu data: $e');
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
                // Categories
                Container(
                  height: 70,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _CategoryChip(
                        category: Category(id: 0, name: 'Tất cả'),
                        isSelected: _selectedCategoryId == null,
                        onTap: () => _filterByCategory(null),
                      ),
                      ..._categories.map(
                        (category) => _CategoryChip(
                          category: category,
                          isSelected: _selectedCategoryId == category.id,
                          onTap: () => _filterByCategory(category.id),
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
                            if (_selectedCategoryId != null) ...[
                              // Single Category View
                              if (_products.isNotEmpty) ...[
                                const Text(
                                  'Món ăn',
                                  style: TextStyle(
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

class _CategoryChip extends StatelessWidget {
  final Category category;
  final bool isSelected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.category,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 6),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.red.shade700 : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(25),
        ),
        child: Text(
          category.name,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.black87,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
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

