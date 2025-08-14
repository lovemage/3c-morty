import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface OrderInfo {
  order_id: number;
  external_order_id: string;
  client_system: string;
  amount: number;
  product_info: string;
  paid_at: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    email: string;
  } | null;
}

interface CustomerForm {
  name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  email: string;
}

const CustomerInfo: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CustomerForm>({
    name: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    email: ''
  });

  // 台灣城市選項
  const taiwanCities = [
    '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
    '新竹市', '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣',
    '嘉義市', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣', '台東縣',
    '澎湖縣', '金門縣', '連江縣', '基隆市'
  ];

  useEffect(() => {
    fetchOrderInfo();
  }, [orderId]);

  const fetchOrderInfo = async () => {
    try {
      const response = await fetch(`/api/customer-info/${orderId}`);
      const data = await response.json();

      if (data.success) {
        setOrderInfo(data.data);
        
        // 如果已有客戶資料，填入表單
        if (data.data.customer) {
          setForm(data.data.customer);
        }
      } else {
        toast.error(data.message || '載入訂單資訊失敗');
        if (data.order_status && data.order_status !== 'paid') {
          toast.error('此訂單尚未付款完成');
        }
      }
    } catch (error) {
      console.error('載入訂單資訊失敗:', error);
      toast.error('載入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/customer-info/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('客戶資料已儲存成功！');
        // 重新載入資料以確認儲存成功
        await fetchOrderInfo();
      } else {
        toast.error(data.message || '儲存失敗');
      }
    } catch (error) {
      console.error('儲存客戶資料失敗:', error);
      toast.error('儲存失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!orderInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">訂單不存在</h2>
          <p className="text-gray-600 mb-4">找不到指定的訂單，請確認連結是否正確。</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">填寫收件資訊</h1>
          
          {/* 訂單資訊 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">訂單資訊</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">訂單編號：</span>
                <span className="font-medium">{orderInfo.external_order_id}</span>
              </div>
              <div>
                <span className="text-gray-600">金額：</span>
                <span className="font-medium text-green-600">NT$ {orderInfo.amount.toLocaleString()}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-gray-600">商品：</span>
                <span className="font-medium">{orderInfo.product_info}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-gray-600">付款時間：</span>
                <span className="font-medium">{new Date(orderInfo.paid_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 客戶資料表單 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  收件人姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  聯絡電話 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  pattern="09[0-9]{8}"
                  placeholder="09xxxxxxxx"
                  value={form.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  縣市 <span className="text-red-500">*</span>
                </label>
                <select
                  id="city"
                  name="city"
                  required
                  value={form.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">請選擇縣市</option>
                  {taiwanCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                  郵遞區號 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  required
                  pattern="[0-9]{3,5}"
                  placeholder="例: 10001"
                  value={form.postal_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  電子郵件
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                詳細地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address"
                name="address"
                required
                placeholder="請輸入完整地址（不含縣市）"
                value={form.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '儲存中...' : orderInfo.customer ? '更新資料' : '儲存資料'}
              </button>
            </div>
          </form>

          {orderInfo.customer && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 font-medium">✅ 客戶資料已填寫完成</p>
              <p className="text-green-600 text-sm mt-1">
                您可以隨時回到此頁面修改資料
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerInfo;