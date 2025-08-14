import express from 'express';
import { getAsync, allAsync, runSQL } from '../database/database-adapter.js';
import { authenticateToken, requireAdmin } from './auth.js';

const router = express.Router();

// Helper function to transform product data
const transformProduct = (product) => {
  if (!product) return null;
  
  return {
    id: product.id.toString(),
    name: product.name,
    category: product.category,
    price: product.price,
    originalPrice: product.original_price,
    description: product.description,
    specifications: JSON.parse(product.specifications || '[]'),
    specifications2: JSON.parse(product.specifications2 || '[]'),
    stock: product.stock,
    image: product.image,
    notes: product.notes,
    featured: Boolean(product.featured),
    createdAt: product.created_at,
    updatedAt: product.updated_at
  };
};

// Get all products with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, featured, search, limit, offset } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    // Add category filter
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    // Add featured filter
    if (featured === 'true') {
      query += ' AND featured = 1';
    }

    // Add search filter
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Add ordering
    query += ' ORDER BY featured DESC, created_at DESC';

    // Add pagination
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
      
      if (offset) {
        query += ' OFFSET ?';
        params.push(parseInt(offset));
      }
    }

    const products = await allAsync(query, params);
    const transformedProducts = products.map(transformProduct);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const countParams = [];

    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    if (featured === 'true') {
      countQuery += ' AND featured = 1';
    }

    if (search) {
      countQuery += ' AND (name LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await getAsync(countQuery, countParams);

    res.json({
      success: true,
      products: transformedProducts,
      pagination: {
        total: countResult.total,
        limit: limit ? parseInt(limit) : null,
        offset: offset ? parseInt(offset) : 0,
        hasMore: limit ? (parseInt(offset || 0) + parseInt(limit)) < countResult.total : false
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      error: true,
      message: '獲取產品列表失敗'
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await getAsync(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (!product) {
      return res.status(404).json({
        error: true,
        message: '產品不存在'
      });
    }

    res.json({
      success: true,
      product: transformProduct(product)
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      error: true,
      message: '獲取產品資料失敗'
    });
  }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit, offset } = req.query;

    // Validate category
    const validCategories = ['mouse', 'keyboard', 'cable', 'powerbank', 'laptop'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: true,
        message: '無效的產品分類'
      });
    }

    let query = 'SELECT * FROM products WHERE category = ? ORDER BY featured DESC, created_at DESC';
    const params = [category];

    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
      
      if (offset) {
        query += ' OFFSET ?';
        params.push(parseInt(offset));
      }
    }

    const products = await allAsync(query, params);
    const transformedProducts = products.map(transformProduct);

    // Get total count
    const countResult = await getAsync(
      'SELECT COUNT(*) as total FROM products WHERE category = ?',
      [category]
    );

    res.json({
      success: true,
      products: transformedProducts,
      category,
      pagination: {
        total: countResult.total,
        limit: limit ? parseInt(limit) : null,
        offset: offset ? parseInt(offset) : 0
      }
    });

  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      error: true,
      message: '獲取分類產品失敗'
    });
  }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await allAsync(
      'SELECT * FROM products WHERE featured = 1 ORDER BY created_at DESC LIMIT ?',
      [parseInt(limit)]
    );

    const transformedProducts = products.map(transformProduct);

    res.json({
      success: true,
      products: transformedProducts
    });

  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      error: true,
      message: '獲取精選產品失敗'
    });
  }
});

// Search products
router.get('/search/query', async (req, res) => {
  try {
    const { q, category, limit = 20, offset = 0 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: true,
        message: '搜尋關鍵字至少需要2個字符'
      });
    }

    let query = `
      SELECT * FROM products 
      WHERE (name LIKE ? OR description LIKE ? OR specifications LIKE ?)
    `;
    const params = [`%${q}%`, `%${q}%`, `%${q}%`];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY featured DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const products = await allAsync(query, params);
    const transformedProducts = products.map(transformProduct);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total FROM products 
      WHERE (name LIKE ? OR description LIKE ? OR specifications LIKE ?)
    `;
    const countParams = [`%${q}%`, `%${q}%`, `%${q}%`];

    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    const countResult = await getAsync(countQuery, countParams);

    res.json({
      success: true,
      products: transformedProducts,
      query: q,
      pagination: {
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      error: true,
      message: '搜尋產品失敗'
    });
  }
});

// Create new product (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      originalPrice,
      description,
      specifications,
      specifications2,
      stock,
      image,
      notes,
      featured
    } = req.body;

    // Validation
    if (!name || !category || !price || !originalPrice || !description || !stock || !image) {
      return res.status(400).json({
        error: true,
        message: '請提供所有必要的產品資料'
      });
    }

    // Validate category
    const validCategories = ['mouse', 'keyboard', 'cable', 'powerbank', 'laptop'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: true,
        message: '無效的產品分類'
      });
    }

    // Validate prices
    if (price <= 0 || originalPrice <= 0) {
      return res.status(400).json({
        error: true,
        message: '價格必須大於0'
      });
    }

    if (stock < 0) {
      return res.status(400).json({
        error: true,
        message: '庫存數量不能為負數'
      });
    }

    // Create product
    const result = await runSQL(`
      INSERT INTO products (
        name, category, price, original_price, description,
        specifications, specifications2, stock, image, notes, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      category,
      price,
      originalPrice,
      description,
      JSON.stringify(specifications || []),
      JSON.stringify(specifications2 || []),
      stock,
      image,
      notes || null,
      featured ? 1 : 0
    ]);

    // Get the created product
    const newProduct = await getAsync(
      'SELECT * FROM products WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: '產品新增成功',
      product: transformProduct(newProduct)
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      error: true,
      message: '新增產品失敗'
    });
  }
});

// Update product (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      price,
      originalPrice,
      description,
      specifications,
      specifications2,
      stock,
      image,
      notes,
      featured
    } = req.body;

    // Check if product exists
    const existingProduct = await getAsync(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );

    if (!existingProduct) {
      return res.status(404).json({
        error: true,
        message: '產品不存在'
      });
    }

    // Validation
    if (!name || !category || !price || !originalPrice || !description || stock === undefined || !image) {
      return res.status(400).json({
        error: true,
        message: '請提供所有必要的產品資料'
      });
    }

    // Validate category
    const validCategories = ['mouse', 'keyboard', 'cable', 'powerbank', 'laptop'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: true,
        message: '無效的產品分類'
      });
    }

    // Validate prices
    if (price <= 0 || originalPrice <= 0) {
      return res.status(400).json({
        error: true,
        message: '價格必須大於0'
      });
    }

    if (stock < 0) {
      return res.status(400).json({
        error: true,
        message: '庫存數量不能為負數'
      });
    }

    // Update product
    await runSQL(`
      UPDATE products SET 
        name = ?, category = ?, price = ?, original_price = ?,
        description = ?, specifications = ?, specifications2 = ?,
        stock = ?, image = ?, notes = ?, featured = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name,
      category,
      price,
      originalPrice,
      description,
      JSON.stringify(specifications || []),
      JSON.stringify(specifications2 || []),
      stock,
      image,
      notes || null,
      featured ? 1 : 0,
      id
    ]);

    // Get the updated product
    const updatedProduct = await getAsync(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '產品更新成功',
      product: transformProduct(updatedProduct)
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      error: true,
      message: '更新產品失敗'
    });
  }
});

// Delete product (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await getAsync(
      'SELECT id, name FROM products WHERE id = ?',
      [id]
    );

    if (!existingProduct) {
      return res.status(404).json({
        error: true,
        message: '產品不存在'
      });
    }

    // Check if product is in any pending orders
    const pendingOrders = await getAsync(`
      SELECT COUNT(*) as count FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = ? AND o.status IN ('pending', 'processing')
    `, [id]);

    if (pendingOrders.count > 0) {
      return res.status(400).json({
        error: true,
        message: '無法刪除：該產品存在待處理訂單'
      });
    }

    // Delete product
    await runSQL('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `產品 "${existingProduct.name}" 已刪除`
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      error: true,
      message: '刪除產品失敗'
    });
  }
});

// Get product categories with counts
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await allAsync(`
      SELECT 
        category,
        COUNT(*) as count,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM products 
      GROUP BY category
      ORDER BY category
    `);

    const categoryNames = {
      mouse: '滑鼠',
      keyboard: '鍵盤',
      cable: '傳輸線',
      powerbank: '行動電源',
      laptop: '筆記型電腦'
    };

    const transformedCategories = categories.map(cat => ({
      category: cat.category,
      name: categoryNames[cat.category] || cat.category,
      count: cat.count,
      avgPrice: Math.round(cat.avg_price),
      minPrice: cat.min_price,
      maxPrice: cat.max_price
    }));

    res.json({
      success: true,
      categories: transformedCategories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: true,
      message: '獲取產品分類失敗'
    });
  }
});

// Update product stock (Admin only)
router.patch('/:id/stock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        error: true,
        message: '庫存數量不能為負數'
      });
    }

    // Check if product exists
    const existingProduct = await getAsync(
      'SELECT id, name FROM products WHERE id = ?',
      [id]
    );

    if (!existingProduct) {
      return res.status(404).json({
        error: true,
        message: '產品不存在'
      });
    }

    // Update stock
    await runSQL(
      'UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [stock, id]
    );

    res.json({
      success: true,
      message: `產品 "${existingProduct.name}" 庫存已更新為 ${stock}`
    });

  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      error: true,
      message: '更新庫存失敗'
    });
  }
});

export default router; 