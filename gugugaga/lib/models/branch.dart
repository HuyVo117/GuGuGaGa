class Branch {
  final String id;
  final String name;
  final String? phone;
  final String? address;
  final DateTime createdAt;
  final DateTime updatedAt;

  final double? latitude;
  final double? longitude;

  Branch({
    required this.id,
    required this.name,
    this.phone,
    this.address,
    required this.createdAt,
    required this.updatedAt,
    this.latitude,
    this.longitude,
  });

  factory Branch.fromJson(Map<String, dynamic> json) {
    DateTime parseDate(dynamic value) {
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

    return Branch(
      id: json['id'],
      name: json['name'],
      phone: json['phone'],
      address: json['address'],
      createdAt: parseDate(json['createdAt']),
      updatedAt: parseDate(json['updatedAt']),
      latitude: json['latitude'] != null ? (json['latitude'] as num).toDouble() : null,
      longitude: json['longitude'] != null ? (json['longitude'] as num).toDouble() : null,
    );
  }
}

