import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
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
  late List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AuthProvider>(context, listen: false).tryAutoLogin();
    });
    _screens = [
      HomeScreen(
        onCategorySelected: (categoryId) {
          setState(() {
            _currentIndex = 1;
            _screens[1] = MenuScreen(initialCategoryId: categoryId);
          });
        },
        onParentCategorySelected: (parentCategory) {
          setState(() {
            _currentIndex = 1;
            _screens[1] = MenuScreen(initialParentCategory: parentCategory);
          });
        },
      ),
      const MenuScreen(),
      const NotificationScreen(),
      const AccountScreen(),
    ];
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _currentIndex == index;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          setState(() {
            _currentIndex = index;
          });
        },
        borderRadius: BorderRadius.circular(16),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white.withOpacity(0.18) : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedScale(
                scale: isSelected ? 1.2 : 1.0,
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOutBack,
                child: Icon(
                  icon,
                  color: isSelected ? Colors.white : Colors.white.withOpacity(0.65),
                  size: isSelected ? 26 : 22,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.white.withOpacity(0.65),
                  fontSize: 10,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    print('DEBUG: MainScreen build. Selected branch: ${authProvider.selectedBranch?.name}');
    
    if (authProvider.selectedBranch == null) {
      print('DEBUG: MainScreen - showing BranchSelectionScreen');
      return const BranchSelectionScreen();
    }
    print('DEBUG: MainScreen - showing Scaffold');

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
      bottomNavigationBar: Container(
        height: 78,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.red.shade800, Colors.orange.shade700],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(0, Icons.home_outlined, 'Trang chủ'),
              _buildNavItem(1, Icons.restaurant_menu_outlined, 'Thực đơn'),
              _buildNavItem(2, Icons.notifications_none_outlined, 'Thông báo'),
              _buildNavItem(3, Icons.person_outline, 'Tài khoản'),
            ],
          ),
        ),
      ),
    );
  }
}
