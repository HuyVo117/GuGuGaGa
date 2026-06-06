import { useState } from 'react'
import { Save, Bell, Lock, User, Globe } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'

export default function Settings() {
  const [settings, setSettings] = useState({
    siteName: 'Admin Panel',
    siteEmail: 'admin@example.com',
    notifications: {
      email: true,
      push: false,
      sms: false,
    },
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
  })

  const handleSave = () => {
    // Handle save logic
    alert('Đã lưu cài đặt!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-600 mt-1">Quản lý cài đặt hệ thống</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Tabs.Root defaultValue="general" className="w-full">
          <Tabs.List className="flex border-b border-gray-200">
            <Tabs.Trigger
              value="general"
              className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe size={18} />
                <span>Tổng quan</span>
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="notifications"
              className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Bell size={18} />
                <span>Thông báo</span>
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="security"
              className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Lock size={18} />
                <span>Bảo mật</span>
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="profile"
              className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <User size={18} />
                <span>Hồ sơ</span>
              </div>
            </Tabs.Trigger>
          </Tabs.List>

          <div className="p-6">
            <Tabs.Content value="general" className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt chung</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên trang web
                    </label>
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email hệ thống
                    </label>
                    <input
                      type="email"
                      value={settings.siteEmail}
                      onChange={(e) => setSettings({ ...settings, siteEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Múi giờ
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="notifications" className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt thông báo</h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">Thông báo qua Email</p>
                      <p className="text-sm text-gray-500">Nhận thông báo qua email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications.email}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, email: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">Thông báo đẩy</p>
                      <p className="text-sm text-gray-500">Nhận thông báo đẩy trên trình duyệt</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications.push}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, push: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">Thông báo SMS</p>
                      <p className="text-sm text-gray-500">Nhận thông báo qua tin nhắn</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications.sms}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, sms: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="security" className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Bảo mật</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="profile" className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cá nhân</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      defaultValue="Admin User"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue="admin@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      defaultValue="+84 123 456 789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </Tabs.Content>
          </div>
        </Tabs.Root>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save size={18} />
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>
    </div>
  )
}

