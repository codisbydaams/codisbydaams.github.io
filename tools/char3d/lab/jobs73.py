"""مولّد مهام لقطات المختبر V73: py -3 jobs73.py <out.json> <preset>"""
import json, sys
def spec(sex, **k):
    s = {'sex': sex, 'build': 'avg', 'height': .5, 'targets': {}, 'skin': {'a': 'light', 'b': 'mid', 'mix': .35, 'tint': '#ffffff', 'under': '#ffffff', 'red': .6},
         'eye': {'tex': 'brown'}, 'lashes': 'eyelashes01' if sex == 'male' else 'eyelashes02', 'brows': [], 'hair': [], 'beard': [], 'shoes': 'shoes05',
         'hairColor': '#3a2418', 'browColor': '#2a1a10', 'beardColor': '#2a1a10'}
    s.update(k); return s
VIEWS = {'body': [('front', 0, 0, 'body', [600, 1000]), ('a45', -.785, 0, 'body', [600, 1000]), ('side', 1.5708, 0, 'body', [600, 1000]), ('back', 3.1416, 0, 'body', [600, 1000])],
         'face': [('front', 0, 1, 'face', [800, 800]), ('a45', -.6, 1, 'face', [800, 800]), ('side', -1.5708, 1, 'face', [800, 800])],
         'eyes': [('eyes', 0, 1, 'eyes', [900, 560])]}
def jobs(name, sp, views):
    return [{'name': name + '_' + vv + '_' + v[0], 'cfg': sp, 'yaw': v[1], 'z': v[2], 'focus': v[3], 'size': v[4]} for vv in views for v in VIEWS[vv]]
if __name__ == '__main__':
    out = []; pre = sys.argv[2] if len(sys.argv) > 2 else 'base'
    if pre == 'base':
        for sex in ('male', 'female'): out += jobs(sex, spec(sex), ['body', 'face', 'eyes'])
    elif pre.startswith('hair'):
        import struct
        import gzip; _b = gzip.decompress(open('../dist/codis_char_v73.bin', 'rb').read()); meta = json.loads(_b[8:8 + struct.unpack('<I', _b[4:8])[0]])
        only = pre.split(':')[1].split(',') if ':' in pre else None
        for sex in ('male', 'female'):
            for pid in meta['hair'][sex]:
                if only and pid.split('_', 2)[2] not in only: continue
                sp = spec(sex, hair=[pid], scalpMask='scalp_' + pid, scalpTint=.85, buzz=meta.get('hairInfo', {}).get(pid, {}).get('buzz', .35))
                for vn, yaw in (('front', 0), ('a45', -.75), ('side', -1.5708), ('back', 2.6)):
                    out.append({'name': pid + '_' + vn, 'cfg': sp, 'yaw': yaw, 'z': 1, 'focus': 'hair', 'size': [420, 420]})
    json.dump(out, open(sys.argv[1], 'w'))
