import { useState, useEffect, useRef } from 'react';
import './dotNavigation.css';

function DotNavigation({ onOpenAuth, onToggleDragon, onScrollToSection, onOpenCoffee, onOpenBug, onToggleSpiderClock, showToast }) {
  const [isActive, setIsActive] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleButtonClick = (e, item) => {
    e.stopPropagation();
    setIsActive(false);

    if (item.actionType === 'scroll') {
      onScrollToSection(item.target, item.msg);
    } else if (item.actionType === 'auth') {
      onOpenAuth();
    } else if (item.actionType === 'dragon') {
      onToggleDragon();
    } else if (item.actionType === 'coffee') {
      onOpenCoffee();
    } else if (item.actionType === 'joke') {
      onOpenBug();
    } else if (item.actionType === 'spider') {
      if (onToggleSpiderClock) onToggleSpiderClock();
      showToast('🕷️ স্পাইডার ক্লক টগল করা হয়েছে!');
    }
  };

  const navItems = [
    { i: 0, x: -1, y: 0, icon: '📂', label: 'প্রজেক্টস', actionType: 'scroll', target: 'projects', msg: '📂 কীর্তিকলাপ সেকশনে যাচ্ছেন...' },
    { i: 1, x: 1, y: 0, icon: '⚙️', label: 'পদ্ধতি', actionType: 'scroll', target: 'process', msg: '⚙️ কপি-পেস্ট পদ্ধতিতে যাচ্ছেন...' },
    { i: 2, x: 0, y: -1, icon: '🔝', label: 'উপরে যান', actionType: 'scroll', target: 'hero', msg: '🔝 একদম শুরুতে ফেরত এসেছেন!' },
    { i: 3, x: 0, y: 1, icon: '✉️', label: 'নক দিন', actionType: 'scroll', target: 'contact', msg: '✉️ টিকিট ফর্মে নিয়ে যাওয়া হচ্ছে...' },
    { i: 4, x: 1, y: 1, icon: '🛑', label: 'ভিক্টিম', actionType: 'scroll', target: 'victims', msg: '🛑 ভিক্টিমদের আর্তনাদ লোড হচ্ছে...' },
    { i: 5, x: -1, y: -1, icon: '🔑', label: 'লগইন', actionType: 'auth' },
    { i: 6, x: 0, y: 0, icon: '🕷️', label: 'স্পাইডার ক্লক', actionType: 'spider' },
    { i: 7, x: -1, y: 1, icon: '🐉', label: 'ড্রাগন সেটিংস', actionType: 'dragon' },
    { i: 8, x: 1, y: -1, icon: '🐛', label: 'বাগ জোক', actionType: 'joke' },
  ];

  return (
    <div className="dot-nav-wrapper" ref={menuRef}>
      <div 
        className={`dot-navigation ${isActive ? 'active' : ''}`}
        onClick={() => setIsActive(prev => !prev)}
        title={isActive ? "মেনু বন্ধ করতে ক্লিক করুন" : "৯-ডট কুইক লঞ্চার"}
      >
        {navItems.map((item) => (
          <span
            key={item.i}
            className="dot-item cursor-pointer"
            style={{
              '--i': item.i,
              '--x': item.x,
              '--y': item.y,
            }}
            onClick={(e) => {
              if (isActive) {
                handleButtonClick(e, item);
              }
            }}
            title={item.label}
          >
            <span className="dot-icon select-none">
              {item.icon}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default DotNavigation;
