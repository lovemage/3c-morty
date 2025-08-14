import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import { Product, storage } from '../lib/localStorage';
import { ProductCard } from '../components/Product/ProductCard';

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<Product[]>([]);
  const [filteredResults, setFilteredResults] = useState<Product[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  const categoryNames = {
  mouse: '滑鼠',
  keyboard: '鍵盤', 
  cable: '傳輸線',
  powerbank: '行動電源',
  laptop: '筆記型電腦',
  juicer: '果汁機/破壁機'
};

  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery) {
      setQuery(searchQuery);
      performSearch(searchQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    let filtered = [...results];

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => selectedCategories.includes(p.category));
    }

    // Sort by relevance (default)
    filtered.sort((a, b) => {
      // Sort by how many times the query appears in the name
      const aScore = a.name.toLowerCase().split(query.toLowerCase()).length - 1;
      const bScore = b.name.toLowerCase().split(query.toLowerCase()).length - 1;
      return bScore - aScore;
    });

    setFilteredResults(filtered);
  }, [results, selectedCategories, query]);

  const performSearch = (searchQuery: string) => {
    setLoading(true);
    
    // Simulate search delay
    setTimeout(() => {
      const searchResults = storage.searchProducts(searchQuery);
      setResults(searchResults);
      
      // Reset price range based on search results
      if (searchResults.length > 0) {
        const prices = searchResults.map(p => p.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        setPriceRange([minPrice, maxPrice]);
      }
      
      setLoading(false);
    }, 300);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  const handleCategoryChange = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const clearFilters = () => {
    setSelectedCategories([]);
  };



  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-gray-800 mb-6">
          搜尋結果
        </h1>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋產品..."
            className="rm-input pr-12 text-lg"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-500 hover:text-yellow-600 transition-colors"
          >
            <SearchIcon className="w-6 h-6" />
          </button>
        </form>
        
        {query && (
          <p className="text-gray-600 mt-4">
            搜尋「<span className="text-gray-800 font-medium">{query}</span>」共找到 {filteredResults.length} 個結果
          </p>
        )}
      </div>

      {/* Filters - Top Layout */}
      <div className="rm-card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">產品分類篩選</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700 transition-colors p-2"
              title="清除篩選"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div>
            <h4 className="font-semibold mb-4 text-gray-800 hidden lg:block">選擇產品分類</h4>
            <div className="flex flex-wrap gap-3">
              {Object.entries(categoryNames).map(([key, name]) => (
                <label key={key} className="flex items-center space-x-2 cursor-pointer bg-gray-100 px-4 py-3 rounded-lg border hover:bg-gray-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(key)}
                    onChange={() => handleCategoryChange(key)}
                    className="w-4 h-4 accent-yellow-500"
                  />
                  <span className="text-gray-700 font-medium">{name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="rm-loading w-8 h-8"></div>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <SearchIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-600 mb-2">
            {query ? '沒有找到相關產品' : '輸入關鍵字搜尋產品'}
          </h3>
          <p className="text-gray-500">
            {query ? '請嘗試使用不同的關鍵字或調整篩選條件' : '例如：滑鼠、鍵盤、筆電等'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {filteredResults.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
