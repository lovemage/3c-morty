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
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../lib/localStorage';
import { ProductForm } from '../components/Admin/ProductForm';
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
              <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
            </div>
            <Package className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
                  <div className="rm-card bg-gradient-to-r from-gray-400/10 to-gray-600/10 border border-gray-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">總用戶數</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
                  <div className="rm-card bg-gradient-to-r from-red-400/10 to-red-600/10 border border-red-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-400 text-sm font-medium">總訂單數</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        
                  <div className="rm-card bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-400 text-sm font-medium">總營收</p>
              <p className="text-2xl font-bold text-gray-800">{formatPrice(stats.totalRevenue)}</p>
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
              <div key={product.id} className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded">
                <span className="text-white">{product.name}</span>
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
              <div key={order.id} className="flex items-center justify-between py-3 px-4 bg-gray-800/30 rounded">
                <div>
                  <p className="text-white font-medium">訂單 #{order.id}</p>
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
      laptop: '筆記型電腦'
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
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300">產品</th>
                <th className="text-left py-3 px-4 text-gray-300">分類</th>
                <th className="text-left py-3 px-4 text-gray-300">價格</th>
                <th className="text-left py-3 px-4 text-gray-300">折扣</th>
                <th className="text-left py-3 px-4 text-gray-300">庫存</th>
                <th className="text-left py-3 px-4 text-gray-300">狀態</th>
                <th className="text-left py-3 px-4 text-gray-300">更新時間</th>
                <th className="text-left py-3 px-4 text-gray-300">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-800 hover:bg-gray-800/30">
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
                        <p className="text-white font-medium">{product.name}</p>
                        <p className="text-gray-400 text-sm">{product.description.slice(0, 40)}...</p>
                        {product.notes && (
                          <p className="text-blue-400 text-xs">備註: {product.notes.slice(0, 30)}...</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{getCategoryName(product.category)}</td>
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
                      product.stock === 0 ? 'text-red-400' : 'text-white'
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
    { id: 'users', name: '用戶管理', icon: Users },
    { id: 'orders', name: '訂單管理', icon: ShoppingCart },
    { id: 'settings', name: '系統設定', icon: Settings }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-gray-800 mb-2">
          Rick & Morty 管理後台
        </h1>
        <p className="text-gray-600">歡迎，{user.name}！管理您的次元電商帝國。</p>
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
          {activeTab === 'users' && (
            <div className="rm-card">
              <h2 className="text-2xl font-bold text-green-400 mb-4">用戶管理</h2>
              <p className="text-gray-400">用戶管理功能正在開發中...</p>
            </div>
          )}
          {activeTab === 'orders' && (
            <div className="rm-card">
              <h2 className="text-2xl font-bold text-green-400 mb-4">訂單管理</h2>
              <p className="text-gray-400">訂單管理功能正在開發中...</p>
            </div>
          )}
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


