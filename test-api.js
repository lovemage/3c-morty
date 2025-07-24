import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

// Test API endpoints
const testAPI = async () => {
  console.log('🧪 開始測試 Corba 3C Shop API...\n');

  try {
    // Test health check
    console.log('1️⃣ 測試健康檢查...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ 健康檢查:', healthData.message);
    console.log('');

    // Test get products
    console.log('2️⃣ 測試獲取產品列表...');
    const productsResponse = await fetch(`${API_BASE}/products`);
    const productsData = await productsResponse.json();
    console.log(`✅ 產品數量: ${productsData.products?.length || 0}`);
    if (productsData.products && productsData.products.length > 0) {
      console.log(`   第一個產品: ${productsData.products[0].name}`);
    }
    console.log('');

    // Test register user
    console.log('3️⃣ 測試用戶註冊...');
    const registerData = {
      email: 'test@corba3c.com',
      password: 'test123',
      name: 'Test User'
    };
    
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerData)
    });
    
    const registerResult = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log('✅ 用戶註冊成功:', registerResult.user.name);
      console.log('   Token received:', registerResult.token ? '是' : '否');
      
      // Test authenticated endpoint
      console.log('');
      console.log('4️⃣ 測試認證端點...');
      const verifyResponse = await fetch(`${API_BASE}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${registerResult.token}`
        }
      });
      
      const verifyResult = await verifyResponse.json();
      if (verifyResponse.ok) {
        console.log('✅ Token驗證成功:', verifyResult.user.name);
      } else {
        console.log('❌ Token驗證失敗:', verifyResult.message);
      }
    } else {
      console.log('⚠️ 用戶註冊:', registerResult.message);
    }

    console.log('');
    console.log('5️⃣ 測試獲取產品分類...');
    const categoriesResponse = await fetch(`${API_BASE}/products/categories/list`);
    const categoriesData = await categoriesResponse.json();
    console.log(`✅ 分類數量: ${categoriesData.categories?.length || 0}`);
    if (categoriesData.categories && categoriesData.categories.length > 0) {
      categoriesData.categories.forEach(cat => {
        console.log(`   ${cat.name}: ${cat.count} 個產品`);
      });
    }

  } catch (error) {
    console.error('❌ API測試錯誤:', error.message);
  }
  
  console.log('\n🎉 API測試完成！');
};

// Run the test
testAPI(); 