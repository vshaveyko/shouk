"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { DashboardData, DashboardListingRow } from "@/lib/dashboard";

/**
 * Sectioned dashboard — port of design_handoff_shouks_mvp/Flow 8 - Sectioned Dashboard.html.
 * Class names match the design 1:1. Data is supplied by `loadDashboardData()`
 * — no stub/mock content. Empty sub-tabs render the per-section empty states
 * called out in the design's mocknote, with a small SVG illustration that
 * has a subtle continuous animation.
 */

const css = `
.sd-wrap { background: var(--bg-soft); padding: 28px 0 56px; }
.sd-browser { max-width: 1320px; margin: 0 auto; background: #fff; border-radius: 14px; box-shadow: 0 1px 0 oklch(0.88 0.003 60), 0 14px 40px -22px oklch(0.2 0.02 60 / 0.18); overflow: hidden; }

.sd-wrap .ah { padding: 24px 28px 18px; border-bottom: 1px solid var(--line); }
.sd-wrap .ah h1 { margin: 0; font-family: 'Instrument Serif', serif; font-weight: 400; font-size: 34px; letter-spacing: -0.015em; }
.sd-wrap .ah .sub { margin-top: 4px; font-size: 13px; color: var(--ink-soft); }

.sd-wrap .body { display: grid; grid-template-columns: 220px minmax(0, 1.15fr) minmax(0, 1fr); }

/* Sidebar */
.sd-wrap .sb { padding: 18px 12px 24px; border-right: 1px solid var(--line); background: var(--bg-soft); }
.sd-wrap .sb-section { margin-bottom: 4px; }
.sd-wrap .sb-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 13.5px; font-weight: 600; color: var(--ink); letter-spacing: -0.005em; }
.sd-wrap .sb-head:hover { background: var(--hover); }
.sd-wrap .sb-head.active { background: #fff; box-shadow: 0 1px 0 oklch(0.88 0.003 60); }
.sd-wrap .sb-head .l { display: inline-flex; align-items: center; gap: 9px; }
.sd-wrap .sb-head .l svg { width: 14px; height: 14px; opacity: 0.7; }
.sd-wrap .sb-head .ct { font-size: 10.5px; font-weight: 600; padding: 1px 7px; border-radius: 10px; background: var(--bg-panel); color: var(--ink-soft); letter-spacing: 0.02em; }
.sd-wrap .sb-head.active .ct { background: var(--ink); color: #fff; }
.sd-wrap .sb-head .new-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--blue); margin-left: 4px; animation: sd-pulse 2.4s ease-in-out infinite; }
.sd-wrap .sb-head .r { display: inline-flex; align-items: center; gap: 6px; }
.sd-wrap .sb-head .caret { width: 12px; height: 12px; opacity: 0.55; transition: transform 160ms ease, opacity 160ms ease; transform: rotate(-90deg); }
.sd-wrap .sb-section.active .sb-head .caret { transform: rotate(0deg); opacity: 0.85; }
.sd-wrap .sb-head:hover .caret { opacity: 0.85; }
@media (prefers-reduced-motion: reduce) { .sd-wrap .sb-head .caret { transition: none; } }
.sd-wrap .sb-subs { padding: 2px 0 6px 22px; display: flex; flex-direction: column; gap: 1px; }
.sd-wrap .sb-section:not(.active) .sb-subs { display: none; }
.sd-wrap .sb-sub { display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 500; color: var(--muted); }
.sd-wrap .sb-sub:hover { color: var(--ink); }
.sd-wrap .sb-sub.active { color: var(--ink); background: #fff; }
.sd-wrap .sb-sub .ct-mini { font-size: 10.5px; color: var(--muted); font-weight: 500; }
.sd-wrap .sb-sub.active .ct-mini { color: var(--ink-soft); }
.sd-wrap .sb-sub .new-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--blue); animation: sd-pulse 2.4s ease-in-out infinite; }

.sd-wrap .sb-foot { margin-top: 18px; padding: 10px 12px; font-size: 11px; color: var(--muted); line-height: 1.45; }
.sd-wrap .sb-section-spaced { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line-soft); }

/* List pane */
.sd-wrap .pane-list { padding: 18px 24px 28px; border-right: 1px solid var(--line); }
.sd-wrap .lp-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; gap: 12px; flex-wrap: wrap; }
.sd-wrap .lp-title { font-family: 'Instrument Serif', serif; font-size: 22px; font-weight: 400; letter-spacing: -0.005em; }
.sd-wrap .lp-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
.sd-wrap .lp-act { display: flex; gap: 6px; }

.sd-wrap .lh { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 10px; flex-wrap: wrap; }
.sd-wrap .lh-l { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.sd-wrap .lh-r { display: flex; align-items: center; gap: 6px; }
.sd-wrap .ftr { font: inherit; font-size: 12px; padding: 5px 10px; border: 1px solid var(--line); border-radius: 7px; color: var(--ink-soft); background: #fff; display: inline-flex; align-items: center; gap: 5px; font-weight: 500; cursor: pointer; }
.sd-wrap .ftr.on { background: var(--ink); border-color: var(--ink); color: #fff; }
.sd-wrap .privacy-banner { font-size: 11.5px; color: var(--muted); display: inline-flex; align-items: center; gap: 5px; padding: 4px 0 10px; }
.sd-wrap .privacy-banner svg { width: 11px; height: 11px; }

.sd-wrap .lr-list { display: flex; flex-direction: column; gap: 0; }
.sd-wrap .lr-row { display: grid; grid-template-columns: 56px minmax(0,1fr) auto; gap: 14px; padding: 12px 10px; border-radius: 8px; align-items: center; cursor: pointer; border: 1px solid transparent; text-decoration: none; color: inherit; }
.sd-wrap .lr-row + .lr-row { border-top: 1px solid var(--line-soft); border-radius: 0; }
.sd-wrap .lr-row:hover { background: var(--bg-soft); }
.sd-wrap .lr-row.active { background: var(--blue-wash); border-color: oklch(0.85 0.04 232); border-radius: 8px; }
.sd-wrap .lr-row.active + .lr-row { border-top-color: transparent; }
.sd-wrap .lr-row .th { width: 56px; height: 56px; border-radius: 8px; flex: none; background-size: cover; background-position: center; }
.sd-wrap .lr-row .t { font-size: 13.5px; font-weight: 500; letter-spacing: -0.005em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sd-wrap .lr-row .s { font-size: 11.5px; color: var(--muted); margin-top: 3px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.sd-wrap .lr-row .mp-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; color: var(--ink-soft); background: var(--bg-soft); padding: 1px 7px; border-radius: 4px; font-weight: 500; }
.sd-wrap .lr-row.active .mp-tag { background: #fff; }
.sd-wrap .lr-row .right { text-align: right; }
.sd-wrap .lr-row .price { font-size: 13.5px; font-weight: 600; }
.sd-wrap .lr-row .meta-r { font-size: 11px; color: var(--muted); margin-top: 3px; }
.sd-wrap .pill-state { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 500; padding: 2px 7px; border-radius: 4px; }
.sd-wrap .pill-state.live { background: oklch(0.95 0.04 150); color: oklch(0.35 0.12 150); }
.sd-wrap .pill-state.draft { background: var(--bg-soft); color: var(--muted); }
.sd-wrap .pill-state.sold { background: oklch(0.94 0.02 240); color: var(--ink-soft); }
.sd-wrap .pill-state.ended { background: oklch(0.94 0.04 25); color: oklch(0.45 0.13 25); }
.sd-wrap .pill-state.new { background: var(--blue); color: #fff; }

.sd-wrap .cfg-list { display: flex; flex-direction: column; gap: 8px; }
.sd-wrap .cfg-row { background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; cursor: pointer; }
.sd-wrap .cfg-row:hover { border-color: oklch(0.78 0.02 240); }
.sd-wrap .cfg-row.active { border-color: var(--blue); background: var(--blue-wash); box-shadow: 0 0 0 2px oklch(0.63 0.13 232 / 0.1); }
.sd-wrap .cfg-row .cr-t { font-size: 13.5px; font-weight: 500; letter-spacing: -0.005em; }
.sd-wrap .cfg-row .cr-q { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
.sd-wrap .chip-q { background: var(--bg-soft); color: var(--ink-soft); font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 4px; }
.sd-wrap .cfg-row.active .chip-q { background: #fff; }
.sd-wrap .cfg-row .cr-meta { font-size: 11.5px; color: var(--muted); margin-top: 7px; display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
.sd-wrap .cfg-row .cr-meta .new-ct { color: var(--blue-ink); font-weight: 600; }
.sd-wrap .cfg-row .cr-act { display: flex; align-items: center; gap: 10px; }

.sd-wrap .match-group { background: #fff; border: 1px solid var(--line); border-radius: 10px; margin-bottom: 12px; overflow: hidden; }
.sd-wrap .mg-head { padding: 11px 14px; background: var(--bg-soft); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line-soft); gap: 12px; }
.sd-wrap .mg-head .mg-t { font-size: 12.5px; font-weight: 600; letter-spacing: -0.005em; display: flex; align-items: center; gap: 7px; }
.sd-wrap .mg-head .mg-q { font-size: 11px; color: var(--muted); margin-top: 2px; }
.sd-wrap .mg-head .mg-ct { background: var(--blue); color: #fff; font-size: 10.5px; font-weight: 600; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.02em; flex: none; }
.sd-wrap .mg-body { padding: 2px 10px; }
.sd-wrap .mg-body .lr-row { padding: 10px 8px; }

/* Detail pane */
.sd-wrap .pane-detail { padding: 22px 26px 28px; background: var(--bg-soft); }
.sd-wrap .dp-card { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 18px 20px; }
.sd-wrap .dp-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--line-soft); }
.sd-wrap .dp-head .dp-t { font-family: 'Instrument Serif', serif; font-size: 22px; font-weight: 400; letter-spacing: -0.005em; }
.sd-wrap .dp-head .dp-s { font-size: 12px; color: var(--muted); margin-top: 4px; }
.sd-wrap .dp-head .dp-act { display: flex; gap: 6px; flex: none; flex-wrap: wrap; justify-content: flex-end; }
.sd-wrap .dp-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
.sd-wrap .dp-meta.three { grid-template-columns: repeat(3, 1fr); }
.sd-wrap .dp-meta .m-stat { background: var(--bg-soft); border-radius: 8px; padding: 10px 12px; }
.sd-wrap .dp-meta .m-stat .v { font-family: 'Instrument Serif', serif; font-size: 22px; font-weight: 400; letter-spacing: -0.01em; }
.sd-wrap .dp-meta .m-stat .l { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin-top: 2px; }
.sd-wrap .dp-section-t { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin: 14px 0 8px; }
.sd-wrap .activity-list { font-size: 12.5px; color: var(--ink-soft); line-height: 1.7; }
.sd-wrap .activity-list > div { display: flex; gap: 6px; align-items: baseline; }
.sd-wrap .criteria-grid { display: grid; grid-template-columns: 130px 1fr; gap: 10px 16px; font-size: 13px; }
.sd-wrap .criteria-grid .ck { color: var(--muted); }
.sd-wrap .criteria-grid .cv { color: var(--ink); font-weight: 500; }

.sd-wrap .chip-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 8px; font-size: 12px; background: #fff; border: 1px solid var(--line); color: var(--ink-soft); font-weight: 500; cursor: pointer; text-decoration: none; }
.sd-wrap .chip-btn:hover { border-color: var(--ink); color: var(--ink); }
.sd-wrap .chip-btn.on { background: var(--ink); color: #fff; border-color: var(--ink); }

.sd-wrap .section-panel { display: none; }
.sd-wrap .section-panel.active { display: block; }
.sd-wrap .sub-panel { display: none; }
.sd-wrap .sub-panel.active { display: block; }

/* Empty state */
.sd-wrap .es { display: grid; place-items: center; padding: 48px 20px 56px; text-align: center; gap: 14px; }
.sd-wrap .es-art { width: 120px; height: 120px; }
.sd-wrap .es-title { font-family: 'Instrument Serif', serif; font-size: 22px; font-weight: 400; letter-spacing: -0.005em; color: var(--ink); }
.sd-wrap .es-sub { font-size: 12.5px; color: var(--ink-soft); max-width: 360px; line-height: 1.55; }
.sd-wrap .es-cta { margin-top: 6px; }

/* Animations */
@keyframes sd-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.55; transform: scale(0.85); } }
@keyframes sd-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes sd-sway { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
@keyframes sd-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes sd-blip { 0% { r: 1; opacity: 1; } 100% { r: 22; opacity: 0; } }
@keyframes sd-shimmer { 0%, 100% { stroke-dashoffset: 0; } 50% { stroke-dashoffset: -16; } }

.sd-wrap .es-art .float { animation: sd-float 4.2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
.sd-wrap .es-art .sway { animation: sd-sway 5s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
.sd-wrap .es-art .orbit { animation: sd-orbit 9s linear infinite; transform-origin: center; transform-box: fill-box; }
.sd-wrap .es-art .blip { animation: sd-blip 2.4s ease-out infinite; transform-origin: center; transform-box: fill-box; }
.sd-wrap .es-art .blip.delay { animation-delay: 1.2s; }
.sd-wrap .es-art .shimmer { stroke-dasharray: 8 8; animation: sd-shimmer 2.6s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .sd-wrap .sb-head .new-dot,
  .sd-wrap .sb-sub .new-dot,
  .sd-wrap .es-art * { animation: none !important; }
}
`;

// ── Section icons (sidebar) ────────────────────────────────────────────────
const ICON_LIST = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7h18M3 12h18M3 17h18" />
  </svg>
);
const ICON_SEARCH = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={11} cy={11} r={7} />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const ICON_BELL = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </svg>
);
const ICON_BAG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const ICON_INFO = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={12} cy={12} r={10} />
    <path d="M12 8v4M12 16h0" />
  </svg>
);
const ICON_LOCK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x={3} y={11} width={18} height={11} rx={2} />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const ICON_CARET = (
  <svg className="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// ── Empty-state illustrations (subtle continuous animation) ────────────────
const ART_LISTINGS = (
  <svg className="es-art" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x={20} y={32} width={72} height={62} rx={10} fill="oklch(0.95 0.018 232)" stroke="oklch(0.86 0.04 232)" />
    <g className="float">
      <rect x={32} y={44} width={48} height={6} rx={3} fill="oklch(0.86 0.04 232)" />
      <rect x={32} y={56} width={36} height={4} rx={2} fill="oklch(0.9 0.02 60)" />
      <rect x={32} y={66} width={42} height={4} rx={2} fill="oklch(0.9 0.02 60)" />
      <rect x={32} y={78} width={28} height={4} rx={2} fill="oklch(0.9 0.02 60)" />
    </g>
    <circle cx={92} cy={32} r={14} fill="var(--blue)" />
    <path d="M86 32h12M92 26v12" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const ART_DRAFTS = (
  <svg className="es-art" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x={26} y={20} width={64} height={80} rx={6} fill="#fff" stroke="oklch(0.85 0.01 60)" strokeDasharray="4 4" />
    <g className="sway" style={{ transformOrigin: "78px 32px" }}>
      <rect x={70} y={22} width={26} height={6} rx={2} fill="var(--ink)" transform="rotate(-32 70 22)" />
      <rect x={66} y={28} width={26} height={4} rx={2} fill="oklch(0.86 0.04 232)" transform="rotate(-32 66 28)" />
    </g>
    <line x1={36} y1={56} x2={80} y2={56} stroke="oklch(0.9 0.01 60)" strokeWidth={2} strokeLinecap="round" />
    <line x1={36} y1={68} x2={72} y2={68} stroke="oklch(0.9 0.01 60)" strokeWidth={2} strokeLinecap="round" />
    <line x1={36} y1={80} x2={64} y2={80} stroke="oklch(0.9 0.01 60)" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const ART_SOLD = (
  <svg className="es-art" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M20 90 L60 28 L100 90 Z" fill="oklch(0.96 0.018 232)" stroke="oklch(0.86 0.04 232)" />
    <g className="float">
      <circle cx={60} cy={72} r={14} fill="oklch(0.95 0.04 150)" stroke="oklch(0.55 0.12 150)" strokeWidth={2} />
      <path d="M52 72 l6 6 l10 -12" stroke="oklch(0.35 0.12 150)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  </svg>
);

const ART_ISO_OPEN = (
  <svg className="es-art" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx={52} cy={52} r={26} fill="#fff" stroke="oklch(0.86 0.04 232)" strokeWidth={3} />
    <line x1={70} y1={70} x2={92} y2={92} stroke="oklch(0.86 0.04 232)" strokeWidth={4} strokeLinecap="round" />
    <g className="orbit" style={{ transformOrigin: "52px 52px" }}>
      <circle cx={52} cy={26} r={4} fill="var(--blue)" />
    </g>
    <text x={52} y={58} textAnchor="middle" fontFamily="Instrument Serif, serif" fontSize={22} fill="var(--blue-ink)">?</text>
  </svg>
);

const ART_ISO_MATCHES = (
  <svg className="es-art" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx={60} cy={60} r={6} fill="var(--blue)" />
    <circle cx={60} cy={60} r={1} fill="var(--blue)" className="blip" />
    <circle cx={60} cy={60} r={1} fill="var(--blue)" className="blip delay" />
    <circle cx={60} cy={60} r={36} fill="none" stroke="oklch(0.86 0.04 232)" strokeWidth={1.5} className="shimmer" />
    <circle cx={60} cy={60} r={50} fill="none" stroke="oklch(0.9 0.02 232)" strokeWidth={1} className="shimmer" />
  </svg>
);

const ART_ISO_CLOSED = (
  <svg className="es-art" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x={24} y={28} width={72} height={64} rx={8} fill="oklch(0.96 0.005 60)" stroke="oklch(0.88 0.005 60)" />
    <g className="float">
      <circle cx={60} cy={60} r={16} fill="oklch(0.95 0.04 150)" stroke="oklch(0.55 0.12 150)" strokeWidth={2} />
      <path d="M52 60 l6 6 l10 -12" stroke="oklch(0.35 0.12 150)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  </svg>
);

const ART_ALERTS_ACTIVE = (
  <svg className="es-art" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g className="sway" style={{ transformOrigin: "60px 26px" }}>
      <path d="M40 70 a20 20 0 0 1 40 0 c0 14 6 18 6 18 H34 s6 -4 6 -18" fill="oklch(0.95 0.018 232)" stroke="oklch(0.86 0.04 232)" strokeWidth={2} />
      <path d="M54 92 a6 6 0 0 0 12 0" stroke="oklch(0.86 0.04 232)" strokeWidth={2} fill="none" strokeLinecap="round" />
    </g>
    <circle cx={84} cy={36} r={8} fill="var(--blue)" />
    <text x={84} y={40} textAnchor="middle" fontFamily="Inter Tight, sans-serif" fontSize={10} fontWeight={700} fill="#fff">+</text>
  </svg>
);

const ART_ALERTS_MATCHES = (
  <svg className="es-art" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x={20} y={48} width={80} height={50} rx={8} fill="#fff" stroke="oklch(0.88 0.01 60)" />
    <line x1={32} y1={62} x2={70} y2={62} stroke="oklch(0.92 0.01 60)" strokeWidth={3} strokeLinecap="round" />
    <line x1={32} y1={74} x2={56} y2={74} stroke="oklch(0.92 0.01 60)" strokeWidth={3} strokeLinecap="round" />
    <line x1={32} y1={86} x2={62} y2={86} stroke="oklch(0.92 0.01 60)" strokeWidth={3} strokeLinecap="round" />
    <g className="float">
      <path d="M84 24 l6 16 l16 2 l-12 10 l4 16 l-14 -8 l-14 8 l4 -16 l-12 -10 l16 -2 z" fill="var(--blue)" />
    </g>
  </svg>
);

const ART_PURCHASES = (
  <svg className="es-art" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g className="float">
      <path d="M28 44 L40 30 L80 30 L92 44 L92 92 a4 4 0 0 1 -4 4 H32 a4 4 0 0 1 -4 -4 Z" fill="oklch(0.96 0.018 232)" stroke="oklch(0.86 0.04 232)" strokeWidth={2} />
      <path d="M28 44 H92" stroke="oklch(0.86 0.04 232)" strokeWidth={2} />
      <path d="M50 56 a10 10 0 0 0 20 0" stroke="oklch(0.55 0.12 232)" strokeWidth={2} strokeLinecap="round" fill="none" />
    </g>
  </svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtMoney(cents: number | null | undefined) {
  if (cents == null) return "—";
  const v = cents / 100;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 2)}M`;
  if (v >= 10_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
function fmtMoneyLong(cents: number | null | undefined) {
  if (cents == null) return "—";
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
function shortAgo(d: Date) {
  const ms = Date.now() - d.getTime();
  const minutes = ms / (1000 * 60);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${Math.round(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}
function endsIn(d: Date) {
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return "ended";
  const minutes = Math.floor(ms / (1000 * 60));
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
function thumbBg(color: string | null, cover: string | null) {
  if (cover) return `url(${cover}) center/cover`;
  const c = color ?? "oklch(0.55 0.17 25)";
  return `linear-gradient(135deg, ${c}, color-mix(in oklab, ${c} 50%, black))`;
}

function ListingRowEl({ row, type }: { row: DashboardListingRow; type: "active" | "draft" | "sold" | "iso" }) {
  const isAuction = row.type === "AUCTION";
  const meta =
    type === "active"
      ? isAuction && row.auctionEndsAt
        ? `Auction · ${row.bidCount} bids · ends in ${endsIn(row.auctionEndsAt)}`
        : `Buy now · ${row.watcherCount} watchers · ${shortAgo(row.publishedAt ?? row.createdAt)}`
      : type === "draft"
        ? `Last edited ${shortAgo(row.publishedAt ?? row.createdAt)}`
        : type === "sold"
          ? row.soldAt
            ? `Sold ${shortAgo(row.soldAt)}`
            : "Auction ended"
          : `Posted ${shortAgo(row.publishedAt ?? row.createdAt)}`;
  const pill =
    type === "draft"
      ? <span className="pill-state draft">Draft</span>
      : type === "sold"
        ? row.status === "RESERVE_NOT_MET"
          ? <span className="pill-state ended">Ended</span>
          : <span className="pill-state sold">Sold</span>
        : <span className="pill-state live">● Live</span>;
  return (
    <Link href={`/l/${row.id}`} className="lr-row" data-id={row.id}>
      <div className="th" style={{ background: thumbBg(row.marketplaceColor, row.cover) }} />
      <div>
        <div className="t">{row.title}</div>
        <div className="s"><span className="mp-tag">{row.marketplaceName}</span>{meta}</div>
      </div>
      <div className="right">
        <div className="price">{fmtMoneyLong(row.priceCents)}</div>
        <div className="meta-r">{pill}</div>
      </div>
    </Link>
  );
}

function EmptyState({
  art,
  title,
  sub,
  cta,
}: {
  art: React.ReactNode;
  title: string;
  sub: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="es" data-testid="empty-state">
      {art}
      <div className="es-title">{title}</div>
      <div className="es-sub">{sub}</div>
      {cta && (
        <Link href={cta.href} className="chip-btn on es-cta">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

export function SectionedDashboard({ data }: { data: DashboardData }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const showDetail = (id: string | null) => {
      const cards = root.querySelectorAll<HTMLElement>(".dp-card");
      let found = false;
      cards.forEach((d) => {
        if (id && d.dataset.detail === id) {
          d.hidden = false;
          found = true;
        } else if (d.dataset.detail !== "placeholder") {
          d.hidden = true;
        }
      });
      const ph = root.querySelector<HTMLElement>(".dp-card[data-detail='placeholder']");
      if (ph) ph.hidden = found;
    };
    const showSub = (name: string) => {
      root.querySelectorAll<HTMLElement>(".sb-sub").forEach((b) => b.classList.toggle("active", b.dataset.sub === name));
      root.querySelectorAll<HTMLElement>(".sub-panel").forEach((p) => p.classList.toggle("active", p.dataset.subPanel === name));
      const panel = root.querySelector<HTMLElement>(`.sub-panel[data-sub-panel="${name}"]`);
      const firstRow = panel?.querySelector<HTMLElement>(".lr-row.active, .cfg-row.active") || panel?.querySelector<HTMLElement>(".lr-row, .cfg-row");
      showDetail(firstRow?.dataset.id ?? null);
    };
    const showSection = (name: string) => {
      root.querySelectorAll<HTMLElement>(".sb-section").forEach((s) => s.classList.toggle("active", s.dataset.section === name));
      root.querySelectorAll<HTMLElement>(".sb-section .sb-head").forEach((h) => {
        const sec = h.closest<HTMLElement>(".sb-section");
        h.classList.toggle("active", sec?.dataset.section === name);
      });
      root.querySelectorAll<HTMLElement>(".section-panel").forEach((p) => p.classList.toggle("active", p.dataset.sectionPanel === name));
      const sec = root.querySelector<HTMLElement>(`.sb-section[data-section="${name}"]`);
      const firstSub = sec?.querySelector<HTMLElement>(".sb-sub.active") || sec?.querySelector<HTMLElement>(".sb-sub");
      if (firstSub?.dataset.sub) {
        showSub(firstSub.dataset.sub);
      } else {
        const panel = root.querySelector<HTMLElement>(`.section-panel[data-section-panel="${name}"]`);
        const firstRow = panel?.querySelector<HTMLElement>(".lr-row.active") || panel?.querySelector<HTMLElement>(".lr-row, .cfg-row");
        showDetail(firstRow?.dataset.id ?? null);
      }
    };

    const cleanups: Array<() => void> = [];
    root.querySelectorAll<HTMLElement>(".sb-section").forEach((s) => {
      const head = s.querySelector<HTMLElement>(".sb-head");
      const name = s.dataset.section;
      if (!head || !name) return;
      const h = () => showSection(name);
      head.addEventListener("click", h);
      cleanups.push(() => head.removeEventListener("click", h));
    });
    root.querySelectorAll<HTMLElement>(".sb-sub").forEach((b) => {
      const name = b.dataset.sub;
      if (!name) return;
      const h = () => showSub(name);
      b.addEventListener("click", h);
      cleanups.push(() => b.removeEventListener("click", h));
    });
    root.querySelectorAll<HTMLElement>("[data-id]").forEach((row) => {
      const id = row.dataset.id;
      if (!id) return;
      const h = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.closest("button, .switch")) return;
        const panel = row.closest<HTMLElement>(".sub-panel, .section-panel");
        panel?.querySelectorAll<HTMLElement>(".lr-row.active, .cfg-row.active").forEach((x) => x.classList.remove("active"));
        row.classList.add("active");
        showDetail(id);
      };
      row.addEventListener("click", h);
      cleanups.push(() => row.removeEventListener("click", h));
    });

    return () => cleanups.forEach((c) => c());
  }, []);

  const { listings, iso, alerts, purchases } = data;

  return (
    <div className="sd-wrap" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="sd-browser">
        <div className="ah">
          <h1>Dashboard</h1>
          <div className="sub">Everything you&apos;re selling, buying, asking for, or tracking — organized by what you&apos;re doing.</div>
        </div>

        <div className="body">
          {/* ───── Sidebar ───── */}
          <nav className="sb">
            <div className="sb-section active" data-section="listings">
              <div className="sb-head active">
                <span className="l">{ICON_LIST}Listings</span>
                <span className="r">
                  <span className="ct">{listings.counts.total}</span>
                  {ICON_CARET}
                </span>
              </div>
              <div className="sb-subs">
                <div className="sb-sub active" data-sub="listings-active">Active <span className="ct-mini">{listings.counts.active}</span></div>
                <div className="sb-sub" data-sub="listings-drafts">Drafts <span className="ct-mini">{listings.counts.drafts}</span></div>
                <div className="sb-sub" data-sub="listings-sold">Sold <span className="ct-mini">{listings.counts.sold}</span></div>
              </div>
            </div>

            <div className="sb-section" data-section="iso">
              <div className="sb-head">
                <span className="l">{ICON_SEARCH}ISO</span>
                <span className="r">
                  <span className="ct">{iso.counts.total}</span>
                  {iso.counts.newMatches > 0 && <span className="new-dot" />}
                  {ICON_CARET}
                </span>
              </div>
              <div className="sb-subs">
                <div className="sb-sub" data-sub="iso-open">Open <span className="ct-mini">{iso.counts.open}</span></div>
                <div className="sb-sub" data-sub="iso-matches">Matches <span className="ct-mini">{iso.counts.matches}</span>{iso.counts.newMatches > 0 && <span className="new-dot" />}</div>
                <div className="sb-sub" data-sub="iso-closed">Closed <span className="ct-mini">{iso.counts.closed}</span></div>
              </div>
            </div>

            <div className="sb-section" data-section="alerts">
              <div className="sb-head">
                <span className="l">{ICON_BELL}Alerts</span>
                <span className="r">
                  <span className="ct">{alerts.counts.total}</span>
                  {alerts.counts.newMatches > 0 && <span className="new-dot" />}
                  {ICON_CARET}
                </span>
              </div>
              <div className="sb-subs">
                <div className="sb-sub" data-sub="alerts-active">Active <span className="ct-mini">{alerts.counts.active}</span></div>
                <div className="sb-sub" data-sub="alerts-matches">Matches <span className="ct-mini">{alerts.counts.matches}</span>{alerts.counts.newMatches > 0 && <span className="new-dot" />}</div>
              </div>
            </div>

            <div className="sb-section sb-section-spaced" data-section="purchases">
              <div className="sb-head">
                <span className="l">{ICON_BAG}Purchases</span>
                <span className="ct">{purchases.counts.total}</span>
              </div>
            </div>

            <div className="sb-foot">
              Sections group by role: <b>Listings</b> = selling, <b>Purchases</b> = buying, <b>ISO</b> = sourcing, <b>Alerts</b> = monitoring.
            </div>
          </nav>

          {/* ───── List pane ───── */}
          <div className="pane-list">
            {/* LISTINGS */}
            <div className="section-panel active" data-section-panel="listings">
              <div className="lp-head">
                <div>
                  <div className="lp-title">Listings</div>
                  <div className="lp-sub">Things you&apos;re selling across your marketplaces.</div>
                </div>
                <div className="lp-act"><Link href="/explore" className="chip-btn on">+ New listing</Link></div>
              </div>

              <div className="sub-panel active" data-sub-panel="listings-active">
                {listings.active.length === 0 ? (
                  <EmptyState
                    art={ART_LISTINGS}
                    title="No live listings"
                    sub="Once you publish something, it shows up here with bids, watchers, and views in one glance."
                    cta={{ href: "/explore", label: "Create your first listing" }}
                  />
                ) : (
                  <>
                    <div className="privacy-banner">{ICON_INFO}Public — visible to everyone in each listing&apos;s marketplace.</div>
                    <div className="lr-list">
                      {listings.active.map((row, i) => (
                        <div key={row.id} className={`lr-row${i === 0 ? " active" : ""}`} data-id={row.id}>
                          <div className="th" style={{ background: thumbBg(row.marketplaceColor, row.cover) }} />
                          <div>
                            <div className="t">{row.title}</div>
                            <div className="s">
                              <span className="mp-tag">{row.marketplaceName}</span>
                              {row.type === "AUCTION" && row.auctionEndsAt
                                ? `Auction · ${row.bidCount} bids · ends in ${endsIn(row.auctionEndsAt)}`
                                : `Buy now · ${row.watcherCount} watchers · ${shortAgo(row.publishedAt ?? row.createdAt)}`}
                            </div>
                          </div>
                          <div className="right">
                            <div className="price">{fmtMoneyLong(row.priceCents ?? null)}</div>
                            <div className="meta-r">
                              <span className="pill-state live">● Live</span>
                              {row.type === "AUCTION" && row.auctionEndsAt && ` · ${endsIn(row.auctionEndsAt)}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="sub-panel" data-sub-panel="listings-drafts">
                {listings.drafts.length === 0 ? (
                  <EmptyState
                    art={ART_DRAFTS}
                    title="No drafts"
                    sub="Drafts auto-save here as you build a listing — you can come back any time and finish."
                  />
                ) : (
                  <>
                    <div className="privacy-banner">{ICON_LOCK}Private — drafts are only visible to you until published.</div>
                    <div className="lr-list">
                      {listings.drafts.map((r) => <ListingRowEl key={r.id} row={r} type="draft" />)}
                    </div>
                  </>
                )}
              </div>

              <div className="sub-panel" data-sub-panel="listings-sold">
                {listings.sold.length === 0 ? (
                  <EmptyState
                    art={ART_SOLD}
                    title="Nothing sold yet"
                    sub="Your sales history will live here. Buyers can see your sold record on your profile."
                  />
                ) : (
                  <>
                    <div className="privacy-banner">{ICON_INFO}Public history — buyers can see your sold record on your profile.</div>
                    <div className="lr-list">
                      {listings.sold.map((r) => <ListingRowEl key={r.id} row={r} type="sold" />)}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* PURCHASES */}
            <div className="section-panel" data-section-panel="purchases">
              <div className="lp-head">
                <div>
                  <div className="lp-title">Purchases</div>
                  <div className="lp-sub">Things you&apos;ve bought across your marketplaces.</div>
                </div>
              </div>
              <div className="sub-panel active">
                <EmptyState
                  art={ART_PURCHASES}
                  title="No purchases yet"
                  sub="Once you buy something, it shows up here with the receipt, delivery status, and seller record."
                  cta={{ href: "/explore", label: "Browse marketplaces" }}
                />
              </div>
            </div>

            {/* ISO */}
            <div className="section-panel" data-section-panel="iso">
              <div className="lp-head">
                <div>
                  <div className="lp-title">In Search Of</div>
                  <div className="lp-sub">Public requests posted to marketplaces — sellers can reply.</div>
                </div>
                <div className="lp-act"><Link href="/explore" className="chip-btn on">+ Post a wanted</Link></div>
              </div>

              <div className="sub-panel active" data-sub-panel="iso-open">
                {iso.open.length === 0 ? (
                  <EmptyState
                    art={ART_ISO_OPEN}
                    title="No active wanted ads"
                    sub="An ISO post is a public request to sellers in a marketplace. They reply when they have what you're looking for."
                    cta={{ href: "/explore", label: "Post a wanted" }}
                  />
                ) : (
                  <>
                    <div className="privacy-banner">{ICON_INFO}Public — visible to every seller in that marketplace.</div>
                    <div className="cfg-list">
                      {iso.open.map((row, i) => (
                        <div key={row.id} className={`cfg-row${i === 0 ? " active" : ""}`} data-id={row.id}>
                          <div>
                            <div className="cr-t">{row.title} <span className="pill-state live" style={{ marginLeft: 6, verticalAlign: 1 }}>● Open</span></div>
                            <div className="cr-q"><span className="chip-q">{row.marketplaceName}</span>{row.priceCents ? <span className="chip-q">Up to {fmtMoneyLong(row.priceCents)}</span> : null}</div>
                            <div className="cr-meta">
                              <span>{row.watcherCount > 0 ? `${row.watcherCount} replies · ` : "0 replies yet · "}{row.views} views</span>
                              <span>Posted {shortAgo(row.publishedAt ?? row.createdAt)}</span>
                            </div>
                          </div>
                          <div className="cr-act"><Link href={`/l/${row.id}`} className="chip-btn" style={{ fontSize: 11, padding: "5px 9px" }}>Edit</Link></div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="sub-panel" data-sub-panel="iso-matches">
                {iso.matches.length === 0 ? (
                  <EmptyState
                    art={ART_ISO_MATCHES}
                    title="No matches yet"
                    sub="We'll notify you here when a seller responds to one of your wanted ads."
                  />
                ) : (
                  <>
                    <div className="privacy-banner">{ICON_INFO}Public — sellers see your wanted ad and reply.</div>
                    {iso.matches.map((g, gi) => (
                      <div key={`${g.isoListingId}-${gi}`} className="match-group">
                        <div className="mg-head">
                          <div>
                            <div className="mg-t">{g.isoTitle}</div>
                            <div className="mg-q">{g.marketplaceName}</div>
                          </div>
                          {g.newCount > 0 && <span className="mg-ct">{g.newCount} new</span>}
                        </div>
                        <div className="mg-body">
                          {g.rows.map((m) => (
                            <div key={m.id} className="lr-row" data-id={m.id}>
                              <div className="th" style={{ background: thumbBg(m.marketplaceColor, null) }} />
                              <div>
                                <div className="t">{m.title}</div>
                                <div className="s">{m.preview ?? "—"} · {shortAgo(m.createdAt)}</div>
                              </div>
                              <div className="right">
                                {m.unread ? <span className="pill-state new">● New</span> : <span className="meta-r" style={{ color: "var(--ink-soft)" }}>View →</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="sub-panel" data-sub-panel="iso-closed">
                <EmptyState
                  art={ART_ISO_CLOSED}
                  title={iso.closed.length === 0 ? "No closed wanted ads yet" : `${iso.closed.length} closed`}
                  sub={iso.closed.length === 0 ? "Closed ads stay here for your records once you mark them resolved." : "Closed ads stay here for your records."}
                />
                {iso.closed.length > 0 && (
                  <div className="lr-list" style={{ marginTop: 12 }}>
                    {iso.closed.map((r) => <ListingRowEl key={r.id} row={r} type="iso" />)}
                  </div>
                )}
              </div>
            </div>

            {/* ALERTS */}
            <div className="section-panel" data-section-panel="alerts">
              <div className="lp-head">
                <div>
                  <div className="lp-title">Alerts</div>
                  <div className="lp-sub">Saved searches that ping you when something matches.</div>
                </div>
                <div className="lp-act"><Link href="/explore" className="chip-btn on">+ New alert</Link></div>
              </div>

              <div className="sub-panel active" data-sub-panel="alerts-active">
                {alerts.active.length === 0 ? (
                  <EmptyState
                    art={ART_ALERTS_ACTIVE}
                    title="No saved searches"
                    sub="Alerts run in the background and notify you the moment a new listing matches — instantly or as a daily digest."
                    cta={{ href: "/explore", label: "Create an alert" }}
                  />
                ) : (
                  <>
                    <div className="privacy-banner">{ICON_LOCK}Private — saved searches that run in the background.</div>
                    <div className="cfg-list">
                      {alerts.active.map((s, i) => (
                        <div key={s.id} className={`cfg-row${i === 0 ? " active" : ""}`} data-id={s.id}>
                          <div>
                            <div className="cr-t">{s.name}</div>
                            <div className="cr-q"><span className="chip-q">{s.marketplaceName}</span></div>
                            <div className="cr-meta"><span>Saved {shortAgo(s.createdAt)}</span><span>Notify: {s.frequency.toLowerCase()}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="sub-panel" data-sub-panel="alerts-matches">
                {alerts.matches.length === 0 ? (
                  <EmptyState
                    art={ART_ALERTS_MATCHES}
                    title="No new matches"
                    sub="New listings that match one of your saved searches will appear here as soon as they go live."
                  />
                ) : (
                  alerts.matches.map((g, gi) => (
                    <div key={`${g.savedSearchId ?? "mp"}-${gi}`} className="match-group">
                      <div className="mg-head">
                        <div>
                          <div className="mg-t">{g.marketplaceName}</div>
                        </div>
                        {g.newCount > 0 && <span className="mg-ct">{g.newCount} new</span>}
                      </div>
                      <div className="mg-body">
                        {g.rows.map((m) => (
                          <div key={m.id} className="lr-row" data-id={m.id}>
                            <div className="th" style={{ background: thumbBg(g.marketplaceColor, null) }} />
                            <div>
                              <div className="t">{m.title}</div>
                              <div className="s">{m.preview ?? "—"} · {shortAgo(m.createdAt)}</div>
                            </div>
                            <div className="right">
                              {m.unread ? <span className="pill-state new">● New</span> : <span className="meta-r" style={{ color: "var(--ink-soft)" }}>View →</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ───── Detail pane ───── */}
          <div className="pane-detail">
            {/* Listings · Active detail cards */}
            {listings.active.map((row) => (
              <div key={row.id} className="dp-card" data-detail={row.id} hidden={row !== listings.active[0]}>
                <div className="dp-head">
                  <div>
                    <div className="dp-t">{row.title}</div>
                    <div className="dp-s">
                      {row.marketplaceName} · {row.type === "AUCTION" ? "Auction" : "Buy now"}
                      {row.type === "AUCTION" && row.auctionEndsAt ? ` · ends in ${endsIn(row.auctionEndsAt)}` : ""}
                    </div>
                  </div>
                  <div className="dp-act">
                    <Link href={`/l/${row.id}`} className="chip-btn">Open</Link>
                  </div>
                </div>
                <div className="dp-meta">
                  <div className="m-stat"><div className="v">{row.bidCount}</div><div className="l">Bids</div></div>
                  <div className="m-stat"><div className="v">{fmtMoney(row.priceCents)}</div><div className="l">{row.type === "AUCTION" ? "Top bid" : "Price"}</div></div>
                  <div className="m-stat"><div className="v">{row.views}</div><div className="l">Views</div></div>
                  <div className="m-stat"><div className="v">{row.watcherCount}</div><div className="l">Watchers</div></div>
                </div>
                <div className="dp-section-t" style={{ marginTop: 0 }}>Listing details</div>
                <div className="criteria-grid">
                  <div className="ck">Marketplace</div><div className="cv">{row.marketplaceName}</div>
                  <div className="ck">Type</div><div className="cv">{row.type}</div>
                  <div className="ck">Posted</div><div className="cv">{shortAgo(row.publishedAt ?? row.createdAt)}</div>
                  <div className="ck">Status</div><div className="cv">{row.status}</div>
                </div>
              </div>
            ))}

            {/* Drafts/Sold/ISO Open detail cards (compact) */}
            {[...listings.drafts, ...listings.sold, ...iso.open, ...iso.closed].map((row) => (
              <div key={`d-${row.id}`} className="dp-card" data-detail={row.id} hidden>
                <div className="dp-head">
                  <div>
                    <div className="dp-t">{row.title}</div>
                    <div className="dp-s">{row.marketplaceName} · {row.status.toLowerCase()}</div>
                  </div>
                  <div className="dp-act">
                    <Link href={`/l/${row.id}`} className="chip-btn">Open</Link>
                  </div>
                </div>
                <div className="dp-meta three">
                  <div className="m-stat"><div className="v">{fmtMoney(row.priceCents)}</div><div className="l">{row.status === "SOLD" ? "Sold for" : "Price"}</div></div>
                  <div className="m-stat"><div className="v">{row.views}</div><div className="l">Views</div></div>
                  <div className="m-stat"><div className="v">{row.bidCount}</div><div className="l">Bids</div></div>
                </div>
              </div>
            ))}

            {/* Saved-search detail cards */}
            {alerts.active.map((s) => (
              <div key={`s-${s.id}`} className="dp-card" data-detail={s.id} hidden>
                <div className="dp-head">
                  <div>
                    <div className="dp-t">{s.name}</div>
                    <div className="dp-s">{s.marketplaceName} · saved {shortAgo(s.createdAt)}</div>
                  </div>
                  <div className="dp-act"><span className="chip-btn">{s.frequency.toLowerCase()}</span></div>
                </div>
                <div className="dp-section-t" style={{ marginTop: 0 }}>Criteria</div>
                <div className="criteria-grid">
                  {Object.entries(s.query).slice(0, 6).map(([k, v]) => (
                    <span key={k} style={{ display: "contents" }}>
                      <div className="ck">{k}</div>
                      <div className="cv">{typeof v === "string" || typeof v === "number" ? String(v) : JSON.stringify(v)}</div>
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* Match detail cards (ISO matches and alert matches) */}
            {iso.matches.flatMap((g) => g.rows).map((m) => (
              <div key={`im-${m.id}`} className="dp-card" data-detail={m.id} hidden>
                <div className="dp-head">
                  <div>
                    <div className="dp-t">{m.title}</div>
                    <div className="dp-s">{m.marketplaceName} · ISO match · {shortAgo(m.createdAt)}</div>
                  </div>
                </div>
                <div className="dp-section-t" style={{ marginTop: 0 }}>Why it matched</div>
                <div className="activity-list"><div>● {m.preview ?? "Seller responded to your wanted ad."}</div></div>
              </div>
            ))}
            {alerts.matches.flatMap((g) => g.rows).map((m) => (
              <div key={`am-${m.id}`} className="dp-card" data-detail={m.id} hidden>
                <div className="dp-head">
                  <div>
                    <div className="dp-t">{m.title}</div>
                    <div className="dp-s">Alert match · {shortAgo(m.createdAt)}</div>
                  </div>
                  {m.deeplink && <div className="dp-act"><Link href={m.deeplink} className="chip-btn on">Open →</Link></div>}
                </div>
                {m.preview && (
                  <>
                    <div className="dp-section-t" style={{ marginTop: 0 }}>Preview</div>
                    <div className="activity-list"><div>● {m.preview}</div></div>
                  </>
                )}
              </div>
            ))}

            {/* Placeholder when nothing selected */}
            <div className="dp-card" data-detail="placeholder" hidden={listings.active.length > 0}>
              <div className="es" style={{ padding: "32px 12px" }}>
                <svg className="es-art" viewBox="0 0 120 120" fill="none" aria-hidden="true">
                  <rect x={30} y={30} width={60} height={60} rx={8} fill="oklch(0.96 0.005 60)" stroke="oklch(0.88 0.01 60)" />
                  <line x1={42} y1={50} x2={78} y2={50} stroke="oklch(0.88 0.01 60)" strokeWidth={2} strokeLinecap="round" />
                  <line x1={42} y1={62} x2={70} y2={62} stroke="oklch(0.88 0.01 60)" strokeWidth={2} strokeLinecap="round" />
                  <line x1={42} y1={74} x2={66} y2={74} stroke="oklch(0.88 0.01 60)" strokeWidth={2} strokeLinecap="round" />
                </svg>
                <div className="es-sub">Select a row on the left to see its details here.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
