"""Builds timeline.json (scene durations, voice placement, subtitles) from voiceover segment lengths.
Uses voice/seg_XX.wav durations when present, otherwise estimates from text length."""
import json, os, re, wave, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
SEGS = [
 "Aksiyadorlik tijorat Xalq banki o‘z mijozlarini kiberxavfsizlikdan himoya qilish uchun ogohlantiradi!",
 "Kiberfiribgarlikning eng keng tarqalgan usullaridan biri — smartfonga zararli dastur o‘rnatib, ma’lumotlarni o‘g‘irlashga urinish. Odatda, foydalanuvchi qurilmasida zararli dastur borligini bilmay ham qoladi.",
 "Bunday xavfning oldini olish maqsadida, Bankning operativ kuzatuv va frod monitoringi bo‘limi xodimlari Antifrod tizimlarini barqaror ishlash holatida saqlaydi, mijozlarga firibgarlik holatlarining ko‘payishi bo‘yicha tushuntirish beradi.",
 "Xalq bankining Xazna mobil ilovasida maxsus antifrod tizimi ishga tushirilgan bo‘lib, qurilmada shubhali dasturlar aniqlansa, bu haqida darhol xabar beradi va xavfsizlik chorasi sifatida ayrim amaliyotlarni vaqtincha cheklaydi.",
 "Agar siz Xazna mobil ilovasi orqali pul o‘tkazmoqchi bo‘lsangiz va sizda zararli dastur aniqlansa, ilova sizni darhol ogohlantiradi.",
 "Virusni o‘chirib tashlash uchun ekranda paydo bo‘lgan «Muammoni hal qilish» tugmasini bosasiz. Tizim sizni zararli dasturni boshqarish sahifasiga olib o‘tadi.",
 "Ushbu sahifadagi ilova ishlamasa, «Ruxsatni olib tashlash» funksiyasini yoqing.",
 "So‘ng pastdagi «Olib tashlash» tugmasini bosasiz. Shundan so‘ng zararli dastur telefoningizdan o‘chiriladi.",
 "Xazna mobil ilovasining yana bir afzalligi shundaki, tizim doimiy ravishda qurilmangizni tekshiradi va zararli dastur aniqlansa, sizga mana shunday ogohlantirish yuboradi. Yuqorida ko‘rsatilganidek, virusni o‘zingiz o‘chirib tashlashingiz mumkin.",
 "Endi Xazna orqali moliyaviy operatsiyalaringizni oson va xavfsiz tarzda amalga oshirishingiz mumkin!",
]
def seg_len(i):
    f = os.path.join(ROOT, '..', 'voice', f'seg_{i:02d}.wav')
    if os.path.exists(f):
        with wave.open(f) as w: return w.getnframes() / w.getframerate()
    return len(SEGS[i]) / 14.0
def chunks(text, maxc=62):
    """Sentence-aware, balanced subtitle chunks."""
    import math
    sents = re.split(r'(?<=[.!?])\s+', text.strip()); out = []
    for st in sents:
        words = st.split(); n = math.ceil(len(st) / maxc); target = len(st) / n; cur = ''
        for w in words:
            if cur and len(cur) + 1 + len(w) > target * 1.12 and len(out) < 99: out.append(cur); cur = w
            else: cur = (cur + ' ' + w).strip()
        if cur: out.append(cur)
    return out
L = [seg_len(i) for i in range(10)]
LEAD, TAIL = .55, .6
scenes, voice, subs = [], [], []
t = 0
def scene(id, d):
    global t; scenes.append([id, round(d, 3)]); s = t; t += d; return s
def place(i, at):
    voice.append([round(at, 3), i])
    if i == 9: return
    cs = chunks(SEGS[i]); tot = sum(len(c) for c in cs); a = at
    for c in cs:
        b = a + L[i] * len(c) / tot; subs.append([round(a, 3), round(b + .05, 3), c]); a = b
scene('logo', 6.6)
s = scene('s1', LEAD + L[0] + TAIL + .4); place(0, s + LEAD + .2)
for sid, i in (('s2', 1), ('s3', 2), ('s4', 3)):
    s = scene(sid, LEAD + L[i] + TAIL); place(i, s + LEAD)
steps = [.45 + L[4 + k] + .55 for k in range(4)]; steps[0] += .3
s = scene('s5', sum(steps)); a = s + .3
for k in range(4): place(4 + k, a + .45); a += steps[k]
s = scene('s6', LEAD + L[8] + TAIL); place(8, s + LEAD)
s = scene('s7', LEAD + L[9] + 1.8); place(9, s + LEAD + .2)
scene('end', 5.2)
tl = dict(scenes=scenes, steps=[round(x, 3) for x in steps], voice=voice, subs=subs, total=round(t, 3), seg_len=L)
json.dump(tl, open(os.path.join(ROOT, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
print('total', round(t, 2), 'scenes', scenes)
