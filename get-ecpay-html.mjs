import pkg from 'pg';
const { Client } = pkg;

async function getECPayHTML() {
  const publicUrl = 'postgresql://postgres:BvAdHDswtNGeKgNnUuPLztfRSWIXAclO@yamanote.proxy.rlwy.net:17443/railway';
  
  const client = new Client({
    connectionString: publicUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    
    // 查詢訂單22的完整ECPay回應
    const result = await client.query(`
      SELECT et.raw_response
      FROM ecpay_transactions et
      JOIN third_party_orders tpo ON et.third_party_order_id = tpo.id
      WHERE et.merchant_trade_no = 'TPA1755504222589022'
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      const rawResponse = JSON.parse(result.rows[0].raw_response);
      console.log('🌐 綠界返回的完整HTML頁面:');
      console.log('=====================================');
      
      if (rawResponse.ecpayResponse) {
        // 將HTML保存到文件
        const fs = await import('fs');
        const htmlContent = rawResponse.ecpayResponse;
        
        await fs.writeFileSync('/Users/yifubai/Downloads/corba3c-四方/ecpay-order22-page.html', htmlContent);
        
        console.log('✅ HTML頁面已保存到: ecpay-order22-page.html');
        console.log('📝 HTML內容長度:', htmlContent.length, '字元');
        
        // 檢查是否包含條碼相關內容
        if (htmlContent.includes('barcode') || htmlContent.includes('條碼') || htmlContent.includes('BARCODE')) {
          console.log('🔍 頁面包含條碼相關內容');
        }
        
        if (htmlContent.includes('繳費期限') || htmlContent.includes('到期') || htmlContent.includes('expire')) {
          console.log('⏰ 頁面包含期限資訊');
        }
        
        // 顯示前200字元預覽
        console.log('\n📄 HTML預覽 (前200字元):');
        console.log(htmlContent.substring(0, 200));
        console.log('...(完整內容請查看 ecpay-order22-page.html)');
        
      } else {
        console.log('❌ 沒有找到HTML回應內容');
      }
    } else {
      console.log('❌ 找不到訂單22的記錄');
    }
    
  } catch (error) {
    console.error('❌ 查詢失敗:', error.message);
  } finally {
    await client.end();
  }
}

getECPayHTML();