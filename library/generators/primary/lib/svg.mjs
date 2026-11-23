// Spec → self-contained animated SVG (CSS keyframes in a <style>, class-scoped by icon name).
//
// Colour: every painted element carries the light-scheme hex as a presentation attribute (works as <img>,
// in react-native-svg and anywhere <style> is stripped) AND a role class whose rule is
// `fill: var(--antz-<role>, <hex>)`. CSS rules beat presentation attributes, so inline in a themed page the
// --antz-* variables win; with no variables set the fallback hex applies.
//
// Trim paths: a trimmed stroke gets pathLength="1"; the visible part [ts, te] is
// stroke-dasharray: (te − ts) 2 and stroke-dashoffset: −ts, keyframed with the same easing as the Lottie `tm`.
import { ROLES, EASE_CSS, normKeys, varies, hasTrim } from './model.mjs';

const f = (v) => +(+v).toFixed(4);

function shapeEl(s, attrs) {
  if (s.path) return `<path d="${s.path}"${attrs}/>`;
  if (s.rect) { const [x, y, w, h, rx = 0] = s.rect; return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"${rx ? ` rx="${f(rx)}"` : ''}${attrs}/>`; }
  if (s.circle) { const [cx, cy, r] = s.circle; return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"${attrs}/>`; }
  if (s.ellipse) { const [cx, cy, rx, ry] = s.ellipse; return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}"${attrs}/>`; }
  throw new Error('unknown shape ' + JSON.stringify(s));
}

const tf = (k) => `translate(${f(k.x)}px,${f(k.y)}px) rotate(${f(k.r)}deg) scale(${f(k.s)})`;
const dash = (k) => ({ a: `${f(k.te - k.ts)} 2`, o: f(-k.ts) });

export function toSvg(spec, light) {
  const P = `antz-p-${spec.name}`;
  const css = [];
  const defs = [];
  const usedRoles = new Set();
  const cls = (kind, role) => { usedRoles.add(`${kind}:${role}`); return `${P}-${kind}-${role}`; };

  const paintAttrs = (l, trimCls, k0) => {
    const a = [];
    const c = [];
    if (l.fill) {
      const R = ROLES[l.fill];
      a.push(`fill="${light[R.scheme]}"`);
      if (R.opacity !== 1) a.push(`fill-opacity="${R.opacity}"`);
      c.push(cls('f', l.fill));
    } else a.push('fill="none"');
    if (l.stroke) {
      const R = ROLES[l.stroke];
      a.push(`stroke="${light[R.scheme]}"`, `stroke-width="${l.strokeWidth ?? 3}"`, 'stroke-linecap="round"', 'stroke-linejoin="round"');
      if (R.opacity !== 1) a.push(`stroke-opacity="${R.opacity}"`);
      c.push(cls('s', l.stroke));
    }
    if (trimCls) {
      const d = dash(k0);
      a.push('pathLength="1"', `stroke-dasharray="${d.a}"`, `stroke-dashoffset="${d.o}"`);
      c.push(trimCls);
    }
    return ` class="${c.join(' ')}" ${a.join(' ')}`;
  };

  const anim = (l) => {
    if (!l.anim) return { open: '', close: '' };
    const k = normKeys(l.anim.keys);
    const id = `${P}-${l.id}`;
    const hasT = ['x', 'y', 'r', 's'].some((p) => varies(k, p));
    const hasO = varies(k, 'o');
    const k0 = k[0];
    if (!hasT && !hasO && k0.o === 1 && !(k0.x || k0.y || k0.r || k0.s !== 1)) return { open: '', close: '' };
    if (hasT || hasO) {
      const frames = k.map((q) => `${f(q.t * 100)}%{${hasT ? `transform:${tf(q)};` : ''}${hasO ? `opacity:${f(q.o)}` : ''}}`).join('');
      css.push(`@keyframes ${id}{${frames}}`);
    }
    const [ox, oy] = l.anim.origin || [24, 24];
    if (hasT || hasO) css.push(`.${id}{${hasT ? `transform-box:view-box;transform-origin:${f(ox)}px ${f(oy)}px;` : ''}animation:${id} ${spec.loopMs}ms ${EASE_CSS} infinite}`);
    // Rest pose as attributes so a static render (reduced motion, no <style>) shows frame 0.
    const restT = k0.x || k0.y || k0.r || k0.s !== 1
      ? ` transform="translate(${f(ox + k0.x)} ${f(oy + k0.y)}) rotate(${f(k0.r)}) scale(${f(k0.s)}) translate(${f(-ox)} ${f(-oy)})"`
      : '';
    const restO = k0.o !== 1 ? ` opacity="${f(k0.o)}"` : '';
    return { open: `<g class="${id}"${restT}${restO}>`, close: '</g>' };
  };

  const trim = (l) => {
    if (!l.anim) return null;
    const k = normKeys(l.anim.keys);
    if (!hasTrim(k)) return null;
    const id = `${P}-${l.id}-trim`;
    const frames = k.map((q) => { const d = dash(q); return `${f(q.t * 100)}%{stroke-dasharray:${d.a};stroke-dashoffset:${d.o}}`; }).join('');
    css.push(`@keyframes ${id}{${frames}}`);
    css.push(`.${id}{animation:${id} ${spec.loopMs}ms ${EASE_CSS} infinite}`);
    return { cls: id, k0: k[0] };
  };

  const clip = (l) => {
    if (!l.clip) return { open: '', close: '' };
    const id = `${P}-${l.id}-clip`;
    defs.push(`<clipPath id="${id}"><path d="${l.clip}"/></clipPath>`);
    return { open: `<g clip-path="url(#${id})">`, close: '</g>' };
  };

  const emit = (l, ind) => {
    const c = clip(l);
    const a = anim(l);
    const tr = l.children ? null : trim(l);
    const body = l.children
      ? l.children.map((ch) => emit(ch, ind + '  ')).join('\n')
      : l.shapes.map((s) => `${ind}  ${shapeEl(s, paintAttrs(l, tr?.cls, tr?.k0))}`).join('\n');
    if (!c.open && !a.open) return l.children ? body : body.replace(/^ {2}/gm, '');
    // clipMoves: the clip is inside the animated group, so it moves with it. Otherwise the content moves
    // inside a static clip.
    const [o1, o2, c2, c1] = l.clipMoves ? [a.open, c.open, c.close, a.close] : [c.open, a.open, a.close, c.close];
    return `${ind}${o1}${o2}\n${body}\n${ind}${c2}${c1}`;
  };

  const body = spec.layers.map((l) => emit(l, '  ')).join('\n');

  const roleCss = [...usedRoles].sort().map((u) => {
    const [kind, role] = u.split(':');
    const R = ROLES[role];
    return `.${P}-${kind}-${role}{${kind === 'f' ? 'fill' : 'stroke'}:var(${R.cssVar},${light[R.scheme]})}`;
  });
  const style = [
    ...roleCss,
    ...css,
    `@media (prefers-reduced-motion:reduce){.${P} *{animation:none!important}}`,
  ].join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" class="${P}" role="img" aria-label="${spec.label}">
<style>
${style}
</style>
${defs.length ? `<defs>${defs.join('')}</defs>\n` : ''}${body}
</svg>
`;
}
