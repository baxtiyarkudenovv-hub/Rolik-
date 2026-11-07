"""Builds timeline.json from the narrator recording (assets/media/diktor.wav).
Speech blocks were located with: ffmpeg -af silencedetect=noise=-38dB:d=0.35 (times in voice seconds)."""
import json, os, re, math
ROOT = os.path.dirname(os.path.abspath(__file__))
VOFF = 7.0          # voice starts at this video time (after the logo intro)
LOGO = 6.6
# speech blocks [start, end, subtitle text] in voice time
BLOCKS = [
 [0.00, 2.18, "Aksiyadorlik tijorat Xalq banki"],
 [2.60, 6.79, "o‘z mijozlarini kiberxavfsizlikdan himoya qilish uchun ogohlantiradi!"],
 [7.65, 15.25, "Kiberfiribgarlikning eng keng tarqalgan usullaridan biri — smartfonga zararli dastur o‘rnatib, ma’lumotlarni o‘g‘irlashga urinish."],
 [15.81, 20.18, "Odatda, foydalanuvchi qurilmasida zararli dastur borligini bilmay ham qoladi."],
 [20.95, 34.52, "Bunday xavfni oldini olish maqsadida Bankning operativ kuzatuv va frod monitoringi bo‘limi xodimlari Antifrod tizimlarini barqaror ishlash holatida saqlaydi, mijozlarga firibgarlik holatlarining ko‘payishi bo‘yicha tushuntirish beradi."],
 [35.31, 50.17, "Xalq bankining Xazna mobil ilovasida maxsus antifrod tizimi ishga tushirilgan bo‘lib, qurilmada shubhali dasturlar aniqlansa, bu haqida darhol xabar beradi va xavfsizlik chorasi sifatida ayrim amaliyotlarni vaqtincha cheklaydi."],
 [51.10, 59.30, "Agar siz Xazna mobil ilovasi orqali pul o‘tkazmoqchi bo‘lsangiz va sizda zararli dastur aniqlansa, ilova sizni darhol ogohlantiradi."],
 [60.15, 65.58, "Virusni o‘chirib tashlash uchun ekranda paydo bo‘lgan «Muammoni hal qilish» tugmasini bosasiz."],
 [66.00, 69.69, "Tizim sizni zararli dasturni boshqarish sahifasiga olib o‘tadi."],
 [70.39, 77.45, "Ushbu sahifadagi ilova ishlamasa, «Ruxsatni olib tashlash» funksiyasini yoqib, pastdagi «Olib tashlash» tugmasini bosasiz."],
 [78.04, 80.94, "Shundan so‘ng zararli dastur telefoningizdan o‘chiriladi."],
 [81.70, 95.84, "Xazna mobil ilovasining yana bir afzalligi shundaki, tizim doimiy ravishda qurilmangizni tekshiradi va zararli dastur aniqlansa, sizga mana shunday ogohlantirish yuboradi va yuqorida ko‘rsatilganidek virusni o‘zingiz o‘chirib tashlashingiz mumkin."],
 [96.62, 103.00, "Endi Xazna orqali moliyaviy operatsiyalaringizni oson va xavfsiz tarzda amalga oshirishingiz mumkin."],
]
V = lambda v: VOFF + v        # voice time -> video time
CUT = lambda v: V(v) - .35    # scene cut just before a speech block starts
b_s2, b_s3, b_s4, b_s5, b_s6, b_s7 = CUT(7.65), CUT(20.95), CUT(35.31), CUT(51.10), CUT(81.70), CUT(96.62)
st2, st3 = CUT(60.15), CUT(70.39)
st4 = V(70.39 + .55 * (77.45 - 70.39))          # "...yoqib, | pastdagi «Olib tashlash»..."
end7 = V(103.36) + 1.6
bounds = [0, LOGO, b_s2, b_s3, b_s4, b_s5, b_s6, b_s7, end7, end7 + 5.4]
ids = ['logo', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 'end']
scenes = [[i, round(bounds[k + 1] - bounds[k], 3)] for k, i in enumerate(ids)]
steps = [round(v, 3) for v in (st2 - b_s5, st3 - st2, st4 - st3, b_s6 - st4)]

def chunks(text, maxc=60):
    out = []
    for s in re.split(r'(?<=[.!?])\s+', text.strip()):
        n = math.ceil(len(s) / maxc); target = len(s) / n; cur = ''
        for w in s.split():
            if cur and len(cur) + 1 + len(w) > target * 1.15: out.append(cur); cur = w
            else: cur = (cur + ' ' + w).strip()
        if cur: out.append(cur)
    return out
subs = []
for a, b, text in BLOCKS:
    cs = chunks(text); tot = sum(len(c) for c in cs); t = a
    for c in cs:
        e = t + (b - a) * len(c) / tot
        subs.append([round(V(t) - .05, 3), round(V(e) + .1, 3), c]); t = e
tl = dict(scenes=scenes, steps=steps, subs=subs, voff=VOFF, total=round(bounds[-1], 3),
          blocks=[[round(V(a), 3), round(V(b), 3)] for a, b, _ in BLOCKS])
json.dump(tl, open(os.path.join(ROOT, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
print('total', tl['total']); print(scenes); print('steps', steps)
