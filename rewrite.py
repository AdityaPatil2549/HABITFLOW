import re

with open("src/pages/HabitsPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add Cloud import if it doesn't exist
if "Cloud," not in content and "Cloud " not in content:
    content = content.replace("CheckCircle2,", "CheckCircle2,\n  Cloud,")

# Add DynamicIcon import if it doesn't exist
if "DynamicIcon" not in content:
    content = content.replace("import { MagneticButton } from '../components/ui/MagneticButton';", "import { MagneticButton } from '../components/ui/MagneticButton';\nimport { DynamicIcon } from '../components/ui/DynamicIcon';")

habit_form_start = content.find("function HabitForm({")
habit_form_end = content.find("// ─── Bottom Sheet wrapper", habit_form_start)

if habit_form_start == -1 or habit_form_end == -1:
    print("Could not find HabitForm")
    exit(1)

new_habit_form = """function HabitForm({
  onClose,
  initialHabit,
}: {
  onClose: (reason?: string) => void;
  initialHabit?: HabitWithStreak;
}) {
  const { addHabit, updateHabit } = useHabitStore();
  const [name, setName]         = useState(initialHabit?.name ?? '');
  const [icon, setIcon]         = useState(initialHabit?.icon ?? '🎯');
  const [color, setColor]       = useState(initialHabit?.color ?? COLORS[0]);
  const [category, setCategory] = useState(initialHabit?.category ?? 'Health');
  const [type, setType]         = useState<HabitType>(initialHabit?.type ?? 'boolean');
  const [freq, setFreq]         = useState<HabitFrequency>(initialHabit?.frequency ?? 'daily');
  const [freqDays, setFreqDays] = useState<number[]>(initialHabit?.frequencyDays ?? [1, 2, 3, 4, 5]);
  const [target, setTarget]     = useState(initialHabit?.targetValue ?? 1);
  const [grace, setGrace]       = useState(initialHabit?.graceDayEnabled ?? false);
  const [reminderTime, setReminderTime] = useState(initialHabit?.reminderTime ?? '');
  const [healthSyncEnabled, setHealthSyncEnabled] = useState(false);
  const [healthMetric, setHealthMetric] = useState<string>('steps');
  const [error, setError]       = useState<string | null>(null);

  const toggleDay = (d: number) =>
    setFreqDays(ds => (ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d]));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (freq === 'weekly' && freqDays.length === 0) {
      setError('Please select at least one day for weekly habits.');
      return;
    }
    const parsed = habitSchema.safeParse({
      name: name.trim(),
      icon,
      color,
      category,
      type,
      frequency: freq,
      frequencyDays: freq === 'weekly' ? freqDays : undefined,
      targetValue: target,
      startDate: initialHabit?.startDate ?? format(new Date(), 'yyyy-MM-dd'),
      graceDayEnabled: grace,
      archived: initialHabit?.archived ?? false,
      reminderTime: reminderTime || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (initialHabit) await updateHabit(initialHabit.id, parsed.data);
    else await addHabit(parsed.data);
    onClose('created');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{error}</p>
      )}

      {/* Choose Identity (Icon Grid) */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">
          Choose Identity
        </label>
        <div className="grid grid-cols-5 gap-2 bg-slate-950/30 rounded-2xl p-3 border border-white/5 shadow-inner">
          {HABIT_ICONS.map(item => {
            const isActive = icon === item.name;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => setIcon(item.name)}
                className={`relative h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="habitFormIconBg"
                    className="absolute inset-0 rounded-xl shadow-lg"
                    style={{ background: color, boxShadow: `0 4px 15px ${color}60` }}
                  />
                )}
                <item.icon size={20} className="relative z-10" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Color Theme */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">
            Color Theme
          </label>
          <div className="flex gap-2.5 flex-wrap bg-slate-950/20 p-3 rounded-2xl border border-white/5">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all border-2 ${color === c ? 'scale-110 border-white/60' : 'border-transparent hover:scale-105'}`}
                style={{ background: c, boxShadow: color === c ? `0 0 12px ${c}80` : 'none' }}
              />
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => {
              const isActive = category === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setCategory(c.name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${
                    isActive
                      ? 'shadow-inner'
                      : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={isActive ? { background: `${color}25`, borderColor: color, color: '#fff', boxShadow: `inset 0 0 10px ${color}10` } : {}}
                >
                  <DynamicIcon tiltIntensity={25} size={18} interactive={true}>
                    <span className="text-sm block">{c.icon}</span>
                  </DynamicIcon>
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-6 bg-slate-950/20 p-4 rounded-3xl border border-white/5 shadow-inner">
        {/* Habit Name */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">
            Habit Name
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-transform group-focus-within:scale-110">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-inner"
                style={{ background: `${color}20`, color: color, border: `1px solid ${color}40` }}
              >
                <IconRenderer name={icon} size={18} />
              </div>
            </div>
            <input
              className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-16 pr-4 py-4 text-white placeholder-slate-600 text-base font-bold outline-none focus:border-brand-500/50 focus:bg-slate-950/60 transition-all shadow-inner"
              placeholder="e.g. Read 20 pages"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">
              Type
            </label>
            <select
              className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-semibold outline-none focus:border-brand-500/50 transition-all appearance-none cursor-pointer"
              value={type}
              onChange={e => setType(e.target.value as HabitType)}
            >
              <option value="boolean" className="bg-slate-900">✅ Yes / No</option>
              <option value="count" className="bg-slate-900">🔢 Count (reps…)</option>
              <option value="duration" className="bg-slate-900">⏱ Duration</option>
              <option value="rating" className="bg-slate-900">⭐ Rating (1-5)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">
              Frequency
            </label>
            <select
              className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-semibold outline-none focus:border-brand-500/50 transition-all appearance-none cursor-pointer"
              value={freq}
              onChange={e => setFreq(e.target.value as HabitFrequency)}
            >
              <option value="daily" className="bg-slate-900">📅 Every day</option>
              <option value="weekly" className="bg-slate-900">📆 Specific days</option>
            </select>
          </div>
        </div>

        <AnimatePresence>
          {freq === 'weekly' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">
                Active Days
              </label>
              <div className="flex gap-2">
                {DAYS.map((d, i) => {
                  const isActive = freqDays.includes(i);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${
                        isActive ? 'text-white' : 'border-white/5 text-slate-500 hover:border-white/20'
                      }`}
                      style={isActive ? { borderColor: color, background: `${color}30` } : {}}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {type !== 'boolean' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block mt-2">
                Daily Target {type === 'duration' ? '(minutes)' : type === 'rating' ? '(out of 5)' : '(count)'}
              </label>
              <input
                type="number"
                min={1}
                max={type === 'rating' ? 5 : undefined}
                value={target}
                onChange={e => setTarget(Number(e.target.value))}
                className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-lg font-bold outline-none focus:border-brand-500/50 transition-all shadow-inner"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-2">
          <label className="flex items-center gap-3 cursor-pointer py-1 group">
            <div
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${grace ? 'border-brand-500 bg-brand-500' : 'border-white/10 bg-slate-900 group-hover:border-white/30'}`}
            >
              {grace && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-200">Enable Grace Day</span>
              <span className="text-[10px] text-slate-500 font-medium">Allow 1 free miss per week without breaking streak</span>
            </div>
          </label>
        </div>

        {/* Reminder Time */}
        <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
                <Bell size={16} className="text-brand-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Daily Reminder</span>
                <span className="text-[10px] text-slate-400">Get notified when it's time</span>
              </div>
            </div>
            <div className="relative">
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none cursor-pointer focus:border-brand-500/50 [color-scheme:dark]"
              />
              {reminderTime && (
                <button
                  type="button"
                  onClick={() => setReminderTime('')}
                  className="absolute -right-2 -top-2 w-5 h-5 bg-slate-800 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => onClose()}
          className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-4 rounded-2xl font-bold text-sm text-white transition-all active:scale-95 shadow-xl button-3d"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            boxShadow: `0 10px 25px -5px ${color}60`,
            borderColor: `${color}80`
          }}
        >
          {initialHabit ? '✓ Save Changes' : '🔥 Create Habit'}
        </button>
      </div>
    </form>
  );
}
"""

content = content[:habit_form_start] + new_habit_form + content[habit_form_end:]

with open("src/pages/HabitsPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully replaced HabitForm")
