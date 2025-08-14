import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { storage } from '../lib/localStorage';
import { ProductCard } from '../components/Product/ProductCard';

export function Home() {
  const featuredProducts = storage.getProducts().filter(p => p.featured).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Full Screen Hero Section */}
      <section className="hero-section relative flex flex-col justify-center h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Hero Background */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-300"
            style={{
              backgroundImage: `url('/images/others/hero.webp'), url('/images/others/hero.png')`,
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-transparent to-purple-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        </div>



        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 md:px-8 pb-24">
          <div className="text-center max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-12 leading-tight">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rm-text-glow">
                Corba
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-300">
                3C Shop
              </span>
            </h1>

            {/* Hero Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/products" 
                className="hero-button-primary group bg-white text-black font-bold py-4 px-8 border-2 border-white hover:bg-yellow-400 hover:border-yellow-400 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
              >
                <span>開始探索</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                to="/categories" 
                className="hero-button group text-white font-bold py-4 px-8 border-2 border-white bg-transparent hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
              >
                <span>產品分類</span>
                <Star className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Animation Elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-green-400 rounded-full opacity-60 animate-ping"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-yellow-400 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute bottom-40 left-20 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-bounce"></div>
        <div className="absolute bottom-60 right-10 w-5 h-5 bg-purple-400 rounded-full opacity-40 animate-ping"></div>
      </section>

      {/* Additional Content Section */}
      <article className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
          為什麼選擇次元級3C產品？
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="rm-card">
            <h3 className="text-xl font-bold text-green-400 mb-4">🔬 實驗室級品質</h3>
            <p className="text-gray-600 leading-relaxed">
              每個產品都經過Rick實驗室的嚴格測試，確保在任何次元都能正常運作。我們的品質標準超越了宇宙法則的限制。
            </p>
          </div>
          
          <div className="rm-card">
            <h3 className="text-xl font-bold text-blue-400 mb-4">⚡ 次元穿越技術</h3>
            <p className="text-gray-600 leading-relaxed">
              採用最新的跨維度技術，讓您的設備擁有無限可能。從C-137到地球C-131，我們的產品在每個維度都是頂級的。
            </p>
          </div>
          
          <div className="rm-card">
            <h3 className="text-xl font-bold text-purple-400 mb-4">🌟 Rick認證保證</h3>
            <p className="text-gray-600 leading-relaxed">
              獲得Rick Sanchez親自認證的產品，代表著宇宙中最高的科技水準。如果Rick說好，那就是真的好！
            </p>
          </div>
          
          <div className="rm-card">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">🚀 Morty友善設計</h3>
            <p className="text-gray-600 leading-relaxed">
              即使是Morty這樣的普通人也能輕鬆使用。我們的設計理念是讓最複雜的科技變得簡單易懂。
            </p>
          </div>
        </div>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-800">
              精選商品
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/products" className="rm-button-secondary">
                查看更多產品
              </Link>
            </div>
          </section>
        )}

        {/* Call to Action */}
        <div className="text-center rm-card bg-gradient-to-r from-green-400/10 to-blue-400/10 border border-green-400/30">
          <h3 className="text-2xl font-bold text-green-400 mb-4">
            準備好進入科技的新次元了嗎？
          </h3>
          <p className="text-gray-600 mb-6 text-lg">
            加入我們，體驗Corba 3C Shop最棒的購物體驗
          </p>
          <Link to="/products" className="rm-button">
            立即開始探險
          </Link>
        </div>
      </article>
    </div>
  );
}
