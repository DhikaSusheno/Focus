import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

// Memory cache for tech news to prevent exceeding Gemini API rate limits
let cachedTechNews: any = null;
let lastTechNewsFetchTime = 0;
const TECH_NEWS_CACHE_DURATION = 15 * 60 * 1000; // Cache for 15 minutes

function getGeminiClient() {
  if (!ai) {
    if (!apiKey) {
      console.warn("Pemberitahuan: GEMINI_API_KEY tidak diatur. Beberapa fitur AI mungkin kembali ke mode demo atau simulasi.");
    }
    ai = new GoogleGenAI({
      apiKey: apiKey || 'MOCK_API_KEY_PREVENT_CRASH',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

async function startServer() {
  const app = express();

  // Allow requests from any origin (to support Electron file:// protocols and local/deployed container frames)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  app.use(express.json());

  // API Route: Generate Skill Mindmap
  app.post('/api/gemini/generate-mindmap', async (req, res) => {
    const { skillName, skill, level } = req.body;
    const actualSkill = skillName || skill;
    const targetLevel = level || 'Beginner';

    try {
      if (!actualSkill) {
        return res.status(400).json({ error: 'Nama skill wajib diisi' });
      }

      const client = getGeminiClient();

      const prompt = `Buatkan mind map terstruktur untuk mempelajari skill "${actualSkill}" untuk tingkat "${targetLevel}".
Mind map harus berfokus pada langkah-langkah peningkatan skill secara bertahap yang ramah bagi penderita ADHD (pecah menjadi tugas-tugas kecil yang terarah dengan sistem reward yang jelas).

Kembalikan data dalam format JSON murni dengan mengonfirmasi struktur persis seperti ini:
{
  "title": "Peta Pembelajaran ${actualSkill} (${targetLevel})",
  "nodes": [
    {
      "id": "node-1",
      "label": "Nama Topik / Langkah Pertama (Spesifik & Singkat)",
      "description": "Penjelasan singkat langkah ini serta hasil praktisnya",
      "parentId": null,
      "xpReward": 100,
      "suggestedResources": [
        "Sumber 1: misal video pendek atau panduan 10 menit",
        "Sumber 2: latihan praktik mandiri 15 menit"
      ]
    },
    {
      "id": "node-2",
      "label": "Sub-Topik / Langkah Kedua",
      "description": "Penjelasan sub-langkah ini secara sederhana",
      "parentId": "node-1",
      "xpReward": 150,
      "suggestedResources": [
        "Sumber 1: panduan visual tentang...",
        "Sumber 2: tantangan menulis kode/membuat sesuatu..."
      ]
    }
  ]
}

Pastikan setidaknya ada 6 hingga 8 node dalam bentuk percabangan (pohon) terstruktur (ada satu atau dua root node utama, lalu sub-langkah bercabang di bawah parentId masing-masing).
XP Reward harus berkisar antara 50 hingga 250 per node.
Kembalikan JSON murni saja. Jangan tambahkan penjelasan lain di luar string JSON ini.`;

      if (!apiKey) {
        // Return elegant fallback mock data to prevent blocking
        return res.json(getDemoMindmap(actualSkill, targetLevel));
      }

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Respons kosong diterima dari Gemini API');
      }

      try {
        const cleaned = cleanJsonString(responseText);
        const data = JSON.parse(cleaned);
        return res.json({ ...data, isFallback: false });
      } catch (e) {
        console.warn('Gagal melakukan parsing JSON dari Gemini:', e);
        // Fallback to getDemoMindmap if clean parser completely fails
        throw e;
      }
    } catch (err: any) {
      console.log('Mindmap fallback applied:', err?.message || err);
      // Fallback gracefully on error/limitations
      return res.json({
        ...getDemoMindmap(actualSkill || 'Peta Pikiran', targetLevel),
        isFallback: true,
        details: err?.message || 'Gemini Quota Exceeded'
      });
    }
  });

  // API Route: Worldwide Tech News & Suggestions
  app.post('/api/gemini/tech-news', async (req, res) => {
    try {
      const now = Date.now();
      if (cachedTechNews && (now - lastTechNewsFetchTime < TECH_NEWS_CACHE_DURATION)) {
        console.log('Serving tech news from memory cache');
        return res.json(cachedTechNews);
      }

      const fb = getDemoTechNews();
      if (!apiKey) {
        return res.json(fb);
      }

      const client = getGeminiClient();
      const prompt = `Berikan 4 informasi berita atau tren teknologi terbaru yang sedang populer atau berdampak besar di tingkat global (World Wide Tech News).
Sediakan juga analisis singkat atau saran bagaimana seseorang (terutama penderita ADHD) dapat mulai mempelajari atau bereksperimen dengan teknologi tersebut secara teratur tanpa merasa kewalahan.

Kembalikan data dalam format JSON murni dengan struktur persis seperti berikut:
{
  "news": [
    {
      "id": "news-1",
      "title": "Judul Tren Teknologi Terbaru",
      "category": "Kategori (e.g., AI, Dev, Cloud, Web3)",
      "summary": "Ringkasan inovasi ini dengan bahasa yang mudah dipahami",
      "whyItMatters": "Alasan mengapa ini bernilai tinggi untuk dipelajari karir sekarang",
      "adhdFriendlyStep": "Langkah kecil awal (micro-milestone) berjangka 15 menit untuk memahaminya tanpa kecemasan/distraksi"
    }
  ],
  "generalSaran": "Saran motivasi harian spesifik untuk pengidap ADHD agar dapat bersaing di era digital dengan mempertahankan fokus mereka."
}

Kembalikan JSON murni tanpa menyertakan tanda kutip markdown (\`\`\`json).`;

      let responseText = '';
      let sources: any[] = [];
      let success = false;

      // Tier 1: Try with Google Search Grounding (Highly Contextual + Real-time)
      try {
        console.log('Attempting grounded tech-news request to Gemini');
        const response = await client.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            tools: [{ googleSearch: {} }],
          }
        });

        if (response.text) {
          responseText = response.text;
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
          sources = chunks ? chunks.map((c: any) => ({
            url: c.web?.uri,
            title: c.web?.title
          })).filter((s: any) => s.url) : [];
          success = true;
        }
      } catch (searchErr: any) {
        console.warn('Grounded request limits exceeded, attempting standard ungrounded model request:', searchErr?.message || searchErr);
      }

      // Tier 2: Retry with standard non-grounded prompt (Lower quota footprint)
      if (!success) {
        try {
          const response = await client.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            }
          });

          if (response.text) {
            responseText = response.text;
            success = true;
          }
        } catch (stdErr: any) {
          console.warn('Standard generation failed as well:', stdErr?.message || stdErr);
        }
      }

      if (!success || !responseText) {
        throw new Error('Gemini API quota depleted or connection refused on all modes.');
      }

       let finalData: any = null;
 
       try {
         const cleanText = cleanJsonString(responseText);
         const parsed = JSON.parse(cleanText);
         finalData = { ...parsed, sources };
       } catch (parseErr) {
         console.warn('Gagal melakukan parsing JSON dari Gemini tech-news, dialihkan:', parseErr);
         throw parseErr;
       }

      if (finalData && finalData.news && finalData.news.length > 0) {
        cachedTechNews = finalData;
        lastTechNewsFetchTime = now;
      }

      return res.json(finalData);
    } catch (err: any) {
      console.log('Tech news fallback silently applied:', err?.message || err);
      // Return 200 OK with fallbacks so the app processes it seamlessly
      const fallback = getDemoTechNews();
      return res.json({
        ...fallback,
        sources: [],
        isFallback: true,
        fallbackReason: err?.message || 'API Limit'
      });
    }
  });

  // Helper to clean JSON response from Gemini markdown codeblocks and conversational text
  function cleanJsonString(raw: string): string {
    let cleanText = raw.trim();
    
    // Attempt block level braces or brackets extraction first (most resilient to markdown text wrap issues)
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    const firstBracket = cleanText.indexOf('[');
    const lastBracket = cleanText.lastIndexOf(']');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      // Check if bracket is outer of brace
      if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < firstBrace && lastBracket > lastBrace) {
        cleanText = cleanText.substring(firstBracket, lastBracket + 1);
      } else {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }
    } else if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleanText = cleanText.substring(firstBracket, lastBracket + 1);
    } else if (cleanText.includes('```')) {
      // Split on first ``` block
      const parts = cleanText.split('```');
      // Second part usually holds the code
      const block = parts[1] || parts[0];
      cleanText = block.trim();
      if (cleanText.startsWith('json')) {
        cleanText = cleanText.substring(4).trim();
      }
    }
    // Remove trailing/leading backticks if any
    cleanText = cleanText.replace(/^```|```$/g, '').trim();
    
    // Regex clean illegal trailing commas before closing braces/brackets
    cleanText = cleanText.replace(/,(\s*[\]}])/g, '$1');
    
    return cleanText;
  }

  // API Route: Convert complex messy notes / brainstorm dumps to highly organized task list for ADHD
  app.post('/api/gemini/braindump-converter', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Teks braindump harian kosong' });
      }

      if (!apiKey) {
        return res.json({
          tasks: [
            { title: "Rapikan tab browser yang tidak dipakai", complexity: "Mudah", xp: 40, reason: "Menghapus noise visual yang membuat pikiran cemas harian." },
            { title: "Tulis 3 poin ide terpenting ke jurnal", complexity: "Sedang", xp: 75, reason: "Menyelamatkan ide brilian dari kelupaan jangka panjang." },
            { title: "Pilih 1 tugas mini untuk dikerjakan besok", complexity: "Sedang", xp: 75, reason: "Memberikan kejelasan tugas berikutnya saat baru bangun tidur." },
            { title: "Sesi rehat otot 10 menit ditenangkan musik", complexity: "Mudah", xp: 40, reason: "Menyegarkan kembali simpanan dopamin yang lelah harian." }
          ]
        });
      }

      const client = getGeminiClient();
      const prompt = `Ubah teks "Brain Dump" (limpahan pemikiran kacau, penuh ide melompat-lompat khas penderita ADHD) berikut menjadi daftar 4 tugas atau misi mikro (checklist) yang terstruktur, konkret, dan sangat mudah dijalankan tanpa memicu kelumpuhan analisis (visual paralysis).

Teks braindump: "${text}"

Kembalikan data respon dalam format JSON murni persis dengan struktur ini:
{
  "tasks": [
    {
      "title": "Nama Tugas Mikro (Konkret, positif, max 60 karakter)",
      "complexity": "Mudah" | "Sedang" | "Tinggi",
      "xp": 75, // Berikan estimasi XP (Mudah: 40, Sedang: 75, Tinggi: 100)
      "reason": "Alasan singkat mengapa langkah mikro ini meringankan beban kepala otak ADHD"
    }
  ]
}

Pastikan teks respon hanya berupa string JSON murni tanpa hiasan markup markdown apapun.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Respons kosong diterima dari Gemini API');
      }

      const cleanText = cleanJsonString(responseText);
      const data = JSON.parse(cleanText);
      return res.json(data);
    } catch (err: any) {
      console.log('Braindump converter fallback applied:', err?.message || err);
      // Fallback elegant mock
      return res.json({
        tasks: [
          { title: "Rapikan daftar tab browser menumpuk", complexity: "Mudah", xp: 40, reason: "Langkah visual cepat ini mendinginkan otak yang penuh." },
          { title: "Tulis outline proyek impian Anda di notepad", complexity: "Sedang", xp: 75, reason: "Mencegah ide brilian lekas menguap." },
          { title: "Siapkan 1 botol air minum di dekat komputer", complexity: "Mudah", xp: 40, reason: "Kebiasaan sehat sederhana penunjang fokus kognitif." }
        ]
      });
    }
  });

  // API Route: AI Daily Notepad summarizing & ADHD feedback analysis
  app.post('/api/gemini/summarize-journal', async (req, res) => {
    try {
      const { notes, targets } = req.body;
      if (!notes && !targets) {
        return res.status(400).json({ error: 'Data evaluasi kosong' });
      }

      if (!apiKey) {
        return res.json({
          achievements: [
            "Menangkap aliran pikiran orisinal ke dalam Notepad harian.",
            "Berhasil mendaftar target jangka pendek agar tidak melompat fokus.",
            "Menggunakan visualizer ADHD untuk memecah kecemasan harian."
          ],
          burnoutLevel: "Rendah. Pola harian Anda dinilai cukup adaptif dan aman hari ini.",
          adhdSaran: "Saran ADHD: Biasakan tidur dengan durasi yang konsisten. Otak ADHD sangat peka terhadap defisit istirahat malam. Tetapkan batas tegas bermain gawai.",
          bulletSummary: "Anda menunjukkan minat belajar yang besar hari ini. Menyalakan tracking, menuliskan kesimpulan di notepad harian, dan mendaftar target adalah pencapaian istimewa yang patut dihargai tinggi. Teruslah tumbuh perlahan!"
        });
      }

      const client = getGeminiClient();
      const prompt = `Tolong bantu analisis Catatan Harian (Notepad) dan Daftar Target ADHD yang ditulis oleh pengguna hari ini. Berikan umpan balik yang penuh apresiasi, empati tinggi, analisis kelelahan/stres fisik, dan saran kognitif terapeutik harian yang cocok bagi penderita ADHD dalam format bullet yang rapi.

Catatan Harian: "${notes || '(Kosong)'}"
Daftar Target: "${targets || '(Kosong)'}"

Kembalikan respon dalam format JSON murni persis seperti ini:
{
  "achievements": [
    "Pencapaian kecil/hal baik yang bisa diapresiasi dari tulisan mereka (maksimal 3 poin)"
  ],
  "burnoutLevel": "Tingkat Burnout: Rendah / Sedang / Tinggi + alasan pendeteksian singkat",
  "adhdSaran": "Saran terapeutik khusus pengidap ADHD untuk menjamin produktivitas esok hari",
  "bulletSummary": "Ringkasan kesimpulan evaluatif harian penuh motivasi ramah ADHD dalam 2 paragraf pendek"
}

Pastikan respon hanya string JSON yang valid tanpa tambahan penjelasan apa-apa.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Respons kosong diterima dari Gemini API');
      }

      const cleanText = cleanJsonString(responseText);
      const data = JSON.parse(cleanText);
      return res.json(data);
    } catch (err: any) {
      console.log('Summarize journal fallback applied:', err?.message || err);
      // elegant mock fallback
      return res.json({
        achievements: [
          "Melakukan jurnalisasi harian untuk menjernihkan pikiran.",
          "Mengevaluasi target agar pengerjaan beralih secara logis."
        ],
        burnoutLevel: "Sedang harian. Otak Anda menunjukkan performa eksploratif namun memerlukan rehat sejenak.",
        adhdSaran: "Disarankan bersantai 10 menit sambil memejamkan mata secara utuh.",
        bulletSummary: "Menyuarakan gagasan melimpah dalam notepad merangsang pelepasan muatan pikiran yang padat. Anda bertindak cerdas dengan menuliskannya hari ini!"
      });
    }
  });

  // Serve static assets/dev mode integration
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist/index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server ADHD Control & Tech Mindmapping sedang berjalan di port ${port}`);
  });
}

// Fallback Demo Data Generator for Mindmap
function getDemoMindmap(skill: string, level: string) {
  return {
    title: `Peta Pembelajaran ${skill} (${level}) [Mode Demo]`,
    nodes: [
      {
        id: 'node-1',
        label: `Pengenalan Dasar ${skill}`,
        description: `Memahami konsep inti dari ${skill} tanpa kecemasan. Mulailah dari gambaran besarnya dahulu.`,
        parentId: null,
        xpReward: 100,
        suggestedResources: [
          "Membaca glosarium atau istilah populer selama 5 menit.",
          "Menonton video animasi pengantar di YouTube (durasi di bawah 10 menit)."
        ]
      },
      {
        id: 'node-2',
        label: 'Alat dan Lingkungan Kerja',
        description: 'Menyiapkan alat pendukung utama. Struktur visual yang rapi memudahkan fokus.',
        parentId: 'node-1',
        xpReward: 120,
        suggestedResources: [
          "Unduh editor kode (VS Code) atau alat khusus terpilih.",
          "Buat checklist instalasi sederhana dan coret jika selesai."
        ]
      },
      {
        id: 'node-3',
        label: 'Proyek Latihan Pertama (Mini)',
        description: 'Membuat produk nyata berukuran mikro dalam waktu kurang dari 15 menit agar segera mendapatkan dopamin!',
        parentId: 'node-2',
        xpReward: 180,
        suggestedResources: [
          "Ubah teks warna/tema atau buat fungsi log sederhana.",
          "Rayakan penyelesaian langkah pertama Anda!"
        ]
      },
      {
        id: 'node-4',
        label: 'Konsep Logika Sederhana',
        description: 'Memahami bagaimana data dialirkan secara runut sekilas.',
        parentId: 'node-1',
        xpReward: 150,
        suggestedResources: [
          "Lakukan latihan teka-teki logika pendek.",
          "Gambarkan diagram alir sederhana di kertas coret-coret."
        ]
      },
      {
        id: 'node-5',
        label: 'Menghubungkan Bagian-Bagian Kecil',
        description: 'Menggabungkan potongan pengetahuan pertama Anda ke dalam proyek yang bermakna.',
        parentId: 'node-3',
        xpReward: 200,
        suggestedResources: [
          "Gabungkan proyek latihan mini Anda dengan fitur baru.",
          "Ceritakan kemajuan ini kepada teman belajar atau di jurnal harian."
        ]
      },
      {
        id: 'node-6',
        label: 'Evaluasi & Peningkatan Level',
        description: 'Meninjau kemajuan Anda, meremajakan fokus, dan membuka materi tingkat berikutnya.',
        parentId: 'node-5',
        xpReward: 250,
        suggestedResources: [
          "Catat apa yang berhasil berjalan baik hari ini.",
          "Ambil waktu istirahat yang bermakna sebelum melompat ke materi selanjutnya."
        ]
      }
    ]
  };
}

// Fallback Demo Data Generator for Tech News
function getDemoTechNews() {
  return {
    news: [
      {
        id: "demo-1",
        title: "Perkembangan Model AI Agentic yang Mandiri di Dunia Industri",
        category: "Artificial Intelligence",
        summary: "Sistem kecerdasan buatan kini bergeser dari sekadar menjawab teks menjadi AI Agent yang mampu mengeksekusi multi-langkah tugas rumit secara otonom di browser atau database.",
        whyItMatters: "Memahami AI Agent membuka peluang karir sebagai AI Architect atau Developer yang mengotomatiskan workflow perusahaan.",
        adhdFriendlyStep: "Coba pasang pustaka sederhana (seperti mendownload template open-source AI Agent) lalu amati cara ia membagi tugasnya."
      },
      {
        id: "demo-2",
        title: "Peningkatan Adopsi framework Web Berkecepatan Tinggi (Next.js 16 & Vite 6)",
        category: "Web Development",
        summary: "Framework modern saat ini memprioritaskan efisiensi memory, loading instant, dan modularisasi optimal demi kepuasan pengguna global.",
        whyItMatters: "Pengembangan front-end menuntut pembuatan visual interaktif tanpa lag yang sangat sejalan dengan ekspektasi produk berkualitas tinggi.",
        adhdFriendlyStep: "Buat halaman web kosong super cepat dengan Vite hanya dalam waktu 3 menit, rasakan dopamin instan saat melihatnya online!"
      },
      {
        id: "demo-3",
        title: "Popularitas Teknologi Cloud-Native Tanpa Server (Serverless Containers)",
        category: "Cloud Computing",
        summary: "Aplikasi sekarang dideploy secara global ke serverless container yang mati otomatis saat tidak digunakan untuk menghemat biaya.",
        whyItMatters: "Developer tidak perlu lagi mengatur server Linux secara manual, cukup fokus menulis logika kode.",
        adhdFriendlyStep: "Lihat video singkat berdurasi 5 menit yang menggambarkan konsep 'Server di Awan' secara visual interaktif."
      },
      {
        id: "demo-4",
        title: "Kebangkitan Desain Interface Spasial (UI/UX Imersif & AR/VR)",
        category: "Design & UX",
        summary: "Desain UI mulai beralih dari layar dua dimensi ke dunia nyata menggunakan Augmented Reality yang memadukan visual alami dengan data fisik.",
        whyItMatters: "Mempelajari interaksi spasial membuka karir di bidang visualisasi masa depan di dunia medis dan game.",
        adhdFriendlyStep: "Coba instal simulator interaksi 3D gratis di ponsel Anda dan geser benda-benda virtual di ruangan Anda."
      }
    ],
    generalSaran: "Trik Belajar untuk ADHD: Gunakan teknik 'Micro-Learning'—cukup pilih satu konsep menarik di atas, pasang timer selama 10 menit, dan matikan semua tab lainnya. Setelah selesai, coret tugas itu dan klaim poin reward Anda harian!"
  };
}

startServer();
