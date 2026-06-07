import { useState, useEffect } from 'react';
import './authModal.css';

function AuthModal({ isOpen, onClose }) {
  const [isRightActive, setIsRightActive] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [selectedRandomEmail, setSelectedRandomEmail] = useState('');

  const randomEmails = [
    'r15@gmail.com',
    'hero_alom@yahoo.com',
    'kodu_mia@gmail.com',
    'abazab_dev@hotmail.com',
    'chapa_baz@gmail.com',
    'shakib_khan75@outlook.com',
    'vua_engineer@goolg.com',
    'cha_khor_babu@chai.com',
    'murgi_milon@gmail.com',
    'hablu_programmer@facebook.com',
    'stack_overflow_fanatic@copypaste.org',
    'kamla_dev@joorataali.net',
    'mini_malist_empty_page@whitecanvas.co',
    'semicolon_hunter@nightshift.in',
    'coffee_dependent_zombie@sleepdeprived.com'
  ];

  // Reset errors and fields when modal state changes
  useEffect(() => {
    if (!isOpen) {
      setSignupEmail('');
      setSignupPassword('');
      setShowError(false);
      setSelectedRandomEmail('');
    }
  }, [isOpen]);

  // Reset error when switching between login and signup
  useEffect(() => {
    setShowError(false);
    setSelectedRandomEmail('');
  }, [isRightActive]);

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    // Pick a random email from the list that is NOT equal to the user's entered email
    const filteredEmails = randomEmails.filter(email => email !== signupEmail.trim().toLowerCase());
    const randomIndex = Math.floor(Math.random() * filteredEmails.length);
    setSelectedRandomEmail(filteredEmails[randomIndex]);
    setShowError(true);
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className={`auth-modal-card-container ${isRightActive ? 'right-panel-active' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button className="auth-modal-close" onClick={onClose} aria-label="Close modal">
          ✖
        </button>

        {/* Sign Up Form */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignupSubmit}>
            <h1>নতুন ভিক্টিম রেজিস্ট্রেশন</h1>
            <div className="social-container">
              <a href="#" className="social-icon" title="Google" onClick={(e) => e.preventDefault()}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </a>
              <a href="#" className="social-icon" title="Facebook" onClick={(e) => e.preventDefault()}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
                </svg>
              </a>
              <a href="#" className="social-icon" title="GitHub" onClick={(e) => e.preventDefault()}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="var(--color-on-surface)" />
                </svg>
              </a>
            </div>
            <span>বা আমাদের সাথে ফাও অ্যাকাউন্ট খুলুন</span>
            <div className="input-group">
              <input type="text" placeholder="ছদ্মনাম (Name)" required />
            </div>
            <div className="input-group">
              <input 
                type="email" 
                placeholder="ফাঁকিবাজি ইমেইল (Email)" 
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required 
              />
            </div>
            <div className="input-group">
              <input 
                type="password" 
                placeholder="গোপন পাসওয়ার্ড (Password)" 
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required 
              />
            </div>
            <button type="submit">ধরা খান</button>

            {showError && (
              <div className="auth-error-box">
                <span className="auth-error-icon">⚠️</span>
                <div className="auth-error-content">
                  <span className="auth-error-title">পাসওয়ার্ডের এককত্ব (Uniqueness) ভঙ্গের ত্রুটি!</span>
                  <span className="auth-error-desc">
                    এই পাসওয়ার্ডটি ইতিমধ্যে আমাদের সার্ভারে ইউজার <strong>{selectedRandomEmail}</strong> এর নামে রেজিস্টার্ড আছে। দয়া করে ইউনিক কোনো পাসওয়ার্ড দিন!
                  </span>
                </div>
              </div>
            )}

            <div className="mobile-switch-text">
              <span>অলরেডি ধরা খেয়েছেন? </span>
              <button type="button" onClick={() => setIsRightActive(false)}>লগইন করুন</button>
            </div>
          </form>
        </div>

        {/* Sign In Form */}
        <div class="form-container sign-in-container">
          <form onSubmit={(e) => { e.preventDefault(); alert("লগইন সফল! কিন্তু আমরা এখনো নিশ্চিত নই আপনি মানুষ নাকি রোবট। তাই ভেরিফিকেশনের জন্য আপনার স্ক্রিনের দিকে তাকিয়ে তিনবার 'মিউ মিউ' শব্দ করুন! 🐈"); }}>
            <h1>জোড়াতালি সার্ভারে প্রবেশ</h1>
            <div className="social-container">
              <a href="#" className="social-icon" title="Google" onClick={(e) => e.preventDefault()}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </a>
              <a href="#" className="social-icon" title="Facebook" onClick={(e) => e.preventDefault()}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
                </svg>
              </a>
              <a href="#" className="social-icon" title="GitHub" onClick={(e) => e.preventDefault()}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="var(--color-on-surface)" />
                </svg>
              </a>
            </div>
            <span>বা আপনার কপি-পেস্ট পাসওয়ার্ড দিন</span>
            <div className="input-group">
              <input type="email" placeholder="নিবন্ধিত ইমেইল (Email)" required />
            </div>
            <div className="input-group">
              <input type="password" placeholder="গোপন পাসওয়ার্ড (Password)" required />
            </div>
            <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); alert('কপাল ভালো থাকলে মনে পড়বে, গুগলে তো রিকভারি নাই! 😆'); }}>
              পাসওয়ার্ড ভুলে গেছেন?
            </a>
            <button type="submit">প্রবেশ করুন</button>

            <div className="mobile-switch-text">
              <span>নতুন ভিক্টিম? </span>
              <button type="button" onClick={() => setIsRightActive(true)}>সাইন-আপ করুন</button>
            </div>
          </form>
        </div>

        {/* Sliding Overlay Panels */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>অলরেডি ধরা খেয়েছেন?</h1>
              <p>কফি শেষ হওয়ার আগে তাড়াতাড়ি লগইন করে ফেলুন এবং কপি-পেস্ট শুরু করুন!</p>
              <button className="ghost" onClick={() => setIsRightActive(false)}>
                লগইন করুন
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>হে নতুন ভিক্টিম!</h1>
              <p>আসুন আমাদের জোড়াতালি ফ্যামিলিতে যুক্ত হোন আর অন্যের কোড কপি করুন!</p>
              <button className="ghost" onClick={() => setIsRightActive(true)}>
                সাইন-আপ করুন
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AuthModal;
