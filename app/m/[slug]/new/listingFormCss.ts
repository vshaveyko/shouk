// Shared CSS for the listing form layout. Used by both the create page
// (/m/[slug]/new) and the edit page (/l/[id]/edit) so they render the
// exact same chrome — only the form's behaviour differs.
//
// Design source: design_handoff_shouks_mvp/Flow 6 - Core App Shell.html · 6D.
// Class names (.cl, .cl-head, .cl-section, .mode-toggle, .cl-right,
// .preview) mirror the design so visual edits map 1:1.
export const clCss = `
.cl-wrap { padding: 28px 28px 60px; max-width: 1280px; margin: 0 auto; }
.cl { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 32px; padding: 0; }
@media (max-width: 960px) { .cl { grid-template-columns: 1fr; } }
.cl-body { min-width: 0; display: flex; flex-direction: column; }
.cl-head { margin-bottom: 16px; }
.cl-head .breadcrumb { font-size: 11.5px; color: var(--muted); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
.cl-head .breadcrumb a { color: var(--blue-ink); text-decoration: none; }
.cl-head .breadcrumb a:hover { text-decoration: underline; }
.cl-head h1 { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 28px; margin: 0 0 4px; letter-spacing: -0.005em; }
.cl-head p { color: var(--ink-soft); font-size: 13px; margin: 0 0 16px; }
.cl-head p .req { color: var(--danger, oklch(0.58 0.18 25)); }

.cl-section { margin-bottom: 20px; }
.cl-section h3 { margin: 0 0 4px; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
.cl-section .hint { font-size: 12px; color: var(--muted); margin-bottom: 14px; }

.mode-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--line); border-radius: 12px; padding: 5px; background: var(--bg-soft); margin-bottom: 22px; }
.mode-toggle .mt-opt { padding: 12px 14px; border-radius: 8px; cursor: pointer; display: flex; gap: 11px; align-items: flex-start; background: transparent; border: 0; text-align: left; font: inherit; color: var(--ink-soft); transition: background 0.15s; }
.mode-toggle .mt-opt.on { background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); color: var(--ink); }
.mode-toggle .mt-opt:hover:not(.on) { background: rgba(0,0,0,0.02); }
.mode-toggle .mt-opt .mt-ic { width: 32px; height: 32px; border-radius: 8px; background: var(--bg-soft); display: grid; place-items: center; flex-shrink: 0; color: var(--muted); border: 1px solid var(--line); }
.mode-toggle .mt-opt.on .mt-ic { background: var(--blue); border-color: var(--blue); color: #fff; }
.mode-toggle .mt-opt .mt-l { font-weight: 600; font-size: 13.5px; margin-bottom: 2px; display: block; }
.mode-toggle .mt-opt .mt-s { font-size: 11.5px; color: var(--muted); line-height: 1.35; display: block; }
.mode-toggle .mt-opt.on .mt-s { color: var(--ink-soft); }

.iso-banner { background: oklch(0.97 0.04 85); border: 1px solid oklch(0.85 0.11 85); border-radius: 9px; padding: 11px 14px; font-size: 12.5px; color: oklch(0.38 0.09 65); display: flex; gap: 10px; align-items: flex-start; margin-bottom: 16px; }
.iso-banner svg { flex-shrink: 0; margin-top: 1px; width: 16px; height: 16px; }
.iso-banner strong { font-weight: 600; }

.cl-right { position: sticky; top: 92px; align-self: start; }
.preview { background: #fff; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.preview-hd { padding: 10px 14px; border-bottom: 1px solid var(--line-soft); font-size: 11.5px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.preview-hd svg { width: 13px; height: 13px; }
.preview-img { height: 200px; background: var(--bg-panel); background-size: cover; background-position: center; }
.preview-body { padding: 14px 16px; }
.preview-body .p-t { font-family: "Instrument Serif", serif; font-size: 20px; line-height: 1.2; margin-bottom: 8px; min-height: 24px; }
.preview-body .p-p { font-size: 20px; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 12px; }
.preview-body .p-spec { display: grid; grid-template-columns: 80px 1fr; font-size: 12px; padding: 5px 0; border-top: 1px solid var(--line-soft); gap: 8px; }
.preview-body .p-spec .k { color: var(--muted); }
.iso-preview-tag { display: inline-block; background: oklch(0.55 0.15 60); color: #fff; font-size: 10.5px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; padding: 3px 8px; border-radius: 5px; margin-bottom: 8px; }
`;
