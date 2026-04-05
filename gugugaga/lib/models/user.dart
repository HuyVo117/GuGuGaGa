enum Role {
  CUSTOMER,
  ADMIN,
  DRIVER,
}

class User {
  final int id;
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
      id: json['id'],
      name: json['name'],
      email: json['email'],
      phone: json['phone'],
      role: Role.values.firstWhere(
        (e) => e.toString() == 'Role.${json['role']}',
        orElse: () => Role.CUSTOMER,
      ),
      address: json['address'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}

