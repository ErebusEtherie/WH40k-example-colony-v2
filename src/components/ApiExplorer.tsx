import React, { useState } from "react";
import { Terminal, Play, CheckCircle2, AlertCircle, Shield, Key } from "lucide-react";
import { apiFetch } from "../lib/api";

export const ApiExplorer: React.FC = () => {
  const [method, setMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">("GET");
  const [endpoint, setEndpoint] = useState("/api/v1/auth/me");
  const [requestBody, setRequestBody] = useState("");
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseJson, setResponseJson] = useState<string>("// Send request to view response data slate");
  const [loading, setLoading] = useState(false);

  // Cookie-based auth: tokens sent automatically, no manual token retrieval needed

  const presets = [
    { label: "Check Identity (/me)", method: "GET", path: "/api/v1/auth/me", body: "" },
    {
      label: "Login (Lord Captain)",
      method: "POST",
      path: "/api/v1/auth/login",
      body: JSON.stringify({ username: "LordCaptain", password: "WarrantOfTrade" }, null, 2),
    },
    {
      label: "Login (Arch Magos)",
      method: "POST",
      path: "/api/v1/auth/login",
      body: JSON.stringify({ username: "ArchMagos", password: "WarrantOfTrade" }, null, 2),
    },
    {
      label: "Login (Servitor)",
      method: "POST",
      path: "/api/v1/auth/login",
      body: JSON.stringify({ username: "Servitor", password: "WarrantOfTrade" }, null, 2),
    },
    { label: "List Colonies", method: "GET", path: "/api/v1/colonies", body: "" },
    { label: "System Health", method: "GET", path: "/api/v1/health", body: "" },
    { label: "All Representatives", method: "GET", path: "/api/v1/representatives", body: "" },
    { label: "Colony Types Config", method: "GET", path: "/api/v1/config/colony-types", body: "" },
    { label: "Rule Tables Config", method: "GET", path: "/api/v1/config/rule-tables", body: "" },
    { label: "Revoke Token", method: "POST", path: "/api/v1/auth/revoke", body: "" },
  ];

  const handleExecute = async () => {
    setLoading(true);
    setResponseStatus(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Cookie-based auth: tokens sent automatically via credentials: 'include'
      // CSRF token added automatically by apiFetch for state-changing requests

      const options: RequestInit = {
        method,
        headers,
        credentials: 'include', // Send cookies automatically
      };

      if (["POST", "PUT"].includes(method) && requestBody.trim()) {
        options.body = requestBody;
      }

      const res = await apiFetch(endpoint, options);
      setResponseStatus(res.status);
      const data = await res.json().catch(() => ({ status: res.status, statusText: res.statusText }));
      setResponseJson(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseStatus(500);
      setResponseJson(JSON.stringify({ error: err.message || "Network request failed" }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121520] border border-[#262f44] rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-[#fdba74]" />
            <h2 className="text-xl font-bold font-gothic text-[#f8fafc]">
              DATA-SLATE REST API INTERACTIVE EXPLORER
            </h2>
          </div>

          {/* Cookie-based auth: tokens sent automatically, no manual Bearer token attachment needed */}
        </div>
        <p className="text-xs text-[#94a3b8] mt-1">
          Direct interactive cogitator interface for querying and testing WH40K Colony Manager REST & Authentication endpoints.
        </p>
      </div>

      {/* Presets Strip */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <span className="text-xs font-mono-slate text-[#64748b] shrink-0">Presets:</span>
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setMethod(p.method as any);
              setEndpoint(p.path);
              setRequestBody(p.body);
            }}
            className="px-2.5 py-1 bg-[#161a26] hover:bg-[#1e2538] border border-[#2a344a] hover:border-[#b87333]/40 text-[#cbd5e1] text-xs font-mono-slate rounded transition shrink-0 cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Request Form */}
      <div className="bg-[#121520] border border-[#2a344a] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className="bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm font-mono-slate font-bold text-[#fdba74]"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>

          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="flex-1 bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm font-mono-slate text-[#f8fafc]"
          />

          <button
            onClick={handleExecute}
            disabled={loading}
            className="px-5 py-2 bg-[#b87333] hover:bg-[#d97706] text-black font-gothic font-bold text-sm tracking-wider uppercase rounded transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{loading ? "Transmitting..." : "Execute"}</span>
          </button>
        </div>

        {["POST", "PUT"].includes(method) && (
          <div className="space-y-1.5">
            <label htmlFor="request-body" className="text-xs font-mono-slate text-[#94a3b8]">Request JSON Body:</label>
            <textarea
              id="request-body"
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              rows={4}
              placeholder='{ "key": "value" }'
              className="w-full bg-[#0b0d13] border border-[#334155] rounded p-3 text-xs font-mono-slate text-[#38bdf8] focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Response Data Slate */}
      <div className="bg-[#121520] border border-[#2a344a] rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#2a344a] pb-2">
          <div className="flex items-center space-x-2 text-xs font-mono-slate">
            <span className="text-[#94a3b8]">Status:</span>
            {responseStatus !== null ? (
              <span
                className={`flex items-center space-x-1 font-bold ${
                  responseStatus >= 200 && responseStatus < 300
                    ? "text-[#4ade80]"
                    : "text-[#f87171]"
                }`}
              >
                {responseStatus >= 200 && responseStatus < 300 ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                <span>{responseStatus}</span>
              </span>
            ) : (
              <span className="text-[#64748b]">Awaiting Transmission</span>
            )}
          </div>

          <span className="text-xs font-mono-slate text-[#64748b]">FORMAT: application/json</span>
        </div>

        <pre className="bg-[#0b0d13] border border-[#1e293b] rounded p-4 text-xs font-mono-slate text-[#cbd5e1] overflow-x-auto max-h-96 scrollbar-thin">
          {responseJson}
        </pre>
      </div>
    </div>
  );
};
