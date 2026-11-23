// Tiny stack VM for make.fun ISA v1. Node 22, stdlib only.
// Reads /input/<id>/{program,input}.bin, writes /output/<id>/{stdout.bin,exit.txt}.
import { existsSync as ex, mkdirSync as mk, readdirSync as rd, readFileSync as rf, writeFileSync as wf } from 'node:fs';
import { join } from 'node:path';
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input', O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
function run(p, inp) {
  const m = new Int32Array(256), s = new Int32Array(256), c = new Int32Array(64);
  let sp = 0, cp = 0, pc = 0, st = 0, ip = 0;
  const o = [];
  let e = -1;
  const s16 = a => ((p[a + 1] | (p[a + 2] << 8)) << 16) >> 16;
  outer: while (1) {
    if (st >= 1e6) { e = 10; break; }
    if (pc < 0 || pc >= p.length) { e = 9; break; }
    const op = p[pc];
    let n = 0;
    if (op === 1) n = 1;
    else if (op === 2) n = 4;
    else if (op === 48 || op === 49 || op === 50 || op === 51) n = 2;
    else if (op <= 7 || (op >= 16 && op <= 34) || op === 52 || op === 64 || op === 65 || (op >= 80 && op <= 83)) n = 0;
    else { e = 5; break; }
    if (pc + 1 + n > p.length) { e = 9; break; }
    st++;
    let nx = pc + 1 + n;
    switch (op) {
      case 0: e = 0; break outer;
      case 1:
        if (sp >= 256) { e = 3; break outer; }
        s[sp++] = (p[pc + 1] << 24) >> 24; break;
      case 2:
        if (sp >= 256) { e = 3; break outer; }
        s[sp++] = p[pc + 1] | (p[pc + 2] << 8) | (p[pc + 3] << 16) | (p[pc + 4] << 24); break;
      case 3:
        if (sp < 1) { e = 2; break outer; }
        sp--; break;
      case 4:
        if (sp < 1) { e = 2; break outer; }
        if (sp >= 256) { e = 3; break outer; }
        s[sp] = s[sp - 1]; sp++; break;
      case 5:
        if (sp < 2) { e = 2; break outer; }
        { const t = s[sp - 1]; s[sp - 1] = s[sp - 2]; s[sp - 2] = t; } break;
      case 6:
        if (sp < 2) { e = 2; break outer; }
        if (sp >= 256) { e = 3; break outer; }
        s[sp] = s[sp - 2]; sp++; break;
      case 7:
        if (sp < 3) { e = 2; break outer; }
        { const t = s[sp - 3]; s[sp - 3] = s[sp - 2]; s[sp - 2] = s[sp - 1]; s[sp - 1] = t; } break;
      case 16:
        if (sp < 2) { e = 2; break outer; }
        s[sp - 2] = (s[sp - 2] + s[sp - 1]) | 0; sp--; break;
      case 17:
        if (sp < 2) { e = 2; break outer; }
        s[sp - 2] = (s[sp - 2] - s[sp - 1]) | 0; sp--; break;
      case 18:
        if (sp < 2) { e = 2; break outer; }
        s[sp - 2] = Math.imul(s[sp - 2], s[sp - 1]); sp--; break;
      case 19: {
        if (sp < 2) { e = 2; break outer; }
        const b = s[sp - 1], a = s[sp - 2];
        if (!b) { e = 4; break outer; }
        s[sp - 2] = (a / b) | 0; sp--; break;
      }
      case 20: {
        if (sp < 2) { e = 2; break outer; }
        const b = s[sp - 1], a = s[sp - 2];
        if (!b) { e = 4; break outer; }
        s[sp - 2] = a % b; sp--; break;
      }
      case 21: {
        if (sp < 2) { e = 2; break outer; }
        const b = s[sp - 1] >>> 0, a = s[sp - 2] >>> 0;
        if (!b) { e = 4; break outer; }
        s[sp - 2] = (a / b) | 0; sp--; break;
      }
      case 22: {
        if (sp < 2) { e = 2; break outer; }
        const b = s[sp - 1] >>> 0, a = s[sp - 2] >>> 0;
        if (!b) { e = 4; break outer; }
        s[sp - 2] = (a % b) | 0; sp--; break;
      }
      case 23:
        if (sp < 1) { e = 2; break outer; }
        s[sp - 1] = (-s[sp - 1]) | 0; break;
      case 24:
        if (sp < 2) { e = 2; break outer; }
        s[sp - 2] &= s[sp - 1]; sp--; break;
      case 25:
        if (sp < 2) { e = 2; break outer; }
        s[sp - 2] |= s[sp - 1]; sp--; break;
      case 26:
        if (sp < 2) { e = 2; break outer; }
        s[sp - 2] ^= s[sp - 1]; sp--; break;
      case 27:
        if (sp < 1) { e = 2; break outer; }
        s[sp - 1] = ~s[sp - 1]; break;
      case 28:
        if (sp < 2) { e = 2; break outer; }
        s[sp - 2] <<= s[sp - 1] & 31; sp--; break;
      case 29:
        if (sp < 2) { e = 2; break outer; }
        s[sp - 2] >>= s[sp - 1] & 31; sp--; break;
      case 30:
        if (sp < 2) { e = 2; break outer; }
        s[sp - 2] = (s[sp - 2] >>> (s[sp - 1] & 31)) | 0; sp--; break;
      case 32:
        if (sp < 2) { e = 2; break outer; }
        s[sp - 2] = s[sp - 2] === s[sp - 1] ? 1 : 0; sp--; break;
      case 33:
        if (sp < 2) { e = 2; break outer; }
        s[sp - 2] = s[sp - 2] < s[sp - 1] ? 1 : 0; sp--; break;
      case 34:
        if (sp < 2) { e = 2; break outer; }
        s[sp - 2] = (s[sp - 2] >>> 0) < (s[sp - 1] >>> 0) ? 1 : 0; sp--; break;
      case 48:
        nx = pc + 3 + s16(pc); break;
      case 49:
        if (sp < 1) { e = 2; break outer; }
        if (s[--sp] === 0) nx = pc + 3 + s16(pc); break;
      case 50:
        if (sp < 1) { e = 2; break outer; }
        if (s[--sp] !== 0) nx = pc + 3 + s16(pc); break;
      case 51:
        if (cp >= 64) { e = 7; break outer; }
        c[cp++] = pc + 3; nx = p[pc + 1] | (p[pc + 2] << 8); break;
      case 52:
        if (!cp) { e = 8; break outer; }
        nx = c[--cp]; break;
      case 64: {
        if (sp < 1) { e = 2; break outer; }
        const a = s[sp - 1];
        if (a < 0 || a > 255) { e = 6; break outer; }
        s[sp - 1] = m[a]; break;
      }
      case 65: {
        if (sp < 2) { e = 2; break outer; }
        const a = s[sp - 1], v = s[sp - 2];
        if (a < 0 || a > 255) { e = 6; break outer; }
        m[a] = v; sp -= 2; break;
      }
      case 80: {
        if (sp < 1) { e = 2; break outer; }
        const t = String(s[--sp]);
        if (o.length + t.length > 65536) { e = 11; break outer; }
        for (let i = 0; i < t.length; i++) o.push(t.charCodeAt(i));
        break;
      }
      case 81:
        if (sp < 1) { e = 2; break outer; }
        if (o.length + 1 > 65536) { e = 11; break outer; }
        o.push(s[--sp] & 255); break;
      case 82:
        if (sp >= 256) { e = 3; break outer; }
        s[sp++] = ip < inp.length ? inp[ip++] : -1; break;
      case 83:
        if (sp < 1) { e = 2; break outer; }
        e = s[--sp] & 255; break outer;
      default: e = 5; break outer;
    }
    pc = nx;
  }
  return [Buffer.from(o), e];
}
for (const d of rd(I, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!d.isDirectory()) continue;
  const dir = join(I, d.name), pp = join(dir, 'program.bin');
  if (!ex(pp)) continue;
  const [out, code] = run(rf(pp), ex(join(dir, 'input.bin')) ? rf(join(dir, 'input.bin')) : Buffer.alloc(0));
  const od = join(O, d.name);
  mk(od, { recursive: true });
  wf(join(od, 'stdout.bin'), out);
  wf(join(od, 'exit.txt'), code + '\n');
}
