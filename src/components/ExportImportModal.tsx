import React, { useState } from "react";
import { Colony } from "../types/colony";
import { Download, Upload, Copy, Check, FileText } from "lucide-react";

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedColony: Colony | null;
  onImportColony: (jsonData: any) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  selectedColony,
  onImportColony,
}) => {
  const [activeMode, setActiveMode] = useState<"export" | "import">("export");
  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetchExport = async () => {
    if (!selectedColony) return;
    try {
      const res = await fetch(`/api/v1/colonies/${selectedColony.id}/export`);
      const data = await res.json();
      setExportText(JSON.stringify(data, null, 2));
    } catch {
      setExportText("// Error fetching export data slate");
    }
  };

  if (activeMode === "export" && !exportText && selectedColony) {
    handleFetchExport();
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedColony?.name.replace(/\s+/g, "_")}_dataslate.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleProcessImport = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importText);
      if (!parsed.colony && !parsed.name) {
        throw new Error("Invalid format: missing colony data object");
      }
      onImportColony(parsed.colony ? parsed : { colony: parsed });
      onClose();
    } catch (err: any) {
      setImportError(err.message || "Failed to parse JSON data-slate");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportText(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121520] border border-[#b87333]/50 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 gothic-corner">
        <div className="flex items-center justify-between border-b border-[#1e2538] pb-3">
          <div className="flex items-center space-x-2 text-[#fdba74]">
            <FileText className="w-5 h-5" />
            <h3 className="text-xl font-bold font-gothic text-[#f8fafc]">
              DATA-SLATE IMPORT / EXPORT COGITATOR
            </h3>
          </div>

          <div className="flex space-x-1 bg-[#0b0d13] p-1 border border-[#2a344a] rounded-lg">
            <button
              onClick={() => setActiveMode("export")}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${
                activeMode === "export"
                  ? "bg-[#b87333] text-[#0d0f17]"
                  : "text-[#94a3b8] hover:text-[#f8fafc]"
              }`}
            >
              Export
            </button>
            <button
              onClick={() => setActiveMode("import")}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${
                activeMode === "import"
                  ? "bg-[#b87333] text-[#0d0f17]"
                  : "text-[#94a3b8] hover:text-[#f8fafc]"
              }`}
            >
              Import
            </button>
          </div>
        </div>

        {activeMode === "export" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94a3b8] font-mono-slate">
                Colony Export Manifest: {selectedColony?.name}
              </span>

              <div className="flex space-x-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-[#1e2538] hover:bg-[#2a344a] text-xs text-[#cbd5e1] rounded transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#86efac]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-[#b87333] hover:bg-[#9a5b22] text-xs font-semibold text-[#0d0f17] rounded transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Slate</span>
                </button>
              </div>
            </div>

            <pre className="bg-[#0b0d13] border border-[#2a344a] rounded p-3 text-xs font-mono-slate text-[#38bdf8] overflow-auto max-h-72">
              {exportText || "Loading data slate..."}
            </pre>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94a3b8] font-mono-slate">
                Paste JSON data-slate or upload file
              </span>

              <label className="flex items-center space-x-1 px-2.5 py-1 bg-[#1e2538] hover:bg-[#2a344a] text-xs text-[#cbd5e1] rounded cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <textarea
              rows={8}
              placeholder="Paste serialized colony JSON payload here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full bg-[#0b0d13] border border-[#2a344a] rounded p-3 text-xs font-mono-slate text-[#86efac]"
            />

            {importError && (
              <div className="text-xs text-[#fca5a5] bg-[#7f1d1d]/30 border border-[#dc2626]/40 p-2 rounded">
                {importError}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-3 border-t border-[#1e2538]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#1e2538] hover:bg-[#2a344a] text-xs font-semibold text-[#cbd5e1] rounded"
          >
            Close
          </button>
          {activeMode === "import" && (
            <button
              type="button"
              onClick={handleProcessImport}
              className="px-4 py-2 bg-[#b87333] hover:bg-[#9a5b22] text-xs font-semibold text-[#0d0f17] uppercase tracking-wider rounded"
            >
              Sanction & Load Colony
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
