import React, { useState } from 'react';
import { Phone, Mail, Clock, MapPin, DollarSign, Users, Send, Briefcase, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function Careers() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    motivation: '',
    resume: null as File | null
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      resume: file
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('您的應徵資料已送出，我們會盡快與您聯絡！');
    setFormData({
      name: '',
      email: '',
      phone: '',
      experience: '',
      motivation: '',
      resume: null
    });
  };

  const jobRequirements = [
    '熟悉電商平台操作（蝦皮、PChome、momo等）',
    '具備基本電腦操作能力',
    '良好的溝通能力與客服技巧',
    '細心負責，具備學習熱忱',
    '有網拍或電商經驗者優先',
    '熟悉商品拍攝與圖片處理者加分'
  ];

  const jobBenefits = [
    '月薪 26,500 元',
    '週休二日',
    '勞健保',
    '特別休假',
    '績效獎金',
    '員工購物優惠',
    '教育訓練',
    '升遷機會'
  ];

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-6">
            人才招募
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            加入我們的團隊，一起打造更好的 3C 購物體驗！
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 職位詳情 */}
          <div className="space-y-8">
            {/* 職位標題 */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-yellow-400/20">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">網拍小助手</h2>
                  <p className="text-gray-600">全職 · 台中市西區</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* 薪資 */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">月薪</p>
                    <p className="font-semibold text-gray-800">NT$ 26,500</p>
                  </div>
                </div>

                {/* 工作時間 */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">工作時間</p>
                    <p className="font-semibold text-gray-800">10:00 - 18:00</p>
                  </div>
                </div>

                {/* 工作地點 */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">工作地點</p>
                    <p className="font-semibold text-gray-800">台中市西區</p>
                  </div>
                </div>

                {/* 職位類型 */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">職位類型</p>
                    <p className="font-semibold text-gray-800">全職正職</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 工作內容 */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-yellow-400/20">
              <h3 className="text-xl font-bold text-gray-800 mb-4">工作內容</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>協助網路商店商品上架與資料維護</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>處理客戶訂單確認與出貨作業</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>客服訊息回覆與售後服務處理</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>商品庫存管理與盤點</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>協助商品拍攝與圖片處理</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>配合促銷活動執行與推廣</span>
                </li>
              </ul>
            </div>

            {/* 應徵條件 */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-yellow-400/20">
              <h3 className="text-xl font-bold text-gray-800 mb-4">應徵條件</h3>
              <ul className="space-y-2 text-gray-600">
                {jobRequirements.map((requirement, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 福利待遇 */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-yellow-400/20">
              <h3 className="text-xl font-bold text-gray-800 mb-4">福利待遇</h3>
              <div className="grid grid-cols-2 gap-3">
                {jobBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 應徵表單 */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-yellow-400/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">立即應徵</h2>
            
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
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  聯絡電話 *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                  placeholder="請輸入您的聯絡電話"
                />
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-semibold text-gray-700 mb-2">
                  相關經驗
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 resize-none"
                  placeholder="請描述您的相關工作經驗或技能..."
                />
              </div>

              <div>
                <label htmlFor="motivation" className="block text-sm font-semibold text-gray-700 mb-2">
                  應徵動機 *
                </label>
                <textarea
                  id="motivation"
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 resize-none"
                  placeholder="請說明您為什麼想加入我們團隊..."
                />
              </div>

              <div>
                <label htmlFor="resume" className="block text-sm font-semibold text-gray-700 mb-2">
                  履歷附件
                </label>
                <input
                  type="file"
                  id="resume"
                  name="resume"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                />
                <p className="text-xs text-gray-500 mt-2">
                  支援格式：PDF、DOC、DOCX (檔案大小上限 5MB)
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-3 px-6 rounded-xl font-semibold hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>送出應徵</span>
              </button>
            </form>

            {/* 聯絡資訊 */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">有疑問嗎？</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">0958-213-165</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">kusoboy210@gmail.com</span>
                </div>
                <p className="text-sm text-gray-500">
                  歡迎電話或郵件洽詢，我們會盡快為您解答！
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 