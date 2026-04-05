class Driver {
  final int id;
  final String name;
  final String phone;
  final double? latitude;
  final double? longitude;

  Driver({
    required this.id,
    required this.name,
    required this.phone,
    this.latitude,
    this.longitude,
  });

  factory Driver.fromJson(Map<String, dynamic> json) {
    return Driver(
      id: json['id'],
      name: json['name'],
      phone: json['phone'],
      latitude: json['latitude'] != null ? (json['latitude'] as num).toDouble() : null,
      longitude: json['longitude'] != null ? (json['longitude'] as num).toDouble() : null,
    );
  }
}
