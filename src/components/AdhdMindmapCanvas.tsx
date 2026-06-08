import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Download, HelpCircle, Save, Plus, ArrowRight, Trash2, Mic, MicOff } from 'lucide-react';
import { MindmapNode, Mindmap } from '../types';

interface AdhdMindmapCanvasProps {
  mindmap: Mindmap | null;
  onUpdateMindmap: (newMindmap: Mindmap) => void;
  onCompleteNodeCallback: (nodeId: string, xpReward: number) => void;
  parkingIdeas: string[];
  onUpdateParkingIdeas: (ideas: string[]) => void;
  playSound: (type: 'success' | 'click' | 'levelUp' | 'redeem') => void;
  triggerBanner: (msg: string) => void;
  uName: string;
}

export default function AdhdMindmapCanvas({
  mindmap,
  onUpdateMindmap,
  onCompleteNodeCallback,
  parkingIdeas,
  onUpdateParkingIdeas,
  playSound,
  triggerBanner,
  uName
}: AdhdMindmapCanvasProps) {
  // Draggable Node Position state map: node_id -> {x, y}
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Voice recording simulation
  const [isRecording, setIsRecording] = useState(false);
  const [voiceInputSimText, setVoiceInputSimText] = useState('');
  const [isSynthesizingMindmap, setIsSynthesizingMindmap] = useState(false);

  // Ideas Parking inputs
  const [newParkedInput, setNewParkedInput] = useState('');

  // Local Brain Dump Text input
  const [brainDumpTextInput, setBrainDumpTextInput] = useState('');

  // Default coordinate branch out on layout mount or mindmap change
  useEffect(() => {
    if (mindmap && mindmap.nodes.length > 0) {
      const positions: Record<string, { x: number; y: number }> = {};
      const center = { x: 340, y: 220 };
      
      mindmap.nodes.forEach((node, idx) => {
        if (idx === 0) {
          positions[node.id] = { x: center.x, y: center.y };
        } else {
          // Branch out spirally
          const angle = (idx * (2 * Math.PI)) / (mindmap.nodes.length - 1);
          const radius = 140 + (idx % 2 === 0 ? 30 : 0);
          positions[node.id] = {
            x: Math.round(center.x + Math.cos(angle) * radius),
            y: Math.round(center.y + Math.sin(angle) * radius),
          };
        }
      });
      setNodePositions(positions);
    }
  }, [mindmap?.title]); // reload when title changes (new mindmap generated)

  // Drag-and-drop controller
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    const pos = nodePositions[nodeId] || { x: 100, y: 100 };
    setDraggedNodeId(nodeId);
    dragOffsetRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggedNodeId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max(50, e.clientX - dragOffsetRef.current.x), 650);
    const y = Math.min(Math.max(50, e.clientY - dragOffsetRef.current.y), 450);

    setNodePositions(prev => ({
      ...prev,
      [draggedNodeId]: { x, y }
    }));
  };

  const handleCanvasMouseUp = () => {
    setDraggedNodeId(null);
  };

  // Ide Parkir - save current distraction to local storage
  const handleParkIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParkedInput.trim()) return;

    playSound('success');
    const updated = [newParkedInput.trim(), ...parkingIdeas];
    onUpdateParkingIdeas(updated);
    setNewParkedInput('');
    triggerBanner("💡 Ide liar berhasil diparkir! Pikiran lu sekarang bersih untuk fokus kembali.");
  };

  const handleRemoveParkedIdea = (idxToRemove: number) => {
    playSound('click');
    onUpdateParkingIdeas(parkingIdeas.filter((_, i) => i !== idxToRemove));
  };

  // Convert Brain Dump to Mindmap node structure simulating AI
  const handleTriggerBrainDumpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToUse = brainDumpTextInput.trim() || voiceInputSimText.trim();
    if (!textToUse) return;

    setIsSynthesizingMindmap(true);
    playSound('click');

    try {
      const response = await fetch('/api/gemini/generate-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: `Pikiran Bebas: ${textToUse.slice(0, 30)}...`,
          level: 'ADHD Brain Dump'
        })
      });

      if (!response.ok) throw new Error("Gagal generate mindmap");
      const data = await response.json();
      
      if (data && data.nodes) {
        onUpdateMindmap({
          title: data.title || `Peta Pemikiran Bebas: ${uName}`,
          nodes: data.nodes,
          completedNodes: []
        });
        playSound('levelUp');
        triggerBanner("🧠 Mindmap Spasial AI berhasil dipetakan dari limpahan pikiran harian!");
      }
    } catch (err) {
      console.error(err);
      triggerBanner("⚠️ Ups! Hubungan server lambat, gagal memproses mindmap.");
    } finally {
      setIsSynthesizingMindmap(false);
      setBrainDumpTextInput('');
      setVoiceInputSimText('');
    }
  };

  // EXPORTERS: notion, obsidian, notepad, pdf
  const handleExportMindmap = (format: 'notion' | 'obsidian' | 'notepad' | 'pdf') => {
    if (!mindmap) return;
    playSound('redeem');

    let content = '';
    const title = mindmap.title || 'Peta Pikiran ADHD';

    if (format === 'obsidian') {
      content = `# ${title}\n\n`;
      mindmap.nodes.forEach((node) => {
        content += `## [[${node.label}]]\n${node.description}\n`;
        if (node.parentId) {
          content += `- Terhubung ke: [[${mindmap.nodes.find(n => n.id === node.parentId)?.label}]]\n`;
        }
        content += `\n`;
      });
    } else if (format === 'notion') {
      content = `# Notion Database Template: ${title}\n\n`;
      mindmap.nodes.forEach((node) => {
        content += `- [ ] **${node.label}** | Deskripsi: ${node.description}\n`;
      });
    } else {
      content = `====================================\n${title}\n====================================\n\n`;
      mindmap.nodes.forEach((node, index) => {
        content += `${index + 1}. Misi: ${node.label}\n`;
        content += `   Deskripsi: ${node.description}\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ADHD_Mindmap_Export_${format}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    triggerBanner(`🌐 Mindmap berhasil diekspor ke format ${format.toUpperCase()}!`);
  };

  // Recording Voice simulation
  const handleToggleVoiceRecord = () => {
    playSound('click');
    if (!isRecording) {
      setIsRecording(true);
      setVoiceInputSimText("Saya ingin belajar membuat aplikasi microservices di Node JS tapi saya takut kewalahan..");
      setTimeout(() => {
        setIsRecording(false);
        playSound('success');
        triggerBanner("🎙️ Suara berhasil direkam & didekoding via AI Speech-to-Text!");
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  // Node completing triggers XP reward harian
  const toggleNodeCompletion = (nodeId: string) => {
    if (!mindmap) return;
    playSound('click');

    const isDone = mindmap.completedNodes.includes(nodeId);
    let updatedCompleted = [...mindmap.completedNodes];

    if (isDone) {
      updatedCompleted = updatedCompleted.filter(id => id !== nodeId);
    } else {
      updatedCompleted.push(nodeId);
      // grant reward!
      const targetNode = mindmap.nodes.find(n => n.id === nodeId);
      if (targetNode) {
        onCompleteNodeCallback(nodeId, targetNode.xpReward);
      }
    }

    onUpdateMindmap({
      ...mindmap,
      completedNodes: updatedCompleted
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      
      {/* LEFT COLUMN: Brain Dump & Auto-Link Voice Brainstorming */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Brain Dump Form Input */}
        <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-sm">
          <div className="border-b border-rose-50 pb-2 mb-4">
            <h3 className="text-xs font-extrabold text-[#7C2D12] uppercase tracking-wider font-mono">
              🌋 Katarsis Brain Dump ADHD
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Tumpahkan ide kusutmu di sini, AI akan merakitnya jadi bagan</p>
          </div>

          <form onSubmit={handleTriggerBrainDumpSubmit} className="flex flex-col gap-3">
            <textarea
              value={brainDumpTextInput}
              onChange={(e) => setBrainDumpTextInput(e.target.value)}
              placeholder="Tuliskan limpahan kecemasan atau ide liar di kepalamu sekarang harian..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-orange-400 text-slate-800"
            />
            
            <button
              type="submit"
              disabled={isSynthesizingMindmap || !brainDumpTextInput.trim()}
              className="w-full bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white font-extrabold text-[11px] py-3 rounded-xl transition-all shadow"
            >
              {isSynthesizingMindmap ? 'Sedang Memetakan...' : '🧠 Petakan pikiran liar harian'}
            </button>
          </form>
        </div>

        {/* Brainstorming Voice Recorder Simulation (Modul 2) */}
        <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-sm flex flex-col gap-3">
          <div>
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">🎙️ Voice-to-Mindmap Simulation</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Tahan mic, ceritakan ide besarmu untuk dianalisis otomatis</p>
          </div>

          <div className="flex flex-col items-center gap-3 bg-[#FCF8F5] p-4 rounded-2xl border border-orange-50 text-center relative overflow-hidden">
            {isRecording && (
              <div className="absolute inset-0 bg-orange-500/5 animate-pulse flex items-center justify-center pointer-events-none">
                {/* Simulated vocal waveform visual feedback */}
                <span className="h-6 w-1 bg-orange-400 rounded mx-0.5 animate-bounce" />
                <span className="h-10 w-1 bg-orange-500 rounded mx-0.5 animate-bounce [animation-delay:0.2s]" />
                <span className="h-4 w-1 bg-orange-450 rounded mx-0.5 animate-bounce [animation-delay:0.4s]" />
                <span className="h-8 w-1 bg-orange-500 rounded mx-0.5 animate-bounce [animation-delay:0.1s]" />
              </div>
            )}

            <button
              onClick={handleToggleVoiceRecord}
              className={`w-14 h-14 rounded-full flex items-center justify-center border-4 ${
                isRecording 
                  ? 'bg-rose-500 border-rose-200 text-white animate-pulse' 
                  : 'bg-white hover:bg-orange-55 border-orange-200 text-orange-550'
              } shadow-md transition-all`}
            >
              <Mic className="w-6 h-6" />
            </button>

            <span className="text-[10px] text-slate-550 font-bold">
              {isRecording ? "Sedang merekam suara lu..." : "Klik tombol merah untuk merekam"}
            </span>

            {voiceInputSimText && !isRecording && (
              <div className="bg-white p-2.5 rounded-xl border border-orange-100/50 w-full text-left">
                <span className="text-[9px] font-bold text-slate-400">Hasil transkrip harian:</span>
                <p className="text-[10px] text-slate-700 italic mt-0.5">"{voiceInputSimText}"</p>
                <button
                  onClick={handleTriggerBrainDumpSubmit}
                  className="w-full bg-slate-900 border border-slate-950 text-white font-extrabold text-[9px] py-1.5 rounded-lg mt-2 text-center"
                >
                  Rakit jadi visual card mindmap harian →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* "Ide Parkir" Tab (Distraction preventer) */}
        <div className="bg-[#FFFDF9] p-5 rounded-3xl border border-orange-100 shadow-sm flex flex-col gap-3">
          <div>
            <h4 className="text-xs font-extrabold text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
              🅿️ "Ide Parkir" Distraction Tray
            </h4>
            <p className="text-[10px] text-orange-800 mt-0.5">Simpan distraksi liar (e.g. "beli martabak") agar pikiran kembali hening sekarang.</p>
          </div>

          <form onSubmit={handleParkIdea} className="flex gap-2">
            <input
              type="text"
              value={newParkedInput}
              onChange={(e) => setNewParkedInput(e.target.value)}
              placeholder="e.g. 'cari harga kucing persia'"
              className="flex-1 bg-white border border-orange-200/60 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-orange-400 text-slate-850"
            />
            <button
              type="submit"
              disabled={!newParkedInput.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white px-3.5 py-1 text-xs rounded-xl font-extrabold shadow"
            >
              Parkir
            </button>
          </form>

          {/* Parked ideas list */}
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto mt-1 pr-1">
            {parkingIdeas.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">Belum ada ide yang diparkir. Bagus! Pikiran lu hening.</p>
            ) : (
              parkingIdeas.map((idea, idx) => (
                <div key={idx} className="bg-white p-2 border border-orange-100 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-755 shadow-sm">
                  <span className="truncate flex-1 pr-2">📌 {idea}</span>
                  <button
                    onClick={() => handleRemoveParkedIdea(idx)}
                    className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: 2D Spatial Thinking Mindmap Canvas & Exporter */}
      <div className="lg:col-span-8 flex flex-col gap-4 bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
        
        {/* Canvas Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-orange-50 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
              🎮 {mindmap ? mindmap.title : '2D Spatial Brain Map: Non-Linear Canvas'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Geser node bebes di bawah! ADHD berpikir spasial—bukan daftar lurus kaku.
            </p>
          </div>
          
          {/* Exporter Dropdown widget */}
          {mindmap && (
            <div className="flex items-center gap-1.5 mt-3 sm:mt-0">
              <button
                onClick={() => handleExportMindmap('notepad')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-200"
              >
                Notepad Export
              </button>
              <button
                onClick={() => handleExportMindmap('obsidian')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-200"
              >
                Obsidian
              </button>
              <button
                onClick={() => handleExportMindmap('notion')}
                className="bg-slate-150 hover:bg-slate-250 text-indigo-750 font-bold text-[10px] px-2.5 py-1.5 rounded-lg border border-indigo-200"
              >
                Notion Database
              </button>
            </div>
          )}
        </div>

        {/* Actual Draggable Interactive SVG/HTML Area */}
        <div 
          className="relative w-full h-[480px] bg-sky-50/20 border border-slate-150 rounded-2xl overflow-hidden cursor-crosshair shadow-inner"
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          
          {mindmap ? (
            <>
              {/* SVG connection lines rendering */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {mindmap.nodes.map((node) => {
                  if (!node.parentId) return null;
                  const start = nodePositions[node.parentId];
                  const end = nodePositions[node.id];
                  if (!start || !end) return null;

                  return (
                    <line
                      key={`${node.parentId}-${node.id}`}
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke={mindmap.completedNodes.includes(node.id) ? '#10B981' : '#CBD5E1'}
                      strokeWidth={mindmap.completedNodes.includes(node.id) ? '4' : '2'}
                      strokeDasharray={mindmap.completedNodes.includes(node.id) ? '0' : '4,4'}
                      className="transition-all"
                    />
                  );
                })}
              </svg>

              {/* Render Nodes as aesthetic drag items */}
              {mindmap.nodes.map((node, index) => {
                const pos = nodePositions[node.id] || { x: 100, y: 100 };
                const isCompleted = mindmap.completedNodes.includes(node.id);
                const isCenter = index === 0;

                return (
                  <div
                    key={node.id}
                    style={{
                      left: pos.x - (isCenter ? 44 : 36),
                      top: pos.y - (isCenter ? 44 : 36),
                      position: 'absolute'
                    }}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    className={`select-none cursor-move transition-shadow z-10 flex flex-col items-center justify-center ${
                      isCenter 
                        ? 'w-22 h-22 bg-[#FFF7ED] border-4 border-orange-400 text-orange-900 rounded-full' 
                        : isCompleted 
                        ? 'w-18 h-18 bg-[#ECFDF5] border-3 border-emerald-400 text-emerald-900 rounded-2xl'
                        : 'w-18 h-18 bg-[#F5F3FF] border-3 border-indigo-400 text-indigo-900 rounded-xl'
                    } shadow-md hover:shadow-lg text-center p-1.5`}
                  >
                    <span className="text-[10px] font-bold leading-tight line-clamp-2">
                      {node.label}
                    </span>
                    
                    <span className="text-[8px] font-mono font-bold mt-1 text-slate-400">
                      {isCenter ? "Root" : isCompleted ? "✓" : `+${node.xpReward}XP`}
                    </span>

                    {/* Completion Toggle Overlay Mini Button */}
                    {!isCenter && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleNodeCompletion(node.id); }}
                        className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] border shadow-sm ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-600 text-white'
                            : 'bg-white border-indigo-300 text-indigo-650 hover:bg-indigo-50'
                        }`}
                      >
                        ✓
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Float instructional guide */}
              <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1.5 rounded-xl border border-slate-150 text-[10px] font-semibold text-slate-500 z-10 pointers-events-none">
                📍 Tekan & geser lingkaran bebes untuk menata struktur spasial ide lu!
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-6 text-slate-500">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 border border-rose-100 rounded-full flex items-center justify-center text-2xl font-bold animate-bounce shadow-sm">
                🔍
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Mindmap Masih Kosong</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                  Tulis ide atau keluhan lu di panel kiri (🌋 Katarsis Brain Dump) harian untuk dirumuskan ke dalam bagan non-linear visual AI secara cepat.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
