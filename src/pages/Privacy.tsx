import React from 'react';
import { Shield, Lock, Eye, Database, AlertTriangle } from 'lucide-react';

export function Privacy() {
  const lastUpdated = "2025年1月24日";

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-6">
            隱私政策
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            我們重視您的隱私權，本政策說明我們如何收集、使用和保護您的個人資料
          </p>
          <p className="text-sm text-gray-500 mt-4">
            最後更新時間：{lastUpdated}
          </p>
        </div>

        {/* Legal Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-12">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">重要聲明</h3>
              <p className="text-yellow-700 text-sm">
                本隱私政策僅為基本框架模板。實際使用前，請務必諮詢專業法律人士，
                以確保符合相關法規要求，包括但不限於個人資料保護法等相關規定。
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-gray-200">
          <div className="prose prose-lg max-w-none">
            
            {/* 1. 基本資訊 */}
            <section className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                  <Database className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">1. 基本資訊</h2>
              </div>
              <div className="text-gray-600 space-y-4">
                <p><strong>資料控制者：</strong>小猴組商行</p>
                <p><strong>統一編號：</strong>95268999</p>
                <p><strong>營業地址：</strong>台中市西區民生里自由路一段101號8樓之2</p>
                <p><strong>聯絡方式：</strong>kusoboy210@gmail.com</p>
              </div>
            </section>

            {/* 2. 收集的資料類型 */}
            <section className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">2. 我們收集的資料類型</h2>
              </div>
              <div className="text-gray-600 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">2.1 個人識別資料</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>姓名</li>
                    <li>電子郵件地址</li>
                    <li>聯絡電話</li>
                    <li>寄送地址</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">2.2 訂單與交易資料</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>購買商品資訊</li>
                    <li>付款資訊（不包含完整信用卡號碼）</li>
                    <li>訂單歷史記錄</li>
                    <li>配送資訊</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">2.3 技術資料</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>IP 位址</li>
                    <li>瀏覽器類型和版本</li>
                    <li>裝置資訊</li>
                    <li>網站使用記錄</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 3. 資料使用目的 */}
            <section className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Database className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">3. 資料使用目的</h2>
              </div>
              <div className="text-gray-600">
                <ul className="list-disc list-inside space-y-3 ml-4">
                  <li>處理您的訂單和配送</li>
                  <li>提供客戶服務和技術支援</li>
                  <li>發送訂單確認和出貨通知</li>
                  <li>處理退換貨請求</li>
                  <li>改善網站功能和用戶體驗</li>
                  <li>防範詐騙和確保安全</li>
                  <li>遵守法律義務</li>
                  <li>經您同意的行銷活動（可隨時取消）</li>
                </ul>
              </div>
            </section>

            {/* 4. 資料分享與揭露 */}
            <section className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">4. 資料分享與揭露</h2>
              </div>
              <div className="text-gray-600 space-y-4">
                <p>我們不會販售您的個人資料。僅在以下情況下分享資料：</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>配送服務提供商（僅限配送必要資訊）</li>
                  <li>付款處理服務商</li>
                  <li>法律要求或法院命令</li>
                  <li>保護公司權益或用戶安全</li>
                  <li>經您明確同意的情況</li>
                </ul>
              </div>
            </section>

            {/* 5. 資料保存期限 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">5. 資料保存期限</h2>
              <div className="text-gray-600 space-y-4">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>帳戶資料：</strong>帳戶使用期間及關閉後2年</li>
                  <li><strong>訂單記錄：</strong>交易完成後5年（依法律要求）</li>
                  <li><strong>行銷資料：</strong>至您取消同意為止</li>
                  <li><strong>網站記錄：</strong>最多2年</li>
                </ul>
              </div>
            </section>

            {/* 6. 您的權利 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">6. 您的權利</h2>
              <div className="text-gray-600">
                <p className="mb-4">依據個人資料保護法，您享有以下權利：</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>查詢或請求閱覽您的個人資料</li>
                  <li>請求製給複製本</li>
                  <li>請求補充或更正</li>
                  <li>請求停止收集、處理或利用</li>
                  <li>請求刪除</li>
                </ul>
                <p className="mt-4">如需行使上述權利，請聯絡：kusoboy210@gmail.com</p>
              </div>
            </section>

            {/* 7. 資料安全 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">7. 資料安全</h2>
              <div className="text-gray-600 space-y-4">
                <p>我們採取適當的技術和組織措施保護您的個人資料：</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>SSL 加密傳輸</li>
                  <li>定期安全檢查</li>
                  <li>員工教育訓練</li>
                  <li>存取權限控制</li>
                  <li>資料備份機制</li>
                </ul>
              </div>
            </section>

            {/* 8. Cookie 政策 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">8. Cookie 政策</h2>
              <div className="text-gray-600 space-y-4">
                <p>我們使用 Cookie 和類似技術來：</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>記住您的偏好設定</li>
                  <li>維持購物車內容</li>
                  <li>分析網站使用情況</li>
                  <li>提供個人化體驗</li>
                </ul>
                <p>您可以通過瀏覽器設定管理 Cookie 偏好。</p>
              </div>
            </section>

            {/* 9. 政策變更 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">9. 政策變更</h2>
              <div className="text-gray-600 space-y-4">
                <p>我們可能會不時更新本隱私政策。重大變更時，我們會：</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>在網站上發布通知</li>
                  <li>通過電子郵件通知（如適用）</li>
                  <li>更新「最後更新時間」</li>
                </ul>
                <p>建議您定期查看本政策以了解最新資訊。</p>
              </div>
            </section>

            {/* 10. 聯絡我們 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">10. 聯絡我們</h2>
              <div className="text-gray-600 space-y-4">
                <p>如果您對本隱私政策有任何疑問，請聯絡我們：</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>小猴組商行</strong></p>
                  <p>電子郵件：kusoboy210@gmail.com</p>
                  <p>地址：台中市西區民生里自由路一段101號8樓之2</p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
} 