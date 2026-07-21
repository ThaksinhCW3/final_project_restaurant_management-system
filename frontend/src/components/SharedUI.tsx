// src/components/SharedUI.tsx
import React from "react";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { C } from "../config/constants.ts";

interface NavBtnProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  expanded?: boolean;
  onClick: () => void;
}
export function NavBtn({ icon: Icon, label, active, expanded = false, onClick }: NavBtnProps) {
  return (
    <button onClick={onClick} style={{
      display: "flex",
      flexDirection: expanded ? "row" : "column",
      alignItems: "center",
      justifyContent: expanded ? "flex-start" : "center",
      gap: expanded ? 10 : 4,
      background: active ? C.goldDim : "transparent",
      border: `1px solid ${active ? C.borderMid : "transparent"}`,
      borderRadius: 12,
      padding: expanded ? "10px 12px" : "10px 6px",
      cursor: "pointer",
      color: active ? C.gold : C.textDim, width: "100%", transition: "all 0.18s",
    }}>
      <Icon size={17} style={{ flexShrink: 0 }} />
      <span style={{
        fontSize: expanded ? 11 : 9,
        letterSpacing: expanded ? 0 : 0.6,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
    </button>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  icon: LucideIcon;
}
export function StatCard({ label, value, sub, color, icon: Icon }: StatCardProps) {
  return (
    <div style={{ flex: 1, minWidth: 160, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 7, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -8, right: -8, opacity: 0.04, transform: "scale(3.5)" }}><Icon size={36} color={color} /></div>
      <span style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: 1.4 }}>{label}</span>
      <span style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "var(--heading)", lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11, color: C.textDim }}>{sub}</span>
    </div>
  );
}

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}
export function Modal({ title, onClose, children, width = 480 }: ModalProps) {
  return (
    <div className="shared-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2200, padding: 20 }}>
      <div className="shared-modal-card" style={{ background: C.card, border: `1px solid ${C.borderMid}`, borderRadius: 18, width, maxWidth: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>{title}</span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textDim, padding: 4 }}><X size={16} /></button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "20px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none", fontFamily: "var(--sans)" };

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>{label}</div>{children}</div>;
}

interface InpProps extends React.InputHTMLAttributes<HTMLInputElement> { label: string }
export const Inp = ({ label, ...p }: InpProps) => <Field label={label}><input style={inputStyle} {...p} /></Field>;

interface SelProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label: string; children: React.ReactNode }
export const Sel = ({ label, children, ...p }: SelProps) => (
  <Field label={label}>
    <select style={{ ...inputStyle, cursor: "pointer" }} {...p}>{children}</select>
  </Field>
);

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
}
export function Btn({ children, variant = "primary", ...p }: BtnProps) {
  const v = {
    primary: { background: `linear-gradient(135deg,${C.gold},${C.amber})`, color: "#fff", border: "none" },
    secondary: { background: "transparent", color: C.textMid, border: `1px solid ${C.border}` },
    danger: { background: "rgba(208,64,48,0.14)", color: C.red, border: "1px solid rgba(208,64,48,0.3)" },
  };
  return <button {...p} style={{ padding: "9px 18px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, ...v[variant], ...p.style }}>{children}</button>;
}
