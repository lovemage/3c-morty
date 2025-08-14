import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, User, Phone, ArrowLeft, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../lib/localStorage';
import toast from 'react-hot-toast';

export function Checkout() {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [shippingData, setShippingData] = useState({
    name: user?.name || '',
    address: '',
    city: '',
    postalCode: '',
    phone: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('BARCODE'); // 固定為條碼付款

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!isAdmin) {
    navigate('/login');
    toast.error('需要管理員權限才能下單');
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

  // 生成唯一的訂單編號
  const generateMerchantTradeNo = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `RM${timestamp}${random}`.substring(0, 20);
  };

  const validateForm = () => {
    // Validate shipping
    if (!shippingData.name || !shippingData.address || !shippingData.city || !shippingData.postalCode || !shippingData.phone) {
      toast.error('請填寫所有配送資料');
      return false;
    }
    
    // 驗證手機號碼格式
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(shippingData.phone.replace(/[-\s]/g, ''))) {
      toast.error('請輸入正確的手機號碼格式（09XXXXXXXX）');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      
      // 建立訂單數據
      const orderData = {
        merchant_trade_no: generateMerchantTradeNo(),
        total_amount: getCartTotal(),
        items: cart.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        })),
        trade_desc: `Corba 3C Shop 訂單 - ${cart.map(item => item.product.name).join(', ')}`,
        customer_info: {
          name: shippingData.name,
          phone: shippingData.phone,
          address: `${shippingData.city} ${shippingData.address}`,
          city: shippingData.city,
          postal_code: shippingData.postalCode
        },
        payment_method: 'BARCODE',
        client_back_url: `${window.location.origin}/checkout/success`,
        return_url: `${window.location.origin}/api/ecpay/callback`,
        payment_info_url: `${window.location.origin}/api/ecpay/payment-info`
      };
      
      // 提交訂單到後端
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        throw new Error('訂單建立失敗');
      }
      
      const result = await response.json();
      
      // 清空購物車
      clearCart();
      
      // 處理綠界付款表單
      if (result.payment_form_html) {
        // 創建新窗口顯示綠界付款表單
        const paymentWindow = window.open('', 'ECPayPayment', 'width=800,height=600');
        if (paymentWindow) {
          paymentWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>綠界付款</title>
              <meta charset="UTF-8">
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 40px; 
                  text-align: center;
                  background: #f5f5f5;
                }
                .loading {
                  font-size: 18px;
                  color: #666;
                  margin: 20px 0;
                }
                .ecpay-submit-btn {
                  background: #00a854;
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  font-size: 16px;
                  cursor: pointer;
                  border-radius: 4px;
                }
              </style>
            </head>
            <body>
              <div class="loading">正在跳轉到綠界付款頁面...</div>
              ${result.payment_form_html}
            </body>
            </html>
          `);
          paymentWindow.document.close();
        } else {
          toast.error('無法開啟付款頁面，請檢查瀏覽器彈出視窗設定');
        }
        
        // 導向成功頁面
        navigate('/checkout/success', { 
          state: { 
            orderData: result,
            paymentPending: true
          } 
        });
      } else if (result.payment_url) {
        // 備用方案：直接跳轉
        window.location.href = result.payment_url;
      } else {
        // 導向成功頁面
        navigate('/checkout/success', { state: { orderData: result } });
      }
      
    } catch (error) {
      console.error('結帳錯誤:', error);
      toast.error('訂單建立失敗，請稍後再試');
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
                <div className="w-5 h-5 bg-gradient-to-r from-orange-400 to-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                  條
                </div>
                <h2 className="text-xl font-bold text-orange-400">付款方式</h2>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🏪</span>
                  </div>
                  <h3 className="text-lg font-bold text-orange-400">超商條碼付款</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <span className="text-orange-400 text-sm">•</span>
                    <p className="text-gray-300 text-sm">
                      支援 7-ELEVEN、全家、萊爾富、OK超商
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-orange-400 text-sm">•</span>
                    <p className="text-gray-300 text-sm">
                      付款期限：7天（訂單成立後）
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-orange-400 text-sm">•</span>
                    <p className="text-gray-300 text-sm">
                      確認訂單後將顯示付款條碼，請至超商掃碼繳費
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-orange-400 text-sm">•</span>
                    <p className="text-gray-300 text-sm">
                      付款手續費：免費
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded">
                  <p className="text-xs text-orange-300 text-center">
                    💡 訂單確認後，系統將自動產生付款條碼供您使用
                  </p>
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
                    <span>建立訂單並取得付款條碼</span>
                  </>
                )}
              </button>
              
              <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <p className="text-xs text-orange-300 text-center">
                  🏪 將透過綠界科技安全金流系統處理您的付款
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
