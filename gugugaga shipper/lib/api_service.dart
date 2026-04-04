import 'dart:convert';

import 'package:http/http.dart' as http;

import 'constants.dart';

class ApiService {
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
}
