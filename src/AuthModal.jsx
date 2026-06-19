import { useState, useEffect } from 'react';
import './authModal.css';

function AuthModal({ isOpen, onClose }) {
  const [isRightActive, setIsRightActive] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [selectedRandomEmail, setSelectedRandomEmail] = useState('');
  const [step, setStep] = useState('auth'); // 'auth' | 'verification'

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
      setStep('auth');
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
        className={`auth-modal-card-container ${step === 'verification' ? 'verification-mode' : ''} ${isRightActive ? 'right-panel-active' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button className="auth-modal-close" onClick={onClose} aria-label="Close modal">
          ✖
        </button>

        {step === 'verification' ? (
          <VerificationScreen onClose={onClose} />
        ) : (
          <>
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
            <div className="form-container sign-in-container">
              <form onSubmit={(e) => { e.preventDefault(); setStep('verification'); }}>
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
                  پাসওয়ার্ড ভুলে গেছেন?
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
          </>
        )}

      </div>
    </div>
  );
}

// Funny Account Verification Screen Component
function VerificationScreen({ onClose }) {
  const [boxPositions, setBoxPositions] = useState(Array(6).fill({ x: 0, y: 0 }));
  const [codeValues, setCodeValues] = useState(Array(6).fill(''));
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 });
  const [dodgeCount, setDodgeCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [codeExpired, setCodeExpired] = useState(false);
  const [currentCode, setCurrentCode] = useState('435841');

  const handleBoxHover = (index) => {
    setDodgeCount(prev => prev + 1);
    setBoxPositions(prev => {
      const next = [...prev];
      const multiplier = Math.min(2.5, 1 + dodgeCount * 0.05);
      const angle = Math.random() * Math.PI * 2;
      const distance = (70 + Math.random() * 60) * multiplier;
      const newX = Math.cos(angle) * distance;
      const newY = Math.sin(angle) * distance;
      next[index] = { x: newX, y: newY };
      return next;
    });
  };

  const handleInputChange = (index, value) => {
    const char = value.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    setCodeValues(prev => {
      const next = [...prev];
      // Target a random input box to make entry chaotic
      const randomIndex = Math.floor(Math.random() * 6);
      next[randomIndex] = char;

      setTimeout(() => {
        const inputs = document.querySelectorAll('.verification-input');
        if (inputs[randomIndex]) {
          inputs[randomIndex].focus();
        }
      }, 50);

      return next;
    });
  };

  const handlePaste = (e) => {
    e.preventDefault();
    setErrorMessage("নকলবাজি আমাদের সিস্টেমে নিষিদ্ধ! নিজে টাইপ করুন! 🚫");
    setCodeValues(Array(6).fill(''));
  };

  const handleMouseMove = (e) => {
    const container = e.currentTarget;
    const button = container.querySelector('.verify-btn');
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const dx = btnCenterX - mouseX;
    const dy = btnCenterY - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If mouse is within 110px of the button center, push it away
    if (distance < 110) {
      const force = (110 - distance) * 2.5;
      const angle = Math.atan2(dy, dx);

      let newX = btnPos.x + Math.cos(angle) * force;
      let newY = btnPos.y + Math.sin(angle) * force;

      // Restrict button displacement bounds
      const limitX = containerRect.width / 2 - rect.width / 2 - 20;
      const limitY = 100;

      if (newX > limitX) newX = -limitX;
      if (newX < -limitX) newX = limitX;
      if (newY > limitY) newY = -limitY;
      if (newY < -limitY) newY = limitY;

      setBtnPos({ x: newX, y: newY });
    }
  };

  const handleBtnTouchStart = () => {
    // Jump to random position on touch
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 80;
    setBtnPos({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    });
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    const enteredCode = codeValues.join('');
    
    if (enteredCode.length < 6) {
      setErrorMessage("দয়া করে ৬ ডিজিটের সম্পূর্ণ কোডটি প্রবিষ্ট করুন!");
      return;
    }

    if (enteredCode === currentCode) {
      setCodeExpired(true);
      setErrorMessage(`ভেরিফিকেশন ব্যর্থ! টাইপ করতে ৪ সেকেন্ড পেরিয়ে গেছে এবং কোডটি মেয়াদোত্তীর্ণ হয়ে গেছে। নতুন কোড: ৯৮৭৬৫৪ (১০ সেকেন্ডের মধ্যে ট্রাই করুন, বক্সগুলো দ্বিগুণ স্পিডে নড়বে!)`);
      setCurrentCode('987654');
      setCodeValues(Array(6).fill(''));
    } else {
      setErrorMessage("ভুল কোড! আমরা আপনার এক্স এর নম্বরে নতুন একটি কোড পাঠিয়েছি। আবার ট্রাই করুন!");
      setCodeValues(Array(6).fill(''));
    }
  };

  const handleGiveUp = () => {
    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2500);
  };

  if (success) {
    return (
      <div className="verification-success-screen">
        <div className="success-icon">🎉🐈</div>
        <h2 style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>লগইন সফল!</h2>
        <p className="verification-subtitle" style={{ fontSize: '15px', fontFamily: "'Hind Siliguri', sans-serif" }}>
          ঠিক আছে, ঠিক আছে! আপনার কান্নাকাটি দেখে মায়া হলো। <br />
          নিন, জোড়াতালি ড্যাশবোর্ডে আপনাকে প্রবেশ করতে দেওয়া হলো! 🛠️☕
        </p>
      </div>
    );
  }

  return (
    <div className="verification-container" onMouseMove={handleMouseMove}>
      <h2 style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>অ্যাকাউন্ট ভেরিফিকেশন</h2>
      
      <p className="verification-subtitle" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
        আমরা এইমাত্র সিক্রেট কোড <strong className="highlight-code">{currentCode}</strong> আপনার ফোন নম্বরে পাঠিয়েছি: <span className="highlight-phone">xxx-xxx-8247</span>
      </p>

      <p className="verification-instruction" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>দয়া করে নিচের বক্সে কোডটি লিখুন:</p>

      <form onSubmit={handleVerifySubmit} style={{ background: 'none', padding: 0, height: 'auto', display: 'block' }}>
        <div className="verification-boxes">
          {codeValues.map((val, idx) => (
            <input
              key={idx}
              type="text"
              maxLength={1}
              value={val}
              className="verification-input"
              style={{
                transform: `translate(${boxPositions[idx].x}px, ${boxPositions[idx].y}px)`,
                position: boxPositions[idx].x !== 0 || boxPositions[idx].y !== 0 ? 'relative' : 'static'
              }}
              onMouseEnter={() => handleBoxHover(idx)}
              onFocus={() => handleBoxHover(idx)}
              onTouchStart={() => handleBoxHover(idx)}
              onChange={(e) => handleInputChange(idx, e.target.value)}
              onPaste={handlePaste}
            />
          ))}
        </div>

        {errorMessage && (
          <div className="auth-error-box" style={{ marginBottom: '20px', maxWidth: '380px', margin: '0 auto 20px' }}>
            <span className="auth-error-icon">⚠️</span>
            <div className="auth-error-content">
              <span className="auth-error-title" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>সিকিউরিটি অ্যালার্ট!</span>
              <span className="auth-error-desc" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{errorMessage}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="verify-btn"
          style={{
            transform: `translate(${btnPos.x}px, ${btnPos.y}px)`,
            position: btnPos.x !== 0 || btnPos.y !== 0 ? 'relative' : 'static',
            fontFamily: "'Hind Siliguri', sans-serif"
          }}
          onTouchStart={handleBtnTouchStart}
        >
          ভেরিফাই করুন
        </button>
      </form>

      <button className="give-up-link" onClick={handleGiveUp} style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
        মামা, আমি লিজেন্ড নই, মাফ চাই! (Auto-fill & Skip)
      </button>

      {dodgeCount > 12 && !codeExpired && (
        <p style={{ fontSize: '11px', color: '#afa8bc', marginTop: '15px', fontStyle: 'italic', fontFamily: "'Hind Siliguri', sans-serif" }}>
          টিপস: কিবোর্ডের Tab কী চেপে ট্রাই করতে পারেন... ওহ আচ্ছা, ট্যাব টিপলেও তো নড়বে! 🤣
        </p>
      )}
    </div>
  );
}

export default AuthModal;
