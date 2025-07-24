import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, Mail, Star, Twitter, Facebook, Linkedin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-gray-400 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
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
              <li>
                <Link to="/help/faq" className="text-gray-400 hover:text-yellow-400 transition-colors py-1 block">
                  常見問題
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="footer-column text-center md:text-left pt-8 md:pt-0">
            <ul className="inline-block space-y-1">
              <li>
                <span className="footer-title text-sm font-bold text-white uppercase tracking-wide">
                  公司
                </span>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-yellow-400 transition-colors py-1 block">
                  關於我們
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-400 hover:text-yellow-400 transition-colors py-1 block">
                  人才招募
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-gray-400 hover:text-yellow-400 transition-colors py-1 block">
                  新聞動態
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support Column */}
          <div className="footer-column text-center md:text-left pt-8 md:pt-0">
            <ul className="inline-block space-y-1">
              <li>
                <span className="footer-title text-sm font-bold text-white uppercase tracking-wide">
                  聯絡與支援
                </span>
              </li>
              <li>
                <span className="text-gray-400 py-1 block flex items-center justify-center md:justify-start">
                  <Phone className="w-4 h-4 mr-2" />
                  +886 2 1234 5678
                </span>
              </li>
              <li>
                <Link to="/support/chat" className="text-gray-400 hover:text-yellow-400 transition-colors py-1 block flex items-center justify-center md:justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  線上客服
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-yellow-400 transition-colors py-1 block flex items-center justify-center md:justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  聯絡我們
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="text-gray-400 hover:text-yellow-400 transition-colors py-1 block flex items-center justify-center md:justify-start">
                  <Star className="w-4 h-4 mr-2" />
                  意見回饋
                </Link>
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
              Copyright © Corba 3C Shop {currentYear}
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