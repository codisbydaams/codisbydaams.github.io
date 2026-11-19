"""CODIS-V73 — متتبّع أشعة صغير (BVH + Möller–Trumbore) بـ numba لخبز الإطباق المحيطي (AO) والسماكة (للنفاذية)
   ونصف قطر الرأس (لمولّد الشعر). حتمي (بذور ثابتة)."""
import numpy as np
from numba import njit, prange


def build_bvh(V, T, leaf=4):
    """V (n,3) float64، T (m,3) int ⇒ مصفوفات العقد + ترتيب المثلثات."""
    cen = V[T].mean(1); bmin_t = V[T].min(1); bmax_t = V[T].max(1)
    order = np.arange(len(T))
    nodes_min, nodes_max, left, right, start, count = [], [], [], [], [], []
    stack = [(0, len(T), -1, 0)]
    # بناء تكراري: (s, e, parent, side)
    def new_node():
        nodes_min.append(None); nodes_max.append(None); left.append(-1); right.append(-1); start.append(0); count.append(0); return len(left) - 1
    root = new_node(); work = [(root, 0, len(T))]
    while work:
        nd, s, e = work.pop()
        idx = order[s:e]
        nodes_min[nd] = bmin_t[idx].min(0); nodes_max[nd] = bmax_t[idx].max(0)
        if e - s <= leaf:
            start[nd] = s; count[nd] = e - s; continue
        c = cen[idx]; ext = c.max(0) - c.min(0); ax = int(np.argmax(ext))
        srt = np.argsort(c[:, ax], kind='stable'); order[s:e] = idx[srt]
        m = (s + e) // 2
        l = new_node(); r = new_node(); left[nd] = l; right[nd] = r
        work.append((l, s, m)); work.append((r, m, e))
    return (np.array(nodes_min), np.array(nodes_max), np.array(left, np.int64), np.array(right, np.int64),
            np.array(start, np.int64), np.array(count, np.int64), order.astype(np.int64))


@njit(cache=True, fastmath=True)
def _hit_tri(o, d, a, b, c, tmax):
    e1x = b[0] - a[0]; e1y = b[1] - a[1]; e1z = b[2] - a[2]
    e2x = c[0] - a[0]; e2y = c[1] - a[1]; e2z = c[2] - a[2]
    px = d[1] * e2z - d[2] * e2y; py = d[2] * e2x - d[0] * e2z; pz = d[0] * e2y - d[1] * e2x
    det = e1x * px + e1y * py + e1z * pz
    if abs(det) < 1e-12: return -1.0
    inv = 1.0 / det
    tx = o[0] - a[0]; ty = o[1] - a[1]; tz = o[2] - a[2]
    u = (tx * px + ty * py + tz * pz) * inv
    if u < 0.0 or u > 1.0: return -1.0
    qx = ty * e1z - tz * e1y; qy = tz * e1x - tx * e1z; qz = tx * e1y - ty * e1x
    v = (d[0] * qx + d[1] * qy + d[2] * qz) * inv
    if v < 0.0 or u + v > 1.0: return -1.0
    t = (e2x * qx + e2y * qy + e2z * qz) * inv
    if t <= 1e-7 or t >= tmax: return -1.0
    return t


@njit(cache=True, fastmath=True)
def _box(o, invd, mn, mx, tmax):
    t0 = 0.0; t1 = tmax
    for k in range(3):
        a = (mn[k] - o[k]) * invd[k]; b = (mx[k] - o[k]) * invd[k]
        if a > b: a, b = b, a
        if a > t0: t0 = a
        if b < t1: t1 = b
        if t0 > t1: return False
    return True


@njit(cache=True, fastmath=True)
def trace(o, d, V, T, nmin, nmax, left, right, start, count, order, tmax):
    """أقرب تقاطع ⇒ المسافة (أو −1)."""
    invd = np.empty(3)
    for k in range(3): invd[k] = 1.0 / d[k] if abs(d[k]) > 1e-12 else 1e12
    stack = np.empty(96, np.int64); sp = 0; stack[0] = 0; sp = 1; best = tmax; hit = False
    while sp > 0:
        sp -= 1; nd = stack[sp]
        if not _box(o, invd, nmin[nd], nmax[nd], best): continue
        if left[nd] < 0:
            for i in range(start[nd], start[nd] + count[nd]):
                t = T[order[i]]
                h = _hit_tri(o, d, V[t[0]], V[t[1]], V[t[2]], best)
                if h > 0: best = h; hit = True
        else:
            stack[sp] = left[nd]; sp += 1; stack[sp] = right[nd]; sp += 1
    return best if hit else -1.0


@njit(cache=True, fastmath=True)
def _onb(n):
    if abs(n[0]) > .9: a = np.array([0.0, 1.0, 0.0])
    else: a = np.array([1.0, 0.0, 0.0])
    t = np.cross(a, n); t /= np.sqrt((t * t).sum()); b = np.cross(n, t)
    return t, b


@njit(cache=True, parallel=True, fastmath=True)
def bake_ao(P, N, V, T, nmin, nmax, left, right, start, count, order, nray, dist, seed):
    """AO لكل نقطة: نصف كرة موزونة بجيب التمام؛ الاحتجاب يتلاشى مع المسافة (dist)."""
    out = np.empty(len(P))
    for i in prange(len(P)):
        np.random.seed(seed + i)
        n = N[i]; t, b = _onb(n); o = P[i] + n * 2e-4; acc = 0.0
        for k in range(nray):
            u1 = np.random.random(); u2 = np.random.random(); r = np.sqrt(u1); ph = 6.283185307 * u2
            x = r * np.cos(ph); y = r * np.sin(ph); z = np.sqrt(max(0.0, 1 - u1))
            d = t * x + b * y + n * z
            h = trace(o, d, V, T, nmin, nmax, left, right, start, count, order, dist)
            if h > 0: acc += 1.0 - (h / dist) ** 2
        out[i] = 1.0 - acc / nray
    return out


@njit(cache=True, parallel=True, fastmath=True)
def bake_thickness(P, N, V, T, nmin, nmax, left, right, start, count, order, nray, dist, seed):
    """السماكة: متوسط مسافة الخروج من الجانب الآخر (أشعة داخل مخروط حول −العمودي)."""
    out = np.empty(len(P))
    for i in prange(len(P)):
        np.random.seed(seed + i)
        n = -N[i]; t, b = _onb(n); o = P[i] + n * 2e-4; acc = 0.0
        for k in range(nray):
            u1 = np.random.random() * .5; u2 = np.random.random(); r = np.sqrt(u1); ph = 6.283185307 * u2
            x = r * np.cos(ph); y = r * np.sin(ph); z = np.sqrt(max(0.0, 1 - u1))
            d = t * x + b * y + n * z
            h = trace(o, d, V, T, nmin, nmax, left, right, start, count, order, dist)
            acc += h if h > 0 else dist
        out[i] = acc / nray
    return out


@njit(cache=True, parallel=True, fastmath=True)
def cast_many(O, D, V, T, nmin, nmax, left, right, start, count, order, tmax):
    out = np.empty(len(O))
    for i in prange(len(O)): out[i] = trace(O[i], D[i], V, T, nmin, nmax, left, right, start, count, order, tmax)
    return out


class Tracer:
    def __init__(self, V, T):
        self.V = np.ascontiguousarray(V, np.float64); self.T = np.ascontiguousarray(T, np.int64)
        self.b = build_bvh(self.V, self.T)
    def ao(self, P, N, nray=192, dist=.12, seed=73):
        return bake_ao(np.ascontiguousarray(P, np.float64), np.ascontiguousarray(N, np.float64), self.V, self.T, *self.b, nray, dist, seed)
    def thickness(self, P, N, nray=48, dist=.06, seed=74):
        return bake_thickness(np.ascontiguousarray(P, np.float64), np.ascontiguousarray(N, np.float64), self.V, self.T, *self.b, nray, dist, seed)
    def cast(self, O, D, tmax=10.0):
        return cast_many(np.ascontiguousarray(O, np.float64), np.ascontiguousarray(D, np.float64), self.V, self.T, *self.b, tmax)
