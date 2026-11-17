"""CODIS-V63 (3.50.0) — «بحوزتك»: الصناديق المغلقة داخل «العناصر» (لا قسم مستقل) · القسائم المملوكة فقط · مجموعات بلا عناوين
   · هوية الصندوق المملوك = رسمة القسيمة السابقة، وللقسيمة كوبون جديد · المتجر بلا صف صناديق ولا «لديك ×N – فتح» + أيقونة صندوق بجانب الجواهر
   · الصندوق المجاني جائزة واحدة (بطاقة/جواهر 1–10/فضة 1–20) ولوحة نتيجة مقروءة · مكافآت التقدم بمراحل (+9) وعرض بصري موحّد. فوق ناتج patch_v62 وقبل boot_split.
  py -3 tools/patch_v63.py <ناتج patch_v62 قبل boot_split> <out>   (sh tools/rebuild_v63.sh)"""
import sys, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V63' not in s and 'CODIS-V62' in s, 'needs v62 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:200])
    s = s.replace(old, new)
def fn_span(text, name, start=0):
    k = text.find('\nfunction ' + name + '(', start)
    assert k >= 0, ('no function', name)
    k += 1
    assert text.find('\nfunction ' + name + '(', k) < 0, ('duplicate function', name)
    eol = text.find('\n', k); first = text[k:eol]
    if first.rstrip().endswith('}') and first.count('{') == first.count('}'):
        return k, eol + 1
    e = text.find('\n}\n', k); assert e > 0, name
    return k, e + 3
def replfn(name, new):
    global s
    a, b = fn_span(s, name); s = s[:a] + new + s[b:]
# كتل v63_fns.js: تعليقات سابقة + الدالة
FN = {}
lines = rd('identity', 'v63_fns.js').split('\n'); buf = []; i = 0
while i < len(lines):
    ln = lines[i]
    m = re.match(r'function (\w+)\(', ln)
    if m:
        body = [ln]
        if not (ln.rstrip().endswith('}') and ln.count('{') == ln.count('}')):
            i += 1
            while lines[i] != '}': body.append(lines[i]); i += 1
            body.append('}')
        FN[m.group(1)] = '\n'.join(buf + body) + '\n'; buf = []
    elif ln.startswith('/*') and i > 0: buf.append(ln)
    else: buf = []
    i += 1
assert len(FN) == 8, sorted(FN)

# ===================== 1) الصندوق المجاني: جائزة واحدة =====================
fb = rd('identity', 'v63_freebox.js')
a = s.index('  function lastMs(now){'); b = s.index('  return { status, pool, claim, DAY };')
assert s.count('  function lastMs(now){') == 1 and a < b and b - a < 6000
s = s[:a] + fb + s[b:]
rep("<small>بطاقة مكافأة عشوائية + جواهر وفضة — مجاناً</small>", "<small>جائزة واحدة عشوائية: بطاقة أو جواهر أو فضة — مجاناً</small>")
rep("aria-label=\"الصندوق المجاني — اضغط لفتحه وخذ مكافأة\"", "aria-label=\"الصندوق المجاني — اضغط لفتحه وخذ جائزة واحدة\"")
replfn('codisFreeBoxOpen', FN['codisFreeBoxPrizeHtml'] + FN['codisFreeBoxOpen'])

# ===================== 2) مكافآت التقدم: مراحل + مقياس الأيام المكتملة =====================
rep("""name:'أول أسبوع ناجح', desc:'أنهِ أول أسبوع ينجح بتقييم CODIS الأسبوعي (نتيجة الأسبوع = مكافأة).', goal:1, metric:'weeklySuccess', icon:'calendar', rewards:Object.freeze([{ type:'gems', n:5 }]) }),""",
    """name:'أول أسبوع ناجح', desc:'أنهِ أول أسبوع ينجح بتقييم CODIS الأسبوعي (نتيجة الأسبوع = مكافأة).', goal:1, metric:'weeklySuccess', icon:'calendar', rewards:Object.freeze([{ type:'gems', n:10 }]) }),   /* CODIS-V63: 5 ← 10 (المعرّف نفسه: من استلمها يبقى مستلماً) */
  /* CODIS-V63: المراحل — كل مرحلة إنجاز مستقل بمعرّف ثابت واستلام يدوي. العدّ تراكمي بنفس المقاييس */
  Object.freeze({ id:'weeks_3', order:11, name:'3 أسابيع ناجحة', desc:'أنهِ 3 أسابيع ناجحة بتقييم CODIS الأسبوعي — العدّ تراكمي، والأسابيع الملغاة أو غير الناجحة لا تُحتسب.', goal:3, metric:'weeklySuccess', icon:'calendar', rewards:Object.freeze([{ type:'gems', n:50 }]) }),
  Object.freeze({ id:'weeks_10', order:12, name:'10 أسابيع ناجحة', desc:'أنهِ 10 أسابيع ناجحة بتقييم CODIS الأسبوعي — العدّ تراكمي، والأسابيع الملغاة أو غير الناجحة لا تُحتسب.', goal:10, metric:'weeklySuccess', icon:'calendar', rewards:Object.freeze([{ type:'gems', n:500 }]) }),""")
rep("""goal:25, metric:'opsDone', icon:'clipboard-check', rewards:Object.freeze([{ type:'gems', n:10 }]) }),""",
    """goal:25, metric:'opsDone', icon:'clipboard-check', rewards:Object.freeze([{ type:'gems', n:10 }]) }),
  Object.freeze({ id:'ops_tasks_75', order:21, name:'إكمال 75 مهمة', desc:'أكمل 75 مهمة بالكامل («خلصتها») من غرفة العمليات — المهام المنجزة جزئياً لا تُحتسب.', goal:75, metric:'opsDone', icon:'clipboard-check', rewards:Object.freeze([{ type:'gems', n:50 }]) }),
  Object.freeze({ id:'ops_tasks_250', order:22, name:'إكمال 250 مهمة', desc:'أكمل 250 مهمة بالكامل («خلصتها») من غرفة العمليات — المهام المنجزة جزئياً لا تُحتسب.', goal:250, metric:'opsDone', icon:'clipboard-check', rewards:Object.freeze([{ type:'gems', n:500 }]) }),""")
rep("""goal:25, metric:'learnDone', icon:'book', rewards:Object.freeze([{ type:'gems', n:10 }]) }),""",
    """goal:25, metric:'learnDone', icon:'book', rewards:Object.freeze([{ type:'gems', n:10 }]) }),
  Object.freeze({ id:'learn_items_75', order:31, name:'إكمال 75 عنصر تعلّم', desc:'أكمل 75 عنصراً تعليمياً بالكامل من غرفة الأستاذ — العناصر المنجزة جزئياً لا تُحتسب.', goal:75, metric:'learnDone', icon:'book', rewards:Object.freeze([{ type:'gems', n:50 }]) }),
  Object.freeze({ id:'learn_items_250', order:32, name:'إكمال 250 عنصر تعلّم', desc:'أكمل 250 عنصراً تعليمياً بالكامل من غرفة الأستاذ — العناصر المنجزة جزئياً لا تُحتسب.', goal:250, metric:'learnDone', icon:'book', rewards:Object.freeze([{ type:'gems', n:500 }]) }),
  Object.freeze({ id:'days_1', order:35, name:'أول يوم مكتمل', desc:'أكمل كل مهام يوم في غرفة العمليات، أو كل عناصر يوم في غرفة الأستاذ. الأيام الفارغة ويوم العطلة لا تُحتسب.', goal:1, metric:'daysDone', icon:'check', rewards:Object.freeze([{ type:'vouchers', tier:'bx1', n:5 }]) }),
  Object.freeze({ id:'days_3', order:36, name:'3 أيام مكتملة', desc:'أكمل 3 أيام بالكامل (كل مهام اليوم في غرفة العمليات أو كل عناصره في غرفة الأستاذ). اليوم نفسه لا يُحتسب مرتين.', goal:3, metric:'daysDone', icon:'check', rewards:Object.freeze([{ type:'vouchers', tier:'bx1', n:10 }]) }),
  Object.freeze({ id:'days_20', order:37, name:'20 يوماً مكتملاً', desc:'أكمل 20 يوماً بالكامل (كل مهام اليوم في غرفة العمليات أو كل عناصره في غرفة الأستاذ). الصناديق تنضاف مغلقة إلى «بحوزتك» ← العناصر.', goal:20, metric:'daysDone', icon:'trophy', rewards:Object.freeze([{ type:'boxes', tier:'bx1', n:5 }]) }),""")
rep("الصناديق تنضاف مغلقة إلى «بحوزتك».', goal:1, metric:'monthSuccess'", "الصناديق تنضاف مغلقة إلى «بحوزتك» ← العناصر.', goal:1, metric:'monthSuccess'")
rep("habitMonthClean:codisProgressHabitMonth, buildWeek:()=>codisProgressDailyWeek('build'), quitWeek:()=>codisProgressDailyWeek('quit'), monthSuccess:codisProgressMonthWins });",
    "habitMonthClean:codisProgressHabitMonth, buildWeek:()=>codisProgressDailyWeek('build'), quitWeek:()=>codisProgressDailyWeek('quit'), monthSuccess:codisProgressMonthWins, daysDone:codisProgressDaysDone });   /* CODIS-V63: + الأيام المكتملة */")
core = rd('identity', 'v63_core.js'); assert '</script' not in core and '<!--' not in core
rep("\nconst CODIS_PROGRESS = Object.freeze([", "\n/* ===== CODIS-V63 ===== */\n" + core + "\nconst CODIS_PROGRESS = Object.freeze([")
# تراجع عن «خلصتها» ⇒ إعادة تحقق لفتح اليوم نفسه (المهام/التعلّم/الأيام)
rep("if(newStatus === 'done'){ try{ CodisProgress.soon(); }catch(x){} }", "if(newStatus === 'done'){ try{ CodisProgress.soon(); }catch(x){} } else { try{ codisProgressTaskUndo(); }catch(x){} }", 2)
replfn('codisProgressRewardHtml', FN['codisProgressRewardHtml'])
rep("const a = s.def, rw = a.rewards.map(codisProgressRewardHtml).join('');", "const a = s.def, rw = (s.claimed ? codisProgressPaidRewards(a) : a.rewards).map(codisProgressRewardHtml).join('');   /* CODIS-V63: المستلَمة تعرض ما استُلم فعلاً */")
rep("' — مغلقة في «بحوزتك» ← الصناديق'", "' — مغلقة في «بحوزتك» ← العناصر'")

# ===================== 3) «بحوزتك»: الصناديق داخل العناصر · القسائم المملوكة فقط · بلا عناوين =====================
replfn('econOwnTotals', FN['econOwnTotals'])
replfn('econItemGroupHtml', FN['econItemGroupHtml'])
replfn('econOwnBoxesHtml', '')                      # V55 قديم غير مستعمل (قسم «البكجات المغلقة»)
replfn('econOwnOpenBox', '')                        # كان يخدم الدالة أعلاه فقط
rep("/* فتح بكج مغلق من «بحوزتك» مباشرة: نافذة الفتح نفسها (econBoxOpenFor) تظهر فوق الورقة، والورقة تبقى مفتوحة بحالتها */\n", "")
rep("empty:'ما عندك عناصر حالياً — أكياس الفضة وبطاقات تخطي العقوبة وبطاقات العطلة تطلع من البكجات.' });",
    "empty:'ما عندك عناصر حالياً — الصناديق المغلقة والقسائم وأكياس الفضة وبطاقات التخطي والعطلة تظهر هنا.' });")
replfn('econVouchersOwnHtml', FN['econVouchersOwnHtml'])
replfn('econVouchersMergeHtml', FN['econVouchersMergeHtml'])
rep("econItemRegister({ key:'vouchers', name:'قسائم الصناديق', icon:'voucher', order:40, count:()=>CodisVouchers.total(), html:()=>econVouchersMergeHtml(), action:null, empty:'ما عندك قسائم.' });",
    "econItemRegister({ key:'vouchers', name:'قسائم الصناديق', icon:'voucher', order:6, count:()=>CodisVouchers.total(), html:()=>econVouchersMergeHtml(), action:null, empty:'ما عندك قسائم.' });   /* CODIS-V63: بعد الصناديق مباشرة */")
rep("' مغلق إلى «بحوزتك» ← الصناديق'", "' مغلق إلى «بحوزتك» ← العناصر'")
# الصناديق المغلقة: الدالة والتسجيل الجديدان بـv63_ui.js
replfn('econOwnClosedHtml', '')
a = s.index("econOwnRegister({ key:'boxes', name:'الصناديق'"); b = s.index('\n', a) + 1
assert s.count("econOwnRegister({ key:'boxes'") == 1
s = s[:a] + s[b:]
rep("/* ---------- (2) «بحوزتك» ← الصناديق المغلقة ---------- */\n", "")
rep("/* «استخدام»: لا يفتح ولا يستهلك — ينقل إلى البكجات ويحدد بطاقة المستوى ويركّز زر «فتح» */\n", "")
replfn('econOwnUseBox', '')
replfn('econBoxPickSync', '')
replfn('econBoxMineHtml', '')
rep("/* صف «لديك» على بطاقة المستوى بقسم البكجات (يُستدعى من econBoxesHtml) */\n", "")
rep("/* «فتح» صندوق مملوك من بطاقة المستوى: أقدم صندوق", "/* «استخدام صندوق موجود» (نافذة الخيارين): أقدم صندوق")
rep("const opener = econOwnOpen ? (document.querySelector('#own-panel-boxes .own-bx-use') || document.getElementById('own-tab-boxes')) : document.querySelector('#eco-boxes .bx-own-chip, #eco-boxes .bx-buy');",
    "const opener = econOwnOpen ? (document.querySelector('#own-panel-items .own-bx-use') || document.getElementById('own-tab-items')) : (document.querySelector('#eco-boxes .bx-card.is-picked .bx-buy') || document.querySelector('#eco-boxes .bx-buy'));   /* CODIS-V63 */")

# ===================== 4) الهويتان: القسيمة الجديدة =====================
replfn('econVoucherArt', FN['econVoucherArt'])
rep("/* رسم القسيمة: تذكرة بحافة مثقّبة + مصغّر صندوق مستواها + شريط النغمة. SVG بلا فلاتر (آمن على WebKit)، عنصر صورة واحد للصندوق (مخزّن blob) */\n",
    "/* CODIS-V63: هوية التذكرة القديمة صارت للصندوق المغلق المملوك (econOwnedBoxArt)، وللقسيمة كوبون مستقل بلا صندوق */\n")

# ===================== 5) المتجر: لا صف صناديق ولا «لديك ×N – فتح» + أيقونة بجانب الجواهر =====================
a = s.index("  const ownedChips = ts.map(t=>{"); b = s.index("  const nOwn = CodisBoxes.owned().length;\n", a)
assert b - a < 900 and s.count("  const ownedChips = ") == 1
s = s[:a] + s[b + len("  const nOwn = CodisBoxes.owned().length;\n"):]
rep("""id="bx-h">البكجات' + (nOwn ? '<span class="bx-tag">' + econFmt(nOwn) + ' مغلق</span>' : '') + '</h4>'""", """id="bx-h">البكجات</h4>'""")
rep("""    (nOwn ? '<div class="bx-own" role="group" aria-label="بكجاتك المغلقة">' + ownedChips + '</div>' : '') +\n""", "")
rep("        econBoxMineHtml(t) +   /* CODIS-V62 */\n", "")
# «شراء 1»: أيقونة الصندوق المملوك بصف السعر (لا شيء بشريط الرصيد)
rep(r"""(n ? '' : ' — ' + label)) + '" onclick="econBuyBox(\'' + t.id + '\')"><span class="bx-buy-l">شراء 1</span>' + (n ? econGem(t.gems) : """,
    r"""(n ? '' : ' — ' + label) + (econBoxChoiceNeeded(t.id) ? ' — لديك صندوق مغلق من هذا المستوى' : '')) + '" onclick="econBuyBox(\'' + t.id + '\')"><span class="bx-buy-l">شراء 1</span>' + (n ? econBoxBuyPriceHtml(t) : """)
rep("""'<span class="bxc-v"><em>لديك</em><b dir="ltr">×' + econFmt(own)""", """'<span class="bxc-v">' + econOwnedBoxArt(tierId, { mini:true, label:false }) + '<b dir="ltr">×' + econFmt(own)""")

# ===================== 6) الواجهة الجديدة =====================
ui = rd('identity', 'v63_ui.js'); assert '</script' not in ui and '<!--' not in ui
rep("/* ---- سجل الكوينز ---- */\nfunction econShowMoreLog(){", "/* ===== CODIS-V63 ===== */\n" + ui + "\n/* ---- سجل الكوينز ---- */\nfunction econShowMoreLog(){")

# ===================== 7) CSS: حذف ما لم يعد مستعملاً + لوحة الصندوق المجاني + طبقة v63 =====================
# (أ) صف الصناديق المصغّرة bx-own / bx-own-chip / bx-own-n ووسم bx-tag
n0 = len(re.findall(r', \.bx-own-chip(?:\[data-tone="[a-z]+"\])?(?=[ ,{])', s))
s = re.sub(r', \.bx-own-chip(?:\[data-tone="[a-z]+"\])?(?=[ ,{])', '', s); assert n0 >= 14, n0
dead = re.findall(r'(?m)^\.bx-own(?:-chip(?: \.bxa)?|-n)?(?:\{|::-webkit-scrollbar\{|:active\{)[^\n]*\n', s)
assert len(dead) == 12 and all(d.count('{') == d.count('}') for d in dead), dead
s = re.sub(r'(?m)^\.bx-own(?:-chip(?: \.bxa)?|-n)?(?:\{|::-webkit-scrollbar\{|:active\{)[^\n]*\n', '', s)
rep(", #eco-store-body .bx-tag{", "{", 2)
# بلاطات «البكجات المغلقة» القديمة (.bx-own-tile) لم يعد لها أي مولّد
n1 = len(re.findall(r', (?:#eco-store-body )?\.bx-own-tile(?:\[data-tone="[a-z]+"\])?(?: \.bx(?:a|-info))?(?=[ ,{])', s))
s = re.sub(r', (?:#eco-store-body )?\.bx-own-tile(?:\[data-tone="[a-z]+"\])?(?: \.bx(?:a|-info))?(?=[ ,{])', '', s); assert n1 == 23, n1
rep(".bx-own-tile .bx-art{ pointer-events:none; }\n", "", 2)
assert s.count('bx-own-tile') == 1, s.count('bx-own-tile')   # تعليق v47 التاريخي فقط
rep("#eco-store-body #eco-own-sheet .own-sub-x{ font-size:11px; font-weight:700; color:var(--sx-text2); }\n", "")
rep("#eco-store-body .vch-mg .vch-lvl{ font-size:11px; font-weight:700; color:var(--sx-text2, var(--text-2)); }\n", "")
assert 'bx-own-chip' not in s and 'bx-tag' not in s.replace('bx-tags', ''), 'left-over bx-own-chip/bx-tag'
# (ب) v62: صف «لديك» + بطاقات «الصناديق» القديمة
a = s.index('/* ---- (2) الصناديق المغلقة بـ«بحوزتك» ---- */'); b = s.index("html.sx-calm #eco-store-body .bx-card.is-picked .bx-mine-open{ animation:none; }\n") + len("html.sx-calm #eco-store-body .bx-card.is-picked .bx-mine-open{ animation:none; }\n")
assert 0 < b - a < 4000
s = s[:a] + s[b:]
assert 'bx-mine' not in s, 'left-over bx-mine'
# (ج) عناوين المجموعات والبطاقة الباهتة
a = s.index('#eco-store-body .own-kinds{ display:flex; flex-direction:column; }\n'); b = s.index('#eco-store-body .own-kind > .own-sub{ flex-wrap:wrap; }\n') + len('#eco-store-body .own-kind > .own-sub{ flex-wrap:wrap; }\n')
assert 0 < b - a < 800
s = s[:a] + s[b:]
rep('#eco-store-body .vch-own-tile.is-zero{ opacity:.55; }\n', '')
assert 'is-zero' not in s, 'left-over is-zero'
# (د) القسيمة القديمة (تذكرة + صندوق) ⇒ تُنقل حرفياً لـ.obx-* بطبقة v63
a = s.index('.vch-art{ position:relative; display:block; width:100%; aspect-ratio:8 / 5;'); b = s.index('.vch-art.is-big .vch-stub b{ font-size:30px; }\n') + len('.vch-art.is-big .vch-stub b{ font-size:30px; }\n')
assert 0 < b - a < 2500
s = s[:a] + s[b:]
assert not re.search(r'\.vch-(tk|box|stub|bg|perf|gl)\b', s), 'left-over old voucher css'
# (هـ) الصندوق المجاني: لوحة نتيجة صلبة بألوان المظهر نفسه (السبب: النص كان مباشرة فوق خلفية شفافة مموّهة وبألوان ثابتة/رموز ورقية لا تناسبها)
rep(".fb-ov{ position:fixed; inset:0; z-index:760; display:grid; place-items:center; align-content:center;", ".fb-ov{ position:fixed; inset:0; z-index:760; display:flex; flex-direction:column; align-items:center;")
rep(".fb-stage{ width:min(100%, 360px); display:flex;", ".fb-stage{ flex:none; margin:auto 0; width:min(100%, 360px); display:flex;")   # CODIS-V63: هامش تلقائي بدل التوسيط ⇒ المحتوى الطويل يتمرّر ولا يُقصّ من الأعلى
a = s.index('.fb-rev{ display:flex; flex-direction:column; align-items:center; gap:8px; width:100%; }\n'); b = s.index('.fb-ok{ min-width:160px; margin-top:4px; }\n') + len('.fb-ok{ min-width:160px; margin-top:4px; }\n')
assert 0 < b - a < 1500 and s.count('.fb-ok{ min-width:160px; margin-top:4px; }') == 1
s = s[:a] + """.fb-rev{ display:flex; flex-direction:column; align-items:center; gap:12px; width:100%; max-width:100%; box-sizing:border-box; padding:20px 18px 18px; border-radius:22px;
  background-color:var(--bg); background-image:var(--mat-sheet-fill); border:1px solid var(--mat-sheet-edge, rgb(127 127 127 / .25)); box-shadow:0 24px 60px -14px rgb(0 0 0 / .6); color:var(--text); }
.fb-rev[hidden]{ display:none; }
.fb-rev.is-on{ animation:fbUp .5s cubic-bezier(.2,.9,.3,1.05) both; }
.fb-kick{ font-size:14px; font-weight:800; line-height:1.4; color:var(--gold-text, var(--text)); }
.fb-stage.is-done .fb-box{ display:none; }
.fb-prize{ display:flex; flex-direction:column; align-items:center; gap:10px; width:100%; min-width:0; }
.fb-cardwrap{ width:min(52vw, 190px, 34vh); }
.fb-cardwrap .store-art{ display:block; width:100%; }
.fb-name{ display:block; max-width:100%; font-size:17px; font-weight:800; line-height:1.5; color:var(--text); overflow-wrap:anywhere; }
.fb-val{ display:inline-flex; align-items:center; gap:8px; padding:5px 14px; border-radius:999px; font-size:15px; font-weight:800; background:rgb(var(--gold-rgb) / .12); border:1px solid rgb(var(--gold-rgb) / .32); }
.fb-val em{ font-style:normal; font-size:12.5px; font-weight:700; color:var(--text-2); }
.fb-pz-ico{ width:84px; height:84px; display:grid; place-items:center; border-radius:50%; background:rgb(var(--gold-rgb) / .12); border:1px solid rgb(var(--gold-rgb) / .32); }
.fb-pz-ico svg, .fb-pz-ico img{ width:48px; height:48px; }
.fb-pz-n{ font-size:36px; font-weight:900; line-height:1.1; color:var(--text); font-variant-numeric:tabular-nums; }
.fb-pz-l{ font-size:15px; font-weight:800; color:var(--text-2); }
.fb-note{ margin:0; max-width:100%; padding:0 6px; font-size:13px; line-height:1.7; color:var(--text-2); }
.fb-ok{ min-width:160px; margin-top:2px; }
""" + s[b:]
a = s.index('.fb-bonus{ display:flex;'); b = s.index('.fb-bal{ margin:4px 0 0;'); b = s.index('\n', b) + 1
assert 0 < b - a < 1200
s = s[:a] + s[b:]
for dead_cls in ('fb-bonus', 'fb-bn', 'fb-bal'): assert dead_cls not in s, dead_cls
# (و) طبقة v63
css = rd('identity', 'v63.css'); assert '</style' not in css
i = s.index('<style id="codis-v62-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v63-css">\n/* CODIS-V63 */\n' + css + '</style>' + s[j:]

# حراس نهائية: لا اعتماد على العناصر المحذوفة ولا تعريف مكرر
for gone in ('econBoxMineHtml', 'bx-mine', "own-tab-boxes", "own-panel-boxes", "key:'boxes', name:'الصناديق', icon", '«بحوزتك» ← الصناديق\'','econOwnBoxesHtml', 'econOwnOpenBox'):
    assert gone not in s, ('left-over', gone, s[max(0, s.find(gone) - 160):s.find(gone) + 60].encode('unicode_escape')[:600])
for name in ('econOwnedBoxArt', 'econVoucherArt', 'econOwnClosedHtml', 'econOwnUseBox', 'econBoxPickSync', 'econOwnTotals', 'econItemGroupHtml', 'econBoxBuyPriceHtml', 'codisFreeBoxOpen', 'codisProgressRewardHtml', 'econVouchersMergeHtml', 'codisProgressDaysDone'):
    assert s.count('\nfunction ' + name + '(') == 1, ('function count', name, s.count('\nfunction ' + name + '('))
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v63 applied')
