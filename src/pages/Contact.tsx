import React, { useState } from 'react';
import { Phone, MapPin, Clock, Mail, MessageCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 這裡可以添加實際的表單提交邏輯
    toast.success('您的訊息已送出，我們會盡快回覆您！');
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-6">
            聯絡我們
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            有任何問題或建議嗎？我們很樂意聽到您的聲音！
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 公司資訊 */}
          <div className="space-y-8">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-yellow-400/20">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">公司資訊</h2>
              
              <div className="space-y-6">
                {/* 公司名稱 */}
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">小猴組商行</h3>
                    <p className="text-gray-600">統一編號：95268999</p>
                  </div>
                </div>

                {/* 地址 */}
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">營業地址</h3>
                    <p className="text-gray-600">台中市西區民生里自由路一段101號8樓之2</p>
                  </div>
                </div>

                {/* 客服專線 */}
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">客服專線</h3>
                    <p className="text-gray-600">0958-213-165</p>
                  </div>
                </div>

                {/* 客服信箱 */}
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">客服信箱</h3>
                    <p className="text-gray-600">kusoboy210@gmail.com</p>
                  </div>
                </div>

                {/* 營業時間 */}
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">營業時間</h3>
                    <div className="text-gray-600">
                      <p>週一至週五：9:00 - 18:00</p>
                      <p>週六：9:00 - 17:00</p>
                      <p>週日：休息</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 快速聯絡方式 */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-yellow-400/20">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">快速聯絡</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href="tel:0958213165"
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-400 to-green-500 text-white py-3 px-4 rounded-xl hover:from-green-500 hover:to-green-600 transition-all duration-300 transform hover:scale-105"
                >
                  <Phone className="w-5 h-5" />
                  <span>立即致電</span>
                </a>
                <a
                  href="mailto:kusoboy210@gmail.com"
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white py-3 px-4 rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
                >
                  <Mail className="w-5 h-5" />
                  <span>發送郵件</span>
                </a>
              </div>
            </div>
          </div>

          {/* 聯絡表單 */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-yellow-400/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">線上留言</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  姓名 *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                  placeholder="請輸入您的姓名"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  電子郵件 *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                  placeholder="請輸入您的電子郵件"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                  主旨 *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                  placeholder="請輸入訊息主旨"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  訊息內容 *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 resize-none"
                  placeholder="請輸入您要諮詢的內容..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-3 px-6 rounded-xl font-semibold hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>送出訊息</span>
              </button>
            </form>
          </div>
        </div>

        {/* 地圖區域 */}
        <div className="mt-16">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-yellow-400/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">營業據點</h2>
            <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">台中市西區民生里自由路一段101號8樓之2</p>
                <p className="text-sm text-gray-500 mt-2">
                  * 地圖功能開發中，請使用上方地址導航
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 