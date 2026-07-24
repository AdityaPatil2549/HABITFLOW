import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { 
  Home, CheckSquare, ListTodo, BarChart2, ShoppingBag, Settings, 
  Search
} from 'lucide-react';


export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();



  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    command();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6" onClick={() => setOpen(false)}>
      <div 
        className="w-full max-w-xl bg-slate-900/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Global Command Menu" className="flex flex-col w-full h-full text-white">
          <div className="flex items-center px-4 py-3 border-b border-white/10">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <Command.Input 
              placeholder="What do you need?" 
              className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-slate-500 font-medium" 
              autoFocus
            />
            <div className="text-xs font-medium text-slate-500 px-2 py-1 bg-white/5 rounded-md border border-white/10">ESC</div>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <Command.Empty className="py-6 text-center text-sm text-slate-400">No results found.</Command.Empty>

            <Command.Group heading={<div className="px-2 py-1 text-xs font-semibold text-slate-500 mb-1">Navigation</div>}>
              <Command.Item onSelect={() => runCommand(() => navigate('/'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/10 aria-selected:bg-white/10 transition-colors mb-1">
                <Home size={18} className="text-brand-400" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate('/habits'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/10 aria-selected:bg-white/10 transition-colors mb-1">
                <CheckSquare size={18} className="text-emerald-400" />
                <span>Habits</span>
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate('/tasks'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/10 aria-selected:bg-white/10 transition-colors mb-1">
                <ListTodo size={18} className="text-indigo-400" />
                <span>Tasks</span>
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate('/analytics'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/10 aria-selected:bg-white/10 transition-colors mb-1">
                <BarChart2 size={18} className="text-amber-400" />
                <span>Analytics</span>
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate('/shop'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/10 aria-selected:bg-white/10 transition-colors mb-1">
                <ShoppingBag size={18} className="text-rose-400" />
                <span>Rewards Shop</span>
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate('/settings'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/10 aria-selected:bg-white/10 transition-colors mb-1">
                <Settings size={18} className="text-slate-400" />
                <span>Settings</span>
              </Command.Item>
            </Command.Group>



          </Command.List>
        </Command>
      </div>
    </div>
  );
}
