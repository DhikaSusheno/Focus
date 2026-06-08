import React, { useState, useEffect } from 'react';
import { ShieldAlert, Heart, Activity, Play, Check } from 'lucide-react';

interface AdhdCrisisPanelProps {
  onComplete: (xp: number, message: string) => void;
  playSound: (type: 'success' | 'click' | 'levelUp' | 'redeem') => void;
}

export default function AdhdCrisisPanel({ onComplete, playSound }: AdhdCrisisPanelProps) {
  const [step, setStep] = useState<'intro' | 'choice' | 'physical' | 'mental' | 'task' | 'success'>('intro');
  const [groundingIndex, setGroundingIndex] = useState(0);
  const [groundingResponses, setGroundingResponses] = useState<string[]>([]);
  const [groundingInput, setGroundingInput] = useState('');
  
  // Breathing state
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'HoldAgain'>('Inhale');
  const [breathSecs, setBreathSecs] = useState(4);
  const [isBreathingRunning, setIsBreathingRunning] = useState(false);

  // Microtask countdown
  const [microTimer, setMicroTimer] = useState(120); // 2 minutes
  const [isMicroTimerRunning, setIsMicroTimerRunning] = useState(false);

  // Grounding sensory definitions
  const groundingPrompts = [
    { title: "👀 Lihat 5 benda di sekitarmu", desc: "Tuliskan 1 benda penting yang lu lihat sekarang:" },
    { title: "🖐️ Rasakan 4 sentuhan fisik", desc: "Sebutkan pakaian, udara, atau meja di bawah tanganmu:" },
    { title: "👂 Dengarkan 3 suara kecil", desc: "Dengarkan baik-baik, suara apa yang masuk ke telingamu:" },
    { title: "👃 Cium 2 bebauan", desc: "Tarik napas hidung, aroma apa saja yang bisa lu deteksi:" },
    { title: "👅 Rasakan 1 cita rasa", desc: "Bagaimana rasa di mulutmu sekarang, atau tegukan airnya:" }
  ];

  // Box Breathing cycle: Inhale (4s) -> Hold (7s) -> Exhale (8s) -> Hold (4s)
  useEffect(() => {
    let breathInterval: any = null;
    if (isBreathingRunning) {
      breathInterval = setInterval(() => {
        setBreathSecs((prev) => {
          if (prev > 1) {
            return prev - 1;
          } else {
            // transition to next phase
            if (breathPhase === 'Inhale') {
              setBreathPhase('Hold');
              return 7;
            } else if (breathPhase === 'Hold') {
              setBreathPhase('Exhale');
              return 8;
            } else if (breathPhase === 'Exhale') {
              setBreathPhase('HoldAgain');
              return 4;
            } else {
              setBreathPhase('Inhale');
              playSound('success'); // gentle dopamine beep
              return 4;
            }
          }
        });
      }, 1000);
    }
    return () => clearInterval(breathInterval);
  }, [isBreathingRunning, breathPhase]);

  // Micro Task 2 minutes Timer
  useEffect(() => {
    let taskTimer: any = null;
    if (isMicroTimerRunning) {
      taskTimer = setInterval(() => {
        setMicroTimer((prev) => {
          if (prev > 1) {
            return prev - 1;
          } else {
            setIsMicroTimerRunning(false);
            handleCrisisSectionSuccess("Fisik/Tugas mikro esensial selesai!");
            return 0;
          }
        });
      }, 1000);
    }
    return () => clearInterval(taskTimer);
  }, [isMicroTimerRunning]);

  const handleNextGrounding = () => {
    if (!groundingInput.trim()) return;
    playSound('click');
    const updated = [...groundingResponses, groundingInput.trim()];
    setGroundingResponses(updated);
    setGroundingInput('');

    if (groundingIndex < 4) {
      setGroundingIndex(prev => prev + 1);
    } else {
      handleCrisisSectionSuccess("Grounding sensorik 5-4-3-2-1 selesai.");
    }
  };

  const skipGroundingStep = () => {
    playSound('click');
    if (groundingIndex < 4) {
      setGroundingIndex(prev => prev + 1);
    } else {
      handleCrisisSectionSuccess("Grounding sensorik selesai.");
    }
  };

  const handleCrisisSectionSuccess = (source: string) => {
    setStep('success');
    playSound('levelUp');
    onComplete(30, `🆘 Recovery krisis berhasil dilaporkan di sistem! +30 XP Bonus.`);
  };

  // formatting timer
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="bg-gradient-to-b from-[#EFF6FF] to-[#E0F2FE] p-6 md:p-8 rounded-3xl border border-blue-200 shadow-lg text-slate-800 transition-all duration-300">
      
      {/* Indicator icon */}
      <div className="flex items-center gap-3 border-b border-blue-100 pb-4 mb-6">
        <div className="p-3 bg-blue-500 rounded-2xl text-white animate-pulse shadow-md">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#1E40AF] tracking-tight">FokusAI Crisis Room: Penolong Overwhelm</h2>
          <p className="text-xs text-blue-600 font-bold mt-0.5">Dirancang oleh psikolog kognitif untuk meredakan kepanikan pikiran ADHD</p>
        </div>
      </div>

      {/* STEP 1: Emotion Validation Intro */}
      {step === 'intro' && (
        <div className="flex flex-col gap-5 text-left max-w-xl mx-auto py-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100">
            <span className="text-xs font-bold text-blue-550 uppercase font-mono tracking-wider">Pesan Dari FokusAI</span>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mt-2">
              "Gak apa-apa, gw di sini bareng lu. Lu aman sekarang. Rasakan kakimu di lantai, lu gak harus selesaikan segalanya hari ini."
            </p>
          </div>
          
          <p className="text-xs text-slate-500 italic text-center">Tarik napas panjang satu kali...</p>
          
          <button
            onClick={() => { playSound('click'); setStep('choice'); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-2xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4 fill-current" />
            Bantu tenang sekarang (2-3 menit)
          </button>
        </div>
      )}

      {/* STEP 2: Path Selection (Fisik / Mental / Tugas) */}
      {step === 'choice' && (
        <div className="flex flex-col gap-6 text-center max-w-lg mx-auto py-4">
          <h3 className="text-sm font-extrabold text-slate-700">Dimana lu merasa terjebak atau cemas sekarang?</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => { playSound('click'); setStep('physical'); setIsBreathingRunning(true); }}
              className="bg-white hover:bg-blue-50 border border-blue-100 p-5 rounded-2xl shadow-sm flex flex-col items-center gap-2.5 group transition-all"
            >
              <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center text-lg font-bold group-hover:scale-110 transition-transform">
                🫁
              </div>
              <span className="text-xs font-bold text-slate-800">Fisik (Pernapasan)</span>
              <p className="text-[10px] text-slate-400">Box breathing 4-7-8 untuk mendinginkan saraf motorik</p>
            </button>

            <button
              onClick={() => { playSound('click'); setStep('mental'); }}
              className="bg-white hover:bg-blue-50 border border-blue-100 p-5 rounded-2xl shadow-sm flex flex-col items-center gap-2.5 group transition-all"
            >
              <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center text-lg font-bold group-hover:scale-110 transition-transform">
                🧘
              </div>
              <span className="text-xs font-bold text-slate-800">Mental (Grounding)</span>
              <p className="text-[10px] text-slate-400">Metode sensorik 5-4-3-2-1 menjangkau indera luar</p>
            </button>

            <button
              onClick={() => { playSound('click'); setStep('task'); setIsMicroTimerRunning(true); }}
              className="bg-white hover:bg-blue-50 border border-blue-100 p-5 rounded-2xl shadow-sm flex flex-col items-center gap-2.5 group transition-all"
            >
              <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center text-lg font-bold group-hover:scale-110 transition-transform">
                🎯
              </div>
              <span className="text-xs font-bold text-slate-800">Tugas (Micro Task)</span>
              <p className="text-[10px] text-slate-400">1 Langkah ultra praktis: minum air seteguk harian</p>
            </button>
          </div>

          <button
            onClick={() => setStep('intro')}
            className="text-xs text-blue-500 hover:underline font-bold mt-2"
          >
            ← Kembali ke halaman awal krisis
          </button>
        </div>
      )}

      {/* PATH A: Physical (Box Breathing 4-7-8) */}
      {step === 'physical' && (
        <div className="flex flex-col items-center gap-6 max-w-md mx-auto py-2 text-center">
          <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            METODE BOX BREATHING 4-7-8
          </span>

          {/* Pulsing circle container relative to state scale */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            <div 
              style={{
                transition: 'transform 1000ms ease-in-out',
                transform: breathPhase === 'Inhale' ? 'scale(1.3)' : breathPhase === 'Exhale' ? 'scale(0.8)' : 'scale(1.1)'
              }}
              className={`absolute inset-0 rounded-full border-4 ${
                breathPhase === 'Inhale' 
                  ? 'bg-rose-100 border-rose-400 shadow-lg shadow-rose-200/50' 
                  : breathPhase === 'Exhale'
                  ? 'bg-emerald-100 border-emerald-400 shadow-lg shadow-emerald-200/50'
                  : 'bg-indigo-100 border-indigo-400 shadow-lg shadow-indigo-200/50'
              }`}
            />
            <div className="z-10 text-center">
              <p className="text-lg font-extrabold text-slate-800">
                {breathPhase === 'Inhale' && '⚡ Hirup Hidung'}
                {breathPhase === 'Hold' && '🛑 Tahan Napas'}
                {breathPhase === 'Exhale' && '💨 Lepas Mulut'}
                {breathPhase === 'HoldAgain' && '🧘 Kosongkan'}
              </p>
              <p className="text-3xl font-mono font-bold text-indigo-950 mt-1">{breathSecs}s</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Ikuti denyut lingkaran di atas. Mengambil udara mengalirkan oksigen melimpah dan me-reset hormon stres.
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => setIsBreathingRunning(!isBreathingRunning)}
              className="flex-1 bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 px-4 py-2 rounded-xl text-xs"
            >
              {isBreathingRunning ? '⏸️ Jeda Animasi' : '▶️ Mulai Bernapas'}
            </button>
            <button
              onClick={() => handleCrisisSectionSuccess("Breathing")}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm"
            >
              ✅ Selesai, Gw Lebih Tenang
            </button>
          </div>
        </div>
      )}

      {/* PATH B: Mental (5-4-3-2-1 sensory grounding) */}
      {step === 'mental' && (
        <div className="max-w-md mx-auto py-2 text-left flex flex-col gap-4">
          <div className="flex justify-between items-center bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
            <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest font-mono">
              Sensory Grounding {groundingIndex + 1}/5
            </span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full ${i <= groundingIndex ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-base font-extrabold text-[#1E3A8A]">
              {groundingPrompts[groundingIndex].title}
            </h4>
            <p className="text-xs text-slate-550 mt-1 leading-relaxed">
              Teknik ini menarik perhatian lu kembali dari badai cemas di depan masa depan ke realitas fisik detik ini.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-100/50 shadow-inner flex flex-col gap-2">
            <label className="text-[11px] font-bold text-slate-500">
              {groundingPrompts[groundingIndex].desc}
            </label>
            <input
              type="text"
              value={groundingInput}
              onChange={(e) => setGroundingInput(e.target.value)}
              placeholder="Ketik apa saja..."
              onKeyDown={(e) => e.key === 'Enter' && handleNextGrounding()}
              className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-indigo-400 text-slate-800"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={skipGroundingStep}
              className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-50"
            >
              Lewati langkah
            </button>
            <button
              onClick={handleNextGrounding}
              disabled={!groundingInput.trim()}
              className="flex-1 bg-indigo-650 hover:bg-indigo-750 disabled:bg-slate-300 text-white font-bold py-2 rounded-xl text-xs shadow"
            >
              Konfirmasi {groundingIndex < 4 ? 'Berikutnya' : 'Selesai'}
            </button>
          </div>
        </div>
      )}

      {/* PATH C: Tugas (1 micro-task + 2 mins limit) */}
      {step === 'task' && (
        <div className="flex flex-col items-center gap-6 max-w-sm mx-auto py-2 text-center">
          <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
            MISI RESET SENSORIK: TIADA BEBAN
          </span>

          <div className="bg-white p-5 rounded-2xl shadow border border-amber-100 text-left">
            <h4 className="text-sm font-extrabold text-amber-900">Misi lu sangat sederhana:</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mt-2">
              "Ambil segelas air, minum seteguk kecil saja secara perlahan. Rasakan setiap tetes air yang membasahi lidah dan esofagusmu. Setelah itu lu boleh menyerah hari ini jika dirasa perlu."
            </p>
          </div>

          {/* Simple stopwatch wheel */}
          <div className="flex flex-col items-center">
            <p className="text-2xl font-mono font-extrabold text-slate-900">{formatTimer(microTimer)}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold tracking-wider uppercase font-mono">Downtime Relaksasi</p>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => setIsMicroTimerRunning(!isMicroTimerRunning)}
              className="flex-1 text-slate-800 border border-slate-200 hover:bg-slate-50 font-bold px-3 py-2 rounded-xl text-xs"
            >
              {isMicroTimerRunning ? '⏸️ Tunda Timer' : '▶️ Jalankan Timer'}
            </button>
            <button
              onClick={() => handleCrisisSectionSuccess("TaskDone")}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-sm"
            >
              ✅ Air Selesai Diminum
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Absolute success recovery celebration */}
      {step === 'success' && (
        <div className="flex flex-col items-center gap-4 text-center max-w-md mx-auto py-6">
          <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-400 rounded-full flex items-center justify-center text-3xl font-bold animate-bounce shadow">
            🎉
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-emerald-800">Sempurna! Lu berhasil pulih perlahan</h3>
            <p className="text-xs text-slate-600 leading-relaxed mt-1 max-w-sm">
              Semenit rehat mematahkan kepanikan berantai di otak penderita ADHD. Lu sudah melunasi recovery point hari ini dan berhak mendapatkan koin instan harian.
            </p>
          </div>

          <div className="bg-white/80 p-3.5 rounded-2xl border border-emerald-100 shadow-sm text-left w-full mt-2">
            <p className="text-xs font-extrabold text-emerald-700">Hubungi Teman/Kerabat jika butuh teman bicara:</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Jangan simpan sendirian harian. ADHD sering membesar dalam sepi. Whatsapp sahabat lu, katakan lu butuh ngobrol santai 5 menit saja.
            </p>
          </div>

          <button
            onClick={() => { playSound('click'); setStep('intro'); }}
            className="w-full bg-slate-950 hover:bg-slate-900 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow transition-all"
          >
            Kembali Ke Dasbor Utama Produktivitas
          </button>
        </div>
      )}

    </div>
  );
}
