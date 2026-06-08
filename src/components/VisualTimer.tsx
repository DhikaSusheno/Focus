import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, User, HelpCircle, AlertTriangle } from 'lucide-react';

interface VisualTimerProps {
  timerMinutes: number;
  timerSeconds: number;
  isTimerRunning: boolean;
  timerPreset: number;
  onPresetChange: (minutes: number) => void;
  onStartPause: () => void;
  onReset: () => void;
  onPanicTrigger: () => void;
  playSound: (type: 'success' | 'click' | 'levelUp' | 'redeem') => void;
  triggerBanner: (msg: string) => void;
  onAddTaskDirectly: (title: string, urgency: 'Low' | 'Medium' | 'High') => void;
}

const BODY_DOUBLE_QUOTES = [
  "Gw juga lagi ngetik modul di sini. Kita kelarin bareng ya!",
  "Fokus harian lu keren. Tenang aja, gw di sebelah lu.",
  "Atur napas santai... Yuk tulis satu baris kode perlahan.",
  "Mata tenang, bahu rileks. Jangan buru-buru, lu hebat!",
  "Satu teguk air dulu? Gw tungguin lu kok harian.",
  "Done is better than perfect! Gak perlu pusing rinciannya."
];

export default function VisualTimer({
  timerMinutes,
  timerSeconds,
  isTimerRunning,
  timerPreset,
  onPresetChange,
  onStartPause,
  onReset,
  onPanicTrigger,
  playSound,
  triggerBanner,
  onAddTaskDirectly
}: VisualTimerProps) {
  // Energy mood level mapping
  const [energyLevel, setEnergyLevel] = useState<number>(3); // default medium
  
  // Audio state
  const [ambientSound, setAmbientSound] = useState<'off' | 'lofi' | 'brown' | 'rain' | 'binaural'>('off');
  const synthNodesRef = useRef<any[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Body double state
  const [bodyDoubleEnabled, setBodyDoubleEnabled] = useState(false);
  const [bodyDoubleQuote, setBodyDoubleQuote] = useState(BODY_DOUBLE_QUOTES[0]);

  // AI Task breakdown state
  const [heavyTaskInput, setHeavyTaskInput] = useState('');
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [brokenSteps, setBrokenSteps] = useState<string[]>([]);

  // Energy callback
  const handleEnergyChange = (level: number) => {
    playSound('click');
    setEnergyLevel(level);
    let presetMins = 20;

    if (level === 1) { // Crash
      presetMins = 10;
      triggerBanner("⚡ Mode Darurat Crash diaktifkan: Sesi fokus mikro 10 menit saja!");
    } else if (level === 2) { // Low
      presetMins = 15;
      triggerBanner("⚡ Level Energi Rendah: Sesi fokus santai 15 menit.");
    } else if (level === 3) { // Medium
      presetMins = 20;
      triggerBanner("⚡ Level Energi Sedang: Sesi fokus seimbang 20 menit.");
    } else if (level === 4) { // High
      presetMins = 30;
      triggerBanner("⚡ Level Energi Tinggi: Sesi fokus penuh 30 menit!");
    } else if (level === 5) { // Hyperfocus
      presetMins = 45;
      triggerBanner("🔥 Mode Hyperfocus Aktif: Sesi puncak belajar 45 menit!");
    }

    onPresetChange(presetMins);
  };

  // Body Double quote changes randomly during running timer
  useEffect(() => {
    let quoteInterval: any = null;
    if (isTimerRunning && bodyDoubleEnabled) {
      quoteInterval = setInterval(() => {
        const rand = Math.floor(Math.random() * BODY_DOUBLE_QUOTES.length);
        setBodyDoubleQuote(BODY_DOUBLE_QUOTES[rand]);
      }, 15000); // 15 seconds
    }
    return () => clearInterval(quoteInterval);
  }, [isTimerRunning, bodyDoubleEnabled]);

  // Sound Synth Generator via Web Audio API
  useEffect(() => {
    if (ambientSound === 'off') {
      stopAmbientSynth();
    } else {
      startAmbientSynth(ambientSound);
    }
    return () => stopAmbientSynth();
  }, [ambientSound]);

  const startAmbientSynth = (type: typeof ambientSound) => {
    try {
      stopAmbientSynth();
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.04, ctx.currentTime); // very quiet ambient focus volume

      if (type === 'brown') {
        // Synthesizing Brown Noise (deeper rumble)
        const bufferSize = 10 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // Compensate for loss of volume
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        masterGain.connect(ctx.destination);
        whiteNoise.start();
        synthNodesRef.current = [whiteNoise, filter, masterGain];
      } 
      else if (type === 'rain') {
        // High filter white noise to simulate raining beads
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);

        noiseSource.connect(filter);
        filter.connect(masterGain);
        masterGain.connect(ctx.destination);
        noiseSource.start();
        synthNodesRef.current = [noiseSource, filter, masterGain];
      }
      else if (type === 'binaural') {
        // Two oscillators slightly detuned (e.g. Left: 200Hz, Right: 210Hz) for 10Hz Alpha Waves
        const oscLeft = ctx.createOscillator();
        oscLeft.type = 'sine';
        oscLeft.frequency.setValueAtTime(150, ctx.currentTime);

        const oscRight = ctx.createOscillator();
        oscRight.type = 'sine';
        oscRight.frequency.setValueAtTime(158, ctx.currentTime); // 8Hz Theta beats

        const pannerLeft = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const pannerRight = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

        if (pannerLeft && pannerRight) {
          pannerLeft.pan.setValueAtTime(-1, ctx.currentTime);
          pannerRight.pan.setValueAtTime(1, ctx.currentTime);
          oscLeft.connect(pannerLeft).connect(masterGain);
          oscRight.connect(pannerRight).connect(masterGain);
        } else {
          oscLeft.connect(masterGain);
          oscRight.connect(masterGain);
        }

        masterGain.connect(ctx.destination);
        oscLeft.start();
        oscRight.start();
        synthNodesRef.current = [oscLeft, oscRight, masterGain];
      }
      else if (type === 'lofi') {
        // Slow rhythmic hum arpeggio
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130.81, ctx.currentTime); // C3

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(220, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.2, ctx.currentTime); // slow pulse
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.01, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(masterGain.gain);

        osc.connect(filter).connect(masterGain);
        masterGain.connect(ctx.destination);

        osc.start();
        lfo.start();
        synthNodesRef.current = [osc, lfo, filter, masterGain];
      }

    } catch (e) {
      console.warn("Web Audio ambient error:", e);
    }
  };

  const stopAmbientSynth = () => {
    try {
      synthNodesRef.current.forEach((node) => {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      });
      synthNodesRef.current = [];
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch (e) {
      console.warn("Error stopping synth:", e);
    }
  };

  // Convert heavy objective to <= 5 mins micro-steps (Max 3 words per item)
  const handleBreakDownTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heavyTaskInput.trim()) return;

    playSound('click');
    setIsBreakingDown(true);

    try {
      const response = await fetch('/api/gemini/braindump-converter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `Pencegahan burnout tugas berat: ${heavyTaskInput}` })
      });
      
      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      
      if (data && data.tasks) {
        // Trim tasks titles down to very short steps (3 words max) to avoid overwhelming ADHD brain
        const shortSteps = data.tasks.map((t: any) => {
          const words = t.title.split(' ');
          if (words.length > 3) {
            return words.slice(0, 3).join(' ') + '..';
          }
          return t.title;
        }).slice(0, 3); // Max 3 active

        setBrokenSteps(shortSteps);
        triggerBanner("🧠 Langkah sukses mini dirumuskan! Klik + untuk melepaskan tugas ke papan/");
      }
    } catch (e) {
      // elegant client fallback breakdown
      const mockResult = ["Buka editor", "Tulis 1 judul", "Klaim koin!"];
      setBrokenSteps(mockResult);
    } finally {
      setIsBreakingDown(false);
    }
  };

  const adoptBrokenStep = (stepText: string) => {
    onAddTaskDirectly(stepText, 'Low');
    setBrokenSteps(prev => prev.filter(s => s !== stepText));
    playSound('success');
  };

  const totalSeconds = timerPreset * 60;
  const currentSeconds = (timerMinutes * 60) + timerSeconds;
  const progressPercent = totalSeconds > 0 ? (currentSeconds / totalSeconds) * 100 : 100;

  // Visual Timer state color depends on Energy Level
  const timerBorderColor = 
    energyLevel === 1 ? 'border-sky-400 fill-sky-50' :
    energyLevel === 2 ? 'border-teal-400 fill-teal-50' :
    energyLevel === 3 ? 'border-indigo-400 fill-indigo-50' :
    energyLevel === 4 ? 'border-purple-400 fill-purple-50' :
    'border-orange-500 fill-orange-50';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

      {/* LEFT COLUMN: Visual Shaped Timer Panel */}
      <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-orange-100 shadow-sm flex flex-col justify-between items-center text-center">
        
        {/* Header Indicator */}
        <div className="w-full flex justify-between items-center pb-2 border-b border-rose-50">
          <div>
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest font-mono">⚡ Energi Harian</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Adaptasikan level fokus lu sekarang</p>
          </div>
          
          <button
            onClick={onPanicTrigger}
            className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-xl border border-rose-700/30 animate-pulse flex items-center gap-1 shadow-sm"
          >
            🆘 Gw Overwhelm
          </button>
        </div>

        {/* 5-Level Energy Slider */}
        <div className="w-full bg-[#FCF9F5] p-3 rounded-2xl border border-orange-50 my-4">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-bold text-slate-700">Rasa Energi Anda:</span>
            <span className="text-xs font-extrabold text-orange-600 bg-orange-100/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
              {energyLevel === 1 && '🤢 Crash (10m)'}
              {energyLevel === 2 && '🥱 Low (15m)'}
              {energyLevel === 3 && '🧘 Normal (20m)'}
              {energyLevel === 4 && '😀 High (30m)'}
              {energyLevel === 5 && '🦁 Hyperfocus (45m)'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleEnergyChange(lvl)}
                className={`flex-1 py-2 text-sm rounded-xl transition-all font-bold ${
                  energyLevel === lvl 
                    ? 'bg-orange-500 text-white shadow' 
                    : 'bg-white hover:bg-orange-50/50 text-slate-500 border border-slate-100'
                }`}
              >
                {lvl === 1 && '🤢'}
                {lvl === 2 && '🥱'}
                {lvl === 3 && '🧘'}
                {lvl === 4 && '😀'}
                {lvl === 5 && '🦁'}
              </button>
            ))}
          </div>
        </div>

        {/* Circular SVG visual shaped countdown timer */}
        <div className="relative w-48 h-48 my-1 flex items-center justify-center">
          {/* Rotating halo background ring */}
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="84"
              className="stroke-slate-100"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="96"
              cy="96"
              r="84"
              className={`transition-all duration-1000 ${
                energyLevel === 1 ? 'stroke-sky-400' :
                energyLevel === 2 ? 'stroke-teal-400' :
                energyLevel === 3 ? 'stroke-indigo-400' :
                energyLevel === 4 ? 'stroke-purple-400' :
                'stroke-orange-500'
              }`}
              strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 84}`}
              strokeDashoffset={`${2 * Math.PI * 84 * (1 - (progressPercent / 100))}`}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Core countdown or breathing element */}
          <div className={`w-36 h-36 rounded-full flex flex-col items-center justify-center border-4 ${timerBorderColor} transition-all duration-500 shadow-inner`}>
            {isTimerRunning ? (
              <span className="text-[10px] text-slate-400 uppercase font-mono animate-pulse tracking-widest">Fokus Berjalan</span>
            ) : (
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest">Sesi Rehat</span>
            )}
            <h2 className="text-3xl font-extrabold font-mono text-slate-800 tracking-tight mt-0.5">
              {timerMinutes}:{timerSeconds < 10 ? '0' : ''}{timerSeconds}
            </h2>
            <span className="text-[9px] text-slate-400 mt-1 font-semibold">{timerPreset} menit target</span>
          </div>
        </div>

        {/* Action controllers buttons */}
        <div className="flex gap-2 w-full mt-4">
          <button
            onClick={() => { playSound('click'); onStartPause(); }}
            className={`flex-1 ${isTimerRunning ? 'bg-slate-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'} text-xs font-extrabold py-3 rounded-2xl shadow transition-all flex items-center justify-center gap-1.5`}
          >
            {isTimerRunning ? '⏸️ Tunda' : '▶️ Mulai Misi Fokus'}
          </button>
          <button
            onClick={() => { playSound('click'); onReset(); }}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 px-4 py-3 rounded-2xl text-xs font-bold transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* RIGHT COLUMN: Coworking Body Double & Ambient Sound Panel */}
      <div className="lg:col-span-7 flex flex-col gap-6">

        {/* Ambient Synthesizer Box */}
        <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-orange-50 pb-2 mb-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest font-mono flex items-center gap-1.5">
                🔊 Penyelamat Saraf: Ambient Sound Player
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Merawat simpanan dopamin dengan frekuensi alami kognitif</p>
            </div>
            {ambientSound !== 'off' && (
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[9px] px-2 py-0.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Playing Sound
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'off', label: '📴 Sunyi', color: 'hover:bg-slate-100 border-slate-100 text-slate-600' },
              { id: 'lofi', label: '🎹 Lo-Fi Hum', color: 'hover:bg-pink-50 border-pink-100 text-pink-700' },
              { id: 'brown', label: '🤎 Brown Noise', color: 'hover:bg-amber-50 border-amber-100 text-amber-700' },
              { id: 'rain', label: '🌧️ Rain Fall', color: 'hover:bg-blue-50 border-blue-100 text-blue-700' },
              { id: 'binaural', label: '🧠 Binaural Beat', color: 'hover:bg-purple-50 border-purple-100 text-purple-700' }
            ].map((snd) => (
              <button
                key={snd.id}
                onClick={() => { playSound('click'); setAmbientSound(snd.id as any); }}
                className={`py-3 px-2 border text-[11px] font-extrabold rounded-xl text-center shadow-sm transition-all ${
                  ambientSound === snd.id 
                    ? 'bg-slate-900 border-slate-950 text-amber-300 scale-102 font-extrabold' 
                    : `bg-white ${snd.color}`
                }`}
              >
                {snd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Coworking Body Double mode */}
        <div className="bg-[#FAF9F5] p-5 rounded-3xl border border-orange-100/70 shadow-inner flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-extrabold text-orange-900 uppercase tracking-wider">👩‍💻 Mode "Body Double" Virtual</h4>
              <p className="text-[10px] text-orange-700 mt-0.5">Otak ADHD lebih stabil saat merasa bekerja bersama kawan</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={bodyDoubleEnabled} 
                onChange={() => { playSound('click'); setBodyDoubleEnabled(!bodyDoubleEnabled); }}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          {bodyDoubleEnabled && (
            <div className="bg-white p-4 rounded-2xl border border-orange-100 flex items-start gap-3 text-left animate-fade-in shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl border border-indigo-200 shadow-inner">
                🤖
              </div>
              <div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  FokusAI Coworking Partner
                </span>
                <p className="text-xs text-slate-800 font-semibold mt-1.5 leading-relaxed tracking-wide">
                  "{bodyDoubleQuote}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* AI Auto Task Breakdown tool (Modul 1) */}
        <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-sm flex flex-col gap-3">
          <div>
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">🎯 Pembongkar Tugas AI (Micro-step Generator)</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Rasa takut mulai? Tulis tugas besar lu, AI pecah jadi langkah kecil &lt;= 3 kata!</p>
          </div>

          <form onSubmit={handleBreakDownTask} className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-150">
            <input
              type="text"
              value={heavyTaskInput}
              onChange={(e) => setHeavyTaskInput(e.target.value)}
              placeholder="e.g. 'coding tugas kuliah react semester ini'"
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-orange-400 text-slate-800 font-sans"
            />
            <button
              type="submit"
              disabled={isBreakingDown || !heavyTaskInput.trim()}
              className="bg-slate-900 border border-slate-950 text-white font-extrabold text-xs px-4 py-2 rounded-lg hover:bg-slate-850 disabled:bg-slate-300 shadow transition-all"
            >
              {isBreakingDown ? 'Proses...' : '✨ Bongkar'}
            </button>
          </form>

          {/* List of generated microtask items */}
          {brokenSteps.length > 0 && (
            <div className="flex flex-col gap-2 mt-2 p-3 bg-orange-50/40 rounded-2xl border border-orange-100">
              <span className="text-[10px] font-bold text-orange-700 uppercase tracking-widest font-mono">Hasil Langkah Mikro:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {brokenSteps.map((step) => (
                  <button
                    key={step}
                    onClick={() => adoptBrokenStep(step)}
                    className="bg-white hover:bg-orange-500 hover:text-white hover:border-orange-500 border border-orange-200 text-xs text-orange-850 font-bold px-3 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1 text-left"
                  >
                    <span>+ {step}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
