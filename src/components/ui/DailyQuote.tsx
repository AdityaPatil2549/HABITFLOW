import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const QUOTES = [
  {
    text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Aristotle',
  },
  {
    text: 'Success is the sum of small efforts, repeated day in and day out.',
    author: 'Robert Collier',
  },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  {
    text: 'Motivation is what gets you started. Habit is what keeps you going.',
    author: 'Jim Ryun',
  },
  { text: 'Small daily improvements over time lead to stunning results.', author: 'Robin Sharma' },
  {
    text: "You'll never change your life until you change something you do daily.",
    author: 'John C. Maxwell',
  },
  {
    text: 'Discipline is choosing between what you want now and what you want most.',
    author: 'Abraham Lincoln',
  },
  { text: "It's not about having time. It's about making time.", author: 'Unknown' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
  { text: 'A year from now, you may wish you had started today.', author: 'Karen Lamb' },
  { text: 'First forget inspiration. Habit is more dependable.', author: 'Octavia Butler' },
  { text: 'Champions keep playing until they get it right.', author: 'Billie Jean King' },
  { text: 'The harder you work, the luckier you get.', author: 'Gary Player' },
  { text: 'Consistency is what transforms average into excellence.', author: 'Unknown' },
  { text: 'Your future is created by what you do today, not tomorrow.', author: 'Robert Kiyosaki' },
  { text: 'Make each day your masterpiece.', author: 'John Wooden' },
  {
    text: 'Progress, not perfection, is what we should be asking of ourselves.',
    author: 'Julia Cameron',
  },
  {
    text: 'The best time to plant a tree was 20 years ago. The second best time is now.',
    author: 'Chinese Proverb',
  },
  { text: "Believe you can and you're halfway there.", author: 'Theodore Roosevelt' },
  { text: 'Drop by drop is the water pot filled.', author: 'Buddha' },
  {
    text: 'What you do every day matters more than what you do once in a while.',
    author: 'Gretchen Rubin',
  },
  {
    text: "Success isn't always about greatness. It's about consistency.",
    author: 'Dwayne Johnson',
  },
  { text: 'The habit of persistence is the habit of victory.', author: 'Herbert Kaufman' },
  {
    text: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    author: 'James Clear',
  },
  {
    text: 'Every action you take is a vote for the person you wish to become.',
    author: 'James Clear',
  },
  {
    text: 'One percent better each day compounds to being 37 times better in a year.',
    author: 'James Clear',
  },
  { text: 'Habits are the compound interest of self-improvement.', author: 'James Clear' },
  {
    text: 'I fear not the man who has practiced 10,000 kicks once, but the man who has practiced one kick 10,000 times.',
    author: 'Bruce Lee',
  },
  {
    text: "Be patient with yourself. Self-growth is tender; it's holy ground.",
    author: 'Stephen Covey',
  },
  {
    text: 'It does not matter how slowly you go, as long as you do not stop.',
    author: 'Confucius',
  },
  { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
  {
    text: 'Perseverance is not a long race; it is many short races one after the other.',
    author: 'Walter Elliot',
  },
  {
    text: "Courage doesn't always roar. Sometimes it's the quiet voice at the end of the day saying, 'I will try again tomorrow.'",
    author: 'Mary Anne Radmacher',
  },
  {
    text: 'The difference between ordinary and extraordinary is that little extra.',
    author: 'Jimmy Johnson',
  },
  {
    text: 'We become what we want to be by consistently being what we want to become.',
    author: 'Richard G. Scott',
  },
  { text: 'Routine, in an intelligent man, is a sign of ambition.', author: 'W. H. Auden' },
  {
    text: 'Great things are not done by impulse, but by a series of small things brought together.',
    author: 'Vincent Van Gogh',
  },
  { text: 'An ounce of practice is worth more than tons of preaching.', author: 'Mahatma Gandhi' },
  { text: "You can't build a reputation on what you're going to do.", author: 'Henry Ford' },
  {
    text: 'Do something today that your future self will thank you for.',
    author: 'Sean Patrick Flanery',
  },
  { text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
  {
    text: 'The chains of habit are too weak to be felt until they are too strong to be broken.',
    author: 'Samuel Johnson',
  },
  { text: 'Focus on the process, not the event.', author: 'Unknown' },
  {
    text: 'The man who moves a mountain begins by carrying away small stones.',
    author: 'Confucius',
  },
  { text: "Inch by inch, anything's a cinch.", author: 'Unknown' },
  { text: "Don't count the days; make the days count.", author: 'Muhammad Ali' },
  {
    text: 'A river cuts through rock not because of its power, but because of its persistence.',
    author: 'Jim Watkins',
  },
  { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
  {
    text: 'Success is the product of daily habits — not once-in-a-lifetime transformations.',
    author: 'James Clear',
  },
];

export function DailyQuote() {
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    setTimeout(() => setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]), 0);
  }, []);

  return (
    <motion.div
      className="glass-card rounded-2xl p-5 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      {/* Decorative quote mark */}
      <div className="absolute top-3 right-4 opacity-[0.06]">
        <Quote size={64} />
      </div>

      <div className="flex items-start gap-3 relative z-10">
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Quote size={14} className="text-indigo-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-slate-300 leading-relaxed italic">"{quote.text}"</p>
          <p className="text-xs text-slate-500 mt-2 font-medium">— {quote.author}</p>
        </div>
      </div>
    </motion.div>
  );
}
