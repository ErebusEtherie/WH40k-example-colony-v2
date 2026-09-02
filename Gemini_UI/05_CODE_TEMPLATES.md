# 05 — Developer Code Templates & Cheatsheet

Use these production-ready TypeScript + Tailwind snippets when adding new components or views to the codebase.

---

## 1. Standard Imperial Card / Panel

```tsx
import React from "react";
import { Shield, ExternalLink } from "lucide-react";

interface ImperialPanelProps {
  title: string;
  badgeText?: string;
  children: React.ReactNode;
  onViewDetails?: () => void;
}

export const ImperialPanel: React.FC<ImperialPanelProps> = ({
  title,
  badgeText = "TELEMETRY",
  children,
  onViewDetails,
}) => {
  return (
    <div className="bg-[#0b0f19] border border-[#1e293b] hover:border-[#334155] rounded shadow-lg transition p-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#1f293d] pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-[#f59e0b]" />
          <h3 className="font-gothic font-bold text-sm tracking-wider text-[#f8fafc] uppercase">
            {title}
          </h3>
          <span className="px-2 py-0.5 text-[9px] font-mono-slate uppercase font-bold bg-[#f59e0b]/15 text-[#fcd34d] border border-[#f59e0b]/40 rounded">
            {badgeText}
          </span>
        </div>

        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="text-[11px] font-mono-slate text-[#38bdf8] hover:text-[#7dd3fc] flex items-center space-x-1 transition"
          >
            <span>Inspect</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Panel Body */}
      <div className="text-xs font-mono-slate text-[#cbd5e1]">
        {children}
      </div>
    </div>
  );
};
```

---

## 2. Standard Modal Dialog Boilerplate

```tsx
import React, { useState } from "react";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";

interface StandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  colonyId: string;
}

export const StandardModal: React.FC<StandardModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  colonyId,
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Item name cannot be left blank.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({ colony_id: colonyId, name: name.trim() });
      onClose();
    } catch (err: any) {
      setError(err.message || "Imperial Cogitator rejected submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        id="modal-standard-container"
        className="bg-[#0c101a] border border-[#f59e0b]/50 rounded shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[#121726] border-b border-[#252f44] flex items-center justify-between">
          <span className="font-gothic font-bold text-sm tracking-wider text-[#f59e0b] uppercase">
            New Imperial Registry
          </span>
          <button
            onClick={onClose}
            className="text-[#94a3b8] hover:text-white p-1 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-4 mb-0 p-2.5 bg-[#ef4444]/15 border border-[#ef4444]/40 rounded text-[#f87171] text-xs font-mono-slate flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-mono-slate text-[#cbd5e1] uppercase font-bold mb-1">
              Designation Name
            </label>
            <input
              type="text"
              id="input-registry-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Omnissiah Shrine"
              className="w-full bg-[#141b2a] border border-[#2c364d] text-xs font-mono-slate text-[#f8fafc] px-3 py-2 rounded focus:outline-none focus:border-[#f59e0b] transition placeholder:text-[#475569]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#1f293d]">
            <button
              type="button"
              id="btn-modal-cancel"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 bg-[#121622] hover:bg-[#1a2133] border border-[#2c364d] text-xs font-mono-slate text-[#94a3b8] rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-modal-submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-black font-mono-slate font-bold text-xs rounded transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Transmitting..." : "Confirm Protocol"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

---

## 3. Data Table Item Row with State Toggle

```tsx
import React from "react";
import { Power, Trash2 } from "lucide-react";

interface InfrastructureRowProps {
  id: string;
  name: string;
  category: string;
  isWorking: boolean;
  statEffect: string;
  onToggleState: (id: string) => void;
  onDelete: (id: string) => void;
  isReadOnly?: boolean;
}

export const InfrastructureRow: React.FC<InfrastructureRowProps> = ({
  id,
  name,
  category,
  isWorking,
  statEffect,
  onToggleState,
  onDelete,
  isReadOnly = false,
}) => {
  return (
    <tr id={`row-item-${id}`} className="border-b border-[#1f293d] hover:bg-[#0f1422] transition">
      <td className="px-4 py-3 text-xs font-mono-slate font-semibold text-[#f8fafc]">
        {name}
      </td>
      <td className="px-4 py-3 text-xs font-mono-slate text-[#94a3b8] uppercase">
        {category}
      </td>
      <td className="px-4 py-3 text-xs font-mono-slate text-[#38bdf8]">
        {statEffect}
      </td>
      <td className="px-4 py-3">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono-slate uppercase font-bold border ${
            isWorking
              ? "bg-[#10b981]/15 text-[#34d399] border-[#10b981]/40"
              : "bg-[#ef4444]/15 text-[#f87171] border-[#ef4444]/40"
          }`}
        >
          {isWorking ? "ONLINE" : "OFFLINE"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end space-x-2">
          <button
            id={`btn-toggle-${id}`}
            disabled={isReadOnly}
            onClick={() => onToggleState(id)}
            title={isWorking ? "Deactivate" : "Activate"}
            className="p-1.5 bg-[#121622] hover:bg-[#1a2133] border border-[#2c364d] rounded text-[#cbd5e1] hover:text-white transition disabled:opacity-40"
          >
            <Power className="w-3.5 h-3.5" />
          </button>
          <button
            id={`btn-delete-${id}`}
            disabled={isReadOnly}
            onClick={() => onDelete(id)}
            title="Decommission"
            className="p-1.5 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/30 rounded text-[#f87171] transition disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
```

---

## 4. Role-Guarded Button Helper

```tsx
import React from "react";

interface RoleGuardedButtonProps {
  id: string;
  userRole: "admin" | "colony_manager" | "viewer";
  requiredRole?: "colony_manager" | "admin";
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export const RoleGuardedButton: React.FC<RoleGuardedButtonProps> = ({
  id,
  userRole,
  requiredRole = "colony_manager",
  onClick,
  children,
  className = "px-3 py-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-black font-mono-slate font-bold text-xs rounded transition",
}) => {
  const isDenied =
    userRole === "viewer" ||
    (requiredRole === "admin" && userRole !== "admin");

  const handleClick = (e: React.MouseEvent) => {
    if (isDenied) {
      e.preventDefault();
      alert("Clearance Denied: Servitor clearance is read-only. Lord Captain or Arch Magos clearance required.");
      return;
    }
    onClick();
  };

  return (
    <button
      id={id}
      onClick={handleClick}
      disabled={isDenied}
      title={isDenied ? "Clearance Denied (Read-Only)" : undefined}
      className={`${className} ${isDenied ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
};
```
