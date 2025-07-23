import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import { storage } from '../lib/localStorage';
import { ProductCard } from '../components/Product/ProductCard';

export function Home() {
  const featuredProducts = storage.getProducts().filter(p => p.featured).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-6">
            <div className="w-24 h-24 mx-auto flex items-center justify-center">
                        <img 
            src="/images/products/logo-3.png"
            alt="Rick & Morty Logo" 
                className="w-24 h-24 object-contain transition-transform duration-300 hover:scale-110"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="w-24 h-24 rm-portal flex items-center justify-center text-4xl font-bold hidden">
                R&M
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 rm-text-glow">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600">
              Rick & Morty
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 via-gray-700 to-black">
              3C 電商城
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto font-mono">
            次元穿越級的3C產品，由Rick實驗室製造，品質保證超越宇宙標準！
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/products" className="rm-button flex items-center space-x-2">
              <span>開始購物</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/categories" className="rm-button-secondary flex items-center space-x-2">
              <span>瀏覽分類</span>
              <Zap className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-yellow-400 rounded-full animate-bounce opacity-40"></div>
        <div className="absolute top-40 right-16 w-6 h-6 bg-gray-700 rounded-full animate-bounce opacity-40" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-32 left-20 w-3 h-3 bg-red-400 rounded-full animate-bounce opacity-40" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 right-10 w-5 h-5 bg-orange-400 rounded-full animate-bounce opacity-40" style={{animationDelay: '1.5s'}}></div>
      </section>



      {/* Featured Products */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-gray-800">
              精選產品
            </h2>
            <Link to="/products" className="rm-button-secondary flex items-center space-x-2">
              <span>查看全部</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rm-card rm-glow">
            <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-gray-800">
              加入次元通訊
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              獲取最新的科學產品資訊和實驗室特別優惠！
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="輸入您的電子郵件"
                className="rm-input flex-1"
              />
              <button className="rm-button px-8">
                訂閱
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
