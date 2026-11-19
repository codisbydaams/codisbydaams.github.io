# CODIS-V72 — القطع والخامات (يُنفَّذ من mh_build.py بنطاقه). كل الأصول CC0 من makehuman_system_assets (packs/*.json: license CC0).
J = lambda *p: os.path.join(SYS, *p)

# --- الجلد: 3 خامات أصلية لكل جنس (فاتح/حنطي/داكن) — الدرجات الوسيطة تمزج بين اثنتين وقت العرض (التفاصيل من الصورة نفسها، لا لون مسطح)
SKIN = {
    'male':   [('light', 'young_caucasian_male/young_lightskinned_male_diffuse.png'), ('mid', 'young_asian_male/young_lightskinned_male_diffuse3.png'), ('dark', 'young_african_male/young_darkskinned_male_diffuse.png')],
    'female': [('light', 'young_caucasian_female/young_lightskinned_female_diffuse.png'), ('mid', 'young_asian_female/young_lightskinned_female_diffuse3.png'), ('dark', 'young_african_female/young_darkskinned_female_diffuse.png')],
}
# تفاصيل الجلد الدقيقة (مسام) — خريطة عمودية متكررة مولّدة (gen_textures.py)
meta['skinDetail'] = img('skin.detail', Image.open(os.path.join(GEN, 'skin_detail_nrm.png')).convert('RGB'), 'jpeg', 90, 512)

# --- العينان: مجسّم high-poly + 7 قزحيات أصلية (512)
pe = proxy('eyes', 'eyes', J('eyes', 'high-poly'))
# القرنية: المثلثات التي تقع UV كلها داخل البقعة الشفافة (أسفل يمين الخامة) ⇒ مادة شفافة لامعة مستقلة فوق القزحية
_uv = BLOBS_GET(pe['uv']).astype(np.float64) / 65535; _t = BLOBS_GET(pe['tri']).reshape(-1, 3)
_c = ((_uv[:, 0] - .935) ** 2 + (_uv[:, 1] - .066) ** 2) < .075 ** 2
_isC = _c[_t].all(1)
pe['triBall'] = blob('eyes.triBall', _t[~_isC].astype(np.uint16).ravel()); pe['triCornea'] = blob('eyes.triCornea', _t[_isC].astype(np.uint16).ravel())
print('eyes: cornea tris', int(_isC.sum()), 'ball', int((~_isC).sum()))
EYES = ['brown', 'brownlight', 'green', 'bluegreen', 'blue', 'lightblue', 'grey']
meta['eyeTex'] = {e: img('eye.' + e, Image.open(J('eyes', 'materials', e + '_eye.png')).convert('RGB'), 'jpeg', 88, 512) for e in EYES}

# --- الحواجب 12 + الرموش (شفافية؛ اللون وقت العرض)
for i in range(1, 13):
    n = 'eyebrow%03d' % i
    proxy('brows', n, J('eyebrows', n), tex=img('tex.' + n, gray_alpha(J('eyebrows', n, n + '.png'), 256), 'webp', 86, alpha=True))
for n in ('eyelashes01', 'eyelashes02'):
    proxy('lashes', n, J('eyelashes', n), tex=img('tex.' + n, gray_alpha(J('eyelashes', n, n + '.png'), 256), 'webp', 86, alpha=True))

# --- الشعر: 10 تسريحات أصلية (رمادي + شفافية ⇒ لون الشعر المختار)
HAIR_TEX = {'afro01': 'afro_diffuse.png'}
for n in ('short01', 'short02', 'short03', 'short04', 'afro01', 'bob01', 'bob02', 'braid01', 'long01', 'ponytail01'):
    t = HAIR_TEX.get(n, n + '_diffuse.png')
    proxy('hair', n, J('hair', n), tex=img('tex.' + n, gray_alpha(J('hair', n, t), 1024), 'webp', 84, alpha=True))

# --- الملابس والحذاء (الخامة + العمودية)
def cloth(n, folder, size=1024, clip_y=None):
    m = read_mhmat(J(folder, n, n + '.mhmat'))
    d = Image.open(J(folder, n, m['diffuseTexture'])).convert('RGB')
    fix = os.path.join(GEN, n + '_diffuse.png')       # نسخة منظّفة (بلا شعار) إن وُجدت
    if os.path.exists(fix): d = Image.open(fix).convert('RGB')
    t = img('tex.' + n, d, 'jpeg', 82, size)
    nm = img('nrm.' + n, Image.open(J(folder, n, m['normalmapTexture'])).convert('RGB'), 'jpeg', 85, size) if m.get('normalmapTexture') else None
    return proxy('cloth', n, J(folder, n), tex=t, extra={'nrm': nm} if nm else None, clip_y=clip_y)
cloth('male_casualsuit06', 'clothes')
cloth('female_casualsuit01', 'clothes')
cloth('shoes06', 'clothes', 512, clip_y=.105)
cloth('shoes02', 'clothes', 512, clip_y=.105)

# --- القشور المولّدة (اللحية/القصّات القصيرة): mh_shells.py
exec(open(os.path.join(os.path.dirname(GEN), '..', 'mh_shells.py'), encoding='utf-8').read())

# --- الجلد (بعد الأقنعة): الخامات الأصلية فيها شعر قصير مرسوم على الفروة/أعلى الجبهة ⇒ يظهر كبقعة بنية مع أي تسريحة منبتها أعلى.
#     نستبدل تلك المنطقة بلون جبهة الخامة نفسها (مع إبقاء تفاصيلها الدقيقة)؛ الشعر بعدها من التسريحة المختارة فقط.
from PIL import ImageDraw as _IDraw
def _uv_mask(vmask, S):
    im = Image.new('L', (S, S), 0); d = _IDraw.Draw(im)
    uvp = BASE_VT[B_uv]; mv = vmask[B_vmap]
    for t in B_tri:
        m = mv[t].mean()
        if m <= .01: continue
        d.polygon([(uvp[k][0] * S, (1 - uvp[k][1]) * S) for k in t], fill=int(m * 255))
    return np.asarray(im).astype(np.float32) / 255
_bald = np.clip(np.maximum(scalp * 1.0, _ss(_eye[1] + .42, _eye[1] + .62, y) * (_hw > .5)), 0, 1) * ~ear
_fore = ((_hw > .8) & (z > 1.0) & (ax < .3) & (y > _eye[1] + .18) & (y < _eye[1] + .36)).astype(float)
meta['skins'] = {}
for sex, lst in SKIN.items():
    meta['skins'][sex] = []
    for k, f in lst:
        im = Image.open(J('skins', f)).convert('RGB'); S = im.size[0]
        A = np.asarray(im).astype(np.float32)
        if not hasattr(_uv_mask, 'c') or _uv_mask.c[0] != S:
            from scipy.ndimage import gaussian_filter as _gf
            M = _gf(_uv_mask(_bald, S), S / 400); F = _uv_mask(_fore, S) > .5; _uv_mask.c = (S, M, F)
        S_, M, F = _uv_mask.c
        fc = A[F].mean(0); L = A.mean(2, keepdims=True); Lf = A[F].mean()
        from scipy.ndimage import gaussian_filter as _gf
        hf = A - np.dstack([_gf(A[..., c], 6) for c in range(3)])
        bald = fc[None, None, :] + hf * .55
        A = A * (1 - M[..., None]) + bald * M[..., None]
        meta['skins'][sex].append({'id': k, 'img': img('skin.%s.%s' % (sex, k), Image.fromarray(np.clip(A, 0, 255).astype(np.uint8)), 'jpeg', 80, 1536)})
        if k == 'light' and sex == 'male': Image.fromarray(np.clip(A, 0, 255).astype(np.uint8)).resize((1024, 1024)).save(os.path.join(GEN, '..', 'skin_bald_dbg.png'))
