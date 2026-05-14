import React from 'react';
import * as Lucide from 'lucide-react';

const ScalesIcon = ({ size = 24, className }: any) => (
  <img src="/Scales.png" alt="Scales" style={{ width: size, height: size, objectFit: 'contain' }} className={className} />
);

// Explicitly define which icons we use for the picker
const ICON_COMPONENTS: Record<string, any> = {
  Scales: ScalesIcon,
  Dumbbell: Lucide.Dumbbell,
  BookOpen: Lucide.BookOpen,
  Zap: Lucide.Zap,
  Droplets: Lucide.Droplets,
  Wind: Lucide.Wind,
  Target: Lucide.Target,
  Pencil: Lucide.Pencil,
  Moon: Lucide.Moon,
  Apple: Lucide.Apple,
  Brain: Lucide.Brain,
  Music: Lucide.Music,
  Leaf: Lucide.Leaf,
  Flame: Lucide.Flame,
  Coffee: Lucide.Coffee,
  CheckCircle: Lucide.CheckCircle,
  Activity: Lucide.Activity,
  Stethoscope: Lucide.Stethoscope,
  Bike: Lucide.Bike,
  DollarSign: Lucide.DollarSign,
  Hammer: Lucide.Hammer,
  HelpCircle: Lucide.HelpCircle
};

export const HABIT_ICONS = [
  { name: 'Scales', icon: ScalesIcon },
  { name: 'Dumbbell', icon: Lucide.Dumbbell || Lucide.HelpCircle },
  { name: 'BookOpen', icon: Lucide.BookOpen || Lucide.HelpCircle },
  { name: 'Zap', icon: Lucide.Zap || Lucide.HelpCircle },
  { name: 'Droplets', icon: Lucide.Droplets || Lucide.HelpCircle },
  { name: 'Wind', icon: Lucide.Wind || Lucide.HelpCircle },
  { name: 'Target', icon: Lucide.Target || Lucide.HelpCircle },
  { name: 'Pencil', icon: Lucide.Pencil || Lucide.HelpCircle },
  { name: 'Moon', icon: Lucide.Moon || Lucide.HelpCircle },
  { name: 'Apple', icon: Lucide.Apple || Lucide.HelpCircle },
  { name: 'Brain', icon: Lucide.Brain || Lucide.HelpCircle },
  { name: 'Music', icon: Lucide.Music || Lucide.HelpCircle },
  { name: 'Leaf', icon: Lucide.Leaf || Lucide.HelpCircle },
  { name: 'Flame', icon: Lucide.Flame || Lucide.HelpCircle },
  { name: 'Coffee', icon: Lucide.Coffee || Lucide.HelpCircle },
  { name: 'CheckCircle', icon: Lucide.CheckCircle || Lucide.HelpCircle },
  { name: 'Activity', icon: Lucide.Activity || Lucide.HelpCircle },
  { name: 'Stethoscope', icon: Lucide.Stethoscope || Lucide.HelpCircle },
  { name: 'Bike', icon: Lucide.Bike || Lucide.HelpCircle },
  { name: 'DollarSign', icon: Lucide.DollarSign || Lucide.HelpCircle },
  { name: 'Hammer', icon: Lucide.Hammer || Lucide.HelpCircle },
];

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export function IconRenderer({ name, className, size = 18, color }: IconRendererProps) {
  if (!name) return <Lucide.HelpCircle size={size} className={className} style={{ color }} />;
  
  // Emoji check (old data)
  if (name.length <= 2) {
    return <span className={className} style={{ fontSize: size, color }}>{name}</span>;
  }

  // Lookup in our safe map
  const IconComponent = ICON_COMPONENTS[name] || Lucide.HelpCircle;

  return <IconComponent size={size} className={className} style={{ color }} />;
}
