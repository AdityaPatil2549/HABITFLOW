import { useState, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import { Download } from 'lucide-react';
import { WeeklyReportTemplate } from './WeeklyReportTemplate';
import { useToast } from '../common/Toast';

export function ExportReportButton() {
  const templateRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  const handleExport = async () => {
    if (!templateRef.current) return;
    try {
      setIsExporting(true);
      
      // html-to-image needs the element to be visible, so we briefly show it, render, then hide
      const el = templateRef.current;
      el.style.display = 'block';
      
      const dataUrl = await htmlToImage.toPng(el, { quality: 1.0, pixelRatio: 2 });
      
      el.style.display = 'none';

      const link = document.createElement('a');
      link.download = `HabitFlow_Weekly_Report_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Weekly report exported successfully!');
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 text-white font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
      >
        <Download size={16} />
        {isExporting ? 'Generating...' : 'Export Weekly Report'}
      </button>

      {/* Hidden template container */}
      <div className="overflow-hidden h-0 w-0 absolute pointer-events-none opacity-0">
        <div ref={templateRef} style={{ display: 'none' }}>
          <WeeklyReportTemplate />
        </div>
      </div>
    </>
  );
}
