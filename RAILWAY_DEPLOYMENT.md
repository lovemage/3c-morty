# 第三方金流API - 廠商接入文件

## 🎯 服務說明
本API協助廠商建立條碼付款訂單，提供ECPay金流表單參數，廠商需要引導用戶到ECPay頁面完成條碼生成和付款。

## 🚀 快速開始

### 創建付款訂單

**端點**: `POST /api/third-party/barcode/create`

**請求**:
```json
{
  "amount": 299,
  "client_order_id": "ORDER-001"
}
```

**回應**:
```json
{
  "success": true,
  "data": {
    "order_id": 61,
    "merchant_trade_no": "TPA881036289OR061",
    "amount": 299,
    "expire_date": "2025-08-26T07:21:43.628Z",
    "ecpay_form": {
      "action": "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5",
      "method": "POST", 
      "params": {
        "MerchantID": "3466445",
        "MerchantTradeNo": "TPA881036289OR061",
        "CheckMacValue": "E39823A21C4A78B522F5F37CF93C8963C563A236DE6DE814547EA07E4BE62D8D"
      }
    }
  }
}
```

**重要**: 條碼需要用戶訪問ECPay頁面後才會生成，我們無法直接提供條碼資料。

### 查詢訂單狀態

**端點**: `GET /api/third-party/orders/{order_id}/barcode`

**回應**:
```json
{
  "success": true,
  "data": {
    "order_id": 60,
    "client_order_id": "ORDER-001", 
    "amount": 199,
    "order_status": "pending",
    "barcode_page_url": "https://corba3c-production.up.railway.app/api/third-party/orders/60/barcode/page",
    "expire_date": "2025-08-26T07:14:09.699Z"
  }
}
```

## 💳 整合方式

使用ECPay表單將用戶導向金流頁面：

```html
<form method="POST" action="{{ecpay_form.action}}">
  <input type="hidden" name="MerchantID" value="{{params.MerchantID}}">
  <input type="hidden" name="MerchantTradeNo" value="{{params.MerchantTradeNo}}">
  <input type="hidden" name="CheckMacValue" value="{{params.CheckMacValue}}">
  <!-- 其他所有params參數... -->
  <button type="submit">前往付款</button>
</form>
```

用戶點擊後會跳轉到ECPay，ECPay會生成條碼供用戶至便利商店付款。

## 🔔 付款通知

用戶完成付款後會收到通知，可使用查詢API確認付款狀態。

## 🧪 測試

測試頁面：https://corba3c-production.up.railway.app/test-barcode