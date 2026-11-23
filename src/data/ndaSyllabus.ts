import { SubjectId, SyllabusChapter } from '../types/aissee';

export type NdaSectionId =
  | 'nda-math'
  | 'nda-english'
  | 'nda-gk-science'
  | 'nda-gk-humanities'
  | 'nda-ssb';

export interface NdaSubjectMeta {
  id: NdaSectionId;
  mappedSubjectId: SubjectId;
  paperCode: string;
  name: string;
  shortName: string;
  questionCount: number | null;
  marksPerQuestion: string;
  negativeMarking: string;
  totalMarks: number;
  duration: string;
  description: string;
  generatable: boolean;
  chapters: SyllabusChapter[];
}

export const NDA_EXAM_PATTERN = {
  examName: 'UPSC National Defence Academy & Naval Academy (NDA & NA)',
  conductingBody: 'Union Public Service Commission (UPSC)',
  mode: 'Offline Pen-and-Paper (OMR Sheet) + 5-Day SSB Interview',
  medium: 'Bilingual (English & Hindi, except GAT Part A English)',
  writtenQuestions: 270,
  writtenMarks: 900,
  ssbMarks: 900,
  totalMeritMarks: 1800,
  writtenDuration: '5 Hours (2.5 Hours Paper 1 + 2.5 Hours Paper 2)',
  negativeMarkingRule:
    '1/3rd negative marking on wrong OMR answers (-0.83 in Mathematics, -1.33 in GAT). Zero marks deducted for unattempted questions.',
  qualifyingRule:
    'Candidates must clear UPSC sectional minimum qualifying marks (typically ~25% per paper) plus overall written cutoff to qualify for the 5-day SSB Interview. Final merit is out of 1800 marks (Written 900 + SSB 900).',
  officialPortal: 'https://upsc.gov.in/',
};

export const NDA_SUBJECTS: NdaSubjectMeta[] = [
  {
    id: 'nda-math',
    mappedSubjectId: 'mathematics',
    paperCode: 'Paper 1',
    name: 'NDA Mathematics',
    shortName: 'Paper 1: Math',
    questionCount: 120,
    marksPerQuestion: '+2.5',
    negativeMarking: '-0.83',
    totalMarks: 300,
    duration: '2.5 Hours (150 mins)',
    description:
      'Class 11 & 12 NCERT-level objective mathematics paper. Scoring well in Paper 1 is essential because UPSC requires meeting the Paper 1 qualifying threshold before evaluating GAT.',
    generatable: true,
    chapters: [
      {
        id: 'nda-math-algebra',
        title: 'Algebra, Sets, Complex Numbers & Quadratic Equations',
        ncertUnit: 'Class 11–12 · Unit 1',
        weightage: 'High',
        keyTopics: [
          'Sets, relations, functions & Venn diagrams',
          'Complex numbers, modulus, argument & cube roots of unity',
          'Quadratic equations, roots & nature of discriminant',
          'AP, GP, HP, Logarithms, Permutations, Combinations & Binomial Theorem',
        ],
        studyTip:
          'Master cube roots of unity (1 + ω + ω² = 0) and standard binomial coefficients—these appear reliably in every NDA paper.',
      },
      {
        id: 'nda-math-matrices',
        title: 'Matrices and Determinants',
        ncertUnit: 'Class 12 · Unit 2',
        weightage: 'High',
        keyTopics: [
          'Types of matrices (symmetric, skew-symmetric, orthogonal)',
          'Matrix multiplication, transpose & adjoint',
          'Properties of determinants & row/column operations',
          'Inverse of a matrix & solving linear systems (Cramer’s rule)',
        ],
        studyTip:
          'Check order and singularity (|A| = 0) first; many determinant MCQs can be solved in 15 seconds by substituting simple values like a=1, b=2, c=3.',
      },
      {
        id: 'nda-math-trig',
        title: 'Trigonometry & Heights and Distances',
        ncertUnit: 'Class 11–12 · Unit 3',
        weightage: 'High',
        keyTopics: [
          'Trigonometric identities, compound & multiple angles',
          'Properties of triangles (Sine & Cosine rules)',
          'Inverse trigonometric functions & principal values',
          'Heights and distances (angles of elevation & depression)',
        ],
        studyTip:
          'Keep sin 15°, cos 15°, sin 18°, and cos 36° exact values memorized along with standard 30°-45°-60° triangles.',
      },
      {
        id: 'nda-math-geometry',
        title: 'Analytical Geometry (2D & 3D)',
        ncertUnit: 'Class 11–12 · Unit 4',
        weightage: 'High',
        keyTopics: [
          'Distance, section formula & locus in 2D Cartesian plane',
          'Straight lines, angle between lines & distance from a point',
          'Circles, Parabola, Ellipse & Hyperbola standard equations',
          '3D coordinates, direction cosines/ratios, planes & spheres',
        ],
        studyTip:
          'Focus heavily on Straight Lines, Circles, and Direction Cosines in 3D—they carry high scoring predictability.',
      },
      {
        id: 'nda-math-diff-calc',
        title: 'Differential Calculus',
        ncertUnit: 'Class 12 · Unit 5',
        weightage: 'High',
        keyTopics: [
          'Domain, range & composite/inverse functions',
          'Limits, continuity & differentiability',
          'Derivatives of composite, implicit & parametric functions',
          'Tangents, normals, increasing/decreasing functions & maxima/minima',
        ],
        studyTip:
          'Use L’Hôpital’s rule cleanly for 0/0 and ∞/∞ limit MCQs to save precious minutes.',
      },
      {
        id: 'nda-math-int-calc',
        title: 'Integral Calculus & Differential Equations',
        ncertUnit: 'Class 12 · Unit 6',
        weightage: 'High',
        keyTopics: [
          'Standard indefinite integrals & integration by substitution/parts',
          'Definite integrals & King’s property ∫f(a+b-x)dx',
          'Area bounded by curves',
          'Order, degree & variable-separable / linear differential equations',
        ],
        studyTip:
          'Definite integral properties (odd/even functions and π/2 symmetry) solve most NDA integration questions without expanding.',
      },
      {
        id: 'nda-math-vectors',
        title: 'Vector Algebra',
        ncertUnit: 'Class 12 · Unit 7',
        weightage: 'Medium',
        keyTopics: [
          'Magnitude, unit vectors & position vectors',
          'Dot (scalar) product & projection of a vector',
          'Cross (vector) product & area of triangle/parallelogram',
          'Scalar triple product & coplanarity',
        ],
        studyTip:
          'Remember a · b = 0 means perpendicular vectors, and a × b = 0 means parallel/collinear vectors.',
      },
      {
        id: 'nda-math-stats-prob',
        title: 'Statistics and Probability',
        ncertUnit: 'Class 11–12 · Unit 8',
        weightage: 'High',
        keyTopics: [
          'Classification of data, histograms, frequency polygons & pie charts',
          'Mean, median, mode, variance, standard deviation & correlation',
          'Conditional probability & multiplication theorem',
          'Bayes’ theorem, Binomial distribution & independent events',
        ],
        studyTip:
          'Know how variance and standard deviation change under origin shift (unchanged) vs scale change (scaled by |k|).',
      },
    ],
  },
  {
    id: 'nda-english',
    mappedSubjectId: 'english',
    paperCode: 'Paper 2 · Part A',
    name: 'GAT Part A: English',
    shortName: 'Paper 2A: English',
    questionCount: 50,
    marksPerQuestion: '+4.0',
    negativeMarking: '-1.33',
    totalMarks: 200,
    duration: 'Shared 2.5 Hours (GAT)',
    description:
      'Accounts for 200 out of 600 marks in Paper 2 (GAT). Tests grammar accuracy, vocabulary depth, idiomatic usage, and paragraph cohesion.',
    generatable: true,
    chapters: [
      {
        id: 'nda-eng-grammar',
        title: 'Grammar, Spotting Errors & Sentence Improvement',
        ncertUnit: 'GAT Part A · Grammar',
        weightage: 'High',
        keyTopics: [
          'Parts of speech, tenses & conditional clauses',
          'Subject-verb agreement & pronoun reference errors',
          'Prepositions, phrasal verbs & articles',
          'Active/passive voice & direct/indirect narration',
        ],
        studyTip:
          'At +4 marks per question, English is the fastest-scoring part of GAT; verify tense consistency and preposition pairings carefully.',
      },
      {
        id: 'nda-eng-vocab',
        title: 'Vocabulary: Synonyms, Antonyms & Idioms',
        ncertUnit: 'GAT Part A · Vocabulary',
        weightage: 'High',
        keyTopics: [
          'Contextual synonyms & antonyms in sentence prompts',
          'Idioms, phrases & defence/formal usage',
          'One-word substitutions & homophones',
          'Root words, prefixes & suffixes',
        ],
        studyTip:
          'Always read the full example sentence around the target word—NDA tests contextual meaning rather than isolated dictionary guesses.',
      },
      {
        id: 'nda-eng-comprehension',
        title: 'Reading Comprehension, Ordering of Sentences & Cloze Test',
        ncertUnit: 'GAT Part A · Comprehension',
        weightage: 'High',
        keyTopics: [
          'S1–S6 and PQRS paragraph/sentence ordering',
          'Cloze passage contextual vocabulary fill-ins',
          'Main idea, tone & inference comprehension',
          'Cohesion and logical transitions',
        ],
        studyTip:
          'In PQRS ordering, identify mandatory pairs (noun → pronoun, cause → effect, or chronological markers) to eliminate wrong options quickly.',
      },
    ],
  },
  {
    id: 'nda-gk-science',
    mappedSubjectId: 'science',
    paperCode: 'Paper 2 · Part B (Sec A–C)',
    name: 'GAT Part B: Physics, Chemistry & General Science',
    shortName: 'Paper 2B: Science',
    questionCount: 50,
    marksPerQuestion: '+4.0',
    negativeMarking: '-1.33',
    totalMarks: 200,
    duration: 'Shared 2.5 Hours (GAT)',
    description:
      'Covers Sections A, B, and C of GAT General Knowledge (~50 questions / ~200 marks), grounded in NCERT Class 9–12 Physics, Chemistry, and Biology.',
    generatable: true,
    chapters: [
      {
        id: 'nda-sci-physics',
        title: 'Section A: Physics (Mechanics, Heat, Optics & Electricity)',
        ncertUnit: 'GAT Part B · Sec A',
        weightage: 'High',
        keyTopics: [
          'Physical properties, states of matter, mass, weight, density & Archimedes’ principle',
          'Motion, Newton’s laws, momentum, work, energy, power & gravitation',
          'Heat transfer, temperature scales, specific heat & change of state',
          'Sound waves, rectilinear light, mirrors/lenses, human eye, circuits & magnetism',
        ],
        studyTip:
          'Physics alone contributes ~22–25 questions in GAT; prioritize Optics (mirrors/lenses), Electricity (Ohm’s law, series/parallel), and Laws of Motion.',
      },
      {
        id: 'nda-sci-chemistry',
        title: 'Section B: Chemistry (Matter, Acids-Bases & Everyday Chemicals)',
        ncertUnit: 'GAT Part B · Sec B',
        weightage: 'High',
        keyTopics: [
          'Physical & chemical changes, elements, mixtures & compounds',
          'Laws of chemical combination & atomic/molecular structure',
          'Acids, bases, salts, pH scale & oxidation-reduction',
          'Carbon allotropes, fertilizers, glass, cement, soap & gunpowder basics',
        ],
        studyTip:
          'Revise common chemical names and formulas (bleaching powder, baking soda, plaster of Paris) and valency/oxidation numbers.',
      },
      {
        id: 'nda-sci-biology',
        title: 'Section C: General Science (Cell, Human Systems & Diseases)',
        ncertUnit: 'GAT Part B · Sec C',
        weightage: 'Medium',
        keyTopics: [
          'Living vs non-living, cell structure & plant/animal tissues',
          'Human digestive, respiratory, circulatory & nervous systems',
          'Balanced diet, vitamins, deficiency diseases & food sources',
          'Common bacterial, viral & protozoan epidemics and prevention',
        ],
        studyTip:
          'Make a quick chart mapping Vitamins (A, B-complex, C, D, E, K) to deficiency diseases and pathogens to vector-borne illnesses.',
      },
    ],
  },
  {
    id: 'nda-gk-humanities',
    mappedSubjectId: 'social',
    paperCode: 'Paper 2 · Part B (Sec D–F)',
    name: 'GAT Part B: History, Geography & Current Events',
    shortName: 'Paper 2B: GK & Polity',
    questionCount: 50,
    marksPerQuestion: '+4.0',
    negativeMarking: '-1.33',
    totalMarks: 200,
    duration: 'Shared 2.5 Hours (GAT)',
    description:
      'Covers Sections D, E, and F of GAT General Knowledge (~50 questions / ~200 marks): Indian History & Polity, World/Indian Geography, and Current Affairs.',
    generatable: true,
    chapters: [
      {
        id: 'nda-soc-history',
        title: 'Section D: History, Culture, Constitution & Freedom Movement',
        ncertUnit: 'GAT Part B · Sec D',
        weightage: 'High',
        keyTopics: [
          'Broad survey of Indian History, Indus Valley, Mauryan & Gupta culture',
          'Indian Freedom Movement (1857–1947), Gandhi era & Revolutionary movements',
          'Elementary study of Indian Constitution, Fundamental Rights & Five-Year Plans',
          'World milestones: Renaissance, Industrial Revolution, American/French/Russian Revolutions & UN',
        ],
        studyTip:
          'Chronology questions on Freedom Movement events (1905–1947) and Fundamental Rights/Constitutional Amendments appear consistently.',
      },
      {
        id: 'nda-soc-geography',
        title: 'Section E: Earth, Climate, Indian & World Geography',
        ncertUnit: 'GAT Part B · Sec E',
        weightage: 'High',
        keyTopics: [
          'Shape/size of Earth, latitudes, longitudes, international date line & tides',
          'Rocks, earthquakes, volcanoes, atmosphere, winds & ocean currents',
          'Major natural regions of the world & climate belts',
          'Indian physiography, river systems, monsoons, agriculture, minerals & ports',
        ],
        studyTip:
          'Know warm vs cold ocean currents, local winds (Loo, Chinook, Foehn), and Indian river tributaries by heart.',
      },
      {
        id: 'nda-soc-current',
        title: 'Section F: National, Defence & International Current Events',
        ncertUnit: 'GAT Part B · Sec F',
        weightage: 'Medium',
        keyTopics: [
          'Recent national & international summits, treaties & organizations',
          'Indian Armed Forces exercises, defence technology & awards',
          'Prominent personalities, sports trophies & cultural honours',
          'Recent scientific missions (ISRO) & environmental initiatives',
        ],
        studyTip:
          'Focus on the past 6–8 months of Defence exercises, ISRO launches, Padma/Gallantry awards, and major international summits.',
      },
    ],
  },
  {
    id: 'nda-ssb',
    mappedSubjectId: 'intelligence',
    paperCode: 'Stage II (5 Days)',
    name: 'SSB Interview & Officer Selection',
    shortName: 'SSB Interview',
    questionCount: null,
    marksPerQuestion: 'Holistic',
    negativeMarking: 'None',
    totalMarks: 900,
    duration: '5 Days (Stage I + Stage II)',
    description:
      'Conducted by Services Selection Board for written-qualified NDA candidates. Assesses the 15 Officer Like Qualities (OLQs) across Psychological, GTO, and Interview dimensions.',
    generatable: false,
    chapters: [
      {
        id: 'nda-ssb-stage1',
        title: 'Stage I Screening: OIR Tests & PPDT (Day 1)',
        ncertUnit: 'SSB · Day 1',
        weightage: 'High',
        keyTopics: [
          'Officer Intelligence Rating (OIR) verbal & non-verbal reasoning booklets',
          'Picture Perception & Description Test (PPDT) — 30 sec viewing, 4 min story writing',
          'Individual narration (1 minute) & Group Discussion to reach a common story',
          'Only screened-in candidates proceed to Stage II',
        ],
        studyTip:
          'AISSEE Intelligence reasoning directly builds your OIR speed! For PPDT, write a realistic, positive, action-oriented story matching the picture.',
      },
      {
        id: 'nda-ssb-stage2',
        title: 'Stage II: Psychology, GTO Tasks, Personal Interview & Conference',
        ncertUnit: 'SSB · Days 2–5',
        weightage: 'High',
        keyTopics: [
          'Psychology Battery: TAT (12 pictures), WAT (60 words), SRT (60 situations), Self-Description',
          'GTO Outdoor & Indoor: GD, GPE, Progressive Group Task, Snake Race, Lecturette, Command Task',
          'Personal Interview (PI) covering academics, family, hobbies, general awareness & Rapid Fire',
          'Day 5 Board Conference & Medical Board clearance',
        ],
        studyTip:
          'Consistency between your PIQ form, interview answers, and natural behaviour across GTO tasks matters far more than memorized answers.',
      },
    ],
  },
];
