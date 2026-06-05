const fs = require('fs');

const path = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// We need to inject imports for DND
const imports = `import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { getOrCreateSettings } from '../db';
`;

content = content.replace("import { motion } from 'framer-motion';", "import { motion } from 'framer-motion';\n" + imports);

// Add state for layout inside Dashboard function
const layoutState = `
  const [layout, setLayout] = useState(['target', 'chart', 'tasks', 'habits', 'mood']);
  const [isEditingLayout, setIsEditingLayout] = useState(false);

  useEffect(() => {
    getOrCreateSettings().then(s => {
      if (s.dashboardLayout) setLayout(s.dashboardLayout);
    });
  }, []);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const newLayout = Array.from(layout);
    const [reorderedItem] = newLayout.splice(result.source.index, 1);
    newLayout.splice(result.destination.index, 0, reorderedItem);
    setLayout(newLayout);
    // Save to settings
    const s = await getOrCreateSettings();
    await db.settings.update(s.id, { dashboardLayout: newLayout });
  };
`;

content = content.replace("const [savingMood, setSavingMood] = useState(false);", "const [savingMood, setSavingMood] = useState(false);\n" + layoutState);

// Now, we need to extract the JSX chunks.
// Since extracting with regex is fragile, I will replace the main grid return JSX with the DragDropContext and use the existing code by carefully injecting.

// Actually, writing a regex to match the exact chunks is feasible because the chunks have distinct comments.
// Target: {/* ── Bento Grid ── */} to {/* REAL 7-Day Chart */}
// Chart: {/* REAL 7-Day Chart */} to {/* ── Today's Tasks ── */}
// Tasks: {/* Due Tasks */} to {/* Habit Checklist */}
// Habits: {/* Habit Checklist */} to {/* ── Mood Check-In ── */}
// Mood: {/* ── Mood Check-In ── */} to </motion.div> (end of main div)

let targetWidget = content.substring(content.indexOf('<TiltCard className="lg:col-span-1 h-full">'), content.indexOf('{/* REAL 7-Day Chart */}'));
let chartWidget = content.substring(content.indexOf('<Scroll3DReveal delay={0.2} className="lg:col-span-2">'), content.indexOf('</div>\n\n      {/* ── Today\'s Tasks ── */}'));
let tasksWidget = content.substring(content.indexOf('<!-- Tasks Widget -->') !== -1 ? content.indexOf('<!-- Tasks Widget -->') : content.indexOf('<TiltCard className="w-full h-full">'), content.indexOf('{/* Habit Checklist */}'));
let habitsWidget = content.substring(content.indexOf('{/* Habit Checklist */}'), content.indexOf('</div>\n\n      {/* ── Mood Check-In ── */}'));
let moodWidget = content.substring(content.indexOf('{/* ── Mood Check-In ── */}'), content.lastIndexOf('</motion.div>'));

// Let's create a RenderWidget function
const renderWidgetFunc = `
  const renderWidget = (id: string, index: number) => {
    let contentNode = null;
    let colSpanClass = 'col-span-1';
    
    switch (id) {
      case 'target':
        colSpanClass = 'lg:col-span-1';
        contentNode = (
          <TiltCard className="h-full">
            <SpotlightCard className="h-full rounded-[2.5rem] p-6 sm:p-10 relative">
              {/* TARGET WIDGET INJECT */}
            </SpotlightCard>
          </TiltCard>
        );
        break;
      case 'chart':
        colSpanClass = 'lg:col-span-2';
        contentNode = (
          <Scroll3DReveal delay={0.2} className="h-full">
            <TiltCard className="h-full">
              <SpotlightCard className="h-full rounded-[2.5rem] p-6 sm:p-10">
                 {/* CHART WIDGET INJECT */}
              </SpotlightCard>
            </TiltCard>
          </Scroll3DReveal>
        );
        break;
      case 'tasks':
        colSpanClass = 'xl:col-span-1';
        contentNode = (
          {/* TASKS WIDGET INJECT */}
        );
        break;
      case 'habits':
        colSpanClass = 'xl:col-span-1';
        contentNode = (
          {/* HABITS WIDGET INJECT */}
        );
        break;
      case 'mood':
        colSpanClass = 'lg:col-span-2';
        contentNode = (
          {/* MOOD WIDGET INJECT */}
        );
        break;
    }

    return (
      <Draggable key={id} draggableId={id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={\`\${colSpanClass} \${snapshot.isDragging ? 'z-50' : 'z-10'}\`}
            style={provided.draggableProps.style}
          >
            {isEditingLayout && (
              <div 
                {...provided.dragHandleProps}
                className="absolute top-2 right-2 z-50 bg-white/10 backdrop-blur border border-white/20 p-2 rounded-xl cursor-grab active:cursor-grabbing text-white"
              >
                DRAG ME
              </div>
            )}
            <div className={\`h-full transition-transform \${isEditingLayout ? 'scale-[0.98] ring-2 ring-brand-500 rounded-[2.5rem]' : ''}\`}>
              {contentNode}
            </div>
          </div>
        )}
      </Draggable>
    );
  };
`;

// It is too hard to securely match and inject 800 lines via JS substrings if the Dashboard structure slightly differs.
// Let's use a simpler approach: Add an Edit Layout button at the top.
console.log('Script written');
