// 調試條碼處理邏輯

function generateBarcodeInfo(barcode1, barcode2, barcode3, paymentNo, expireDate) {
  console.log('🔧 generateBarcodeInfo input:', { barcode1, barcode2, barcode3, paymentNo, expireDate });
  
  const segments = [barcode1, barcode2, barcode3].filter(Boolean);
  
  if (segments.length === 0) {
    console.log('❌ 沒有有效的條碼段');
    return null;
  }
  
  const fullBarcode = segments.join('-');
  const barcodeUrl = generateBarcodeUrl(fullBarcode);
  
  console.log('✅ 生成的條碼資訊:', {
    fullBarcode,
    segments: segments.length,
    barcodeUrl
  });
  
  return {
    barcode_1: barcode1 || '',
    barcode_2: barcode2 || '',
    barcode_3: barcode3 || '',
    full_barcode: fullBarcode,
    segments_count: segments.length,
    payment_no: paymentNo || '',
    expire_date: expireDate || null,
    barcode_url: barcodeUrl,
    
    // 提供多種條碼顯示格式
    display_formats: {
      // 標準格式：三段條碼用破折號分隔
      standard: fullBarcode,
      
      // 緊湊格式：無分隔符
      compact: segments.join(''),
      
      // 陣列格式：分段顯示
      array: segments,
      
      // 顯示用格式：美化顯示
      display: segments.map((seg, index) => `第${index + 1}段: ${seg}`).join(' | ')
    },
    
    // 使用說明
    usage_info: {
      description: '請至便利商店出示以下條碼進行付款',
      barcode_type: 'Code39',
      segments_description: segments.length === 3 ? '三段式條碼' : `${segments.length}段條碼`,
      instructions: [
        '方法1: 出示條碼圖片讓店員掃描',
        '方法2: 告知店員三段條碼號碼',
        '方法3: 使用超商機台輸入條碼號碼'
      ]
    },
    
    // 技術資訊
    technical_info: {
      encoding: 'Code39',
      total_length: fullBarcode.length,
      segments: segments.map((seg, index) => ({
        segment: index + 1,
        value: seg,
        length: seg.length
      }))
    }
  };
}

function generateBarcodeUrl(barcodeData) {
  console.log('🔗 generateBarcodeUrl input:', barcodeData);
  
  if (!barcodeData || barcodeData === '--' || barcodeData === '---') {
    console.log('❌ 無效的條碼數據');
    return null;
  }
  
  // 清理條碼數據
  const cleanBarcode = barcodeData.replace(/-+$/, '').replace(/^-+/, '');
  
  if (!cleanBarcode) {
    console.log('❌ 清理後的條碼為空');
    return null;
  }
  
  // 使用綠界QRCode服務生成條碼圖片URL
  const url = `https://payment.ecpay.com.tw/SP/CreateQRCode?qdata=${encodeURIComponent(cleanBarcode)}`;
  console.log('✅ 生成的條碼URL:', url);
  return url;
}

// 測試真實格式
console.log('🧪 測試真實ECPay條碼格式處理');

const testBarcodeInfo = {
  Barcode1: '1407086CY',
  Barcode2: '1557341899384519',
  Barcode3: '0708B4000000100',
  ExpireDate: '2025/08/25 23:59:59'
};

console.log('\n📋 輸入的條碼資訊:', testBarcodeInfo);

const result = generateBarcodeInfo(
  testBarcodeInfo.Barcode1,
  testBarcodeInfo.Barcode2,
  testBarcodeInfo.Barcode3,
  null,
  testBarcodeInfo.ExpireDate
);

console.log('\n📤 最終結果:');
console.log(JSON.stringify(result, null, 2));