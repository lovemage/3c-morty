import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Filter, ChevronDown } from 'lucide-react';
import { ProductCard } from '../components/Product/ProductCard';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  original_price: number;
  description: string;
  specifications: string[];
  specifications2: string[];
  stock: number;
  image: string;
  featured?: number;
}

export function Products() {
  const { category } = useParams<{ category?: string }>();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryNames = {
  mouse: '滑鼠',
  keyboard: '鍵盤', 
  cable: '傳輸線',
  powerbank: '行動電源',
  laptop: '筆記型電腦',
  juicer: '果汁機/破壁機'
};

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = category ? `/api/products?category=${category}` : '/api/products';
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        const products = data.products || data;
        setProducts(products);
      } else {
        console.error('Failed to fetch products');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...products];

    // Filter by categories (if not viewing specific category)
    if (!category && selectedCategories.length > 0) {
      filtered = filtered.filter(p => selectedCategories.includes(p.category));
    }

    // Sort products by name (default)
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredProducts(filtered);
  }, [products, selectedCategories, category]);

  const handleCategoryChange = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rm-loading w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-gray-800">
          {category ? categoryNames[category as keyof typeof categoryNames] : '所有產品'}
        </h1>
        <p className="text-gray-400">
          共找到 {filteredProducts.length} 個產品
        </p>
      </div>

      {/* Filters - Top Layout */}
      {!category && (
        <div className="rm-card mb-8">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="w-full flex items-center justify-between mb-4 p-3 lg:hidden"
          >
            <span className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span className="font-medium">產品分類</span>
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <div className={`${filterOpen ? 'block' : 'hidden lg:block'}`}>
            <div>
              <h4 className="font-semibold mb-4 text-gray-800 hidden lg:block">選擇產品分類</h4>
              <div className="flex flex-wrap gap-3">
                {Object.entries(categoryNames).map(([key, name]) => (
                  <label key={key} className="flex items-center space-x-2 cursor-pointer bg-gray-100 px-4 py-3 rounded-lg border hover:bg-gray-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(key)}
                      onChange={() => handleCategoryChange(key)}
                      className="w-4 h-4 accent-yellow-500"
                    />
                    <span className="text-gray-700 font-medium">{name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-4xl">😕</span>
          </div>
          <h3 className="text-xl font-bold text-gray-600 mb-2">沒有找到產品</h3>
          <p className="text-gray-500">請嘗試調整篩選條件</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
