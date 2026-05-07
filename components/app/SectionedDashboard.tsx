"use client";

import { useEffect, useRef } from "react";

/**
 * Sectioned dashboard — port of design_handoff_shouks_mvp/Flow 8 - Sectioned Dashboard.html.
 * Class names are kept identical to the design so future visual edits map 1:1.
 *
 * Gated behind the Shipeasy `sectioned_dashboard` flag at /home. Data is the
 * design's own demo content — wiring to Prisma is intentionally deferred so
 * the visual layout can be shipped (and rolled out) without a data pass.
 */

const css = `
.sd-wrap { background: var(--bg-soft); padding: 28px 0; min-height: calc(100vh - 56px); }
.sd-browser { max-width: 1320px; margin: 0 auto; background: #fff; border-radius: 14px; box-shadow: 0 1px 0 oklch(0.88 0.003 60), 0 14px 40px -22px oklch(0.2 0.02 60 / 0.18); overflow: hidden; }

.sd-wrap .ah { padding: 24px 28px 18px; border-bottom: 1px solid var(--line); }
.sd-wrap .ah h1 { margin: 0; font-family: 'Instrument Serif', serif; font-weight: 400; font-size: 34px; letter-spacing: -0.015em; }
.sd-wrap .ah .sub { margin-top: 4px; font-size: 13px; color: var(--ink-soft); }

.sd-wrap .body { display: grid; grid-template-columns: 220px minmax(0, 1.15fr) minmax(0, 1fr); min-height: 760px; }

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
.sd-wrap .sb-head .new-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--blue); margin-left: 4px; }
.sd-wrap .sb-subs { padding: 2px 0 6px 22px; display: flex; flex-direction: column; gap: 1px; }
.sd-wrap .sb-section:not(.active) .sb-subs { display: none; }
.sd-wrap .sb-sub { display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 500; color: var(--muted); }
.sd-wrap .sb-sub:hover { color: var(--ink); }
.sd-wrap .sb-sub.active { color: var(--ink); background: #fff; }
.sd-wrap .sb-sub .ct-mini { font-size: 10.5px; color: var(--muted); font-weight: 500; }
.sd-wrap .sb-sub.active .ct-mini { color: var(--ink-soft); }
.sd-wrap .sb-sub .new-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--blue); }

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

.sd-wrap .purchase-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; padding: 14px 0 18px; margin-bottom: 14px; border-bottom: 1px solid var(--line-soft); }
.sd-wrap .ps-stat { padding: 0 14px; border-right: 1px solid var(--line-soft); }
.sd-wrap .ps-stat:last-child { border-right: 0; }
.sd-wrap .ps-stat:first-child { padding-left: 0; }
.sd-wrap .ps-stat .v { font-family: 'Instrument Serif', serif; font-size: 22px; font-weight: 400; letter-spacing: -0.005em; color: var(--ink); line-height: 1.1; }
.sd-wrap .ps-stat .l { font-size: 10.5px; color: var(--muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
.sd-wrap .lr-list-label { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; padding: 4px 10px 8px; }

.sd-wrap .lr-list { display: flex; flex-direction: column; gap: 0; }
.sd-wrap .lr-row { display: grid; grid-template-columns: 56px minmax(0,1fr) auto; gap: 14px; padding: 12px 10px; border-radius: 8px; align-items: center; cursor: pointer; border: 1px solid transparent; }
.sd-wrap .lr-row + .lr-row { border-top: 1px solid var(--line-soft); border-radius: 0; }
.sd-wrap .lr-row:hover { background: var(--bg-soft); }
.sd-wrap .lr-row.active { background: var(--blue-wash); border-color: oklch(0.85 0.04 232); border-radius: 8px; }
.sd-wrap .lr-row.active + .lr-row { border-top-color: transparent; }
.sd-wrap .lr-row .th { width: 56px; height: 56px; border-radius: 8px; flex: none; }
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
.sd-wrap .pill-state.delivered { background: oklch(0.95 0.04 150); color: oklch(0.35 0.12 150); }

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
.sd-wrap .switch { position: relative; width: 32px; height: 18px; background: var(--blue); border-radius: 10px; flex: none; cursor: pointer; }
.sd-wrap .switch::after { content: ""; position: absolute; width: 14px; height: 14px; background: #fff; border-radius: 50%; top: 2px; right: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.15); transition: all 0.18s; }
.sd-wrap .switch.off { background: var(--line); }
.sd-wrap .switch.off::after { left: 2px; right: auto; }

.sd-wrap .match-group { background: #fff; border: 1px solid var(--line); border-radius: 10px; margin-bottom: 12px; overflow: hidden; }
.sd-wrap .mg-head { padding: 11px 14px; background: var(--bg-soft); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line-soft); }
.sd-wrap .mg-head .mg-t { font-size: 12.5px; font-weight: 600; letter-spacing: -0.005em; display: flex; align-items: center; gap: 7px; }
.sd-wrap .mg-head .mg-q { font-size: 11px; color: var(--muted); margin-top: 2px; }
.sd-wrap .mg-head .mg-ct { background: var(--blue); color: #fff; font-size: 10.5px; font-weight: 600; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.02em; }
.sd-wrap .mg-body { padding: 2px 10px; }
.sd-wrap .mg-body .lr-row { padding: 10px 8px; }

.sd-wrap .pane-detail { padding: 22px 26px 28px; background: var(--bg-soft); }
.sd-wrap .dp-empty { display: grid; place-items: center; height: 100%; color: var(--muted); font-size: 13px; padding: 60px 20px; text-align: center; }
.sd-wrap .dp-empty svg { width: 28px; height: 28px; opacity: 0.4; margin-bottom: 10px; }
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

.sd-wrap .chip-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 8px; font-size: 12px; background: #fff; border: 1px solid var(--line); color: var(--ink-soft); font-weight: 500; cursor: pointer; }
.sd-wrap .chip-btn:hover { border-color: var(--ink); color: var(--ink); }
.sd-wrap .chip-btn.on { background: var(--ink); color: #fff; border-color: var(--ink); }
.sd-wrap .chip-btn.danger { color: var(--danger); }
.sd-wrap .chip-btn.danger:hover { border-color: var(--danger); }

.sd-wrap .section-panel { display: none; }
.sd-wrap .section-panel.active { display: block; }
.sd-wrap .sub-panel { display: none; }
.sd-wrap .sub-panel.active { display: block; }
`;

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

export function SectionedDashboard() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const showDetail = (id: string) => {
      let found = false;
      root.querySelectorAll<HTMLElement>(".dp-card").forEach((d) => {
        if (d.dataset.detail === id) {
          d.hidden = false;
          found = true;
        } else {
          d.hidden = true;
        }
      });
      if (!found) {
        const ph = root.querySelector<HTMLElement>(".dp-card[data-detail='placeholder']");
        if (ph) ph.hidden = false;
      }
    };

    const showSub = (name: string) => {
      root.querySelectorAll<HTMLElement>(".sb-sub").forEach((b) => b.classList.toggle("active", b.dataset.sub === name));
      root.querySelectorAll<HTMLElement>(".sub-panel").forEach((p) => p.classList.toggle("active", p.dataset.subPanel === name));
      const panel = root.querySelector<HTMLElement>(`.sub-panel[data-sub-panel="${name}"]`);
      const firstRow = panel?.querySelector<HTMLElement>(".lr-row.active, .cfg-row.active") || panel?.querySelector<HTMLElement>(".lr-row, .cfg-row");
      if (firstRow?.dataset.id) showDetail(firstRow.dataset.id);
      else showDetail("placeholder");
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
        if (firstRow?.dataset.id) showDetail(firstRow.dataset.id);
        else showDetail("placeholder");
      }
    };

    const sectionHandlers: Array<[HTMLElement, () => void]> = [];
    root.querySelectorAll<HTMLElement>(".sb-section").forEach((s) => {
      const head = s.querySelector<HTMLElement>(".sb-head");
      const name = s.dataset.section;
      if (head && name) {
        const handler = () => showSection(name);
        head.addEventListener("click", handler);
        sectionHandlers.push([head, handler]);
      }
    });

    const subHandlers: Array<[HTMLElement, () => void]> = [];
    root.querySelectorAll<HTMLElement>(".sb-sub").forEach((b) => {
      const name = b.dataset.sub;
      if (name) {
        const handler = () => showSub(name);
        b.addEventListener("click", handler);
        subHandlers.push([b, handler]);
      }
    });

    const rowHandlers: Array<[HTMLElement, (e: Event) => void]> = [];
    root.querySelectorAll<HTMLElement>("[data-id]").forEach((row) => {
      const id = row.dataset.id;
      if (!id) return;
      const handler = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.closest("button, .switch")) return;
        const panel = row.closest<HTMLElement>(".sub-panel, .section-panel");
        panel?.querySelectorAll<HTMLElement>(".lr-row.active, .cfg-row.active").forEach((x) => x.classList.remove("active"));
        row.classList.add("active");
        showDetail(id);
      };
      row.addEventListener("click", handler);
      rowHandlers.push([row, handler]);
    });

    const switchHandlers: Array<[HTMLElement, (e: Event) => void]> = [];
    root.querySelectorAll<HTMLElement>("[data-switch]").forEach((s) => {
      const handler = (e: Event) => {
        e.stopPropagation();
        s.classList.toggle("off");
      };
      s.addEventListener("click", handler);
      switchHandlers.push([s, handler]);
    });

    return () => {
      sectionHandlers.forEach(([el, h]) => el.removeEventListener("click", h));
      subHandlers.forEach(([el, h]) => el.removeEventListener("click", h));
      rowHandlers.forEach(([el, h]) => el.removeEventListener("click", h));
      switchHandlers.forEach(([el, h]) => el.removeEventListener("click", h));
    };
  }, []);

  return (
    <div className="sd-wrap" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="sd-browser">
        <div className="ah">
          <h1>Dashboard</h1>
          <div className="sub">Everything I&apos;m selling, buying, asking for, or tracking — organized by what I&apos;m doing.</div>
        </div>

        <div className="body">
          {/* Sidebar */}
          <nav className="sb">
            <div className="sb-section active" data-section="listings">
              <div className="sb-head active">
                <span className="l">{ICON_LIST}Listings</span>
                <span className="ct">6</span>
              </div>
              <div className="sb-subs">
                <div className="sb-sub active" data-sub="listings-active">Active <span className="ct-mini">3</span></div>
                <div className="sb-sub" data-sub="listings-drafts">Drafts <span className="ct-mini">1</span></div>
                <div className="sb-sub" data-sub="listings-sold">Sold <span className="ct-mini">2</span></div>
              </div>
            </div>

            <div className="sb-section" data-section="iso">
              <div className="sb-head">
                <span className="l">{ICON_SEARCH}ISO</span>
                <span className="ct">5</span>
                <span className="new-dot" />
              </div>
              <div className="sb-subs">
                <div className="sb-sub" data-sub="iso-open">Open <span className="ct-mini">2</span></div>
                <div className="sb-sub" data-sub="iso-matches">Matches <span className="ct-mini">3</span><span className="new-dot" /></div>
                <div className="sb-sub" data-sub="iso-closed">Closed <span className="ct-mini">0</span></div>
              </div>
            </div>

            <div className="sb-section" data-section="alerts">
              <div className="sb-head">
                <span className="l">{ICON_BELL}Alerts</span>
                <span className="ct">19</span>
                <span className="new-dot" />
              </div>
              <div className="sb-subs">
                <div className="sb-sub" data-sub="alerts-active">Active <span className="ct-mini">7</span></div>
                <div className="sb-sub" data-sub="alerts-matches">Matches <span className="ct-mini">12</span><span className="new-dot" /></div>
              </div>
            </div>

            <div className="sb-section sb-section-spaced" data-section="purchases">
              <div className="sb-head">
                <span className="l">{ICON_BAG}Purchases</span>
                <span className="ct">2</span>
              </div>
            </div>

            <div className="sb-foot">
              Sections group by role: <b>Listings</b> = selling, <b>Purchases</b> = buying, <b>ISO</b> = sourcing, <b>Alerts</b> = monitoring.
            </div>
          </nav>

          {/* List pane */}
          <div className="pane-list">
            {/* LISTINGS */}
            <div className="section-panel active" data-section-panel="listings">
              <div className="lp-head">
                <div>
                  <div className="lp-title">Listings</div>
                  <div className="lp-sub">Things I&apos;m selling across my marketplaces.</div>
                </div>
                <div className="lp-act"><button className="chip-btn on">+ New listing</button></div>
              </div>

              <div className="sub-panel active" data-sub-panel="listings-active">
                <div className="lh">
                  <div className="lh-l">
                    <button className="ftr on">All marketplaces</button>
                    <button className="ftr">Auction</button>
                    <button className="ftr">Buy now</button>
                  </div>
                  <div className="lh-r"><button className="ftr">Sort: Recent ▾</button></div>
                </div>
                <div className="privacy-banner">{ICON_INFO}Public — visible to everyone in each listing&apos;s marketplace.</div>
                <div className="lr-list">
                  <div className="lr-row" data-id="L1">
                    <div className="th" style={{ background: "linear-gradient(135deg, oklch(0.42 0.14 280), oklch(0.22 0.08 280))" }} />
                    <div>
                      <div className="t">Vintage Eames LCW · walnut, original glides</div>
                      <div className="s"><span className="mp-tag">Mid-Century Trade</span> Buy now · 3 watchers · 4d ago</div>
                    </div>
                    <div className="right"><div className="price">$2,400</div><div className="meta-r"><span className="pill-state live">● Live</span></div></div>
                  </div>
                  <div className="lr-row active" data-id="L2">
                    <div className="th" style={{ background: "linear-gradient(135deg, oklch(0.32 0.05 240), oklch(0.18 0.02 240))" }} />
                    <div>
                      <div className="t">1989 Testarossa · Nero / Bordeaux, 41k mi</div>
                      <div className="s"><span className="mp-tag">Ferrari Frenzy</span> Auction · 12 bids · 1 ISO match</div>
                    </div>
                    <div className="right"><div className="price">$184,000</div><div className="meta-r"><span className="pill-state live">● Live</span> · 1h 47m</div></div>
                  </div>
                  <div className="lr-row" data-id="L3">
                    <div className="th" style={{ background: "linear-gradient(135deg, oklch(0.55 0.11 110), oklch(0.3 0.08 110))" }} />
                    <div>
                      <div className="t">Kapital Century Denim selvedge · size M</div>
                      <div className="s"><span className="mp-tag">Heritage Denim</span> Buy now · 1 offer</div>
                    </div>
                    <div className="right"><div className="price">$640</div><div className="meta-r"><span className="pill-state live">● Live</span></div></div>
                  </div>
                </div>
              </div>

              <div className="sub-panel" data-sub-panel="listings-drafts">
                <div className="privacy-banner">{ICON_LOCK}Private — drafts are only visible to you until published.</div>
                <div className="lr-list">
                  <div className="lr-row" data-id="L4">
                    <div className="th" style={{ background: "linear-gradient(135deg, oklch(0.62 0.04 60), oklch(0.4 0.03 60))" }} />
                    <div>
                      <div className="t">Herman Miller Aeron · size B, posture-fit</div>
                      <div className="s"><span className="mp-tag">Mid-Century Trade</span> Last edited 2d ago</div>
                    </div>
                    <div className="right"><div className="price">$520</div><div className="meta-r"><span className="pill-state draft">Draft</span></div></div>
                  </div>
                </div>
              </div>

              <div className="sub-panel" data-sub-panel="listings-sold">
                <div className="privacy-banner">{ICON_INFO}Public history — buyers can see your sold record on your profile.</div>
                <div className="lr-list">
                  <div className="lr-row" data-id="L5">
                    <div className="th" style={{ background: "linear-gradient(135deg, oklch(0.5 0.1 195), oklch(0.28 0.06 200))" }} />
                    <div>
                      <div className="t">PSA 9 Blastoise Base Set · 1999</div>
                      <div className="s"><span className="mp-tag">Graded &amp; Holo</span> Sold 11 days ago to <b>cardvault_22</b></div>
                    </div>
                    <div className="right"><div className="price">$2,200</div><div className="meta-r"><span className="pill-state sold">Sold</span></div></div>
                  </div>
                  <div className="lr-row" data-id="L6">
                    <div className="th" style={{ background: "linear-gradient(135deg, oklch(0.45 0.16 25), oklch(0.2 0.07 25))" }} />
                    <div>
                      <div className="t">1990 348 ts · Rosso Corsa, books &amp; tools</div>
                      <div className="s"><span className="mp-tag">Ferrari Frenzy</span> Auction ended · no bids met reserve</div>
                    </div>
                    <div className="right"><div className="price">$78,000</div><div className="meta-r"><span className="pill-state ended">Ended</span></div></div>
                  </div>
                </div>
              </div>
            </div>

            {/* PURCHASES */}
            <div className="section-panel" data-section-panel="purchases">
              <div className="lp-head">
                <div>
                  <div className="lp-title">Purchases</div>
                  <div className="lp-sub">Things I&apos;ve bought across my marketplaces.</div>
                </div>
              </div>
              <div className="sub-panel active">
                <div className="purchase-summary">
                  <div className="ps-stat"><div className="v">$2,070</div><div className="l">Spent in 2026</div></div>
                  <div className="ps-stat"><div className="v">2</div><div className="l">Orders this year</div></div>
                  <div className="ps-stat"><div className="v">$1,035</div><div className="l">Avg. order</div></div>
                  <div className="ps-stat"><div className="v">★ 5.0</div><div className="l">Avg. seller rating</div></div>
                </div>
                <div className="lh">
                  <div className="lh-l">
                    <button className="ftr on">All time</button>
                    <button className="ftr">2026</button>
                    <button className="ftr">2025</button>
                    <button className="ftr">Earlier</button>
                  </div>
                  <div className="lh-r"><button className="ftr">Sort: Recent ▾</button></div>
                </div>
                <div className="lr-list-label">2026 — 2 orders</div>
                <div className="lr-list">
                  <div className="lr-row active" data-id="P4">
                    <div className="th" style={{ background: "linear-gradient(135deg, oklch(0.62 0.04 60), oklch(0.4 0.03 60))" }} />
                    <div>
                      <div className="t">Vitra Eames Plywood Lounge · birch</div>
                      <div className="s"><span className="mp-tag">Mid-Century Trade</span> from <b>Helen B.</b> · delivered Mar 12</div>
                    </div>
                    <div className="right"><div className="price">$1,850</div><div className="meta-r"><span className="pill-state delivered">Delivered</span></div></div>
                  </div>
                  <div className="lr-row" data-id="P5">
                    <div className="th" style={{ background: "linear-gradient(135deg, oklch(0.42 0.14 280), oklch(0.22 0.08 280))" }} />
                    <div>
                      <div className="t">Noguchi Akari 1A · paper lantern</div>
                      <div className="s"><span className="mp-tag">Mid-Century Trade</span> from <b>moma_estate</b> · delivered Feb 04</div>
                    </div>
                    <div className="right"><div className="price">$220</div><div className="meta-r"><span className="pill-state delivered">Delivered</span></div></div>
                  </div>
                </div>
              </div>
            </div>

            {/* ISO */}
            <div className="section-panel" data-section-panel="iso">
              <div className="lp-head">
                <div>
                  <div className="lp-title">In Search Of</div>
                  <div className="lp-sub">Public requests posted to marketplaces — sellers can reply.</div>
                </div>
                <div className="lp-act"><button className="chip-btn on">+ Post a wanted</button></div>
              </div>

              <div className="sub-panel active" data-sub-panel="iso-open">
                <div className="privacy-banner">{ICON_INFO}Public — visible to every seller in that marketplace.</div>
                <div className="cfg-list">
                  <div className="cfg-row active" data-id="I1">
                    <div>
                      <div className="cr-t">1987–1991 Testarossa · Nero or Rosso Corsa <span className="pill-state live" style={{ marginLeft: 6, verticalAlign: 1 }}>● Open</span></div>
                      <div className="cr-q"><span className="chip-q">Ferrari Frenzy</span><span className="chip-q">$150k–$200k</span><span className="chip-q">Classiche cert preferred</span><span className="chip-q">&lt;50k miles</span></div>
                      <div className="cr-meta"><span><span className="new-ct">3 new replies</span> · 47 views</span><span>Posted 8d ago</span></div>
                    </div>
                    <div className="cr-act"><button className="chip-btn" style={{ fontSize: 11, padding: "5px 9px" }}>Edit</button></div>
                  </div>
                  <div className="cfg-row" data-id="I2">
                    <div>
                      <div className="cr-t">Kapital Century selvedge · size M, raw <span className="pill-state live" style={{ marginLeft: 6, verticalAlign: 1 }}>● Open</span></div>
                      <div className="cr-q"><span className="chip-q">Heritage Denim</span><span className="chip-q">Up to $700</span><span className="chip-q">Unwashed</span></div>
                      <div className="cr-meta"><span>0 replies yet · 12 views</span><span>Posted yesterday</span></div>
                    </div>
                    <div className="cr-act"><button className="chip-btn" style={{ fontSize: 11, padding: "5px 9px" }}>Edit</button></div>
                  </div>
                </div>
              </div>

              <div className="sub-panel" data-sub-panel="iso-matches">
                <div className="privacy-banner">{ICON_INFO}Public — sellers see your wanted ad and reply.</div>
                <div className="match-group">
                  <div className="mg-head">
                    <div>
                      <div className="mg-t">1987–1991 Testarossa · Nero / Rosso</div>
                      <div className="mg-q">Ferrari Frenzy · $150–200k</div>
                    </div>
                    <span className="mg-ct">3 new</span>
                  </div>
                  <div className="mg-body">
                    <div className="lr-row" data-id="IM1">
                      <div className="th" style={{ background: "linear-gradient(135deg, oklch(0.32 0.05 240), oklch(0.18 0.02 240))" }} />
                      <div>
                        <div className="t">1989 Testarossa · Nero, 41k mi · Classiche</div>
                        <div className="s">From <b>Marco C.</b> · ✓ matches all 4 · 8m ago</div>
                      </div>
                      <div className="right"><div className="price">asks $184k</div><div className="meta-r"><span className="pill-state new">● New</span></div></div>
                    </div>
                    <div className="lr-row" data-id="IM2">
                      <div className="th" style={{ background: "linear-gradient(135deg, oklch(0.45 0.16 25), oklch(0.2 0.07 25))" }} />
                      <div>
                        <div className="t">1990 Testarossa · Rosso Corsa, 33k mi</div>
                        <div className="s">From <b>James W.</b> · ⚠ no Classiche · 2d ago</div>
                      </div>
                      <div className="right"><div className="price">asks $169k</div><div className="meta-r" style={{ color: "var(--ink-soft)" }}>View →</div></div>
                    </div>
                    <div className="lr-row" data-id="IM3">
                      <div className="th" style={{ background: "linear-gradient(135deg, oklch(0.4 0.1 25), oklch(0.22 0.05 25))" }} />
                      <div>
                        <div className="t">Atelier Rossini · 2 candidates</div>
                        <div className="s">From <b>Atelier Rossini</b> · workshop reply · 5d</div>
                      </div>
                      <div className="right"><div className="price">on request</div><div className="meta-r" style={{ color: "var(--ink-soft)" }}>View →</div></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sub-panel" data-sub-panel="iso-closed">
                <div className="dp-empty" style={{ height: "auto", padding: "60px 20px", background: "#fff", border: "1px dashed var(--line)", borderRadius: 10 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx={12} cy={12} r={10} />
                    <path d="M8 12l3 3 5-6" />
                  </svg>
                  <div>No closed wanted ads yet. Closed ads stay here for your records.</div>
                </div>
              </div>
            </div>

            {/* ALERTS */}
            <div className="section-panel" data-section-panel="alerts">
              <div className="lp-head">
                <div>
                  <div className="lp-title">Alerts</div>
                  <div className="lp-sub">Saved searches that ping you when something matches.</div>
                </div>
                <div className="lp-act"><button className="chip-btn on">+ New alert</button></div>
              </div>

              <div className="sub-panel active" data-sub-panel="alerts-active">
                <div className="privacy-banner">{ICON_LOCK}Private — saved searches that run in the background.</div>
                <div className="cfg-list">
                  <div className="cfg-row active" data-id="A1">
                    <div>
                      <div className="cr-t">F40 under $3M · any color</div>
                      <div className="cr-q"><span className="chip-q">Ferrari Frenzy</span><span className="chip-q">≤ $3,000,000</span><span className="chip-q">Auction or buy-now</span></div>
                      <div className="cr-meta"><span><span className="new-ct">2 new matches</span> · 4 this month</span><span>Notify: instant</span></div>
                    </div>
                    <div className="cr-act"><button className="chip-btn" style={{ fontSize: 11, padding: "5px 9px" }}>Edit</button><div className="switch" data-switch /></div>
                  </div>
                  <div className="cfg-row" data-id="A2">
                    <div>
                      <div className="cr-t">PSA 10 Charizard · Base Set 1999 only</div>
                      <div className="cr-q"><span className="chip-q">Graded &amp; Holo</span><span className="chip-q">$15k–$22k</span><span className="chip-q">Sealed slab</span></div>
                      <div className="cr-meta"><span><span className="new-ct">5 new matches</span></span><span>Notify: daily digest</span></div>
                    </div>
                    <div className="cr-act"><button className="chip-btn" style={{ fontSize: 11, padding: "5px 9px" }}>Edit</button><div className="switch" data-switch /></div>
                  </div>
                  <div className="cfg-row" data-id="A3">
                    <div>
                      <div className="cr-t">Eames LCW · walnut, original glides</div>
                      <div className="cr-q"><span className="chip-q">Mid-Century Trade</span><span className="chip-q">≤ $3,500</span></div>
                      <div className="cr-meta"><span>1 new match · 2 this month</span><span>Notify: instant</span></div>
                    </div>
                    <div className="cr-act"><button className="chip-btn" style={{ fontSize: 11, padding: "5px 9px" }}>Edit</button><div className="switch" data-switch /></div>
                  </div>
                </div>
              </div>

              <div className="sub-panel" data-sub-panel="alerts-matches">
                <div className="match-group">
                  <div className="mg-head">
                    <div>
                      <div className="mg-t">F40 under $3M</div>
                      <div className="mg-q">Ferrari Frenzy</div>
                    </div>
                    <span className="mg-ct">2 new</span>
                  </div>
                  <div className="mg-body">
                    <div className="lr-row" data-id="AM1">
                      <div className="th" style={{ background: "linear-gradient(135deg, oklch(0.62 0.16 25), oklch(0.35 0.12 25))" }} />
                      <div>
                        <div className="t">1991 Ferrari F40 · LM ext., 14k km</div>
                        <div className="s">Just listed · 23 bids · 3h ago</div>
                      </div>
                      <div className="right"><div className="price">$2.95M</div><div className="meta-r"><span className="pill-state new">● New</span></div></div>
                    </div>
                    <div className="lr-row" data-id="AM2">
                      <div className="th" style={{ background: "linear-gradient(135deg, oklch(0.4 0.1 25), oklch(0.22 0.05 25))" }} />
                      <div>
                        <div className="t">1989 F40 · Rosso, books &amp; tools</div>
                        <div className="s">Buy now · listed yesterday</div>
                      </div>
                      <div className="right"><div className="price">$2.78M</div><div className="meta-r"><span className="pill-state new">● New</span></div></div>
                    </div>
                  </div>
                </div>
                <div className="match-group">
                  <div className="mg-head">
                    <div>
                      <div className="mg-t">PSA 10 Charizard · Base Set</div>
                      <div className="mg-q">Graded &amp; Holo · $15k–$22k</div>
                    </div>
                    <span className="mg-ct">5 new</span>
                  </div>
                  <div className="mg-body">
                    <div className="lr-row" data-id="AM3">
                      <div className="th" style={{ background: "linear-gradient(135deg, oklch(0.5 0.1 195), oklch(0.28 0.06 200))" }} />
                      <div>
                        <div className="t">PSA 10 Charizard · pop 121</div>
                        <div className="s">Auction · 18 bids · ends 2d</div>
                      </div>
                      <div className="right"><div className="price">$18,500</div><div className="meta-r"><span className="pill-state new">● New</span></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detail pane */}
          <div className="pane-detail">
            <div className="dp-card" data-detail="L2">
              <div className="dp-head">
                <div>
                  <div className="dp-t">1989 Testarossa · Nero / Bordeaux</div>
                  <div className="dp-s">Ferrari Frenzy · Auction · ends in 1h 47m</div>
                </div>
                <div className="dp-act"><button className="chip-btn">Edit</button><button className="chip-btn on">Promote</button></div>
              </div>
              <div className="dp-meta">
                <div className="m-stat"><div className="v">12</div><div className="l">Bids</div></div>
                <div className="m-stat"><div className="v">$184k</div><div className="l">Top bid</div></div>
                <div className="m-stat"><div className="v">847</div><div className="l">Views</div></div>
                <div className="m-stat"><div className="v">1</div><div className="l">ISO match</div></div>
              </div>
              <div className="dp-section-t" style={{ marginTop: 0 }}>Buyer activity · live</div>
              <div className="activity-list">
                <div>● Marco C. raised to $184,000 · 8m ago</div>
                <div>● James W. messaged about Classiche cert · 14m ago</div>
                <div>● 3 new watchers since this morning</div>
              </div>
            </div>

            <div className="dp-card" data-detail="P4" hidden>
              <div className="dp-head">
                <div>
                  <div className="dp-t">Vitra Eames Plywood Lounge · birch</div>
                  <div className="dp-s">Mid-Century Trade · from Helen B. · delivered Mar 12, 2026</div>
                </div>
                <div className="dp-act"><button className="chip-btn">Leave review</button><button className="chip-btn">Buy again</button></div>
              </div>
              <div className="dp-meta three">
                <div className="m-stat"><div className="v">$1,850</div><div className="l">Paid</div></div>
                <div className="m-stat"><div className="v">8 days</div><div className="l">In transit</div></div>
                <div className="m-stat"><div className="v">★★★★★</div><div className="l">Your review</div></div>
              </div>
              <div className="dp-section-t" style={{ marginTop: 0 }}>Order summary</div>
              <div className="criteria-grid">
                <div className="ck">Item</div><div className="cv">Vitra Eames LCW · birch, 1958 reissue</div>
                <div className="ck">Condition</div><div className="cv">Excellent — minor wear consistent with age</div>
                <div className="ck">Shipped</div><div className="cv">Mar 04 via blanket-wrap freight</div>
                <div className="ck">Delivered</div><div className="cv">Mar 12 · signed for at door</div>
                <div className="ck">Receipt</div><div className="cv" style={{ color: "var(--blue-ink)" }}>Download invoice →</div>
              </div>
            </div>

            <div className="dp-card" data-detail="I1" hidden>
              <div className="dp-head">
                <div>
                  <div className="dp-t">1987–1991 Testarossa · Nero / Rosso</div>
                  <div className="dp-s">Ferrari Frenzy · Public wanted · 8 days live · 47 views</div>
                </div>
                <div className="dp-act"><button className="chip-btn">Edit</button><button className="chip-btn">Close</button><button className="chip-btn danger">Delete</button></div>
              </div>
              <div className="dp-meta three">
                <div className="m-stat"><div className="v">3</div><div className="l">Replies</div></div>
                <div className="m-stat"><div className="v">47</div><div className="l">Views</div></div>
                <div className="m-stat"><div className="v">67d</div><div className="l">Until expiry</div></div>
              </div>
              <div className="dp-section-t" style={{ marginTop: 0 }}>Criteria</div>
              <div className="criteria-grid">
                <div className="ck">Year</div><div className="cv">1987 – 1991</div>
                <div className="ck">Color</div><div className="cv"><span className="chip-q">Nero</span><span className="chip-q">Rosso Corsa</span></div>
                <div className="ck">Mileage</div><div className="cv">Under 50,000 mi</div>
                <div className="ck">Budget</div><div className="cv">$150,000 – $200,000</div>
              </div>
            </div>

            <div className="dp-card" data-detail="A1" hidden>
              <div className="dp-head">
                <div>
                  <div className="dp-t">F40 under $3M · any color</div>
                  <div className="dp-s">Ferrari Frenzy · 6 weeks active · saved search</div>
                </div>
                <div className="dp-act"><button className="chip-btn">Edit</button><button className="chip-btn">Pause</button><button className="chip-btn danger">Delete</button></div>
              </div>
              <div className="dp-meta three">
                <div className="m-stat"><div className="v">2</div><div className="l">New this week</div></div>
                <div className="m-stat"><div className="v">11</div><div className="l">All-time</div></div>
                <div className="m-stat"><div className="v">Instant</div><div className="l">Frequency</div></div>
              </div>
              <div className="dp-section-t" style={{ marginTop: 0 }}>Criteria</div>
              <div className="criteria-grid">
                <div className="ck">Marketplace</div><div className="cv">Ferrari Frenzy</div>
                <div className="ck">Model</div><div className="cv">F40 only</div>
                <div className="ck">Max price</div><div className="cv">$3,000,000</div>
                <div className="ck">Notify</div><div className="cv">Push + email · instant</div>
              </div>
            </div>

            <div className="dp-card" data-detail="placeholder" hidden>
              <div className="dp-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <rect x={3} y={3} width={18} height={18} rx={2} />
                  <path d="M8 12h8M8 8h8M8 16h5" />
                </svg>
                <div>Select a row to see its full detail here.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
