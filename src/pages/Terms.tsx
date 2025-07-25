import React from 'react';
import { FileText, Scale, AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function Terms() {
  const lastUpdated = "2025年1月24日";

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-6">
            服務條款
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            歡迎使用我們的服務，請仔細閱讀以下條款
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
                本服務條款僅為基本框架模板。實際使用前，請務必諮詢專業法律人士，
                以確保符合相關法規要求，包括但不限於電子商務、消費者保護等相關法律。
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
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">1. 服務提供者資訊</h2>
              </div>
              <div className="text-gray-600 space-y-4">
                <p><strong>服務提供者：</strong>小猴組商行</p>
                <p><strong>統一編號：</strong>95268999</p>
                <p><strong>營業地址：</strong>台中市西區民生里自由路一段101號8樓之2</p>
                <p><strong>聯絡方式：</strong>kusoboy210@gmail.com</p>
                <p><strong>網站名稱：</strong>Corba 3C Shop</p>
              </div>
            </section>

            {/* 2. 服務範圍 */}
            <section className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">2. 服務範圍</h2>
              </div>
              <div className="text-gray-600 space-y-4">
                <p>本網站提供以下服務：</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>3C 電子產品零售服務</li>
                  <li>線上商品展示與銷售</li>
                  <li>客戶服務與技術支援</li>
                  <li>配送與物流服務</li>
                  <li>退換貨處理服務</li>
                  <li>會員帳戶管理</li>
                </ul>
              </div>
            </section>

            {/* 3. 使用條件 */}
            <section className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Scale className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">3. 使用條件</h2>
              </div>
              <div className="text-gray-600 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">3.1 用戶資格</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>年滿 18 歲或經法定代理人同意</li>
                    <li>具有完全民事行為能力</li>
                    <li>提供真實、準確的個人資料</li>
                    <li>遵守相關法律法規</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">3.2 帳戶管理</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>用戶有責任保管帳戶密碼</li>
                    <li>不得與他人共享帳戶</li>
                    <li>發現異常使用應立即通知我們</li>
                    <li>對帳戶活動承擔責任</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 4. 商品與訂單 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">4. 商品與訂單</h2>
              <div className="text-gray-600 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">4.1 商品資訊</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>商品圖片僅供參考，以實際商品為準</li>
                    <li>商品規格可能因廠商更新而異動</li>
                    <li>價格可能隨時調整，以下單時顯示為準</li>
                    <li>庫存數量即時更新，實際以系統為準</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">4.2 訂單處理</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>訂單確認後即視為契約成立</li>
                    <li>付款完成後開始出貨程序</li>
                    <li>因缺貨或其他因素可能取消訂單</li>
                    <li>取消訂單將全額退款</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 5. 付款與配送 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">5. 付款與配送</h2>
              <div className="text-gray-600 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">5.1 付款方式</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>信用卡付款</li>
                    <li>ATM 轉帳</li>
                    <li>超商付款</li>
                    <li>貨到付款（部分地區）</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">5.2 配送政策</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>工作日 1-3 天內出貨</li>
                    <li>配送時間依物流公司安排</li>
                    <li>偏遠地區可能需額外時間</li>
                    <li>配送費用依商品重量計算</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 6. 退換貨政策 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">6. 退換貨政策</h2>
              <div className="text-gray-600 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">6.1 退貨條件</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>收貨後 7 天內申請（依消保法）</li>
                    <li>商品必須為全新未使用狀態</li>
                    <li>包裝及配件需完整</li>
                    <li>需檢附購買證明</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">6.2 不適用退貨</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>客製化商品</li>
                    <li>易腐敗商品</li>
                    <li>已拆封之軟體或數位商品</li>
                    <li>個人衛生用品</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 7. 責任限制 */}
            <section className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">7. 責任限制</h2>
              </div>
              <div className="text-gray-600 space-y-4">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>網站服務可能因維護或技術問題暫停</li>
                  <li>不保證網站資訊完全正確或即時</li>
                  <li>第三方連結內容不承擔責任</li>
                  <li>不可抗力因素造成的損失不負責</li>
                  <li>間接損失或利益損失不承擔責任</li>
                </ul>
              </div>
            </section>

            {/* 8. 禁止行為 */}
            <section className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">8. 禁止行為</h2>
              </div>
              <div className="text-gray-600 space-y-4">
                <p>用戶不得從事以下行為：</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>提供虛假資訊</li>
                  <li>侵犯他人智慧財產權</li>
                  <li>惡意攻擊或破壞系統</li>
                  <li>散佈惡意軟體或病毒</li>
                  <li>進行詐騙或非法活動</li>
                  <li>濫用客服系統</li>
                  <li>其他違法或違規行為</li>
                </ul>
              </div>
            </section>

            {/* 9. 智慧財產權 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">9. 智慧財產權</h2>
              <div className="text-gray-600 space-y-4">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>網站所有內容受智慧財產權保護</li>
                  <li>未經授權不得複製、修改或散佈</li>
                  <li>商標及標誌為本公司所有</li>
                  <li>尊重第三方智慧財產權</li>
                  <li>侵權行為將依法處理</li>
                </ul>
              </div>
            </section>

            {/* 10. 服務終止 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">10. 服務終止</h2>
              <div className="text-gray-600 space-y-4">
                <p>在以下情況下，我們有權終止或暫停服務：</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>用戶違反服務條款</li>
                  <li>用戶從事非法或不當行為</li>
                  <li>長期未使用帳戶</li>
                  <li>技術或商業因素</li>
                  <li>法律要求</li>
                </ul>
                <p className="mt-4">服務終止時，未完成的訂單將依既有程序處理。</p>
              </div>
            </section>

            {/* 11. 條款修改 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">11. 條款修改</h2>
              <div className="text-gray-600 space-y-4">
                <p>我們保留修改本服務條款的權利：</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>修改後將在網站公告</li>
                  <li>重大變更將另行通知用戶</li>
                  <li>繼續使用視為同意修改條款</li>
                  <li>不同意者可停止使用服務</li>
                </ul>
              </div>
            </section>

            {/* 12. 適用法律與管轄 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">12. 適用法律與管轄</h2>
              <div className="text-gray-600 space-y-4">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>本條款適用中華民國法律</li>
                  <li>爭議以台中地方法院為第一審管轄法院</li>
                  <li>優先以協商方式解決爭議</li>
                  <li>必要時可申請調解</li>
                </ul>
              </div>
            </section>

            {/* 13. 聯絡我們 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">13. 聯絡我們</h2>
              <div className="text-gray-600 space-y-4">
                <p>如對本服務條款有任何疑問，請聯絡我們：</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>小猴組商行</strong></p>
                  <p>電子郵件：kusoboy210@gmail.com</p>
                  <p>地址：台中市西區民生里自由路一段101號8樓之2</p>
                  <p>營業時間：週一至週五 10:00-18:00，週六 10:00-17:00</p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
} 