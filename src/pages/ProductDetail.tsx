import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Star, Plus, Minus, Share2, Heart } from 'lucide-react';
import { Product, storage } from '../lib/localStorage';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../hooks/useCategories';
import { ProductCard } from '../components/Product/ProductCard';
import toast from 'react-hot-toast';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/products');
      return;
    }

    setLoading(true);
    const allProducts = storage.getProducts();
    const foundProduct = allProducts.find(p => p.id === id);
    
    if (!foundProduct) {
      navigate('/products');
      return;
    }

    setProduct(foundProduct);
    
    // Get related products from same category
    const related = allProducts
      .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
      .slice(0, 4);
    setRelatedProducts(related);
    
    setLoading(false);
  }, [id, navigate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error('請先登入才能加入購物車');
      navigate('/login');
      return;
    }
    
    if (!product) return;
    
    addToCart(product.id, quantity);
  };

  const handleQuantityChange = (delta: number) => {
    if (!product) return;
    
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href
      });
    } catch (error) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('連結已複製到剪貼簿');
    }
  };

  const { getCategoryName } = useCategories();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="rm-loading w-8 h-8"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">產品不存在</h2>
          <Link to="/products" className="rm-button">
            返回產品列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-light min-h-screen">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-yellow-600 transition-colors font-medium">首頁</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-yellow-600 transition-colors font-medium">產品</Link>
          <span>/</span>
          <Link to={`/category/${product.category}`} className="hover:text-yellow-600 transition-colors font-medium">
            {getCategoryName(product.category)}
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold">{product.name}</span>
        </div>
      </nav>

      {/* Back Button */}
      <Link 
        to="/products"
        className="inline-flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors mb-6 font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回產品列表</span>
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="rm-card p-4 bg-white border border-gray-200">
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-50">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/600x600/f8f8f8/999999?text=Product+Image';
                }}
              />
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Link 
                to={`/category/${product.category}`}
                className="text-yellow-600 text-sm font-semibold hover:text-yellow-700 transition-colors px-3 py-1 bg-yellow-100 rounded-full"
              >
                {getCategoryName(product.category)}
              </Link>
              {product.featured && (
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
                  <Star className="w-3 h-3" />
                  <span>精選</span>
                </span>
              )}
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {product.name}
            </h1>
            
            <p className="text-gray-700 text-lg leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Price */}
          <div className="rm-card p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 shadow-lg">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <>
                    <span className="text-gray-500 line-through text-xl">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
                      節省 {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>
              {product.originalPrice > product.price && (
                <p className="text-green-600 text-sm font-medium">
                  您節省了 {formatPrice(product.originalPrice - product.price)}！
                </p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="font-medium">庫存：<span className="text-gray-800 font-bold">{product.stock} 件</span></span>
                <span>•</span>
                <span className="font-medium">產品編號：<span className="text-gray-800">{product.id}</span></span>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="rm-card bg-white border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">產品規格</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-yellow-600 font-semibold mb-3 text-lg">主要規格</h4>
                <div className="space-y-2">
                  {product.specifications.map((spec, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {product.specifications2 && product.specifications2.length > 0 && (
                <div>
                  <h4 className="text-orange-600 font-semibold mb-3 text-lg">次要規格</h4>
                  <div className="space-y-2">
                    {product.specifications2.map((spec, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-700 font-medium">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {product.notes && (
            <div className="rm-card bg-white border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">產品備註</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">{product.notes}</p>
              </div>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-gray-800 font-semibold">數量：</span>
              <div className="flex items-center bg-white border border-gray-300 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="p-3 hover:bg-gray-100 rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                
                <span className="px-6 py-3 font-mono text-gray-900 font-bold min-w-[4rem] text-center border-x border-gray-300">
                  {quantity}
                </span>
                
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  className="p-3 hover:bg-gray-100 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 flex items-center justify-center space-x-2 px-8 py-4 rounded-lg font-bold transition-all duration-300 shadow-lg ${
                  product.stock === 0
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'rm-button'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{product.stock === 0 ? '已售完' : '加入購物車'}</span>
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleShare}
                  className="p-4 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
                  title="分享產品"
                >
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
                
                <button
                  className="p-4 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
                  title="加入收藏"
                >
                  <Heart className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Total Price */}
          <div className="rm-card bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-800 font-semibold text-lg">總價：</span>
              <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                {formatPrice(product.price * quantity)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-800">
            相關產品
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
