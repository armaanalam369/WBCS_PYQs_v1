/* =====================================================================
   WBCS Prelims Mock Test Series — manifest.js
   Exam rules, the 18 topics, and the list of year-wise paper files.

   HOW TO ADD A NEW YEAR
   1. Copy any data/20xx.js file to data/2024.js and replace the questions.
   2. Add one line to PAPER_LIST below:  {year:2024, file:'data/2024.js'}
   That's all — the year chip appears on the home screen automatically.
   ===================================================================== */

/* ---- Exam rules (edit to match the official pattern you want to simulate) ---- */
window.RULES = {
  examName: 'WBCS Prelims',
  fullMinutes: 120,     // time for a full-paper test
  negative: 0.25,       // marks deducted per wrong answer (1 mark per correct answer)

  /* The 18 topics. `n` must match the "s" field of every question EXACTLY. */
  topics: [
    { n: 'English',                 i: '🔤' },
    { n: 'Ancient History',         i: '🏺' },
    { n: 'Medieval History',        i: '🏰' },
    { n: 'Modern History',          i: '📜' },
    { n: 'Indian National Movement',i: '🇮🇳' },
    { n: 'Indian Geography',        i: '🗺️' },
    { n: 'World & Physical Geography', i: '🌍' },
    { n: 'Arts & Culture',          i: '🎭' },
    { n: 'West Bengal Specific',    i: '🐅' },
    { n: 'Indian Polity',           i: '🏛️' },
    { n: 'Indian Economy',          i: '💹' },
    { n: 'Physics',                 i: '⚛️' },
    { n: 'Chemistry',               i: '🧪' },
    { n: 'Biology',                 i: '🧬' },
    { n: 'Environmental Studies',   i: '🌱' },
    { n: 'Static GK',               i: '📌' },
    { n: 'Current Affairs',         i: '📰' },
    { n: 'General Mental Ability',  i: '🧠' }
  ]
};

/* ---- Year-wise paper files (loaded only when the student picks that year) ---- */
window.PAPER_LIST = [
  { year: 2023, file: 'data/2023.js' },
  { year: 2022, file: 'data/2022.js' },
  { year: 2021, file: 'data/2021.js' }
];
