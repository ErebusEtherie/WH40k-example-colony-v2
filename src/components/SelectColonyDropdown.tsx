import React, { useState, useRef, useEffect } from "react";
import { Colony } from "../types/colony";
import { Landmark, ChevronDown, Check, Plus } from "lucide-react";

interface SelectColonyDropdownProps {
  colonies: Colony[];
  selectedColony: Colony | null;
  onSelectColony: (colony: Colony) => void;
  onOpenNewColony: () => void;
}

export const SelectColonyDropdown: React.FC<SelectColonyDropdownProps> = ({
  colonies,
  selectedColony,
  onSelectColony,
  onOpenNewColony,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        id="colony-select-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-[#0f1422] hover:bg-[#161d30] border border-[#f59e0b]/50 rounded text-xs font-mono-slate text-[#f8fafc] transition shadow-md"
      >
        <Landmark className="w-4 h-4 text-[#f59e0b]" />
        <span className="font-bold tracking-wider uppercase text-[#fef08a]">
          {selectedColony ? selectedColony.name : "Select Colony"}
        </span>
        {selectedColony && (
          <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider hidden sm:inline">
            [{selectedColony.colony_type.replace(/_/g, " ")}]
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8]" />
      </button>

      {isOpen && (
        <div
          id="colony-selection-menu"
          className="absolute left-0 mt-2 w-84 bg-[#0c101a] border border-[#f59e0b]/60 rounded shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="px-3 py-2 bg-[#121828] border-b border-[#222e46] flex items-center justify-between">
            <span className="font-gothic font-bold text-xs tracking-wider text-[#f59e0b] uppercase">
              Select Colony Ledger ({colonies.length} Total)
            </span>
          </div>

          <div className="py-1 max-h-72 overflow-y-auto">
            {colonies.map((colony) => {
              const isSelected = selectedColony?.id === colony.id;
              return (
                <button
                  key={colony.id}
                  id={`colony-select-option-${colony.id}`}
                  onClick={() => {
                    onSelectColony(colony);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition ${
                    isSelected
                      ? "bg-[#f59e0b]/15 border-l-2 border-[#f59e0b]"
                      : "hover:bg-[#141c2e]"
                  }`}
                >
                  <div>
                    <span
                      className={`font-gothic font-bold text-xs tracking-wider block uppercase ${
                        isSelected ? "text-[#fef08a]" : "text-[#e2e8f0]"
                      }`}
                    >
                      {colony.name}
                    </span>
                    <span className="text-[11px] text-[#94a3b8] font-mono-slate">
                      {colony.colony_type.replace(/_/g, " ")} • {colony.star_system || "Mundus Valancius"}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#f59e0b]" />}
                </button>
              );
            })}
          </div>

          <div className="p-2 border-t border-[#222e46] bg-[#0f1422]">
            <button
              id="establish-new-colony-from-dropdown"
              onClick={() => {
                setIsOpen(false);
                onOpenNewColony();
              }}
              className="w-full py-1.5 bg-[#f59e0b]/20 hover:bg-[#f59e0b]/30 text-[#fef08a] border border-[#f59e0b]/60 font-gothic text-xs font-bold uppercase tracking-wider rounded transition flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>+ Establish New Colony</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
