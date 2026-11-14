/* =====================================================================
   Wise Choice Chapter-wise Test Portal — manifest.js
   Contains exam rules, 18 chapter definitions, motivational quotes,
   and individual set file paths for each topic.
   ===================================================================== */

window.RULES = {
  examName: 'WBCS Prelims',
  fullMinutes: 120,
  negative: 0.25
};

/* ---- The 18 individual chapter/topic set files ---- */
window.CHAPTER_LIST = [
  { name: 'English',                    icon: '🔤', code: 'ENG', file: 'data/english.js' },
  { name: 'Indian Polity',              icon: '🏛️', code: 'POL', file: 'data/indian_polity.js' },
  { name: 'Ancient History',            icon: '🏺', code: 'ANC', file: 'data/ancient_history.js' },
  { name: 'Indian Economy',             icon: '💹', code: 'ECO', file: 'data/indian_economy.js' },
  { name: 'Medieval History',           icon: '🏰', code: 'MED', file: 'data/medieval_history.js' },
  { name: 'Physics',                    icon: '⚛️', code: 'PHY', file: 'data/physics.js' },
  { name: 'Indian National Movement',   icon: '🇮🇳', code: 'INM', file: 'data/inm.js' },
  { name: 'Chemistry',                  icon: '🧪', code: 'CHE', file: 'data/chemistry.js' },
  { name: 'World & Physical Geography', icon: '🌍', code: 'GEO', file: 'data/world_geography.js' },
  { name: 'Biology',                    icon: '🧬', code: 'BIO', file: 'data/biology.js' },
  { name: 'Modern History',             icon: '📜', code: 'MOD', file: 'data/modern_history.js' },
  { name: 'Arts & Culture',             icon: '🎭', code: 'ART', file: 'data/arts_culture.js' },
  { name: 'Indian Geography',           icon: '🗺️', code: 'ING', file: 'data/indian_geography.js' },
  { name: 'West Bengal Specific',       icon: '🐅', code: 'WB',  file: 'data/wb_specific.js' },
  { name: 'Environmental Studies',      icon: '🌱', code: 'ENV', file: 'data/env_studies.js' },
  { name: 'Static GK',                  icon: '📌', code: 'SGK', file: 'data/static_gk.js' },
  { name: 'General Mental Ability',     icon: '🧠', code: 'GMA', file: 'data/gma.js' },
  { name: 'Current Affairs',            icon: '📰', code: 'CA',  file: 'data/current_affairs.js' }
];

window.QUOTES = [
  'Consistency beats intensity — one solid hour every day wins the exam.',
  'Every wrong answer you review today is a mark you keep tomorrow.',
  'You don\'t need to be perfect. You need to be better than yesterday.',
  'Discipline is choosing what you want most over what you want now.',
  'Small daily progress adds up to big results.',
  'Mock tests are rehearsals. Make your mistakes here, not in the exam hall.',
  'Your future officer self is watching — keep going.',
  'Revision is where marks are made.',
  'One more topic. One more test. One step closer.'
];
