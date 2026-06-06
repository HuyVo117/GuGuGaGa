import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../home/home_screen.dart';
import '../menu/menu_screen.dart';
import '../notification/notification_screen.dart';
import '../account/account_screen.dart';
import '../branch/branch_selection_screen.dart';
import '../chat/chat_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const MenuScreen(),
    const NotificationScreen(),
    const AccountScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    print('DEBUG: MainScreen build. Selected branch: ${authProvider.selectedBranch?.name}');
    
    if (authProvider.selectedBranch == null) {
      print('DEBUG: MainScreen - showing BranchSelectionScreen');
      return const BranchSelectionScreen();
    }
    print('DEBUG: MainScreen - showing Scaffold');

    // Load cart if not loaded
    // We use a post-frame callback to avoid calling setState during build
    if (authProvider.isAuthenticated && authProvider.token != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final cartProvider = Provider.of<CartProvider>(context, listen: false);
        // Only load if we haven't loaded for this branch yet? 
        // For now, let's just load it. To avoid infinite loop, we might need a flag.
        // Or better, just call it. But calling it every build is bad.
        // Let's rely on the fact that MainScreen rebuilds when AuthProvider changes.
        // But we need to call it ONCE when branch changes.
      });
    }

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const ChatScreen()),
          );
        },
        backgroundColor: Colors.red.shade700,
        child: const Icon(Icons.chat_bubble, color: Colors.white),
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.red.shade700,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Trang chủ',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.restaurant_menu),
            label: 'Thực đơn',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications),
            label: 'Thông báo',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Tài khoản',
          ),
        ],
      ),
    );
  }
}

