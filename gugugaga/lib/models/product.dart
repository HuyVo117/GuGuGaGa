import 'category.dart';

class Product {
  final String id;
  final String categoryId;
  final Category category;
  final String name;
  final int price;
  final String? desc;
  final String? image;
  final DateTime createdAt;
  final DateTime updatedAt;
  final double rating;
  final int reviewCount;

  Product({
    required this.id,
    required this.categoryId,
    required this.category,
    required this.name,
    required this.price,
    this.desc,
    this.image,
    required this.createdAt,
    required this.updatedAt,
    this.rating = 5.0,
    this.reviewCount = 0,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      categoryId: json['categoryId'],
      category: json['category'] != null 
          ? Category.fromJson(json['category']) 
          : Category(id: '0', name: 'Unknown'),
      name: json['name'],
      price: json['price'],
      desc: json['desc'],
      image: json['image'],
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
      rating: json['rating'] != null ? (json['rating'] as num).toDouble() : 5.0,
      reviewCount: json['reviewCount'] ?? 0,
    );
  }

  static DateTime _parseDate(dynamic value) {
    if (value == null) return DateTime.now();
    if (value is String) {
      return (DateTime.tryParse(value) ?? DateTime.now()).toLocal();
    }
    if (value is Map) {
      final seconds = value['_seconds'] ?? value['seconds'];
      if (seconds != null) {
        return DateTime.fromMillisecondsSinceEpoch(seconds * 1000).toLocal();
      }
    }
    return DateTime.now();
  }
}
