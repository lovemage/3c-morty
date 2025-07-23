import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Star, Plus, Minus, Share2, Heart } from 'lucide-react';
import { Product, storage } from '../lib/localStorage';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rm-loading w-8 h-8"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-400 mb-4">產品不存在</h2>
          <Link to="/products" className="rm-button">
            返回產品列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Link to="/" className="hover:text-green-400 transition-colors">首頁</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-green-400 transition-colors">產品</Link>
          <span>/</span>
          <Link to={`/category/${product.category}`} className="hover:text-green-400 transition-colors">
            {getCategoryName(product.category)}
          </Link>
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </div>
      </nav>

      {/* Back Button */}
      <Link 
        to="/products"
        className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回產品列表</span>
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="rm-card p-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-800">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/600x600/1a1a2e/00ff00?text=Product+Image';
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
                className="text-green-400 text-sm font-medium hover:text-green-300 transition-colors"
              >
                {getCategoryName(product.category)}
              </Link>
              {product.featured && (
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                  <Star className="w-3 h-3" />
                  <span>精選</span>
                </span>
              )}
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              {product.name}
            </h1>
            
            <p className="text-gray-300 text-lg leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Price */}
          <div className="rm-card p-6 bg-gradient-to-r from-green-400/10 to-blue-400/10 border border-green-400/30">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <>
                    <span className="text-gray-500 line-through text-xl">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      節省 {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>
              {product.originalPrice > product.price && (
                <p className="text-green-400 text-sm">
                  您節省了 {formatPrice(product.originalPrice - product.price)}！
                </p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>庫存：{product.stock} 件</span>
                <span>•</span>
                <span>產品編號：{product.id}</span>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="rm-card">
            <h3 className="text-xl font-bold text-white mb-4">產品規格</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-green-400 font-semibold mb-3">主要規格</h4>
                <div className="space-y-2">
                  {product.specifications.map((spec, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-gray-300">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {product.specifications2 && product.specifications2.length > 0 && (
                <div>
                  <h4 className="text-blue-400 font-semibold mb-3">次要規格</h4>
                  <div className="space-y-2">
                    {product.specifications2.map((spec, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-300">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {product.notes && (
            <div className="rm-card">
              <h3 className="text-xl font-bold text-white mb-4">產品備註</h3>
              <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4">
                <p className="text-yellow-300">{product.notes}</p>
              </div>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 font-medium">數量：</span>
              <div className="flex items-center bg-gray-800 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="p-3 hover:bg-gray-700 rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4 text-gray-400" />
                </button>
                
                <span className="px-6 py-3 font-mono text-white min-w-[4rem] text-center">
                  {quantity}
                </span>
                
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  className="p-3 hover:bg-gray-700 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 flex items-center justify-center space-x-2 px-8 py-4 rounded-lg font-bold transition-all duration-300 ${
                  product.stock === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'rm-button'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{product.stock === 0 ? '已售完' : '加入購物車'}</span>
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleShare}
                  className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  title="分享產品"
                >
                  <Share2 className="w-5 h-5 text-gray-400" />
                </button>
                
                <button
                  className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  title="加入收藏"
                >
                  <Heart className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Total Price */}
          <div className="rm-card bg-gradient-to-r from-green-400/10 to-blue-400/10 border border-green-400/30">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">總價：</span>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600">
                {formatPrice(product.price * quantity)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-gray-800 mb-8">
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
