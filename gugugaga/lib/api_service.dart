import 'dart:convert';

import 'package:http/http.dart' as http;

import 'constants.dart';

class ApiService {
  Future<List<dynamic>> getPublicProducts() async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/public/products');
    final response = await http.get(uri);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final map = jsonDecode(response.body) as Map<String, dynamic>;
      return map['items'] as List<dynamic>? ?? [];
    }

    throw Exception('Failed to load products');
  }
}
