import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, ChevronDown } from 'lucide-react';
import { Product, storage } from '../lib/localStorage';
import { ProductCard } from '../components/Product/ProductCard';

export function Products() {
  const { category } = useParams<{ category?: string }>();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc' | 'stock'>('name');
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  const categoryNames = {
    mouse: '滑鼠',
    keyboard: '鍵盤',
    cable: '傳輸線',
    powerbank: '行動電源',
    laptop: '筆記型電腦'
  };

  useEffect(() => {
    setLoading(true);
    let allProducts = storage.getProducts();
    
    if (category) {
      allProducts = allProducts.filter(p => p.category === category);
    }
    
    setProducts(allProducts);
    
    // Set initial price range based on products
    if (allProducts.length > 0) {
      const prices = allProducts.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      setPriceRange([minPrice, maxPrice]);
    }
    
    setLoading(false);
  }, [category]);

  useEffect(() => {
    let filtered = [...products];

    // Filter by categories (if not viewing specific category)
    if (!category && selectedCategories.length > 0) {
      filtered = filtered.filter(p => selectedCategories.includes(p.category));
    }

    // Filter by price range
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'stock':
          return b.stock - a.stock;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  }, [products, selectedCategories, priceRange, sortBy, category]);

  const handleCategoryChange = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rm-loading w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-gray-800">
          {category ? categoryNames[category as keyof typeof categoryNames] : '所有產品'}
        </h1>
        <p className="text-gray-400">
          共找到 {filteredProducts.length} 個產品
        </p>
      </div>

      {/* Filters - Top Layout */}
      <div className="rm-card mb-8">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="w-full flex items-center justify-between mb-4 p-3 lg:hidden"
        >
          <span className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span className="font-medium">篩選與排序</span>
          </span>
          <ChevronDown className={`w-5 h-5 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
        </button>
        
        <div className={`${filterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-end">
            {/* Categories Filter (only show if not viewing specific category) */}
            {!category && (
              <div className="lg:col-span-4">
                <h4 className="font-semibold mb-3 text-gray-800">分類</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(categoryNames).map(([key, name]) => (
                    <label key={key} className="flex items-center space-x-2 cursor-pointer bg-gray-100 px-3 py-2 rounded-lg border hover:bg-gray-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(key)}
                        onChange={() => handleCategoryChange(key)}
                        className="w-4 h-4 accent-yellow-500"
                      />
                      <span className="text-gray-700 text-sm">{name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div className={category ? "lg:col-span-4" : "lg:col-span-3"}>
              <h4 className="font-semibold mb-3 text-gray-800">價格範圍</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                    className="rm-input text-sm w-28"
                    placeholder="最低價格"
                  />
                  <span className="text-gray-500">~</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 100000])}
                    className="rm-input text-sm w-28"
                    placeholder="最高價格"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {formatPrice(priceRange[0])} ~ {formatPrice(priceRange[1])}
                </p>
              </div>
            </div>

            {/* Sort & View Controls */}
            <div className={category ? "lg:col-span-5" : "lg:col-span-5"}>
              <h4 className="font-semibold mb-3 text-gray-800">排序與檢視</h4>
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rm-input text-sm flex-1"
                >
                  <option value="name">名稱排序</option>
                  <option value="price-asc">價格低到高</option>
                  <option value="price-desc">價格高到低</option>
                  <option value="stock">庫存排序</option>
                </select>
                
                <div className="flex items-center space-x-2 border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-yellow-400 text-black' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-yellow-400 text-black' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-4xl">😕</span>
          </div>
          <h3 className="text-xl font-bold text-gray-600 mb-2">沒有找到產品</h3>
          <p className="text-gray-500">請嘗試調整篩選條件</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6'
          : 'space-y-4'
        }>
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
