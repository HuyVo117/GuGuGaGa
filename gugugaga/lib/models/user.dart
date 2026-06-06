enum Role {
  CUSTOMER,
  ADMIN,
  DRIVER,
}

class User {
  final String id;
  final String name;
  final String email;
  final String phone;
  final Role role;
  final String? address;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    this.address,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      role: Role.values.firstWhere(
        (e) => e.toString() == 'Role.${json['role']}',
        orElse: () => Role.CUSTOMER,
      ),
      address: json['address']?.toString(),
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
    );
  }

  static DateTime _parseDate(dynamic value) {
    if (value == null) return DateTime.now();
    if (value is String) {
      return (DateTime.tryParse(value) ?? DateTime.now()).toLocal();
    }
    if (value is Map) {
      // Firestore Timestamp format: {_seconds: ..., _nanoseconds: ...}
      final seconds = value['_seconds'] ?? value['seconds'];
      if (seconds != null) {
        return DateTime.fromMillisecondsSinceEpoch(seconds * 1000).toLocal();
      }
    }
    return DateTime.now();
  }
}

