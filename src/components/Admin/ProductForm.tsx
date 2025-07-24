import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Minus } from 'lucide-react';
import { Product, storage } from '../../lib/localStorage';
import toast from 'react-hot-toast';

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSave: () => void;
}

export function ProductForm({ product, onClose, onSave }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'mouse' as const,
    price: 0,
    originalPrice: 0,
    description: '',
    specifications: [''],
    specifications2: [''],
    stock: 0,
    image: '',
    notes: '',
    featured: false
  });

  const [availableImages, setAvailableImages] = useState<string[]>([]);

  useEffect(() => {
    // 載入可用的圖片列表
    const imageNames = [
      'wireless-gaming-mouse.jpg',
      'wired-mouse.jpg',
      '6206427_R.webp',
      '13248873_R.webp',
      'mechanical-keyboard.jpeg',
      'wireless-keyboard.jpg',
      '12236748_R.webp',
      '14169511_R.webp',
      'usb-c-cable_1.jpg',
      'usb-c-cable_2.jpg',
      'usb-c-cable_3.jpg',
      'lightning-cable.jpg',
      'hdmi-cable.jpg',
      'usb-c-cable_4.jpg',
      'usb-c-cable_6.jpg',
      '7667886_R.webp',
      'power-bank-20000.jpeg',
      '11455868_R.webp',
      '10254365_R.webp',
      '9779579_R.webp',
      'gaming-laptop.jpg',
      'ultrabook.jpg',
      '4318322_R.webp',
      '6674008_R1.webp'
    ];
    setAvailableImages(imageNames);
  }, []);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice,
        description: product.description,
        specifications: product.specifications.length > 0 ? product.specifications : [''],
        specifications2: product.specifications2?.length > 0 ? product.specifications2 : [''],
        stock: product.stock,
        image: product.image,
        notes: product.notes || '',
        featured: product.featured || false
      });
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('請輸入產品名稱');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('請輸入產品描述');
      return;
    }
    
    if (formData.price <= 0) {
      toast.error('請輸入有效的售價');
      return;
    }
    
    if (formData.originalPrice <= 0) {
      toast.error('請輸入有效的原價');
      return;
    }
    
    if (!formData.image) {
      toast.error('請選擇產品圖片');
      return;
    }

    const filteredSpecs = formData.specifications.filter(spec => spec.trim());
    const filteredSpecs2 = formData.specifications2.filter(spec => spec.trim());
    
    const productData = {
      ...formData,
      specifications: filteredSpecs,
      specifications2: filteredSpecs2,
      image: `/images/products/${formData.image}`
    };

    try {
      if (product) {
        storage.updateProduct(product.id, productData);
        toast.success('產品已更新');
      } else {
        storage.addProduct(productData);
        toast.success('產品已新增');
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error('操作失敗');
    }
  };

  const addSpecification = (type: 'specifications' | 'specifications2') => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], '']
    }));
  };

  const removeSpecification = (type: 'specifications' | 'specifications2', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const updateSpecification = (type: 'specifications' | 'specifications2', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map((spec, i) => i === index ? value : spec)
    }));
  };

  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    
    fetchCategories();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rm-card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-green-400">
            {product ? '編輯產品' : '新增產品'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 基本資訊 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">基本資訊</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  產品名稱 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="rm-input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  分類 *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="rm-input"
                >
                  <option value="">請選擇分類</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    售價 (TWD) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    className="rm-input"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    原價 (TWD) *
                  </label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: parseInt(e.target.value) || 0 }))}
                    className="rm-input"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  庫存數量 *
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  className="rm-input"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                    className="w-4 h-4 accent-green-400"
                  />
                  <span className="text-gray-300">設為精選產品</span>
                </label>
              </div>
            </div>

            {/* 圖片選擇 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">產品圖片</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  選擇圖片 *
                </label>
                <select
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  className="rm-input"
                  required
                >
                  <option value="">請選擇圖片</option>
                  {availableImages.map((imageName) => (
                    <option key={imageName} value={imageName}>
                      {imageName}
                    </option>
                  ))}
                </select>
              </div>

              {formData.image && (
                <div className="border border-gray-600 rounded-lg p-2">
                  <img
                    src={`/images/products/${formData.image}`}
                    alt="預覽"
                    className="w-full h-48 object-cover rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/300x200/1a1a2e/00ff00?text=圖片無法顯示';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 產品描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              產品描述 *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="rm-input h-24"
              required
            />
          </div>

          {/* 規格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                主要規格
              </label>
              {formData.specifications.map((spec, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={spec}
                    onChange={(e) => updateSpecification('specifications', index, e.target.value)}
                    className="rm-input flex-1"
                    placeholder={`規格 ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeSpecification('specifications', index)}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addSpecification('specifications')}
                className="flex items-center space-x-2 text-green-400 hover:text-green-300"
              >
                <Plus className="w-4 h-4" />
                <span>新增規格</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                次要規格
              </label>
              {formData.specifications2.map((spec, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={spec}
                    onChange={(e) => updateSpecification('specifications2', index, e.target.value)}
                    className="rm-input flex-1"
                    placeholder={`次要規格 ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeSpecification('specifications2', index)}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addSpecification('specifications2')}
                className="flex items-center space-x-2 text-green-400 hover:text-green-300"
              >
                <Plus className="w-4 h-4" />
                <span>新增次要規格</span>
              </button>
            </div>
          </div>

          {/* 備註 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              備註
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="rm-input h-20"
              placeholder="產品備註、特殊說明等..."
            />
          </div>

          {/* 操作按鈕 */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="rm-button"
            >
              {product ? '更新產品' : '新增產品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 