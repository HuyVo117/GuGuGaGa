import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/api_service.dart';
import '../../models/product.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/favorite_provider.dart';
import '../product/product_detail_screen.dart';
import '../product/search_product_screen.dart';
import '../cart/cart_screen.dart';
import '../chat/chat_screen.dart';

class HomeScreen extends StatefulWidget {
  final Function(String?)? onCategorySelected;
  final Function(String)? onParentCategorySelected;
  const HomeScreen({super.key, this.onCategorySelected, this.onParentCategorySelected});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _apiService = ApiService();
  final ImagePicker _picker = ImagePicker();
  late Future<Map<String, dynamic>> _dataFuture;

  final List<Map<String, String>> _parentCategories = [
    {"name": "Các Loại Bánh", "icon": "🥞"},
    {"name": "Bún, Phở & Mỳ", "icon": "🍜"},
    {"name": "Cơm, Xôi & Cháo", "icon": "🍚"},
    {"name": "Canh & Cá Kho", "icon": "🍲"},
    {"name": "Món Ăn Vặt", "icon": "🍢"},
  ];

  final List<Map<String, dynamic>> _nearbyRestaurants = [
    {
      "name": "Bún bò Huế O Hương",
      "rating": 4.9,
      "reviews": 120,
      "distance": "2.1km",
      "time": "30 phút",
      "image": "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=500&auto=format&fit=crop&q=60",
    },
    {
      "name": "Phở bò gia truyền Hà Nội",
      "rating": 4.8,
      "reviews": 240,
      "distance": "1.5km",
      "time": "20 phút",
      "image": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&auto=format&fit=crop&q=60",
    },
    {
      "name": "Cơm tấm Sài Gòn 1989",
      "rating": 4.7,
      "reviews": 185,
      "distance": "3.2km",
      "time": "40 phút",
      "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60",
    },
  ];

  @override
  void initState() {
    super.initState();
    _dataFuture = _fetchData();
  }

  Future<Map<String, dynamic>> _fetchData() async {
    try {
      final bestSelling = await _apiService.getBestSellingProducts();
      final allProducts = await _apiService.getProducts();
      final categories = await _apiService.getCategories();
      return {
        'bestSelling': bestSelling,
        'allProducts': allProducts,
        'categories': categories
      };
    } catch (e) {
      throw Exception('Failed to load data: $e');
    }
  }

  double _getRealisticRating(Product product) {
    if (product.reviewCount > 0) return product.rating;
    return 4.5 + (product.id.hashCode.abs() % 5) * 0.1;
  }

  int _getRealisticReviews(Product product) {
    if (product.reviewCount > 0) return product.reviewCount;
    return 15 + (product.id.hashCode.abs() % 135);
  }

  int _getRealisticSales(Product product) {
    return 100 + (product.id.hashCode.abs() % 750);
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
    final cartProvider = Provider.of<CartProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);

    // Get personal greeting name
    String greetingName = 'Bạn';
    if (authProvider.isAuthenticated && authProvider.user != null) {
      final parts = authProvider.user!.name.trim().split(' ');
      if (parts.isNotEmpty) {
        greetingName = parts.last;
      }
    }

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: SafeArea(
        child: FutureBuilder<Map<String, dynamic>>(
          future: _dataFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            } else if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            } else if (!snapshot.hasData) {
              return const Center(child: Text('No data available'));
            }

            final bestSelling = snapshot.data!['bestSelling'] as List<Product>;
            final allProducts = snapshot.data!['allProducts'] as List<Product>;
            // Determine hot products (take some from all products, excluding top best selling if possible)
            final hotProducts = allProducts.length > bestSelling.length
                ? allProducts.sublist(bestSelling.length).take(5).toList()
                : allProducts;

            return RefreshIndicator(
              onRefresh: () async {
                setState(() {
                  _dataFuture = _fetchData();
                });
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // --- PREMIUM HEADER & WELCOME ---
                    Container(
                      padding: const EdgeInsets.fromLTRB(16, 20, 16, 16),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.vertical(
                          bottom: Radius.circular(24),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black12,
                            blurRadius: 10,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          // Welcome & Toolbar
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Xin chào $greetingName 👋',
                                    style: const TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Hôm nay bạn muốn ăn gì?',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                              Row(
                                children: [
                                  // AI Camera scanner button
                                  IconButton(
                                    icon: Icon(Icons.camera_alt_outlined, color: Colors.red.shade700, size: 28),
                                    tooltip: "Tìm món bằng AI",
                                    onPressed: _showImageSourceSelector,
                                  ),
                                  // Shopping Cart Badge
                                  Stack(
                                    children: [
                                      IconButton(
                                        icon: Icon(Icons.shopping_bag_outlined, color: Colors.red.shade700, size: 28),
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
                                          right: 6,
                                          top: 6,
                                          child: Container(
                                            padding: const EdgeInsets.all(4),
                                            decoration: const BoxDecoration(
                                              color: Colors.red,
                                              shape: BoxShape.circle,
                                            ),
                                            constraints: const BoxConstraints(
                                              minWidth: 18,
                                              minHeight: 18,
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
                            ],
                          ),
                          const SizedBox(height: 16),
                          // Search bar input
                          InkWell(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => const SearchProductScreen(),
                                ),
                              );
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.search, color: Colors.grey.shade500),
                                  const SizedBox(width: 12),
                                  Text(
                                    '🔍 Hôm nay ăn gì?',
                                    style: TextStyle(
                                      color: Colors.grey.shade500,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),

                    // --- BANNER PROMOTION SECTION ---
                    Container(
                      height: 160,
                      width: double.infinity,
                      margin: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.red.shade700, Colors.orange.shade600],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.red.withOpacity(0.2),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            right: -10,
                            bottom: -20,
                            child: Icon(
                              Icons.fastfood,
                              size: 140,
                              color: Colors.white.withOpacity(0.15),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(20.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: const BoxDecoration(
                                    color: Colors.white24,
                                    borderRadius: BorderRadius.all(Radius.circular(6)),
                                  ),
                                  child: const Text(
                                    '🎉 SIÊU ƯU ĐÃI',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'Giảm 20% cho tất cả Combo',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Áp dụng khi đặt hàng qua app hôm nay',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: Colors.white.withOpacity(0.9),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // --- QUICK CATEGORIES ---
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: const Text(
                        'Danh mục nhanh',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 100,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _parentCategories.length,
                        itemBuilder: (context, index) {
                          final parentCategory = _parentCategories[index];
                          return Container(
                            width: 100,
                            margin: const EdgeInsets.only(right: 12),
                            child: Card(
                              elevation: 0.5,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: BorderSide(color: Colors.grey.shade100),
                              ),
                              child: InkWell(
                                onTap: () {
                                  if (widget.onParentCategorySelected != null) {
                                    widget.onParentCategorySelected!(parentCategory["name"]!);
                                  }
                                },
                                borderRadius: BorderRadius.circular(16),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      parentCategory["icon"]!,
                                      style: const TextStyle(fontSize: 32),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      parentCategory["name"]!,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black87,
                                      ),
                                      textAlign: TextAlign.center,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 24),

                    // --- NEARBY RESTAURANTS (QUÁN GẦN BẠN) ---
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        children: [
                          Icon(Icons.location_on, color: Colors.red.shade700, size: 22),
                          const SizedBox(width: 6),
                          const Text(
                            'Quán gần bạn',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 120,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _nearbyRestaurants.length,
                        itemBuilder: (context, index) {
                          final rest = _nearbyRestaurants[index];
                          return Container(
                            width: 280,
                            margin: const EdgeInsets.only(right: 14),
                            child: Card(
                              elevation: 1,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(8.0),
                                child: Row(
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(12),
                                      child: Image.network(
                                        rest["image"]!,
                                        width: 90,
                                        height: 90,
                                        fit: BoxFit.cover,
                                        errorBuilder: (context, error, stackTrace) => Container(
                                          color: Colors.amber.shade50,
                                          width: 90,
                                          height: 90,
                                          child: const Icon(Icons.restaurant, size: 30),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            rest["name"]!,
                                            style: const TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.black87,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          const SizedBox(height: 6),
                                          Row(
                                            children: [
                                              const Icon(Icons.star, color: Colors.amber, size: 14),
                                              const SizedBox(width: 4),
                                              Text(
                                                '${rest["rating"]} (${rest["reviews"]})',
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          Row(
                                            children: [
                                              Icon(Icons.directions_walk, color: Colors.grey.shade600, size: 14),
                                              Text(
                                                ' ${rest["distance"]}',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: Colors.grey.shade600,
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              Icon(Icons.access_time, color: Colors.grey.shade600, size: 14),
                                              Text(
                                                ' ${rest["time"]}',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: Colors.grey.shade600,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 24),

                    // --- MÓN HOT HÔM NAY (WITH badge 🔥 HOT) ---
                    if (hotProducts.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              '🔥 Món hot hôm nay',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                            TextButton(
                              onPressed: () {
                                if (widget.onCategorySelected != null) {
                                  widget.onCategorySelected!(null); // Navigate to menu show all
                                }
                              },
                              child: const Text('Xem thêm'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 285,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: hotProducts.length,
                          itemBuilder: (context, index) {
                            final product = hotProducts[index];
                            return _buildProductCard(product, currencyFormat, isHot: true);
                          },
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],

                    // --- BEST SELLING (MÓN BÁN CHẠY) ---
                    if (bestSelling.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              '⭐ Món ngon bán chạy',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                            TextButton(
                              onPressed: () {
                                if (widget.onCategorySelected != null) {
                                  widget.onCategorySelected!(null); // Navigate to menu show all
                                }
                              },
                              child: const Text('Xem thêm'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 285,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: bestSelling.length,
                          itemBuilder: (context, index) {
                            final product = bestSelling[index];
                            return _buildProductCard(product, currencyFormat, isHot: false);
                          },
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  // --- HELPER TO BUILD BEAUTIFUL CUSTOM FOOD CARD ---
  Widget _buildProductCard(Product product, NumberFormat currencyFormat, {bool isHot = false}) {
    final rating = _getRealisticRating(product);
    final reviews = _getRealisticReviews(product);
    final sales = _getRealisticSales(product);

    return Container(
      width: 190,
      margin: const EdgeInsets.only(right: 14, bottom: 4),
      child: Card(
        elevation: 1.5,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        child: InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ProductDetailScreen(product: product),
              ),
            );
          },
          borderRadius: BorderRadius.circular(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image container with rounded top corner and cover fit
              Stack(
                children: [
                  Container(
                    height: 130,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.amber.shade50,
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(16),
                      ),
                    ),
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(16),
                      ),
                      child: product.image != null && product.image!.isNotEmpty
                          ? Image.network(
                              product.image!,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => const Center(
                                child: Icon(Icons.broken_image, size: 50),
                              ),
                            )
                          : const Center(
                              child: Text(
                                '🍗',
                                style: TextStyle(fontSize: 50),
                              ),
                            ),
                    ),
                  ),
                  // 🔥 HOT Badge
                  if (isHot)
                    Positioned(
                      top: 10,
                      left: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Colors.orange.shade800, Colors.red.shade700],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: const [
                            BoxShadow(
                              color: Colors.black12,
                              blurRadius: 4,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.whatshot, color: Colors.white, size: 12),
                            SizedBox(width: 2),
                            Text(
                              'HOT',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 9.5,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  // Chat AI floating shortcut on Image
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.4),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        padding: EdgeInsets.zero,
                        icon: const Icon(
                          Icons.chat_outlined,
                          color: Colors.white,
                          size: 15,
                        ),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ChatScreen(product: product),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  // Favorite Heart button directly on Card
                  Positioned(
                    bottom: 10,
                    right: 10,
                    child: Consumer<FavoriteProvider>(
                      builder: (context, favoriteProvider, child) {
                        final isFav = favoriteProvider.isFavorite(product.id);
                        return Container(
                          width: 32,
                          height: 32,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black12,
                                blurRadius: 4,
                                offset: Offset(0, 2),
                              ),
                            ],
                          ),
                          child: IconButton(
                            padding: EdgeInsets.zero,
                            icon: Icon(
                              isFav ? Icons.favorite : Icons.favorite_border,
                              color: isFav ? Colors.red : Colors.grey,
                              size: 16,
                            ),
                            onPressed: () {
                              favoriteProvider.toggleFavorite(product.id);
                            },
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
              // Content Padding
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Rating stats
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 14),
                        const SizedBox(width: 2),
                        Text(
                          '${rating.toStringAsFixed(1)} ($reviews)',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade800,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    // Product Title
                    Text(
                      product.name,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    // Sales count
                    Text(
                      'Đã bán $sales+',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey.shade500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    // Product Price (formatted in VND)
                    Text(
                      currencyFormat.format(product.price),
                      style: TextStyle(
                        fontSize: 15,
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

  // --- AI FOOD RECOGNITION BLOCK ---
  Future<void> _recognizeFood(ImageSource source) async {
    try {
      final XFile? file = await _picker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );

      if (file == null) return;

      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: Card(
            child: Padding(
              padding: EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text("AI đang nhận diện món ăn..."),
                ],
              ),
            ),
          ),
        ),
      );

      final bytes = await file.readAsBytes();
      final result = await _apiService.recognizeFood(bytes, file.name);
      
      if (mounted) {
        Navigator.pop(context);
      }

      final String detectedName = result['detectedFoodName'] ?? "Không rõ";
      final List<dynamic> productsJson = result['matchedProducts'] ?? [];
      final List<Product> matchedProducts = productsJson.map((json) => Product.fromJson(json)).toList();

      if (matchedProducts.length == 1) {
        if (!mounted) return;
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProductDetailScreen(product: matchedProducts.first),
          ),
        );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("AI nhận dạng: ${matchedProducts.first.name}"),
            backgroundColor: Colors.green.shade600,
          ),
        );
        return;
      }

      if (!mounted) return;
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (context) {
          final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
              top: 16,
              left: 16,
              right: 16,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Row(
                  children: [
                    Icon(Icons.psychology, color: Colors.red),
                    SizedBox(width: 8),
                    Text(
                      "Kết Quả Nhận Diện AI",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  "Món ăn nhận diện: $detectedName",
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  "Món tương ứng trong thực đơn:",
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 8),
                if (matchedProducts.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: Text(
                        "Không tìm thấy món tương ứng trong thực đơn.",
                        style: TextStyle(color: Colors.grey),
                      ),
                    ),
                  )
                else
                  Flexible(
                    child: ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: matchedProducts.length,
                      itemBuilder: (context, index) {
                        final product = matchedProducts[index];
                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 6),
                          child: ListTile(
                            leading: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: product.image != null && product.image!.isNotEmpty
                                  ? Image.network(
                                      product.image!,
                                      width: 50,
                                      height: 50,
                                      fit: BoxFit.cover,
                                    )
                                  : Container(
                                      color: Colors.amber[50],
                                      width: 50,
                                      height: 50,
                                      child: const Center(child: Text("🍗")),
                                    ),
                            ),
                            title: Text(
                              product.name,
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            subtitle: Text(
                              currencyFormat.format(product.price),
                              style: TextStyle(color: Colors.red.shade700),
                            ),
                            trailing: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red.shade700,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              ),
                              onPressed: () {
                                Navigator.pop(context);
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => ProductDetailScreen(product: product),
                                  ),
                                );
                              },
                              child: const Text("Chi tiết"),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      );

    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Lỗi nhận diện AI: $e")),
        );
      }
    }
  }

  void _showImageSourceSelector() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const ListTile(
              title: Text(
                "Tìm kiếm bằng hình ảnh",
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              leading: Icon(Icons.search),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text("Chụp ảnh mới"),
              onTap: () {
                Navigator.pop(context);
                _recognizeFood(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text("Chọn từ thư viện"),
              onTap: () {
                Navigator.pop(context);
                _recognizeFood(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }
}
