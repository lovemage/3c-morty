import express from 'express';
import { getAsync, allAsync, runSQL } from '../database/database-adapter.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Helper function to get cart with product details
const getCartWithProducts = async (userId) => {
  const cartItems = await allAsync(`
    SELECT 
      c.id as cart_id,
      c.user_id,
      c.product_id,
      c.quantity,
      c.created_at as added_at,
      p.id as product_id,
      p.name as product_name,
      p.price as product_price,
      p.original_price as product_original_price,
      p.description as product_description,
      p.image as product_image,
      p.stock as product_stock,
      p.category as product_category
    FROM cart c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `, [userId]);

  return cartItems.map(item => ({
    cartId: item.cart_id,
    productId: item.product_id.toString(),
    quantity: item.quantity,
    addedAt: item.added_at,
    product: {
      id: item.product_id.toString(),
      name: item.product_name,
      price: item.product_price,
      originalPrice: item.product_original_price,
      description: item.product_description,
      image: item.product_image,
      stock: item.product_stock,
      category: item.product_category
    }
  }));
};

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cartItems = await getCartWithProducts(userId);
    
    // Calculate totals
    const summary = {
      totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
      totalOriginalPrice: cartItems.reduce((sum, item) => sum + (item.product.originalPrice * item.quantity), 0)
    };
    
    summary.totalSavings = summary.totalOriginalPrice - summary.totalPrice;

    res.json({
      success: true,
      cart: cartItems,
      summary
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      error: true,
      message: '獲取購物車失敗'
    });
  }
});

// Add item to cart
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    // Validation
    if (!productId) {
      return res.status(400).json({
        error: true,
        message: '請提供產品ID'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        error: true,
        message: '數量必須大於0'
      });
    }

    // Check if product exists and has enough stock
    const product = await getAsync(
      'SELECT id, name, stock FROM products WHERE id = ?',
      [productId]
    );

    if (!product) {
      return res.status(404).json({
        error: true,
        message: '產品不存在'
      });
    }

    // Check existing cart item
    const existingCartItem = await getAsync(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    const newQuantity = existingCartItem ? existingCartItem.quantity + quantity : quantity;

    if (newQuantity > product.stock) {
      return res.status(400).json({
        error: true,
        message: `庫存不足，目前庫存：${product.stock}`
      });
    }

    if (existingCartItem) {
      // Update existing cart item
      await runSQL(
        'UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newQuantity, existingCartItem.id]
      );
    } else {
      // Add new cart item
      await runSQL(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, productId, quantity]
      );
    }

    // Get updated cart
    const cartItems = await getCartWithProducts(userId);
    
    res.json({
      success: true,
      message: `已將 "${product.name}" 加入購物車`,
      cart: cartItems
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      error: true,
      message: '加入購物車失敗'
    });
  }
});

// Update cart item quantity
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    // Validation
    if (!productId) {
      return res.status(400).json({
        error: true,
        message: '請提供產品ID'
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        error: true,
        message: '數量不能為負數'
      });
    }

    // Check if cart item exists
    const cartItem = await getAsync(
      'SELECT id FROM cart WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (!cartItem) {
      return res.status(404).json({
        error: true,
        message: '購物車中沒有此商品'
      });
    }

    if (quantity === 0) {
      // Remove item from cart
      await runSQL('DELETE FROM cart WHERE id = ?', [cartItem.id]);
      
      res.json({
        success: true,
        message: '商品已從購物車移除'
      });
    } else {
      // Check product stock
      const product = await getAsync(
        'SELECT name, stock FROM products WHERE id = ?',
        [productId]
      );

      if (quantity > product.stock) {
        return res.status(400).json({
          error: true,
          message: `庫存不足，目前庫存：${product.stock}`
        });
      }

      // Update quantity
      await runSQL(
        'UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [quantity, cartItem.id]
      );

      res.json({
        success: true,
        message: '購物車已更新'
      });
    }

    // Get updated cart for all responses
    const cartItems = await getCartWithProducts(userId);
    
    res.json({
      success: true,
      cart: cartItems
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      error: true,
      message: '更新購物車失敗'
    });
  }
});

// Remove item from cart
router.delete('/remove/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    // Check if cart item exists
    const cartItem = await getAsync(
      'SELECT c.id, p.name FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ? AND c.product_id = ?',
      [userId, productId]
    );

    if (!cartItem) {
      return res.status(404).json({
        error: true,
        message: '購物車中沒有此商品'
      });
    }

    // Remove item
    await runSQL('DELETE FROM cart WHERE id = ?', [cartItem.id]);

    // Get updated cart
    const cartItems = await getCartWithProducts(userId);

    res.json({
      success: true,
      message: `已將 "${cartItem.name}" 從購物車移除`,
      cart: cartItems
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      error: true,
      message: '移除商品失敗'
    });
  }
});

// Clear entire cart
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if cart has items
    const cartCount = await getAsync(
      'SELECT COUNT(*) as count FROM cart WHERE user_id = ?',
      [userId]
    );

    if (cartCount.count === 0) {
      return res.status(400).json({
        error: true,
        message: '購物車已經是空的'
      });
    }

    // Clear cart
    await runSQL('DELETE FROM cart WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      message: '購物車已清空',
      cart: []
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      error: true,
      message: '清空購物車失敗'
    });
  }
});

// Get cart item count
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getAsync(
      'SELECT COALESCE(SUM(quantity), 0) as count FROM cart WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      count: result.count
    });

  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({
      error: true,
      message: '獲取購物車數量失敗'
    });
  }
});

// Validate cart before checkout
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await getCartWithProducts(userId);

    if (cartItems.length === 0) {
      return res.status(400).json({
        error: true,
        message: '購物車是空的'
      });
    }

    const issues = [];
    const validItems = [];

    for (const item of cartItems) {
      // Check if product still exists
      const product = await getAsync(
        'SELECT id, name, stock, price FROM products WHERE id = ?',
        [item.productId]
      );

      if (!product) {
        issues.push({
          productId: item.productId,
          issue: 'product_not_found',
          message: `產品 "${item.product.name}" 已不存在`
        });
        continue;
      }

      // Check stock availability
      if (item.quantity > product.stock) {
        issues.push({
          productId: item.productId,
          issue: 'insufficient_stock',
          message: `產品 "${product.name}" 庫存不足，目前庫存：${product.stock}`
        });
        continue;
      }

      // Check price changes
      if (item.product.price !== product.price) {
        issues.push({
          productId: item.productId,
          issue: 'price_changed',
          message: `產品 "${product.name}" 價格已變更`,
          oldPrice: item.product.price,
          newPrice: product.price
        });
      }

      validItems.push(item);
    }

    res.json({
      success: true,
      valid: issues.length === 0,
      items: validItems,
      issues
    });

  } catch (error) {
    console.error('Validate cart error:', error);
    res.status(500).json({
      error: true,
      message: '驗證購物車失敗'
    });
  }
});

// Merge guest cart with user cart (for login scenarios)
router.post('/merge', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { guestCart } = req.body; // Array of {productId, quantity}

    if (!guestCart || !Array.isArray(guestCart)) {
      return res.status(400).json({
        error: true,
        message: '無效的購物車數據'
      });
    }

    // Process each guest cart item
    for (const guestItem of guestCart) {
      const { productId, quantity } = guestItem;

      if (!productId || quantity <= 0) continue;

      // Check if product exists
      const product = await getAsync(
        'SELECT id, stock FROM products WHERE id = ?',
        [productId]
      );

      if (!product) continue;

      // Check existing cart item
      const existingCartItem = await getAsync(
        'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
        [userId, productId]
      );

      if (existingCartItem) {
        // Update existing item (take the higher quantity)
        const newQuantity = Math.max(existingCartItem.quantity, quantity);
        if (newQuantity <= product.stock) {
          await runSQL(
            'UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newQuantity, existingCartItem.id]
          );
        }
      } else {
        // Add new item
        if (quantity <= product.stock) {
          await runSQL(
            'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
            [userId, productId, quantity]
          );
        }
      }
    }

    // Get merged cart
    const cartItems = await getCartWithProducts(userId);

    res.json({
      success: true,
      message: '購物車已合併',
      cart: cartItems
    });

  } catch (error) {
    console.error('Merge cart error:', error);
    res.status(500).json({
      error: true,
      message: '合併購物車失敗'
    });
  }
});

export default router; 