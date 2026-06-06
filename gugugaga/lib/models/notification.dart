class Notification {
  final String id;
  final String title;
  final String message;
  final DateTime createdAt;
  final bool isRead;

  Notification({
    required this.id,
    required this.title,
    required this.message,
    required this.createdAt,
    this.isRead = false,
  });

  factory Notification.fromJson(Map<String, dynamic> json) {
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

    return Notification(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      createdAt: parseDate(json['createdAt']),
      isRead: json['isRead'] ?? false,
    );
  }
}

