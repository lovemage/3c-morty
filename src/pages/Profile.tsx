import React, { useState } from 'react';
import { User, Package, Settings, LogOut, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../lib/localStorage';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  const userOrders = storage.getUserOrders(user.id);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'processing': return 'text-blue-400 bg-blue-400/20';
      case 'shipped': return 'text-purple-400 bg-purple-400/20';
      case 'delivered': return 'text-green-400 bg-green-400/20';
      case 'cancelled': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待處理';
      case 'processing': return '處理中';
      case 'shipped': return '已出貨';
      case 'delivered': return '已送達';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const handleEditSave = () => {
    if (!editForm.name.trim()) {
      toast.error('姓名不能為空');
      return;
    }
    
    // Note: In a real app, this would update the user in the database
    // For now, we'll just show a success message
    toast.success('資料已更新（模擬）');
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditForm({
      name: user.name,
      email: user.email
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
          個人資料
        </h1>
        <button
          onClick={handleLogout}
          className="rm-button-danger px-4 py-2 text-sm flex items-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>登出</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="rm-card">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">{user.name}</h3>
              <p className="text-gray-400 text-sm">{user.email}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-2 ${
                user.role === 'admin' ? 'bg-purple-400/20 text-purple-400' : 'bg-green-400/20 text-green-400'
              }`}>
                {user.role === 'admin' ? '管理員' : '一般用戶'}
              </span>
            </div>
            
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'profile' 
                    ? 'bg-green-400/20 text-green-400 border border-green-400/30' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>資料設定</span>
              </button>
              
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'orders' 
                    ? 'bg-green-400/20 text-green-400 border border-green-400/30' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Package className="w-5 h-5" />
                <span>訂單歷史</span>
                {userOrders.length > 0 && (
                  <span className="bg-green-400 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {userOrders.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' ? (
            /* Profile Settings */
            <div className="rm-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-green-400">個人資料</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="rm-button-secondary px-4 py-2 text-sm flex items-center space-x-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>編輯</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleEditSave}
                      className="rm-button px-4 py-2 text-sm flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>保存</span>
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="rm-button-danger px-4 py-2 text-sm flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>取消</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    姓名
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="rm-input"
                    />
                  ) : (
                    <p className="text-white bg-gray-800/50 px-4 py-3 rounded-lg">{user.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    電子郵件
                  </label>
                  <p className="text-gray-400 bg-gray-800/50 px-4 py-3 rounded-lg">
                    {user.email}
                    <span className="block text-xs text-gray-500 mt-1">電子郵件無法修改</span>
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    帳戶類型
                  </label>
                  <p className="text-white bg-gray-800/50 px-4 py-3 rounded-lg">
                    {user.role === 'admin' ? '管理員' : '一般用戶'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    註冊日期
                  </label>
                  <p className="text-white bg-gray-800/50 px-4 py-3 rounded-lg">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-lg border border-green-400/30">
                <h3 className="text-lg font-bold text-green-400 mb-2">次元安全提示</h3>
                <p className="text-gray-300 text-sm">
                  您的資料受到Rick的量子加密技術保護，即使在平行宇宙中也無法被破解。
                  如果您遇到任何安全問題，請立即聯繫我們的客服。
                </p>
              </div>
            </div>
          ) : (
            /* Order History */
            <div className="space-y-6">
              <div className="rm-card">
                <h2 className="text-xl font-bold text-green-400 mb-6">訂單歷史</h2>
                
                {userOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-bold text-gray-400 mb-2">沒有訂單記錄</h3>
                    <p className="text-gray-500">您還沒有任何訂單</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map((order) => (
                      <div key={order.id} className="border border-gray-700 rounded-lg p-6 bg-gray-800/30">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-white mb-1">
                              訂單 #{order.id}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                            <span className="text-lg font-bold text-green-400">
                              {formatPrice(order.total)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid gap-4">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center space-x-4 py-2 border-t border-gray-700">
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="w-12 h-12 object-cover rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://via.placeholder.com/48x48/1a1a2e/00ff00?text=P';
                                }}
                              />
                              <div className="flex-1">
                                <p className="text-white font-medium">{item.product.name}</p>
                                <p className="text-gray-400 text-sm">
                                  {formatPrice(item.product.price)} × {item.quantity}
                                </p>
                              </div>
                              <p className="text-green-400 font-bold">
                                {formatPrice(item.product.price * item.quantity)}
                              </p>
                            </div>
                          ))}
                        </div>
                        
                        {order.shippingAddress && (
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <h4 className="text-sm font-bold text-gray-300 mb-2">配送地址：</h4>
                            <p className="text-gray-400 text-sm">
                              {order.shippingAddress.name}<br />
                              {order.shippingAddress.address}<br />
                              {order.shippingAddress.city} {order.shippingAddress.postalCode}<br />
                              {order.shippingAddress.phone}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
