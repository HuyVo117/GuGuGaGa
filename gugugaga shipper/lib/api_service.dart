import 'dart:convert';

import 'package:http/http.dart' as http;

import 'constants.dart';

class ApiService {
  Future<Map<String, dynamic>> login(String email, String password) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/shipper/auth/login');
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

  Future<List<dynamic>> getAvailableOrders(String token) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/shipper/orders/available');
    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final map = jsonDecode(response.body) as Map<String, dynamic>;
      return map['items'] as List<dynamic>? ?? [];
    }

    throw Exception('Failed to load available orders');
  }

  Future<void> acceptOrder(String token, int id) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/shipper/orders/$id/accept');
    final response = await http.post(
      uri,
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to accept order');
    }
  }

  Future<List<dynamic>> getAssignedOrders(String token) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/shipper/orders');
    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final map = jsonDecode(response.body) as Map<String, dynamic>;
      return map['items'] as List<dynamic>? ?? [];
    }

    throw Exception('Failed to load assigned orders');
  }

  Future<void> updateOrderStatus(String token, int id, String statusOrder) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/shipper/orders/$id/status');
    final response = await http.patch(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'statusOrder': statusOrder}),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to update order status');
    }
  }

  Future<void> sendLocation(String token, double lat, double lng) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/shipper/location');
    final response = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'lat': lat, 'lng': lng}),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to send location');
    }
  }
}
