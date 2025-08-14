import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  gradient: string;
  created_at?: string;
  updated_at?: string;
}

interface CategoryFormData {
  id: string;
  name: string;
  icon: string;
  description: string;
  gradient: string;
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CategoryFormData>({
    id: '',
    name: '',
    icon: '',
    description: '',
    gradient: 'from-gray-400 to-gray-600'
  });

  const gradientOptions = [
    { value: 'from-green-400 to-green-600', label: '綠色漸變', preview: 'from-green-400 to-green-600' },
    { value: 'from-blue-400 to-blue-600', label: '藍色漸變', preview: 'from-blue-400 to-blue-600' },
    { value: 'from-purple-400 to-purple-600', label: '紫色漸變', preview: 'from-purple-400 to-purple-600' },
    { value: 'from-pink-400 to-rose-500', label: '粉色漸變', preview: 'from-pink-400 to-rose-500' },
    { value: 'from-orange-400 to-red-500', label: '橙紅漸變', preview: 'from-orange-400 to-red-500' },
    { value: 'from-cyan-400 to-teal-500', label: '青色漸變', preview: 'from-cyan-400 to-teal-500' },
    { value: 'from-yellow-400 to-orange-500', label: '黃橙漸變', preview: 'from-yellow-400 to-orange-500' },
    { value: 'from-indigo-400 to-purple-600', label: '靛紫漸變', preview: 'from-indigo-400 to-purple-600' }
  ];

  const commonEmojis = [
    '🖱️', '⌨️', '🔌', '🔋', '💻', '🥤', '📱', '🎧', '📺', '⌚',
    '📷', '🎮', '💿', '🔊', '🖥️', '🖨️', '📀', '💾', '🔍', '⚡',
    '🛒', '📦', '🏷️', '💳', '🎯', '⭐', '🔥', '✨', '🎨', '🔧'
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        toast.error('獲取分類失敗');
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
      toast.error('網路錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id || !formData.name || !formData.icon) {
      toast.error('請填寫所有必填欄位');
      return;
    }

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingCategory ? '分類更新成功' : '分類創建成功');
        await fetchCategories();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.message || '操作失敗');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('網路錯誤');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      id: category.id,
      name: category.name,
      icon: category.icon,
      description: category.description,
      gradient: category.gradient
    });
    setShowForm(true);
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`確定要刪除分類「${category.name}」嗎？`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('分類刪除成功');
        await fetchCategories();
      } else {
        const error = await response.json();
        toast.error(error.message || '刪除失敗');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('網路錯誤');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      icon: '',
      description: '',
      gradient: 'from-gray-400 to-gray-600'
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const generateIdFromName = (name: string) => {
    return name.toLowerCase()
      .replace(/[\u4e00-\u9fff]/g, '') // Remove Chinese characters
      .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
      .slice(0, 10) || 'category';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="rm-loading w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
          <Tag className="w-6 h-6" />
          <span>分類管理</span>
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="rm-button flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>新增分類</span>
        </button>
      </div>

      {/* Category Form */}
      {showForm && (
        <div className="rm-card bg-white border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {editingCategory ? '編輯分類' : '新增分類'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分類ID *
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="例如: electronics"
                  disabled={!!editingCategory}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  僅可使用英文字母、數字和連字符
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分類名稱 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      name,
                      id: editingCategory ? prev.id : generateIdFromName(name)
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="例如: 電子產品"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                圖標 *
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="輸入emoji或選擇下方圖標"
                  required
                />
                <div className="grid grid-cols-10 gap-2">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                      className={`p-2 text-xl hover:bg-gray-100 rounded-lg transition-colors ${
                        formData.icon === emoji ? 'bg-yellow-100 ring-2 ring-yellow-500' : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                rows={3}
                placeholder="分類描述..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                顏色漸變
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {gradientOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gradient: option.value }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.gradient === option.value 
                        ? 'border-yellow-500 ring-2 ring-yellow-200' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className={`w-full h-8 rounded bg-gradient-to-r ${option.preview} mb-1`}></div>
                    <span className="text-xs text-gray-600">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <button
                type="submit"
                className="rm-button flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingCategory ? '更新' : '創建'}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>取消</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div key={category.id} className="rm-card bg-white border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.gradient} flex items-center justify-center text-2xl`}>
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{category.name}</h3>
                  <p className="text-sm text-gray-500">ID: {category.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="編輯"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="刪除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {category.description && (
              <p className="text-sm text-gray-600 mb-2">{category.description}</p>
            )}
            
            <div className="text-xs text-gray-400">
              創建於: {new Date(category.created_at || '').toLocaleDateString('zh-TW')}
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-8">
          <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">還沒有任何分類</p>
          <p className="text-sm text-gray-400">點擊上方「新增分類」按鈕來創建第一個分類</p>
        </div>
      )}
    </div>
  );
} 