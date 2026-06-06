import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/notification.dart' as model;
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  final ApiService _apiService = ApiService();
  List<model.Notification> _notifications = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications({bool silent = false}) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    if (!authProvider.isAuthenticated || authProvider.token == null) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Vui lòng đăng nhập để xem thông báo';
        });
      }
      return;
    }

    if (!silent && mounted) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      final notificationsData = await _apiService.getNotifications(authProvider.token!);
      final List<model.Notification> loaded = [];
      for (var item in notificationsData) {
        loaded.add(model.Notification.fromJson(item));
      }
      
      if (mounted) {
        setState(() {
          _notifications = loaded;
          _isLoading = false;
          _errorMessage = null;
        });
      }
    } catch (e) {
      print('DEBUG: Error loading notifications: $e');
      if (mounted && !silent) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Không thể tải thông báo: ${e.toString()}';
        });
      }
    }
  }

  Future<void> _markAsRead(String notificationId) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.token == null) return;
    try {
      await _apiService.markNotificationAsRead(notificationId, authProvider.token!);
      // Reload silently to keep UX smooth
      _loadNotifications(silent: true);
    } catch (e) {
      print('DEBUG: Error marking notification as read: $e');
    }
  }

  Future<void> _markAllAsRead() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.token == null) return;
    try {
      await _apiService.markAllNotificationsAsRead(authProvider.token!);
      _loadNotifications(silent: true);
    } catch (e) {
      print('DEBUG: Error marking all notifications as read: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');

    // If auth state changes to logged out, reset state
    if (!authProvider.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Thông báo'),
          backgroundColor: Colors.red.shade700,
          foregroundColor: Colors.white,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.notifications_none,
                size: 80,
                color: Colors.grey.shade400,
              ),
              const SizedBox(height: 16),
              const Text(
                'Vui lòng đăng nhập để xem thông báo',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Thông báo'),
          backgroundColor: Colors.red.shade700,
          foregroundColor: Colors.white,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Thông báo'),
          backgroundColor: Colors.red.shade700,
          foregroundColor: Colors.white,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 80, color: Colors.grey.shade400),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => _loadNotifications(),
                child: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông báo'),
        backgroundColor: Colors.red.shade700,
        foregroundColor: Colors.white,
        actions: _notifications.any((n) => !n.isRead)
            ? [
                TextButton(
                  onPressed: _markAllAsRead,
                  child: const Text(
                    'Đọc tất cả',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
              ]
            : null,
      ),
      body: RefreshIndicator(
        onRefresh: () => _loadNotifications(silent: true),
        child: _notifications.isEmpty
            ? ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.notifications_none,
                          size: 80,
                          color: Colors.grey.shade400,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Chưa có thông báo nào',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              )
            : ListView.builder(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                itemCount: _notifications.length,
                itemBuilder: (context, index) {
                  final notification = _notifications[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    color: notification.isRead ? Colors.white : Colors.red.shade50,
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: notification.isRead
                            ? Colors.grey.shade300
                            : Colors.red.shade700,
                        child: Icon(
                          Icons.notifications,
                          color: notification.isRead
                              ? Colors.grey.shade600
                              : Colors.white,
                        ),
                      ),
                      title: Text(
                        notification.title,
                        style: TextStyle(
                          fontWeight: notification.isRead
                              ? FontWeight.normal
                              : FontWeight.bold,
                        ),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 4),
                          Text(notification.message),
                          const SizedBox(height: 4),
                          Text(
                            dateFormat.format(notification.createdAt),
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                      trailing: notification.isRead
                          ? null
                          : Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Colors.red,
                                shape: BoxShape.circle,
                              ),
                            ),
                      onTap: () {
                        if (!notification.isRead) {
                          _markAsRead(notification.id);
                        }
                      },
                    ),
                  );
                },
              ),
      ),
    );
  }
}
