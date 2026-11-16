/* GEO SURFER AI - coordinate parsing/formatting (WGS84). Accepts decimal degrees and DMS. */
(function (root) {
  function norm(s) {
    return String(s)
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/٫/g, '.').replace(/[،;]/g, ',')
      .replace(/[′’´‘]/g, "'").replace(/[″”“]/g, '"').replace(/''/g, '"')
      .replace(/[º˚]/g, '°').replace(/[−–—]/g, '-')
      .replace(/شمال/g, 'N').replace(/جنوب/g, 'S').replace(/شرق/g, 'E').replace(/غرب/g, 'W')
      .trim();
  }
  function one(seg) {
    const letter = (seg.match(/[NSEW]/i) || [''])[0].toUpperCase();
    const nums = seg.match(/\d+(?:\.\d+)?/g);
    if (!nums || nums.length > 3) return null;
    const [d, m = 0, s = 0] = nums.map(Number);
    if (m >= 60 || s >= 60) return null;
    if (nums.length > 1 && !Number.isInteger(d)) return null;
    let v = d + m / 60 + s / 3600;
    if (/^\s*-/.test(seg) || letter === 'S' || letter === 'W') v = -v;
    return { v, letter };
  }
  function parse(input) {
    const s = norm(input);
    if (!s) return null;
    let parts;
    if (/[NSEW]/i.test(s)) {
      parts = /^\s*[NSEW]/i.test(s) ? s.split(/[,\s]*(?=[NSEW])/i) : s.split(/(?<=[NSEW])[,\s]*/i);
    } else if (/[°'"]/.test(s)) {
      parts = s.split(/(?<=["'°])\s*[,\s]\s*(?=[-+]?\d)/);
    } else {
      parts = s.split(/[,\s]+/);
    }
    parts = parts.map(p => p.trim()).filter(Boolean);
    if (parts.length !== 2) return null;
    const a = one(parts[0]), b = one(parts[1]);
    if (!a || !b) return null;
    let lat, lon;
    const isLat = x => x.letter === 'N' || x.letter === 'S';
    const isLon = x => x.letter === 'E' || x.letter === 'W';
    if (isLat(a) && isLon(b)) { lat = a.v; lon = b.v; }
    else if (isLon(a) && isLat(b)) { lon = a.v; lat = b.v; }
    else if (!a.letter && !b.letter) { lat = a.v; lon = b.v; }
    else return null;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
    return { lat, lon };
  }
  function dms(v, pos, neg) {
    const h = v < 0 ? neg : pos, a = Math.abs(v);
    let d = Math.floor(a), m = Math.floor((a - d) * 60);
    let s = Math.round(((a - d) * 60 - m) * 60 * 100) / 100;
    if (s >= 60) { s = 0; m++; } if (m >= 60) { m = 0; d++; }
    return d + '°' + String(m).padStart(2, '0') + "'" + s.toFixed(2).padStart(5, '0') + '"' + h;
  }
  const api = { parse, dms, fmtDMS: (lat, lon) => dms(lat, 'N', 'S') + ' ' + dms(lon, 'E', 'W'),
                fmtDD: (lat, lon) => lat.toFixed(6) + ', ' + lon.toFixed(6) };
  if (typeof module !== 'undefined') module.exports = api; else root.Coords = api;
})(this);
