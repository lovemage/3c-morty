import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  gradient: string;
  created_at?: string;
  updated_at?: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/categories');
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        setError('獲取分類失敗');
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('網路錯誤');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || categoryId;
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.icon || '📦';
  };

  const getCategoryGradient = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.gradient || 'from-gray-400 to-gray-600';
  };

  const refetch = () => {
    fetchCategories();
  };

  return {
    categories,
    loading,
    error,
    getCategoryName,
    getCategoryIcon,
    getCategoryGradient,
    refetch
  };
} 