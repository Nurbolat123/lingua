export const BLOCK_CONTENT_EXAMPLES: Record<string, string> = {
  INTRO: '{\n  "text": "Короткое введение в тему урока."\n}',
  VOCABULARY: '{\n  "words": ["achieve", "balance", "deadline"]\n}',
  GRAMMAR: '{\n  "explanation": "Present Perfect: I have worked here for three years."\n}',
  READING: '{\n  "text": "Текст для чтения…"\n}',
  LISTENING: '{\n  "audioUrl": "https://…/audio.mp3",\n  "transcript": "Текст аудио…"\n}',
  EXERCISE: '{}',
  SPEAKING: '{}',
  MINI_TEST: '{}',
  HOMEWORK: '{\n  "text": "Что нужно сделать дома."\n}',
};

export const EXERCISE_CONTENT_EXAMPLES: Record<string, string> = {
  MULTIPLE_CHOICE:
    '{\n  "question": "She ___ here for 5 years.",\n  "options": ["works", "has worked"],\n  "correctIndex": 1,\n  "explanation": "Present Perfect"\n}',
  FILL_BLANK: '{\n  "text": "She ___ (work) here for 5 years.",\n  "answers": ["has worked"]\n}',
  MATCHING: '{\n  "pairs": [{ "left": "deadline", "right": "крайний срок" }]\n}',
  ORDERING: '{\n  "tokens": ["I", "have", "finished", "the", "report"],\n  "correctOrder": [0, 1, 2, 3, 4]\n}',
  FREE_RESPONSE: '{\n  "question": "Describe your typical work day.",\n  "rubric": "grammar, vocabulary, structure"\n}',
  SPEAKING: '{\n  "prompt": "What makes a person successful?",\n  "rubric": "vocabulary, grammar, fluency, pronunciation — 1–5"\n}',
};
