import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  original_price: number;
  description: string;
  stock: number;
  image: string;
  featured?: number;
}

export function Categories() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const { categories: categoryData, loading } = useCategories();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };
  
  const categories = categoryData.map(category => ({
    ...category,
    count: products.filter(p => p.category === category.id).length
  }));

  if (loading || loadingProducts) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="rm-loading w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-gray-800">
          產品分類
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          探索Rick實驗室的最新科技產品，每一類都經過次元強化處理
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.id}`}
            className="rm-card group hover:scale-105 transition-all duration-500 overflow-hidden"
          >
            <div className="relative">
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
              
              {/* Content */}
              <div className="relative z-10 p-8">
                <div className="text-center">
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors">
                    {category.name}
                  </h3>
                  
                  <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors">
                    {category.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${category.gradient} text-white`}>
                      {category.count} 個產品
                    </span>
                    
                    <div className="flex items-center text-green-400 group-hover:text-green-300 transition-colors">
                      <span className="mr-2">查看更多</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-green-400/50 rounded-xl transition-colors duration-300"></div>
            </div>
          </Link>
        ))}
      </div>

      {/* Features Section */}
      <section className="rm-card rm-glow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-6">
            為什麼選擇我們的產品？
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-bold text-green-400 mb-2">量子技術</h3>
              <p className="text-gray-300 text-sm">
                所有產品都經過Rick的量子技術強化，性能超越常規產品
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">🕰</span>
              </div>
              <h3 className="text-lg font-bold text-blue-400 mb-2">次元保障</h3>
              <p className="text-gray-300 text-sm">
                提供跨維度售後服務，即使在平行宇宙也能維修
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-lg font-bold text-purple-400 mb-2">Portal送貨</h3>
              <p className="text-gray-300 text-sm">
                使用Portal技術送貨，全台灣本島即時送達
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
