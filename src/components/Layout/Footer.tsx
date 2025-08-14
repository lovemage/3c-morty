import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, Mail, Star, Twitter, Facebook, Linkedin, MapPin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-gray-400 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info Column */}
          <div className="footer-column text-center md:text-left">
            <ul className="inline-block space-y-1">
              <li>
                <span className="footer-title text-sm font-bold text-white uppercase tracking-wide">
                  公司資訊
                </span>
              </li>
              <li>
                <span className="text-gray-400 py-1 block text-sm">
                  小猴組商行
                </span>
              </li>
              <li>
                <span className="text-gray-400 py-1 block text-sm">
                  統一編號：95268999
                </span>
              </li>
              <li>
                <span className="text-gray-400 py-1 block text-sm flex items-start justify-center md:justify-start">
                  <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                  台中市西區民生里自由路一段101號8樓之2
                </span>
              </li>
            </ul>
          </div>

          {/* Product Column */}
          <div className="footer-column text-center md:text-left">
            <ul className="inline-block space-y-1">
              <li>
                <span className="footer-title text-sm font-bold text-white uppercase tracking-wide">
                  產品
                </span>
              </li>
              <li>
                <Link to="/products" className="text-gray-400 hover:text-yellow-400 transition-colors py-1 block">
                  所有產品
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-gray-400 hover:text-yellow-400 transition-colors py-1 block">
                  產品分類
                </Link>
              </li>
              <li>
                <Link to="/products?featured=true" className="text-gray-400 hover:text-yellow-400 transition-colors py-1 block">
                  精選商品
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links Column */}
          <div className="footer-column text-center md:text-left">
            <ul className="inline-block space-y-1">
              <li>
                <span className="footer-title text-sm font-bold text-white uppercase tracking-wide">
                  服務
                </span>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-yellow-400 transition-colors py-1 block">
                  聯絡我們
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-400 hover:text-yellow-400 transition-colors py-1 block">
                  人才招募
                </Link>
              </li>
              <li>
                <Link to="/help/faq" className="text-gray-400 hover:text-yellow-400 transition-colors py-1 block">
                  常見問題
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="text-gray-400 hover:text-yellow-400 transition-colors py-1 block">
                  意見回饋
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support Column */}
          <div className="footer-column text-center md:text-left">
            <ul className="inline-block space-y-1">
              <li>
                <span className="footer-title text-sm font-bold text-white uppercase tracking-wide">
                  聯絡客服
                </span>
              </li>
              <li>
                <a 
                  href="mailto:kusoboy210@gmail.com"
                  className="text-gray-400 hover:text-yellow-400 transition-colors py-1 block flex items-center justify-center md:justify-start"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  kusoboy210@gmail.com
                </a>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-yellow-400 transition-colors py-1 block flex items-center justify-center md:justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  線上留言
                </Link>
              </li>
              <li>
                <span className="text-gray-400 py-1 block text-sm">
                  週一至週五 9:00-18:00
                </span>
              </li>
              <li>
                <span className="text-gray-400 py-1 block text-sm">
                  週六 9:00-17:00
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Separator */}
        <div className="text-center py-8">
          <span className="text-white text-2xl">⋯</span>
        </div>

        {/* Bottom Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center items-center">
          {/* Copyright */}
          <div className="order-2 md:order-1">
            <span className="text-white text-sm">
              Copyright © 小猴組商行 {currentYear}
            </span>
            <br />
            <span className="text-gray-400 text-xs">
              統一編號：95268999
            </span>
          </div>

          {/* Social Buttons */}
          <div className="order-1 md:order-2">
            <ul className="flex justify-center space-x-4">
              <li>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-gray-700 hover:bg-yellow-400 text-white rounded-full flex items-center justify-center transition-all duration-300"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-gray-700 hover:bg-yellow-400 text-white rounded-full flex items-center justify-center transition-all duration-300"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-gray-700 hover:bg-yellow-400 text-white rounded-full flex items-center justify-center transition-all duration-300"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="order-3">
            <ul className="flex justify-center space-x-4 text-sm">
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-yellow-400 transition-colors">
                  隱私政策
                </Link>
              </li>
              <li className="text-gray-600">|</li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-yellow-400 transition-colors">
                  使用條款
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
} 