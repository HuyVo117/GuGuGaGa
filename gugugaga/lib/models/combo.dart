import 'category.dart';
import 'product.dart';

class Combo {
  final int id;
  final int categoryId;
  final Category category;
  final String name;
  final int price;
  final String? desc;
  final String? image;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<ComboItem> comboItems;

  Combo({
    required this.id,
    required this.categoryId,
    required this.category,
    required this.name,
    required this.price,
    this.desc,
    this.image,
    required this.createdAt,
    required this.updatedAt,
    required this.comboItems,
  });

  factory Combo.fromJson(Map<String, dynamic> json) {
    return Combo(
      id: json['id'],
      categoryId: json['categoryId'],
      category: json['category'] != null 
          ? Category.fromJson(json['category']) 
          : Category(id: 0, name: 'Unknown'),
      name: json['name'],
      price: json['price'],
      desc: json['desc'],
      image: json['image'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      comboItems: (json['comboItems'] as List?)
              ?.map((e) => ComboItem.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class ComboItem {
  final int id;
  final int comboId;
  final int productId;
  final int quantity;
  final Product? product;

  ComboItem({
    required this.id,
    required this.comboId,
    required this.productId,
    required this.quantity,
    this.product,
  });

  factory ComboItem.fromJson(Map<String, dynamic> json) {
    return ComboItem(
      id: json['id'],
      comboId: json['comboId'],
      productId: json['productId'],
      quantity: json['quantity'],
      product: json['product'] != null
          ? Product.fromJson(json['product'])
          : null,
    );
  }
}

