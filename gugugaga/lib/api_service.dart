import 'dart:convert';

import 'package:http/http.dart' as http;

import 'constants.dart';

class ApiService {
  Future<Map<String, dynamic>> register(String email, String password) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/user/auth/register');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    throw Exception('Register failed');
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/user/auth/login');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    throw Exception('Login failed');
  }

  Future<List<dynamic>> getPublicProducts() async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/public/products');
    final response = await http.get(uri);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final map = jsonDecode(response.body) as Map<String, dynamic>;
      return map['items'] as List<dynamic>? ?? [];
    }

    throw Exception('Failed to load products');
  }

  Future<List<dynamic>> getPublicBranches() async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/public/branches');
    final response = await http.get(uri);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final map = jsonDecode(response.body) as Map<String, dynamic>;
      return map['items'] as List<dynamic>? ?? [];
    }

    throw Exception('Failed to load branches');
  }

  Future<Map<String, dynamic>> createOrder({
    required String token,
    required int branchId,
    required List<Map<String, dynamic>> items,
  }) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/user/orders');
    final response = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'branchId': branchId,
        'paymentMethod': 'COD',
        'items': items,
      }),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }

    throw Exception('Create order failed');
  }

  Future<List<dynamic>> getUserOrders(String token) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/user/orders');
    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final map = jsonDecode(response.body) as Map<String, dynamic>;
      return map['items'] as List<dynamic>? ?? [];
    }

    throw Exception('Failed to load user orders');
  }
}
