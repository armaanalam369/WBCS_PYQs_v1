/* Indian Polity — Set 1.   ⚠ SAMPLE DATA: replace with the real questions.
   FILE FORMAT
   - The id in SETDATA['POL-1'] must match the id in manifest.js.
   - The chapter is taken from the manifest, so questions do NOT need an "s" field.
   - c = sub-topic (optional) · q = question · o = options (2–4) · a = index of correct option (0 = A)
     e = explanation (optional) · you can add year info inside c, e.g. c:'Parliament (2019)'. */
(window.SETDATA = window.SETDATA || {})['POL-1'] = {
  title: 'Indian Polity · Set 1',
  questions: [
    { c: 'Constituent Assembly', q: 'Who chaired the Drafting Committee of the Constituent Assembly?', o: ['Jawaharlal Nehru', 'Rajendra Prasad', 'B. R. Ambedkar', 'Sardar Patel'], a: 2, e: 'Dr B. R. Ambedkar was Chairman of the Drafting Committee.' },
    { c: 'Parliament', q: 'What is the minimum age to contest a Lok Sabha election?', o: ['18 years', '21 years', '25 years', '30 years'], a: 2, e: 'A candidate must be at least 25 years old for the Lok Sabha.' },
    { c: 'Fundamental Rights', q: 'Which Article of the Constitution abolishes untouchability?', o: ['Article 15', 'Article 17', 'Article 19', 'Article 21'], a: 1, e: 'Article 17 abolishes untouchability.' },
    { c: 'President', q: 'The President of India is elected by —', o: ['Direct vote of the people', 'An electoral college', 'Lok Sabha only', 'Supreme Court'], a: 1, e: 'An electoral college of elected MPs and MLAs elects the President.' },
    { c: 'Amendments', q: 'The Anti-Defection law was added to the Constitution by which Schedule?', o: ['Eighth', 'Ninth', 'Tenth', 'Eleventh'], a: 2, e: 'The Tenth Schedule (52nd Amendment, 1985) deals with disqualification on grounds of defection.' }
  ]
};
