const fs = require('fs');

const path = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// The dashboard has this structure:
/*
  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <FloatingOrbs />
      {HEADER CHUNK}
      {QUOTE CHUNK}
      {WARNING CHUNK}
      {AICOACH CHUNK}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 pb-20">
        {TARGET CHUNK}
        {CHART CHUNK}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        {TASKS CHUNK}
        {HABITS CHUNK}
      </div>
      {MOOD CHUNK}
      <EditLayoutModal ... />
    </motion.div>
  )
*/

// Let's replace the entire return statement
const returnIndex = content.indexOf('return (');

const headerStart = content.indexOf('{/* ── Massive Awwwards Header ── */}');
const quoteStart = content.indexOf('{/* ── Daily Quote ── */}');
const warningStart = content.indexOf('{/* ── Streak At-Risk Warning ── */}');
const coachStart = content.indexOf('{/* ── AI Coach ── */}');
const bentoStart = content.indexOf('{/* ── Bento Grid ── */}');
const targetStart = content.indexOf('<TiltCard className="lg:col-span-1 h-full">');
const chartStart = content.indexOf('{/* REAL 7-Day Chart */}');
const tasksGridStart = content.indexOf('{/* ── Today\'s Tasks ── */}');
const tasksStart = content.indexOf('{/* Due Tasks */}');
const habitsStart = content.indexOf('{/* Habit Checklist */}');
const moodStart = content.indexOf('{/* ── Daily Mood Check-in ── */}');
const endModalStart = content.indexOf('<EditLayoutModal');

const headerChunk = content.slice(headerStart, quoteStart);
const quoteChunk = content.slice(quoteStart, warningStart);
const warningChunk = content.slice(warningStart, coachStart);
const coachChunk = content.slice(coachStart, bentoStart);

// We need to extract the inner parts of the grids
const targetChunk = content.slice(targetStart, chartStart);
const chartChunk = content.slice(chartStart, tasksGridStart - 16);

// Find the end of tasks and habits
const tasksChunk = content.slice(tasksStart, habitsStart);
const habitsChunk = content.slice(habitsStart, moodStart - 14);

const moodChunk = content.slice(moodStart, endModalStart);
const modalChunk = content.slice(endModalStart);

// Now construct the dynamic return block
const newReturn = `
  const renderWidget = (id: string) => {
    switch(id) {
      case 'header': return (
        <div className="w-full flex flex-col gap-6" key="header">
          ${headerChunk.trim()}
          ${quoteChunk.trim()}
          ${warningChunk.trim()}
          ${coachChunk.trim()}
        </div>
      );
      case 'target': return (
        <div className="w-full lg:col-span-1" key="target">
          ${targetChunk.trim()}
        </div>
      );
      case 'chart': return (
        <div className="w-full lg:col-span-2" key="chart">
          ${chartChunk.trim()}
        </div>
      );
      case 'tasks': return (
        <div className="w-full xl:col-span-1" key="tasks">
          ${tasksChunk.trim()}
        </div>
      );
      case 'habits': return (
        <div className="w-full xl:col-span-1" key="habits">
          ${habitsChunk.trim()}
        </div>
      );
      case 'mood': return (
        <div className="w-full lg:col-span-3" key="mood">
          ${moodChunk.trim()}
        </div>
      );
      default: return null;
    }
  };

  return (
    <motion.div className="flex flex-col gap-6" variants={container} initial="hidden" animate="show">
      <FloatingOrbs />
      
      {/* Grid container that reflows automatically based on layout order */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-2 gap-6 sm:gap-8 pb-20 auto-rows-min">
        {layout.map(widget => renderWidget(widget))}
      </div>

      <EditLayoutModal 
        isOpen={isLayoutModalOpen} 
        onClose={() => setIsLayoutModalOpen(false)} 
        currentLayout={layout}
        onLayoutChange={setLayout}
      />
    </motion.div>
  );
`;

const finalContent = content.slice(0, returnIndex) + newReturn + '\n}\n';

fs.writeFileSync('src/pages/Dashboard.tsx', finalContent);
console.log('Dashboard refactored successfully.');
