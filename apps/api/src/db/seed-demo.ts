/**
 * Демо-контент: заглушки для проверки схемы и админки, не настоящий учебный материал.
 * Идемпотентно: перед вставкой удаляет прежние строки с isDemo = true.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import {
  courseModules, courses, exercises, lessonBlocks, lessons, questionBank, vocabularyWords,
} from './schema';

try { process.loadEnvFile(); } catch { /* optional */ }

const VOCAB_B1: {
  word: string; ru: string; kk?: string; def: string; transcription: string; example: string;
}[] = [
  { word: 'achieve', ru: 'достигать', def: 'to succeed in finishing something or reaching an aim', transcription: '/əˈtʃiːv/', example: 'She worked hard to achieve her goals.' },
  { word: 'balance', ru: 'баланс, равновесие', def: 'an even distribution of weight or importance', transcription: '/ˈbæləns/', example: 'It is hard to find a balance between work and life.' },
  { word: 'burnout', ru: 'выгорание', def: 'extreme tiredness caused by long-term stress', transcription: '/ˈbɜːnaʊt/', example: 'He took a break to avoid burnout.' },
  { word: 'career', ru: 'карьера', def: 'a job or profession over a long period of time', transcription: '/kəˈrɪə/', example: 'She started her career as a teacher.' },
  { word: 'colleague', ru: 'коллега', def: 'a person you work with', transcription: '/ˈkɒliːɡ/', example: 'My colleague helped me finish the report.' },
  { word: 'confident', ru: 'уверенный', def: 'feeling sure about your own abilities', transcription: '/ˈkɒnfɪdənt/', example: 'He felt confident before the interview.' },
  { word: 'deadline', ru: 'крайний срок', def: 'the latest time by which something must be finished', transcription: '/ˈdedlaɪn/', example: 'The deadline for the project is Friday.' },
  { word: 'decision', ru: 'решение', def: 'a choice you make after thinking', transcription: '/dɪˈsɪʒn/', example: 'It was a difficult decision to make.' },
  { word: 'deliver', ru: 'выполнять, доставлять', def: 'to produce or provide something promised', transcription: '/dɪˈlɪvə/', example: 'The team delivered the project on time.' },
  { word: 'employer', ru: 'работодатель', def: 'a person or company that pays others to work', transcription: '/ɪmˈplɔɪə/', example: 'Her employer offered her a promotion.' },
  { word: 'flexible', ru: 'гибкий', def: 'able to change or adapt easily', transcription: '/ˈfleksəbl/', example: 'The company offers flexible working hours.' },
  { word: 'goal', ru: 'цель', def: 'something you aim to achieve', transcription: '/ɡəʊl/', example: 'Her goal is to speak fluent English.' },
  { word: 'habit', ru: 'привычка', def: 'something you do regularly, often without thinking', transcription: '/ˈhæbɪt/', example: 'Reading before bed is a good habit.' },
  { word: 'improve', ru: 'улучшать', def: 'to make or become better', transcription: '/ɪmˈpruːv/', example: 'He wants to improve his speaking skills.' },
  { word: 'manage', ru: 'справляться, управлять', def: 'to succeed in doing something, or to control', transcription: '/ˈmænɪdʒ/', example: 'She manages a small team at work.' },
  { word: 'motivation', ru: 'мотивация', def: 'the reason or enthusiasm for doing something', transcription: '/ˌməʊtɪˈveɪʃn/', example: 'Lack of sleep affects his motivation.' },
  { word: 'negotiate', ru: 'договариваться', def: 'to discuss something to reach an agreement', transcription: '/nɪˈɡəʊʃieɪt/', example: 'They negotiated a better salary.' },
  { word: 'opportunity', ru: 'возможность', def: 'a chance to do something', transcription: '/ˌɒpəˈtjuːnəti/', example: 'Moving abroad was a great opportunity.' },
  { word: 'organise', ru: 'организовывать', def: 'to arrange or plan something', transcription: '/ˈɔːɡənaɪz/', example: 'She organised the whole event herself.' },
  { word: 'overtime', ru: 'сверхурочные', def: 'time worked beyond normal working hours', transcription: '/ˈəʊvətaɪm/', example: 'He often works overtime on weekends.' },
  { word: 'priority', ru: 'приоритет', def: 'something considered more important than others', transcription: '/praɪˈɒrəti/', example: 'Family is her top priority.' },
  { word: 'promotion', ru: 'повышение', def: 'a move to a higher position at work', transcription: '/prəˈməʊʃn/', example: 'He got a promotion after two years.' },
  { word: 'reliable', ru: 'надёжный', def: 'able to be trusted', transcription: '/rɪˈlaɪəbl/', example: 'She is a reliable colleague.' },
  { word: 'responsibility', ru: 'ответственность', def: 'a duty to deal with something', transcription: '/rɪˌspɒnsəˈbɪləti/', example: 'He took responsibility for the mistake.' },
  { word: 'schedule', ru: 'расписание, график', def: 'a plan of times when things will happen', transcription: '/ˈʃedjuːl/', example: 'My schedule is very busy this week.' },
  { word: 'skill', ru: 'навык', def: 'the ability to do something well', transcription: '/skɪl/', example: 'Communication is an important skill.' },
  { word: 'stressful', ru: 'напряжённый, стрессовый', def: 'causing mental or emotional pressure', transcription: '/ˈstresfl/', example: 'His job can be very stressful.' },
  { word: 'sustainable', ru: 'устойчивый', def: 'able to continue over a long period without harm', transcription: '/səˈsteɪnəbl/', example: 'The company follows sustainable practices.' },
  { word: 'task', ru: 'задача', def: 'a piece of work to be done', transcription: '/tɑːsk/', example: 'She finished all her tasks before lunch.' },
  { word: 'workload', ru: 'нагрузка (рабочая)', def: 'the amount of work to be done', transcription: '/ˈwɜːkləʊd/', example: 'His workload increased this month.' },
];

const GRAMMAR_B1: { q: string; options: string[]; correct: number; explanation: string }[] = [
  { q: 'She ___ in this company for five years.', options: ['works', 'is working', 'has worked', 'worked'], correct: 2, explanation: 'Present Perfect для действия, длящегося до настоящего момента.' },
  { q: 'If I ___ more free time, I would learn Spanish.', options: ['have', 'had', 'will have', 'having'], correct: 1, explanation: 'Second Conditional: if + Past Simple, would + infinitive.' },
  { q: 'This exercise is much ___ than the last one.', options: ['difficult', 'more difficult', 'most difficult', 'difficulter'], correct: 1, explanation: 'Сравнительная степень многосложных прилагательных: more + adjective.' },
  { q: 'By the time we arrived, the meeting ___.', options: ['already started', 'had already started', 'has already started', 'already starts'], correct: 1, explanation: 'Past Perfect для действия, завершившегося до другого действия в прошлом.' },
  { q: 'You ___ study harder if you want to pass the exam.', options: ['should', 'would', 'might', 'could'], correct: 0, explanation: 'Should — совет/рекомендация.' },
  { q: 'The report ___ by the team yesterday.', options: ['finished', 'was finished', 'has finished', 'is finished'], correct: 1, explanation: 'Passive Voice, Past Simple: was/were + past participle.' },
  { q: 'I ___ to the gym since Monday.', options: ['didn\'t go', 'haven\'t gone', 'don\'t go', 'wasn\'t going'], correct: 1, explanation: 'Present Perfect + since для периода, начавшегося в прошлом.' },
  { q: 'She asked me where ___.', options: ['do I live', 'did I live', 'I lived', 'I live'], correct: 2, explanation: 'Косвенная речь: прямой порядок слов, согласование времён.' },
  { q: 'We ___ dinner when the phone rang.', options: ['have', 'had', 'were having', 'has had'], correct: 2, explanation: 'Past Continuous для длительного действия, прерванного другим.' },
  { q: 'This is the man ___ helped me yesterday.', options: ['who', 'whom', 'whose', 'which'], correct: 0, explanation: 'Who — относительное местоимение для людей в роли подлежащего.' },
];

const VOCAB_MC_B1: { q: string; options: string[]; correct: number; explanation: string }[] = [
  { q: 'Choose the word closest in meaning to "achieve".', options: ['fail', 'accomplish', 'avoid', 'delay'], correct: 1, explanation: '"Achieve" значит "accomplish" — успешно завершить что-либо.' },
  { q: 'A person you work with is called a ___.', options: ['stranger', 'colleague', 'neighbour', 'relative'], correct: 1, explanation: 'Colleague — человек, с которым вы работаете.' },
  { q: 'If something can change easily, it is ___.', options: ['flexible', 'strict', 'fixed', 'rigid'], correct: 0, explanation: 'Flexible — способный легко меняться/приспосабливаться.' },
  { q: 'Choose the correct meaning of "deadline".', options: ['a type of meeting', 'the latest time to finish something', 'a job title', 'a work schedule'], correct: 1, explanation: 'Deadline — крайний срок выполнения.' },
  { q: '"Reliable" is closest in meaning to ___.', options: ['untrustworthy', 'dependable', 'lazy', 'careless'], correct: 1, explanation: 'Reliable = dependable, на кого можно положиться.' },
  { q: 'Choose the opposite of "stressful".', options: ['relaxing', 'tiring', 'difficult', 'busy'], correct: 0, explanation: 'Stressful (напряжённый) — противоположность relaxing (расслабляющий).' },
  { q: 'A "priority" is something that is ___.', options: ['unimportant', 'more important than other things', 'forbidden', 'optional'], correct: 1, explanation: 'Priority — то, что важнее остального.' },
  { q: 'Choose the correct meaning of "negotiate".', options: ['to argue angrily', 'to discuss in order to reach an agreement', 'to refuse completely', 'to ignore'], correct: 1, explanation: 'Negotiate — обсуждать, чтобы прийти к соглашению.' },
  { q: 'A "promotion" at work means ___.', options: ['losing your job', 'moving to a higher position', 'taking a holiday', 'working overtime'], correct: 1, explanation: 'Promotion — повышение в должности.' },
  { q: 'Choose the word that means "the amount of work you have".', options: ['workload', 'workout', 'workshop', 'workforce'], correct: 0, explanation: 'Workload — объём/нагрузка работы.' },
];

const READING_B1: { passage: string; q: string; options: string[]; correct: number }[] = [
  { passage: 'Maria works as a nurse in a busy city hospital. She usually starts her shift at 7 a.m. and finishes at 3 p.m., but sometimes she has to work overtime.', q: 'What time does Maria usually finish work?', options: ['7 a.m.', '3 p.m.', '9 p.m.', 'She never finishes'], correct: 1 },
  { passage: 'Tom decided to change his career after ten years in banking. He felt his job was too stressful and wanted more free time for his family.', q: 'Why did Tom change his career?', options: ['He lost his job', 'He wanted a higher salary', 'His job was too stressful', 'He moved to another city'], correct: 2 },
  { passage: 'Many companies now offer flexible working hours. Employees can choose when to start and finish, as long as they complete their tasks.', q: 'What do employees need to do under flexible hours?', options: ['Work exactly 9 to 5', 'Complete their tasks', 'Ask permission every day', 'Work only in the morning'], correct: 1 },
  { passage: 'Anna set a goal to learn English in one year. She practised every day, even for just fifteen minutes, and slowly improved her skills.', q: 'How often did Anna practise English?', options: ['Once a week', 'Every day', 'Only on weekends', 'Once a month'], correct: 1 },
  { passage: 'The team missed the deadline because of a technical problem with their software. They explained the situation to their manager and asked for two more days.', q: 'Why did the team miss the deadline?', options: ['They forgot about it', 'A technical problem', 'They were on holiday', 'The manager cancelled it'], correct: 1 },
  { passage: 'Good communication skills are important in any career. Employers often look for people who can explain their ideas clearly and listen to others.', q: 'What do employers look for, according to the text?', options: ['People who work alone', 'People who can communicate clearly', 'People who never disagree', 'People with the most experience'], correct: 1 },
  { passage: 'David negotiated a better salary with his employer after receiving a job offer from another company.', q: 'What helped David negotiate a better salary?', options: ['A job offer from another company', 'A long holiday', 'A promotion', 'His manager\'s advice'], correct: 0 },
  { passage: 'Burnout happens when people work too hard for too long without enough rest. Experts recommend regular breaks and a healthy work-life balance.', q: 'What do experts recommend to avoid burnout?', options: ['Working harder', 'Regular breaks and balance', 'Changing jobs', 'Working overtime'], correct: 1 },
  { passage: 'Lena organised a small team event to celebrate finishing a big project. Everyone was happy to relax after weeks of hard work.', q: 'Why did Lena organise the event?', options: ['To find new colleagues', 'To celebrate finishing a project', 'To discuss a deadline', 'To ask for a promotion'], correct: 1 },
  { passage: 'A reliable colleague is someone who finishes tasks on time and keeps their promises. This builds trust within a team.', q: 'What does a reliable colleague do?', options: ['Finishes tasks on time', 'Works alone', 'Avoids responsibility', 'Changes jobs often'], correct: 0 },
];

const LISTENING_B1: { transcript: string; q: string; options: string[]; correct: number }[] = [
  { transcript: 'Hi, this is a reminder that the team meeting has been moved from 10 a.m. to 2 p.m. today. Please update your schedule.', q: 'What time is the meeting now?', options: ['10 a.m.', '2 p.m.', '12 p.m.', 'It was cancelled'], correct: 1 },
  { transcript: 'I\'ve been working on this project for three weeks now, and I think we can deliver it a few days before the deadline.', q: 'How does the speaker feel about the deadline?', options: ['Worried they will miss it', 'Confident they will finish early', 'Unsure', 'Already late'], correct: 1 },
  { transcript: 'Welcome to the office! Your desk is on the third floor, and your manager will introduce you to the team this afternoon.', q: 'When will the new employee meet the team?', options: ['This morning', 'This afternoon', 'Tomorrow', 'Next week'], correct: 1 },
  { transcript: 'I really need a day off. I\'ve been working overtime every day this week and I\'m exhausted.', q: 'How does the speaker feel?', options: ['Excited', 'Exhausted', 'Bored', 'Confident'], correct: 1 },
  { transcript: 'Could you send me the report by Friday? I need it before the client meeting on Monday.', q: 'When does the speaker need the report?', options: ['By Friday', 'By Monday', 'By Wednesday', 'Today'], correct: 0 },
  { transcript: 'She got the promotion because she always delivers her tasks on time and helps her colleagues.', q: 'Why did she get the promotion?', options: ['She works alone', 'She is reliable and helpful', 'She asked for it', 'She has worked there the longest'], correct: 1 },
  { transcript: 'Let\'s negotiate a new schedule — maybe you can start later and finish later, if that works for the team.', q: 'What is being discussed?', options: ['A salary increase', 'A new schedule', 'A holiday', 'A new office'], correct: 1 },
  { transcript: 'Our main priority this month is finishing the website redesign before the new product launch.', q: 'What is the main priority this month?', options: ['Hiring new staff', 'Finishing the website redesign', 'Taking a break', 'Changing offices'], correct: 1 },
  { transcript: 'I try to keep a good work-life balance by leaving the office on time and not checking emails in the evening.', q: 'How does the speaker keep a work-life balance?', options: ['Working overtime', 'Leaving on time and avoiding evening emails', 'Working from home always', 'Taking long holidays'], correct: 1 },
  { transcript: 'The manager said the team should focus on quality rather than speed for this particular project.', q: 'What should the team focus on?', options: ['Speed', 'Quality', 'Cost', 'Marketing'], correct: 1 },
];

const SPEAKING_B1: string[] = [
  'What does a typical work day look like for you?',
  'Describe a time when you had to meet a difficult deadline.',
  'What makes a good colleague, in your opinion?',
  'How do you keep a healthy balance between work and free time?',
  'Talk about a skill you would like to improve and why.',
  'Describe your ideal job.',
  'What is more important to you: salary or job satisfaction? Why?',
  'Talk about a time you had to solve a problem at work or school.',
  'How do you usually organise your daily tasks?',
  'What advice would you give to someone starting their first job?',
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('Очищаю прежние демо-данные…');
  await db.delete(questionBank).where(eq(questionBank.isDemo, true));
  await db.delete(vocabularyWords).where(eq(vocabularyWords.isDemo, true));
  await db.delete(courses).where(eq(courses.isDemo, true)); // модули/уроки/блоки/упражнения удалятся каскадом

  console.log('Создаю курс, модуль, уроки…');
  const [course] = await db.insert(courses).values({
    title: 'Work & Life — демо-курс (B1)',
    description: 'Демонстрационный курс для проверки конструктора уроков. Не настоящая учебная программа.',
    level: 'B1',
    audience: 'ADULTS',
    isDemo: true,
  }).returning();

  const [module1] = await db.insert(courseModules).values({
    courseId: course.id,
    title: 'Модуль 1: Работа и карьера',
    order: 0,
  }).returning();

  const [lesson1] = await db.insert(lessons).values({
    moduleId: module1.id,
    title: 'Work-Life Balance',
    description: 'Пример урока из лендинга — грамматика, лексика, чтение, говорение.',
    order: 0,
    estimatedMinutes: 25,
  }).returning();

  const introBlock = (await db.insert(lessonBlocks).values({
    lessonId: lesson1.id, type: 'INTRO', order: 0, title: 'Введение',
    content: { text: 'Сегодня поговорим о балансе между работой и личной жизнью: полезная лексика, грамматика Present Perfect Continuous и практика говорения.' },
  }).returning())[0];

  const vocabBlock = (await db.insert(lessonBlocks).values({
    lessonId: lesson1.id, type: 'VOCABULARY', order: 1, title: 'Новые слова',
    content: { words: ['sustainable', 'deadline', 'burnout', 'workload', 'flexible'] },
  }).returning())[0];

  const grammarBlock = (await db.insert(lessonBlocks).values({
    lessonId: lesson1.id, type: 'GRAMMAR', order: 2, title: 'Present Perfect Continuous',
    content: { explanation: 'Present Perfect Continuous используется для действий, начавшихся в прошлом и продолжающихся сейчас: I have been working here for three years.' },
  }).returning())[0];

  const readingBlock = (await db.insert(lessonBlocks).values({
    lessonId: lesson1.id, type: 'READING', order: 3, title: 'Интервью о рабочем дне',
    content: { text: READING_B1[1].passage },
  }).returning())[0];

  const exerciseBlock = (await db.insert(lessonBlocks).values({
    lessonId: lesson1.id, type: 'EXERCISE', order: 4, title: 'Упражнения',
  }).returning())[0];
  await db.insert(exercises).values([
    { lessonBlockId: exerciseBlock.id, type: 'MULTIPLE_CHOICE', order: 0, content: { question: GRAMMAR_B1[0].q, options: GRAMMAR_B1[0].options, correctIndex: GRAMMAR_B1[0].correct, explanation: GRAMMAR_B1[0].explanation } },
    { lessonBlockId: exerciseBlock.id, type: 'FILL_BLANK', order: 1, content: { text: 'She ___ (work) at this company for five years.', answers: ['has worked', 'has been working'] } },
  ]);

  const speakingBlock = (await db.insert(lessonBlocks).values({
    lessonId: lesson1.id, type: 'SPEAKING', order: 5, title: 'Говорение',
  }).returning())[0];
  await db.insert(exercises).values({
    lessonBlockId: speakingBlock.id, type: 'SPEAKING', order: 0,
    content: { prompt: 'What makes a person successful?', rubric: 'vocabulary, grammar, fluency, pronunciation — 1–5' },
  });

  const miniTestBlock = (await db.insert(lessonBlocks).values({
    lessonId: lesson1.id, type: 'MINI_TEST', order: 6, title: 'Мини-тест',
  }).returning())[0];
  await db.insert(exercises).values({
    lessonBlockId: miniTestBlock.id, type: 'MULTIPLE_CHOICE', order: 0,
    content: { question: VOCAB_MC_B1[2].q, options: VOCAB_MC_B1[2].options, correctIndex: VOCAB_MC_B1[2].correct, explanation: VOCAB_MC_B1[2].explanation },
  });

  await db.insert(lessonBlocks).values({
    lessonId: lesson1.id, type: 'HOMEWORK', order: 7, title: 'Домашнее задание',
    content: { text: 'Напишите 5 предложений о своём балансе между работой и личной жизнью, используя новые слова.' },
  });

  const [lesson2] = await db.insert(lessons).values({
    moduleId: module1.id,
    title: 'Job Interview Basics',
    description: 'Короткий второй демо-урок.',
    order: 1,
    estimatedMinutes: 20,
  }).returning();

  await db.insert(lessonBlocks).values({
    lessonId: lesson2.id, type: 'INTRO', order: 0, title: 'Введение',
    content: { text: 'Базовая лексика и вопросы для собеседования на английском.' },
  });
  const lesson2VocabBlock = (await db.insert(lessonBlocks).values({
    lessonId: lesson2.id, type: 'VOCABULARY', order: 1, title: 'Лексика',
    content: { words: ['employer', 'career', 'opportunity', 'confident', 'skill'] },
  }).returning())[0];
  const lesson2MiniTest = (await db.insert(lessonBlocks).values({
    lessonId: lesson2.id, type: 'MINI_TEST', order: 2, title: 'Мини-тест',
  }).returning())[0];
  await db.insert(exercises).values({
    lessonBlockId: lesson2MiniTest.id, type: 'MULTIPLE_CHOICE', order: 0,
    content: { question: VOCAB_MC_B1[4].q, options: VOCAB_MC_B1[4].options, correctIndex: VOCAB_MC_B1[4].correct, explanation: VOCAB_MC_B1[4].explanation },
  });
  void lesson2VocabBlock; void introBlock; void vocabBlock; void grammarBlock; void readingBlock;

  console.log('Заполняю словарь (30 слов)…');
  await db.insert(vocabularyWords).values(VOCAB_B1.map((w) => ({
    word: w.word,
    translationRu: w.ru,
    definition: w.def,
    level: 'B1',
    transcription: w.transcription,
    examples: [w.example],
    isDemo: true,
  })));

  console.log('Заполняю банк вопросов (50 штук, уровень B1)…');
  await db.insert(questionBank).values([
    ...GRAMMAR_B1.map((item, i) => ({
      skill: 'GRAMMAR' as const, level: 'B1', difficulty: (i % 5) + 1, type: 'MULTIPLE_CHOICE' as const,
      content: { question: item.q, options: item.options, correctIndex: item.correct, explanation: item.explanation }, isDemo: true,
    })),
    ...VOCAB_MC_B1.map((item, i) => ({
      skill: 'VOCABULARY' as const, level: 'B1', difficulty: (i % 5) + 1, type: 'MULTIPLE_CHOICE' as const,
      content: { question: item.q, options: item.options, correctIndex: item.correct, explanation: item.explanation }, isDemo: true,
    })),
    ...READING_B1.map((item, i) => ({
      skill: 'READING' as const, level: 'B1', difficulty: (i % 5) + 1, type: 'MULTIPLE_CHOICE' as const,
      content: { passage: item.passage, question: item.q, options: item.options, correctIndex: item.correct }, isDemo: true,
    })),
    ...LISTENING_B1.map((item, i) => ({
      skill: 'LISTENING' as const, level: 'B1', difficulty: (i % 5) + 1, type: 'MULTIPLE_CHOICE' as const,
      // audioUrl не заполнен — в демо-сиде нет учебного аудио, только транскрипт текстом
      content: { transcript: item.transcript, question: item.q, options: item.options, correctIndex: item.correct }, isDemo: true,
    })),
    ...SPEAKING_B1.map((prompt, i) => ({
      skill: 'SPEAKING' as const, level: 'B1', difficulty: (i % 5) + 1, type: 'SPEAKING' as const,
      content: { prompt, rubric: 'vocabulary, grammar, fluency, pronunciation — 1–5' }, isDemo: true,
    })),
  ]);

  await pool.end();
  console.log('Демо-контент готов: 1 курс, 1 модуль, 2 урока, 30 слов, 50 вопросов (B1).');
}

main().catch((e) => { console.error(e); process.exit(1); });
