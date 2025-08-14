import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Portal Animation */}
        <div className="w-32 h-32 mx-auto mb-8 rm-portal flex items-center justify-center text-4xl font-bold">
          404
        </div>
        
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-4">
          次元中斷線！
        </h1>
        
        <p className="text-xl text-gray-300 mb-2">
          網頁不存在
        </p>
        
        <p className="text-gray-400 mb-8">
          您要找的網頁可能已經被傳送到其他次元，或者從Rick的實驗室中消失了。
        </p>
        
        <div className="space-y-4">
          <Link 
            to="/" 
            className="rm-button flex items-center justify-center space-x-2 w-full"
          >
            <Home className="w-5 h-5" />
            <span>回到首頁</span>
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="rm-button-secondary flex items-center justify-center space-x-2 w-full"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回上一頁</span>
          </button>
        </div>
        
        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-400">
            💫 如果您認為這是一個錯誤，請聯繫我們的客服團隊。
          </p>
        </div>
      </div>
    </div>
  );
}
