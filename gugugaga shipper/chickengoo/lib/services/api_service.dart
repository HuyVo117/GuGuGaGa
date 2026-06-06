import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/branch.dart';
import '../models/product.dart';
import '../models/category.dart';
import '../models/combo.dart';

import '../constants.dart';

class ApiService {
  // Use 10.0.2.2 for Android emulator to access localhost of the host machine
  // Use localhost for iOS simulator
  // Use your machine's IP for physical devices
  // static const String baseUrl = 'http://192.168.2.42:5001/api';

  // Auth
  Future<Map<String, dynamic>> login(String phone, String password) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}/user/auth/sign-in'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'phone': phone, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        return data['data']; // Returns { user: {...}, token: "..." }
      }
    }
    throw Exception('Đăng nhập thất bại: ${response.body}');
  }

  Future<Map<String, dynamic>> register(
    String name,
    String phone,
    String email,
    String password,
  ) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}/user/auth/sign-up'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'name': name,
        'phone': phone,
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 201) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        return data['data'];
      }
    }
    throw Exception('Đăng ký thất bại: ${response.body}');
  }

  Future<void> resetPassword(String phone, String newPassword, {String? token}) async {
    final headers = {'Content-Type': 'application/json'};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}/user/auth/reset-password'),
      headers: headers,
      body: json.encode({
        'phone': phone,
        'newPassword': newPassword,
      }),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        return;
      }
    }
    throw Exception('Đặt lại mật khẩu thất bại: ${response.body}');
  }

  Future<List<Product>> getProducts({int? categoryId}) async {
    String url = '${AppConstants.baseUrl}/products';
    if (categoryId != null) {
      url += '?categoryId=$categoryId';
    }
    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        final List<dynamic> productsJson = data['data'];
        return productsJson.map((json) => Product.fromJson(json)).toList();
      }
    }
    throw Exception('Failed to load products');
  }

  Future<List<Category>> getCategories() async {
    final response = await http
        .get(Uri.parse('${AppConstants.baseUrl}/categories'))
        .timeout(const Duration(seconds: 10));
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        final List<dynamic> categoriesJson = data['data'];
        return categoriesJson.map((json) => Category.fromJson(json)).toList();
      }
    }
    throw Exception('Failed to load categories');
  }

  Future<List<Combo>> getCombos({int? categoryId}) async {
    String url = '${AppConstants.baseUrl}/combos';
    if (categoryId != null) {
      url += '?categoryId=$categoryId';
    }
    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        final List<dynamic> combosJson = data['data'];
        return combosJson.map((json) => Combo.fromJson(json)).toList();
      }
    }
    throw Exception('Failed to load combos');
  }

  Future<List<Product>> getBestSellingProducts() async {
    // For now, just get all products and take top 3
    // In real app, should have a specific API endpoint
    final products = await getProducts();
    return products.take(3).toList();
  }

  // Cart APIs
  Future<Map<String, dynamic>> getCart(int branchId, String token) async {
    final response = await http.get(
      Uri.parse('${AppConstants.baseUrl}/user/carts?branchId=$branchId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        return data['data'];
      }
    }
    throw Exception('Failed to load cart: ${response.body}');
  }

  Future<Map<String, dynamic>> createCart(int branchId, String token) async {
    final response = await http
        .post(
          Uri.parse('${AppConstants.baseUrl}/user/carts/create'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: json.encode({'branchId': branchId}),
        )
        .timeout(const Duration(seconds: 5));

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        return data['data'];
      }
    }
    throw Exception('Failed to create cart: ${response.body}');
  }

  Future<Map<String, dynamic>> addToCart(
    int branchId,
    int? productId,
    int? comboId,
    int quantity,
    String token,
  ) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}/user/carts/add'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: json.encode({
        'branchId': branchId,
        'productId': productId,
        'comboId': comboId,
        'quantity': quantity,
      }),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        return data['data'];
      }
    }
    throw Exception('Failed to add to cart: ${response.body}');
  }

  Future<Map<String, dynamic>> updateCartItem(
    int cartItemId,
    int quantity,
    String token,
  ) async {
    final response = await http.put(
      Uri.parse('${AppConstants.baseUrl}/user/carts/$cartItemId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: json.encode({'quantity': quantity}),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        return data['data'];
      }
    }
    throw Exception('Failed to update cart item: ${response.body}');
  }

  Future<Map<String, dynamic>> removeCartItem(
    int cartItemId,
    String token,
  ) async {
    final response = await http.delete(
      Uri.parse('${AppConstants.baseUrl}/user/carts/$cartItemId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        return data['data'];
      }
    }
    throw Exception('Failed to remove cart item: ${response.body}');
  }

  // Order APIs
  Future<Map<String, dynamic>> createOrder({
    required int branchId,
    required String paymentMethod,
    required String deliveryAddress,
    required String deliveryPhone,
    required String token,
    double? latitude,
    double? longitude,
  }) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}/user/orders/create'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: json.encode({
        'branchId': branchId,
        'paymentMethod': paymentMethod,
        'deliveryAddress': deliveryAddress,
        'deliveryPhone': deliveryPhone,
        'latitude': latitude,
        'longitude': longitude,
      }),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        return data['data'];
      }
    }
    throw Exception('Failed to create order: ${response.body}');
  }

  Future<List<Map<String, dynamic>>> getOrders(String token) async {
    final response = await http.get(
      Uri.parse('${AppConstants.baseUrl}/user/orders'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        return List<Map<String, dynamic>>.from(data['data']);
      }
    }
    throw Exception('Failed to load orders: ${response.body}');
  }

  Future<Map<String, dynamic>> getOrderDetail(int orderId, String token) async {
    final response = await http.get(
      Uri.parse('${AppConstants.baseUrl}/user/orders/$orderId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        return data['data'];
      }
    }
    throw Exception('Failed to load order detail: ${response.body}');
  }

  Future<List<Branch>> getBranches() async {
    final response = await http
        .get(Uri.parse('${AppConstants.baseUrl}/branches'))
        .timeout(const Duration(seconds: 10));
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        final List<dynamic> branchesJson = data['data'];
        return branchesJson.map((json) => Branch.fromJson(json)).toList();
      }
    }
    throw Exception('Failed to load branches');
  }
}
