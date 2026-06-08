import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Award, 
  Zap, 
  BookOpen, 
  Globe, 
  Coffee, 
  Gamepad2, 
  Check, 
  Flame, 
  ArrowRight, 
  Brain, 
  ExternalLink, 
  Compass, 
  HelpCircle, 
  X, 
  ChevronRight, 
  User, 
  Edit2, 
  Activity, 
  CheckSquare, 
  LifeBuoy, 
  Lightbulb, 
  Smile, 
  Target,
  FileText,
  Cloud,
  Laptop,
  Smartphone,
  Database,
  DownloadCloud,
  UploadCloud,
  ShieldCheck,
  Code
} from 'lucide-react';

import { 
  auth, 
  loginWithGoogle, 
  loginAnonymously, 
  logoutUser 
} from './firebase';
import { 
  saveProfileToCloud, 
  fetchProfileFromCloud, 
  saveTasksToCloud, 
  fetchTasksFromCloud, 
  saveTargetsToCloud, 
  fetchTargetsFromCloud, 
  saveRewardsToCloud, 
  fetchRewardsFromCloud,
  UserProfileData
} from './lib/dbSync';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AdhdTarget {
  id: string;
  title: string;
  category: 'ShortTerm' | 'LongTerm';
  isCompleted: boolean;
}

interface JournalSummaryResult {
  achievements: string[];
  burnoutLevel: string;
  adhdSaran: string;
  bulletSummary: string;
}

interface Task {
  id: string;
  title: string;
  urgency: 'Low' | 'Medium' | 'High';
  xpReward: number;
  coinReward: number;
  isCompleted: boolean;
  notes?: string;
}

interface MindmapNode {
  id: string;
  label: string;
  description: string;
  parentId: string | null;
  xpReward: number;
  suggestedResources: string[];
}

interface Mindmap {
  title: string;
  nodes: MindmapNode[];
  completedNodes: string[]; // Node IDs that are completed
}

interface TechNewsItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  whyItMatters: string;
  adhdFriendlyStep: string;
}

interface RewardItem {
  id: string;
  title: string;
  cost: number;
  icon: 'game' | 'social' | 'coffee' | 'food' | 'rest';
}

const DEFAULT_TASKS: Task[] = [
  {
    id: 't-1',
    title: 'Minum air putih & rapikan meja (Mulai Hari)',
    urgency: 'Low',
    xpReward: 40,
    coinReward: 10,
    isCompleted: false,
    notes: 'Meja yang rapi mengurangi distraksi visual otak ADHD.'
  },
  {
    id: 't-2',
    title: 'Nyalakan Focus Tracker & coba rasakan hyperfocus selama 10 menit',
    urgency: 'Medium',
    xpReward: 65,
    coinReward: 15,
    isCompleted: false,
    notes: 'Klaim reward koin langsung setelah sesi timer selesai.'
  },
  {
    id: 't-3',
    title: 'Ketik satu topik skill baru di tab AI Mindmap',
    urgency: 'High',
    xpReward: 100,
    coinReward: 20,
    isCompleted: false,
    notes: 'Ayo buat rencana belajar yang ringkas dalam hitungan detik!'
  }
];

const DEFAULT_REWARDS: RewardItem[] = [
  { id: 'r-1', title: 'Main game favorit selama 30 menit', cost: 50, icon: 'game' },
  { id: 'r-2', title: 'Scroll media sosial 15 menit bebas bersalah', cost: 30, icon: 'social' },
  { id: 'r-3', title: 'Es kopi susu gula aren / es matcha favorit', cost: 40, icon: 'coffee' },
  { id: 'r-4', title: 'Cemilan atau makanan manis penyegar dopamin', cost: 35, icon: 'food' },
  { id: 'r-5', title: 'Istirahat total rebahan tanpa beban 1 jam', cost: 80, icon: 'rest' }
];

const SAMPLE_MINDMAP: Mindmap = {
  title: 'Peta Pembelajaran Singkat: Web Dasar (Dasbor AI)',
  completedNodes: [],
  nodes: [
    {
      id: 'm-1',
      label: 'Konsep HTML & Struktur Web',
      description: 'Elemen dasar pembangun semua website di planet bumi.',
      parentId: null,
      xpReward: 100,
      suggestedResources: [
        'Tonton video 8 menit tentang HTML terstruktur.',
        'Tulis 1 judul dan 1 paragraf di editor online.'
      ]
    },
    {
      id: 'm-2',
      label: 'Gaya CSS (Tailwind Basikal)',
      description: 'Memberi warna dan jarak rapi demi harmoni visual.',
      parentId: 'm-1',
      xpReward: 120,
      suggestedResources: [
        'Eksperimen ganti warna latar jadi abu lembut.',
        'Pelajari kelas padding "p-4" dan margin "mt-2".'
      ]
    },
    {
      id: 'm-3',
      label: 'Logika JS Interaktif',
      description: 'Fungsi klik sederhana yang meluncurkan kotak dialog rahasia.',
      parentId: 'm-1',
      xpReward: 140,
      suggestedResources: [
        'Gunakan console.log("Halo Dunia!")',
        'Buat tombol yang jika diklik memunculkan alert sederhana.'
      ]
    },
    {
      id: 'm-4',
      label: 'React State Pertama Anda',
      description: 'Menjaga input agar dapat terupdate di monitor.',
      parentId: 'm-3',
      xpReward: 180,
      suggestedResources: [
        'Pahami arti useState harian.',
        'Buat counter angka mandiri yang bisa bertambah terus.'
      ]
    },
    {
      id: 'm-5',
      label: 'Klaim Level Up!',
      description: 'Review semua konsep dasar dalam waktu 5 menit.',
      parentId: 'm-4',
      xpReward: 200,
      suggestedResources: [
        'Tulis kesimpulan 3 baris tentang apa itu komponen.',
        'Selesai! Rayakan pencapaian coding pertama Anda.'
      ]
    }
  ]
};

const MOTIVATION_QUOTES = [
  "Tidak perlu melompat langsung jauh, satu tebakan kecil tetaplah kemajuan besar harian.",
  "Distraksi itu wajar. Tarik napas, tenangkan mata, lalu pilih satu tugas terkecil yang bisa dikerjakan dalam 3 menit.",
  "Dopamin terbaik dihasilkan dari rasa berhasil menyelesaikan hal-hal mikro. Coret salah satu misi sekarang!",
  "Otak ADHD adalah otak pemburu ide kreatif yang luar biasa. Beri ia ruang fokus berjangka pendek.",
  "Satu klik tombol fokus adalah sumpah setia bagi impian teknologi masa depanmu!"
];

export default function App() {
  // Synthesized Sound FX setup
  const playSound = (type: 'success' | 'click' | 'levelUp' | 'redeem') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        // High dopamine arpeggio
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.55);
      } else if (type === 'levelUp') {
        // Grand fanfare
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
        osc.frequency.setValueAtTime(329.63, ctx.currentTime + 0.08); // E4
        osc.frequency.setValueAtTime(392.00, ctx.currentTime + 0.16); // G4
        osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.24); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.32); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.40); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.48); // C6
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.95);
        osc.start();
        osc.stop(ctx.currentTime + 1.0);
      } else if (type === 'redeem') {
        // Coin drops
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08); // D6
        osc.frequency.setValueAtTime(1567.98, ctx.currentTime + 0.16); // G6
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        // Light tap
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      }
    } catch (e) {
      console.log('Audiosynthesis blocked / not supported by iframe restrictions.');
    }
  };

  // Local Storage and User States
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  const [uName, setUName] = useState<string>(() => localStorage.getItem('adhd_uname') || 'Navigator Teknologi');
  const [isEditingName, setIsEditingName] = useState(false);
  const [level, setLevel] = useState<number>(() => Number(localStorage.getItem('adhd_level')) || 1);
  const [xp, setXp] = useState<number>(() => Number(localStorage.getItem('adhd_xp')) || 120);
  const [coins, setCoins] = useState<number>(() => Number(localStorage.getItem('adhd_coins')) || 45);
  const [streak, setStreak] = useState<number>(() => Number(localStorage.getItem('adhd_streak')) || 1);
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('adhd_tasks');
    return saved ? JSON.parse(saved) : DEFAULT_TASKS;
  });
  const [activeMindmap, setActiveMindmap] = useState<Mindmap>(() => {
    const saved = localStorage.getItem('adhd_mindmap');
    return saved ? JSON.parse(saved) : SAMPLE_MINDMAP;
  });
  const [rewards, setRewards] = useState<RewardItem[]>(() => {
    const saved = localStorage.getItem('adhd_rewards');
    return saved ? JSON.parse(saved) : DEFAULT_REWARDS;
  });

  // ADHD Notepad & Target states
  const [notepadContent, setNotepadContent] = useState<string>(() => localStorage.getItem('adhd_notepad') || '');
  const [targets, setTargets] = useState<AdhdTarget[]>(() => {
    const saved = localStorage.getItem('adhd_targets');
    return saved ? JSON.parse(saved) : [
      { id: 'tar-1', title: 'Belajar konsep fundamental programming 30 menit', category: 'ShortTerm', isCompleted: false },
      { id: 'tar-2', title: 'Isi air minum harian & rapikan meja', category: 'ShortTerm', isCompleted: true },
      { id: 'tar-3', title: 'Membuat Aplikasi Portofolio Lengkap menggunakan React', category: 'LongTerm', isCompleted: false },
      { id: 'tar-4', title: 'Menyelesaikan 10 modul skill pengembangan digital', category: 'LongTerm', isCompleted: false }
    ];
  });
  const [journalSummary, setJournalSummary] = useState<JournalSummaryResult | null>(() => {
    const saved = localStorage.getItem('adhd_journal_summary');
    return saved ? JSON.parse(saved) : null;
  });
  const [isSummarizingJournal, setIsSummarizingJournal] = useState(false);

  // Brain Dump Quick-Capture Area State
  const [brainDumpInput, setBrainDumpInput] = useState('');
  const [isConvertingDump, setIsConvertingDump] = useState(false);

  // ADHD Superpower stats
  const [ideasCount, setIdeasCount] = useState<number>(() => Number(localStorage.getItem('adhd_ideas_count')) || 4);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState<number>(() => Number(localStorage.getItem('adhd_total_focus')) || 45);

  // New Target Addition states
  const [newTargetTitle, setNewTargetTitle] = useState('');
  const [newTargetCategory, setNewTargetCategory] = useState<'ShortTerm' | 'LongTerm'>('ShortTerm');

  // UI Active tabs: 'dashboard' | 'mindmap' | 'techhub' | 'rewards' | 'journal_target' | 'portability'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'mindmap' | 'techhub' | 'rewards' | 'journal_target' | 'portability'>('dashboard');

  // Input states
  const [newTitle, setNewTitle] = useState('');
  const [newUrgency, setNewUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [customRewardTitle, setCustomRewardTitle] = useState('');
  const [customRewardCost, setCustomRewardCost] = useState('30');

  // AI Generator Mindmap Inputs
  const [aiSkillInput, setAiSkillInput] = useState('Desain Web Interaktif');
  const [aiLevelInput, setAiLevelInput] = useState('Beginner');
  const [isGeneratingMM, setIsGeneratingMM] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('m-1');

  // Web Tech News states
  const [techNews, setTechNews] = useState<TechNewsItem[]>([]);
  const [generalSaran, setGeneralSaran] = useState<string>('');
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsSources, setNewsSources] = useState<{ url: string; title: string }[]>([]);

  // Focus Timer States
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerPreset, setTimerPreset] = useState<number>(25); // minutes
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Focus Ambient Sound Setup
  const [ambientType, setAmbientType] = useState<'off' | 'cosmic' | 'waves'>('off');
  const ambientCtxRef = useRef<AudioContext | null>(null);
  const humOsc1Ref = useRef<OscillatorNode | null>(null);
  const humOsc2Ref = useRef<OscillatorNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);

  // Motivational quote cycle
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Trigger persistent save
  useEffect(() => {
    localStorage.setItem('adhd_uname', uName);
    localStorage.setItem('adhd_level', String(level));
    localStorage.setItem('adhd_xp', String(xp));
    localStorage.setItem('adhd_coins', String(coins));
    localStorage.setItem('adhd_streak', String(streak));
    localStorage.setItem('adhd_tasks', JSON.stringify(tasks));
    localStorage.setItem('adhd_mindmap', JSON.stringify(activeMindmap));
    localStorage.setItem('adhd_rewards', JSON.stringify(rewards));
    localStorage.setItem('adhd_notepad', notepadContent);
    localStorage.setItem('adhd_targets', JSON.stringify(targets));
    if (journalSummary) {
      localStorage.setItem('adhd_journal_summary', JSON.stringify(journalSummary));
    }
    localStorage.setItem('adhd_ideas_count', String(ideasCount));
    localStorage.setItem('adhd_total_focus', String(totalFocusMinutes));
  }, [uName, level, xp, coins, streak, tasks, activeMindmap, rewards, notepadContent, targets, journalSummary, ideasCount, totalFocusMinutes]);

  // Listen to Auth State changes and pull cloud data if exists
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setCloudStatus('syncing');
        try {
          const cloudProfile = await fetchProfileFromCloud(user.uid);
          if (cloudProfile) {
            setUName(cloudProfile.uName);
            setLevel(cloudProfile.level);
            setXp(cloudProfile.xp);
            setCoins(cloudProfile.coins);
            setStreak(cloudProfile.streak);
            setNotepadContent(cloudProfile.notepadContent);
            setIdeasCount(cloudProfile.ideasCount);
            setTotalFocusMinutes(cloudProfile.totalFocusMinutes);
            if (cloudProfile.activeMindmap) {
              setActiveMindmap(cloudProfile.activeMindmap);
            }
            if (cloudProfile.journalSummary) {
              setJournalSummary(cloudProfile.journalSummary);
            }

            const cloudTasks = await fetchTasksFromCloud(user.uid);
            if (cloudTasks && cloudTasks.length > 0) setTasks(cloudTasks);

            const cloudTargets = await fetchTargetsFromCloud(user.uid);
            if (cloudTargets && cloudTargets.length > 0) setTargets(cloudTargets);

            const cloudRewards = await fetchRewardsFromCloud(user.uid);
            if (cloudRewards && cloudRewards.length > 0) setRewards(cloudRewards);

            setCloudStatus('synced');
            triggerBanner(`☁️ Sinkronisasi berhasil! Data Anda dimuat langsung dari Cloud Database.`);
          } else {
            // New user, push current local state to cloud as backup
            await saveProfileToCloud(user.uid, {
              uName,
              level,
              xp,
              coins,
              streak,
              notepadContent,
              ideasCount,
              totalFocusMinutes,
              activeMindmap,
              journalSummary
            });
            await saveTasksToCloud(user.uid, tasks);
            await saveTargetsToCloud(user.uid, targets);
            await saveRewardsToCloud(user.uid, rewards);
            setCloudStatus('synced');
          }
        } catch (err) {
          console.error("Auth sync error: ", err);
          setCloudStatus('error');
        }
      } else {
        setCloudStatus('idle');
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync state to Cloud on changes if signed in (Auto-save)
  const syncInProgressRef = useRef(false);
  useEffect(() => {
    const autoSync = async () => {
      if (auth.currentUser && cloudStatus === 'synced' && !syncInProgressRef.current) {
        syncInProgressRef.current = true;
        try {
          await saveProfileToCloud(auth.currentUser.uid, {
            uName,
            level,
            xp,
            coins,
            streak,
            notepadContent,
            ideasCount,
            totalFocusMinutes,
            activeMindmap,
            journalSummary
          });
          // Also save lists
          await saveTasksToCloud(auth.currentUser.uid, tasks);
          await saveTargetsToCloud(auth.currentUser.uid, targets);
          await saveRewardsToCloud(auth.currentUser.uid, rewards);
        } catch (err) {
          console.error("Auto-sync failed:", err);
        } finally {
          syncInProgressRef.current = false;
        }
      }
    };
    
    // Debounce auto-sync slightly to prevent Firebase call spamming
    const timeout = setTimeout(autoSync, 4500);
    return () => clearTimeout(timeout);
  }, [uName, level, xp, coins, streak, tasks, activeMindmap, rewards, notepadContent, targets, journalSummary, ideasCount, totalFocusMinutes]);

  const triggerCloudSync = async () => {
    if (!auth.currentUser) return;
    setIsCloudSyncing(true);
    setCloudStatus('syncing');
    try {
      await saveProfileToCloud(auth.currentUser.uid, {
        uName,
        level,
        xp,
        coins,
        streak,
        notepadContent,
        ideasCount,
        totalFocusMinutes,
        activeMindmap,
        journalSummary
      });
      await saveTasksToCloud(auth.currentUser.uid, tasks);
      await saveTargetsToCloud(auth.currentUser.uid, targets);
      await saveRewardsToCloud(auth.currentUser.uid, rewards);
      setCloudStatus('synced');
      playSound('success');
      triggerBanner("☁️ Sukses menyinkronkan seluruh kemajuan ke Cloud Database!");
    } catch (err) {
      console.error(err);
      setCloudStatus('error');
      triggerBanner("❌ Gagal menyinkronkan data.");
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Handle Level Up thresholds (1000 XP per level)
  useEffect(() => {
    if (xp >= 1000) {
      playSound('levelUp');
      setLevel(prev => prev + 1);
      setXp(prev => prev - 1000);
      triggerBanner('🎉 LUAR BIASA! Level Anda meningkat! Otak Anda semakin tajam dan terlatih.');
    }
  }, [xp]);

  // Background Ambient Noise Synthesizer implementation
  useEffect(() => {
    if (ambientType === 'off') {
      stopAmbientSynth();
    } else {
      startAmbientSynth(ambientType);
    }
    return () => stopAmbientSynth();
  }, [ambientType]);

  // Focus Timer interval engine
  useEffect(() => {
    let intervalId: any = null;
    if (isTimerRunning) {
      intervalId = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(prev => prev - 1);
        } else if (timerSeconds === 0) {
          if (timerMinutes > 0) {
            setTimerMinutes(prev => prev - 1);
            setTimerSeconds(59);
          } else {
            // Timer Finished! Celebrate with rewards!
            clearInterval(intervalId);
            setIsTimerRunning(false);
            handleFocusFinished();
          }
        }
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isTimerRunning, timerMinutes, timerSeconds]);

  // Load tech news on mountain first action
  useEffect(() => {
    loadTechNews();
    setQuoteIndex(Math.floor(Math.random() * MOTIVATION_QUOTES.length));
  }, []);

  const triggerBanner = (message: string) => {
    setShowNotification(message);
    setTimeout(() => {
      setShowNotification(null);
    }, 6000);
  };

  const handleFocusFinished = () => {
    playSound('levelUp');
    const xpGain = timerPreset * 5; // e.g. 25 minutes timer = 125 XP
    const coinsGain = Math.round(timerPreset * 0.8); // 25 minutes = 20 Coins
    setXp(prev => prev + xpGain);
    setCoins(prev => prev + coinsGain);
    setTotalFocusMinutes(prev => prev + timerPreset);
    triggerBanner(`🎯 SELESAI FOKUS! Anda menyelesaikan sesi ${timerPreset} menit! Mendapatkan +${xpGain} XP dan +${coinsGain} Koin.`);
    setTimerMinutes(timerPreset);
    setTimerSeconds(0);
  };

  const startAmbientSynth = (type: 'cosmic' | 'waves') => {
    try {
      stopAmbientSynth();
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      ambientCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.05, ctx.currentTime); // soft volume limit
      ambientGainRef.current = masterGain;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(type === 'cosmic' ? 110 : 160, ctx.currentTime);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(type === 'cosmic' ? 55 : 65, ctx.currentTime); // Low A / Low C

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(type === 'cosmic' ? 110 : 130, ctx.currentTime);

      // Low LFO wave sweep to avoid static hum boredom
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(type === 'cosmic' ? 0.08 : 0.2, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(type === 'cosmic' ? 0.015 : 0.04, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(masterGain.gain);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      lfo.start();

      humOsc1Ref.current = osc1;
      humOsc2Ref.current = osc2;
    } catch (e) {
      console.warn("AudioContext ambient block:", e);
    }
  };

  const stopAmbientSynth = () => {
    try {
      if (humOsc1Ref.current) {
        humOsc1Ref.current.stop();
        humOsc1Ref.current.disconnect();
        humOsc1Ref.current = null;
      }
      if (humOsc2Ref.current) {
        humOsc2Ref.current.stop();
        humOsc2Ref.current.disconnect();
        humOsc2Ref.current = null;
      }
      if (ambientGainRef.current) {
        ambientGainRef.current.disconnect();
        ambientGainRef.current = null;
      }
      if (ambientCtxRef.current) {
        ambientCtxRef.current.close();
        ambientCtxRef.current = null;
      }
    } catch (e) {
      console.log(e);
    }
  };

  // Add customized tasks
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    playSound('click');
    let rewardsXp = 50;
    let rewardsCoins = 10;

    if (newUrgency === 'Medium') {
      rewardsXp = 75;
      rewardsCoins = 15;
    } else if (newUrgency === 'High') {
      rewardsXp = 100;
      rewardsCoins = 20;
    }

    const newTask: Task = {
      id: 'custom-' + Date.now(),
      title: newTitle.trim(),
      urgency: newUrgency,
      xpReward: rewardsXp,
      coinReward: rewardsCoins,
      isCompleted: false,
      notes: 'Langkah mini dibuat oleh Anda sendiri.'
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTitle('');
    triggerBanner(`📝 Tugas "${newTask.title}" berhasil ditambahkan!`);
  };

  // Complete a task with sound & points
  const handleToggleTask = (id: string) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextState = !t.isCompleted;
        if (nextState) {
          // Play celebration
          playSound('success');
          setXp(p => p + t.xpReward);
          setCoins(c => c + t.coinReward);
          triggerBanner(`🎉 TUGAS SELESAI Dopamine Boost! Anda mendapat +${t.xpReward} XP dan +${t.coinReward} Koin.`);
        } else {
          // Unchecked: subtract points
          playSound('click');
          setXp(p => Math.max(0, p - t.xpReward));
          setCoins(c => Math.max(0, c - t.coinReward));
        }
        return { ...t, isCompleted: nextState };
      }
      return t;
    });
    setTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    playSound('click');
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Focus presets
  const handlePresetChange = (minutes: number) => {
    playSound('click');
    setTimerPreset(minutes);
    setTimerMinutes(minutes);
    setTimerSeconds(0);
    setIsTimerRunning(false);
  };

  // Generate complete skill Mind Map through Node server (Gemini API)
  const handleGenerateMindmap = async () => {
    if (!aiSkillInput.trim()) return;
    playSound('click');
    setIsGeneratingMM(true);

    try {
      const response = await fetch('/api/gemini/generate-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName: aiSkillInput.trim(), level: aiLevelInput })
      });

      if (!response.ok) {
        throw new Error('Gagal memproses pembuatan mind map dari server.');
      }

      const data = await response.json();
      if (data && data.nodes) {
        setActiveMindmap({
          title: data.title || `Peta Belajar ${aiSkillInput}`,
          nodes: data.nodes,
          completedNodes: []
        });
        setSelectedNodeId(data.nodes[0]?.id || null);
        triggerBanner(`🗺️ AI Mindmap Berhasil dibuat untuk skill "${aiSkillInput}"!`);
      }
    } catch (err: any) {
      console.error(err);
      triggerBanner('🛑 Gagal menghasilkan mind map lewat AI. Mode Fallback diaktifkan.');
    } finally {
      setIsGeneratingMM(false);
    }
  };

  // Complete a Mindmap node
  const handleCompleteNode = (nodeId: string) => {
    const node = activeMindmap.nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (activeMindmap.completedNodes.includes(nodeId)) {
      // already completed
      return;
    }

    playSound('success');
    const updatedCompleted = [...activeMindmap.completedNodes, nodeId];
    setActiveMindmap(prev => ({
      ...prev,
      completedNodes: updatedCompleted
    }));

    setXp(prev => prev + node.xpReward);
    setCoins(prev => prev + Math.ceil(node.xpReward / 5)); // 20% coin conversion
    triggerBanner(`🚀 LEVEL UP SKILL! Menguasai topik "${node.label}"! Mendapatkan +${node.xpReward} XP dan bonus koin.`);
  };

  // Fetch News from Backend
  const loadTechNews = async () => {
    setIsLoadingNews(true);
    try {
      const res = await fetch('/api/gemini/tech-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      const newsItems = data.news || data.fallbackData?.news || [];
      const suggestions = data.generalSaran || data.fallbackData?.generalSaran || '';
      const sourcesList = data.sources || [];

      setTechNews(newsItems);
      setGeneralSaran(suggestions);
      setNewsSources(sourcesList);
    } catch (e) {
      console.error("Gagal memuat berita teknologi baru:", e);
    } finally {
      setIsLoadingNews(false);
    }
  };

  // Convert Tech News item to an immediate quest/task
  const handleAdoptTechQuest = (newsItem: TechNewsItem) => {
    playSound('click');
    const targetTitle = `Eksperimen Tren: ${newsItem.title}`;
    
    // Check if task already exists
    if (tasks.some(t => t.title === targetTitle)) {
      triggerBanner('📌 Tugas ini sudah ada di papan misi Anda!');
      return;
    }

    const newQuest: Task = {
      id: 'tech-' + Date.now(),
      title: targetTitle,
      urgency: 'High',
      xpReward: 150,
      coinReward: 25,
      isCompleted: false,
      notes: `Saran ADHD-friendly harian: ${newsItem.adhdFriendlyStep}`
    };

    setTasks(prev => [newQuest, ...prev]);
    triggerBanner(`🌟 Misi "${newQuest.title}" dimasukkan ke Dasbor Kontrol Harian! +250 XP reward.`);
    setActiveTab('dashboard'); // take them there directly
  };

  // Settle points for reward
  const handleClaimReward = (reward: RewardItem) => {
    if (coins < reward.cost) {
      triggerBanner('❌ Koin Anda belum mencukupi! Ayo semangat selesaikan tugas harian.');
      return;
    }

    playSound('redeem');
    setCoins(prev => prev - reward.cost);
    triggerBanner(`🎁 BERHASIL KLAIM! "${reward.title}" berhak dinikmati sekarang. Kurai -${reward.cost} Koin.`);
  };

  // Custom User Reward Builder
  const handleAddCustomReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRewardTitle.trim() || !customRewardCost) return;

    playSound('click');
    const costNum = Math.abs(parseInt(customRewardCost)) || 30;
    const newReward: RewardItem = {
      id: 'custom-reward-' + Date.now(),
      title: customRewardTitle.trim(),
      cost: costNum,
      icon: 'coffee'
    };

    setRewards(prev => [...prev, newReward]);
    setCustomRewardTitle('');
    setCustomRewardCost('30');
    triggerBanner(`🎁 Penjelajah Reward baru "${newReward.title}" didaftarkan ke toko!`);
  };

  // Targets management
  const handleAddTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetTitle.trim()) return;

    playSound('click');
    const newTar: AdhdTarget = {
      id: 'tar-' + Date.now(),
      title: newTargetTitle.trim(),
      category: newTargetCategory,
      isCompleted: false
    };

    setTargets(prev => [newTar, ...prev]);
    setNewTargetTitle('');
    triggerBanner(`🎯 Target "${newTar.title}" berhasil ditambahkan!`);
  };

  const handleToggleTarget = (id: string) => {
    const updated = targets.map(t => {
      if (t.id === id) {
        const nextState = !t.isCompleted;
        if (nextState) {
          playSound('success');
          setXp(p => p + 50); // reward target completion with 50 XP
          setCoins(c => c + 10);
          triggerBanner(`🎉 Target Tercapai! +50 XP & +10 Koin Dopamin.`);
        } else {
          playSound('click');
          setXp(p => Math.max(0, p - 50));
          setCoins(c => Math.max(0, c - 10));
        }
        return { ...t, isCompleted: nextState };
      }
      return t;
    });
    setTargets(updated);
  };

  const handleDeleteTarget = (id: string) => {
    playSound('click');
    setTargets(prev => prev.filter(t => t.id !== id));
  };

  // Convert Brain Dump to Actionable Checklist Tasks
  const handleConvertBrainDump = async () => {
    if (!brainDumpInput.trim()) return;
    playSound('click');
    setIsConvertingDump(true);

    try {
      const response = await fetch('/api/gemini/braindump-converter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: brainDumpInput.trim() })
      });

      if (!response.ok) {
        throw new Error('Gagal memproses konversi dari server.');
      }

      const data = await response.json();
      if (data && data.tasks) {
        // Automatically add converted micro tasks to our main tasks state list!
        const parsedTasks: Task[] = data.tasks.map((t: any, idx: number) => ({
          id: 'dump-task-' + Date.now() + '-' + idx,
          title: t.title,
          urgency: t.complexity === 'Tinggi' ? 'High' : t.complexity === 'Sedang' ? 'Medium' : 'Low',
          xpReward: t.xp || 75,
          coinReward: Math.ceil((t.xp || 75) / 5),
          isCompleted: false,
          notes: t.reason || 'Hasil terjemahan curahan isi kepala'
        }));

        setTasks(prev => [...parsedTasks, ...prev]);
        setBrainDumpInput('');
        setIdeasCount(prev => prev + 1); // Track ADHD Superpower idea statistic!
        triggerBanner(`🧠 Konversi Berhasil! ${parsedTasks.length} tugas mikro baru ditambahkan ke Dasbor harian Anda!`);
      }
    } catch (err: any) {
      console.error(err);
      triggerBanner('🛑 Gagal memproses limpahan pikiran. Silakan coba kembali.');
    } finally {
      setIsConvertingDump(false);
    }
  };

  // Generate AI Summarization for daily journal notes & goals
  const handleGenerateJournalSummary = async () => {
    if (!notepadContent.trim() && targets.length === 0) {
      triggerBanner('⚠️ Isi catatan harian atau selesaikan beberapa target mimpimu terlebih dahulu!');
      return;
    }

    playSound('click');
    setIsSummarizingJournal(true);

    try {
      // Prepare targets representation
      const activeTargetsStr = targets.map(t => `[${t.isCompleted ? 'Selesai' : 'Belum Selesai'}] (${t.category === 'ShortTerm' ? 'Harian' : 'Jangka Panjang'}) ${t.title}`).join('\n');

      const response = await fetch('/api/gemini/summarize-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notepadContent.trim(), targets: activeTargetsStr })
      });

      if (!response.ok) {
        throw new Error('Gagal menyusun evaluasi harian dari server.');
      }

      const data = await response.json();
      if (data) {
        setJournalSummary(data);
        playSound('levelUp');
        triggerBanner('📔 AI Berhasil menyusun analisis evaluasi & saran kognitif harian Anda!');
      }
    } catch (e: any) {
      console.error(e);
      triggerBanner('🛑 Terjadi kendala saat menyusun kesusasteraan harian lewat server.');
    } finally {
      setIsSummarizingJournal(false);
    }
  };

  // SVG Mindmap tree layouts calculations
  const computePositions = (nodes: MindmapNode[]) => {
    const roots = nodes.filter(n => !n.parentId);
    const positions: { [key: string]: { x: number; y: number } } = {};
    
    if (roots.length === 0 && nodes.length > 0) {
      roots.push(nodes[0]);
    }

    // Set roots horizontally spaced out
    roots.forEach((root, idx) => {
      positions[root.id] = { 
        x: 350 + (idx * 200) - ((roots.length - 1) * 100), 
        y: 60 
      };
    });

    const visited = new Set(roots.map(r => r.id));
    let layerQueue = [...roots];
    let depth = 1;

    while (layerQueue.length > 0 && depth < 20) {
      const nextQueue: MindmapNode[] = [];
      
      layerQueue.forEach((parent) => {
        const children = nodes.filter(n => n.parentId === parent.id);
        const parentPos = positions[parent.id] || { x: 350, y: 60 };

        children.forEach((child, cIdx) => {
          if (!visited.has(child.id)) {
            visited.add(child.id);
            const totalChildren = children.length;
            
            // horizontal spread logic below parents
            const spreadWidth = 260;
            const offsetX = totalChildren > 1 
              ? ((cIdx / (totalChildren - 1)) - 0.5) * spreadWidth 
              : 0;

            positions[child.id] = {
              x: parentPos.x + offsetX,
              y: parentPos.y + 110
            };
            nextQueue.push(child);
          }
        });
      });

      layerQueue = nextQueue;
      depth++;
    }

    // Assign fallback for orphan nodes
    nodes.forEach((node) => {
      if (!positions[node.id]) {
        positions[node.id] = {
          x: Math.random() * 500 + 100,
          y: Math.random() * 300 + 150
        };
      }
    });

    return positions;
  };

  const nodePositions = computePositions(activeMindmap.nodes);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 font-sans antialiased selection:bg-amber-100 selection:text-amber-900 pb-12">
      
       {/* Dynamic Dopamine Banner Notification */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 max-w-sm sm:max-w-md bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-amber-400/40 animate-bounce flex items-start gap-3">
          <div className="p-2 bg-amber-500 rounded-lg text-slate-900 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-amber-300">Notifikasi Fokus</p>
            <p className="text-sm mt-0.5 text-slate-200">{showNotification}</p>
          </div>
          <button 
            onClick={() => setShowNotification(null)}
            className="text-slate-400 hover:text-white ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Decorative Outer Aura: Zero tech-larp / purely aesthetic minimal header */}
      <div className="border-b border-orange-100 bg-[#FAF6F0]">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 rounded-2xl shadow-md text-white">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                FokusADHD <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-semibold">Kontrol Harian</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5 font-sans">Sistem Gamifikasi Tugas, Fokus, AI Mindmap, & Saran Teknologi Dunia</p>
            </div>
          </div>

          {/* User Status Profile Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-2xl border border-orange-100 shadow-sm w-full md:w-auto">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 font-bold text-lg border border-orange-200 shrink-0">
                {level}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  {isEditingName ? (
                    <input 
                      type="text" 
                      value={uName} 
                      onChange={(e) => setUName(e.target.value)}
                      onBlur={() => setIsEditingName(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                      className="text-sm font-semibold border-b border-orange-400 focus:outline-none bg-slate-50 px-1 rounded max-w-[120px]"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                      {uName}
                      <button onClick={() => setIsEditingName(true)} className="p-0.5 hover:bg-slate-100 rounded">
                        <Edit2 className="w-3 h-3 text-slate-400" />
                      </button>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">LEVEL PENJELAJAH</p>
              </div>
            </div>

            <div className="hidden sm:block h-8 w-[1px] bg-slate-100" />

            {/* EXP Slider */}
            <div className="flex-1 min-w-[120px] sm:w-32">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-0.5">
                <span>XP: {xp}/1000</span>
                <span>Level Up</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${(xp/1000)*100}%` }} />
              </div>
            </div>

            <div className="hidden sm:block h-8 w-[1px] bg-slate-100" />

            <div className="flex items-center gap-2 justify-between">
              {/* Coins Stat */}
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/30 flex-1 sm:flex-initial">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
                <div className="text-left">
                  <p className="text-xs font-bold text-amber-800">{coins} Koin</p>
                  <p className="text-[9px] text-amber-600/80 font-semibold tracking-wider">REWARD BANK</p>
                </div>
              </div>

              {/* Streak Counter */}
              <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-2.5 rounded-xl border border-orange-200/30 flex-1 sm:flex-initial justify-center">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-400 animate-pulse" />
                <div className="text-left">
                  <p className="text-xs font-bold text-orange-850 whitespace-nowrap">{streak} hari</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Banner & Motivation booster */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-100/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span className="text-2xl shrink-0">💡</span>
            <p className="italic text-slate-700 text-xs md:text-sm">
              "{MOTIVATION_QUOTES[quoteIndex]}"
            </p>
          </div>
          <button 
            onClick={() => {
              playSound('success');
              setQuoteIndex((prev) => (prev + 1) % MOTIVATION_QUOTES.length);
            }}
            className="text-[10px] bg-white hover:bg-orange-100 border border-orange-200 text-orange-800 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap shadow-sm transition-all flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-orange-500" /> Dopamine Booster (+Sound)
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex overflow-x-auto scrollbar-hide gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/40">
          <button
            onClick={() => { playSound('click'); setActiveTab('dashboard'); }}
            className={`flex-1 min-w-[120px] text-center py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-150 flex items-center justify-center gap-2 ${
              activeTab === 'dashboard' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Target className="w-4 h-4 text-amber-500" />
            Dasbor & Sesi Fokus
          </button>
          
          <button
            onClick={() => { playSound('click'); setActiveTab('mindmap'); }}
            className={`flex-1 min-w-[120px] text-center py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-150 flex items-center justify-center gap-2 ${
              activeTab === 'mindmap' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Brain className="w-4 h-4 text-purple-500" />
            AI Mindmapping
          </button>

          <button
            onClick={() => { playSound('click'); setActiveTab('techhub'); }}
            className={`flex-1 min-w-[120px] text-center py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-150 flex items-center justify-center gap-2 ${
              activeTab === 'techhub' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-500" />
            Tren Dunia & AI Suggest
          </button>

          <button
            onClick={() => { playSound('click'); setActiveTab('rewards'); }}
            className={`flex-1 min-w-[120px] text-center py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-150 flex items-center justify-center gap-2 ${
              activeTab === 'rewards' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Coffee className="w-4 h-4 text-emerald-500" />
            Reward Shop
          </button>

          <button
            onClick={() => { playSound('click'); setActiveTab('journal_target'); }}
            className={`flex-1 min-w-[124px] text-center py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-150 flex items-center justify-center gap-2 ${
              activeTab === 'journal_target' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <FileText className="w-4 h-4 text-rose-500" />
            Notepad & Target ADHD
          </button>

          <button
            onClick={() => { playSound('click'); setActiveTab('portability'); }}
            className={`flex-1 min-w-[140px] text-center py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-150 flex items-center justify-center gap-2 ${
              activeTab === 'portability' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Cloud className="w-4 h-4 text-sky-500" />
            PC & HP Sync Core
          </button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        
        {/* TAB 1: DASHBOARD & FOCUS TIMER */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: ADHD Task Manager (Index 7) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-orange-100 shadow-sm flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  📝 Misi Mikro Harian <span className="text-xs bg-orange-100 text-orange-850 px-2.5 py-0.5 rounded-full font-semibold">{tasks.filter(t => !t.isCompleted).length} Tersisa</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Pekerjaan besar menakuti otak ADHD. Kami menyederhanakan tugas Anda menjadi misi mikro dengan dopamin koin instan saat dicentang!
                </p>
              </div>

              {/* Task Adding Form */}
              <form onSubmit={handleAddTask} className="flex flex-col md:flex-row gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ketik tugas mikro harianmu di sini..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 font-medium"
                />

                <div className="flex gap-2">
                  <select 
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="Low">Santai (+40 XP)</option>
                    <option value="Medium">Sedang (+75 XP)</option>
                    <option value="High">Penting (+100 XP)</option>
                  </select>

                  <button 
                    type="submit"
                    className="bg-slate-950 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Tambah
                  </button>
                </div>
              </form>

              {/* Task List items */}
              <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                {tasks.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-sm font-semibold text-slate-400">Semua Misi Bersih!</p>
                    <p className="text-xs text-slate-400/80 mt-1">Tambahkan misi di atas untuk mengumpulkan koin & menaikkan level skill.</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`flex items-start justify-between p-4 rounded-2xl border transition-all duration-150 ${
                        task.isCompleted 
                          ? 'bg-slate-50/75 border-slate-200 opacity-65' 
                          : 'bg-white border-orange-100 hover:border-amber-200 shadow-sm'
                      }`}
                    >
                      <div className="flex gap-3 items-start flex-1 mr-2">
                        <button 
                          onClick={() => handleToggleTask(task.id)}
                          className={`mt-1 w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            task.isCompleted 
                              ? 'bg-amber-500 border-amber-500 text-white' 
                              : 'border-slate-300 hover:border-amber-400 bg-white'
                          }`}
                        >
                          {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        
                        <div className="flex-1">
                          <p className={`text-xs md:text-sm font-semibold leading-relaxed ${task.isCompleted ? 'line-through text-slate-400 font-normal' : 'text-slate-850'}`}>
                            {task.title}
                          </p>
                          {task.notes && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{task.notes}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                              task.urgency === 'High' 
                                ? 'bg-rose-50 text-rose-600' 
                                : task.urgency === 'Medium' 
                                ? 'bg-amber-50 text-amber-700' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {task.urgency === 'High' ? 'Prioritas' : task.urgency === 'Medium' ? 'Rata-rata' : 'Ringan'}
                            </span>
                            <span className="text-[10px] text-slate-50c font-bold flex items-center gap-0.5 text-amber-600">
                              🪙 +{task.coinReward} Koin
                            </span>
                            <span className="text-[10px] text-slate-50c font-bold flex items-center gap-0.5 text-orange-600">
                              ⚡ +{task.xpReward} XP
                            </span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-350 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-all self-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Deep Focus Timer & Ambient Noise Engine */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Pomodoro Focus Block */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-md border-t-2 border-amber-400 flex flex-col items-center justify-center gap-5 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-radial-gradient from-transparent to-black/30 pointer-events-none" />
                
                <div className="relative z-10">
                  <span className="text-[10px] tracking-widest font-extrabold text-amber-400 bg-amber-950/85 border border-amber-500/20 px-3 py-1 rounded-full uppercase">
                    ⏱️ Pelacak Fokus ADHD
                  </span>
                  <h3 className="text-sm font-semibold text-slate-300 mt-2">Kunci Distrasi, Nyalakan Suara Tenang</h3>
                </div>

                {/* Big Visual Clock */}
                <div className="w-44 h-44 rounded-full border-4 border-slate-700 flex flex-col items-center justify-center relative z-10 bg-slate-950/60 shadow-inner">
                  <span className="text-4xl font-extrabold tracking-tight font-mono text-amber-300">
                    {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                    {isTimerRunning ? 'Sesi Dimulai' : 'Siap Berjalan'}
                  </span>
                </div>

                {/* Interval presets selection */}
                <div className="flex flex-wrap gap-1.5 justify-center relative z-10 w-full">
                  <button 
                    onClick={() => handlePresetChange(10)} 
                    className={`text-[10px] px-3 py-1.5 rounded-xl font-bold transition-all ${
                      timerPreset === 10 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    🚀 Dopamin Sprint (10m)
                  </button>
                  <button 
                    onClick={() => handlePresetChange(25)} 
                    className={`text-[10px] px-3 py-1.5 rounded-xl font-bold transition-all ${
                      timerPreset === 25 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    ⏳ Pomodoro (25m)
                  </button>
                  <button 
                    onClick={() => handlePresetChange(45)} 
                    className={`text-[10px] px-3 py-1.5 rounded-xl font-bold transition-all ${
                      timerPreset === 45 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    🌌 Deep Focus (45m)
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 relative z-10">
                  <button 
                    onClick={() => {
                      playSound('click');
                      setIsTimerRunning(!isTimerRunning);
                    }}
                    className={`px-6 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
                      isTimerRunning 
                        ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                        : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                    }`}
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="w-4 h-4 fill-white text-white" /> Jeda Timer
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-slate-950 text-slate-950" /> Mulai Fokus
                      </>
                    )}
                  </button>

                  <button 
                    onClick={() => {
                      playSound('click');
                      setIsTimerRunning(false);
                      setTimerMinutes(timerPreset);
                      setTimerSeconds(0);
                    }}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 text-slate-300 transition-all"
                    title="Ulangi Timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Synthesized Pink Ambient Noise Control panel */}
              <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    🔊 Sound Block Kebisingan (Synthesizer)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Cocok untuk menutup distraksi suara AC, bising konstruksi, atau obrolan kosan. Dihasilkan langsung dari algoritma browser web Anda.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => { playSound('click'); setAmbientType('off'); }}
                    className={`py-2 px-3 rounded-2xl text-[10px] font-bold border transition-all flex flex-col items-center justify-center gap-1.5 ${
                      ambientType === 'off' 
                        ? 'bg-slate-950 border-slate-900 text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/60'
                    }`}
                  >
                    <VolumeX className="w-4 h-4" /> Tanpa Suara
                  </button>

                  <button 
                    onClick={() => { playSound('click'); setAmbientType('cosmic'); }}
                    className={`py-2 px-3 rounded-2xl text-[10px] font-bold border transition-all flex flex-col items-center justify-center gap-1.5 ${
                      ambientType === 'cosmic' 
                        ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/60'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" /> Cosmic Hum
                  </button>

                  <button 
                    onClick={() => { playSound('click'); setAmbientType('waves'); }}
                    className={`py-2 px-3 rounded-2xl text-[10px] font-bold border transition-all flex flex-col items-center justify-center gap-1.5 ${
                      ambientType === 'waves' 
                        ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/60'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" /> Wave Hum
                  </button>
                </div>

                {ambientType !== 'off' && (
                  <p className="text-[10px] bg-amber-50 border border-amber-200/50 text-amber-800 p-2.5 rounded-xl font-medium animate-pulse">
                    🔊 Synthesizer Aktif: Memutar gelombang penutup frekuensi untuk merangsang dopamin fokus harian Anda.
                  </p>
                )}
              </div>

              {/* Tips Section */}
              <div className="bg-amber-50/60 p-4 rounded-3xl border border-amber-200/40">
                <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" /> Tips ADHD: Pelacak Jeda Sesi
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Setelah timer fokus Anda selesai, paksa diri Anda untuk rehat selama 3-5 menit (peregangan tubuh, minum air). Hindari mengecek media sosial saat jeda agar momentum fokus tidak hilang.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: AI SKILL MINDMAPPING */}
        {activeTab === 'mindmap' && (
          <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm flex flex-col gap-6">
            
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  🧠 AI Skill Leveling & Mindmapping Tree
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ketik skill apa saja (misal: "Database", "Speaking", "Public Relation") dan biarkan Gemini AI menyusun program belajar terstruktur dalam kepingan kecil agar pikiran Anda tidak ketakutan mempelajari skill baru!
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <input 
                  type="text"
                  value={aiSkillInput}
                  onChange={(e) => setAiSkillInput(e.target.value)}
                  placeholder="Ketik nama Skill..."
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-400 flex-1 md:w-44"
                />

                <select
                  value={aiLevelInput}
                  onChange={(e) => setAiLevelInput(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-semibold focus:outline-none"
                >
                  <option value="Beginner">Pemula (Beginner)</option>
                  <option value="Intermediate">Menengah (Intermediate)</option>
                  <option value="Advanced">Ahli (Advanced)</option>
                </select>

                <button
                  onClick={handleGenerateMindmap}
                  disabled={isGeneratingMM}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm inline-flex whitespace-nowrap"
                >
                  {isGeneratingMM ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Hasilkan lewat AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
                      Buat Rencana AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mindmap visual representation block */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
              
              {/* Interactive Svg tree layout (Cols 8) */}
              <div className="lg:col-span-8 bg-slate-50 border border-slate-200 rounded-3xl p-4 overflow-auto scrollbar-hide relative select-none flex flex-col items-center justify-center min-h-[380px]">
                
                {activeMindmap.nodes.length > 0 && (
                  <div className="lg:hidden absolute top-3 left-3 bg-amber-500 text-slate-950 text-[9px] font-bold px-2.5 py-1 rounded-full shadow-md z-30 pointer-events-none animate-bounce">
                    ↔️ Geser mendatar untuk melihat semua simpul belajar
                  </div>
                )}

                {/* Visual grid behind */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,#fafafb_5%,transparent_5%),linear-gradient(-45deg,#fafafb_5%,transparent_5%)] bg-[size:24px_24px] pointer-events-none opacity-40" />

                {activeMindmap.nodes.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-sm font-semibold text-slate-400">Belum ada peta belajar.</p>
                    <p className="text-xs text-slate-400 mt-1">Ketik skill di kolom kanan atas untuk memproses peta visual.</p>
                  </div>
                ) : (
                  <div className="relative w-[760px] h-[520px]">
                    {/* SVG Connector Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {activeMindmap.nodes.map((node) => {
                        if (!node.parentId) return null;
                        const start = nodePositions[node.parentId];
                        const end = nodePositions[node.id];
                        if (!start || !end) return null;

                        const isCompleted = activeMindmap.completedNodes.includes(node.id) &&
                                            activeMindmap.completedNodes.includes(node.parentId);

                        return (
                          <g key={`link-${node.id}`}>
                            {/* Smooth path curves */}
                            <path
                              d={`M ${start.x} ${start.y} C ${start.x} ${(start.y + end.y) / 2}, ${end.x} ${(start.y + end.y) / 2}, ${end.x} ${end.y}`}
                              fill="none"
                              stroke={isCompleted ? '#F59E0B' : '#CBD5E1'}
                              strokeWidth={isCompleted ? '3' : '2'}
                              strokeDasharray={isCompleted ? 'none' : '4 4'}
                              className="transition-all duration-305"
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Nodes HTML Buttons Overlay */}
                    {activeMindmap.nodes.map((node) => {
                      const pos = nodePositions[node.id] || { x: 350, y: 50 };
                      const isCompleted = activeMindmap.completedNodes.includes(node.id);
                      const isSelected = selectedNodeId === node.id;
                      const hasCompletedParents = !node.parentId || activeMindmap.completedNodes.includes(node.parentId);

                      return (
                        <button
                          key={node.id}
                          onClick={() => { playSound('click'); setSelectedNodeId(node.id); }}
                          style={{ left: pos.x - 70, top: pos.y - 25 }}
                          className={`absolute w-[140px] h-[55px] p-2 rounded-xl text-center leading-tight flex flex-col justify-center items-center font-bold text-xs shadow-md border transition-all duration-200 ${
                            isCompleted 
                              ? 'bg-amber-500 border-amber-600 text-white hover:bg-amber-600' 
                              : isSelected
                              ? 'bg-slate-900 border-slate-900 text-white ring-4 ring-purple-100'
                              : 'bg-white border-slate-250 text-slate-800 hover:border-purple-300'
                          }`}
                        >
                          <span className="truncate max-w-[124px]">{node.label}</span>
                          <span className={`${isCompleted ? 'text-amber-100' : 'text-slate-450'} text-[9px] mt-0.5 font-semibold block`}>
                            {isCompleted ? '✅ Selesai' : `🪙 +${node.xpReward} XP`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right panel: Topic detailed info (Cols 4) */}
              <div className="lg:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col gap-4">
                
                {selectedNodeId && activeMindmap.nodes.find(n => n.id === selectedNodeId) ? (() => {
                  const node = activeMindmap.nodes.find(n => n.id === selectedNodeId)!;
                  const isCompleted = activeMindmap.completedNodes.includes(node.id);

                  return (
                    <div className="flex flex-col gap-4 animate-fade-in">
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-bold">
                          Detail Milestone
                        </span>
                        {isCompleted && (
                          <span className="text-[10px] bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full font-bold">
                            Kuartal Dikuasai
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900">{node.label}</h3>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/50">
                          {node.description}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">🎯 Reward Penyelesaian</h4>
                        <div className="flex items-center gap-3 mt-1.5 bg-white p-3 rounded-xl border border-slate-200/50">
                          <div className="text-center flex-1">
                            <p className="text-sm font-bold text-orange-600">+{node.xpReward} XP</p>
                            <p className="text-[9px] text-slate-400 font-medium">Pengalaman Skill</p>
                          </div>
                          <div className="w-[1px] h-8 bg-slate-100" />
                          <div className="text-center flex-1">
                            <p className="text-sm font-bold text-amber-600">+{Math.ceil(node.xpReward / 5)} Koin</p>
                            <p className="text-[9px] text-slate-400 font-medium">Fungsi Dopamin Toko</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          📂 Langkah Aksi ADHD-Friendly:
                        </h4>
                        <div className="flex flex-col gap-1.5 mt-1.5">
                          {node.suggestedResources.map((res, i) => (
                            <div key={i} className="flex gap-2 items-start text-xs text-slate-600">
                              <span className="text-purple-500 font-bold">•</span>
                              <p className="leading-normal">{res}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {!isCompleted ? (
                        <button
                          onClick={() => handleCompleteNode(node.id)}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm mt-2"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" /> Tandai Topik Selesai!
                        </button>
                      ) : (
                        <div className="bg-emerald-50 text-emerald-800 text-xs font-semibold p-3 rounded-xl border border-emerald-250 text-center flex items-center justify-center gap-1.5">
                          ✨ Topik Sudah Anda Kuasai!
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <div className="text-center py-20 text-slate-400 self-center">
                    <p className="text-xs">Klik salah satu node di peta visual untuk melihat detail aksi di sini.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mindmap title label */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-650">Topik Terkini: {activeMindmap.title}</span>
              <span className="text-xs bg-slate-200 text-slate-700 px-3 py-1 rounded-full font-bold">
                Kombinasi Selesai: {activeMindmap.completedNodes.length} / {activeMindmap.nodes.length} Node
              </span>
            </div>
            
          </div>
        )}

        {/* TAB 3: TECH NEWS & FEED SUGGESTIONS */}
        {activeTab === 'techhub' && (
          <div className="flex flex-col gap-6">

            <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    🌐 Berita & Inovasi Teknologi Dunia (World Wide Live Grounded)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Grounded langsung ke berita global melalui model Gemini. Jangan biarkan FOMO melumpuhkan Anda—berikut cara mengonsumsinya secara bijak.
                  </p>
                </div>

                <button
                  onClick={loadTechNews}
                  disabled={isLoadingNews}
                  className="bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-350 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {isLoadingNews ? 'Memperbarui...' : '🔄 Sinkronisasi AI Real-Time'}
                </button>
              </div>

              {/* General Saran Banner */}
              {generalSaran && (
                <div className="mt-5 p-4 bg-blue-50/60 border border-blue-200/50 rounded-2xl flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <h4 className="text-xs font-bold text-blue-900">Saran Harian untuk Pembelajar ADHD:</h4>
                    <p className="text-xs text-blue-850 mt-1 leading-relaxed">
                      {generalSaran}
                    </p>
                  </div>
                </div>
              )}

              {/* News cards Container */}
              {isLoadingNews ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-600">Mengambil & menyaring tren teknologi dunia...</p>
                  <p className="text-[10px] text-slate-400">Dimediasi oleh pencarian aktual Google Grounding</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {techNews.map((news) => (
                    <div 
                      key={news.id} 
                      className="bg-slate-50 hover:bg-white p-5 rounded-2xl border border-slate-205 flex flex-col justify-between hover:shadow-md transition-all group"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                            {news.category}
                          </span>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-bold text-slate-950 group-hover:text-amber-600 transition-colors">
                            {news.title}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                            {news.summary}
                          </p>
                        </div>

                        {/* Why it Matters */}
                        <div className="bg-white/60 p-3 rounded-xl border border-slate-100/50 text-[11px] text-slate-50c">
                          <span className="font-bold text-slate-700">Kenapa ini bernilai: </span> {news.whyItMatters}
                        </div>

                        {/* ADHD Friendly steps */}
                        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-[11px] text-slate-705">
                          <span className="font-bold text-amber-850">Langkah mikro belajar (15 Menit): </span> {news.adhdFriendlyStep}
                        </div>
                      </div>

                      {/* Convert into Quest task immediately! */}
                      <button
                        onClick={() => handleAdoptTechQuest(news)}
                        className="mt-4 bg-slate-900 group-hover:bg-amber-500 group-hover:text-slate-950 text-white font-bold py-2 px-3 rounded-xl text-[10px] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" /> Sanggup Pelajari! Tambahkan ke Dasbor (+Coin Reward)
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Citations references */}
              {!isLoadingNews && newsSources.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-150">
                  <h4 className="text-xs font-bold text-slate-50c flex items-center gap-1">
                    🔍 Referensi Sumber Berita Aktual:
                  </h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newsSources.map((src, idx) => (
                      <a 
                        key={idx} 
                        href={src.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium inline-flex items-center gap-1 transition-all"
                      >
                        {src.title || 'Sumber Web'} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 4: REWARD STATION SHOP */}
        {activeTab === 'rewards' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left box: Buy preset / custom rewards (Cols 8) */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-orange-100 shadow-sm flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                  ☕ Sistem Penukar Reward Mandiri (Toko Dopamin)
                </h2>
                <p className="text-xs text-slate-505 mt-1">
                  Aturan utama ADHD: Jangan menyiksa diri sendiri. Jika Anda menyelesaikan tugas di Dasbor, Anda menghasilkan Koin. Tukarkan koin tersebut di sini untuk menikmati self-reward nyata tanpa rasa bersalah sama sekali!
                </p>
              </div>

              {/* Active rewards list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards.map((reward) => (
                  <div 
                    key={reward.id} 
                    className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/50 flex items-center justify-between group hover:border-amber-300 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-center text-xl">
                        {reward.icon === 'game' ? '🎮' : reward.icon === 'social' ? '📱' : reward.icon === 'coffee' ? '☕' : reward.icon === 'food' ? '🍩' : '🛌'}
                      </div>
                      <div>
                        <h4 className="text-xs md:text-sm font-bold text-slate-900">{reward.title}</h4>
                        <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Biaya: {reward.cost} Koin</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleClaimReward(reward)}
                      disabled={coins < reward.cost}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        coins >= reward.cost 
                          ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Klaim Reward
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Custom self-reward builder (Cols 4) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Build Reward Form */}
              <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ➕ Daftarkan Reward Kustom Anda
                  </h3>
                  <p className="text-[11px] text-slate-550 mt-1">
                    Misal: "Tidur Siang 30 menit", "Beli cilok", "Nonton Anime 1 Sesi". Tentukan harga koin yang adil bagi diri Anda sendiri!
                  </p>
                </div>

                <form onSubmit={handleAddCustomReward} className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block mb-1">Nama Reward</label>
                    <input 
                      type="text" 
                      value={customRewardTitle}
                      onChange={(e) => setCustomRewardTitle(e.target.value)}
                      placeholder="Misal: Nonton anime 1 episode"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block mb-1">Harga Koin</label>
                    <input 
                      type="number" 
                      value={customRewardCost}
                      onChange={(e) => setCustomRewardCost(e.target.value)}
                      placeholder="30"
                      min="10"
                      max="500"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 font-semibold text-slate-800"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-slate-950 text-white hover:bg-slate-805 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 mt-2"
                  >
                    + Daftarkan Hadiah
                  </button>
                </form>
              </div>

              {/* ADHD Dopamine Loop explanations */}
              <div className="bg-emerald-50/60 p-4 rounded-3xl border border-emerald-200/50">
                <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                  🎁 Konsep Kontrol Dopamin ADHD
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Otak ADHD kekurangan dopamin alami. Dengan mengalasi kesenangan malas (seperti sosmed/game) di bawah koin reward, Anda melatih otot prefrontal cortex untuk melakukan tugas bernilai dulu, baru bersenang-senang kemudian!
                </p>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: NOTEPAD, TARGETS & AI SUMMARY */}
        {activeTab === 'journal_target' && (
          <div className="flex flex-col gap-6">
            
            {/* Top Row: Brain-Dump Quick-Capture (ADHD Superpower Booster) */}
            <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 p-6 rounded-3xl border border-rose-100 shadow-sm">
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="max-w-xl">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    🧠 Tempat Sampah Pikiran (ADHD Brain Dump)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Sedang merasa kewalahan (brain overload)? Ketik apa saja yang sedang berkecamuk di dalam kepala Anda secara acak (tanpa memikirkan tanda baca). AI Gemini akan memilah, merumuskan, dan menjadikannya daftar misi mikro taktis langsung ke Dasbor harian Anda!
                  </p>
                </div>
                <div className="flex items-center gap-5 bg-white/70 px-4 py-2 rounded-2xl border border-amber-200 text-right">
                  <div>
                    <p className="text-xs font-bold text-slate-700 font-mono">🧠 ADHD Stats</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      Fokus: <span className="font-extrabold text-amber-600">{totalFocusMinutes} m</span> | Ide: <span className="font-extrabold text-rose-600">{ideasCount}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 mt-4">
                <textarea
                  value={brainDumpInput}
                  onChange={(e) => setBrainDumpInput(e.target.value)}
                  placeholder="Ketik apa saja di kepalamu sekarang... (contoh: 'malam ini harus belajar github tapi pusing, pengen minum matcha, harus selesaikan modul react, terus bersihin kasur juga')"
                  className="flex-1 bg-white border border-slate-200 rounded-2xl p-3 text-xs focus:outline-none focus:border-rose-450 font-medium min-h-[90px] shadow-sm text-slate-800"
                />
                <button
                  onClick={handleConvertBrainDump}
                  disabled={isConvertingDump || !brainDumpInput.trim()}
                  className="bg-slate-950 hover:bg-slate-900 disabled:bg-slate-350 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all flex flex-col items-center justify-center gap-1.5 shadow-md w-full md:w-44 text-center hover:scale-[1.01]"
                >
                  {isConvertingDump ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Mengkristalkan...
                    </>
                  ) : (
                    <>
                      <span>✨ Rapikan Isi Kepala</span>
                      <span className="text-[9px] text-slate-400 font-normal">Kirim ke Dasbor</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Middle Section: Lined Notepad and AI Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Lined Notepad Box */}
              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-orange-100 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-rose-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                      📔 Notepad Catatan Harian <span className="text-xs text-rose-600 font-bold bg-rose-55 px-2 py-0.5 rounded-full">Bebas Hambatan</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tuliskan kemajuan, perasaan, hambatan, atau jurnal refleksi digital hari ini.</p>
                  </div>

                  {/* Helpers template buttons */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        playSound('click');
                        setNotepadContent(prev => prev + (prev ? '\n\n' : '') + '💡 IDE BARU:\n- \n- \n- ');
                      }}
                      className="text-[9px] bg-[#FAF8F5] border border-orange-100 text-slate-600 font-bold px-2.5 py-1 rounded-xl hover:bg-orange-50 transition-all"
                    >
                      💡 Temp Ide
                    </button>
                    <button
                      onClick={() => {
                        playSound('click');
                        setNotepadContent(prev => prev + (prev ? '\n\n' : '') + '✍️ REFLEKSI PRODUKTIVITAS HARI INI:\n- Hambatan:\n- Kemajuan kecil:\n- Tingkat Energi: ');
                      }}
                      className="text-[9px] bg-[#FAF8F5] border border-orange-100 text-slate-600 font-bold px-2.5 py-1 rounded-xl hover:bg-orange-50 transition-all"
                    >
                      ✍️ Temp Refleksi
                    </button>
                  </div>
                </div>

                {/* Simulated Lined Paper Textarea */}
                <div className="relative">
                  <textarea
                    value={notepadContent}
                    onChange={(e) => setNotepadContent(e.target.value)}
                    placeholder="Tulis sesukamu di sini... Otak ADHD berhak mengekspresikan apapun secara acak."
                    style={{
                      backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px)',
                      backgroundSize: '100% 2 text-line',
                      minHeight: '340px'
                    }}
                    className="w-full bg-[#FAF8F5]/40 border border-orange-100/40 rounded-2xl p-4 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-200 text-slate-800 line-height-[1.8rem] min-h-[340px] shadow-inner"
                  />
                  {notepadContent && (
                    <span className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-mono">
                      {notepadContent.length} karakter
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateJournalSummary}
                    disabled={isSummarizingJournal}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-250 text-slate-950 font-extrabold py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSummarizingJournal ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        AI Sedang Menyimpulkan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
                        Buat Kesimpulan Catatan Harian (AI Summarize)
                      </>
                    )}
                  </button>
                  
                  {journalSummary && (
                    <button
                      onClick={() => {
                        playSound('click');
                        setJournalSummary(null);
                        localStorage.removeItem('adhd_journal_summary');
                      }}
                      className="px-4 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 text-xs font-bold text-slate-500"
                    >
                      Reset AI
                    </button>
                  )}
                </div>
              </div>

              {/* AI Evaluator Output Panel */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Result box wrapper */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl min-h-[460px] flex flex-col justify-between">
                  {journalSummary ? (
                    <div className="flex flex-col gap-4">
                      
                      {/* Header summary of evaluation */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] tracking-wider uppercase font-extrabold text-amber-400 bg-amber-950/85 px-3 py-1 rounded-md border border-amber-500/20">
                          🤖 Analisis Kognitif AI
                        </span>
                        
                        {/* Stress alert indicator pill */}
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          journalSummary.burnoutLevel.toLowerCase().includes('tinggi') 
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800' 
                            : journalSummary.burnoutLevel.toLowerCase().includes('sedang')
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        }`}>
                          {journalSummary.burnoutLevel}
                        </span>
                      </div>

                      {/* AI main bullet motivation */}
                      <div className="mt-2 text-left">
                        <h4 className="text-xs font-extrabold text-orange-400 tracking-wider">🌟 KESIMPULAN HARI INI</h4>
                        <p className="text-xs text-slate-350 mt-1 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/80 font-medium whitespace-pre-wrap">
                          {journalSummary.bulletSummary}
                        </p>
                      </div>

                      {/* Achievements found in note */}
                      <div className="text-left">
                        <h4 className="text-xs font-extrabold text-orange-400 tracking-wider">🏆 KEMAJUAN UTAMA</h4>
                        <div className="flex flex-col gap-1.5 mt-2">
                          {journalSummary.achievements.map((ach, idx) => (
                            <div key={idx} className="flex gap-2 items-start text-xs text-slate-205">
                              <span className="text-amber-500 font-bold">✓</span>
                              <p className="leading-relaxed font-semibold">{ach}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Therapeutic ADHD Advice for the next day */}
                      <div className="mt-2 pt-3 border-t border-slate-800/40 text-left">
                        <h4 className="text-xs font-extrabold text-rose-400 tracking-wider flex items-center gap-1.5">
                          🧘 STRATEGI SEHAT ADHD
                        </h4>
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed italic bg-rose-950/20 p-3 rounded-xl border border-rose-900/20">
                          {journalSummary.adhdSaran}
                        </p>
                      </div>

                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center my-auto gap-4 p-4">
                      <div className="w-14 h-14 bg-slate-800 rounded-3xl flex items-center justify-center text-2xl border border-slate-700">
                        🤖
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-200">Asisten Refleksi ADHD AI</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mt-2 max-w-xs">
                          Tuliskan refleksi harian atau target Anda di Notepad kiri, lantas klik tombol kuning. Gemini AI akan menganalisis stres kognitif dan menyusun motivasi terapeutik bagi penakluk neurodiverse!
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Footer credit */}
                  <div className="text-[9px] text-slate-550 text-center mt-4 border-t border-slate-900/80 pt-2 font-mono">
                    Grounded with Gemini Cognitive Engine v3.5
                  </div>
                </div>

              </div>
            </div>

            {/* Target List (Catatan & target harian) */}
            <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm flex flex-col gap-6 mt-2">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-orange-50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    🎯 Papan Pengikat Fokus (Daftar Target Belajar)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Otak ADHD menyukai visualisasi target. Daftarkan target jangka pendek dan panjang Anda agar mata tetap sinkron dengan mimpi besar! Setiap target yang dicapai memberikan +50 XP koin instan harian.
                  </p>
                </div>

                {/* Add New Target Form */}
                <form onSubmit={handleAddTarget} className="flex gap-2 w-full md:w-auto bg-slate-50 p-2 rounded-xl">
                  <input
                    type="text"
                    value={newTargetTitle}
                    onChange={(e) => setNewTargetTitle(e.target.value)}
                    placeholder="Tambah target impian..."
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-rose-400 flex-1 md:w-48 text-slate-800"
                  />
                  <select
                    value={newTargetCategory}
                    onChange={(e) => setNewTargetCategory(e.target.value as any)}
                    className="bg-white border border-slate-200 text-xs text-slate-700 px-2 rounded-lg focus:outline-none"
                  >
                    <option value="ShortTerm">Harian (Pendek)</option>
                    <option value="LongTerm">Besar (Panjang)</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-slate-950 hover:bg-slate-850 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all"
                  >
                    + Target
                  </button>
                </form>
              </div>

              {/* Two Column Layout: Short term vs long term */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Short term list */}
                <div className="bg-[#FAF8F5]/35 p-4 rounded-2xl border border-orange-100/50">
                  <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3 block text-orange-800">
                    📂 Target Jangka Pendek (Harian / Mingguan)
                  </h3>

                  <div className="flex flex-col gap-2">
                    {targets.filter(t => t.category === 'ShortTerm').length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center italic">Kosong. Tambahkan target harian baru</p>
                    ) : (
                      targets.filter(t => t.category === 'ShortTerm').map(target => (
                        <div key={target.id} className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleTarget(target.id)}
                              className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                                target.isCompleted ? 'bg-rose-500 border-rose-650 text-white' : 'border-slate-300 hover:border-rose-400'
                              }`}
                            >
                              {target.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                            <span className={`text-xs font-semibold leading-tight ${target.isCompleted ? 'line-through text-slate-400 font-normal' : 'text-slate-850'}`}>
                              {target.title}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteTarget(target.id)}
                            className="text-slate-350 hover:text-rose-500 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Long term list */}
                <div className="bg-[#FAF8F5]/35 p-4 rounded-2xl border border-orange-100/50">
                  <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3 block text-rose-800">
                    👑 Jangka Panjang (Mimpi Besar / Visi Karier)
                  </h3>

                  <div className="flex flex-col gap-2">
                    {targets.filter(t => t.category === 'LongTerm').length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center italic">Kosong. Tambahkan visi jangka panjang Anda</p>
                    ) : (
                      targets.filter(t => t.category === 'LongTerm').map(target => (
                        <div key={target.id} className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleTarget(target.id)}
                              className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                                target.isCompleted ? 'bg-orange-500 border-orange-655 text-white' : 'border-slate-300 hover:border-orange-400'
                              }`}
                            >
                              {target.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                            <span className={`text-xs font-semibold leading-tight ${target.isCompleted ? 'line-through text-slate-400 font-normal' : 'text-slate-850'}`}>
                              {target.title}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteTarget(target.id)}
                            className="text-slate-350 hover:text-rose-500 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 6: PORTABILITY & CLOUD BACKUP */}
        {activeTab === 'portability' && (
          <div className="flex flex-col gap-6">
            
            {/* Top Banner explaining integration */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-sky-950 text-white p-6 rounded-3xl border border-indigo-500/30 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative z-10">
                <span className="text-xs bg-indigo-500/30 border border-indigo-400/30 px-3 py-1 rounded-full text-indigo-200 font-bold uppercase tracking-wider font-mono">
                  MULTIDEVICE PERSISTENCE ENGINE
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight text-white mt-3">
                  Satu Akun, Multi Perangkat (PC, HP, & Web) 🌐
                </h2>
                <p className="text-sm text-indigo-200 mt-2 max-w-3xl leading-relaxed">
                  Gabungkan keamanan **Zero-Trust Firestore Database** dengan portabilitas multi-lokal! Dengan menghubungkan aplikasi FokusADHD lu ke Cloud Database, seluruh level kognitif, XP, koin, draf ide brilian, dan diagram pelajaran Anda tersinkronisasi di PC dan HP lu secara instant.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Firebase Database Sync */}
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-orange-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Database className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-extrabold text-slate-900">Penyimpanan Database Awan</h3>
                  </div>

                  {!currentUser ? (
                    <div className="flex flex-col gap-5 py-2">
                      <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-rose-100/60 text-slate-700 text-xs leading-relaxed">
                        <p className="font-bold text-rose-800 flex items-center gap-1.5 mb-1.5">
                          ⚠️ Status: Offline / Penyimpanan Lokal Aktif
                        </p>
                        Data lu saat ini hanya disimpan secara lokal dalam browser perangkat ini. Jika lu menghapus riwayat browser, data lu bisa terhapus. Sambungkan ke cloud untuk sinkransiasi otomatis!
                      </div>

                      <div className="flex flex-col gap-2.5">
                        <button
                          onClick={async () => {
                            playSound('click');
                            try {
                              setCloudStatus('syncing');
                              await loginWithGoogle();
                            } catch (e) {
                              setCloudStatus('error');
                              triggerBanner("❌ Gagal masuk dengan Google.");
                            }
                          }}
                          className="w-full bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2.5 border border-slate-800"
                        >
                          <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                            <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.615 4.5 1.77l2.42-2.42C17.345 1.625 14.89 1 12.24 1 6.59 1 2 5.59 2 11.24s4.59 10.24 10.24 10.24c5.9 0 9.805-4.145 9.805-10 0-.615-.055-1.125-.175-1.615H12.24z"/>
                          </svg>
                          Masuk & Sinkronisasi dengan Google
                        </button>

                        <button
                          onClick={async () => {
                            playSound('click');
                            try {
                              setCloudStatus('syncing');
                              await loginAnonymously();
                            } catch (e) {
                              setCloudStatus('error');
                              triggerBanner("❌ Gagal masuk secara anonim.");
                            }
                          }}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 border border-slate-200"
                        >
                          <User className="w-4 h-4" />
                          Masuk sebagai Guest (Anonim)
                        </button>
                      </div>

                      <div className="text-[10px] text-slate-400 text-center">
                        🔒 Menggunakan standar keamanan Firebase Auth dan Firestore Cloud.
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5 py-2">
                      <div className="bg-emerald-50 text-emerald-950 p-4 rounded-2xl border border-emerald-200 flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold text-emerald-950 text-xs">Status: Database Cloud Tersambung & Aktif!</p>
                          <p className="text-[11px] text-emerald-800 leading-relaxed mt-1">
                            Seluruh XP, Koin {coins}, level {level}, dan tugas lu sekarang dicadangkan ke database awam secara real-time otomatis saat terdeteksi jaringan internet.
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/90 text-xs flex flex-col gap-2.5">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                          <span className="font-bold text-slate-500 font-mono">PENGGUNA</span>
                          <span className="text-slate-800 font-semibold font-mono break-all text-right max-w-[200px]">{currentUser.email || currentUser.uid.substring(0, 12) + '... (Guest)'}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                          <span className="font-bold text-slate-500 font-mono">STATUS SYNC</span>
                          <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            Otomatis Aktif
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-500 font-mono">METODE AUTH</span>
                          <span className="text-slate-700 font-medium font-mono text-[11px] uppercase">
                            {currentUser.isAnonymous ? "Guest Mode" : "Google Account"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 mt-2">
                        <button
                          onClick={triggerCloudSync}
                          disabled={isCloudSyncing}
                          className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold py-3 px-4 rounded-xl shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <UploadCloud className={`w-4 h-4 ${isCloudSyncing ? 'animate-bounce' : ''}`} />
                          {isCloudSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Manual'}
                        </button>

                        <button
                          onClick={async () => {
                            playSound('click');
                            await logoutUser();
                            triggerBanner("👋 Sesi database berhasil Anda akhiri.");
                          }}
                          className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-650 text-xs font-bold rounded-xl border border-red-100 transition-all text-center"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-orange-100/50 pt-4 mt-6">
                  <h4 className="text-xs font-extrabold text-slate-800">Tips Saraf ADHD Lu:</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-1.5">
                    Gak usah pusing bikin akun rumit. Cukup login sekali, dan semua diagram, data rekap, serta shop reward lu tersimpan abadi kapan saja kamu buka di PC/HP kesayangan lu!
                  </p>
                </div>
              </div>

              {/* Right Column: Platform Packager Instructions */}
              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-orange-150 shadow-sm flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Laptop className="w-5 h-5 text-blue-500" />
                    <Smartphone className="w-5 h-5 text-rose-500" />
                    <h3 className="text-base font-extrabold text-slate-900">Langkah Kompilasi ke EXE (PC) & APK (HP)</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    FokusADHD siap dipasang penuh di laptop atau HP Anda dengan performa asli (Full Native Standalone) menggunakan file draf yang kami konfigurasi:
                  </p>
                </div>

                {/* Sub Tab: PC APP GUIDE */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4 text-left">
                  <div className="flex items-center gap-2 pb-2 border-b border-rose-100">
                    <Laptop className="w-4.5 h-4.5 text-blue-500" />
                    <h4 className="text-xs font-extrabold text-slate-805 uppercase tracking-wider font-mono">1. Panduan Build EXE untuk PC (Electron)</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Kami sudah menyediakan entry point **`electron.cjs`** di file draf proyek ini. Kamu bisa langsung menggunakannya dengan instruksi ini:
                  </p>
                  <div className="space-y-2 mt-1">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 bg-blue-100 rounded text-blue-600 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</div>
                      <p className="text-[11px] text-slate-600">
                        Ekspor/Download seluruh kode aplikasi FokusADHD ini dalam bentuk file **ZIP** melalui tombol **Settings** di pojok kanan atas AI Studio Workspace Anda, lalu ekstrak di komputer Anda.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 bg-blue-100 rounded text-blue-600 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</div>
                      <div className="flex-1">
                        <p className="text-[11px] text-slate-600">
                          Buku CMD / Terminal lokal dalam folder hasil ekstrak, jalankan install dependencies electron:
                        </p>
                        <code className="block bg-slate-900 text-sky-400 font-mono text-[10px] p-2.5 rounded-lg mt-1.5 select-all overflow-x-auto">
                          npm install electron electron-builder -D
                        </code>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 bg-blue-100 rounded text-blue-600 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</div>
                      <div className="flex-1">
                        <p className="text-[11px] text-slate-600">
                          Jalankan script auto kompilator bundle yang sudah dikonfigurasikan di draf ini:
                        </p>
                        <code className="block bg-slate-900 text-sky-400 font-mono text-[10px] p-2.5 rounded-lg mt-1.5 select-all overflow-x-auto">
                          npm run build:pc
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub Tab: MOBILE HP GUIDE */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4 text-left">
                  <div className="flex items-center gap-2 pb-2 border-b border-amber-100">
                    <Smartphone className="w-4.5 h-4.5 text-rose-500" />
                    <h4 className="text-xs font-extrabold text-slate-805 uppercase tracking-wider font-mono">2. Panduan Build APK Android & iOS (Capacitor)</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Kami juga sudah menanamkan konfigurasi **`capacitor.config.json`** di dalam draf ini sehingga aplikasi siap dibungkus menjadi file HP Android asli:
                  </p>
                  <div className="space-y-2 mt-1">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 bg-rose-100 rounded text-rose-600 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</div>
                      <div className="flex-1">
                        <p className="text-[11px] text-slate-600">
                          Buka Terminal di komputer lokal Anda, dan tambahkan platform mobile capacitor:
                        </p>
                        <code className="block bg-slate-900 text-rose-300 font-mono text-[10px] p-2.5 rounded-lg mt-1.5 select-all overflow-x-auto">
                          npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
                        </code>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 bg-rose-100 rounded text-rose-600 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</div>
                      <div className="flex-1">
                        <p className="text-[11px] text-slate-600">
                          Hubungkan draf folder lu dengan subfolder kompilasi Android asli:
                        </p>
                        <code className="block bg-slate-900 text-rose-300 font-mono text-[10px] p-2.5 rounded-lg mt-1.5 select-all overflow-x-auto border border-rose-950/20">
                          npx cap add android
                        </code>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 bg-rose-100 rounded text-rose-600 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</div>
                      <div className="flex-1">
                        <p className="text-[11px] text-slate-600">
                          Bangun seluruh kode web dan sinkronkan aset-aset tersebut langsung ke Android Studio:
                        </p>
                        <code className="block bg-slate-900 text-rose-300 font-mono text-[10px] p-2.5 rounded-lg mt-1.5 select-all overflow-x-auto">
                          npm run build:mobile-sync && npx cap open android
                        </code>
                        <p className="text-[9px] text-[#A21CAF] mt-1 font-semibold italic">
                          💡 Android Studio akan terbuka secara otomatis. Anda tinggal klik logo "Build Bundle / APK" di menu atas Android Studio untuk mendownload APK-nya langsung ke HP Anda!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
