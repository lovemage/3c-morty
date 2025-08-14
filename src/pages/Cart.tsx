import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      toast.error('請先登入再進行結帳');
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      toast.error('需要管理員權限才能下單');
      return;
    }
    navigate('/checkout');
  };

  const handleClearCart = () => {
    if (window.confirm('確定要清空購物車嗎？')) {
      clearCart();
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-gray-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-400 mb-4">購物車是空的</h2>
          <p className="text-gray-500 mb-8">您還沒有加入任何產品到購物車</p>
          <Link to="/products" className="rm-button">
            去購物
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link 
            to="/products" 
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-gray-800">
            購物車
          </h1>
        </div>
        
        {cart.length > 0 && (
          <button
            onClick={handleClearCart}
            className="rm-button-danger px-4 py-2 text-sm flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>清空購物車</span>
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div key={item.productId} className="rm-card">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Product Image */}
                <div className="w-full sm:w-32 h-32 flex-shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/300x200/1a1a2e/00ff00?text=Product+Image';
                    }}
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1">
                  <Link 
                    to={`/product/${item.product.id}`} 
                    className="text-lg font-bold text-white hover:text-green-400 transition-colors block mb-2"
                  >
                    {item.product.name}
                  </Link>
                  
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {item.product.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.product.specifications.slice(0, 2).map((spec, index) => (
                      <span
                        key={index}
                        className="bg-gray-800 text-green-400 px-2 py-1 rounded text-xs font-mono"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                        {formatPrice(item.product.price)}
                      </span>
                      <p className="text-xs text-gray-500">
                        單價 {formatPrice(item.product.price)} × {item.quantity}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center bg-gray-800 rounded-lg">
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                          className="p-2 hover:bg-gray-700 rounded-l-lg transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-400" />
                        </button>
                        
                        <span className="px-4 py-2 font-mono text-white min-w-[3rem] text-center">
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="p-2 hover:bg-gray-700 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stock Warning */}
                  {item.quantity >= item.product.stock && (
                    <p className="text-orange-400 text-xs mt-2">
                      已達庫存上限（{item.product.stock} 件）
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="rm-card rm-glow sticky top-24">
            <h3 className="text-xl font-bold text-green-400 mb-6">訂單摘要</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-300">
                <span>商品數量：</span>
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} 件</span>
              </div>
              
              <div className="flex justify-between text-gray-300">
                <span>商品總額：</span>
                <span>{formatPrice(getCartTotal())}</span>
              </div>
              
              <div className="flex justify-between text-gray-300">
                <span>運費：</span>
                <span className="text-green-400">免費</span>
              </div>
              
              <hr className="border-gray-700" />
              
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">總計：</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                  {formatPrice(getCartTotal())}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={!isAdmin}
              className={`w-full flex items-center justify-center space-x-2 mb-4 ${
                isAdmin 
                  ? 'rm-button' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-600'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{isAdmin ? '結帳' : '需要管理員權限'}</span>
            </button>
            
            <Link 
              to="/products" 
              className="w-full rm-button-secondary flex items-center justify-center space-x-2"
            >
              <span>繼續購物</span>
            </Link>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-xs text-gray-400">
                    您的購物資料受到Rick的量子加密技術保護，安全無疑。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
