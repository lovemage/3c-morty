import express from 'express';
import { runSQL, getAsync, allAsync } from '../database/database-adapter.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await allAsync('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: '獲取分類失敗' });
  }
});

// Get category by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await getAsync('SELECT * FROM categories WHERE id = ?', [id]);
    
    if (!category) {
      return res.status(404).json({ message: '分類不存在' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: '獲取分類失敗' });
  }
});

// Create new category (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id, name, icon, description, gradient } = req.body;

    // Validate required fields
    if (!id || !name || !icon) {
      return res.status(400).json({ message: '分類ID、名稱和圖標為必填項' });
    }

    // Check if category ID already exists
    const existingCategory = await getAsync('SELECT id FROM categories WHERE id = ?', [id]);
    if (existingCategory) {
      return res.status(400).json({ message: '分類ID已存在' });
    }

    // Check if category name already exists
    const existingName = await getAsync('SELECT id FROM categories WHERE name = ?', [name]);
    if (existingName) {
      return res.status(400).json({ message: '分類名稱已存在' });
    }

    const result = await runSQL(
      'INSERT INTO categories (id, name, icon, description, gradient) VALUES (?, ?, ?, ?, ?)',
      [id, name, icon, description || '', gradient || 'from-gray-400 to-gray-600']
    );

    const newCategory = await getAsync('SELECT * FROM categories WHERE id = ?', [id]);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: '創建分類失敗' });
  }
});

// Update category (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, description, gradient } = req.body;

    // Check if category exists
    const existingCategory = await getAsync('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existingCategory) {
      return res.status(404).json({ message: '分類不存在' });
    }

    // Validate required fields
    if (!name || !icon) {
      return res.status(400).json({ message: '分類名稱和圖標為必填項' });
    }

    // Check if new name conflicts with other categories
    const nameConflict = await getAsync('SELECT id FROM categories WHERE name = ? AND id != ?', [name, id]);
    if (nameConflict) {
      return res.status(400).json({ message: '分類名稱已存在' });
    }

    await runSQL(
      'UPDATE categories SET name = ?, icon = ?, description = ?, gradient = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, icon, description || '', gradient || 'from-gray-400 to-gray-600', id]
    );

    const updatedCategory = await getAsync('SELECT * FROM categories WHERE id = ?', [id]);
    res.json(updatedCategory);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: '更新分類失敗' });
  }
});

// Delete category (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await getAsync('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existingCategory) {
      return res.status(404).json({ message: '分類不存在' });
    }

    // Check if category is being used by products
    const productsUsingCategory = await getAsync('SELECT COUNT(*) as count FROM products WHERE category = ?', [id]);
    if (productsUsingCategory.count > 0) {
      return res.status(400).json({ 
        message: `無法刪除分類，還有 ${productsUsingCategory.count} 個產品使用此分類` 
      });
    }

    await runSQL('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: '分類已刪除' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: '刪除分類失敗' });
  }
});

// Get category with product count
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await getAsync('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category) {
      return res.status(404).json({ message: '分類不存在' });
    }

    const productCount = await getAsync('SELECT COUNT(*) as count FROM products WHERE category = ?', [id]);
    
    res.json({
      ...category,
      productCount: productCount.count
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ message: '獲取分類統計失敗' });
  }
});

export default router; 