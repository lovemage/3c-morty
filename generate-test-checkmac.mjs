import crypto from 'crypto';

// 綠界測試環境設定
const ECPAY_CONFIG = {
  merchantID: '2000132',
  hashKey: '5294y06JbISpM5x9',
  hashIV: 'v77hoKGq4kWxNNIS'
};

// 訂單22的參數（使用測試環境）
const params = {
  MerchantID: '2000132',
  MerchantTradeNo: 'TPA1755504222589022',
  MerchantTradeDate: '2025/08/18 08:03:42',
  PaymentType: 'aio',
  TotalAmount: 30,
  TradeDesc: '7ELEVEN便利店條碼付款',
  ItemName: '3C商品一組 - NT$30',
  ReturnURL: 'https://corba3c-production.up.railway.app/api/third-party/ecpay/callback',
  ChoosePayment: 'BARCODE',
  EncryptType: 1,
  StoreExpireDate: 7,
  PaymentInfoURL: 'https://corba3c-production.up.railway.app/api/third-party/ecpay/payment-info',
  Desc_1: '7-ELEVEN'
};

function generateCheckMacValue(params, hashKey, hashIV) {
  // 移除 CheckMacValue 參數
  const filteredParams = { ...params };
  delete filteredParams.CheckMacValue;

  // 依照字母順序排序參數
  const sortedKeys = Object.keys(filteredParams).sort((a, b) => 
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  // 建立查詢字串
  const queryString = sortedKeys
    .map(key => `${key}=${filteredParams[key]}`)
    .join('&');

  // 前後加上 HashKey 和 HashIV
  const stringToHash = `HashKey=${hashKey}&${queryString}&HashIV=${hashIV}`;

  // URL encode (根據綠界規範)
  const encodedString = encodeURIComponent(stringToHash)
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, function(c) {
      return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    })
    .toLowerCase(); // 綠界要求小寫

  // SHA256 雜湊並轉大寫
  return crypto.createHash('sha256').update(encodedString).digest('hex').toUpperCase();
}

const checkMacValue = generateCheckMacValue(params, ECPAY_CONFIG.hashKey, ECPAY_CONFIG.hashIV);

console.log('🔧 綠界測試環境正確參數:');
console.log('=====================================');
console.log('MerchantID:', params.MerchantID);
console.log('MerchantTradeNo:', params.MerchantTradeNo);
console.log('TotalAmount:', params.TotalAmount);
console.log('ChoosePayment:', params.ChoosePayment);
console.log('CheckMacValue:', checkMacValue);
console.log('=====================================');
console.log('\n✅ 這個CheckMacValue是使用測試環境參數計算的，應該可以正常工作！');