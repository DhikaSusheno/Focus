import React, { useState, useEffect } from 'react';
import { User, Sparkles, Award, FileDown, Smile, Flame, ShieldCheck, Clock } from 'lucide-react';
import { ADHDSubtype, Chronotype, OnboardingAnswers } from '../types';

interface AdhdProfilePanelProps {
  uName: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  totalFocusMinutes: number;
  ideasCount: number;
  playSound: (type: 'success' | 'click' | 'levelUp' | 'redeem') => void;
  triggerBanner: (msg: string) => void;
}

const ASSESSMENT_QUESTIONS = [
  { id: 'q1', text: "Gampang terdistraksi hal sepele di rumah atau luar?", cat: 'inattentive' },
  { id: 'q2', text: "Sering melamun di tengah obrolan panjang harian?", cat: 'inattentive' },
  { id: 'q3', text: "Pekerjaan menumpuk karena repot mulai langkah awal?", cat: 'inattentive' },
  { id: 'q4', text: "Sering lupa menaruh kunci, hp, atau menaruh tab browser?", cat: 'inattentive' },
  { id: 'q5', text: "Kaki/tangan lu sering ketukan atau goyang sendiri?", cat: 'hyperactive' },
  { id: 'q6', text: "Sering merasa buru-buru, kayak digerakkan dinamo?", cat: 'hyperactive' },
  { id: 'q7', text: "Gampang bosan luar biasa jika harus menunggu giliran?", cat: 'hyperactive' },
  { id: 'q8', text: "Kerap memotong ucapan sahabat karena cemas ide menguap?", cat: 'hyperactive' },
  { id: 'q9', text: "Sering terjebak malam person (produktif larut malam)?", cat: 'chronotype' },
  { id: 'q10', text: "Punya daya kreativitas tinggi tapi susah kelola draf?", cat: 'combined' }
];

export default function AdhdProfilePanel({
  uName,
  level,
  xp,
  coins,
  streak,
  totalFocusMinutes,
  ideasCount,
  playSound,
  triggerBanner
}: AdhdProfilePanelProps) {
  // Assessment States
  const [subtype, setSubtype] = useState<ADHDSubtype>(() => {
    return (localStorage.getItem('adhd_subtype') as ADHDSubtype) || 'Belum Dinilai';
  });
  const [chronotype, setChronotype] = useState<Chronotype>(() => {
    return (localStorage.getItem('adhd_chronotype') as Chronotype) || 'Belum Dinilai';
  });
  const [answers, setAnswers] = useState<OnboardingAnswers>(() => {
    const saved = localStorage.getItem('adhd_onboarding_answers');
    return saved ? JSON.parse(saved) : {};
  });

  const [currentQIndex, setCurrentQIndex] = useState<number>(-1); // -1 means overview or onboarding trigger

  const handleStartTest = () => {
    playSound('click');
    setAnswers({});
    setCurrentQIndex(0);
  };

  const answerQuestion = (val: number) => {
    playSound('click');
    const qId = ASSESSMENT_QUESTIONS[currentQIndex].id;
    const updated = { ...answers, [qId]: val };
    setAnswers(updated);

    if (currentQIndex < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      // Analyze results!
      let inattentiveScore = 0;
      let hyperactiveScore = 0;
      let owlCount = 0;

      ASSESSMENT_QUESTIONS.forEach((q) => {
        const v = updated[q.id as keyof OnboardingAnswers] || 0;
        if (q.cat === 'inattentive') inattentiveScore += v;
        if (q.cat === 'hyperactive') hyperactiveScore += v;
        if (q.id === 'q9') owlCount = v;
      });

      // Subtype diagnosis
      let diagnosedSubtype: ADHDSubtype = 'Combined';
      if (inattentiveScore > hyperactiveScore + 3) {
        diagnosedSubtype = 'Inattentive';
      } else if (hyperactiveScore > inattentiveScore + 3) {
        diagnosedSubtype = 'Hyperactive';
      }

      // Chronotype diagnosis
      const diagnosedChronotype: Chronotype = owlCount >= 3 
        ? 'Night Owl (Burung Hantu)' 
        : 'Morning Lark (Burung Pagi)';

      setSubtype(diagnosedSubtype);
      setChronotype(diagnosedChronotype);
      setCurrentQIndex(-1);

      localStorage.setItem('adhd_subtype', diagnosedSubtype);
      localStorage.setItem('adhd_chronotype', diagnosedChronotype);
      localStorage.setItem('adhd_onboarding_answers', JSON.stringify(updated));

      playSound('levelUp');
      triggerBanner(`🎉 Diagnosis berhasil! Lu dinilai bertipe: ${diagnosedSubtype}.`);
    }
  };

  const handleExportPsychologistReport = () => {
    playSound('redeem');

    // Make report content
    const reportStr = `========================================================
LAPORAN PROFIL INSIGHT KOGNITIF & PRODUKTIVITAS NEURODIVERSE
========================================================
Nama Pengguna : ${uName}
Tanggal Cetak : 2026-06-08 (Waktu UTC)
Target Studi  : Terapi & Pendokumentasian ADHD
Tier Level    : Level ${level} Navigator
Streak Aktif  : ${streak} Hari Beruntun

-----------------------------------------
1. PROFIL DIAGNOSIS NEUROTYPE (FokusAI Engine)
-----------------------------------------
Subtipe ADHD : ADHD ${subtype} Type
Kronotipe    : ${chronotype}

  * Deskripsi Klinis Subtipe:
    ${subtype === 'Inattentive' 
      ? 'Daya atensi mudah terbagi. Rentan mengalami analytical paralysis saat menghadapi tugas besar tanpa rincian mikro.' 
      : subtype === 'Hyperactive'
      ? 'Kecenderungan taktil yang melimpah. Membutuhkan interaksi fisik, istirahat berjangka pendek, dan stimulan taktil.'
      : 'Atensi terpecah bersanding dorongan fisik spontan. Sering melompat-lompat ide brilian di malam hari.'}

  * Profil Kronotipe:
    ${chronotype.includes('Night Owl')
      ? 'Puncak kinerja kognitif di malam hari antara jam 20.05 - 00.30. Disarankan menyusun jadwal belajar micro-tasking di malam hari.'
      : 'Puncak fokus pagi hari. Energi menurun di siang hari, butuh power nap 15 menit.'}

-----------------------------------------
2. METRIK UNGGULAN & PENYELAMAT SENSORIK
-----------------------------------------
Total Menit Fokus : ${totalFocusMinutes} Menit Sesi
Ide Cemerlang Parkir: ${ideasCount} Kreativitas
Efektivitas Fokus : 40% Lebih baik dari patokan klinis minggu lalu

Penilaian Atensi:
- Hyperfocus Rate : Tinggi (Mampu bertahan penuh saat topik disukai)
- Pola Distraksi : Berbasis Suara & Visual Tumpukan Tab Browser
- Kebutuhan Rehat: Sesi adaptif maksimal 20 menit sangat direkomendasikan

-----------------------------------------
3. STRATEGI REKOMENDASI TERAPEUTIK
-----------------------------------------
- Batasi jumlah misi harian maksimal 3 saja per visual display.
- Nyalakan ambient sound binaural beat untuk menyeimbangkan neurotransmiter dopamin.
- Gunakan crisis room "Gw Overwhelm" jika ritme belajar tersangkut >15 menit.

Laporan ini bersifat pelengkap edukatif dan kognitif untuk diajukan kepada Dokter, Psikolog Rujukan, ataupun Konsultan Karier Anda.
Generated Automatically via FokusADHD Dynamic Dashboard.
========================================================`;

    const blob = new Blob([reportStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ADHD_Profile_Report_${uName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    triggerBanner("📄 File Laporan Konsultasi Psikolog berhasil diunduh ke perangkatmu!");
  };

  const handleResetTest = () => {
    playSound('click');
    localStorage.removeItem('adhd_subtype');
    localStorage.removeItem('adhd_chronotype');
    localStorage.removeItem('adhd_onboarding_answers');
    setSubtype('Belum Dinilai');
    setChronotype('Belum Dinilai');
    setAnswers({});
  };

  return (
    <div className="flex flex-col gap-6">

      {/* QUESTIONNAIRE OVERLAY OR PAGE */}
      {currentQIndex >= 0 ? (
        <div className="bg-gradient-to-br from-[#FAF5FF] to-[#F3E8FF] p-6 md:p-10 rounded-3xl border border-purple-200 shadow-md">
          <div className="max-w-xl mx-auto flex flex-col gap-6 text-center">
            
            <div className="flex justify-between items-center text-xs font-bold text-purple-600 font-mono">
              <span>PERTANYAAN INSIGHT ADHD {currentQIndex + 1}/{ASSESSMENT_QUESTIONS.length}</span>
              <div className="flex gap-1">
                {ASSESSMENT_QUESTIONS.map((_, idx) => (
                  <div key={idx} className={`w-2 h-2 rounded-full ${idx <= currentQIndex ? 'bg-purple-600' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>

            <div className="py-6">
              <h3 className="text-xl font-extrabold text-[#5B21B6] leading-snug">
                "{ASSESSMENT_QUESTIONS[currentQIndex].text}"
              </h3>
              <p className="text-slate-500 text-xs mt-3 italic">
                Pilih jawaban jujur lu... Di sini gak ada penahanan moral, neurodivergent lu itu keren!
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Jarang Sekali', val: 0, color: 'hover:bg-rose-50 border-rose-100 hover:border-rose-400' },
                { label: 'Kadang-kadang', val: 1, color: 'hover:bg-amber-50 border-amber-100 hover:border-amber-400' },
                { label: 'Sering', val: 2, color: 'hover:bg-purple-50 border-purple-100 hover:border-purple-400' },
                { label: 'Selalu Luar Biasa', val: 3, color: 'hover:bg-emerald-50 border-emerald-100 hover:border-emerald-400' }
              ].map((ans) => (
                <button
                  key={ans.label}
                  onClick={() => answerQuestion(ans.val)}
                  className={`bg-white border text-xs font-bold py-4 px-2 rounded-2xl transition-all shadow-sm ${ans.color}`}
                >
                  {ans.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => { playSound('click'); setCurrentQIndex(-1); }}
              className="text-xs text-purple-600 font-medium hover:underline mt-4"
            >
              Nanti saja, simpan assessment dulu
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column Diagnostic */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
            <div className="flex flex-col gap-6">
              
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-purple-400 tracking-wider">🔬 Diagnosis Neurotype ADHD</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Analisis instan gaya kerja lu berbasis neurosains</p>
                </div>
                <span className="text-[10px] bg-purple-900 border border-purple-500/30 font-bold px-2 py-0.5 rounded text-purple-300">
                  FokusAI v2.5
                </span>
              </div>

              {subtype === 'Belum Dinilai' ? (
                <div className="py-8 text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-3xl border border-slate-700 flex items-center justify-center text-3xl">
                    🕵️
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Berapakah Potensi ADHD & Kronotipe Belajar Lu?</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mt-2 max-w-xs mx-auto">
                      Ikuti 10 pertanyaan singkat untuk mengetahui tipe visual lu (Inattentive, Hyperactive, Kombinasi). Kami menyediakan laporan klinis ramah guru & psikolog!
                    </p>
                  </div>
                  <button
                    onClick={handleStartTest}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold py-3.5 rounded-2xl shadow-md transition-all mt-2"
                  >
                    ✨ Ambil Tes Diagnosis Kognitif
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-5 text-left">
                  
                  {/* Results cards */}
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-xl flex items-center justify-center font-bold text-lg">
                      🧠
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">Tipe ADHD Anda:</p>
                      <p className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-rose-400">
                        {subtype} ADHD Subtype
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-xl flex items-center justify-center text-2xl">
                      🦉
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold font-mono">Puncak Kronotipe:</p>
                      <p className="text-sm font-bold text-blue-300">
                        {chronotype}
                      </p>
                    </div>
                  </div>

                  {/* Bullet description */}
                  <div className="bg-purple-950/40 p-4 rounded-2xl border border-purple-800/20 text-xs text-slate-300 leading-relaxed italic">
                    {subtype === 'Inattentive' 
                      ? '"Rentang atensi melompat halus. Lebih gampang mengorganisasi info jika dipetakan lewat mindmap spasial atau dicentang bertahap."'
                      : subtype === 'Hyperactive'
                      ? '"Perkakas fisik atau audio seperti brown noise meningkatkan efektivitas. Atur durasi pengerjaan <= 15 menit agar tidak burnout."'
                      : '"Ide-ide liar luar biasa. Sering hyperfocus di larut malam. Simpan gagasan kilat di Ide Parkir agar tidak menyingkirkan tugas inti."'}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleStartTest}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold py-2.5 rounded-xl border border-slate-700 text-slate-200"
                    >
                      Ulangi Tes
                    </button>
                    <button
                      onClick={handleResetTest}
                      className="px-4 py-2.5 bg-[#991B1B]/40 hover:bg-[#991B1B]/60 text-rose-200 text-xs font-bold rounded-xl border border-red-900/30"
                    >
                      Reset data
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 border-t border-white/5 pt-4">
              <button
                onClick={handleExportPsychologistReport}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow"
              >
                <FileDown className="w-4 h-4" />
                Cetak Laporan Konsultasi Psikolog (.TXT)
              </button>
            </div>
          </div>

          {/* Right Column Stats & Strengths */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-orange-150 shadow-sm flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                📈 Profil Kekuatan & Kemajuan Kognitif
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                ADHD bukanlah kecacatan, melainkan neurotype pemburu yang luar biasa. Lihat bagaimana kekuatan kognitif utama lu berkembang seiring pemakaian aplikasi FokusADHD harian.
              </p>
            </div>

            {/* Micro positive feedback cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-[#FFFDF9] border border-orange-100 p-4 rounded-2xl flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Streak Konsistensi</p>
                  <p className="text-base font-extrabold text-orange-950 mt-0.5">{streak} Hari Beruntun</p>
                  <p className="text-[9px] text-orange-600 font-semibold italic mt-0.5">Dopamin adaptif terjaga dengan baik!</p>
                </div>
              </div>

              <div className="bg-[#FFFDF9] border border-orange-100 p-4 rounded-2xl flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Waktu Hyperfocus</p>
                  <p className="text-base font-extrabold text-orange-950 mt-0.5">{totalFocusMinutes} Menit Aktif</p>
                  <p className="text-[9px] text-emerald-600 font-bold mt-0.5">🚀 40% lebih banyak dari patokan klinis minggu lalu</p>
                </div>
              </div>
            </div>

            {/* Custom SVG Bar Chart / Strengths Progress Bars */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/80">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest font-mono mb-4">
                🔬 ADHD Superpower Bar (Skala 0-100)
              </h3>

              <div className="flex flex-col gap-4">
                {/* Strength 1: Hyperfocus rate */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-755 mb-1.5">
                    <span className="flex items-center gap-1.5">🦁 1. Kapasitas Hyperfocus</span>
                    <span className="text-amber-600 font-bold font-mono">85 / 100</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300/30">
                    <div className="bg-gradient-to-r from-amber-400 to-amber-600 h-2.5 rounded-full transition-all duration-500" style={{ width: '85%' }} />
                  </div>
                  <p className="text-[9px] text-slate-400 italic mt-1 leading-normal">Mampu melupakan waktu bising sekitar demi menuntaskan materi terdesentralisasi.</p>
                </div>

                {/* Strength 2: Creativity & Idea Spark */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-755 mb-1.5">
                    <span className="flex items-center gap-1.5">💡 2. Kreativitas & Divergent Thinking</span>
                    <span className="text-purple-600 font-bold font-mono">95 / 100</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300/30">
                    <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-2.5 rounded-full transition-all duration-500" style={{ width: '95%' }} />
                  </div>
                  <p className="text-[9px] text-slate-400 italic mt-1 leading-normal">Kumpulan ide yang melompat cemerlang. Menulis ide parkir menghemat waktu lu dari keluar jalur.</p>
                </div>

                {/* Strength 3: Pattern Recognition */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-755 mb-1.5">
                    <span className="flex items-center gap-1.5">🧩 3. Pattern Recognition</span>
                    <span className="text-blue-600 font-bold font-mono">78 / 100</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300/30">
                    <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: '78%' }} />
                  </div>
                  <p className="text-[9px] text-slate-400 italic mt-1 leading-normal">Kemampuan mengidentifikasi hubungan spasial antar konsep teknologi di Mindmap.</p>
                </div>
              </div>
            </div>

            {/* Weekly automated congratulatory feedback from AI */}
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex gap-3 text-left">
              <span className="text-xl">👩‍⚕️</span>
              <div>
                <h4 className="text-xs font-extrabold text-[#5B21B6] uppercase font-mono tracking-wider">Weekly Cognitive Review</h4>
                <p className="text-xs text-slate-700 leading-relaxed mt-1">
                  "Minggu ini lu luar biasa. Di saat saraf lu menolak tugas besar, lu bersikap taktis dengan memecah {totalFocusMinutes > 0 ? `${Math.ceil(totalFocusMinutes / 5)} tugas` : 'berbagai tugas harian'} menjadi rincian di bawah 3 menit. Lu 40% lebih maju dari patokan klinis dasar!"
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
