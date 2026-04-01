import { useState, useEffect, useCallback } from 'react'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

const BLOCKED_WORDS = new Set(['fuck','shit','damn','ass','bitch','bastard','dick','cock','pussy','cunt','whore','slut','porn','sex','orgasm','erotic','hentai','cocaine','heroin','meth','lsd','rape','molest','suicide'])

function isWordBlocked(word: string): boolean {
  const lower = word.toLowerCase().trim()
  for (const blocked of BLOCKED_WORDS) { if (lower.includes(blocked)) return true }
  return false
}

type GradeLevel = 'K-2' | '3-5' | '6-8' | '9-12'
const GRADE_LABELS: Record<GradeLevel, string> = {
  'K-2': 'Grades K-2',
  '3-5': 'Grades 3-5',
  '6-8': 'Grades 6-8',
  '9-12': 'Grades 9-12',
}

interface Passage {
  id: string; title: string; level: GradeLevel; text: string
  vocabulary: { word: string; definition: string }[]
  questions: { question: string; options: string[]; correct: number }[]
}

const PASSAGES: Passage[] = [
  // --- GRADES K-2: Short sentences, familiar topics, simple vocabulary ---
  {
    id: 'k1', title: 'The Brave Little Seed', level: 'K-2',
    text: `A tiny seed fell into the dark soil. "It's so dark down here," the seed whispered. But soon, rain came and gave the seed water. The sun warmed the earth above.\n\nSlowly, a small green sprout pushed through the dirt. Day by day, it grew taller. Leaves unfolded like little green hands reaching for the sky.\n\nBy summer, the sprout had become a beautiful sunflower, standing tall and bright. Birds came to visit, and bees buzzed around its golden petals.\n\n"I was scared of the dark," the sunflower thought, "but it was exactly where I needed to be to grow."`,
    vocabulary: [
      { word: 'sprout', definition: 'A young plant that has just begun to grow from a seed' },
      { word: 'unfolded', definition: 'Opened up or spread out from a folded position' },
      { word: 'petals', definition: 'The colorful parts of a flower that surround the center' },
    ],
    questions: [
      { question: 'Where did the seed land?', options: ['In water', 'In dark soil', 'On a rock', 'In a pot'], correct: 1 },
      { question: 'What did the seed become?', options: ['A tree', 'A rose', 'A sunflower', 'A daisy'], correct: 2 },
      { question: 'What is the lesson of the story?', options: ['Seeds need light', 'Dark places can help you grow', 'Flowers are pretty', 'Rain is important'], correct: 1 },
    ],
  },
  {
    id: 'k2', title: "The Ocean's Secret", level: 'K-2',
    text: `Maya loved visiting the beach with her grandmother. One morning, they found a beautiful seashell half-buried in the sand.\n\n"Hold it to your ear," Grandma said with a smile. Maya pressed the shell against her ear and gasped. "I can hear the ocean!"\n\nGrandma laughed gently. "That's the sound of air moving inside the shell. But some people believe the ocean leaves a little bit of its song in every shell it touches."\n\nMaya kept the shell in her pocket all day. Every time she felt lonely at school, she would hold it and remember the waves, the sand, and her grandmother's warm smile.`,
    vocabulary: [
      { word: 'buried', definition: 'Hidden or covered under something, like sand or dirt' },
      { word: 'gasped', definition: 'Took a quick, short breath because of surprise or excitement' },
      { word: 'gently', definition: 'In a soft, kind, and careful way' },
    ],
    questions: [
      { question: 'Who did Maya visit the beach with?', options: ['Her mother', 'Her friend', 'Her grandmother', 'Her teacher'], correct: 2 },
      { question: 'What did Maya find?', options: ['A fish', 'A seashell', 'A starfish', 'A bottle'], correct: 1 },
      { question: 'Why did Maya keep the shell?', options: ['To sell it', 'It was valuable', 'It reminded her of the beach and Grandma', 'Her teacher asked for it'], correct: 2 },
    ],
  },
  {
    id: 'k3', title: 'Max and the Lost Kitten', level: 'K-2',
    text: `Max was walking home from school when he heard a tiny sound. "Meow!" It came from under a bush.\n\nMax looked under the bush and saw a small orange kitten. It was shaking and looked scared. "Don't worry, little one," Max said softly.\n\nHe picked up the kitten and carried it home. His mom helped him give it warm milk and a cozy blanket. They put up signs around the neighborhood.\n\nThe next day, a little girl knocked on their door. "That's my kitten, Sunny!" she cried happily. Max felt good inside. Helping others always feels that way.`,
    vocabulary: [
      { word: 'tiny', definition: 'Very, very small' },
      { word: 'shaking', definition: 'Moving back and forth quickly, often because of being cold or scared' },
      { word: 'neighborhood', definition: 'The area where you live, with houses and people nearby' },
    ],
    questions: [
      { question: 'Where did Max find the kitten?', options: ['At school', 'Under a bush', 'In his house', 'At the park'], correct: 1 },
      { question: 'What color was the kitten?', options: ['Black', 'White', 'Orange', 'Gray'], correct: 2 },
      { question: 'How did Max feel after helping?', options: ['Sad', 'Angry', 'Good inside', 'Tired'], correct: 2 },
    ],
  },

  // --- GRADES 3-5: Longer paragraphs, informational text, richer vocabulary ---
  {
    id: 'm1', title: 'The Water Cycle', level: '3-5',
    text: `Water is always on the move. The journey of water through our environment is called the water cycle, and it has been happening for billions of years.\n\nIt begins with evaporation. The sun heats water in oceans, lakes, and rivers, turning it into water vapor — an invisible gas that rises into the atmosphere. Plants also release water vapor through transpiration.\n\nAs water vapor rises higher, it cools and transforms back into tiny water droplets. This is condensation, and it forms clouds. When droplets combine and become heavy enough, they fall as precipitation — rain, snow, sleet, or hail.\n\nThe water then collects in rivers, lakes, and oceans, or soaks into the ground as groundwater. And the cycle begins again.`,
    vocabulary: [
      { word: 'evaporation', definition: 'The process of liquid water changing into water vapor (gas) due to heat' },
      { word: 'condensation', definition: 'The process of water vapor cooling and turning back into liquid droplets' },
      { word: 'precipitation', definition: 'Water falling from clouds as rain, snow, sleet, or hail' },
      { word: 'atmosphere', definition: 'The layer of gases surrounding the Earth' },
    ],
    questions: [
      { question: 'What starts the water cycle?', options: ['Rain', 'Evaporation', 'Condensation', 'Wind'], correct: 1 },
      { question: 'What forms clouds?', options: ['Evaporation', 'Precipitation', 'Condensation', 'Transpiration'], correct: 2 },
      { question: 'What is precipitation?', options: ['Water turning to gas', 'Clouds forming', 'Water falling from clouds', 'Water soaking into ground'], correct: 2 },
    ],
  },
  {
    id: 'm2', title: 'How Volcanoes Work', level: '3-5',
    text: `Deep beneath the Earth's surface, it is incredibly hot. Rock melts into a thick, glowing liquid called magma. This magma is lighter than the solid rock around it, so it slowly rises toward the surface.\n\nWhen magma finds a crack or weak spot in the Earth's crust, it can burst out. This is called an eruption. Once magma reaches the surface, it is called lava. Lava can flow down the sides of a volcano like a river of fire.\n\nVolcanoes also shoot out ash, rocks, and gases. The ash can travel for miles and even block out the sun. Over many eruptions, the lava cools and hardens, building the volcano higher and higher.\n\nNot all volcanoes are dangerous. Some erupt gently, while others can be explosive. Scientists called volcanologists study volcanoes to help keep people safe.`,
    vocabulary: [
      { word: 'magma', definition: 'Hot, melted rock found beneath the Earth\'s surface' },
      { word: 'eruption', definition: 'When a volcano sends out lava, ash, and gases' },
      { word: 'crust', definition: 'The hard, outer layer of the Earth' },
      { word: 'volcanologist', definition: 'A scientist who studies volcanoes' },
    ],
    questions: [
      { question: 'What is magma?', options: ['Cold water', 'Melted rock underground', 'A type of gas', 'Hardened lava'], correct: 1 },
      { question: 'What is magma called when it reaches the surface?', options: ['Ash', 'Crust', 'Lava', 'Steam'], correct: 2 },
      { question: 'What do volcanologists do?', options: ['Build volcanoes', 'Study volcanoes', 'Stop eruptions', 'Collect lava'], correct: 1 },
    ],
  },

  // --- GRADES 6-8: Complex ideas, cause/effect, historical and scientific topics ---
  {
    id: 'h1', title: 'The Discovery of Penicillin', level: '6-8',
    text: `In 1928, Scottish scientist Alexander Fleming made one of the most important accidental discoveries in medical history. After returning from vacation, he noticed that a mold called Penicillium notatum had contaminated one of his petri dishes containing bacteria.\n\nThe bacteria near the mold had been destroyed, while bacteria farther away continued to thrive. Fleming hypothesized that the mold was producing a substance that killed bacteria. He called it "penicillin."\n\nIt wasn't until 1940 that Howard Florey and Ernst Boris Chain developed methods to mass-produce penicillin, just in time for World War II. Penicillin became the first widely used antibiotic, saving an estimated 200 million lives.\n\nToday, antibiotics face a new challenge: antibiotic resistance. Overuse has led to "superbugs" that no longer respond to treatment.`,
    vocabulary: [
      { word: 'contaminated', definition: 'Made impure by contact with something unclean or harmful' },
      { word: 'hypothesized', definition: 'Proposed an explanation based on limited evidence as a starting point' },
      { word: 'antibiotic', definition: 'A medicine that kills or stops the growth of bacteria' },
      { word: 'resistance', definition: 'The ability of bacteria to withstand the effects of an antibiotic' },
    ],
    questions: [
      { question: 'How was penicillin discovered?', options: ['Planned experiment', 'By accident', 'Computer simulation', 'Animal testing'], correct: 1 },
      { question: 'Who made penicillin usable for medicine?', options: ['Fleming alone', 'Florey and Chain', 'Nobel committee', 'Army doctors'], correct: 1 },
      { question: 'What modern problem do antibiotics face?', options: ['Too expensive', 'Antibiotic resistance', 'They taste bad', 'Not enough mold'], correct: 1 },
    ],
  },
  {
    id: 'h2', title: 'The Civil Rights Movement', level: '6-8',
    text: `In the 1950s and 1960s, millions of Americans fought for equal rights for African Americans. This period is known as the Civil Rights Movement.\n\nFor decades, especially in the South, laws called "Jim Crow laws" kept Black and white people separated. Black people had to use different schools, restaurants, water fountains, and seats on buses. This separation was called segregation.\n\nBrave individuals stood up against injustice. In 1955, Rosa Parks refused to give up her bus seat to a white passenger in Montgomery, Alabama. Her arrest sparked a 381-day bus boycott led by Dr. Martin Luther King Jr.\n\nDr. King believed in nonviolent protest. His famous "I Have a Dream" speech at the 1963 March on Washington inspired the nation. In 1964, the Civil Rights Act was signed into law, making segregation illegal.\n\nThe movement showed that ordinary people, working together peacefully, can change unjust laws.`,
    vocabulary: [
      { word: 'segregation', definition: 'The practice of separating people based on race' },
      { word: 'boycott', definition: 'Refusing to buy or use something as a form of protest' },
      { word: 'nonviolent', definition: 'Achieving goals through peaceful methods, without using force' },
      { word: 'injustice', definition: 'Unfair treatment of people; lack of fairness or justice' },
    ],
    questions: [
      { question: 'What were Jim Crow laws?', options: ['Tax laws', 'Laws that enforced segregation', 'Traffic laws', 'School rules'], correct: 1 },
      { question: 'What did Rosa Parks do?', options: ['Gave a speech', 'Refused to give up her bus seat', 'Wrote a book', 'Ran for office'], correct: 1 },
      { question: 'What approach did Dr. King believe in?', options: ['Armed resistance', 'Nonviolent protest', 'Legal action only', 'Isolation'], correct: 1 },
      { question: 'What did the Civil Rights Act of 1964 do?', options: ['Created new schools', 'Made segregation illegal', 'Elected a new president', 'Built new roads'], correct: 1 },
    ],
  },

  // --- GRADES 9-12: Academic vocabulary, complex arguments, analysis-level questions ---
  {
    id: 's1', title: 'The Ethics of Artificial Intelligence', level: '9-12',
    text: `Artificial intelligence is transforming nearly every aspect of modern life, from healthcare diagnostics to criminal justice. But as AI systems become more powerful, society faces profound ethical questions.\n\nOne major concern is algorithmic bias. AI systems learn from historical data, which often reflects existing prejudices. For example, hiring algorithms trained on past decisions may discriminate against women or minorities — not because they were programmed to, but because the training data contained those biases.\n\nAnother challenge is accountability. When an autonomous vehicle causes an accident, who is responsible — the manufacturer, the programmer, or the AI itself? Current legal frameworks struggle with this question.\n\nPrivacy is equally pressing. Facial recognition technology can identify individuals in crowds, raising concerns about surveillance and civil liberties. Several cities have already banned its use by law enforcement.\n\nProponents argue that AI can reduce human error and increase efficiency. Critics counter that without careful regulation, AI could deepen inequality and erode individual rights. The question is not whether AI will shape our future, but whether we will shape AI to reflect our values.`,
    vocabulary: [
      { word: 'algorithmic', definition: 'Relating to a set of rules or steps that a computer follows to solve a problem' },
      { word: 'bias', definition: 'An unfair preference for or against something, often based on incomplete information' },
      { word: 'accountability', definition: 'The obligation to explain and take responsibility for one\'s actions or decisions' },
      { word: 'autonomous', definition: 'Operating independently, without human control' },
      { word: 'surveillance', definition: 'Close observation of a person or group, especially by authorities' },
    ],
    questions: [
      { question: 'Why might AI systems show bias?', options: ['They are poorly built', 'They learn from biased historical data', 'They choose to be unfair', 'They are too expensive'], correct: 1 },
      { question: 'What ethical issue does autonomous driving raise?', options: ['Cost', 'Speed limits', 'Accountability for accidents', 'Fuel efficiency'], correct: 2 },
      { question: 'Why have some cities banned facial recognition?', options: ['It is inaccurate', 'Privacy and civil liberty concerns', 'It is too expensive', 'People don\'t like cameras'], correct: 1 },
      { question: 'What is the main argument of critics of AI?', options: ['AI is too slow', 'AI could deepen inequality without regulation', 'AI costs too much', 'AI replaces all jobs'], correct: 1 },
    ],
  },
  {
    id: 's2', title: 'Climate Change: Causes and Consequences', level: '9-12',
    text: `Since the Industrial Revolution, human activities have released enormous quantities of greenhouse gases into the atmosphere. Carbon dioxide from burning fossil fuels, methane from agriculture, and nitrous oxide from industrial processes trap heat that would otherwise escape into space. This enhanced greenhouse effect is the primary driver of global climate change.\n\nThe consequences are already visible. Global average temperatures have risen approximately 1.1°C since pre-industrial times. Arctic ice is melting at unprecedented rates. Sea levels are rising, threatening coastal communities. Extreme weather events — hurricanes, droughts, wildfires — are becoming more frequent and severe.\n\nThe scientific consensus, supported by over 97% of climate scientists, is unambiguous: human activity is the dominant cause. The Intergovernmental Panel on Climate Change (IPCC) warns that without drastic reductions in emissions, temperatures could rise by 2.5-4.5°C by 2100.\n\nSolutions exist but require collective action: transitioning to renewable energy, improving energy efficiency, protecting forests, and developing carbon capture technologies. The challenge is not scientific but political and economic — mobilizing the will to act before irreversible tipping points are crossed.`,
    vocabulary: [
      { word: 'greenhouse gases', definition: 'Gases in the atmosphere that trap heat, including CO2 and methane' },
      { word: 'unprecedented', definition: 'Never done or known before; having no equal' },
      { word: 'consensus', definition: 'A general agreement among a group of people' },
      { word: 'irreversible', definition: 'Impossible to undo or change back to a previous state' },
      { word: 'emissions', definition: 'Substances (especially gases) released into the atmosphere' },
    ],
    questions: [
      { question: 'What is the primary driver of climate change?', options: ['Solar activity', 'Enhanced greenhouse effect from human emissions', 'Volcanic eruptions', 'Ocean currents'], correct: 1 },
      { question: 'How much have global temperatures risen since pre-industrial times?', options: ['0.1°C', '1.1°C', '5°C', '10°C'], correct: 1 },
      { question: 'What percentage of climate scientists agree on human-caused climate change?', options: ['50%', '75%', 'Over 97%', '100%'], correct: 2 },
      { question: 'What does the passage say is the main barrier to solving climate change?', options: ['Lack of technology', 'Political and economic will', 'Not enough scientists', 'Too many people'], correct: 1 },
    ],
  },
]

type Tab = 'read' | 'words' | 'quiz'
interface SavedWord { word: string; definition: string; fromPassage?: string }

export default function DictionaryApp() {
  const [tab, setTab] = useState<Tab>('read')
  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null)
  const [savedWords, setSavedWords] = useState<SavedWord[]>([])
  const [completedPassages, setCompletedPassages] = useState<Set<string>>(new Set())
  const [showQuestions, setShowQuestions] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [readingScore, setReadingScore] = useState(0)
  const [readingFeedback, setReadingFeedback] = useState<{ correct: boolean; answer: string } | null>(null)
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupResult, setLookupResult] = useState<{ word: string; definition: string; partOfSpeech?: string; example?: string } | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [quizFeedback, setQuizFeedback] = useState<{ correct: boolean; answer: string } | null>(null)
  const [quizOptions, setQuizOptions] = useState<string[]>([])

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, params } = msg
      if (tool === 'restore_state') {
        const s = params as Record<string, unknown>
        if (s.savedWords) setSavedWords(s.savedWords as SavedWord[])
        if (s.completedPassages) setCompletedPassages(new Set(s.completedPassages as string[]))
        sendToPlatform('tool_result', correlationId, { tool: 'restore_state', message: 'Restored' })
      } else if (tool === 'define_word') {
        const word = params?.word as string
        if (word) { setTab('words'); setLookupQuery(word); doLookup(word) }
        sendToPlatform('tool_result', correlationId, { tool: 'define_word', word })
        sendToPlatform('completion', correlationId, { summary: `Looked up "${word}"` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const saveState = useCallback((words: SavedWord[], completed: Set<string>) => {
    sendToPlatform('state_update', '', { type: 'reading_state', savedWords: words, completedPassages: Array.from(completed) })
  }, [])

  async function doLookup(word: string) {
    if (isWordBlocked(word)) {
      setLookupError("That word isn't available in the student dictionary.")
      sendToPlatform('state_update', '', { type: 'inappropriate_search', word, timestamp: new Date().toISOString() })
      return
    }
    setLookupLoading(true); setLookupError(''); setLookupResult(null)
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const entry = data[0]; const meaning = entry.meanings?.[0]; const def = meaning?.definitions?.[0]
      setLookupResult({ word: entry.word, definition: def?.definition || 'No definition found', partOfSpeech: meaning?.partOfSpeech, example: def?.example })
    } catch { setLookupError(`Could not find "${word}". Check spelling.`) }
    finally { setLookupLoading(false) }
  }

  function handleLookup(e: React.FormEvent) { e.preventDefault(); if (lookupQuery.trim()) doLookup(lookupQuery.trim().toLowerCase()) }

  function saveWord(word: string, definition: string, fromPassage?: string) {
    if (savedWords.some(w => w.word === word)) return
    const updated = [{ word, definition, fromPassage }, ...savedWords]
    setSavedWords(updated); saveState(updated, completedPassages)
  }

  function answerQuestion(optionIndex: number) {
    if (!selectedPassage || readingFeedback) return
    const q = selectedPassage.questions[questionIndex]
    const correct = optionIndex === q.correct
    if (correct) setReadingScore(s => s + 1)
    setReadingFeedback({ correct, answer: q.options[q.correct] })
  }

  function nextQuestion() {
    if (!selectedPassage) return
    if (questionIndex + 1 >= selectedPassage.questions.length) {
      const nc = new Set(completedPassages); nc.add(selectedPassage.id)
      setCompletedPassages(nc); saveState(savedWords, nc)
      setSelectedPassage(null); setShowQuestions(false); return
    }
    setQuestionIndex(i => i + 1); setReadingFeedback(null)
  }

  function startVocabQuiz() {
    if (savedWords.length < 2) return
    setTab('quiz'); setQuizIndex(0); setQuizScore(0); setQuizFeedback(null)
    const correct = savedWords[0].word
    const others = savedWords.slice(1).map(w => w.word).sort(() => Math.random() - 0.5).slice(0, 3)
    setQuizOptions([correct, ...others].sort(() => Math.random() - 0.5))
  }

  function answerQuiz(answer: string) {
    const correct = savedWords[quizIndex].word
    if (answer === correct) setQuizScore(s => s + 1)
    setQuizFeedback({ correct: answer === correct, answer: correct })
  }

  function nextQuiz() {
    const next = quizIndex + 1
    if (next >= savedWords.length) { setQuizIndex(next); setQuizFeedback(null); return }
    setQuizIndex(next); setQuizFeedback(null)
    const correct = savedWords[next].word
    const others = savedWords.filter((_, i) => i !== next).map(w => w.word).sort(() => Math.random() - 0.5).slice(0, 3)
    setQuizOptions([correct, ...others].sort(() => Math.random() - 0.5))
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 14px', border: 'none', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
    cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: 'none', color: active ? '#3b82f6' : '#6b7280',
  })

  // --- Reading a passage with questions ---
  if (selectedPassage && showQuestions) {
    const q = selectedPassage.questions[questionIndex]
    if (questionIndex >= selectedPassage.questions.length) {
      return (
        <div style={{ padding: '16px', maxWidth: '440px', margin: '0 auto', fontFamily: 'system-ui', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>Reading Complete!</div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#3b82f6', margin: '12px 0' }}>{readingScore}/{selectedPassage.questions.length}</div>
          <button onClick={() => { setSelectedPassage(null); setShowQuestions(false) }} style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Done</button>
        </div>
      )
    }
    return (
      <div style={{ padding: '16px', maxWidth: '440px', margin: '0 auto', fontFamily: 'system-ui' }}>
        <button onClick={() => setShowQuestions(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '13px', marginBottom: '12px' }}>&larr; Back to passage</button>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Question {questionIndex + 1} of {selectedPassage.questions.length}</div>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>{q.question}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => answerQuestion(i)} disabled={!!readingFeedback} style={{
              padding: '10px 14px', borderRadius: '8px', fontSize: '14px', textAlign: 'left', cursor: readingFeedback ? 'default' : 'pointer',
              border: '2px solid', background: 'white', color: '#374151',
              borderColor: !readingFeedback ? '#d1d5db' : i === q.correct ? '#22c55e' : '#d1d5db',
            }}>{opt}</button>
          ))}
        </div>
        {readingFeedback && (
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: readingFeedback.correct ? '#166534' : '#991b1b', marginBottom: '8px' }}>
              {readingFeedback.correct ? 'Correct!' : `The answer is: ${readingFeedback.answer}`}
            </div>
            <button onClick={nextQuestion} style={{ padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              {questionIndex + 1 >= selectedPassage.questions.length ? 'Finish' : 'Next'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // --- Reading a passage ---
  if (selectedPassage) {
    return (
      <div style={{ padding: '16px', maxWidth: '440px', margin: '0 auto', fontFamily: 'system-ui' }}>
        <button onClick={() => setSelectedPassage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>&larr; All passages</button>
        <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{selectedPassage.level}</div>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>{selectedPassage.title}</div>
        <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-line', marginBottom: '20px', background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
          {selectedPassage.text}
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Key Vocabulary</div>
          {selectedPassage.vocabulary.map(v => (
            <div key={v.word} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', marginBottom: '4px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div><span style={{ fontWeight: 600, fontSize: '14px' }}>{v.word}</span> <span style={{ fontSize: '12px', color: '#6b7280' }}>— {v.definition}</span></div>
              <button onClick={() => saveWord(v.word, v.definition, selectedPassage.title)} disabled={savedWords.some(w => w.word === v.word)}
                style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #d1d5db', cursor: 'pointer', background: savedWords.some(w => w.word === v.word) ? '#f0fdf4' : 'white' }}>
                {savedWords.some(w => w.word === v.word) ? '✓' : '+'}
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => { setShowQuestions(true); setQuestionIndex(0); setReadingScore(0); setReadingFeedback(null) }}
          style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 600 }}>
          Comprehension Quiz ({selectedPassage.questions.length} questions)
        </button>
      </div>
    )
  }

  // --- Main view ---
  return (
    <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto', padding: '16px', fontFamily: 'system-ui' }}>
      <div style={{ fontSize: '18px', fontWeight: 700, textAlign: 'center', marginBottom: '4px' }}>Reading & Vocabulary</div>
      <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', marginBottom: '12px' }}>Read stories, learn words, take quizzes</div>

      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
        <button onClick={() => setTab('read')} style={tabStyle(tab === 'read')}>📖 Read</button>
        <button onClick={() => setTab('words')} style={tabStyle(tab === 'words')}>📚 Words ({savedWords.length})</button>
        <button onClick={() => setTab('quiz')} style={tabStyle(tab === 'quiz')}>🧠 Quiz</button>
      </div>

      {tab === 'read' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(['K-2', '3-5', '6-8', '9-12'] as GradeLevel[]).map(level => {
            const levelPassages = PASSAGES.filter(p => p.level === level)
            const completedCount = levelPassages.filter(p => completedPassages.has(p.id)).length
            return (
              <div key={level}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{GRADE_LABELS[level]}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{completedCount}/{levelPassages.length} complete</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {levelPassages.map(p => (
                    <button key={p.id} onClick={() => setSelectedPassage(p)} style={{
                      padding: '12px 14px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
                      border: `2px solid ${completedPassages.has(p.id) ? '#bbf7d0' : '#e5e7eb'}`,
                      background: completedPassages.has(p.id) ? '#f0fdf4' : 'white',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.title}</div>
                        {completedPassages.has(p.id) && <span style={{ fontSize: '12px' }}>✅</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{p.vocabulary.length} words · {p.questions.length} questions</div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'words' && (
        <div>
          <form onSubmit={handleLookup} style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            <input type="text" value={lookupQuery} onChange={e => setLookupQuery(e.target.value)} placeholder="Look up any word..." autoFocus
              style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }} />
            <button type="submit" disabled={lookupLoading} style={{ padding: '8px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
              {lookupLoading ? '...' : 'Look up'}
            </button>
          </form>
          {lookupError && <div style={{ color: '#dc2626', fontSize: '12px', padding: '6px', background: '#fee2e2', borderRadius: '6px', marginBottom: '8px' }}>{lookupError}</div>}
          {lookupResult && (
            <div style={{ padding: '12px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{lookupResult.word}</div>
                <button onClick={() => saveWord(lookupResult.word, lookupResult.definition)} disabled={savedWords.some(w => w.word === lookupResult.word)}
                  style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #d1d5db', cursor: 'pointer', background: 'white' }}>
                  {savedWords.some(w => w.word === lookupResult.word) ? '✓ Saved' : '+ Save'}
                </button>
              </div>
              {lookupResult.partOfSpeech && <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 500 }}>{lookupResult.partOfSpeech}</div>}
              <div style={{ fontSize: '13px', color: '#374151', marginTop: '4px' }}>{lookupResult.definition}</div>
              {lookupResult.example && <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginTop: '4px' }}>"{lookupResult.example}"</div>}
            </div>
          )}
          {savedWords.length > 0 ? savedWords.map(w => (
            <div key={w.word} style={{ padding: '8px 10px', marginBottom: '4px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <span style={{ fontWeight: 600, fontSize: '13px' }}>{w.word}</span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}> — {w.definition}</span>
              {w.fromPassage && <div style={{ fontSize: '10px', color: '#9ca3af' }}>from: {w.fromPassage}</div>}
            </div>
          )) : !lookupResult && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '13px' }}>Read passages and save words, or look up any word above</div>
          )}
          {savedWords.length >= 2 && (
            <button onClick={startVocabQuiz} style={{ marginTop: '8px', width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
              Quiz Me on My Words
            </button>
          )}
        </div>
      )}

      {tab === 'quiz' && (
        <div style={{ textAlign: 'center' }}>
          {savedWords.length < 2 ? (
            <div style={{ padding: '24px', color: '#9ca3af', fontSize: '13px' }}>Save at least 2 words to start a quiz</div>
          ) : quizIndex >= savedWords.length ? (
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>Quiz Complete!</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#3b82f6', margin: '12px 0' }}>{quizScore}/{savedWords.length}</div>
              <button onClick={startVocabQuiz} style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Play Again</button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>Question {quizIndex + 1} of {savedWords.length}</div>
              <div style={{ padding: '16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', marginBottom: '12px', fontSize: '14px', color: '#374151' }}>
                {savedWords[quizIndex].definition}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Which word matches?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {quizOptions.map(opt => (
                  <button key={opt} onClick={() => !quizFeedback && answerQuiz(opt)} disabled={!!quizFeedback} style={{
                    padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: quizFeedback ? 'default' : 'pointer',
                    border: '2px solid', color: '#374151', background: 'white',
                    borderColor: !quizFeedback ? '#d1d5db' : opt === quizFeedback.answer ? '#22c55e' : '#d1d5db',
                  }}>{opt}</button>
                ))}
              </div>
              {quizFeedback && (
                <button onClick={nextQuiz} style={{ marginTop: '12px', padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  {quizIndex + 1 >= savedWords.length ? 'See Results' : 'Next'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
