import { useState, useEffect, useRef } from 'react';
import Dragon from './Dragon';
import Flower from './Flower';
import Butterflies from './Butterflies';
import ParticleText from './ParticleText';
import AuthModal from './AuthModal';
import DotNavigation from './DotNavigation';
import SpiderClock from './SpiderClock';

function App() {
  const [showAllVictims, setShowAllVictims] = useState(false);
  const [copyCount, setCopyCount] = useState(45679);
  const [isShaking, setIsShaking] = useState(false);
  const [agreedToBugs, setAgreedToBugs] = useState(false);
  const [dragonOpacity, setDragonOpacity] = useState(0.6);
  const [dragonSize, setDragonSize] = useState(0.75);
  const [showDragonSettings, setShowDragonSettings] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSpiderClock, setShowSpiderClock] = useState(true);
  const [timeString, setTimeString] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Interactive Coffee & Bug Generator Modal States
  const [isCoffeeModalOpen, setIsCoffeeModalOpen] = useState(false);
  const [coffeeCups, setCoffeeCups] = useState(14);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [currentBugIndex, setCurrentBugIndex] = useState(0);

  const bugDatabase = [
    {
      id: "BUG-404-COFFEE",
      title: "কোডে কোনো সেমিকোলন নেই, কিন্তু অদ্ভুতভাবে কোড চলছে!",
      desc: "সারা রাত ডিবাগ করে দেখা গেল স্ট্যাকওভারফ্লো থেকে কপি করা কোড নিজেই নিজেকে এক্সিকিউট করছে।",
      severity: "CRITICAL (DO NOT TOUCH)",
      fix: "Fix: চোখ বন্ধ করে গিট পুশ দিন।"
    },
    {
      id: "BUG-200-FEATURE",
      title: "বাটন ক্লিক করলে ব্যাকগ্রাউন্ডের ড্রাগন নাচানাচি শুরু করে!",
      desc: "ইউজারকে বলা হয়েছে এটা একটা হিডেন ইস্টার-এগ এবং পেইড ভিআইপি ফিচার।",
      severity: "MARKETING CHOICE",
      fix: "Fix: ক্লায়েন্টের কাছ থেকে এক্সট্রা $৫০ চার্জ করুন।"
    },
    {
      id: "BUG-500-RUNTIME",
      title: "বাগ ফিক্স করতে গিয়ে নতুন ৫টা বাগ জন্ম নিয়েছে!",
      desc: "লাইন ৪২ এর একটা ভ্যারিয়েবলের নাম বদলানোয় পুরো ডাটাবেজ ফ্রেন্ড রিকোয়েস্ট পাঠানো শুরু করেছে।",
      severity: "MULTITASKING ARCHITECTURE",
      fix: "Fix: পিসি রিস্টার্ট দিন অথবা কফি পান করুন।"
    },
    {
      id: "BUG-999-CSS",
      title: "Div টি স্ক্রিনের মাঝখানে আনতে গিয়ে ৩টা মনিটর ভেঙে গেছে!",
      desc: "মার্জিন অটো দিয়েও কাজ হয়নি, অবশেষে ফ্লেক্সবক্স ও গ্রিডের সংঘর্ষে ব্রাউজার ফ্রিজ হয়েছে।",
      severity: "CSS OLYMPICS",
      fix: "Fix: স্ক্রিন বাঁকা করে তাকান।"
    },
    {
      id: "BUG-007-GHOST",
      title: "আমার পিসিতে চলে, কিন্তু ক্লায়েন্টের পিসিতে ক্র্যাশ করে!",
      desc: "ক্লায়েন্টকে বলা হলো ওনার পিসির উইন্ডোজ ৯৮ আপডেট দিতে হবে।",
      severity: "WORKS ON MY MACHINE",
      fix: "Fix: ক্লায়েন্টকে আমার ল্যাপটপটি কুরিয়ার করে পাঠিয়ে দিন।"
    }
  ];

  // Interactive Window Controls State (hero, skills, process, contact)
  const [windows, setWindows] = useState({
    hero: { min: false, max: false, closed: false, title: 'C:\\JORATALI\\HERO.EXE' },
    skills: { min: false, max: false, closed: false, title: 'SETUP_WIZARD.EXE' },
    process: { min: false, max: false, closed: false, title: 'METHOD_WIZARD.EXE' },
    contact: { min: false, max: false, closed: false, title: 'SUBMIT_TICKET.EXE' }
  });

  // Victim Interactive Reactions State
  const [ignoredVictims, setIgnoredVictims] = useState([]);
  const [pacifiedVictims, setPacifiedVictims] = useState([]);

  // Project Cards Interactive State
  const [minimizedProjects, setMinimizedProjects] = useState([]);
  const [maximizedProject, setMaximizedProject] = useState(null);
  const [closedProjects, setClosedProjects] = useState([]);
  const [runningProject, setRunningProject] = useState(null);
  const [activeLiveProject, setActiveLiveProject] = useState(null);
  const [isLiveProjectMaximized, setIsLiveProjectMaximized] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Draggable Win98 Live Project Window State
  const [liveWinPos, setLiveWinPos] = useState({ x: 0, y: 0 });
  const [isDraggingLiveWin, setIsDraggingLiveWin] = useState(false);
  const liveWinDragRef = useRef({ startX: 0, startY: 0, initialPosX: 0, initialPosY: 0 });

  const handleTitleBarMouseDown = (e) => {
    if (e.button !== 0 || isLiveProjectMaximized) return;
    setIsDraggingLiveWin(true);
    liveWinDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: liveWinPos.x,
      initialPosY: liveWinPos.y
    };
  };

  const handleTitleBarTouchStart = (e) => {
    if (isLiveProjectMaximized || !e.touches[0]) return;
    setIsDraggingLiveWin(true);
    liveWinDragRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      initialPosX: liveWinPos.x,
      initialPosY: liveWinPos.y
    };
  };

  useEffect(() => {
    if (!isDraggingLiveWin) return;

    const handleMouseMove = (e) => {
      const dx = e.clientX - liveWinDragRef.current.startX;
      const dy = e.clientY - liveWinDragRef.current.startY;
      setLiveWinPos({
        x: liveWinDragRef.current.initialPosX + dx,
        y: liveWinDragRef.current.initialPosY + dy
      });
    };

    const handleTouchMove = (e) => {
      if (!e.touches[0]) return;
      const dx = e.touches[0].clientX - liveWinDragRef.current.startX;
      const dy = e.touches[0].clientY - liveWinDragRef.current.startY;
      setLiveWinPos({
        x: liveWinDragRef.current.initialPosX + dx,
        y: liveWinDragRef.current.initialPosY + dy
      });
    };

    const handleMouseUp = () => {
      setIsDraggingLiveWin(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingLiveWin]);

  // Lock background scroll when live window is open
  useEffect(() => {
    if (activeLiveProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeLiveProject]);

  // Project Window Control Handler
  const handleProjectControl = (projId, projName, action) => {
    if (action === 'min') {
      const isMin = minimizedProjects.includes(projId);
      setMinimizedProjects(prev => 
        isMin ? prev.filter(id => id !== projId) : [...prev, projId]
      );
      showToast(isMin ? `📂 "${projName}" এক্সপ্যান্ড করা হয়েছে!` : `📁 "${projName}" মিনিমাইজ করা হয়েছে!`);
    } else if (action === 'max') {
      const proj = projects.find(p => p.id === projId);
      setActiveLiveProject(proj);
      setLiveWinPos({ x: 0, y: 0 });
      setIsLiveProjectMaximized(false);
      showToast(`🚀 "${projName}" লাইভ উইন্ডোতে চালু হচ্ছে!`);
    } else if (action === 'close') {
      setClosedProjects(prev => [...prev, projId]);
      showToast(`✕ "${projName}" বন্ধ করা হয়েছে!`);
    }
  };

  // Restore All Closed Projects
  const handleRestoreProjects = () => {
    setClosedProjects([]);
    setMinimizedProjects([]);
    showToast(`🔄 সকল প্রজেক্ট উইন্ডো আবার রিস্টোর করা হয়েছে!`);
  };

  // Section Scroll Handler with Auto-Restore
  const handleScrollToSection = (targetId, msg) => {
    if (windows[targetId] && windows[targetId].closed) {
      setWindows(prev => ({
        ...prev,
        [targetId]: { ...prev[targetId], closed: false, min: false }
      }));
    }
    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        if (msg) showToast(msg);
      }
    }, 100);
  };

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // Window Controls Handler
  const handleWinControl = (winKey, action) => {
    setWindows(prev => {
      const curr = prev[winKey];
      if (action === 'min') {
        const nextMin = !curr.min;
        showToast(nextMin ? `📁 ${curr.title} মিনিমাইজ করা হয়েছে!` : `📂 ${curr.title} এক্সপ্যান্ড করা হয়েছে!`);
        return { ...prev, [winKey]: { ...curr, min: nextMin } };
      }
      if (action === 'max') {
        const nextMax = !curr.max;
        showToast(nextMax ? `🗖 ${curr.title} ফুল-স্ক্রিন করা হয়েছে!` : `🗗 ${curr.title} নরমাল সাইজে আনা হয়েছে!`);
        return { ...prev, [winKey]: { ...curr, max: nextMax } };
      }
      if (action === 'close') {
        showToast(`✕ ${curr.title} বন্ধ করা হয়েছে! নিচে 'রিস্টোর ডক' থেকে আবার খুলতে পারবেন।`);
        return { ...prev, [winKey]: { ...curr, closed: true } };
      }
      if (action === 'restore') {
        showToast(`🔄 ${curr.title} সফলভাবে স্ক্রিনে ফেরত আনা হয়েছে!`);
        setTimeout(() => {
          document.getElementById(winKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return { ...prev, [winKey]: { ...curr, closed: false, min: false } };
      }
      return prev;
    });
  };

  // Victim OK Handler
  const handleVictimOk = (id, name) => {
    if (!pacifiedVictims.includes(id)) {
      setPacifiedVictims(prev => [...prev, id]);
      showToast(`☕ ভিক্টিম "${name}" কে এক কাপ কফি পাঠিয়ে শান্ত করা হয়েছে!`);
    } else {
      showToast(`✅ "${name}" অলরেডি শান্ত আছেন।`);
    }
  };

  // Victim Ignore Handler
  const handleVictimIgnore = (id, name) => {
    setIgnoredVictims(prev => [...prev, id]);
    showToast(`🗑️ ভিক্টিম "${name}" এর আর্তনাদ সফলভাবে রিসাইকেল বিনে ফেলা হয়েছে!`);
  };

  // Restore All Victims
  const handleRestoreVictims = () => {
    setIgnoredVictims([]);
    setPacifiedVictims([]);
    setShowAllVictims(true);
    showToast(`🔄 সকল ভিক্টিমের আর্তনাদ আবার স্ক্রিনে ফেরত আনা হয়েছে!`);
    setTimeout(() => {
      document.getElementById('victims')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Live Clock for Win98 Tray
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fake Counter Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCopyCount(prev => prev + Math.floor(Math.random() * 5) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll Reveal Observer
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1 }
    );
    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const projects = [
    {
      id: 1,
      name: "HOCO W35 Air 3D Experience",
      codeName: "HOCO_W35_3D",
      tag: "Three.js • 3D Canvas",
      fileSize: "14.8 MB",
      icon: "🎧",
      folder: "hoco",
      url: "/projects/hoco/index.html",
      description: "HOCO W35 Air হেডফোনের জন্য তৈরি সম্পূর্ণ ইন্টারেক্টিভ 3D শোকেস ল্যান্ডিং পেজ। রিয়েল-টাইম 3D মডেল ভিউ ও স্মুথ ক্যামেরা কন্ট্রোল।",
      image: "./projects_thumb/hoco.jpg"
    },
    {
      id: 2,
      name: "Apple iPhone 3D Showcase",
      codeName: "IPHONE_3D_APP",
      tag: "Next.js • React Three Fiber",
      fileSize: "8.5 MB",
      icon: "📱",
      folder: "iphone",
      url: "/projects/iphone/index.html",
      description: "নেক্সট-জেন Apple iPhone এর 3D ইন্টারেক্টিভ ক্যানভাস অভিজ্ঞতা। স্মুথ স্ক্রোল ট্রানজিশন, 3D লাইটিং ও ডাইনামিক ক্যামেরা অ্যাঙ্গেল।",
      image: "./projects_thumb/iphone.jpg"
    },
    {
      id: 3,
      name: "NUR 3D Experience & Audio",
      codeName: "NUR_WEB_APP",
      tag: "Next.js • 3D Background • Audio",
      fileSize: "18.2 MB",
      icon: "✨",
      folder: "nur",
      url: "/projects/nur/index.html",
      description: "ইন্টারেক্টিভ 3D ক্যানভাস ব্যাকগ্রাউন্ড, ডিজিটাল অডিও প্লেয়ার, ডেট উইজেট ও স্মুথ ট্রানজিশন সহ পূর্ণাঙ্গ নেক্সট.জেএস ওয়েব অ্যাপ্লিকেশন।",
      image: "./projects_thumb/nur.jpg"
    },
    {
      id: 4,
      name: "KINETIC // Surreal 3D Portfolio",
      codeName: "KINETIC_SURREAL",
      tag: "WebGL • Canvas Physics • UI",
      fileSize: "6.4 MB",
      icon: "🔮",
      folder: "kinetic",
      url: "/projects/kinetic/index.html",
      description: "সাইবারপাঙ্ক ও সুররিয়েল ডার্ক থিমের ইন্টারেক্টিভ ইঞ্জিনিয়ার ড্যাশবোর্ড, ক্যানভাস গ্লো ইফেক্টস এবং পার্টিকল ইন্টারেকশন।",
      image: "./projects_thumb/kinetic.jpg"
    }
  ];

  const victims = [
    {
      id: 1,
      name: "আবুল কাশেম",
      role: "প্রতিষ্ঠাতা, ভুতুড়ে টেক",
      wail: "আমি জানতাম না যে গুগল করে এত সুন্দর ওয়েবসাইট বানানো সম্ভব! উনি আসলেই একজন জাদুকর।",
      avatar: "https://i.pravatar.cc/150?img=11",
      type: "FATAL_EXCEPTION"
    },
    {
      id: 2,
      name: "জেরিন তাসনিম",
      role: "আর্ট ডিরেক্টর, জোড়াতালি লিমিটেড",
      wail: "উনি যখন বললেন বাগগুলো আসলে ফিচার, আমি বিশ্বাস করে নিয়েছিলাম। ওনার কনভেন্সিং পাওয়ার অসাধারণ!",
      avatar: "https://i.pravatar.cc/150?img=47",
      type: "WARNING_ALERT"
    },
    {
      id: 3,
      name: "ডেভিড বেকহ্যাম (নকল)",
      role: "প্রডিউসার, কফি অ্যান্ড কোড",
      wail: "মার্কেটিং ম্যানেজার হিসেবে উনি সেরা, কারণ উনি আমাকে বুঝিয়েছেন যে আমার প্রজেক্টের লস আসলে এক ধরণের ইনভেস্টমেন্ট!",
      avatar: "https://i.pravatar.cc/150?img=33",
      type: "MEMORY_LEAK"
    },
    {
      id: 4,
      name: "কুদরত আলী",
      role: "সিনিয়র বাগমাস্টার",
      wail: "উনার কোড রিভিউ করতে গিয়ে আমার নিজের চশমার পাওয়ার ২ গুণ বেড়ে গেছে। কিন্তু অদ্ভুতভাবে সাইট লাইভ চলে!",
      avatar: "https://i.pravatar.cc/150?img=60",
      type: "NULL_POINTER"
    },
    {
      id: 5,
      name: "সায়মা চৌধুরী",
      role: "সিইও, ফিউচারলেস আইডিয়া",
      wail: "বলেছিলেন ৩ দিনে ডেলিভারি দেবেন, ৩ ঘণ্টা পর বললেন গুগলে সমাধান নেই! অবশেষে নিজেই ক্লায়েন্ট হয়ে গেলাম।",
      avatar: "https://i.pravatar.cc/150?img=38",
      type: "TIMEOUT_ERROR"
    },
    {
      id: 6,
      name: "রাকিবুল হাসান",
      role: "লিড কপি-পেস্টার",
      wail: "যে কাজ আমি ৩ মাসে করতে পারতাম না, উনি ২ মিনিটে স্ট্যাকওভারফ্লো থেকে মেরে দিয়ে করে ফেললেন। সালাম গুরু!",
      avatar: "https://i.pravatar.cc/150?img=68",
      type: "OVERFLOW_OK"
    },
    {
      id: 7,
      name: "তানভীর আহমেদ",
      role: "প্রোডাক্ট ওনার",
      wail: "এক বাটন ক্লিক করলে তিনটা স্ক্রিন ক্র্যাশ করে! জিজ্ঞেস করায় বললেন এটা মাল্টিটাস্কিং আর্কিটেকচার!",
      avatar: "https://i.pravatar.cc/150?img=15",
      type: "RUNTIME_CRASH"
    },
    {
      id: 8,
      name: "মেহজাবিন রিতু",
      role: "ইউএক্স ডিজাইনার",
      wail: "আমি চেয়েছিলাম মিনিমালিস্ট ডিজাইন, উনি বানিয়ে দিলেন ৯৮ সালের রোবট ডান্সিং পেজ! কিন্তু ক্লায়েন্ট খুব খুশি!",
      avatar: "https://i.pravatar.cc/150?img=26",
      type: "STYLE_CONFLICT"
    },
    {
      id: 9,
      name: "শাহরিয়ার নাফিস",
      role: "ডাটাবেজ আর্কিটেক্ট",
      wail: "উনার ডাটাবেজে কোনো ফরেন কি (Foreign Key) নেই, সব ফ্রেন্ড রিকোয়েস্ট দিয়ে কানেক্টেড!",
      avatar: "https://i.pravatar.cc/150?img=59",
      type: "DB_DISCONNECTED"
    },
    {
      id: 10,
      name: "ফারহানা ববি",
      role: "কোয়ালিটি অ্যাসুরেন্স",
      wail: "টেস্টিং করতে গিয়ে আমি নিজেই ডিপ্রেশনে চলে গিয়েছিলাম, কারণ কোনো বাগ ফিক্স ছাড়াই প্রোডাকশনে কাজ করে!",
      avatar: "https://i.pravatar.cc/150?img=12",
      type: "QA_BYPASS"
    },
    {
      id: 11,
      name: "হারুনুর রশীদ",
      role: "ডিরেক্টর, ক্যাফেইন সল্যুশনস",
      wail: "উনার একটাই শর্ত ছিল—যতক্ষণ কফি আছে, ততক্ষণ সার্ভিস আছে। কফি শেষ হওয়ার পর উনি কারোরই চিনে না!",
      avatar: "https://i.pravatar.cc/150?img=51",
      type: "COFFEE_EMPTY"
    }
  ];

  const skills = [
    { name: "গুগল করার সুপারপাওয়ার", percent: 100, status: "COMPLETED" },
    { name: "স্ট্যাক ওভারফ্লো থেকে কপি-পেস্ট", percent: 95, status: "SYNCED" },
    { name: "ডেডলাইনের ১০ মিনিট আগে প্যানিক", percent: 99, status: "CRITICAL" },
    { name: "নিজের কোড পরদিন নিজে বুঝতে পারা", percent: 2, status: "FAILED" }
  ];

  const activeVictims = victims.filter(v => !ignoredVictims.includes(v.id));

  return (
    <div className="min-h-screen text-[#1C1917] font-sans selection:bg-[#000080] selection:text-white overflow-x-hidden relative pb-16">
      <Dragon opacity={dragonOpacity} size={dragonSize} />
      
      {/* Toast Notification for Win98 Actions */}
      {toastMessage && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-[10000] win98-window p-3 px-5 shadow-2xl animate-win-marquee sm:animate-none flex items-center gap-3 bg-[#FFE680] border-2 border-black">
          <span className="text-base">🔔</span>
          <span className="font-mono text-xs font-bold text-black" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            {toastMessage}
          </span>
        </div>
      )}

      {/* Decorative Desk Coffee Stains */}
      <div className="coffee-stain top-28 right-12 hidden lg:block opacity-60"></div>
      <div className="coffee-stain top-[1400px] left-6 hidden lg:block opacity-40"></div>

      {/* TOP TICKER & WIN98 TASKBAR NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-[#C0C0C0] border-b-2 border-black shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
        
        {/* Marquee Ticker */}
        <div className="w-full bg-[#FFE680] border-b border-[#D4C46A] py-1.5 flex items-center overflow-hidden font-mono text-xs font-bold text-[#3B3000]">
          <div className="animate-win-marquee whitespace-nowrap flex items-center gap-12">
            <span>⚠️ বিশেষ সতর্কীকরণ: এই ওয়েবসাইটের ওনার যখন তখন কফি পানের বিরতিতে যেতে পারেন, রিপ্লাই পেতে দেরি হলে দয়া করে গুগল করুন! ⚠️</span>
            <span>💾 SYSTEM STATUS: 99.9% COPIED FROM STACKOVERFLOW • BUGS DETECTED: 404 • COFFEE: RUNNING OUT ☕</span>
            <span>⚠️ বিশেষ সতর্কীকরণ: এই ওয়েবসাইটের ওনার যখন তখন কফি পানের বিরতিতে যেতে পারেন, রিপ্লাই পেতে দেরি হলে দয়া করে গুগল করুন! ⚠️</span>
            <span>💾 SYSTEM STATUS: 99.9% COPIED FROM STACKOVERFLOW • BUGS DETECTED: 404 • COFFEE: RUNNING OUT ☕</span>
          </div>
        </div>

        {/* Taskbar Bar */}
        <div className="w-full px-4 py-2 flex justify-between md:justify-center items-center gap-3">
          
          {/* Start Button & Logo */}
          <div className="flex items-center gap-2">
            <a 
              href="#hero"
              className="win98-btn flex items-center gap-2 px-3 py-1.5 rounded-none font-black text-sm text-black tracking-wide cursor-pointer active:scale-95"
            >
              <span className="text-base">🪟</span>
              <span>স্টার্ট</span>
            </a>
            
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 win98-inset text-xs font-mono font-bold text-[#000080]">
              <span>📁</span>
              <span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>জোড়াতালি_ইঞ্জিনিয়ারিং.exe</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2 text-xs font-bold font-mono">
            <a href="#projects" className="win98-btn px-3 py-1.5 text-black hover:text-[#000080]">
              [ 📂 কীর্তিকলাপ ]
            </a>
            <a href="#process" className="win98-btn px-3 py-1.5 text-black hover:text-[#000080]">
              [ ⚙️ পদ্ধতি ]
            </a>
            <a href="#victims" className="win98-btn px-3 py-1.5 text-black hover:text-[#000080]">
              [ 🛑 ভিক্টিমগণ ]
            </a>
            <a href="#contact" className="win98-btn px-3 py-1.5 text-black hover:text-[#000080]">
              [ ✉️ নক দিন ]
            </a>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="win98-btn-primary px-3 py-1.5 text-xs text-white cursor-pointer"
            >
              লগইন / সাইন-আপ
            </button>
          </div>

          {/* Mobile Hamburger (Only on Mobile screens) */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="win98-btn px-2.5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              <span>{isMobileMenuOpen ? '✕' : '☰'}</span>
              <span>মেনু</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown (With Integrated Dragon Controls) */}
        {isMobileMenuOpen && (
          <div className="md:hidden win98-box border-t-2 border-black px-4 py-4 space-y-3 bg-[#C0C0C0] max-h-[85vh] overflow-y-auto">
            <a
              href="#projects"
              onClick={() => setIsMobileMenuOpen(false)}
              className="win98-btn block w-full py-2 text-center text-xs font-bold"
            >
              📂 কীর্তিকলাপ (Projects)
            </a>
            <a
              href="#process"
              onClick={() => setIsMobileMenuOpen(false)}
              className="win98-btn block w-full py-2 text-center text-xs font-bold"
            >
              ⚙️ গুগল করার পদ্ধতি (Method)
            </a>
            <a
              href="#victims"
              onClick={() => setIsMobileMenuOpen(false)}
              className="win98-btn block w-full py-2 text-center text-xs font-bold"
            >
              🛑 ভিক্টিমদের তালিকা (Victims)
            </a>
            <a
              href="#contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="win98-btn block w-full py-2 text-center text-xs font-bold"
            >
              ✉️ নক দিন (Contact)
            </a>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAuthModalOpen(true);
              }}
              className="win98-btn-primary block w-full py-2 text-center text-xs font-bold cursor-pointer"
            >
              🔑 লগইন / সাইন-আপ
            </button>

            {/* MOBILE SPIDER CLOCK TOGGLE */}
            <div className="win98-inset p-2.5 bg-[#FFFFFF] flex items-center justify-between text-xs font-mono border-2 border-black">
              <span className="flex items-center gap-1.5 font-bold text-black">
                🕷️ স্পাইডার ক্লক (Spider Clock)
              </span>
              <button
                onClick={() => {
                  setShowSpiderClock(prev => !prev);
                  showToast(!showSpiderClock ? '🕷️ স্পাইডার ক্লক চালু করা হয়েছে!' : '🕷️ স্পাইডার ক্লক বন্ধ করা হয়েছে!');
                }}
                className={`px-3 py-1 text-xs font-bold win98-btn cursor-pointer ${showSpiderClock ? 'bg-[#000080] text-white' : 'bg-[#C0C0C0] text-black'}`}
              >
                {showSpiderClock ? 'চালু (ON)' : 'বন্ধ (OFF)'}
              </button>
            </div>

            {/* MOBILE DRAGON CONTROLS WIDGET */}
            <div className="win98-inset p-3 bg-[#FFFFFF] space-y-3 border-2 border-black mt-2">
              <div className="flex items-center justify-between text-xs font-bold font-mono text-[#000080] border-b border-[#808080] pb-1.5">
                <span className="flex items-center gap-1.5">🐉 ড্রাগন সেটিংস (Dragon Controls)</span>
                <span className="bg-[#FFE5EC] px-1.5 py-0.5 text-[10px] text-[#D90429] border border-[#FFA5BA]">Live</span>
              </div>
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Opacity (স্বচ্ছতা):</span>
                    <span className="font-bold text-[#000080]">{Math.round(dragonOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(dragonOpacity * 100)}
                    onChange={(e) => setDragonOpacity(Number(e.target.value) / 100)}
                    className="w-full accent-[#000080]"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Size (সাইজ):</span>
                    <span className="font-bold text-[#000080]">{Math.round(dragonSize * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="200"
                    value={Math.round(dragonSize * 100)}
                    onChange={(e) => setDragonSize(Number(e.target.value) / 100)}
                    className="w-full accent-[#000080]"
                  />
                </div>
              </div>
            </div>

          </div>
        )}
      </nav>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-32 sm:pt-36 space-y-24">

        {/* HERO SECTION (WIN98 MAIN WINDOW ON DESK) */}
        {!windows.hero.closed && (
          <section id="hero" className={`relative reveal reveal-up transition-all duration-300 ${windows.hero.max ? 'max-w-none w-full' : ''}`}>
            
            {/* Notebook Sticky Note on Top Left of Window */}
            {!windows.hero.min && (
              <div className="hidden sm:block absolute -top-8 -left-6 z-20 doodle-sticky p-4 w-52 rounded-sm rotate-[-3deg]">
                <div className="text-[11px] font-mono font-bold text-[#8C5824] uppercase tracking-wider mb-1">📌 জরুরি নোট:</div>
                <p className="text-xs font-bold leading-tight text-[#3D3428]" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                  বাগ পেলে রিপোর্ট করবেন না, ওটা আসলে একটা প্রিমিয়াম ফিচার! 😆
                </p>
              </div>
            )}

            {/* Main Win98 Window Container */}
            <div className="win98-window">
              
              {/* Titlebar with Active Controls */}
              <div className="win98-titlebar cursor-pointer" onDoubleClick={() => handleWinControl('hero', 'max')}>
                <div className="flex items-center gap-2">
                  <span>💻</span>
                  <span>{windows.hero.title} {windows.hero.min ? '[MINIMIZED]' : ''}</span>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => handleWinControl('hero', 'min')} 
                    className="win98-control-btn"
                    title="Minimize"
                  >
                    _
                  </button>
                  <button 
                    onClick={() => handleWinControl('hero', 'max')} 
                    className="win98-control-btn"
                    title={windows.hero.max ? "Restore" : "Maximize"}
                  >
                    {windows.hero.max ? '❐' : '□'}
                  </button>
                  <button 
                    onClick={() => handleWinControl('hero', 'close')} 
                    className="win98-control-btn"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Minimized Placeholder Bar */}
              {windows.hero.min ? (
                <div className="p-4 bg-[#C0C0C0] flex justify-between items-center text-xs font-mono">
                  <span className="text-[#57534E]">উইন্ডোটি মিনিমাইজ করা রয়েছে...</span>
                  <button 
                    onClick={() => handleWinControl('hero', 'min')} 
                    className="win98-btn px-4 py-1 font-bold text-xs"
                  >
                    [ 📂 আন-মিনিমাইজ করুন ]
                  </button>
                </div>
              ) : (
                <>
                  {/* Menu Toolbar */}
                  <div className="bg-[#C0C0C0] border-b border-[#808080] px-3 py-1 flex gap-5 text-xs text-black font-mono">
                    <span onClick={() => showToast('📂 File Menu: No files found, everything on cloud!')} className="hover:bg-[#000080] hover:text-white px-1.5 py-0.5 cursor-pointer"><u>F</u>ile</span>
                    <span onClick={() => showToast('✂️ Edit Menu: Ctrl+C and Ctrl+V is all you need!')} className="hover:bg-[#000080] hover:text-white px-1.5 py-0.5 cursor-pointer"><u>E</u>dit</span>
                    <span onClick={() => showToast('🌐 StackOverflow: Synchronizing 1,000,000 threads...')} className="hover:bg-[#000080] hover:text-white px-1.5 py-0.5 cursor-pointer"><u>S</u>tackOverflow</span>
                    <span onClick={() => showToast('🐛 Bugs Menu: Converting 99 bugs to features...')} className="hover:bg-[#000080] hover:text-white px-1.5 py-0.5 cursor-pointer"><u>B</u>ugs</span>
                    <span onClick={() => showToast('❓ Help: Just Google it, bro!')} className="hover:bg-[#000080] hover:text-white px-1.5 py-0.5 cursor-pointer"><u>H</u>elp</span>
                  </div>

                  {/* Window Content Body */}
                  <div className="p-6 sm:p-10 bg-[#C0C0C0]">
                    <div className="grid md:grid-cols-12 gap-8 items-center">
                      
                      {/* Left Text Content */}
                      <div className="md:col-span-7 space-y-6">
                        
                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 win98-inset text-xs font-mono font-bold text-[#800000]">
                          <span>⚠️</span>
                          <span>100% GOOGLE & CAFFEINE DRIVEN</span>
                        </div>

                        {/* Main Headline */}
                        <div className="space-y-2">
                          <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#57534E]">
                            // Welcome to Professional Patchwork
                          </div>
                          <h1 className="text-3xl sm:text-5xl font-black text-black leading-tight" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                            জোড়াতালি <span className="highlight-yellow">ইঞ্জিনিয়ারিং</span> এ স্বাগতম!
                          </h1>
                        </div>

                        {/* Paper Inset Description Box */}
                        <div className="win98-inset p-4 font-mono text-xs sm:text-sm text-[#2B231B] leading-relaxed">
                          <p className="font-bold text-[#000080] mb-1">
                            &gt; "অন্যের কোড কপি-পেস্ট করা কোনো ক্রাইম নয়, এটা এক ধরণের রিইউজেবল আর্ট!"
                          </p>
                          <p className="text-[#57534E]">
                            আমার কোড কীভাবে চলে আমি নিজেও জানি না, কিন্তু যতদিন গুগল সার্চ আর স্ট্যাকওভারফ্লো বেঁচে আছে, ততদিন সার্ভার ডাউন হবে না।
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                          <a
                            href="#projects"
                            className="win98-btn-primary px-6 py-3 text-sm font-bold shadow-sm inline-flex items-center gap-2"
                          >
                            <span>📂</span>
                            <span>কীর্তিকলাপ দেখুন</span>
                          </a>
                          <a
                            href="#process"
                            className="win98-btn px-6 py-3 text-sm font-bold shadow-sm inline-flex items-center gap-2 text-black"
                          >
                            <span>⚙️</span>
                            <span className="doodle-underline">কপি-পেস্ট পদ্ধতি</span>
                          </a>
                        </div>

                        {/* Live Counter Inset */}
                        <div className="pt-2">
                          <div className="win98-inset px-4 py-2 inline-flex items-center gap-3 text-xs font-mono">
                            <span className="text-base">📋</span>
                            <span>লাইভ কপি-পেস্ট কাউন্টার:</span>
                            <span className="font-bold text-[#D90429] bg-[#FFE5EC] px-2 py-0.5 border border-[#FFA5BA]">
                              {copyCount.toLocaleString()} বার
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Right Image / Graphic Window */}
                      <div className="md:col-span-5 relative">
                        
                        {/* Sticky Note on Top Right of Image */}
                        <div className="absolute -top-6 -right-4 z-20 doodle-sticky p-3 w-40 rounded-sm rotate-[4deg] hidden sm:block">
                          <div className="text-[10px] font-mono font-bold text-[#000080]">★ আর্ট অফ বাগ:</div>
                          <div className="text-[11px] font-bold text-[#1C1917]">রোবটটি কোনো বাগ ছাড়াই চলছে! 🤖</div>
                        </div>

                        <div className="win98-box p-2 bg-[#D4D0C8]">
                          <div className="win98-titlebar py-1 px-2 text-[11px] mb-2">
                            <span>🖼️ HERO_PREVIEW.BMP</span>
                            <span>100%</span>
                          </div>
                          <div className="win98-inset p-1 bg-black overflow-hidden">
                            <img 
                              src="./hero-image.jpg" 
                              alt="Hero representation" 
                              className="w-full aspect-square object-cover"
                            />
                          </div>
                          <div className="mt-2 text-[10px] font-mono text-[#57534E] flex justify-between px-1">
                            <span>Res: 1024x1024</span>
                            <span>Format: Bitmap (Clean)</span>
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="border-t border-[#808080] bg-[#C0C0C0] px-4 py-1.5 flex flex-wrap justify-between items-center text-xs font-mono text-[#404040]">
                    <div className="flex items-center gap-4">
                      <span>● Status: Online (Caffeinated)</span>
                      <span className="hidden sm:inline">● StackOverflow: Connected</span>
                    </div>
                    <div className="font-bold text-[#000080]">
                      Mem: 640K OK
                    </div>
                  </div>
                </>
              )}

            </div>
          </section>
        )}

        {/* SKILLS AS WIN98 SETUP PROGRESS */}
        {!windows.skills.closed && (
          <section className={`reveal reveal-up transition-all duration-300 ${windows.skills.max ? 'max-w-none w-full' : ''}`}>
            <div className="win98-window">
              <div className="win98-titlebar cursor-pointer" onDoubleClick={() => handleWinControl('skills', 'max')}>
                <div className="flex items-center gap-2">
                  <span>⚙️</span>
                  <span>{windows.skills.title} {windows.skills.min ? '[MINIMIZED]' : ''}</span>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleWinControl('skills', 'min')} className="win98-control-btn" title="Minimize">_</button>
                  <button onClick={() => handleWinControl('skills', 'max')} className="win98-control-btn" title={windows.skills.max ? "Restore" : "Maximize"}>{windows.skills.max ? '❐' : '□'}</button>
                  <button onClick={() => handleWinControl('skills', 'close')} className="win98-control-btn" title="Close">✕</button>
                </div>
              </div>

              {windows.skills.min ? (
                <div className="p-4 bg-[#C0C0C0] flex justify-between items-center text-xs font-mono">
                  <span className="text-[#57534E]">স্কিলস উইজার্ড মিনিমাইজ করা রয়েছে...</span>
                  <button onClick={() => handleWinControl('skills', 'min')} className="win98-btn px-4 py-1 font-bold text-xs">[ 📂 আন-মিনিমাইজ করুন ]</button>
                </div>
              ) : (
                <div className="p-6 sm:p-8 bg-[#C0C0C0] space-y-6">
                  <div className="text-xs font-mono text-[#2B231B] border-b border-[#808080] pb-3">
                    // সিস্টেম স্কিল টেস্ট রেজাল্ট (১০০% অথেনটিক ও বাস্তব অভিজ্ঞতা):
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    {skills.map((skill, index) => (
                      <div key={index} className="win98-inset p-4 bg-[#FFFFFF] space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-[#1C1917]" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                          <span>{skill.name}</span>
                          <span className="font-mono text-[#000080]">{skill.percent}%</span>
                        </div>
                        {/* Win98 Beveled Progress Bar */}
                        <div className="w-full h-5 win98-inset bg-[#DFDFDF] p-0.5 flex">
                          <div 
                            className="h-full bg-[#000080] transition-all duration-1000"
                            style={{ width: `${skill.percent}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-[#57534E]">
                          <span>Task #{index + 1}</span>
                          <span className="font-bold">{skill.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* PROJECTS SECTION (WIN98 EXPLORER WITH TAPED NOTES) */}
        <section id="projects" className="space-y-6 reveal reveal-up">
          
          {/* Section Header Window */}
          <div className="win98-box p-4 bg-[#C0C0C0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="text-xs font-mono font-bold text-[#000080] uppercase tracking-wider">
                EXPLORER.EXE - C:\PROJECTS\PORTFOLIO\
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-black" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                কীর্তিকলাপ ও <span className="highlight-yellow">জোড়াতালি প্রজেক্টস</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="win98-inset px-3 py-1 text-xs font-mono font-bold text-[#57534E]">
                {projects.length - closedProjects.length} / {projects.length} Visible
              </span>
              {closedProjects.length > 0 && (
                <button
                  onClick={handleRestoreProjects}
                  className="win98-btn-primary px-3 py-1 text-xs font-mono cursor-pointer"
                >
                  🔄 রিস্টোর প্রজেক্ট ({closedProjects.length})
                </button>
              )}
            </div>
          </div>

          {/* Project Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {projects.filter(p => !closedProjects.includes(p.id)).map((proj) => {
              const isMin = minimizedProjects.includes(proj.id);
              return (
                <div key={proj.id} className="win98-window relative group transition-all duration-300">
                  {/* Window Titlebar */}
                  <div className="win98-titlebar cursor-pointer" onDoubleClick={() => handleProjectControl(proj.id, proj.name, 'max')}>
                    <div className="flex items-center gap-2 text-xs">
                      <span>{proj.icon}</span>
                      <span>{proj.name}.EXE {isMin ? '[MINIMIZED]' : ''}</span>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleProjectControl(proj.id, proj.name, 'min')} 
                        className="win98-control-btn"
                        title={isMin ? "Expand" : "Minimize"}
                      >
                        _
                      </button>
                      <button 
                        onClick={() => handleProjectControl(proj.id, proj.name, 'max')} 
                        className="win98-control-btn"
                        title="Maximize Preview"
                      >
                        □
                      </button>
                      <button 
                        onClick={() => handleProjectControl(proj.id, proj.name, 'close')} 
                        className="win98-control-btn"
                        title="Close Window"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Window Body */}
                  {isMin ? (
                    <div className="p-3 bg-[#C0C0C0] flex justify-between items-center text-xs font-mono">
                      <span className="text-[#57534E] text-[11px]">প্রজেক্টটি মিনিমাইজ করা...</span>
                      <button 
                        onClick={() => handleProjectControl(proj.id, proj.name, 'min')}
                        className="win98-btn px-3 py-1 text-xs font-bold"
                      >
                        [ 📂 আন-মিনিমাইজ ]
                      </button>
                    </div>
                  ) : (
                    <div className="p-5 bg-[#C0C0C0] space-y-4">
                      
                      {/* Image Inset */}
                      <div 
                        onClick={() => handleProjectControl(proj.id, proj.name, 'max')}
                        className="win98-inset p-1.5 bg-black overflow-hidden cursor-pointer"
                        title="ক্লিক করে বড় করে দেখুন"
                      >
                        <img 
                          src={proj.image} 
                          alt={proj.name}
                          className="w-full aspect-[16/10] object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Project Details */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="bg-[#FEFAE0] border border-[#D4C46A] text-[#8C5824] px-2 py-0.5 text-[11px] font-mono font-bold">
                            🏷️ {proj.tag}
                          </span>
                          <span className="text-[11px] font-mono text-[#57534E]">
                            Size: {proj.fileSize}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-black pt-1" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                          {proj.name}
                        </h3>
                        
                        <p className="text-xs text-[#3D3428] font-mono bg-[#FFFFFF] p-2.5 win98-inset leading-relaxed">
                          {proj.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 flex flex-wrap justify-between items-center gap-2 border-t border-[#808080]">
                        <span className="text-[11px] font-mono text-[#000080] font-bold">
                          ● Status: 3D Live Ready
                        </span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setActiveLiveProject(proj);
                              setIsLiveProjectMaximized(false);
                              showToast(`🚀 "${proj.name}" লাইভ উইন্ডোতে চালু হচ্ছে!`);
                            }}
                            className="win98-btn-primary px-4 py-1.5 text-xs font-bold text-white cursor-pointer shadow-sm flex items-center gap-1.5"
                          >
                            <span>🚀</span>
                            <span>[ লাইভ চালান ]</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </section>

        {/* PROCESS SECTION (3-STEP SETUP WIZARD) */}
        {!windows.process.closed && (
          <section id="process" className={`space-y-6 reveal reveal-up transition-all duration-300 ${windows.process.max ? 'max-w-none w-full' : ''}`}>
            <div className="win98-window">
              <div className="win98-titlebar cursor-pointer" onDoubleClick={() => handleWinControl('process', 'max')}>
                <div className="flex items-center gap-2">
                  <span>🧙‍♂️</span>
                  <span>{windows.process.title} {windows.process.min ? '[MINIMIZED]' : ''}</span>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleWinControl('process', 'min')} className="win98-control-btn" title="Minimize">_</button>
                  <button onClick={() => handleWinControl('process', 'max')} className="win98-control-btn" title={windows.process.max ? "Restore" : "Maximize"}>{windows.process.max ? '❐' : '□'}</button>
                  <button onClick={() => handleWinControl('process', 'close')} className="win98-control-btn" title="Close">✕</button>
                </div>
              </div>

              {windows.process.min ? (
                <div className="p-4 bg-[#C0C0C0] flex justify-between items-center text-xs font-mono">
                  <span className="text-[#57534E]">প্রসেস উইজার্ড মিনিমাইজ করা রয়েছে...</span>
                  <button onClick={() => handleWinControl('process', 'min')} className="win98-btn px-4 py-1 font-bold text-xs">[ 📂 আন-মিনিমাইজ করুন ]</button>
                </div>
              ) : (
                <div className="p-6 sm:p-10 bg-[#C0C0C0] space-y-8">
                  
                  <div className="text-center max-w-xl mx-auto space-y-2">
                    <div className="text-xs font-mono font-bold text-[#000080]">METHODOLOGY OF COPY-PASTE</div>
                    <h2 className="text-2xl sm:text-4xl font-black text-black" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                      কীভাবে <span className="highlight-yellow">জোড়াতালি</span> দিই?
                    </h2>
                    <p className="text-xs font-mono text-[#57534E]">
                      নিচের ৩টি ধাপ কঠোরভাবে অনুসরণ করে প্রতিদিন কোড প্রডিউস করা হয়:
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    
                    {/* Step 1 */}
                    <div className="win98-box p-5 bg-[#FFFFFF] space-y-3 relative">
                      <div className="w-8 h-8 win98-btn-primary flex items-center justify-center font-bold text-xs">
                        01
                      </div>
                      <h3 className="text-lg font-bold text-black" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                        ১. প্যানিক & গুগল সার্চ
                      </h3>
                      <p className="text-xs font-mono text-[#57534E] leading-relaxed">
                        ক্লায়েন্ট কাজ দেওয়া মাত্রই প্রথমে ১০ মিনিট গভীর প্যানিক করা হয়। এরপর শান্ত হয়ে গুগলে কি-ওয়ার্ড সার্চ করা হয়।
                      </p>
                      <div className="text-[10px] font-mono text-[#800000] font-bold bg-[#FFE5EC] p-1.5 border border-[#FFA5BA]">
                        CMD: google.exe "how to center a div"
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="win98-box p-5 bg-[#FFFFFF] space-y-3 relative">
                      <div className="w-8 h-8 win98-btn-primary flex items-center justify-center font-bold text-xs">
                        02
                      </div>
                      <h3 className="text-lg font-bold text-black" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                        ২. অন্ধের মতো কপি-পেস্ট
                      </h3>
                      <p className="text-xs font-mono text-[#57534E] leading-relaxed">
                        স্ট্যাক ওভারফ্লোর প্রথম গ্রিন টিক দেওয়া অ্যানসারটি না বুঝেই কপি করে সরাসরি প্রোডাকশন কোডে পেস্ট করা হয়।
                      </p>
                      <div className="text-[10px] font-mono text-[#000080] font-bold bg-[#E1F5FE] p-1.5 border border-[#81D4FA]">
                        ACTION: CTRL+C &gt; CTRL+V (Repeat)
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="win98-box p-5 bg-[#FFFFFF] space-y-3 relative">
                      <div className="w-8 h-8 win98-btn-primary flex items-center justify-center font-bold text-xs">
                        03
                      </div>
                      <h3 className="text-lg font-bold text-black" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                        ৩. দোয়া ও প্রোডাকশন পুশ
                      </h3>
                      <p className="text-xs font-mono text-[#57534E] leading-relaxed">
                        চোখ বন্ধ করে `git push origin master` দেওয়া হয় এবং মনে মনে দোয়া করা হয় যেন সার্ভার আজ ক্র্যাশ না করে।
                      </p>
                      <div className="text-[10px] font-mono text-[#2E7D32] font-bold bg-[#E8F5E9] p-1.5 border border-[#A5D6A7]">
                        GIT: git commit -m "fix maybe?"
                      </div>
                    </div>

                  </div>

                </div>
              )}
            </div>
          </section>
        )}

        {/* VICTIMS SECTION (WIN98 ERROR & WARNING DIALOG BOXES) */}
        <section id="victims" className="space-y-6 reveal reveal-up">
          
          <div className="win98-box p-4 bg-[#C0C0C0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="text-xs font-mono font-bold text-[#D90429] uppercase tracking-wider">
                🛑 SYSTEM_LOGS / CRITICAL_WAILS.LOG
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-black" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                ভিক্টিমদের <span className="highlight-pink">আর্তনাদ ও কান্না</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#57534E]">
                Active: {activeVictims.length} / {victims.length}
              </span>
              {ignoredVictims.length > 0 && (
                <button
                  onClick={handleRestoreVictims}
                  className="win98-btn-primary px-3 py-1 text-xs cursor-pointer"
                >
                  🔄 রিস্টোর ({ignoredVictims.length})
                </button>
              )}
            </div>
          </div>

          {/* Dialog Boxes Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeVictims.slice(0, showAllVictims ? activeVictims.length : 3).map((victim) => {
              const isPacified = pacifiedVictims.includes(victim.id);
              return (
                <div key={victim.id} className="win98-window flex flex-col justify-between relative transition-all duration-300">
                  
                  {/* Pacified Stamp Banner */}
                  {isPacified && (
                    <div className="absolute top-10 right-4 z-30 bg-[#2E7D32] text-white text-[10px] font-mono font-bold px-2 py-1 border-2 border-white shadow-lg rotate-[8deg]">
                      ✅ শান্ত করা হয়েছে ☕
                    </div>
                  )}

                  {/* Title Bar */}
                  <div className={`win98-titlebar ${isPacified ? 'bg-gradient-to-r from-[#2E7D32] to-[#4CAF50]' : 'bg-gradient-to-r from-[#800000] to-[#C00000]'}`}>
                    <div className="flex items-center gap-2 text-xs">
                      <span>{isPacified ? '✅' : '🛑'}</span>
                      <span>{victim.type}.SYS</span>
                    </div>
                    <button onClick={() => handleVictimIgnore(victim.id, victim.name)} className="win98-control-btn" title="Dismiss">✕</button>
                  </div>

                  {/* Dialog Body */}
                  <div className="p-5 bg-[#C0C0C0] space-y-4 flex-1 flex flex-col justify-between">
                    
                    <div className="space-y-3">
                      {/* Error Icon & Text */}
                      <div className="flex items-start gap-3">
                        <span className="text-3xl shrink-0">{isPacified ? '☕' : '⚠️'}</span>
                        <p className={`text-xs font-semibold leading-relaxed win98-inset p-3 ${isPacified ? 'bg-[#F1F8E9] text-[#1B5E20]' : 'bg-[#FFFFFF] text-[#1C1917]'}`} style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                          "{victim.wail}"
                        </p>
                      </div>
                    </div>

                    {/* Victim Profile Details */}
                    <div className="pt-3 border-t border-[#808080] flex items-center gap-3">
                      <img 
                        src={victim.avatar} 
                        alt={victim.name} 
                        className="w-9 h-9 win98-inset object-cover bg-white"
                      />
                      <div className="text-xs font-mono">
                        <div className="font-bold text-black" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{victim.name}</div>
                        <div className="text-[10px] text-[#57534E]">{victim.role}</div>
                      </div>
                    </div>

                  </div>

                  {/* Dialog Bottom Buttons */}
                  <div className="border-t border-[#808080] bg-[#C0C0C0] px-4 py-2 flex justify-end gap-2">
                    <button 
                      onClick={() => handleVictimIgnore(victim.id, victim.name)}
                      className="win98-btn px-3 py-1 text-xs font-bold text-black cursor-pointer"
                      title="Ignore this wail"
                    >
                      Ignore 🗑️
                    </button>
                    <button 
                      onClick={() => handleVictimOk(victim.id, victim.name)}
                      className={`win98-btn px-3 py-1 text-xs font-bold cursor-pointer ${isPacified ? 'bg-[#C8E6C9] text-[#2E7D32]' : 'text-black'}`}
                      title="Acknowledge with coffee"
                    >
                      {isPacified ? 'শান্ত আছেন ✓' : 'OK ☕'}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Toggle All Button */}
          {activeVictims.length > 3 && (
            <div className="text-center pt-4">
              <button
                onClick={() => setShowAllVictims(!showAllVictims)}
                className="win98-btn px-8 py-3 text-xs font-bold text-black cursor-pointer"
              >
                {showAllVictims ? '▲ কম ভিক্টিম দেখুন' : '▼ আরও ভিক্টিমদের আর্তনাদ লোড করুন'}
              </button>
            </div>
          )}

        </section>

        {/* PARTICLE TEXT SECTION */}
        <div className="reveal reveal-up">
          <ParticleText />
        </div>

        <Butterflies />

        {/* CONTACT SECTION (SUBMIT TICKET DIALOG) */}
        {!windows.contact.closed && (
          <section id="contact" className={`reveal reveal-up transition-all duration-300 ${windows.contact.max ? 'max-w-none w-full' : ''}`}>
            <div className="win98-window max-w-2xl mx-auto">
              <div className="win98-titlebar cursor-pointer" onDoubleClick={() => handleWinControl('contact', 'max')}>
                <div className="flex items-center gap-2">
                  <span>✉️</span>
                  <span>{windows.contact.title} {windows.contact.min ? '[MINIMIZED]' : ''}</span>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleWinControl('contact', 'min')} className="win98-control-btn" title="Minimize">_</button>
                  <button onClick={() => handleWinControl('contact', 'max')} className="win98-control-btn" title={windows.contact.max ? "Restore" : "Maximize"}>{windows.contact.max ? '❐' : '□'}</button>
                  <button onClick={() => handleWinControl('contact', 'close')} className="win98-control-btn" title="Close">✕</button>
                </div>
              </div>

              {windows.contact.min ? (
                <div className="p-4 bg-[#C0C0C0] flex justify-between items-center text-xs font-mono">
                  <span className="text-[#57534E]">কন্টাক্ট টিকিট উইন্ডো মিনিমাইজ করা রয়েছে...</span>
                  <button onClick={() => handleWinControl('contact', 'min')} className="win98-btn px-4 py-1 font-bold text-xs">[ 📂 আন-মিনিমাইজ করুন ]</button>
                </div>
              ) : (
                <div className="p-6 sm:p-10 bg-[#C0C0C0] space-y-6">
                  
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-black" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                      চলুন একসাথে কিছু একটা <span className="highlight-yellow">জোড়াতালি দেই</span>
                    </h2>
                    <p className="text-xs font-mono text-[#57534E]">
                      কি বানাতে হবে? (গুগল করে সমাধানযোগ্য হলে দারুণ হয়!)
                    </p>
                  </div>

                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); showToast('🚀 টিকিট সফলভাবে সার্ভারে সাবমিট হয়েছে!'); }}>
                    <div>
                      <label className="block text-xs font-mono font-bold text-black mb-1">
                        Your Name (Victim ID):
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. নতুন ভিক্টিম #৪০৪" 
                        required
                        className="w-full win98-inset px-3 py-2 text-xs font-mono text-black outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-black mb-1">
                        Project Requirement (আইডিয়া):
                      </label>
                      <textarea 
                        rows="4" 
                        required
                        placeholder="আপনার আইডিয়া বলুন, আমি স্ট্যাকওভারফ্লোতে সার্চ দিয়ে দেখছি..." 
                        className="w-full win98-inset px-3 py-2 text-xs font-mono text-black outline-none"
                      ></textarea>
                    </div>

                    {/* Bug Agreement Checkbox */}
                    <div className="win98-box p-3 bg-[#FFFFFF] flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="bug-agreement"
                        checked={agreedToBugs}
                        onChange={(e) => setAgreedToBugs(e.target.checked)}
                        className="mt-1 w-4 h-4 cursor-pointer accent-[#000080]"
                      />
                      <label htmlFor="bug-agreement" className="text-xs font-mono text-[#1C1917] cursor-pointer leading-relaxed" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                        আমি একমত যে, ওয়েবসাইটে ফিউচারে কোনো বাগ (Bug) পাওয়া গেলে সেটাকে আমি 'ফিচার' (Feature) হিসেবে মেনে নেবো।
                      </label>
                    </div>

                    <div className="pt-2">
                      <button
                        disabled={!agreedToBugs}
                        className={`w-full py-3 text-xs font-bold font-mono transition-all cursor-pointer ${
                          !agreedToBugs 
                            ? 'win98-btn opacity-50 cursor-not-allowed text-[#808080]' 
                            : 'win98-btn-primary text-white shadow-md'
                        }`}
                      >
                        [ মিশন শুরু করুন (SEND TICKET) ➔ ]
                      </button>
                    </div>
                  </form>

                  <div className="text-center text-xs font-mono text-[#57534E] pt-2 border-t border-[#808080]">
                    Contact Protocol: <span className="font-bold text-[#000080]" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>গুগলে সার্চ দিন</span>
                  </div>

                </div>
              )}
            </div>
          </section>
        )}

        {/* FUNNY DANGER BUTTON */}
        <div className="py-12 flex justify-center reveal reveal-scale">
          <div className="win98-box p-3 bg-[#FFE5EC] border-2 border-[#D90429] inline-block shadow-lg">
            <button
              onClick={() => {
                setIsShaking(true);
                setTimeout(() => {
                  setIsShaking(false);
                  alert("⚠️ CRITICAL ERROR 0x00COFFEE: আপনার ডিভাইসটি জোড়াতালি সার্ভারের সাথে কানেক্ট হচ্ছে... সব ডেটা ডিলিট হয়ে যেতে পারে! 🔴 😆");
                }, 400);
              }}
              className={`win98-btn bg-[#D90429] text-white border-2 border-white px-6 sm:px-10 py-3.5 font-black text-xs sm:text-sm font-mono tracking-wider cursor-pointer hover:bg-[#B80020] active:scale-95 ${
                isShaking ? 'animate-shake' : ''
              }`}
            >
              🛑 [ ভুল করেও এখানে ক্লিক করবেন না! ]
            </button>
          </div>
        </div>

      </main>

      {/* DESKTOP RESTORE DOCK FOR CLOSED WINDOWS */}
      {Object.entries(windows).some(([, w]) => w.closed) && (
        <div className="fixed bottom-6 left-6 z-40 win98-window p-3 shadow-2xl flex flex-wrap items-center gap-2 max-w-sm bg-[#C0C0C0] border-2 border-black">
          <span className="text-xs font-mono font-bold text-[#800000] flex items-center gap-1">
            <span>🗑️</span> <span>রিস্টোর ডক:</span>
          </span>
          {Object.entries(windows).map(([k, w]) => w.closed && (
            <button
              key={k}
              onClick={() => handleWinControl(k, 'restore')}
              className="win98-btn-primary px-2.5 py-1 text-[11px] font-mono cursor-pointer"
            >
              🔄 {w.title}
            </button>
          ))}
        </div>
      )}

      {/* GLOBAL DRAGON SETTINGS MODAL */}
      {showDragonSettings && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="win98-window max-w-sm w-full p-5 text-black shadow-2xl animate-popWin">
            <div className="win98-titlebar mb-3 text-xs">
              <span>🐉 DRAGON.DLL SETTINGS</span>
              <button onClick={() => setShowDragonSettings(false)} className="win98-control-btn">✕</button>
            </div>
            <div className="space-y-4 text-xs font-mono bg-[#C0C0C0] p-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Opacity (স্বচ্ছতা):</span>
                  <span className="font-bold text-[#000080]">{Math.round(dragonOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(dragonOpacity * 100)}
                  onChange={(e) => setDragonOpacity(Number(e.target.value) / 100)}
                  className="w-full accent-[#000080]"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Size (সাইজ):</span>
                  <span className="font-bold text-[#000080]">{Math.round(dragonSize * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="200"
                  value={Math.round(dragonSize * 100)}
                  onChange={(e) => setDragonSize(Number(e.target.value) / 100)}
                  className="w-full accent-[#000080]"
                />
              </div>

              {/* Spider Clock Quick Toggle */}
              <div className="win98-inset p-2.5 bg-white flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-black flex items-center gap-1.5">
                  🕷️ স্পাইডার ক্লক গ্যাজেট:
                </span>
                <button
                  onClick={() => {
                    setShowSpiderClock(prev => !prev);
                    showToast(!showSpiderClock ? '🕷️ স্পাইডার ক্লক চালু করা হয়েছে!' : '🕷️ স্পাইডার ক্লক বন্ধ করা হয়েছে!');
                  }}
                  className={`px-2.5 py-1 text-xs font-bold win98-btn cursor-pointer ${showSpiderClock ? 'bg-[#000080] text-white' : 'bg-[#C0C0C0] text-black'}`}
                >
                  {showSpiderClock ? 'ON (চালু)' : 'OFF (বন্ধ)'}
                </button>
              </div>

              <div className="pt-2 flex justify-between border-t border-[#808080]">
                <button 
                  onClick={() => { setDragonOpacity(0.6); setDragonSize(0.75); setShowSpiderClock(true); }}
                  className="win98-btn px-3 py-1 text-xs"
                >
                  Reset
                </button>
                <button 
                  onClick={() => setShowDragonSettings(false)}
                  className="win98-btn-primary px-4 py-1 text-xs text-white"
                >
                  OK (Done)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COFFEE REFILL MODAL (COFFEE.EXE) */}
      {isCoffeeModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="win98-window max-w-md w-full p-6 text-black shadow-2xl animate-popWin">
            <div className="win98-titlebar mb-4 text-xs">
              <div className="flex items-center gap-2">
                <span>☕</span>
                <span>C:\PROGRAMS\COFFEE_REFILL.EXE</span>
              </div>
              <button onClick={() => setIsCoffeeModalOpen(false)} className="win98-control-btn">✕</button>
            </div>
            
            <div className="space-y-4 bg-[#C0C0C0] p-4 text-xs font-mono">
              <div className="flex items-center gap-4 border-b border-[#808080] pb-3">
                <span className="text-4xl animate-bounce">☕</span>
                <div>
                  <div className="font-bold text-base text-black" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                    ক্যাফেইন রিফিল স্টেশন
                  </div>
                  <div className="text-[#57534E]">System Status: Caffeinated & Ready to Code</div>
                </div>
              </div>

              <div className="win98-inset p-3 bg-white space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span>মোট কফি পান করা হয়েছে:</span>
                  <span className="text-[#D90429] bg-[#FFE5EC] px-2 py-0.5 border border-[#FFA5BA]">
                    {coffeeCups} কাপ ☕
                  </span>
                </div>
                <div className="w-full h-4 win98-inset bg-[#DFDFDF] p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-[#8C5824] to-[#D4C46A] transition-all duration-300"
                    style={{ width: `${Math.min(100, (coffeeCups / 25) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-[#57534E] text-right">
                  ডেভেলপার স্ট্যামিনা: {Math.min(100, Math.round((coffeeCups / 25) * 100))}% (Max Power)
                </div>
              </div>

              <div className="win98-inset p-2.5 bg-[#FFFDE7] text-[#5D4037] text-[11px] leading-relaxed">
                💡 <b>বিজ্ঞপ্তি:</b> ১ কাপ কফি = আরও ২০ লাইন জোড়াতালি কোড + ৩০ মিনিট অতিরিক্ত স্ট্যাকওভারফ্লো সার্চ পাওয়ার!
              </div>

              <div className="flex flex-wrap justify-between gap-2 pt-2 border-t border-[#808080]">
                <button
                  onClick={() => {
                    setCoffeeCups(prev => prev + 1);
                    showToast('☕ ১ কাপ গরম কফি পাঠানো হয়েছে! ডেভেলপার খুশি!');
                  }}
                  className="win98-btn-primary px-3 py-2 text-xs text-white font-bold cursor-pointer"
                >
                  ☕ +১ কাপ কফি দিন
                </button>
                <button
                  onClick={() => {
                    setCoffeeCups(prev => prev + 5);
                    showToast('🥤 ৫ কাপ সুপার কোল্ড কফি! সার্ভার স্পিড ২ গুণ বেড়ে গেছে!');
                  }}
                  className="win98-btn px-3 py-2 text-xs text-black font-bold cursor-pointer"
                >
                  🥤 +৫ কাপ এক্সপ্রেস রিফিল
                </button>
                <button
                  onClick={() => setIsCoffeeModalOpen(false)}
                  className="win98-btn px-3 py-2 text-xs font-bold"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RANDOM BUG GENERATOR MODAL (BUG_GENERATOR.EXE) */}
      {isBugModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="win98-window max-w-lg w-full p-6 text-black shadow-2xl animate-popWin">
            <div className="win98-titlebar mb-4 text-xs bg-gradient-to-r from-[#800000] to-[#C00000]">
              <div className="flex items-center gap-2">
                <span>🐛</span>
                <span>BUG_GENERATOR_98.EXE - [AUTO_PATCHER]</span>
              </div>
              <button onClick={() => setIsBugModalOpen(false)} className="win98-control-btn">✕</button>
            </div>

            <div className="space-y-4 bg-[#C0C0C0] p-4 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-[#808080] pb-2">
                <span className="font-bold text-[#800000] flex items-center gap-1.5">
                  <span>🛑</span>
                  <span>{bugDatabase[currentBugIndex].id}</span>
                </span>
                <span className="bg-[#FFE5EC] text-[#D90429] text-[10px] px-2 py-0.5 border border-[#FFA5BA] font-bold">
                  {bugDatabase[currentBugIndex].severity}
                </span>
              </div>

              <div className="win98-inset p-4 bg-white space-y-2">
                <h3 className="text-sm font-black text-black leading-tight" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                  "{bugDatabase[currentBugIndex].title}"
                </h3>
                <p className="text-xs text-[#57534E] leading-relaxed" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                  {bugDatabase[currentBugIndex].desc}
                </p>
                <div className="text-[11px] font-bold text-[#2E7D32] bg-[#E8F5E9] p-2 border border-[#A5D6A7] mt-2">
                  {bugDatabase[currentBugIndex].fix}
                </div>
              </div>

              <div className="flex flex-wrap justify-between gap-2 pt-2 border-t border-[#808080]">
                <button
                  onClick={() => {
                    const nextIdx = (currentBugIndex + 1) % bugDatabase.length;
                    setCurrentBugIndex(nextIdx);
                    showToast(`🎲 নতুন বাগ #${bugDatabase[nextIdx].id} সফলভাবে জেনারেট হয়েছে!`);
                  }}
                  className="win98-btn px-3 py-2 text-xs font-bold cursor-pointer"
                >
                  🎲 অন্য একটি বাগ দেখুন
                </button>
                <button
                  onClick={() => {
                    showToast(`✨ অভিনন্দন! ক্লায়েন্ট এই বাগকে প্রিমিয়াম ফিচার হিসেবে মেনে নিয়েছে! 🎉`);
                    setIsBugModalOpen(false);
                  }}
                  className="win98-btn-primary px-3 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  ✨ এটাকে 'ফিচার' ঘোষণা করুন
                </button>
                <button
                  onClick={() => setIsBugModalOpen(false)}
                  className="win98-btn px-3 py-2 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <Flower />

      {/* LIVE WIN98 INTERACTIVE PROJECT VIEWER MODAL (ROOT LEVEL) */}
      {activeLiveProject && (
        <div className="fixed inset-0 z-[9999999] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden">
          <div 
            style={isLiveProjectMaximized ? {} : (typeof window !== 'undefined' && window.innerWidth >= 768 ? { transform: `translate3d(${liveWinPos.x}px, ${liveWinPos.y}px, 0)` } : {})}
            className={`win98-window w-full max-w-[96vw] sm:max-w-2xl md:max-w-5xl h-[82vh] max-h-[82vh] md:h-[86vh] md:max-h-[86vh] ${isDraggingLiveWin ? 'select-none transition-none' : 'transition-transform duration-75'} flex flex-col shadow-2xl ${isLiveProjectMaximized ? 'h-full max-h-none max-w-none' : ''}`}
          >
            
            {/* Window Titlebar (Draggable Header) */}
            <div 
              onMouseDown={handleTitleBarMouseDown}
              onTouchStart={handleTitleBarTouchStart}
              onDoubleClick={() => {
                setIsLiveProjectMaximized(prev => !prev);
                setLiveWinPos({ x: 0, y: 0 });
              }}
              className="win98-titlebar flex justify-between items-center py-2 px-2 sm:px-3 select-none cursor-move active:cursor-grabbing shrink-0"
              title="মাউস দিয়ে ড্র্যাগ করে উইন্ডোটি যেকোনো জায়গায় সরাতে পারবেন (ডাবল ক্লিকে ফুলস্ক্রিন)"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-white truncate pr-2 pointer-events-none">
                <span>{activeLiveProject.icon}</span>
                <span className="truncate">C:\PROJECTS\{activeLiveProject.codeName}.EXE</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => {
                    setActiveLiveProject(null);
                    showToast(`📁 "${activeLiveProject.name}" বন্ধ করা হয়েছে।`);
                  }} 
                  className="win98-control-btn" 
                  title="Minimize / Dock"
                >
                  _
                </button>
                <button 
                  onClick={() => {
                    setIsLiveProjectMaximized(prev => !prev);
                    setLiveWinPos({ x: 0, y: 0 });
                  }} 
                  className="win98-control-btn hidden sm:inline-flex" 
                  title={isLiveProjectMaximized ? "Restore Window" : "Maximize Window"}
                >
                  {isLiveProjectMaximized ? '❐' : '□'}
                </button>
                <button 
                  onClick={() => setActiveLiveProject(null)} 
                  className="win98-control-btn font-bold px-2 py-0.5 text-xs bg-[#C0C0C0] text-black hover:bg-[#E0E0E0]" 
                  title="Close Window"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Address Bar / Toolbar */}
            <div className="bg-[#C0C0C0] border-b-2 border-[#808080] p-1.5 flex flex-wrap items-center justify-between gap-1.5 text-xs font-mono shrink-0">
              <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                <span className="font-bold text-[#000080] text-[11px] sm:text-xs">Address:</span>
                <div className="win98-inset px-2 py-0.5 bg-white text-black text-[10px] sm:text-[11px] flex-1 truncate font-mono">
                  http://localhost{activeLiveProject.url}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    setIframeKey(prev => prev + 1);
                    showToast(`🔄 "${activeLiveProject.name}" রিলোড করা হচ্ছে...`);
                  }}
                  className="win98-btn px-2 py-1 text-[11px] sm:text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Reload this project"
                >
                  🔄 <span className="hidden sm:inline">রিলোড</span>
                </button>
                <button 
                  onClick={() => setLiveWinPos({ x: 0, y: 0 })}
                  className="win98-btn px-2 py-1 text-[11px] sm:text-xs font-bold hidden sm:flex items-center gap-1 cursor-pointer"
                  title="Reset window position to center"
                >
                  🎯 <span className="hidden sm:inline">সেন্টার</span>
                </button>
                <a 
                  href={activeLiveProject.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="win98-btn px-2 py-1 text-[11px] sm:text-xs font-bold flex items-center gap-1 text-black cursor-pointer"
                  title="Open full page in new tab"
                >
                  🌐 <span className="hidden sm:inline">নতুন ট্যাব</span>
                </a>
                <button 
                  onClick={() => setActiveLiveProject(null)}
                  className="win98-btn-primary px-2.5 py-1 text-[11px] sm:text-xs font-bold text-white cursor-pointer"
                >
                  ✕ বন্ধ
                </button>
              </div>
            </div>

            {/* Embedded Iframe Live Project View */}
            <div className="flex-1 w-full bg-[#111111] relative win98-inset overflow-hidden">
              <iframe
                key={iframeKey}
                src={activeLiveProject.url}
                title={activeLiveProject.name}
                className={`w-full h-full border-0 bg-white ${isDraggingLiveWin ? 'pointer-events-none' : ''}`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />
            </div>

            {/* Win98 Bottom Status Bar */}
            <div className="bg-[#C0C0C0] border-t-2 border-[#FFFFFF] px-2.5 py-1 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-[#57534E] shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[#008000] font-bold">● LIVE</span>
                <span>|</span>
                <span className="truncate max-w-[140px] sm:max-w-none">{activeLiveProject.tag}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{activeLiveProject.fileSize}</span>
                <span className="hidden sm:inline">| 100% Embedded App</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FLOATING SPIDER CLOCK GADGET */}
      {showSpiderClock && (
        <SpiderClock 
          onClose={() => {
            setShowSpiderClock(false);
            showToast('🕷️ স্পাইডার ক্লক হাইড করা হয়েছে (৯-ডট লঞ্চার থেকে আবার ওপেন করতে পারবেন)!');
          }}
          showToast={showToast}
        />
      )}

      <DotNavigation 
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onToggleDragon={() => setShowDragonSettings(prev => !prev)}
        onScrollToSection={handleScrollToSection}
        onOpenCoffee={() => setIsCoffeeModalOpen(true)}
        onOpenBug={() => setIsBugModalOpen(true)}
        onToggleSpiderClock={() => setShowSpiderClock(prev => !prev)}
        showToast={showToast}
      />

      {/* FOOTER (WIN98 TASKBAR STYLE) */}
      <footer className="mt-20 border-t-2 border-black bg-[#C0C0C0] py-6 px-4 font-mono text-xs text-black">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 font-bold">
            <a href="https://www.facebook.com/n4han13" target="_blank" rel="noopener noreferrer" className="win98-btn px-3 py-1 hover:text-[#000080]">
              [ Facebook ]
            </a>
            <a href="https://www.instagram.com/n4han13" target="_blank" rel="noopener noreferrer" className="win98-btn px-3 py-1 hover:text-[#000080]">
              [ Instagram ]
            </a>
          </div>
          <div className="text-center sm:text-right text-[#57534E]" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            © ১৯৯৮-২০২৬ জোড়াতালি ইঞ্জিনিয়ারিং • কপিরাইট নেই, কারণ আমি নিজেও গুগল থেকে কপি করেছি।
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
