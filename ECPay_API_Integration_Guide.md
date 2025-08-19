# ECPay 四方金流 API 整合指南

## 概述

本API提供廠商一個簡單的方式整合ECPay條碼付款功能。廠商只需提供基本的訂單資訊，系統會自動處理與ECPay的複雜整合，並返回可直接跳轉到ECPay收銀台的表單資料。

---

## API 基本資訊

### 🌐 API 端點
```
POST https://corba3c-production.up.railway.app/api/third-party/barcode/create
```

### 🔐 認證方式
在HTTP Header中包含您的API Key：
```http
X-API-KEY: your-api-key-here
```

### 📄 Content-Type
```http
Content-Type: application/json
```

---

## 請求參數

| 參數名稱 | 類型 | 必填 | 描述 |
|---------|------|------|------|
| `amount` | number | ✅ | 付款金額，範圍：1-6000 (新台幣) |
| `client_order_id` | string | ✅ | 您的訂單編號，必須唯一 |
| `callback_url` | string | ❌ | 付款完成通知URL (選填) |

### 範例請求
```json
{
  "amount": 299,
  "client_order_id": "ORDER_20250818_001",
  "callback_url": "https://your-domain.com/payment/callback"
}
```

---

## API 回應

### 成功回應 (HTTP 200)
```json
{
  "success": true,
  "data": {
    "order_id": 27,
    "client_order_id": "ORDER_20250818_001",
    "merchant_trade_no": "TPA16030407FQ7033",
    "trade_no": null,
    "store_type": "7ELEVEN",
    "amount": 299,
    "expire_date": "2025-08-25T10:52:01.045Z",
    "customer_info_url": "https://corba3c-production.up.railway.app/customer-info/27",
    "barcode_status": "generated",
    "payment_method": "ecpay_redirect",
    "ecpay_form": {
      "action": "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5",
      "method": "POST",
      "params": {
        "MerchantID": "3466445",
        "MerchantTradeNo": "TPA16030407FQ7033",
        "MerchantTradeDate": "2025/08/18 10:52:01",
        "PaymentType": "aio",
        "TotalAmount": 299,
        "TradeDesc": "7ELEVEN便利店條碼付款",
        "ItemName": "3C商品一組 - NT$299",
        "ReturnURL": "https://corba3c-production.up.railway.app/api/third-party/ecpay/callback",
        "ChoosePayment": "BARCODE",
        "EncryptType": 1,
        "StoreExpireDate": 7,
        "PaymentInfoURL": "https://corba3c-production.up.railway.app/api/third-party/ecpay/payment-info",
        "Desc_1": "7-ELEVEN",
        "CheckMacValue": "C3EBCABA9132354A58932083A93CD09C4DBC04961EF897A18D7A7A8193A95ED3"
      }
    },
    "message": "訂單建立成功，請使用ecpay_form建立POST表單跳轉到ECPay頁面進行條碼付款",
    "integration_instructions": [
      "使用ecpay_form.action作為表單的action URL",
      "使用ecpay_form.method (POST)作為表單方法",
      "將ecpay_form.params中的所有參數作為隱藏欄位添加到表單",
      "提交表單將跳轉到ECPay條碼頁面",
      "用戶完成付款後，系統會收到付款通知"
    ]
  }
}
```

### 錯誤回應
```json
{
  "success": false,
  "error": {
    "code": "INVALID_AMOUNT", 
    "message": "付款金額最小為 NT$ 1,000"
  }
}
```

---

## 整合步驟

### 1. 呼叫API建立訂單
```javascript
const response = await fetch('https://corba3c-production.up.railway.app/api/third-party/barcode/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': 'your-api-key-here'
  },
  body: JSON.stringify({
    amount: 299,
    client_order_id: 'ORDER_20250818_001',
    callback_url: 'https://your-domain.com/payment/callback'
  })
});

const result = await response.json();
```

### 2. 取得ECPay表單資料
```javascript
if (result.success) {
  const ecpayForm = result.data.ecpay_form;
  // 使用 ecpayForm 建立跳轉表單
}
```

### 3. 建立HTML表單並自動跳轉
```javascript
function redirectToECPay(ecpayForm) {
  // 建立表單元素
  const form = document.createElement('form');
  form.method = ecpayForm.method;
  form.action = ecpayForm.action;
  form.style.display = 'none';
  
  // 添加所有參數作為隱藏欄位
  Object.entries(ecpayForm.params).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  
  // 提交表單跳轉到ECPay
  document.body.appendChild(form);
  form.submit();
}
```

### 4. 完整HTML表單範例
```html
<form method="POST" action="https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5">
  <input type="hidden" name="MerchantID" value="3466445">
  <input type="hidden" name="MerchantTradeNo" value="TPA16030407FQ7033">
  <input type="hidden" name="MerchantTradeDate" value="2025/08/18 10:52:01">
  <input type="hidden" name="PaymentType" value="aio">
  <input type="hidden" name="TotalAmount" value="299">
  <input type="hidden" name="TradeDesc" value="7ELEVEN便利店條碼付款">
  <input type="hidden" name="ItemName" value="3C商品一組 - NT$299">
  <input type="hidden" name="ReturnURL" value="https://corba3c-production.up.railway.app/api/third-party/ecpay/callback">
  <input type="hidden" name="ChoosePayment" value="BARCODE">
  <input type="hidden" name="EncryptType" value="1">
  <input type="hidden" name="StoreExpireDate" value="7">
  <input type="hidden" name="PaymentInfoURL" value="https://corba3c-production.up.railway.app/api/third-party/ecpay/payment-info">
  <input type="hidden" name="Desc_1" value="7-ELEVEN">
  <input type="hidden" name="CheckMacValue" value="C3EBCABA9132354A58932083A93CD09C4DBC04961EF897A18D7A7A8193A95ED3">
  <button type="submit">前往ECPay收銀台</button>
</form>
```

---

## 程式語言範例

### JavaScript / Node.js
```javascript
async function createECPayOrder(amount, orderId) {
  try {
    const response = await fetch('https://corba3c-production.up.railway.app/api/third-party/barcode/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'your-api-key-here'
      },
      body: JSON.stringify({
        amount: amount,
        client_order_id: orderId,
        callback_url: 'https://your-domain.com/payment/callback'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // 跳轉到ECPay
      redirectToECPay(data.data.ecpay_form);
    } else {
      console.error('建立訂單失敗:', data.message);
    }
  } catch (error) {
    console.error('API呼叫失敗:', error);
  }
}
```

### PHP
```php
<?php
function createECPayOrder($amount, $orderId) {
  $url = 'https://corba3c-production.up.railway.app/api/third-party/barcode/create';
  
  $data = array(
    'amount' => $amount,
    'client_order_id' => $orderId,
    'callback_url' => 'https://your-domain.com/payment/callback.php'
  );
  
  $options = array(
    'http' => array(
      'method' => 'POST',
      'header' => 
        "Content-Type: application/json\r\n" .
        "X-API-KEY: your-api-key-here\r\n",
      'content' => json_encode($data)
    )
  );
  
  $context = stream_context_create($options);
  $response = file_get_contents($url, false, $context);
  $result = json_decode($response, true);
  
  if ($result['success']) {
    return generateECPayForm($result['data']['ecpay_form']);
  } else {
    throw new Exception('建立訂單失敗: ' . $result['message']);
  }
}

function generateECPayForm($ecpayForm) {
  $html = '<form id="ecpayForm" method="' . $ecpayForm['method'] . '" action="' . $ecpayForm['action'] . '">';
  
  foreach ($ecpayForm['params'] as $key => $value) {
    $html .= '<input type="hidden" name="' . $key . '" value="' . $value . '">';
  }
  
  $html .= '<button type="submit">前往ECPay付款</button>';
  $html .= '</form>';
  $html .= '<script>document.getElementById("ecpayForm").submit();</script>';
  
  return $html;
}
?>
```

### Python
```python
import requests
import json

def create_ecpay_order(amount, order_id):
    url = 'https://corba3c-production.up.railway.app/api/third-party/barcode/create'
    
    headers = {
        'Content-Type': 'application/json',
        'X-API-KEY': 'your-api-key-here'
    }
    
    data = {
        'amount': amount,
        'client_order_id': order_id,
        'callback_url': 'https://your-domain.com/payment/callback'
    }
    
    response = requests.post(url, headers=headers, json=data)
    result = response.json()
    
    if result['success']:
        return result['data']['ecpay_form']
    else:
        raise Exception(f"建立訂單失敗: {result['message']}")

# Flask 範例 - 生成跳轉頁面
from flask import render_template_string

def generate_ecpay_form(ecpay_form):
    template = '''
    <html>
    <body>
        <form id="ecpayForm" method="{{ method }}" action="{{ action }}">
            {% for key, value in params.items() %}
            <input type="hidden" name="{{ key }}" value="{{ value }}">
            {% endfor %}
            <button type="submit">前往ECPay付款</button>
        </form>
        <script>
            document.getElementById("ecpayForm").submit();
        </script>
    </body>
    </html>
    '''
    
    return render_template_string(template, 
                                method=ecpay_form['method'],
                                action=ecpay_form['action'],
                                params=ecpay_form['params'])
```

---

## 付款流程

1. **用戶選擇商品** → 點擊結帳
2. **廠商呼叫API** → 建立ECPay訂單
3. **自動跳轉** → ECPay收銀台頁面
4. **用戶掃條碼** → 在7-ELEVEN等便利店付款
5. **付款完成** → ECPay通知系統更新訂單狀態
6. **廠商收到通知** → (如果設定了callback_url)

---

## 錯誤代碼

| 錯誤代碼 | 描述 | 解決方案 |
|---------|------|----------|
| `MISSING_PARAMETERS` | 缺少必要參數 | 檢查amount, client_order_id是否都有提供 |
| `INVALID_AMOUNT` | 金額無效 | 確保金額在1-6000範圍內 |
| `AMOUNT_TOO_LARGE` | 金額過大 | 金額不可超過NT$6,000 |
| `DUPLICATE_REF` | 訂單編號重複 | 使用唯一的client_order_id |
| `無效的 API Key` | API Key錯誤 | 檢查API Key是否正確 |

---

## 重要注意事項

### ⚠️ 安全性
- **保護API Key**：請勿在前端程式碼中暴露API Key
- **使用HTTPS**：callback_url建議使用HTTPS協議
- **驗證回調**：如果實作callback_url，請驗證來源

### 📋 最佳實作
- **唯一訂單號**：每個client_order_id必須唯一，建議使用時間戳+隨機字符
- **錯誤處理**：實作完整的錯誤處理機制
- **用戶體驗**：在跳轉前顯示載入提示
- **測試環境**：先在測試環境充分測試再上線

### 💰 金額限制
- 最小金額：NT$ 1
- 最大金額：NT$ 6,000
- 僅支援整數金額

### ⏰ 條碼效期
- 條碼有效期：7天
- 過期後需重新建立訂單

---

## 測試

### 🧪 測試頁面
我們提供了測試頁面供您驗證整合：
```
https://corba3c-production.up.railway.app/test-ecpay
```

### ✅ 測試建議
1. 使用較小金額進行測試 (如NT$199)
2. 確認能成功跳轉到ECPay收銀台
3. 在ECPay頁面檢查條碼是否正確顯示
4. **請勿進行實際付款測試**

---


