import { useState, useEffect } from 'react';
import Dragon from './Dragon';
import Flower from './Flower';
import Butterflies from './Butterflies';
import ParticleText from './ParticleText';
import AuthModal from './AuthModal';

function App() {
  const [showAllVictims, setShowAllVictims] = useState(false);
  const [copyCount, setCopyCount] = useState(45679);
  const [isShaking, setIsShaking] = useState(false);
  const [agreedToBugs, setAgreedToBugs] = useState(false);
  const [dragonOpacity, setDragonOpacity] = useState(0.2);
  const [dragonSize, setDragonSize] = useState(0.6);
  const [showDragonSettings, setShowDragonSettings] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fake Counter Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCopyCount(prev => prev + Math.floor(Math.random() * 5) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);



  // Scroll Reveal Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const timeout = setTimeout(() => {
      const hiddenElements = document.querySelectorAll('.reveal');
      hiddenElements.forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [showAllVictims]);

  const projects = [
    {
      id: 1,
      name: "গুগল সার্চ ইঞ্জিনিয়ারিং",
      description: "অন্যের কোড কপি করে নিজের নামে চালিয়ে দেওয়ার এক অনন্য নিদর্শন।",
      image: "./1.png",
      tag: "কপি-পেস্ট ইঞ্জিনিয়ারিং"
    },
    {
      id: 2,
      name: "সেমিকোলন খোঁজার যুদ্ধ",
      description: "সারা রাত জেগে একটা মিসিং সেমিকোলন খুঁজে বের করার পর যে আনন্দ হয়, তা অমূল্য।",
      image: "./2.png",
      tag: "অসীম ধৈর্য"
    },
    {
      id: 3,
      name: "বাগ নাকি ফিচার?",
      description: "ক্লায়েন্টকে বুঝানো যে এই গ্লিচটা আসলে একটা 'আর্টিস্টিক চয়েস' ছিল।",
      image: "./3.png",
      tag: "মার্কেটিং স্ট্র্যাটেজি"
    },
    {
      id: 4,
      name: "সার্চিং অলিম্পিক",
      description: "সঠিক কি-ওয়ার্ড দিয়ে স্ট্যাক ওভারফ্লো থেকে সমাধান বের করার এক মহাকাব্য।",
      image: "./4.png",
      tag: "গুগল স্পেশালিস্ট"
    }
  ];

  const victims = [
    {
      id: 1,
      name: "আবুল কাশেম",
      role: "প্রতিষ্ঠাতা, ভুতুড়ে টেক",
      wail: "আমি জানতাম না যে গুগল করে এত সুন্দর ওয়েবসাইট বানানো সম্ভব! উনি আসলেই একজন জাদুকর।",
      avatar: "https://i.pravatar.cc/150?img=11"
    },
    {
      id: 2,
      name: "জেরিন তাসনিম",
      role: "আর্ট ডিরেক্টর, জোড়াতালি লিমিটেড",
      wail: "উনি যখন বললেন বাগগুলো আসলে ফিচার, আমি বিশ্বাস করে নিয়েছিলাম। ওনার কনভেন্সিং পাওয়ার অসাধারণ!",
      avatar: "https://i.pravatar.cc/150?img=47"
    },
    {
      id: 3,
      name: "ডেভিড বেকহ্যাম (নকল)",
      role: "প্রডিউসার, কফি অ্যান্ড কোড",
      wail: "মার্কেটিং ম্যানেজার হিসেবে উনি সেরা, কারণ উনি আমাকে বুঝিয়েছেন যে আমার প্রজেক্টের লস আসলে এক ধরণের ইনভেস্টমেন্ট!",
      avatar: "https://i.pravatar.cc/150?img=53"
    },
    {
      id: 4,
      name: "মিস্টার আবজাব",
      role: "সিইও, ঢিলেঢালা আইটি",
      wail: "আমি যখন বললাম সাইটটা স্লো, উনি আমাকে বোঝালেন যে এটা আসলে 'ইউজারদের ধৈর্য পরীক্ষা' করার জন্য একটা বিশেষ ফিচার!",
      avatar: "https://i.pravatar.cc/150?img=14"
    },
    {
      id: 5,
      name: "রাইহান চৌধুরী",
      role: "ফাউন্ডার, লাস্ট মিনিট টেক",
      wail: "উনি এক মাসের কাজ এক রাতে শেষ করে দিয়েছেন। বাকি ২৯ দিন উনি নাকি ইউটিউবে 'মোটিভেশনাল ভিডিও' দেখে রিসার্চ করছিলেন!",
      avatar: "https://i.pravatar.cc/150?img=60"
    },
    {
      id: 6,
      name: "শায়লা শারমিন",
      role: "ওনার, নাথিং ইজ পারফেক্ট",
      wail: "প্রজেক্টের মাঝপথে যখন সব এরর আসছিল, উনি শান্ত গলায় বললেন—'চিন্তা করবেন না, গুগল এখনো ডাউন হয়নি!' ওনার কনফিডেন্সই আলাদা।",
      avatar: "https://i.pravatar.cc/150?img=43"
    },
    {
      id: 7,
      name: "জব্বার আলী",
      role: "হেড অফ কপি-পেস্ট",
      wail: "উনার ব্রাউজারে ৫০০টা স্ট্যাক ওভারফ্লো ট্যাব খোলা দেখে আমি বুঝে গিয়েছিলাম—আমার প্রজেক্ট এখন সঠিক এবং দক্ষ হাতে আছে!",
      avatar: "https://i.pravatar.cc/150?img=33"
    },
    {
      id: 8,
      name: "মিস্টার বিন (নকল)",
      role: "চিফ কফি অফিসার",
      wail: "উনার কোড কেন কাজ করে সেটা উনি নিজেও জানেন না, কিন্তু কাজ যে করে এটাই বড় মিরাকল। প্রফেশনাল জাদুকর বললেও ভুল হবে না!",
      avatar: "https://i.pravatar.cc/150?img=68"
    },
    {
      id: 9,
      name: "মোশতাক আহমেদ",
      role: "ডিরেক্টর, কনফিউজড লিমিটেড",
      wail: "মার্কেটিং ম্যানেজার হিসেবে উনি সেরা, কারণ উনি আমাকে বিশ্বাস করাতে পেরেছেন যে আমার ওয়েবসাইটের 'সাদা খালি পেজ' আসলে একটা 'মিনিমালিস্টিক ডিজাইন'!",
      avatar: "https://i.pravatar.cc/150?img=59"
    },
    {
      id: 10,
      name: "হুদাই মিয়া",
      role: "প্রোপ্রাইটর, ফাঁকা আওয়াজ ডট কম",
      wail: "আমি চেয়েছিলাম একটা সিম্পল ল্যান্ডিং পেজ, উনি আমাকে একটা ৪০৪ এরর পেজ ধরিয়ে দিয়ে বললেন—'রহস্যই মানুষের আকর্ষণ বাড়ায়!'",
      avatar: "https://i.pravatar.cc/150?img=12"
    },
    {
      id: 11,
      name: "হারুনুর রশীদ",
      role: "ডিরেক্টর, ক্যাফেইন সল্যুশনস",
      wail: "উনার একটাই শর্ত ছিল—যতক্ষণ কফি আছে, ততক্ষণ সার্ভিস আছে। কফি শেষ হওয়ার পর উনি কারোরই চিনে না!",
      avatar: "https://i.pravatar.cc/150?img=51"
    }
  ];

  const skills = [
    { name: "গুগল করার স্কিল", percent: 100 },
    { name: "স্ট্যাক ওভারফ্লো থেকে কপি করা", percent: 95 },
    { name: "ডেডলাইনের আগে প্যানিক করা", percent: 99 },
    { name: "নিজের কোড নিজে বুঝতে পারা", percent: 2 }
  ];

  return (
    <div className="min-h-screen bg-surface-dim text-on-surface font-sans selection:bg-primary selection:text-black overflow-x-hidden relative z-[1]">
      <Dragon opacity={dragonOpacity} size={dragonSize} />
      {/* Navbar & Marquee */}
      <nav className="fixed top-0 w-full glass-panel z-50 border-b border-outline-variant/10">
        {/* Marquee Ticker */}
        <div className="w-full bg-[#ff7a00]/10 border-b border-[#ff7a00]/20 py-2.5 flex items-center overflow-hidden">
          <div className="animate-marquee whitespace-nowrap text-[#ffb800] text-[15px] font-bold tracking-wide flex items-center">
            <span className="inline-block px-16">⚠️ বিশেষ সতর্কীকরণ: এই ওয়েবসাইটের ওনার যখন তখন কফি পানের বিরতিতে যেতে পারেন, রিপ্লাই পেতে দেরি হলে দয়া করে গুগল করুন! ⚠️</span>
            <span className="inline-block px-16">⚠️ বিশেষ সতর্কীকরণ: এই ওয়েবসাইটের ওনার যখন তখন কফি পানের বিরতিতে যেতে পারেন, রিপ্লাই পেতে দেরি হলে দয়া করে গুগল করুন! ⚠️</span>
            <span className="inline-block px-16">⚠️ বিশেষ সতর্কীকরণ: এই ওয়েবসাইটের ওনার যখন তখন কফি পানের বিরতিতে যেতে পারেন, রিপ্লাই পেতে দেরি হলে দয়া করে গুগল করুন! ⚠️</span>
            <span className="inline-block px-16">⚠️ বিশেষ সতর্কীকরণ: এই ওয়েবসাইটের ওনার যখন তখন কফি পানের বিরতিতে যেতে পারেন, রিপ্লাই পেতে দেরি হলে দয়া করে গুগল করুন! ⚠️</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-[24px] font-bold sunset-text tracking-wider cursor-pointer py-1 leading-normal" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>জোড়াতালি ইঞ্জিনিয়ারিং</div>

          <div className="hidden md:flex items-center gap-8 text-[15px] font-medium tracking-wide">
            <a href="#projects" className="sunset-text pb-[6px] border-b-[2.5px] border-[#ff7a00]">কীর্তিকলাপ</a>
            <a href="#process" className="text-on-surface-variant hover:text-white transition-colors">গুগল করার পদ্ধতি</a>
            <a href="#victims" className="text-on-surface-variant hover:text-white transition-colors">ভিক্টিমদের তালিকা</a>
            <a href="#contact" className="text-on-surface-variant hover:text-white transition-colors">নক দিন</a>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-on-surface-variant hover:text-white transition-colors cursor-pointer"
            >
              লগইন / সাইন-আপ
            </button>

            {/* Dragon Settings Button */}
            <div className="relative">
              <button
                id="dragon-settings-btn"
                onClick={() => setShowDragonSettings(!showDragonSettings)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold tracking-widest ${showDragonSettings
                    ? 'border-primary/60 text-primary bg-primary/10'
                    : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-primary'
                  }`}
                title="Dragon Controls"
              >
                🐉 <span>⚙</span>
              </button>

              {showDragonSettings && (
                <div className="absolute top-10 right-0 glass-panel rounded-2xl p-5 w-60 border border-primary/20 shadow-[0_8px_32px_rgba(220,143,255,0.15)] z-[100]">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🐉</span>
                    <span className="text-sm font-bold text-primary tracking-widest uppercase">Dragon Controls</span>
                  </div>

                  {/* Opacity Slider */}
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-on-surface-variant font-medium">Opacity</span>
                      <span className="text-xs font-bold text-primary font-mono">{Math.round(dragonOpacity * 100)}%</span>
                    </div>
                    <input
                      id="dragon-opacity-slider"
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(dragonOpacity * 100)}
                      onChange={(e) => setDragonOpacity(Number(e.target.value) / 100)}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#dc8fff]"
                    />
                    <div className="flex justify-between text-[10px] text-outline-variant mt-1">
                      <span>0%</span><span>100%</span>
                    </div>
                  </div>

                  {/* Size Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-on-surface-variant font-medium">Size</span>
                      <span className="text-xs font-bold text-primary font-mono">{Math.round(dragonSize * 100)}%</span>
                    </div>
                    <input
                      id="dragon-size-slider"
                      type="range"
                      min="30"
                      max="200"
                      value={Math.round(dragonSize * 100)}
                      onChange={(e) => setDragonSize(Number(e.target.value) / 100)}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#dc8fff]"
                    />
                    <div className="flex justify-between text-[10px] text-outline-variant mt-1">
                      <span>30%</span><span>200%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a href="#contact" className="hidden md:block px-7 py-3 rounded-full sunset-gradient text-black font-bold hover:scale-105 transition shadow-[0_0_15px_rgba(220,143,255,0.2)] text-center">
              সাহস থাকলে ডাকুন
            </a>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-primary transition-all cursor-pointer z-50"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                // Close Icon (X)
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger Menu Icon
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden glass-panel border-t border-outline-variant/10 px-6 py-6 space-y-4 flex flex-col animate-slide-down">
            <a
              href="#projects"
              onClick={() => setIsMobileMenuOpen(false)}
              className="sunset-text text-[16px] font-bold pb-1 w-fit border-b border-[#ff7a00]"
            >
              কীর্তিকলাপ
            </a>
            <a
              href="#process"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-on-surface-variant hover:text-white transition-colors text-[16px] font-medium"
            >
              গুগল করার পদ্ধতি
            </a>
            <a
              href="#victims"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-on-surface-variant hover:text-white transition-colors text-[16px] font-medium"
            >
              ভিক্টিমদের তালিকা
            </a>
            <a
              href="#contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-on-surface-variant hover:text-white transition-colors text-[16px] font-medium"
            >
              নক দিন
            </a>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAuthModalOpen(true);
              }}
              className="text-left text-on-surface-variant hover:text-white transition-colors text-[16px] font-medium cursor-pointer"
            >
              লগইন / সাইন-আপ
            </button>
            <a
              href="#contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3 rounded-full sunset-gradient text-black font-bold text-center block"
            >
              সাহস থাকলে ডাকুন
            </a>

            {/* Mobile Dragon Controls */}
            <div className="border-t border-outline-variant/10 pt-4 mt-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🐉</span>
                <span className="text-xs font-bold text-primary tracking-widest uppercase">Dragon Controls</span>
              </div>
              <div className="space-y-4">
                {/* Opacity Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] text-on-surface-variant font-medium">Opacity</span>
                    <span className="text-[11px] font-bold text-primary font-mono">{Math.round(dragonOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(dragonOpacity * 100)}
                    onChange={(e) => setDragonOpacity(Number(e.target.value) / 100)}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer accent-[#dc8fff] bg-outline-variant/20"
                  />
                </div>

                {/* Size Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] text-on-surface-variant font-medium">Size</span>
                    <span className="text-[11px] font-bold text-primary font-mono">{Math.round(dragonSize * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="200"
                    value={Math.round(dragonSize * 100)}
                    onChange={(e) => setDragonSize(Number(e.target.value) / 100)}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer accent-[#dc8fff] bg-outline-variant/20"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header id="home" className="pt-48 pb-20 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-4 reveal reveal-left">
          <div className="inline-block px-5 py-2 rounded-full border border-primary/20 text-[#ff7a00] text-sm font-bold bg-[#1a0f2e] mb-4">
            কফি শেষ না হওয়া পর্যন্ত এভেইলেবল
          </div>
          <h1 className="text-[60px] lg:text-[85px] font-black leading-[0.95] tracking-tighter text-white text-glow pb-2" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            ৯৯% গুগল সার্চ <br />
            আর <span className="sunset-text inline-block filter drop-shadow-[0_0_20px_rgba(255,111,121,0.6)]">১% কপাল</span> —<br />
            এই দিয়েই আমার<br />
            সব প্রজেক্ট চলে।
          </h1>
          <p className="text-xl text-on-surface-variant max-w-md leading-relaxed pt-2">
            আমি ওয়েবসাইট বানাই না, বরং গুগল থেকে অন্যের বানানো কোড কপি করে জোড়াতালি দেই। আর দিনের বেলা মার্কেটিং ম্যানেজার সেজে ঘুরি।
          </p>

          <div className="inline-flex items-center gap-4 bg-[#1a0f2e] border border-primary/20 px-6 py-4 rounded-xl mt-4 w-fit shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-primary/50 transition-colors">
            <div className="text-3xl">💻</div>
            <div>
              <div className="text-[11px] text-[#ff7a00] uppercase tracking-widest font-bold mb-1">আজকের কপি-পেস্ট লাইনের সংখ্যা</div>
              <div className="text-3xl font-black text-white font-mono leading-none">{copyCount.toLocaleString()}</div>
            </div>
          </div>

          <div className="pt-8 flex flex-wrap items-center gap-8">
            <a href="#projects" className="sunset-gradient text-black font-bold px-8 py-3.5 rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(220,143,255,0.4)] block text-center cursor-pointer">
              কীর্তিকলাপ দেখুন
            </a>
            <a href="#process" className="text-white hover:text-primary transition-colors font-bold flex items-center gap-2 group text-lg cursor-pointer">
              কপি-পেস্ট পদ্ধতি <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
        </div>
        <div className="relative animate-float mt-10 md:mt-0 flex justify-end reveal reveal-right">
          <img src="./hero-image.png" alt="Hero representation" className="w-full max-w-[600px] aspect-square object-cover rounded-[2.5rem] shadow-[0_0_50px_rgba(220,143,255,0.15)] border border-primary/20" />
        </div>
      </header>

      {/* Process Section */}
      <section id="process" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16 reveal reveal-down">
          <div className="text-[#ff7a00] font-bold text-sm tracking-widest mb-3 uppercase">শীর্ষ গোপনীয় তথ্য</div>
          <h2 className="text-[40px] md:text-[56px] font-black text-white text-glow leading-tight" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            আমার <span className="sunset-text">গুগল করার</span> পদ্ধতি
          </h2>
          <p className="text-on-surface-variant mt-4 max-w-2xl mx-auto text-lg">সফলতার পেছনে কঠিন পরিশ্রম থাকে না, থাকে সঠিক কি-ওয়ার্ড দিয়ে গুগল সার্চ করার অসাধারণ প্রতিভা!</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[#1c1624] border border-[#2d243a] p-8 rounded-[1.5rem] relative overflow-hidden group hover:-translate-y-2 transition-transform shadow-[0_4px_20px_rgba(0,0,0,0.2)] reveal reveal-left">
            <div className="text-5xl mb-6">🔍</div>
            <h3 className="text-xl font-bold mb-3 text-white">স্টেপ ১: স্ট্যাক ওভারফ্লো</h3>
            <p className="text-[#afa8bc] leading-relaxed text-sm">ক্লায়েন্ট কী চায় সেটা বোঝার আগে আমি সার্চ করে দেখি অন্য কোনো গরিব ডেভেলপার সেম জিনিস বানাতে গিয়ে আটকে গেছে কি না।</p>
          </div>
          <div className="bg-[#1c1624] border border-[#2d243a] p-8 rounded-[1.5rem] relative overflow-hidden group hover:-translate-y-2 transition-transform shadow-[0_4px_20px_rgba(0,0,0,0.2)] reveal reveal-up">
            <div className="text-5xl mb-6">✂️</div>
            <h3 className="text-xl font-bold mb-3 text-white">স্টেপ ২: Ctrl+C & Ctrl+V</h3>
            <p className="text-[#afa8bc] leading-relaxed text-sm">সবুজ টিকমার্ক দেওয়া যে সল্যুশনটা পাওয়া যায়, সেটা না বুঝেই সোজা প্রজেক্টে পেস্ট করে রান করি। এরর দিলে আবার প্রথম ধাপে ফিরে যাই।</p>
          </div>
          <div className="bg-[#1c1624] border border-[#2d243a] p-8 rounded-[1.5rem] relative overflow-hidden group hover:-translate-y-2 transition-transform shadow-[0_4px_20px_rgba(0,0,0,0.2)] reveal reveal-right">
            <div className="text-5xl mb-6">😎</div>
            <h3 className="text-xl font-bold mb-3 text-white">স্টেপ ৩: কনফিডেন্স</h3>
            <p className="text-[#afa8bc] leading-relaxed text-sm">কোড কোনোভাবে কাজ করা শুরু করলে ক্লায়েন্টের কাছে ডেলিভারি দিয়ে বলি— "ভাই, এটা বানাতে আমার নির্ঘুম কয়েকটা রাত কেটেছে!"</p>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16 reveal reveal-up">
          <h2 className="text-[40px] font-black text-white leading-tight" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            সততায় ভরপুর <span className="sunset-text">স্কিলসমূহ</span>
          </h2>
          <p className="text-on-surface-variant mt-4 text-lg">সার্টিফিকেট দিয়ে কী হবে যদি কনফিডেন্সই না থাকে?</p>
        </div>
        <div className="space-y-8 glass-panel p-10 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.3)] reveal reveal-scale">
          {skills.map((skill, index) => (
            <div key={index} className="group">
              <div className="flex justify-between items-end mb-3">
                <span className="font-bold text-lg text-[#dcd6e5]">{skill.name}</span>
                <span className="sunset-text font-mono font-black text-xl">{skill.percent}%</span>
              </div>
              <div className="w-full bg-[#1c1624] h-4 rounded-full overflow-hidden border border-[#2d243a] p-0.5">
                <div
                  className="h-full sunset-gradient rounded-full relative group-hover:opacity-90 transition-opacity"
                  style={{ width: `${skill.percent}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/30 blur-[5px]"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-6 bg-surface-container-low border-y border-outline-variant/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-black mb-12 text-center reveal reveal-down">আমার যত <span className="sunset-text">কীর্তিকলাপ</span></h2>

          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <div key={project.id} className={`glass-panel rounded-2xl overflow-hidden group hover:border-primary/40 transition reveal ${index % 2 === 0 ? 'reveal-left' : 'reveal-right'}`}>
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={project.image} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-8">
                  <div className="text-xs text-primary font-bold tracking-widest uppercase mb-2">{project.tag}</div>
                  <h3 className="text-2xl font-bold mb-3">{project.name}</h3>
                  <p className="text-on-surface-variant">{project.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Victims Section */}
      <section id="victims" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16 reveal reveal-up">
          <div className="text-[#ff7a00] font-bold text-sm tracking-widest mb-3 uppercase">ভিক্টিমদের তালিকা</div>
          <h2 className="text-[40px] md:text-[56px] font-black text-white text-glow leading-tight" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            ভিক্টিমদের আর্তনাদ
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {victims.slice(0, showAllVictims ? victims.length : 3).map((victim) => (
            <div key={victim.id} className="bg-[#1c1624] border border-[#2d243a] p-8 rounded-[1rem] flex flex-col justify-between hover:-translate-y-2 transition-transform duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.2)] reveal reveal-scale">
              <div>
                <div className="flex gap-[2px] text-[#ffb800] mb-6">
                  {/* 5 Stars SVG */}
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-[16px] h-[16px] fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-[#dcd6e5] text-[15px] leading-[1.8] font-medium mb-12">
                  "{victim.wail}"
                </p>
              </div>
              <div className="flex items-center gap-4">
                <img src={victim.avatar} alt={victim.name} className="w-10 h-10 rounded-full object-cover border border-primary/20 shadow-[0_0_10px_rgba(220,143,255,0.1)]" />
                <div>
                  <div className="font-bold text-white text-[15px]">{victim.name}</div>
                  <div className="text-[#afa8bc] text-[12px] mt-0.5">{victim.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {victims.length > 3 && (
          <div className="text-center mt-12">
            <button
              onClick={() => setShowAllVictims(!showAllVictims)}
              className="px-8 py-3 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors font-bold text-sm"
            >
              {showAllVictims ? 'কম ভিক্টিম দেখুন' : 'আরও ভিক্টিম দেখুন'}
            </button>
          </div>
        )}
      </section>

      <ParticleText />

      <Butterflies />

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 bg-surface-container relative overflow-hidden border-t border-outline-variant/10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="max-w-xl mx-auto text-center z-10 relative reveal reveal-up">
          <h2 className="text-4xl md:text-5xl font-black mb-6">চলুন একসাথে কিছু একটা <span className="sunset-text">জোড়াতালি দেই</span></h2>
          <p className="text-on-surface-variant mb-10">কি করতে হবে? (গুগল করে সমাধানযোগ্য হলে ভালো)</p>

          <form className="space-y-4 text-left" onSubmit={(e) => e.preventDefault()}>
            <div>
              <input type="text" placeholder="Your Name (Victim ID)" className="w-full glass-panel px-6 py-4 rounded-xl focus:border-primary outline-none transition" />
            </div>
            <div>
              <textarea rows="4" placeholder="আপনার আইডিয়া বলুন, আমি গুগল করে দেখছি..." className="w-full glass-panel px-6 py-4 rounded-xl focus:border-primary outline-none transition"></textarea>
            </div>

            <div className="flex items-start gap-4 mt-6 mb-4 bg-[#1a0f2e]/50 p-4 rounded-xl border border-primary/20">
              <input
                type="checkbox"
                id="bug-agreement"
                checked={agreedToBugs}
                onChange={(e) => setAgreedToBugs(e.target.checked)}
                className="mt-1 w-5 h-5 accent-[#ff7a00] cursor-pointer shrink-0"
              />
              <label htmlFor="bug-agreement" className="text-sm text-[#afa8bc] cursor-pointer leading-relaxed">
                আমি একমত যে, ওয়েবসাইটে ফিউচারে কোনো বাগ (Bug) পাওয়া গেলে সেটাকে আমি 'ফিচার' (Feature) হিসেবে মেনে নেবো।
              </label>
            </div>

            <button
              disabled={!agreedToBugs}
              className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg ${!agreedToBugs ? 'bg-surface-variant text-on-surface-variant/50 cursor-not-allowed border border-outline-variant/30' : 'sunset-gradient text-black hover:opacity-90 hover:scale-[1.02]'}`}
            >
              মিশন শুরু করুন
            </button>
          </form>
          <div className="mt-8 text-sm text-on-surface-variant">
            Contact: <span className="font-bold text-[#ff7a00] text-base" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>নাই</span>
          </div>
        </div>
      </section>

      <div className="py-16 flex justify-center">
        <button
          onClick={() => {
            setIsShaking(true);
            setTimeout(() => {
              setIsShaking(false);
              alert("আপনার ডিভাইসটি জোড়াতালি সার্ভারের সাথে কানেক্ট হচ্ছে... সব ডেটা ডিলিট হয়ে যেতে পারে! 🔴 😆");
            }, 500);
          }}
          className={`bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white px-8 py-4 rounded-full font-black text-lg tracking-widest transition-colors shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] ${isShaking ? 'animate-shake' : ''}`}
        >
          ভুল করেও এখানে ক্লিক করবেন না!
        </button>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <Flower />

      <footer className="text-center py-10 px-6 border-t border-outline-variant/10 bg-surface-dim">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <div className="flex gap-6 text-sm font-bold tracking-wider text-on-surface-variant">
            <a href="https://www.facebook.com/n4han13" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">FACEBOOK</a>
            <a href="https://www.instagram.com/n4han13" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">INSTAGRAM</a>
          </div>
          <div className="text-sm text-on-surface-variant/60">
            © ওহ, কপিরাইট নাই, কারণ আমি নিজেও সব গুগল থেকে কপি করেছি।
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
