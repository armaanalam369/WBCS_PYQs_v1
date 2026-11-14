/* =====================================================================
   WBCS Prelims PYQs Series — manifest.js  (chapter-wise sets)
   Exam rules, the 18 chapters, and the list of SET files inside each chapter.

   HOW TO ADD A NEW SET TO A CHAPTER
   1. Copy any data/<set>.js file, e.g. to data/polity-3.js, and replace the questions.
      Inside the file, the id in  SETDATA['POL-3']  must match the id below.
   2. Add ONE line to that chapter's  sets: [ ... ]  list below:
        { id:'POL-3', name:'Set 3', file:'data/polity-3.js' }
   That's all — the set appears under that chapter on the home screen automatically.

   OPTIONAL  n:<number of questions>  (e.g. n:25)
   If you add n, the app can show counts instantly WITHOUT downloading the file first.
   Recommended once you have many sets (otherwise every set file is fetched in the
   background when the app opens, only to count its questions).
   ===================================================================== */

window.RULES = {
  examName: 'WBCS Prelims',
  negative: 0.25,     // marks deducted per wrong answer (1 mark per correct answer)
  minsPerQ: 1.2,      // exam minutes per question in a one-set test (120 min / 100 Q = 1.2)

  /* The 18 chapters. `n` = chapter name, `i` = icon, `k` = short label on the radar chart,
     `sets` = list of set files for that chapter (empty list = chapter has no sets yet).
     Set `id` must be UNIQUE across the whole manifest and must never change once students
     have used it (progress, "unseen" tracking and saved questions are stored against it). */
  topics: [
    { n: 'English', i: '🔤', k: 'English', sets: [
        { id: 'ENG-1', name: 'Set 1', file: 'data/english-1.js' }
    ] },
    { n: 'Indian Polity', i: '🏛️', k: 'Polity', sets: [
        { id: 'POL-1', name: 'Set 1', file: 'data/polity-1.js' },
        { id: 'POL-2', name: 'Set 2', file: 'data/polity-2.js' }
    ] },
    { n: 'Ancient History',            i: '🏺', k: 'Ancient History',     sets: [] },
    { n: 'Indian Economy',             i: '💹', k: 'Economy',             sets: [] },
    { n: 'Medieval History',           i: '🏰', k: 'Medieval History',    sets: [] },
    { n: 'Physics',                    i: '⚛️', k: 'Physics',             sets: [] },
    { n: 'Indian National Movement',   i: '🇮🇳', k: 'National Movement',   sets: [] },
    { n: 'Chemistry',                  i: '🧪', k: 'Chemistry',           sets: [] },
    { n: 'World & Physical Geography', i: '🌍', k: 'Physical Geography',  sets: [] },
    { n: 'Biology',                    i: '🧬', k: 'Biology',             sets: [] },
    { n: 'Modern History',             i: '📜', k: 'Modern History',      sets: [] },
    { n: 'Arts & Culture',             i: '🎭', k: 'Arts & Culture',      sets: [] },
    { n: 'Indian Geography',           i: '🗺️', k: 'Indian Geography',    sets: [] },
    { n: 'West Bengal Specific',       i: '🐅', k: 'W.B. Specific',       sets: [] },
    { n: 'Environmental Studies',      i: '🌱', k: 'Environmental Studies', sets: [] },
    { n: 'Static GK',                  i: '📌', k: 'Static GK',           sets: [] },
    { n: 'General Mental Ability',     i: '🧠', k: 'General Mental Ability', sets: [] },
    { n: 'Current Affairs',            i: '📰', k: 'Current Affairs',     sets: [] }
  ]
};

/* ---- Motivational quotes (one is shown per day on the home screen). Add your own! ---- */
window.QUOTES = [
  'Consistency beats intensity — one solid hour every day wins the exam.',
  'Every wrong answer you review today is a mark you keep tomorrow.',
  'You don\'t need to be perfect. You need to be better than yesterday.',
  'Discipline is choosing what you want most over what you want now.',
  'Small daily progress adds up to big results.',
  'Mock tests are rehearsals. Make your mistakes here, not in the exam hall.',
  'Your future officer self is watching — keep going.',
  'Don\'t count the days; make the days count.',
  'Hard work compounds. Start the next question.',
  'Revision is where marks are made.',
  'Slow progress is still progress.',
  'Focus on the process; the rank will follow.',
  'Today\'s effort is tomorrow\'s confidence.',
  'One more topic. One more test. One step closer.',
  'Be patient with the syllabus, be strict with your schedule.'
];
