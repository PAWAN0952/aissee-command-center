import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { extractText, getDocumentProxy } from 'unpdf';

export type MaterialType = 'textbook' | 'scert' | 'syllabus' | 'notes';

export interface KnowledgeChunk {
  id: string;
  materialId: string;
  location: string;
  text: string;
  embedding?: number[];
}

export interface StoredMaterial {
  id: string;
  title: string;
  materialType: MaterialType;
  classLevel: string; // '6' | '7' | '8' | '9' | '10' | 'All'
  subject: string;
  chapter: string;
  fileName: string;
  storedFileName?: string;
  chunkCount: number;
  wordCount: number;
  active: boolean;
  isBuiltIn: boolean;
  uploadedAt: string;
  chunks: KnowledgeChunk[];
}

export interface RetrievedSource {
  materialId: string;
  title: string;
  materialType: MaterialType;
  classLevel: string;
  subject: string;
  location: string;
  snippet: string;
  score: number;
}

const KNOWLEDGE_DIR = path.resolve(process.cwd(), 'data', 'knowledge');
const UPLOADS_DIR = path.resolve(KNOWLEDGE_DIR, 'uploads');
const STORE_FILE = path.resolve(KNOWLEDGE_DIR, 'materials.json');

function assertConfinedPath(targetPath: string, baseDir: string): string {
  const resolved = path.resolve(targetPath);
  if (!resolved.startsWith(baseDir + path.sep)) {
    throw new Error('Path traversal attempt blocked');
  }
  return resolved;
}

function ensureStorageDirs() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function chunkText(rawText: string, materialId: string, locationPrefix: string): KnowledgeChunk[] {
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
  if (!normalized) return [];

  const maxChars = 900;
  const overlap = 140;
  const chunks: KnowledgeChunk[] = [];

  let cursor = 0;
  let partIdx = 1;
  while (cursor < normalized.length) {
    let end = Math.min(normalized.length, cursor + maxChars);
    if (end < normalized.length) {
      const lastPeriod = normalized.lastIndexOf('.', end);
      const lastNewline = normalized.lastIndexOf('\n', end);
      const cut = Math.max(lastPeriod, lastNewline);
      if (cut > cursor + 400) {
        end = cut + 1;
      }
    }
    const piece = normalized.slice(cursor, end).trim();
    if (piece.length > 30) {
      chunks.push({
        id: `${materialId}-c${chunks.length + 1}`,
        materialId,
        location: `${locationPrefix}${partIdx > 1 ? ` (Part ${partIdx})` : ''}`,
        text: piece,
      });
    }
    if (end >= normalized.length) break;
    cursor = Math.max(cursor + 200, end - overlap);
    partIdx += 1;
  }

  return chunks;
}

function buildSeededMaterials(): StoredMaterial[] {
  const seeds: Array<{
    id: string;
    title: string;
    materialType: MaterialType;
    classLevel: string;
    subject: string;
    chapter: string;
    sections: Array<{ location: string; text: string }>;
  }> = [
    {
      id: 'builtin-aissee-pattern',
      title: 'NTA AISSEE Class 9 Official Exam Blueprint & Syllabus Summary',
      materialType: 'syllabus',
      classLevel: '8',
      subject: 'All',
      chapter: 'Official Pattern & Qualifying Criteria',
      sections: [
        {
          location: 'NTA Official Pattern · Sec 1',
          text:
            'AISSEE Class IX Admission Exam Pattern (Conducted by National Testing Agency - NTA): Mode is Offline Pen-and-Paper (OMR Sheet), English medium only, total duration 180 minutes (3 hours), 150 multiple-choice questions carrying 400 total marks with NO negative marking. Section A Mathematics: 50 Qs x 4 marks = 200 marks (25% qualifying = 50 marks). Section B Intelligence: 25 Qs x 2 marks = 50 marks (qualifying = 12.5). Section C English: 25 Qs x 2 marks = 50 marks. Section D General Science: 25 Qs x 2 marks = 50 marks. Section E Social Science: 25 Qs x 2 marks = 50 marks. Overall minimum qualifying requirement: at least 25% in each subject and 40% aggregate (160/400 marks).',
        },
        {
          location: 'AISSEE Class 9 · Core Syllabus Scope',
          text:
            'AISSEE Class 9 syllabus aligns directly with NCERT Class 8 curriculum. Mathematics covers Rational Numbers, Linear Equations in One Variable, Understanding Quadrilaterals, Squares & Square Roots, Cubes & Cube Roots, Comparing Quantities (Percentage, Discount, Profit & Loss, Simple & Compound Interest), Algebraic Expressions & Identities, Mensuration (Area of Trapezium, Surface Area & Volume of Cube, Cuboid, Cylinder), Exponents & Powers, Direct & Inverse Proportions, Factorisation, Data Handling & Probability. Science covers Crop Production, Microorganisms, Coal & Petroleum, Combustion & Flame, Conservation, Cell Structure, Reproduction, Adolescence, Force & Pressure, Friction, Sound, Chemical Effects of Current, Light, and Stars/Solar System.',
        },
      ],
    },
    {
      id: 'builtin-math-primer',
      title: 'SCERT & NCERT Class 6–10 Mathematics Formula & Concept Primer',
      materialType: 'scert',
      classLevel: 'All',
      subject: 'Mathematics',
      chapter: 'Core Arithmetic, Algebra & Mensuration',
      sections: [
        {
          location: 'Unit 1 · Rational Numbers & Equations',
          text:
            'Rational Numbers: Any number in the form p/q where p, q are integers and q != 0. Additive inverse of a/b is -a/b (sum is 0). Multiplicative inverse (reciprocal) of a/b is b/a (product is 1). Distributive property: a(b + c) = ab + ac. Linear Equations in One Variable: Keep variables on LHS and constants on RHS using transposition; always verify the solution by substituting back into LHS and RHS.',
        },
        {
          location: 'Unit 2 · Squares, Cubes & Algebraic Identities',
          text:
            'Pythagorean Triplet: For any natural number m > 1, (2m, m^2 - 1, m^2 + 1) forms a Pythagorean triplet. Numbers ending in 2, 3, 7, or 8 are never perfect squares. Standard Algebraic Identities: (a+b)^2 = a^2 + 2ab + b^2; (a-b)^2 = a^2 - 2ab + b^2; a^2 - b^2 = (a+b)(a-b); (x+a)(x+b) = x^2 + (a+b)x + ab. For Quadratic Equations (Class 10): ax^2 + bx + c = 0 has roots (-b +/- sqrt(b^2 - 4ac)) / (2a), and discriminant D = b^2 - 4ac.',
        },
        {
          location: 'Unit 3 · Comparing Quantities & Mensuration',
          text:
            'Simple Interest SI = (P * R * T) / 100. Compound Interest compounded annually: A = P(1 + R/100)^n and CI = A - P. When compounded half-yearly, rate becomes R/2 and time periods become 2n. Discount = Marked Price - Selling Price. Profit % = (Profit / Cost Price) * 100. Mensuration formulas: Area of trapezium = 1/2 * (a + b) * h; Area of rhombus = 1/2 * d1 * d2; Cylinder curved surface area = 2*pi*r*h, total surface area = 2*pi*r*(r + h), volume = pi*r^2*h; 1 m^3 = 1000 litres.',
        },
      ],
    },
    {
      id: 'builtin-science-primer',
      title: 'SCERT & NCERT Class 6–10 Science Core Notes',
      materialType: 'scert',
      classLevel: 'All',
      subject: 'Science',
      chapter: 'Physics, Chemistry & Biology Essentials',
      sections: [
        {
          location: 'Physics · Force, Pressure, Light & Electricity',
          text:
            'Force is a push or pull that can change state of motion or shape. Pressure = Force / Area (SI unit: Pascal = N/m^2). Liquids and gases exert pressure on container walls; atmospheric pressure decreases with altitude. Friction opposes relative motion: Static > Sliding > Rolling friction. Sound cannot travel through vacuum; amplitude controls loudness while frequency (Hz) controls pitch. Reflection of Light: Angle of incidence equals angle of reflection (angle i = angle r), and incident ray, normal, and reflected ray lie in the same plane. Ohm’s Law (Class 10): V = I * R.',
        },
        {
          location: 'Chemistry & Biology · Crops, Microbes, Combustion & Cells',
          text:
            'Kharif crops (paddy, maize, soybean, cotton) are grown in rainy season (June–September); Rabi crops (wheat, gram, pea, mustard) are grown in winter (October–March). Rhizobium bacteria in root nodules of leguminous plants fix atmospheric nitrogen. Candle flame has 3 zones: outermost blue non-luminous zone (complete combustion, hottest), middle yellow luminous zone (partial combustion), innermost dark zone (unburnt wax vapours). Metallic oxides are basic in nature while non-metallic oxides are acidic. Cell: Plant cells possess cell wall and plastids (chloroplasts), whereas animal cells lack cell walls.',
        },
      ],
    },
    {
      id: 'builtin-social-gk-primer',
      title: 'SCERT Social Studies, Civics & General Knowledge Reference Notes',
      materialType: 'notes',
      classLevel: 'All',
      subject: 'Social Studies',
      chapter: 'Modern History, Geography & Indian Constitution',
      sections: [
        {
          location: 'History & Civics · 1857 Revolt & Constitution',
          text:
            'Revolt of 1857 key centres and leaders: Delhi (Bahadur Shah Zafar & Bakht Khan), Kanpur (Nana Saheb & Tantia Tope), Lucknow (Begum Hazrat Mahal), Jhansi (Rani Lakshmibai), Arrah/Bihar (Kunwar Singh). Indian National Congress formed in 1885; Partition of Bengal 1905; Jallianwala Bagh 1919; Non-Cooperation 1920; Civil Disobedience/Dandi March 1930; Quit India 1942. Indian Constitution key features: Federalism, Parliamentary form of government, Separation of Powers (Legislature, Executive, Judiciary), Fundamental Rights (Article 14–32), and Secularism. Article 32 (Right to Constitutional Remedies) was termed the heart and soul of the Constitution by Dr. B.R. Ambedkar.',
        },
        {
          location: 'Geography & General Knowledge · Resources, Rivers & Defence',
          text:
            'Soil conservation methods: Terrace farming on steep slopes, contour ploughing, mulching, and shelter belts in coastal/dry regions. Jute is called the Golden Fibre. India has 28 States and 8 Union Territories. Highest gallantry award in wartime: Param Vir Chakra (PVC); peacetime: Ashoka Chakra. Indian Armed Forces heads: Chief of Army Staff (General), Chief of Naval Staff (Admiral), Chief of Air Staff (Air Chief Marshal).',
        },
      ],
    },
    {
      id: 'builtin-english-telugu-primer',
      title: 'English Grammar & Telugu Vyakaranam (Classes 6–10) Notes',
      materialType: 'scert',
      classLevel: 'All',
      subject: 'English',
      chapter: 'Grammar Rules & Telugu Vyakaranam',
      sections: [
        {
          location: 'English Grammar · Voice, Speech & Agreement',
          text:
            'Subject-Verb Agreement: With either...or / neither...nor, the verb agrees with the nearest subject. Uncountable nouns like advice, information, furniture, scenery, luggage take singular verbs and never take -s. Adjectives ending in -ior (senior, junior, superior, inferior, prior) are followed by "to" instead of "than". Active to Passive Voice keeps the original tense intact and uses be-form + V3 (past participle).',
        },
        {
          location: 'Telugu Vyakaranam · Sandhulu, Samasalu & Chandassu',
          text:
            'తెలుగు వ్యాకరణం (Telugu Grammar Basics): తెలుగు సందులు — అత్వ సంధి (రామ + అయ్య = రామయ్య), ఇత్వ సంధి (ఏమి + అంటివి = ఏమంటివి), ఉత్వ సంధి (రాముడు + ఇతడు = రాముడితడు). సంస్కృత సందులు — సవర్ణదీర్ఘ సంధి (విద్య + ఆలయం = విద్యాలయం), గుణ సంధి (మహా + ఈశుడు = మహేశుడు), వృద్ధి సంధి (ఏక + ఏక = ఏకైక), యణాదేశ సంధి (అతి + అంత = అత్యంత). సమాసాలు: ద్వంద్వ సమాసం (తల్లిదండ్రులు = తల్లియును తండ్రియును), ద్విగు సమాసం (ముల్లోకాలు = మూడైన లోకాలు). శతక పద్యాలు: సుమతి శతకం (బద్దెన), వేమన శతకం సామాజిక నీతిని బోధిస్తాయి.',
        },
      ],
    },
  ];

  const nowIso = new Date().toISOString();
  return seeds.map((seed) => {
    const chunks: KnowledgeChunk[] = [];
    for (const sec of seed.sections) {
      chunks.push(...chunkText(sec.text, seed.id, sec.location));
    }
    const wordCount = chunks.reduce((sum, c) => sum + c.text.split(/\s+/).length, 0);
    return {
      id: seed.id,
      title: seed.title,
      materialType: seed.materialType,
      classLevel: seed.classLevel,
      subject: seed.subject,
      chapter: seed.chapter,
      fileName: `${seed.id}.txt`,
      chunkCount: chunks.length,
      wordCount,
      active: true,
      isBuiltIn: true,
      uploadedAt: nowIso,
      chunks,
    };
  });
}

let cachedMaterials: StoredMaterial[] | null = null;

function loadStore(): StoredMaterial[] {
  if (cachedMaterials) return cachedMaterials;
  ensureStorageDirs();

  if (!fs.existsSync(STORE_FILE)) {
    const seeded = buildSeededMaterials();
    fs.writeFileSync(STORE_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    cachedMaterials = seeded;
    return seeded;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as StoredMaterial[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      cachedMaterials = parsed;
      return parsed;
    }
  } catch {
    // Fall back to fresh seed if corrupted
  }
  const seeded = buildSeededMaterials();
  fs.writeFileSync(STORE_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
  cachedMaterials = seeded;
  return seeded;
}

function saveStore(materials: StoredMaterial[]): void {
  ensureStorageDirs();
  cachedMaterials = materials;
  fs.writeFileSync(STORE_FILE, JSON.stringify(materials, null, 2), 'utf-8');
}

export function listMaterialsMeta() {
  return loadStore().map(({ chunks: _chunks, storedFileName: _sf, ...meta }) => meta);
}

async function computeEmbeddingsBatch(
  ai: GoogleGenAI | null,
  texts: string[]
): Promise<Array<number[] | undefined>> {
  if (!ai || texts.length === 0) return texts.map(() => undefined);
  const results: Array<number[] | undefined> = [];
  // Embed up to 24 chunks to keep uploads fast and well within quota
  const capped = texts.slice(0, 24);
  for (const text of capped) {
    try {
      const res = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: text.slice(0, 2000),
      });
      const vec = res.embeddings?.[0]?.values;
      results.push(Array.isArray(vec) && vec.length > 0 ? vec : undefined);
    } catch {
      results.push(undefined);
    }
  }
  while (results.length < texts.length) {
    results.push(undefined);
  }
  return results;
}

export async function ingestUploadedMaterial(params: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  title: string;
  materialType: MaterialType;
  classLevel: string;
  subject: string;
  chapter: string;
  ai: GoogleGenAI | null;
}): Promise<Omit<StoredMaterial, 'chunks' | 'storedFileName'>> {
  ensureStorageDirs();

  const ext = path.extname(params.originalName).toLowerCase();
  const allowedExts = new Set(['.pdf', '.txt', '.md', '.csv', '.json']);
  if (!allowedExts.has(ext)) {
    throw new Error('Unsupported file format. Please upload a PDF, TXT, MD, CSV, or JSON study file.');
  }

  const materialId = `mat-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const safeBaseName = `${materialId}${ext}`;
  const destPath = assertConfinedPath(path.join(UPLOADS_DIR, safeBaseName), UPLOADS_DIR);
  fs.writeFileSync(destPath, params.buffer);

  const chunks: KnowledgeChunk[] = [];

  if (ext === '.pdf' || params.mimeType === 'application/pdf') {
    const pdf = await getDocumentProxy(new Uint8Array(params.buffer));
    const { totalPages, text } = await extractText(pdf, { mergePages: false });
    const pages = Array.isArray(text) ? text : [String(text ?? '')];
    for (let i = 0; i < pages.length; i++) {
      const pageText = pages[i]?.trim() ?? '';
      if (!pageText) continue;
      chunks.push(...chunkText(pageText, materialId, `Page ${i + 1} of ${totalPages}`));
    }
  } else {
    const rawText = params.buffer.toString('utf-8');
    chunks.push(...chunkText(rawText, materialId, 'Section'));
  }

  if (chunks.length === 0) {
    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    throw new Error(
      'No readable text could be extracted from this document. If it is a scanned image-only PDF, please upload a text-searchable PDF or TXT/MD file.'
    );
  }

  // Limit max chunks per document to keep store snappy
  const boundedChunks = chunks.slice(0, 120);
  const embeddings = await computeEmbeddingsBatch(
    params.ai,
    boundedChunks.map((c) => c.text)
  );
  boundedChunks.forEach((chunk, i) => {
    if (embeddings[i]) {
      chunk.embedding = embeddings[i];
    }
  });

  const wordCount = boundedChunks.reduce((sum, c) => sum + c.text.split(/\s+/).length, 0);
  const newMat: StoredMaterial = {
    id: materialId,
    title: params.title.trim() || params.originalName,
    materialType: params.materialType,
    classLevel: params.classLevel || 'All',
    subject: params.subject || 'All',
    chapter: params.chapter.trim() || 'General',
    fileName: params.originalName,
    storedFileName: safeBaseName,
    chunkCount: boundedChunks.length,
    wordCount,
    active: true,
    isBuiltIn: false,
    uploadedAt: new Date().toISOString(),
    chunks: boundedChunks,
  };

  const store = loadStore();
  saveStore([newMat, ...store]);

  const { chunks: _c, storedFileName: _sf, ...meta } = newMat;
  return meta;
}

export function toggleMaterialActive(id: string, active: boolean) {
  const store = loadStore();
  const idx = store.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  store[idx] = { ...store[idx], active };
  saveStore(store);
  const { chunks: _c, storedFileName: _sf, ...meta } = store[idx];
  return meta;
}

export function deleteMaterial(id: string): { deleted: boolean; reason?: string } {
  const store = loadStore();
  const target = store.find((m) => m.id === id);
  if (!target) return { deleted: false, reason: 'Material not found.' };
  if (target.isBuiltIn) {
    return {
      deleted: false,
      reason: 'Built-in syllabus primers cannot be deleted; you can toggle them inactive instead.',
    };
  }

  if (target.storedFileName) {
    try {
      const targetPath = assertConfinedPath(
        path.join(UPLOADS_DIR, path.basename(target.storedFileName)),
        UPLOADS_DIR
      );
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
    } catch {
      // Ignore missing file on disk
    }
  }

  saveStore(store.filter((m) => m.id !== id));
  return { deleted: true };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export async function retrieveRelevantChunks(params: {
  query: string;
  classLevel?: string;
  subject?: string;
  chapter?: string;
  topK?: number;
  ai?: GoogleGenAI | null;
}): Promise<RetrievedSource[]> {
  const store = loadStore().filter((m) => m.active);
  if (store.length === 0) return [];

  const queryText = [params.query, params.chapter, params.subject].filter(Boolean).join(' ');
  const queryTokens = Array.from(new Set(tokenize(params.query)));
  const topicTokens = Array.from(new Set(tokenize(queryText)));

  // Optional query embedding if any chunk has embeddings
  let queryVec: number[] | null = null;
  const hasAnyEmbeddings = store.some((m) => m.chunks.some((c) => Array.isArray(c.embedding)));
  if (hasAnyEmbeddings && params.ai) {
    try {
      const embRes = await params.ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: queryText.slice(0, 1500),
      });
      if (embRes.embeddings?.[0]?.values) {
        queryVec = embRes.embeddings[0].values;
      }
    } catch {
      queryVec = null;
    }
  }

  const scored: RetrievedSource[] = [];

  for (const mat of store) {
    // Metadata match boost
    let metaBoost = 0;
    const subLower = (params.subject ?? '').toLowerCase();
    const matSubLower = mat.subject.toLowerCase();
    if (subLower && (matSubLower === subLower || matSubLower.includes(subLower) || (subLower.includes('social') && matSubLower.includes('social')))) {
      metaBoost += 0.18;
    } else if (mat.subject === 'All') {
      metaBoost += 0.05;
    }

    if (params.classLevel && (mat.classLevel === params.classLevel || mat.classLevel === 'All')) {
      metaBoost += 0.08;
    }

    // Prioritize admin-uploaded textbooks slightly above generic built-in notes when matched
    if (!mat.isBuiltIn) {
      metaBoost += 0.1;
    }

    for (const chunk of mat.chunks) {
      const chunkLower = `${mat.title} ${mat.chapter} ${chunk.text}`.toLowerCase();
      let exactQueryHits = 0;
      for (const tok of queryTokens) {
        if (chunkLower.includes(tok)) exactQueryHits += 1;
      }
      let topicHits = 0;
      for (const tok of topicTokens) {
        if (chunkLower.includes(tok)) topicHits += 1;
      }

      const queryRatio = queryTokens.length > 0 ? exactQueryHits / queryTokens.length : 0;
      const topicRatio = topicTokens.length > 0 ? topicHits / topicTokens.length : 0;
      const lexicalScore = 0.7 * queryRatio + 0.3 * topicRatio;

      let vectorScore = 0;
      if (queryVec && chunk.embedding) {
        vectorScore = Math.max(0, cosineSimilarity(queryVec, chunk.embedding));
      }

      const combinedScore =
        queryVec && chunk.embedding
          ? 0.6 * vectorScore + 0.4 * lexicalScore + metaBoost
          : lexicalScore + metaBoost;

      // Require at least meaningful lexical or semantic overlap
      if (exactQueryHits >= 1 || vectorScore >= 0.55) {
        scored.push({
          materialId: mat.id,
          title: mat.title,
          materialType: mat.materialType,
          classLevel: mat.classLevel,
          subject: mat.subject,
          location: chunk.location,
          snippet: chunk.text,
          score: Number(combinedScore.toFixed(3)),
        });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, params.topK ?? 5);
}
