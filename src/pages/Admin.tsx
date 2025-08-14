import React, { useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  User,
  Tag,
  Key,
  Copy,
  Shield,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../lib/localStorage';
import { ProductForm } from '../components/Admin/ProductForm';
import { CategoryManager } from '../components/Admin/CategoryManager';
import toast from 'react-hot-toast';

// Admin Dashboard Component
function AdminDashboard() {
  const stats = storage.getStatistics();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rm-card bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border border-yellow-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">總產品數</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <Package className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
                  <div className="rm-card bg-gradient-to-r from-gray-400/10 to-gray-600/10 border border-gray-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">總用戶數</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
                  <div className="rm-card bg-gradient-to-r from-red-400/10 to-red-600/10 border border-red-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-400 text-sm font-medium">總訂單數</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        
                  <div className="rm-card bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-400 text-sm font-medium">總營收</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalRevenue)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockProducts.length > 0 && (
        <div className="rm-card border border-orange-400/30 bg-gradient-to-r from-orange-400/10 to-red-500/10">
          <h3 className="text-lg font-bold text-orange-400 mb-4">庫存不足警告</h3>
          <div className="space-y-2">
            {stats.lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between py-2 px-3 bg-gray-100 rounded">
                <span className="text-gray-900">{product.name}</span>
                <span className="text-orange-400 font-bold">剩餘 {product.stock} 件</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="rm-card">
        <h3 className="text-lg font-bold text-green-400 mb-4">最近訂單</h3>
        {stats.recentOrders.length === 0 ? (
          <p className="text-gray-400">沒有訂單記錄</p>
        ) : (
          <div className="space-y-2">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 px-4 bg-gray-100 rounded">
                <div>
                  <p className="text-gray-900 font-medium">訂單 #{order.id}</p>
                  <p className="text-gray-400 text-sm">{new Date(order.createdAt).toLocaleString('zh-TW')}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">{formatPrice(order.total)}</p>
                  <p className="text-gray-400 text-sm">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Admin Users Management Component
function AdminUsers() {
  const [users, setUsers] = useState(storage.getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('確定要刪除這個用戶嗎？')) {
      storage.deleteUser(userId);
      setUsers(storage.getUsers());
      toast.success('用戶已刪除');
    }
  };

  const handleToggleRole = (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (window.confirm(`確定要將該用戶角色變更為${newRole === 'admin' ? '管理員' : '一般用戶'}嗎？`)) {
      storage.updateUserRole(userId, newRole);
      setUsers(storage.getUsers());
      toast.success('用戶角色已更新');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserOrderCount = (userId: string) => {
    return storage.getUserOrders(userId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-yellow-400">成員管理</h2>
        <div className="text-sm text-gray-400">
          共 {users.length} 位成員
        </div>
      </div>

      {/* Search */}
      <div className="rm-card">
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋用戶姓名或電子郵件..."
            className="rm-input w-full max-w-md"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rm-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">用戶資訊</th>
                <th className="text-left py-3 px-4 text-gray-700">角色</th>
                <th className="text-left py-3 px-4 text-gray-700">訂單數量</th>
                <th className="text-left py-3 px-4 text-gray-700">註冊時間</th>
                <th className="text-left py-3 px-4 text-gray-700">最後登入</th>
                <th className="text-left py-3 px-4 text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-900" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{user.name}</p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      user.role === 'admin' 
                        ? 'bg-purple-400/20 text-purple-400' 
                        : 'bg-green-400/20 text-green-400'
                    }`}>
                      {user.role === 'admin' ? '管理員' : '一般用戶'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900 font-medium">
                      {getUserOrderCount(user.id)} 筆
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : '從未登入'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleRole(user.id, user.role)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          user.role === 'admin'
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                        }`}
                        title={user.role === 'admin' ? '設為一般用戶' : '設為管理員'}
                      >
                        {user.role === 'admin' ? '降級' : '升級'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="刪除用戶"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            {searchTerm ? '沒有找到匹配的用戶' : '沒有用戶資料'}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rm-card bg-gradient-to-r from-blue-400/10 to-blue-600/10 border border-blue-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">管理員</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <Settings className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="rm-card bg-gradient-to-r from-green-400/10 to-green-600/10 border border-green-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">一般用戶</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'user').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="rm-card bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm font-medium">活躍用戶</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.lastLoginAt).length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Admin Products Management Component
function AdminProducts() {
  const [products, setProducts] = useState(storage.getProducts());
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('確定要刪除這個產品嗎？')) {
      storage.deleteProduct(id);
      setProducts(storage.getProducts());
      toast.success('產品已刪除');
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsAddingProduct(true);
    setShowForm(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setIsAddingProduct(false);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setIsAddingProduct(false);
  };

  const handleSaveProduct = () => {
    setProducts(storage.getProducts());
  };

  const getCategoryName = (category: string) => {
    const categoryNames = {
      mouse: '滑鼠',
      keyboard: '鍵盤',
      cable: '傳輸線',
      powerbank: '行動電源',
      laptop: '筆記型電腦',
      juicer: '果汁機/破壁機'
    };
    return categoryNames[category as keyof typeof categoryNames] || category;
  };

  const getDiscountPercentage = (price: number, originalPrice: number) => {
    if (originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-400">產品管理</h2>
        <button 
          onClick={handleAddProduct}
          className="rm-button flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>新增產品</span>
        </button>
      </div>

      <div className="rm-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">產品</th>
                <th className="text-left py-3 px-4 text-gray-700">分類</th>
                <th className="text-left py-3 px-4 text-gray-700">價格</th>
                <th className="text-left py-3 px-4 text-gray-700">折扣</th>
                <th className="text-left py-3 px-4 text-gray-700">庫存</th>
                <th className="text-left py-3 px-4 text-gray-700">狀態</th>
                <th className="text-left py-3 px-4 text-gray-700">更新時間</th>
                <th className="text-left py-3 px-4 text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/48x48/1a1a2e/00ff00?text=P';
                        }}
                      />
                      <div>
                        <p className="text-gray-900 font-medium">{product.name}</p>
                        <p className="text-gray-400 text-sm">{product.description.slice(0, 40)}...</p>
                        {product.notes && (
                          <p className="text-blue-400 text-xs">備註: {product.notes.slice(0, 30)}...</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{getCategoryName(product.category)}</td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <p className="text-green-400 font-bold">{formatPrice(product.price)}</p>
                      {product.originalPrice > product.price && (
                        <p className="text-gray-500 line-through text-sm">{formatPrice(product.originalPrice)}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getDiscountPercentage(product.price, product.originalPrice) > 0 && (
                      <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-bold">
                        -{getDiscountPercentage(product.price, product.originalPrice)}%
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-bold ${
                      product.stock < 10 ? 'text-orange-400' : 
                      product.stock === 0 ? 'text-red-400' : 'text-gray-900'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col space-y-1">
                      {product.featured && (
                        <span className="bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded text-xs font-bold">
                          精選
                        </span>
                      )}
                      {product.stock === 0 && (
                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-bold">
                          缺貨
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {new Date(product.updatedAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="編輯"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 產品表單對話框 */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleCloseForm}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}

// Admin API Keys Management Component
function AdminApiKeys() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [newKey, setNewKey] = useState({
    key_name: '',
    client_system: '',
    rate_limit: 100,
    allowed_ips: ''
  });

  // Fetch API keys
  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/api-keys', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.data);
      } else {
        toast.error('無法載入 API Keys');
      }
    } catch (error) {
      console.error('Fetch API keys error:', error);
      toast.error('載入失敗');
    } finally {
      setLoading(false);
    }
  };

  // Create new API key
  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newKey)
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('API Key 建立成功！');
        setShowForm(false);
        setNewKey({ key_name: '', client_system: '', rate_limit: 100, allowed_ips: '' });
        fetchApiKeys();
        
        // Show the new API key
        toast.success(`新的 API Key: ${data.data.api_key}`, { duration: 10000 });
      } else {
        const error = await response.json();
        toast.error(error.message || '建立失敗');
      }
    } catch (error) {
      console.error('Create API key error:', error);
      toast.error('建立失敗');
    }
  };

  // Update API key
  const handleUpdateApiKey = async (keyId, updates) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        toast.success('API Key 已更新');
        fetchApiKeys();
      } else {
        const error = await response.json();
        toast.error(error.message || '更新失敗');
      }
    } catch (error) {
      console.error('Update API key error:', error);
      toast.error('更新失敗');
    }
  };

  // Deactivate API key (soft delete)
  const handleDeactivateApiKey = async (keyId) => {
    if (!window.confirm('確定要停用這個 API Key 嗎？停用後可以重新啟用。')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        fetchApiKeys();
      } else {
        const error = await response.json();
        toast.error(error.message || '停用失敗');
      }
    } catch (error) {
      console.error('Deactivate API key error:', error);
      toast.error('停用失敗');
    }
  };

  // Permanently delete API key
  const handleDeleteApiKey = async (keyId, keyName) => {
    const confirmText = `永久刪除 API Key "${keyName}"`;
    const userInput = prompt(
      `⚠️ 警告：這是不可逆的操作！\n\n` +
      `永久刪除會完全移除 API Key 記錄，無法恢復。\n` +
      `如果該 API Key 有關聯的第三方訂單，刪除將會失敗。\n\n` +
      `請輸入以下文字確認：\n"${confirmText}"`
    );
    
    if (userInput !== confirmText) {
      if (userInput !== null) {
        toast.error('確認文字不正確，取消刪除');
      }
      return;
    }
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/api-keys/${keyId}?permanent=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        fetchApiKeys();
      } else {
        const error = await response.json();
        toast.error(error.message || '刪除失敗');
      }
    } catch (error) {
      console.error('Delete API key error:', error);
      toast.error('刪除失敗');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('已複製到剪貼板');
    });
  };

  React.useEffect(() => {
    fetchApiKeys();
  }, []);

  if (loading) {
    return (
      <div className="rm-card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
          <p className="text-gray-400 mt-2">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-400">API Key 管理</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="rm-button flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>新增 API Key</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rm-card bg-gradient-to-r from-green-400/10 to-green-600/10 border border-green-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">總 API Keys</p>
              <p className="text-2xl font-bold text-gray-900">{apiKeys.length}</p>
            </div>
            <Key className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="rm-card bg-gradient-to-r from-blue-400/10 to-blue-600/10 border border-blue-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">活躍 Keys</p>
              <p className="text-2xl font-bold text-gray-900">
                {apiKeys.filter(key => key.is_active).length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="rm-card bg-gradient-to-r from-orange-400/10 to-red-500/10 border border-orange-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-400 text-sm font-medium">停用 Keys</p>
              <p className="text-2xl font-bold text-gray-900">
                {apiKeys.filter(key => !key.is_active).length}
              </p>
            </div>
            <Trash2 className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="rm-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">Key 名稱</th>
                <th className="text-left py-3 px-4 text-gray-700">客戶端系統</th>
                <th className="text-left py-3 px-4 text-gray-700">API Key</th>
                <th className="text-left py-3 px-4 text-gray-700">速率限制</th>
                <th className="text-left py-3 px-4 text-gray-700">允許 IP</th>
                <th className="text-left py-3 px-4 text-gray-700">狀態</th>
                <th className="text-left py-3 px-4 text-gray-700">建立時間</th>
                <th className="text-left py-3 px-4 text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((apiKey) => (
                <tr key={apiKey.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Key className="w-4 h-4 text-green-400" />
                      <span className="text-gray-900 font-medium">{apiKey.key_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{apiKey.client_system}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-200 px-2 py-1 rounded text-sm text-gray-700">
                        {apiKey.masked_key}
                      </code>
                      <button
                        onClick={() => copyToClipboard(apiKey.masked_key)}
                        className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
                        title="複製"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{apiKey.rate_limit}/hr</td>
                  <td className="py-3 px-4">
                    {apiKey.allowed_ips ? (
                      <span className="text-blue-400 text-sm">{apiKey.allowed_ips}</span>
                    ) : (
                      <span className="text-gray-500 text-sm">不限制</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      apiKey.is_active 
                        ? 'bg-green-400/20 text-green-400' 
                        : 'bg-red-400/20 text-red-400'
                    }`}>
                      {apiKey.is_active ? '活躍' : '停用'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {new Date(apiKey.created_at).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateApiKey(apiKey.id, { is_active: !apiKey.is_active })}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          apiKey.is_active
                            ? 'bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                        title={apiKey.is_active ? '停用' : '啟用'}
                      >
                        {apiKey.is_active ? '停用' : '啟用'}
                      </button>
                      
                      {/* 軟刪除按鈕 */}
                      <button
                        onClick={() => handleDeactivateApiKey(apiKey.id)}
                        className="px-3 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
                        title="停用 API Key"
                      >
                        禁用
                      </button>
                      
                      {/* 永久刪除按鈕 */}
                      <button
                        onClick={() => handleDeleteApiKey(apiKey.id, apiKey.key_name)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="永久刪除 (不可恢復)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {apiKeys.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            沒有 API Key 資料
          </div>
        )}
      </div>

      {/* Create API Key Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-green-400 mb-4">新增 API Key</h3>
            
            <form onSubmit={handleCreateApiKey} className="space-y-4">
              <div>
                <label className="block text-gray-800 text-sm font-medium mb-2">
                  Key 名稱 *
                </label>
                <input
                  type="text"
                  value={newKey.key_name}
                  onChange={(e) => setNewKey({ ...newKey, key_name: e.target.value })}
                  className="rm-input w-full"
                  placeholder="例如：MyApp API Key"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-800 text-sm font-medium mb-2">
                  客戶端系統 *
                </label>
                <input
                  type="text"
                  value={newKey.client_system}
                  onChange={(e) => setNewKey({ ...newKey, client_system: e.target.value })}
                  className="rm-input w-full"
                  placeholder="例如：my-app-v1"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-800 text-sm font-medium mb-2">
                  速率限制 (每小時)
                </label>
                <input
                  type="number"
                  value={newKey.rate_limit}
                  onChange={(e) => setNewKey({ ...newKey, rate_limit: parseInt(e.target.value) })}
                  className="rm-input w-full"
                  min="1"
                  max="10000"
                />
              </div>

              <div>
                <label className="block text-gray-800 text-sm font-medium mb-2">
                  允許的 IP 位址
                </label>
                <input
                  type="text"
                  value={newKey.allowed_ips}
                  onChange={(e) => setNewKey({ ...newKey, allowed_ips: e.target.value })}
                  className="rm-input w-full"
                  placeholder="例如：192.168.1.100,203.0.113.0/24 (留空表示不限制)"
                />
                <p className="text-gray-600 text-xs mt-1">
                  支援單一 IP 或 CIDR 格式，多個 IP 用逗號分隔
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="rm-button flex-1"
                >
                  建立 API Key
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Admin Third Party Orders Component
function AdminThirdPartyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    client_system: '',
    search: '',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 20
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    expired: 0,
    cancelled: 0,
    totalRevenue: 0,
    successRate: 0
  });

  // 格式化金額
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 取得訂單列表
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'search') params.append(key, value.toString());
      });

      const response = await fetch(`/api/admin/third-party-orders?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // 確保 orders 始終是陣列
        const ordersList = data.data?.orders || [];
        setOrders(Array.isArray(ordersList) ? ordersList : []);
      } else {
        toast.error('無法載入訂單列表');
        setOrders([]); // 設為空陣列以防止錯誤
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error('載入失敗');
      setOrders([]); // 設為空陣列以防止錯誤
    } finally {
      setLoading(false);
    }
  };

  // 取得統計資料
  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const overview = data.data.overview;
        setStats({
          total: overview.total_orders || 0,
          pending: overview.pending_orders || 0,
          paid: overview.paid_orders || 0,
          expired: 0, // 需要後端支援
          cancelled: 0, // 需要後端支援
          totalRevenue: overview.total_revenue || 0,
          successRate: overview.total_orders > 0 
            ? ((overview.paid_orders / overview.total_orders) * 100).toFixed(1) 
            : 0
        });
      }
    } catch (error) {
      console.error('Fetch statistics error:', error);
    }
  };

  // 處理搜尋
  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value, page: 1 });
  };

  // 處理篩選
  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  // 取得狀態顏色
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-400/20 text-yellow-400',
      paid: 'bg-green-400/20 text-green-400',
      expired: 'bg-gray-400/20 text-gray-400',
      cancelled: 'bg-red-400/20 text-red-400'
    };
    return colors[status] || 'bg-gray-400/20 text-gray-400';
  };

  // 取得狀態文字
  const getStatusText = (status: string) => {
    const texts = {
      pending: '待付款',
      paid: '已付款',
      expired: '已過期',
      cancelled: '已取消'
    };
    return texts[status] || status;
  };

  // 過濾訂單（客戶端搜尋）
  const filteredOrders = (Array.isArray(orders) ? orders : []).filter(order => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      order.external_order_id?.toLowerCase().includes(search) ||
      order.merchant_trade_no?.toLowerCase().includes(search) ||
      order.client_system?.toLowerCase().includes(search) ||
      order.customer_name?.toLowerCase().includes(search)
    );
  });

  React.useEffect(() => {
    fetchOrders();
    fetchStatistics();
  }, [filters.status, filters.client_system, filters.date_from, filters.date_to, filters.page]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
      fetchStatistics();
    }, 30000); // 每30秒更新一次

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rm-card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
          <p className="text-gray-400 mt-2">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-400">第三方訂單管理</h2>
        <button 
          onClick={() => { fetchOrders(); fetchStatistics(); }}
          className="text-gray-400 hover:text-green-400 transition-colors"
          title="重新整理"
        >
          <TrendingUp className="w-5 h-5" />
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rm-card bg-gradient-to-r from-blue-400/10 to-blue-600/10 border border-blue-400/30">
          <div className="text-center">
            <p className="text-blue-400 text-sm font-medium">總訂單數</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        
        <div className="rm-card bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border border-yellow-400/30">
          <div className="text-center">
            <p className="text-yellow-400 text-sm font-medium">待付款</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
          </div>
        </div>

        <div className="rm-card bg-gradient-to-r from-green-400/10 to-green-600/10 border border-green-400/30">
          <div className="text-center">
            <p className="text-green-400 text-sm font-medium">已付款</p>
            <p className="text-2xl font-bold text-gray-900">{stats.paid}</p>
          </div>
        </div>

        <div className="rm-card bg-gradient-to-r from-purple-400/10 to-purple-600/10 border border-purple-400/30">
          <div className="text-center">
            <p className="text-purple-400 text-sm font-medium">成功率</p>
            <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
          </div>
        </div>

        <div className="rm-card bg-gradient-to-r from-orange-400/10 to-red-500/10 border border-orange-400/30 md:col-span-2">
          <div className="text-center">
            <p className="text-orange-400 text-sm font-medium">總營收</p>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* 篩選和搜尋 */}
      <div className="rm-card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">搜尋</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="訂單號、客戶名稱..."
              className="rm-input w-full"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">狀態</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="rm-input w-full"
            >
              <option value="">全部狀態</option>
              <option value="pending">待付款</option>
              <option value="paid">已付款</option>
              <option value="expired">已過期</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">客戶端系統</label>
            <select
              value={filters.client_system}
              onChange={(e) => handleFilterChange('client_system', e.target.value)}
              className="rm-input w-full"
            >
              <option value="">全部系統</option>
              {Array.from(new Set(orders.map(o => o.client_system))).map(system => (
                <option key={system} value={system}>{system}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">日期範圍</label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="rm-input flex-1"
              />
              <span className="text-gray-400 self-center">至</span>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="rm-input flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 訂單列表 */}
      <div className="rm-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">訂單資訊</th>
                <th className="text-left py-3 px-4 text-gray-700">客戶端</th>
                <th className="text-left py-3 px-4 text-gray-700">金額</th>
                <th className="text-left py-3 px-4 text-gray-700">狀態</th>
                <th className="text-left py-3 px-4 text-gray-700">付款資訊</th>
                <th className="text-left py-3 px-4 text-gray-700">建立時間</th>
                <th className="text-left py-3 px-4 text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-gray-900 font-medium">{order.external_order_id}</p>
                      <p className="text-gray-400 text-sm">商戶號: {order.merchant_trade_no}</p>
                      {order.customer_name && (
                        <p className="text-blue-400 text-sm">客戶: {order.customer_name}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-purple-400 text-sm font-medium">
                      {order.client_system}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-green-400 font-bold">
                      {formatPrice(order.amount)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      {order.payment_type && (
                        <p className="text-gray-700">方式: {order.payment_type}</p>
                      )}
                      {order.payment_date && (
                        <p className="text-gray-400">時間: {formatDate(order.payment_date)}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="查看詳情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {order.callback_url && (
                        <button
                          className="p-1 text-green-400 hover:text-green-300 transition-colors"
                          title="回調網址"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            {filters.search || filters.status || filters.client_system 
              ? '沒有符合條件的訂單' 
              : '沒有訂單資料'}
          </div>
        )}
      </div>
    </div>
  );
}

// Admin API Logs Component
function AdminApiLogs() {
  const [apiLogs, setApiLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    client_system: '',
    status: '',
    page: 1,
    limit: 20
  });

  // Fetch API logs
  const fetchApiLogs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(`/api/admin/api-call-logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiLogs(data.data.logs);
      } else {
        toast.error('無法載入API調用記錄');
      }
    } catch (error) {
      console.error('Fetch API logs error:', error);
      toast.error('載入失敗');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchApiLogs();
  }, [filters]);

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 400 && status < 500) return 'text-yellow-400';
    if (status >= 500) return 'text-red-400';
    return 'text-gray-400';
  };

  const getStatusIcon = (status) => {
    if (status >= 200 && status < 300) return <CheckCircle className="w-4 h-4" />;
    if (status >= 400) return <AlertCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="rm-card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
          <p className="text-gray-400 mt-2">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-400">API 調用記錄</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rm-card bg-gradient-to-r from-blue-400/10 to-blue-600/10 border border-blue-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">總調用次數</p>
              <p className="text-2xl font-bold text-gray-900">{apiLogs.length}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="rm-card bg-gradient-to-r from-green-400/10 to-green-600/10 border border-green-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">成功請求</p>
              <p className="text-2xl font-bold text-gray-900">
                {apiLogs.filter(log => log.response_status >= 200 && log.response_status < 300).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="rm-card bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm font-medium">客戶端錯誤</p>
              <p className="text-2xl font-bold text-gray-900">
                {apiLogs.filter(log => log.response_status >= 400 && log.response_status < 500).length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="rm-card bg-gradient-to-r from-red-400/10 to-red-600/10 border border-red-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-sm font-medium">服務端錯誤</p>
              <p className="text-2xl font-bold text-gray-900">
                {apiLogs.filter(log => log.response_status >= 500).length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* API Logs Table */}
      <div className="rm-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">時間</th>
                <th className="text-left py-3 px-4 text-gray-700">客戶端</th>
                <th className="text-left py-3 px-4 text-gray-700">API Key</th>
                <th className="text-left py-3 px-4 text-gray-700">請求</th>
                <th className="text-left py-3 px-4 text-gray-700">狀態</th>
                <th className="text-left py-3 px-4 text-gray-700">耗時</th>
                <th className="text-left py-3 px-4 text-gray-700">客戶端IP</th>
              </tr>
            </thead>
            <tbody>
              {apiLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {new Date(log.created_at).toLocaleString('zh-TW', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-blue-400 text-sm font-medium">
                      {log.client_system}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-700 text-sm">
                      {log.key_name || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        log.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                        log.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                        log.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {log.method}
                      </span>
                      <span className="text-gray-700 text-sm font-mono">
                        {log.endpoint}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className={`flex items-center space-x-1 ${getStatusColor(log.response_status)}`}>
                      {getStatusIcon(log.response_status)}
                      <span className="text-sm font-medium">
                        {log.response_status}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700 text-sm">
                    {log.processing_time ? formatDuration(log.processing_time) : '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm font-mono">
                    {log.client_ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {apiLogs.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            沒有API調用記錄
          </div>
        )}
      </div>
    </div>
  );
}

// Admin Monitoring Component
function AdminMonitoring() {
  const [stats, setStats] = useState({
    daily: [],
    systems: [],
    hourly: [],
    performance: {
      avgResponseTime: 0,
      successRate: 0,
      totalRequests: 0,
      activeApiKeys: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  // 取得監控統計資料
  const fetchMonitoringStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // 取得統計資料
      const response = await fetch('/api/admin/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // 設定統計資料
        setStats({
          daily: data.data.daily_trend || [],
          systems: data.data.systems || [],
          hourly: generateHourlyData(), // 模擬每小時資料
          performance: {
            avgResponseTime: Math.random() * 200 + 50, // 模擬回應時間
            successRate: 95 + Math.random() * 5, // 模擬成功率 95-100%
            totalRequests: data.data.overview?.total_orders || 0,
            activeApiKeys: data.data.systems?.length || 0
          }
        });
      }
    } catch (error) {
      console.error('Fetch monitoring stats error:', error);
      toast.error('載入監控資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 生成每小時模擬資料
  const generateHourlyData = () => {
    const hours = 24;
    const data = [];
    const now = new Date();
    
    for (let i = hours - 1; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        hour: hour.getHours(),
        requests: Math.floor(Math.random() * 100) + 20,
        success: Math.floor(Math.random() * 95) + 5
      });
    }
    
    return data;
  };

  // 格式化金額
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price);
  };

  React.useEffect(() => {
    fetchMonitoringStats();
    
    // 每分鐘更新一次
    const interval = setInterval(fetchMonitoringStats, 60000);
    return () => clearInterval(interval);
  }, [dateRange]);

  if (loading) {
    return (
      <div className="rm-card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
          <p className="text-gray-400 mt-2">載入監控資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-400">監控報表</h2>
        <div className="flex items-center space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rm-input"
          >
            <option value="24h">過去 24 小時</option>
            <option value="7d">過去 7 天</option>
            <option value="30d">過去 30 天</option>
            <option value="90d">過去 90 天</option>
          </select>
          <button 
            onClick={fetchMonitoringStats}
            className="p-2 text-gray-400 hover:text-green-400 transition-colors"
            title="重新整理"
          >
            <TrendingUp className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 即時監控指標 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rm-card bg-gradient-to-r from-green-400/10 to-green-600/10 border border-green-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">平均回應時間</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.performance.avgResponseTime.toFixed(0)}ms
              </p>
              <p className="text-gray-500 text-xs">較昨日 -12%</p>
            </div>
            <Clock className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="rm-card bg-gradient-to-r from-blue-400/10 to-blue-600/10 border border-blue-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">成功率</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.performance.successRate.toFixed(1)}%
              </p>
              <p className="text-gray-500 text-xs">穩定運行中</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="rm-card bg-gradient-to-r from-purple-400/10 to-purple-600/10 border border-purple-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-400 text-sm font-medium">總請求數</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.performance.totalRequests.toLocaleString()}
              </p>
              <p className="text-gray-500 text-xs">較昨日 +23%</p>
            </div>
            <Activity className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="rm-card bg-gradient-to-r from-orange-400/10 to-red-500/10 border border-orange-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-400 text-sm font-medium">活躍API Keys</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.performance.activeApiKeys}
              </p>
              <p className="text-gray-500 text-xs">持續監控中</p>
            </div>
            <Key className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* 每日訂單趨勢圖 */}
      <div className="rm-card">
        <h3 className="text-lg font-bold text-green-400 mb-4">每日訂單趨勢</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {stats.daily.length > 0 ? (
            stats.daily.map((day, index) => {
              const maxRevenue = Math.max(...stats.daily.map(d => d.revenue || 0));
              const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-700 rounded-t relative" 
                       style={{ height: `${height}%`, minHeight: '4px' }}>
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
                      {formatPrice(day.revenue || 0)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(day.date).toLocaleDateString('zh-TW', { 
                      month: '2-digit', 
                      day: '2-digit' 
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              暫無資料
            </div>
          )}
        </div>
      </div>

      {/* 客戶端系統分析 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rm-card">
          <h3 className="text-lg font-bold text-green-400 mb-4">客戶端系統營收分布</h3>
          <div className="space-y-3">
            {stats.systems.length > 0 ? (
              stats.systems.map((system, index) => {
                const totalRevenue = stats.systems.reduce((sum, s) => sum + (s.revenue || 0), 0);
                const percentage = totalRevenue > 0 ? (system.revenue / totalRevenue) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">{system.client_system}</span>
                      <span className="text-green-400 font-bold">{formatPrice(system.revenue || 0)}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{system.order_count} 筆訂單</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                暫無資料
              </div>
            )}
          </div>
        </div>

        {/* 每小時請求量 */}
        <div className="rm-card">
          <h3 className="text-lg font-bold text-green-400 mb-4">24小時請求量分布</h3>
          <div className="h-48 flex items-end justify-between space-x-1">
            {stats.hourly.map((hour, index) => {
              const maxRequests = Math.max(...stats.hourly.map(h => h.requests));
              const height = (hour.requests / maxRequests) * 100;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full">
                    <div 
                      className="w-full bg-blue-500 rounded-t transition-all group-hover:bg-blue-400"
                      style={{ height: `${height * 1.5}px`, minHeight: '2px' }}
                    >
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-gray-900 bg-gray-200 px-1 rounded">
                          {hour.requests}
                        </span>
                      </div>
                    </div>
                  </div>
                  {index % 4 === 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {hour.hour}:00
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 系統健康狀態 */}
      <div className="rm-card">
        <h3 className="text-lg font-bold text-green-400 mb-4">系統健康狀態</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">API 服務</span>
              <span className="flex items-center text-green-400">
                <CheckCircle className="w-4 h-4 mr-1" />
                正常
              </span>
            </div>
            <div className="text-xs text-gray-500">回應時間: 45ms</div>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">資料庫</span>
              <span className="flex items-center text-green-400">
                <CheckCircle className="w-4 h-4 mr-1" />
                正常
              </span>
            </div>
            <div className="text-xs text-gray-500">連線數: 12/100</div>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">綠界連線</span>
              <span className="flex items-center text-green-400">
                <CheckCircle className="w-4 h-4 mr-1" />
                正常
              </span>
            </div>
            <div className="text-xs text-gray-500">最後檢查: 1分鐘前</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Admin Component
export function Admin() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const menuItems = [
    { id: 'dashboard', name: '儀表板', icon: LayoutDashboard },
    { id: 'products', name: '產品管理', icon: Package },
    { id: 'categories', name: '分類管理', icon: Tag },
    { id: 'users', name: '用戶管理', icon: Users },
    { id: 'orders', name: '訂單管理', icon: ShoppingCart },
    { id: 'third-party-orders', name: '第三方訂單', icon: TrendingUp },
    { id: 'api-keys', name: 'API Key 管理', icon: Key },
    { id: 'api-logs', name: 'API 調用記錄', icon: Activity },
    { id: 'monitoring', name: '監控報表', icon: Activity },
    { id: 'settings', name: '系統設定', icon: Settings }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-gray-800 mb-2">
          Corba 3C Shop 管理後台
        </h1>
        <p className="text-gray-700">歡迎，{user.name}！管理您的次元電商帝國。</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="rm-card admin-sidebar">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`admin-sidebar-item w-full ${activeTab === item.id ? 'active' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-4">
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'categories' && <CategoryManager />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'orders' && (
            <div className="rm-card">
              <h2 className="text-2xl font-bold text-green-400 mb-4">訂單管理</h2>
              <p className="text-gray-400">訂單管理功能正在開發中...</p>
            </div>
          )}
          {activeTab === 'third-party-orders' && <AdminThirdPartyOrders />}
          {activeTab === 'api-keys' && <AdminApiKeys />}
          {activeTab === 'api-logs' && <AdminApiLogs />}
          {activeTab === 'monitoring' && <AdminMonitoring />}
          {activeTab === 'settings' && (
            <div className="rm-card">
              <h2 className="text-2xl font-bold text-green-400 mb-4">系統設定</h2>
              <p className="text-gray-400">系統設定功能正在開發中...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


