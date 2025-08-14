// LocalStorage data management for Rick & Morty E-commerce

export interface Product {
  id: string;
  name: string;
  category: 'mouse' | 'keyboard' | 'cable' | 'powerbank' | 'laptop' | 'juicer';
  price: number;
  originalPrice: number;
  description: string;
  specifications: string[];
  specifications2: string[];
  stock: number;
  image: string;
  notes?: string;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastLoginAt?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

class LocalStorageManager {
  private readonly KEYS = {
    PRODUCTS: 'rm_ecommerce_products',
    USERS: 'rm_ecommerce_users',
    ORDERS: 'rm_ecommerce_orders',
    CART: 'rm_ecommerce_cart',
    CURRENT_USER: 'rm_ecommerce_current_user'
  };

  // Products
  getProducts(): Product[] {
    const data = localStorage.getItem(this.KEYS.PRODUCTS);
    const products = data ? JSON.parse(data) : [];
    
    // 如果產品數量不是25個，或者缺少新的欄位，重新載入默認產品
    if (products.length !== 25 || 
        !products[0]?.originalPrice || 
        !products[0]?.specifications2 || 
        !products[0]?.createdAt) {
      console.log('載入新的產品數據...');
      return this.getDefaultProducts();
    }
    
    return products;
  }

  saveProducts(products: Product[]): void {
    localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(products));
  }

  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    products[index] = { ...products[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveProducts(products);
    return products[index];
  }

  deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const filteredProducts = products.filter(p => p.id !== id);
    if (filteredProducts.length < products.length) {
      this.saveProducts(filteredProducts);
      return true;
    }
    return false;
  }

  getProductsByCategory(category: Product['category']): Product[] {
    return this.getProducts().filter(p => p.category === category);
  }

  searchProducts(query: string): Product[] {
    const products = this.getProducts();
    const lowercaseQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowercaseQuery) ||
      p.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Users
  getUsers(): User[] {
    const data = localStorage.getItem(this.KEYS.USERS);
    return data ? JSON.parse(data) : this.getDefaultUsers();
  }

  saveUsers(users: User[]): void {
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
  }

  registerUser(userData: Omit<User, 'id' | 'createdAt' | 'role'>): User {
    const users = this.getUsers();
    const existingUser = users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('用戶已存在');
    }

    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  loginUser(email: string, password: string): User {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error('郵箱或密碼錯誤');
    }
    
    // 更新最後登入時間
    this.updateUserLastLogin(user.id);
    
    // 獲取更新後的用戶資料
    const updatedUser = this.getUsers().find(u => u.id === user.id) || user;
    this.setCurrentUser(updatedUser);
    return updatedUser;
  }

  getCurrentUser(): User | null {
    const data = localStorage.getItem(this.KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  setCurrentUser(user: User): void {
    localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(user));
  }

  logout(): void {
    localStorage.removeItem(this.KEYS.CURRENT_USER);
    localStorage.removeItem(this.KEYS.CART);
  }

  deleteUser(userId: string): void {
    const users = this.getUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    this.saveUsers(filteredUsers);
  }

  updateUserRole(userId: string, newRole: 'user' | 'admin'): void {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].role = newRole;
      this.saveUsers(users);
    }
  }

  updateUserLastLogin(userId: string): void {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].lastLoginAt = new Date().toISOString();
      this.saveUsers(users);
    }
  }

  // Cart
  getCart(): CartItem[] {
    const data = localStorage.getItem(this.KEYS.CART);
    return data ? JSON.parse(data) : [];
  }

  saveCart(cart: CartItem[]): void {
    localStorage.setItem(this.KEYS.CART, JSON.stringify(cart));
  }

  addToCart(productId: string, quantity: number = 1): void {
    const cart = this.getCart();
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) throw new Error('產品不存在');
    if (product.stock < quantity) throw new Error('庫存不足');

    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
      if (existingItem.quantity + quantity > product.stock) {
        throw new Error('庫存不足');
      }
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId,
        quantity,
        product
      });
    }
    
    this.saveCart(cart);
  }

  updateCartItem(productId: string, quantity: number): void {
    const cart = this.getCart();
    const item = cart.find(item => item.productId === productId);
    
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.saveCart(cart);
      }
    }
  }

  removeFromCart(productId: string): void {
    const cart = this.getCart();
    const filteredCart = cart.filter(item => item.productId !== productId);
    this.saveCart(filteredCart);
  }

  clearCart(): void {
    this.saveCart([]);
  }

  // Orders
  getOrders(): Order[] {
    const data = localStorage.getItem(this.KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  }

  saveOrders(orders: Order[]): void {
    localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));
  }

  createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
    const orders = this.getOrders();
    const newOrder: Order = {
      ...orderData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Update product stock
    const products = this.getProducts();
    orderData.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        product.stock -= item.quantity;
      }
    });
    this.saveProducts(products);
    
    orders.push(newOrder);
    this.saveOrders(orders);
    
    // Clear cart after order
    this.clearCart();
    
    return newOrder;
  }

  getUserOrders(userId: string): Order[] {
    return this.getOrders().filter(order => order.userId === userId);
  }

  updateOrderStatus(orderId: string, status: Order['status']): Order | null {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      this.saveOrders(orders);
      return order;
    }
    
    return null;
  }

  // Initialize default data
  private getDefaultProducts(): Product[] {
    const defaultProducts: Product[] = [
      // 滑鼠類產品 (8個產品)
      {
        id: '1',
        name: 'Portal無線電競滑鼠',
        category: 'mouse',
        price: 2990,
        originalPrice: 3990,
        description: '來自次元C-137的頂級電競滑鼠，具備Rick實驗室開發的量子精準技術',
        specifications: ['DPI: 16000', 'RGB背光', '無線連接', '電池續航: 70小時', '人體工學設計'],
        specifications2: ['無線2.4GHz技術', '可自訂DPI設定', '支援宏編程'],
        stock: 25,
        image: '/images/products/wireless-gaming-mouse.jpg',
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Morty有線光學滑鼠',
        category: 'mouse',
        price: 990,
        originalPrice: 1290,
        description: '簡單易用的有線滑鼠，Morty也能輕鬆操作',
        specifications: ['DPI: 3200', '有線連接', '即插即用', '人體工學', '耐用設計'],
        specifications2: ['1.8米線長', '光學感應器', '簡單設定'],
        stock: 50,
        image: '/images/products/wired-mouse.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Rick次元高精度滑鼠',
        category: 'mouse',
        price: 1590,
        originalPrice: 2190,
        description: '採用次元科技的高精度滑鼠，適合專業工作',
        specifications: ['DPI: 8000', '精確感應', '人體工學', '耐用材質', '靜音設計'],
        specifications2: ['次元穩定技術', '量子感應器', '適合專業工作'],
        stock: 35,
        image: '/images/products/6206427_R.webp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Portal Gaming Pro滑鼠',
        category: 'mouse',
        price: 3490,
        originalPrice: 4490,
        description: 'Rick實驗室最新研發的電競滑鼠，專為職業玩家設計',
        specifications: ['DPI: 25600', 'RGB炫光', '無線充電', '超快響應', '防滑設計'],
        specifications2: ['1ms回應時間', '職業級精度', '可程式設計按鍵'],
        stock: 20,
        image: '/images/products/13248873_R.webp',
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // 鍵盤類產品 (4個產品)
      {
        id: '5',
        name: 'Rick科學機械鍵盤',
        category: 'keyboard',
        price: 4990,
        originalPrice: 5990,
        description: '使用Rick的實驗室材料製作，每個按鍵都帶有次元穩定技術',
        specifications: ['機械軸體', 'RGB全彩背光', '防水設計', '巨集功能', 'USB Type-C連接'],
        specifications2: ['多軸體選項', '可調背光亮度', '程式巨集支援'],
        stock: 15,
        image: '/images/products/mechanical-keyboard.jpeg',
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '6',
        name: 'Portal無線鍵盤',
        category: 'keyboard',
        price: 2490,
        originalPrice: 2990,
        description: '輕薄設計的無線鍵盤，適合行動辦公',
        specifications: ['無線藍牙', '超薄設計', '續航180小時', '快速充電', '靜音按鍵'],
        specifications2: ['藍牙5.0', '多設備連接', '節能模式'],
        stock: 30,
        image: '/images/products/wireless-keyboard.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '7',
        name: 'Morty辦公鍵盤',
        category: 'keyboard',
        price: 1290,
        originalPrice: 1590,
        description: 'Morty專用的辦公鍵盤，簡單實用',
        specifications: ['薄膜按鍵', '有線連接', '標準配列', '舒適手感', '靜音設計'],
        specifications2: ['104鍵標準', '防潑水', '即插即用'],
        stock: 40,
        image: '/images/products/12236748_R.webp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '8',
        name: 'Rick實驗室專業鍵盤',
        category: 'keyboard',
        price: 3890,
        originalPrice: 4890,
        description: 'Rick實驗室研發的專業鍵盤，具備多種科學功能',
        specifications: ['客製化軸體', '可程式設計', '防腐蝕材質', '快捷鍵支援', '背光調節'],
        specifications2: ['實驗室級耐用', '化學防護', '科學計算快捷鍵'],
        stock: 18,
        image: '/images/products/14169511_R.webp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // 傳輸線類產品 (10個產品)
      {
        id: '9',
        name: 'Morty充電線',
        category: 'cable',
        price: 590,
        originalPrice: 790,
        description: 'USB-C快充線，經過Rick改良，充電速度提升200%',
        specifications: ['USB-C接口', '快充支援', '長度1.2米', '耐彎折設計', '數據傳輸'],
        specifications2: ['480Mbps傳輸', '編織防纏', '快充認證'],
        stock: 100,
        image: '/images/products/usb-c-cable_1.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '10',
        name: 'Portal USB-C傳輸線',
        category: 'cable',
        price: 690,
        originalPrice: 890,
        description: '次元傳輸技術的USB-C線材，資料傳輸更穩定',
        specifications: ['USB-C接口', '高速傳輸', '長度1.5米', '編織線材', '金屬接頭'],
        specifications2: ['10Gbps傳輸', '次元穩定', '抗電磁干擾'],
        stock: 80,
        image: '/images/products/usb-c-cable_2.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '11',
        name: 'Rick量子傳輸線',
        category: 'cable',
        price: 890,
        originalPrice: 1290,
        description: '採用量子技術的高階傳輸線，支援超高速資料傳輸',
        specifications: ['USB-C 3.2', '量子加速', '長度2米', '防干擾設計', '快充100W'],
        specifications2: ['20Gbps傳輸', '量子加密', '耐高溫設計'],
        stock: 60,
        image: '/images/products/usb-c-cable_3.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '12',
        name: 'Lightning次元線',
        category: 'cable',
        price: 790,
        originalPrice: 990,
        description: 'iPhone專用Lightning線，具備次元穩定技術',
        specifications: ['Lightning接口', 'MFi認證', '長度1米', '高速充電', '數據同步'],
        specifications2: ['iOS原廠晶片', 'MFi認證', '次元同步技術'],
        stock: 80,
        image: '/images/products/lightning-cable.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '13',
        name: 'Portal HDMI線',
        category: 'cable',
        price: 1290,
        originalPrice: 1590,
        description: '4K超高清HDMI線，可傳輸多維度影像信號',
        specifications: ['4K@60Hz', '高速傳輸', '長度2米', '抗干擾', '金屬接頭'],
        specifications2: ['HDMI 2.1標準', '48Gbps頻寬', '多維度信號'],
        stock: 60,
        image: '/images/products/hdmi-cable.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '14',
        name: 'Rick實驗室USB-C線',
        category: 'cable',
        price: 1190,
        originalPrice: 1490,
        description: 'Rick親自設計的USB-C線材，具備實驗室級別的品質',
        specifications: ['USB-C 3.1', '實驗室測試', '長度1.8米', '超耐用設計', '快充支援'],
        specifications2: ['軍規級耐用', '實驗室認證', '專業品質'],
        stock: 45,
        image: '/images/products/usb-c-cable_4.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '15',
        name: 'Morty日常充電線',
        category: 'cable',
        price: 590,
        originalPrice: 790,
        description: 'Morty日常使用的充電線，簡單實用',
        specifications: ['USB-C接口', '基本充電', '長度1米', '輕便攜帶', '耐用設計'],
        specifications2: ['基本功能', '簡單實用', '日常使用'],
        stock: 90,
        image: '/images/products/usb-c-cable_6.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '16',
        name: 'Portal科技線材',
        category: 'cable',
        price: 1590,
        originalPrice: 1990,
        description: '融合Portal科技的高端線材，傳輸效能卓越',
        specifications: ['Thunderbolt 4', '高速傳輸', '長度2.5米', '專業級品質', '多功能支援'],
        specifications2: ['40Gbps傳輸', 'Portal技術', '專業認證'],
        stock: 25,
        image: '/images/products/7667886_R.webp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '17',
        name: 'Rick基礎傳輸線',
        category: 'cable',
        price: 490,
        originalPrice: 690,
        description: 'Rick設計的基礎型傳輸線，滿足日常需求',
        specifications: ['USB-C接口', '標準傳輸', '長度1米', '基本充電', '耐用設計'],
        specifications2: ['標準規格', '基本功能', '經濟實用'],
        stock: 120,
        image: '/images/products/usb-c-cable_0.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // 行動電源類產品 (4個產品)
      {
        id: '18',
        name: 'Rick量子行動電源 20000mAh',
        category: 'powerbank',
        price: 1990,
        originalPrice: 2490,
        description: '使用量子能量技術，充電速度和容量都超越常規產品',
        specifications: ['容量: 20000mAh', '快充PD 65W', '無線充電', '三個輸出口', 'LED電量顯示'],
        specifications2: ['雙向快充', '智能保護', '溫控技術'],
        stock: 40,
        image: '/images/products/power-bank-20000.jpeg',
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '19',
        name: 'Portal能量核心',
        category: 'powerbank',
        price: 2990,
        originalPrice: 3490,
        description: 'Portal技術驅動的能量核心，可為多個設備同時充電',
        specifications: ['容量: 30000mAh', '無線充電', 'PD 100W', '四個輸出', '快速充電技術'],
        specifications2: ['Portal技術', '多設備支援', '高效充電'],
        stock: 20,
        image: '/images/products/11455868_R.webp',
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '20',
        name: 'Morty輕量行動電源',
        category: 'powerbank',
        price: 1290,
        originalPrice: 1590,
        description: '輕便小巧的行動電源，適合日常使用',
        specifications: ['容量: 10000mAh', '輕薄設計', '雙輸出', 'LED電量指示', '安全保護'],
        specifications2: ['輕量設計', '便攜實用', '安全可靠'],
        stock: 70,
        image: '/images/products/10254365_R.webp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '21',
        name: 'Rick實驗室電源',
        category: 'powerbank',
        price: 3990,
        originalPrice: 4990,
        description: 'Rick實驗室特製的高性能行動電源，支援實驗設備供電',
        specifications: ['容量: 50000mAh', '實驗室級', 'AC輸出', '多接口設計', '智能保護'],
        specifications2: ['實驗室級品質', 'AC輸出支援', '專業設備'],
        stock: 8,
        image: '/images/products/9779579_R.webp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // 筆記型電腦類產品 (4個產品)
      {
        id: '22',
        name: 'Portal Gaming筆記型電腦',
        category: 'laptop',
        price: 4990,
        originalPrice: 5990,
        description: 'Rick設計的頂級電競筆電，配備次元處理器和量子顯卡',
        specifications: ['處理器: Intel i9', '顯卡: RTX 4080', '記憶體: 32GB', '儲存: 1TB SSD', '螢幕: 17.3" 144Hz'],
        specifications2: ['次元處理技術', '量子顯卡', '電競級配置'],
        stock: 5,
        image: '/images/products/gaming-laptop.jpg',
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '23',
        name: 'Dimension商務筆電',
        category: 'laptop',
        price: 4590,
        originalPrice: 5590,
        description: '輕薄商務筆電，適合辦公和學習',
        specifications: ['處理器: Intel i7', '記憶體: 16GB', '儲存: 512GB SSD', '螢幕: 14" IPS', '重量: 1.2kg'],
        specifications2: ['商務設計', '輕薄便攜', '高效辦公'],
        stock: 12,
        image: '/images/products/ultrabook.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '24',
        name: 'Rick科學計算筆電',
        category: 'laptop',
        price: 4290,
        originalPrice: 5290,
        description: 'Rick實驗室專用的科學計算筆電，效能強大',
        specifications: ['處理器: AMD Ryzen 9', '記憶體: 32GB', '獨立顯卡', '儲存: 1TB SSD', '科學計算優化'],
        specifications2: ['科學計算優化', '專業軟體支援', '研究級配置'],
        stock: 6,
        image: '/images/products/4318322_R.webp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '25',
        name: 'Portal多維筆電',
        category: 'laptop',
        price: 3990,
        originalPrice: 4990,
        description: '具備多維度處理能力的筆記型電腦，適合複雜運算',
        specifications: ['處理器: Intel i7', '記憶體: 24GB', '高解析螢幕', '儲存: 512GB SSD', '多維運算支援'],
        specifications2: ['多維處理', '高解析顯示', '運算優化'],
        stock: 8,
        image: '/images/products/6674008_R1.webp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    this.saveProducts(defaultProducts);
    return defaultProducts;
  }

  private getDefaultUsers(): User[] {
    const defaultUsers: User[] = [
      {
        id: '1',
        email: 'admin@rickmorty.com',
        password: 'admin123',
        name: 'Rick Sanchez',
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ];
    
    this.saveUsers(defaultUsers);
    return defaultUsers;
  }

  // Statistics for admin
  getStatistics() {
    const products = this.getProducts();
    const orders = this.getOrders();
    const users = this.getUsers();
    
    const totalRevenue = orders.reduce((sum, order) => {
      if (order.status !== 'cancelled') {
        return sum + order.total;
      }
      return sum;
    }, 0);
    
    const lowStockProducts = products.filter(p => p.stock < 10);
    
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    
    return {
      totalProducts: products.length,
      totalUsers: users.filter(u => u.role === 'user').length,
      totalOrders: orders.length,
      totalRevenue,
      lowStockProducts,
      recentOrders,
      pendingOrders: orders.filter(o => o.status === 'pending').length
    };
  }
}

export const storage = new LocalStorageManager();

