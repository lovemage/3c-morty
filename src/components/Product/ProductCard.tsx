import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Product } from '../../lib/localStorage';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('請先登入才能加入購物車');
      return;
    }
    addToCart(product.id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="rm-card group overflow-hidden h-[480px] flex flex-col">
      <Link to={`/product/${product.id}`} className="block flex-1 flex flex-col">
        {/* Image Section - Fixed Height */}
        <div className="relative overflow-hidden rounded-lg mb-4 h-48 flex-shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/300x200/1a1a2e/00ff00?text=Product+Image';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {product.featured && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-2 py-1 rounded-full text-xs font-bold">
              <Star className="w-3 h-3 inline mr-1" />
              精選
            </div>
          )}
          
          {product.stock < 10 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              庫存不足
            </div>
          )}
        </div>

        {/* Content Section - Flexible Height */}
        <div className="flex-1 flex flex-col">
          {/* Title - Fixed Height */}
          <h3 className="text-lg font-bold mb-2 text-gray-800 group-hover:text-yellow-600 transition-colors line-clamp-2 h-14 flex items-start">
            {product.name}
          </h3>

          {/* Description - Fixed Height */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 h-10 overflow-hidden">
            {product.description}
          </p>

          {/* Specifications - Fixed Height */}
          <div className="flex flex-wrap gap-1 mb-3 h-7 overflow-hidden">
            {product.specifications.slice(0, 2).map((spec, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono border border-gray-300 h-6 flex items-center"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      </Link>

      {/* Footer Section - Fixed at Bottom */}
      <div className="flex-shrink-0 space-y-3">
        {/* Price Section - Fixed Height */}
        <div className="h-8 flex items-center space-x-2">
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600 flex-shrink-0">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice > product.price && (
            <div className="flex items-center space-x-1 overflow-hidden">
              <span className="text-gray-500 line-through text-sm whitespace-nowrap">
                {formatPrice(product.originalPrice)}
              </span>
              <span className="bg-red-500 text-white px-1 py-0.5 rounded text-xs font-bold whitespace-nowrap">
                -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
              </span>
            </div>
          )}
        </div>
        
        {/* Stock Info - Fixed Height */}
        <p className="text-xs text-gray-600 h-4">庫存：{product.stock} 件</p>

        {/* Button - Fixed Height */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 h-12 flex items-center justify-center ${
            product.stock === 0
              ? 'bg-gray-300 cursor-not-allowed text-gray-500'
              : 'rm-button text-center'
          }`}
        >
          {product.stock === 0 ? '缺貨中' : '加入購物車'}
        </button>
      </div>
    </div>
  );
}

// Add CSS for line clamping and consistent layouts
const style = document.createElement('style');
style.textContent = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
  }
`;
document.head.appendChild(style);
