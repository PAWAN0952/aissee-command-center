import { TutorClassLevel, TutorLanguage, TutorMode, TutorSubject } from '../types/aissee';

export const TUTOR_CLASSES: TutorClassLevel[] = ['6', '7', '8', '9', '10'];

export const TUTOR_SUBJECTS: TutorSubject[] = [
  'Mathematics',
  'Science',
  'Social Studies',
  'English',
  'Telugu',
  'General Knowledge',
];

export const TUTOR_SUBJECT_COLORS: Record<
  TutorSubject,
  { text: string; border: string; activeBg: string; softBg: string }
> = {
  Mathematics: {
    text: 'text-sky-400',
    border: 'border-sky-500/35',
    activeBg: 'bg-gradient-to-r from-blue-600 to-sky-500 text-white',
    softBg: 'bg-sky-500/15',
  },
  Science: {
    text: 'text-emerald-400',
    border: 'border-emerald-500/35',
    activeBg: 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white',
    softBg: 'bg-emerald-500/15',
  },
  'Social Studies': {
    text: 'text-amber-400',
    border: 'border-amber-500/35',
    activeBg: 'bg-gradient-to-r from-amber-600 to-orange-500 text-white',
    softBg: 'bg-amber-500/15',
  },
  English: {
    text: 'text-cyan-400',
    border: 'border-cyan-500/35',
    activeBg: 'bg-gradient-to-r from-teal-600 to-cyan-500 text-white',
    softBg: 'bg-cyan-500/15',
  },
  Telugu: {
    text: 'text-rose-400',
    border: 'border-rose-500/35',
    activeBg: 'bg-gradient-to-r from-rose-600 to-pink-500 text-white',
    softBg: 'bg-rose-500/15',
  },
  'General Knowledge': {
    text: 'text-violet-400',
    border: 'border-violet-500/35',
    activeBg: 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white',
    softBg: 'bg-violet-500/15',
  },
};

export const CLASS_SUBJECT_CHAPTERS: Record<TutorClassLevel, Record<TutorSubject, string[]>> = {
  '6': {
    Mathematics: [
      'Knowing Our Numbers & Whole Numbers',
      'Playing with Numbers (Factors, Multiples, HCF & LCM)',
      'Fractions & Decimals',
      'Basic Geometrical Ideas & Mensuration',
      'Integers & Introduction to Algebra',
      'Ratio and Proportion',
    ],
    Science: [
      'Components of Food & Balanced Diet',
      'Sorting Materials & Separation of Substances',
      'Getting to Know Plants & Living Organisms',
      'Motion and Measurement of Distances',
      'Light, Shadows and Reflections',
      'Electricity and Circuits & Fun with Magnets',
    ],
    'Social Studies': [
      'Early Humans, Harappan Civilisation & Vedic Age',
      'Globe: Latitudes and Longitudes',
      'Motions of the Earth & Major Landforms',
      'Our Country — India & Physical Divisions',
      'Local Government: Panchayati Raj & Municipal Bodies',
    ],
    English: [
      'Parts of Speech & Nouns / Pronouns',
      'Simple Tenses & Articles (a, an, the)',
      'Reading Comprehension & Paragraph Writing',
      'Synonyms, Antonyms & Spelling',
    ],
    Telugu: [
      'తెలుగు వర్ణమాల, గుణింతాలు & ఒత్తులు',
      'సందులు — ప్రాథమిక పరిచయం (అత్వ, ఇత్వ, ఉత్వ)',
      'శతక పద్యాలు & నీతి కథలు (సుమతి, వేమన)',
      'వ్యాకరణం: నామవాచకం, సర్వనామం, క్రియ',
    ],
    'General Knowledge': [
      'National Symbols, States & Capitals of India',
      'Famous Monuments, Rivers & Mountain Peaks',
      'Basic Space & Solar System Facts',
      'Indian Freedom Fighters & Sports',
    ],
  },
  '7': {
    Mathematics: [
      'Integers, Fractions & Decimals',
      'Simple Equations',
      'Lines and Angles & The Triangle and Its Properties',
      'Comparing Quantities (Percentage, Profit/Loss, Simple Interest)',
      'Rational Numbers & Exponents and Powers',
      'Perimeter and Area & Algebraic Expressions',
    ],
    Science: [
      'Nutrition in Plants and Animals',
      'Heat, Temperature & Transfer of Heat',
      'Acids, Bases and Salts',
      'Physical and Chemical Changes',
      'Respiration in Organisms & Transportation in Animals and Plants',
      'Electric Current and Its Effects & Light (Mirrors & Lenses)',
    ],
    'Social Studies': [
      'Medieval India: Delhi Sultanate & Mughal Empire',
      'Environment, Inside Our Earth & Our Changing Earth',
      'Air, Atmosphere & Water Cycle',
      'How the State Government Works & Equality in Democracy',
    ],
    English: [
      'Tenses, Prepositions & Conjunctions',
      'Active and Passive Voice (Basics)',
      'Direct and Indirect Speech (Intro)',
      'Comprehension, Letter Writing & Idioms',
    ],
    Telugu: [
      'తెలుగు సందులు (సవర్ణదీర్ఘ, గుణ, యణాదేశ)',
      'సమాసాలు — ద్వంద్వ, ద్విగు, తత్పురుష',
      'శతక సుధ & పల్లె జీవన పాఠ్యాంశాలు',
      'లేఖా రచన & వ్యాస రచన (Letter & Essay Writing)',
    ],
    'General Knowledge': [
      'Indian Defence Forces & Ranks',
      'Famous Inventions, Scientists & Books',
      'World Continents, Oceans & Neighbouring Countries',
      'National Parks & Biosphere Reserves of India',
    ],
  },
  '8': {
    Mathematics: [
      'Rational Numbers',
      'Linear Equations in One Variable',
      'Understanding Quadrilaterals & Triangles',
      'Squares and Square Roots',
      'Cubes and Cube Roots',
      'Comparing Quantities (Compound Interest, Profit & Loss, GST)',
      'Algebraic Expressions and Identities',
      'Mensuration (Area, Surface Area & Volume)',
      'Exponents and Powers',
      'Direct and Inverse Proportions',
      'Factorisation',
      'Data Handling, Graphs & Probability',
    ],
    Science: [
      'Crop Production and Management',
      'Microorganisms: Friend and Foe',
      'Coal, Petroleum, Combustion and Flame',
      'Conservation of Plants and Animals',
      'Cell Structure, Reproduction & Adolescence',
      'Force, Pressure, Friction & Sound',
      'Chemical Effects of Electric Current & Light',
    ],
    'Social Studies': [
      'From Trade to Territory & Revolt of 1857',
      'Social Reforms & Indian National Movement (1885–1947)',
      'Resources: Land, Soil, Water & Natural Vegetation',
      'Agriculture, Minerals & Industries',
      'The Indian Constitution, Secularism & Parliament',
      'Judiciary & Social Justice',
    ],
    English: [
      'Tenses & Subject-Verb Agreement',
      'Active & Passive Voice / Direct & Indirect Speech',
      'Prepositions, Articles & Modals',
      'Spotting Errors & Sentence Improvement',
      'Synonyms, Antonyms, Idioms & One-Word Substitution',
      'Reading Comprehension & Jumbled Sentences',
    ],
    Telugu: [
      'సంస్కృత & తెలుగు సందులు (వృద్ధి, త్రిక, గసడదవాదేశ)',
      'సమాసాలు & అలంకారాలు (ఉపమ, రూపక, అతిశయోక్తి)',
      'తెలుగు సాహిత్యం & కవులు (నన్నయ, తిక్కన, పోతన)',
      'ఛందస్సు ప్రాథమికాంశాలు & గద్య పాఠ్యాంశాలు',
    ],
    'General Knowledge': [
      'AISSEE Intelligence: Number/Letter Series & Coding-Decoding',
      'AISSEE Intelligence: Blood Relations & Direction Sense',
      'Indian Armed Forces, Gallantry Awards & Sainik Schools',
      'Important Constitutional Articles, Awards & Current Affairs',
    ],
  },
  '9': {
    Mathematics: [
      'Number Systems (Irrational Numbers & Real Numbers)',
      'Polynomials & Remainder/Factor Theorems',
      'Coordinate Geometry & Linear Equations in Two Variables',
      'Lines, Angles, Triangles & Congruence',
      'Quadrilaterals, Circles & Heron’s Formula',
      'Surface Areas and Volumes (Cone, Sphere, Hemisphere)',
      'Statistics & Probability',
    ],
    Science: [
      'Matter in Our Surroundings & Atoms and Molecules',
      'Structure of the Atom',
      'The Fundamental Unit of Life & Tissues',
      'Motion, Force and Laws of Motion',
      'Gravitation, Work and Energy & Sound',
    ],
    'Social Studies': [
      'The French Revolution & Nazism / World History',
      'India: Size, Location & Physical Features',
      'Drainage (Himalayan & Peninsular Rivers) & Climate',
      'Constitutional Design, Electoral Politics & Democratic Rights',
      'Poverty as a Challenge & Food Security in India',
    ],
    English: [
      'Determiners, Modals & Reported Speech',
      'Clauses & Sentence Transformation',
      'Editing, Omission & Gap Filling',
      'Analytical Paragraph & Formal Letter Writing',
    ],
    Telugu: [
      'తెలుగు వ్యాకరణం: అలంకారాలు (అర్థాలంకారాలు & శబ్దాలంకారాలు)',
      'ఛందస్సు (ఉత్పలమాల, చంపకమాల, శార్దూలం, మత్తేభం)',
      'ఆధునిక తెలుగు కవిత్వం & కథానికలు',
      'సమాసాలు, ప్రత్యయాలు & ప్రకృతి-వికృతులు',
    ],
    'General Knowledge': [
      'Indian Polity: Parliament, President, PM & Supreme Court',
      'Indian Geography: Rivers, Passes, Soils & Monsoon',
      'Science & Technology Milestones (ISRO, DRDO)',
      'National & International Organizations (UN, SAARC, ASEAN)',
    ],
  },
  '10': {
    Mathematics: [
      'Real Numbers & Euclid’s Division / Prime Factorisation',
      'Polynomials & Pair of Linear Equations in Two Variables',
      'Quadratic Equations & Arithmetic Progressions',
      'Similar Triangles & Coordinate Geometry',
      'Introduction to Trigonometry & Applications',
      'Circles, Areas Related to Circles & Surface Area/Volume',
      'Statistics & Probability',
    ],
    Science: [
      'Chemical Reactions, Acids/Bases & Metals/Non-Metals',
      'Carbon and Its Compounds',
      'Life Processes, Control & Coordination and Heredity',
      'Light: Reflection and Refraction & The Human Eye',
      'Electricity, Magnetic Effects of Electric Current & Environment',
    ],
    'Social Studies': [
      'Rise of Nationalism in Europe & Nationalism in India',
      'Resources, Water, Agriculture & Manufacturing Industries',
      'Power Sharing, Federalism & Political Parties',
      'Sectors of Indian Economy, Money & Credit and Globalisation',
    ],
    English: [
      'Integrated Grammar (Tenses, Modals, Subject-Verb Concord)',
      'Formal Letters (Order, Enquiry, Complaint, Editor)',
      'Analytical Paragraph & Unseen Discursive Passages',
      'Vocabulary, Phrasal Verbs & Idioms',
    ],
    Telugu: [
      'తెలుగు ఛందస్సు (వృత్త పద్యాలు, కందం, తేటగీతి, ఆటవెలది)',
      'అలంకారాలు, సందులు & సమాసాల సంపూర్ణ అభ్యాసం',
      'రామాయణ / శతక మధురిమ పాఠ్యాంశాల సారాంశం',
      'వ్యాస రచన, లేఖ & అపరిచిత గద్యం',
    ],
    'General Knowledge': [
      'UPSC NDA Foundation: Modern Indian History & Freedom Struggle',
      'Indian Economy, Five-Year Plans & Banking Terms',
      'Environmental Treaties, Climate & Biodiversity',
      'Sports Trophies, Defence Exercises & Current Events',
    ],
  },
};

export function getSuggestedQuestions(
  classLevel: TutorClassLevel,
  subject: TutorSubject,
  chapter: string,
  language: TutorLanguage,
  mode: TutorMode
): string[] {
  const topic = chapter || subject;

  if (language === 'Telugu') {
    if (mode === 'textbook') {
      return [
        `పాఠ్యపుస్తకం / సిలబస్ ఆధారంగా "${topic}" అధ్యాయంలోని ముఖ్య అంశాలను సరళంగా వివరించండి.`,
        `"${topic}" లో పరీక్షలకు వచ్చే ముఖ్యమైన ప్రశ్నలు మరియు సమాధానాలు ఇవ్వండి.`,
        `Class ${classLevel} ${subject} లో "${topic}" పై 2 ఉదాహరణలు స్టెప్-బై-స్టెప్ చూపండి.`,
        `నా అప్‌లోడ్ చేసిన నోట్స్‌లో "${topic}" గురించి ఏముందో సారాంశం చెప్పండి.`,
      ];
    }
    return [
      `Class ${classLevel} విద్యార్థికి అర్థమయ్యేలా "${topic}" ను నిజజీవిత ఉదాహరణలతో వివరించండి.`,
      `"${topic}" పై 5 ముఖ్యమైన MCQ ప్రశ్నలు ఇచ్చి నన్ను పరీక్షించండి.`,
      `${subject} లో "${topic}" త్వరగా గుర్తుంచుకోవడానికి షార్ట్ నోట్స్ ఇవ్వండి.`,
      `"${topic}" లో విద్యార్థులు సాధారణంగా చేసే తప్పులు ఏమిటి?`,
    ];
  }

  if (mode === 'textbook') {
    return [
      `Based on the uploaded textbooks & syllabus, summarize "${topic}" for Class ${classLevel}.`,
      `What are the key definitions and formulas in "${topic}" from our study material?`,
      `Solve 2 textbook-style practice examples on "${topic}" step by step.`,
      `List the most important exam questions from "${topic}" with source references.`,
    ];
  }

  if (mode === 'general') {
    return [
      `How is "${topic}" used in real life, science, or Indian defence applications?`,
      `Give me verified facts and current context related to "${topic}".`,
      `Explain "${topic}" with an intuitive everyday analogy for a Class ${classLevel} student.`,
      `Challenge me with an interesting Olympiad / competitive twist on "${topic}".`,
    ];
  }

  return [
    `Explain "${topic}" step-by-step for Class ${classLevel} using a simple everyday example.`,
    `Give me 2 solved ${subject} examples on "${topic}" from easy to medium level.`,
    `What mistakes do students commonly make in "${topic}" during exams like AISSEE?`,
    `Quiz me with 1 question on "${topic}" and guide me step-by-step without spoiling the answer.`,
  ];
}
