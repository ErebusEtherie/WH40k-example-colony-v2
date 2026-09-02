import React, { useRef } from "react";
import { Download, Upload, Terminal } from "lucide-react";

interface FooterProps {
  colonyCount?: number;
  activeColonyName?: string;
  onResetSeedData?: () => void | Promise<void>;
  onExportData?: () => void;
  onImportData?: (file: File) => void;
  onOpenTheme?: () => void;
  onLogout?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  colonyCount = 1,
  activeColonyName = "Dargonus Prime",
  onExportData,
  onImportData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportData) {
      onImportData(file);
    }
  };

  return (
    <footer className="mt-12 border-t border-[#1e293b] bg-[#070a12] py-4 px-4 sm:px-6 lg:px-8 text-xs font-mono-slate text-[#64748b]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left info */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-[#94a3b8]">
            <Terminal className="w-4 h-4 text-[#f59e0b]" />
            <span className="font-gothic font-bold uppercase tracking-wider text-[#cbd5e1]">
              ADEPTUS MECHANICUS COGITATION ENGINE
            </span>
          </div>
          <span className="text-[#334155]">•</span>
          <span className="text-[#64748b]">
            Colonies Monitored: <strong className="text-[#38bdf8]">{colonyCount}</strong>
          </span>
          <span className="text-[#334155]">•</span>
          <span className="text-[#64748b]">
            Active Telemetry: <strong className="text-[#fef08a]">{activeColonyName}</strong>
          </span>
        </div>

        {/* Right actions */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {onExportData && (
            <button
              id="footer-export-data-btn"
              onClick={onExportData}
              className="flex items-center space-x-1 text-[#38bdf8] hover:text-[#7dd3fc] transition"
              title="Export complete colony database state to JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Cogitator Data</span>
            </button>
          )}

          {onImportData && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              <button
                id="footer-import-data-btn"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1 text-[#a855f7] hover:text-[#c084fc] transition"
                title="Restore colony state from backup file"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore Backup</span>
              </button>
            </>
          )}
        </div>
      </div>
    </footer>
  );
};
