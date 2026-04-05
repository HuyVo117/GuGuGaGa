import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants.dart';

class ApiService {
  Future<Map<String, dynamic>> login(String phone, String password) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}/shipper/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'phone': phone, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        final payload = Map<String, dynamic>.from(data['data'] ?? {});
        final prefs = await SharedPreferences.getInstance();
        final token = payload['token']?.toString();
        final driver = payload['driver'];

        if (token != null && token.isNotEmpty) {
          await prefs.setString('token', token);
        }
        if (driver != null) {
          await prefs.setString('driver', json.encode(driver));
        }

        return payload;
      }
    }
    throw Exception('Đăng nhập thất bại: ${response.body}');
  }

  Future<List<dynamic>> getAssignedOrders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    
    if (token == null) throw Exception('Chưa đăng nhập');

    final response = await http.get(
      Uri.parse('${AppConstants.baseUrl}/shipper/orders'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        return List<dynamic>.from(data['data'] ?? []);
      }
    }

    print('Failed to fetch orders: ${response.statusCode} - ${response.body}');
    throw Exception('Lấy danh sách đơn hàng thất bại: ${response.statusCode} - ${response.body}');
  }

  Future<void> updateOrderStatus(int orderId, String status) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    if (token == null) throw Exception('Chưa đăng nhập');

    final response = await http.patch(
      Uri.parse('${AppConstants.baseUrl}/shipper/orders/$orderId/status'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: json.encode({'status': status}),
    );

    if (response.statusCode != 200) {
       throw Exception('Cập nhật trạng thái thất bại: ${response.body}');
    }
  }

  Future<void> updateLocation(double latitude, double longitude) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    if (token == null) return; // Fail silently or throw, but for background tracking silent is often better

    try {
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/shipper/location'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'latitude': latitude,
          'longitude': longitude,
        }),
      );
      
      if (response.statusCode != 200) {
        print('Update location failed: ${response.body}');
      }
    } catch (e) {
      print('Update location error: $e');
    }
  }
  
  
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
