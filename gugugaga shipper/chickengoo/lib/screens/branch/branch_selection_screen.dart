import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/branch.dart';
import '../../providers/cart_provider.dart';
import '../../services/api_service.dart';
import '../main/main_screen.dart';

class BranchSelectionScreen extends StatelessWidget {
  const BranchSelectionScreen({super.key});

  @override
  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final apiService = ApiService();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chọn chi nhánh'),
        backgroundColor: Colors.red.shade700,
        foregroundColor: Colors.white,
      ),
      body: FutureBuilder<List<Branch>>(
        future: apiService.getBranches(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            print('DEBUG: BranchSelectionScreen - Waiting for data...');
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            print('DEBUG: BranchSelectionScreen - Error: ${snapshot.error}');
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Lỗi: ${snapshot.error}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.red),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      // Trigger rebuild to retry
                      (context as Element).markNeedsBuild();
                    },
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            print('DEBUG: BranchSelectionScreen - No data or empty list');
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Không có chi nhánh nào'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      (context as Element).markNeedsBuild();
                    },
                    child: const Text('Tải lại'),
                  ),
                ],
              ),
            );
          }
          print('DEBUG: BranchSelectionScreen - Loaded ${snapshot.data!.length} branches');

          final branches = snapshot.data!;
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: branches.length,
            itemBuilder: (context, index) {
              final branch = branches[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Colors.red.shade100,
                    child: Icon(
                      Icons.store,
                      color: Colors.red.shade700,
                    ),
                  ),
                  title: Text(
                    branch.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (branch.address != null)
                        Text(
                          branch.address!,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      if (branch.phone != null)
                        Text(
                          branch.phone!,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                    ],
                  ),
                  trailing: Icon(
                    Icons.arrow_forward_ios,
                    size: 16,
                    color: Colors.grey.shade400,
                  ),
                  onTap: () {
                    print('DEBUG: Branch tapped: ${branch.name} (ID: ${branch.id})');
                    // Select branch
                    // This will trigger MainScreen to rebuild and show the home screen
                    // because MainScreen listens to AuthProvider
                    authProvider.selectBranch(branch).then((_) {
                      if (context.mounted) {
                        final cartProvider = Provider.of<CartProvider>(context, listen: false);
                        if (authProvider.token != null) {
                          cartProvider.loadCart(branch.id, authProvider.token!);
                        }
                      }
                    });
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}

