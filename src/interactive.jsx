import React, { useEffect, useRef, useState } from 'react';
import { Hand, MessageCircle, Minus, Plus } from 'lucide-react';

// Shared custom-size fields. All dimensions are in inches, like the rest of the site.
export const CUSTOM_LIMITS = { l: [24, 96], w: [12, 84], t: [0.5, 14] };
const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));
export const tidyCustom = c => ({ l: clamp(+c.l || 0, CUSTOM_LIMITS.l), w: clamp(+c.w || 0, CUSTOM_LIMITS.w), t: c.t === '' || c.t == null ? '' : clamp(+c.t || 0, CUSTOM_LIMITS.t) });
export const customText = c => `${c.l}″ × ${c.w}″${c.t ? ` × ${c.t}″ thick` : ''}`;

export function CustomSizeFields({ value, onChange, withThickness = false }) {
  const field = (key, label) => <label className="custom-field">
    <span>{label}</span>
    <span className="custom-input"><input type="number" inputMode="decimal" step={key === 't' ? 0.5 : 1} min={CUSTOM_LIMITS[key][0]} max={CUSTOM_LIMITS[key][1]}
      value={value[key]} placeholder={key === 't' ? 'Optional' : ''}
      onChange={e => onChange({ ...value, [key]: e.target.value })}
      onBlur={() => onChange(tidyCustom(value))}/><em>″</em></span>
  </label>;
  return <div className="custom-size">
    {field('l', 'Length')}{field('w', 'Width')}{withThickness && field('t', 'Thickness')}
    <p>Made to your measurements, in inches.</p>
  </div>;
}

// Press test: demonstrates the "Pressure relief" claim from the Raku packaging. Press and hold the mattress:
// the same load either spreads across a wide area (foam) or stays concentrated (a hard surface).
// The figures are illustrative shapes, not measurements.
const PRESS = { foam: { sink: 30, spread: 92 }, hard: { sink: 3, spread: 26 } };
const TOP = 78, THICK = 92, VIEW_H = 250;
// Phones get a narrower drawing so the mattress is thicker on screen; spreads scale with the width.
const useNarrow = () => {
  const q = '(max-width: 650px)';
  const [narrow, setNarrow] = useState(() => window.matchMedia(q).matches);
  useEffect(() => { const m = window.matchMedia(q), on = () => setNarrow(m.matches); m.addEventListener('change', on); return () => m.removeEventListener('change', on); }, []);
  return narrow;
};
export function PressTest() {
  const W = useNarrow() ? 380 : 600;
  const [mode, setMode] = useState('foam');
  const [x, setX] = useState(0.5); // pressed position, as a fraction of the width
  const [depth, setDepth] = useState(0);
  const [pressing, setPressing] = useState(false);
  const d = useRef(0), target = useRef(0), raf = useRef(null), svg = useRef(null);
  const step = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = target.current;
    d.current += (t - d.current) * (reduce ? 1 : t > d.current ? 0.09 : 0.14);
    if (Math.abs(t - d.current) < 0.003) d.current = t;
    setDepth(d.current);
    raf.current = d.current === t ? null : requestAnimationFrame(step);
  };
  const animateTo = t => { target.current = t; if (!raf.current) raf.current = requestAnimationFrame(step); };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const toX = e => { const r = svg.current.getBoundingClientRect(); return Math.min(0.93, Math.max(0.07, (e.clientX - r.left) / r.width)); };
  const press = e => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} setX(toX(e)); setPressing(true); animateTo(1); };
  const release = () => { setPressing(false); animateTo(0); };
  const { sink } = PRESS[mode], spread = PRESS[mode].spread * W / 600, hardSpread = PRESS.hard.spread * W / 600;
  const curve = px => Math.exp(-((px - x * W) ** 2) / (2 * spread ** 2));
  const xs = Array.from({ length: 61 }, (_, i) => i * W / 60);
  const surface = xs.map(px => `${px.toFixed(1)},${(TOP + depth * sink * curve(px)).toFixed(1)}`).join(' L');
  const layer = xs.map(px => `${px.toFixed(1)},${(TOP + THICK * 0.45 + depth * sink * 0.45 * curve(px)).toFixed(1)}`).join(' L');
  // The same load: a wider spread means a lower peak. Pressure is relative to the hard surface's peak.
  const pressure = px => depth * (hardSpread / spread) * curve(px);
  const peak = depth * hardSpread / spread;
  const handTop = (TOP - 56 + depth * sink) / VIEW_H * 100;
  return <div className="press">
    <div className="toggle-pills" role="group" aria-label="Surface">
      <button className={mode === 'foam' ? 'active' : ''} onClick={() => { setMode('foam'); release(); }}>Raku mattress</button>
      <button className={mode === 'hard' ? 'active' : ''} onClick={() => { setMode('hard'); release(); }}>Hard surface</button>
    </div>
    <div className={`press-stage ${pressing ? 'pressing' : ''}`}>
      <svg ref={svg} viewBox={`-4 0 ${W + 8} ${VIEW_H}`} role="img" aria-label={`${mode === 'foam' ? 'Raku mattress' : 'Hard surface'}, press and hold to test`}
        onPointerDown={press} onPointerMove={e => pressing && setX(toX(e))} onPointerUp={release} onPointerLeave={() => pressing && release()} onPointerCancel={release}>
        <defs>
          <pattern id="press-quilt" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#fbf6ef"/><path d="M0 0L22 22M22 0L0 22" stroke="#e9d5c4" strokeWidth="1.2"/></pattern>
          <pattern id="press-board" width="60" height="12" patternUnits="userSpaceOnUse"><rect width="60" height="12" fill="#e4d4ca"/><path d="M0 6h60" stroke="#d7c3b6" strokeWidth="1"/></pattern>
        </defs>
        <path d={`M0,${TOP + THICK} L${surface} L${W},${TOP + THICK} Z`} fill={mode === 'foam' ? 'url(#press-quilt)' : 'url(#press-board)'} stroke="#6b1c19" strokeWidth="2.5" strokeLinejoin="round"/>
        {mode === 'foam' && <path d={`M0,${layer.split(' L')[0].split(',')[1]} L${layer}`} fill="none" stroke="#6b1c1933" strokeWidth="1.5" strokeDasharray="5 5"/>}
        <rect x="0" y={TOP + THICK} width={W} height="10" fill="#6b1c19" rx="3"/>
        {xs.slice(0, 60).map((px, i) => <rect key={i} x={px} y={TOP + THICK + 26} width={W / 60 + 0.5} height="22" fill="#e86c1e" opacity={Math.min(1, pressure(px + W / 120)).toFixed(3)}/>)}
        <rect x="0" y={TOP + THICK + 26} width={W} height="22" fill="none" stroke="#6b1c1929" rx="4"/>
        <text x="0" y={TOP + THICK + 66} className="press-axis">Pressure under the hand</text>
      </svg>
      <span className="press-hand" style={{ left: `${x * 100}%`, top: `${handTop}%` }} aria-hidden="true"><Hand size={44} strokeWidth={1.6}/></span>
      {!pressing && depth === 0 && <span className="press-hint">Press and hold anywhere on the {mode === 'foam' ? 'mattress' : 'surface'}</span>}
    </div>
    <div className="press-readout" aria-live="polite">
      <div><small>PEAK PRESSURE</small><span className="press-meter"><i style={{ width: `${Math.max(4, peak * 100)}%` }}/></span><strong>{depth < 0.05 ? '—' : peak > 0.6 ? 'High' : 'Low'}</strong></div>
      <div><small>SPREAD</small><span className="press-meter"><i style={{ width: `${depth < 0.05 ? 4 : PRESS[mode].spread / PRESS.foam.spread * 100}%` }}/></span><strong>{depth < 0.05 ? '—' : mode === 'foam' ? 'Wide' : 'Narrow'}</strong></div>
    </div>
    <p className="press-caption">{mode === 'foam' ? 'The mattress gives way and spreads the same load over a wider area, so no single point takes all the pressure.' : 'A hard surface barely moves, so the load stays on one small spot.'}</p>
    <button className="text-button press-keyboard" onClick={() => { setX(0.5); setPressing(true); animateTo(1); setTimeout(() => { setPressing(false); animateTo(0); }, 1400); }}>Press the centre for me</button>
  </div>;
}

// Room fit planner: a floor plan drawn to scale, with the bed against the top wall and the walking space around it.
// Walking-space guidance (at least 24″) is general room-planning advice, not a product claim.
const COMFORT = 24;
const stepper = (label, value, set, min, max) => <div className="room-stepper">
  <span>{label}</span>
  <div><button aria-label={`Decrease ${label}`} onClick={() => set(Math.max(min, +(value - 0.5).toFixed(1)))}><Minus size={15}/></button>
    <input type="number" inputMode="decimal" min={min} max={max} step="0.5" value={value} onChange={e => set(e.target.value === '' ? '' : Math.min(max, Math.max(0, +e.target.value)))} onBlur={() => set(Math.min(max, Math.max(min, +value || min)))}/>
    <button aria-label={`Increase ${label}`} onClick={() => set(Math.min(max, +(+value + 0.5).toFixed(1)))}><Plus size={15}/></button></div>
  <em>ft</em>
</div>;

// The room size is held by the page, so Find your fit's matches and enquiries can include it.
export function RoomPlanner({ sizes, bed, room, setRoom, onPickSize, onMakeCustom, onEnquire }) {
  const roomL = room.l, roomW = room.w;
  const setRoomL = l => setRoom(r => ({ ...r, l })), setRoomW = w => setRoom(r => ({ ...r, w }));
  const L = Math.round((+roomL || 0) * 12), Wd = Math.round((+roomW || 0) * 12);
  const side = (Wd - bed.w) / 2, foot = L - bed.l, tightest = Math.min(side, foot);
  const status = tightest < 0 ? ['too-big', 'Too big for this room', 'This size is larger than the room.']
    : tightest < COMFORT ? ['tight', 'Tight fit', `It fits, but walking space is under ${COMFORT}″.`]
    : ['good', 'Fits comfortably', `At least ${COMFORT}″ of walking space on each side and at the foot.`];
  const largest = [...sizes].reverse().find(s => (Wd - s.w) / 2 >= COMFORT && L - s.l >= COMFORT);
  // A made-to-measure size that leaves comfortable walking space, within standard mattress proportions.
  const custom = { l: Math.max(72, Math.min(84, L - COMFORT)), w: Math.max(30, Math.min(78, Wd - COMFORT * 2)), t: '' };
  const customFits = (Wd - custom.w) / 2 >= COMFORT && L - custom.l >= COMFORT;
  const pad = Math.max(L, Wd) * 0.06, fs = Math.max(L, Wd) / 22;
  const bx = (Wd - bed.w) / 2;
  return <div className="room">
    <div className="room-inputs">
      {stepper('Room length', roomL, setRoomL, 6, 30)}
      {stepper('Room width', roomW, setRoomW, 6, 30)}
      <p className="room-size-note">{roomL} ft × {roomW} ft = {L}″ × {Wd}″</p>
    </div>
    <div className="room-plan">
      <svg viewBox={`${-pad} ${-pad} ${Wd + pad * 2} ${L + pad * 2}`} role="img" aria-label={`Floor plan: ${bed.name} bed in a ${roomL} by ${roomW} foot room`}>
        <rect x="0" y="0" width={Wd} height={L} fill="#f8f2e7" stroke="#202020" strokeWidth={Math.max(L, Wd) / 90}/>
        <g className={`room-bed ${status[0]}`}>
          <rect x={bx} y="0" width={bed.w} height={bed.l} rx={fs * 0.6}/>
          <rect x={bx + bed.w * 0.08} y={bed.l * 0.04} width={bed.w * (bed.w >= 48 ? 0.38 : 0.84)} height={bed.l * 0.1} rx={fs * 0.4} className="room-pillow"/>
          {bed.w >= 48 && <rect x={bx + bed.w * 0.54} y={bed.l * 0.04} width={bed.w * 0.38} height={bed.l * 0.1} rx={fs * 0.4} className="room-pillow"/>}
          <text x={bx + bed.w / 2} y={bed.l * 0.58} fontSize={fs} textAnchor="middle" className="room-label">{bed.name}</text>
          <text x={bx + bed.w / 2} y={bed.l * 0.58 + fs * 1.3} fontSize={fs * 0.75} textAnchor="middle" className="room-sub">{bed.l}″ × {bed.w}″</text>
        </g>
        {side > 0 && <g className="room-gap"><line x1="0" x2={bx} y1={bed.l / 2} y2={bed.l / 2}/><text x={bx / 2} y={bed.l / 2 - fs * 0.4} fontSize={fs * 0.8} textAnchor="middle">{Math.round(side)}″</text></g>}
        {side > 0 && <g className="room-gap"><line x1={bx + bed.w} x2={Wd} y1={bed.l / 2} y2={bed.l / 2}/><text x={bx + bed.w + side / 2} y={bed.l / 2 - fs * 0.4} fontSize={fs * 0.8} textAnchor="middle">{Math.round(side)}″</text></g>}
        {foot > 0 && <g className="room-gap"><line x1={Wd / 2} x2={Wd / 2} y1={bed.l} y2={L}/><text x={Wd / 2 + fs * 0.4} y={bed.l + foot / 2 + fs * 0.3} fontSize={fs * 0.8}>{Math.round(foot)}″</text></g>}
      </svg>
    </div>
    <div className={`room-status ${status[0]}`} aria-live="polite"><strong>{status[1]}</strong><span>{status[2]}</span></div>
    <ul className="room-facts">
      <li><span>Largest standard size with {COMFORT}″ walking space</span><strong>{largest ? `${largest.name} (${largest.dims})` : 'None — try a custom size'}</strong></li>
      <li><span>Made to fit this room</span><strong>{customFits ? `${custom.l}″ × ${custom.w}″ custom` : `No size leaves ${COMFORT}″ of walking space in this room`}</strong></li>
    </ul>
    <div className="room-actions">
      {largest && largest.name !== bed.name && <button className="text-button" onClick={() => onPickSize(largest.name)}>Use {largest.name}</button>}
      {customFits && <button className="text-button" onClick={() => onMakeCustom(custom)}>Make it fit my room</button>}
      <button className="button button-dark" onClick={() => onEnquire(`${roomL} ft × ${roomW} ft room`)}><MessageCircle size={17}/> Enquire for this room</button>
    </div>
  </div>;
}
