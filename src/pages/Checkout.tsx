import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, User, Phone, ArrowLeft, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../lib/localStorage';
import toast from 'react-hot-toast';

export function Checkout() {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [shippingData, setShippingData] = useState({
    name: user?.name || '',
    address: '',
    city: '',
    postalCode: '',
    phone: ''
  });
  
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: user?.name || ''
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingData({
      ...shippingData,
      [e.target.name]: e.target.value
    });
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Format card number
    if (e.target.name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (value.length > 19) value = value.substr(0, 19);
    }
    
    // Format expiry date
    if (e.target.name === 'expiryDate') {
      value = value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
      if (value.length > 5) value = value.substr(0, 5);
    }
    
    // Format CVV
    if (e.target.name === 'cvv') {
      value = value.replace(/\D/g, '');
      if (value.length > 3) value = value.substr(0, 3);
    }
    
    setPaymentData({
      ...paymentData,
      [e.target.name]: value
    });
  };

  const validateForm = () => {
    // Validate shipping
    if (!shippingData.name || !shippingData.address || !shippingData.city || !shippingData.postalCode || !shippingData.phone) {
      toast.error('請填寫所有配送資料');
      return false;
    }
    
    // Validate payment
    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardholderName) {
      toast.error('請填寫所有付款資料');
      return false;
    }
    
    // Basic validation
    if (paymentData.cardNumber.replace(/\s/g, '').length < 16) {
      toast.error('信用卡號碼格式不正確');
      return false;
    }
    
    if (paymentData.cvv.length < 3) {
      toast.error('CVV格式不正確');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create order
      const order = storage.createOrder({
        userId: user.id,
        items: cart,
        total: getCartTotal(),
        status: 'pending',
        shippingAddress: shippingData
      });
      
      // Clear cart is handled in storage.createOrder
      
      toast.success('訂單成功！正在處理您的訂單...');
      
      // Redirect to success page or profile
      navigate('/profile?tab=orders');
      
    } catch (error) {
      toast.error('訂單失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button 
          onClick={() => navigate('/cart')}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
          結帳
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Information */}
            <div className="rm-card">
              <div className="flex items-center space-x-2 mb-6">
                <MapPin className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-bold text-green-400">配送資料</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    收件人姓名 *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      name="name"
                      type="text"
                      value={shippingData.name}
                      onChange={handleShippingChange}
                      className="rm-input pl-12"
                      placeholder="請輸入收件人姓名"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    聯絡電話 *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      name="phone"
                      type="tel"
                      value={shippingData.phone}
                      onChange={handleShippingChange}
                      className="rm-input pl-12"
                      placeholder="09XX-XXX-XXX"
                      required
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    配送地址 *
                  </label>
                  <input
                    name="address"
                    type="text"
                    value={shippingData.address}
                    onChange={handleShippingChange}
                    className="rm-input"
                    placeholder="請輸入詳細地址"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    城市 *
                  </label>
                  <input
                    name="city"
                    type="text"
                    value={shippingData.city}
                    onChange={handleShippingChange}
                    className="rm-input"
                    placeholder="台北市"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    郵遞區號 *
                  </label>
                  <input
                    name="postalCode"
                    type="text"
                    value={shippingData.postalCode}
                    onChange={handleShippingChange}
                    className="rm-input"
                    placeholder="10001"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="rm-card">
              <div className="flex items-center space-x-2 mb-6">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-blue-400">付款資料</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    持卡人姓名 *
                  </label>
                  <input
                    name="cardholderName"
                    type="text"
                    value={paymentData.cardholderName}
                    onChange={handlePaymentChange}
                    className="rm-input"
                    placeholder="如同信用卡上姓名"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    信用卡號碼 *
                  </label>
                  <input
                    name="cardNumber"
                    type="text"
                    value={paymentData.cardNumber}
                    onChange={handlePaymentChange}
                    className="rm-input font-mono"
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      有效期限 *
                    </label>
                    <input
                      name="expiryDate"
                      type="text"
                      value={paymentData.expiryDate}
                      onChange={handlePaymentChange}
                      className="rm-input font-mono"
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV *
                    </label>
                    <input
                      name="cvv"
                      type="text"
                      value={paymentData.cvv}
                      onChange={handlePaymentChange}
                      className="rm-input font-mono"
                      placeholder="123"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rm-card rm-glow sticky top-24">
              <h3 className="text-xl font-bold text-green-400 mb-6">訂單摘要</h3>
              
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center space-x-3 py-2">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/48x48/1a1a2e/00ff00?text=P';
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{item.product.name}</p>
                      <p className="text-gray-400 text-xs">
                        {formatPrice(item.product.price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-green-400 font-bold text-sm">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              
              <hr className="border-gray-300 mb-4" />
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>商品總額：</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
                
                <div className="flex justify-between text-gray-700">
                  <span>運費：</span>
                  <span className="text-green-500">免費</span>
                </div>
                
                <hr className="border-gray-300" />
                
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">總計：</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                    {formatPrice(getCartTotal())}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rm-button flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <div className="rm-loading"></div>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>確認訂單</span>
                  </>
                )}
              </button>
              
              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-400 text-center">
                  🔒 您的付款資料受到Rick的量子加密技術保護
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
