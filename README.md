# Xalq banki · Xazna Antifrod — animatsion rolik (16:9)

Joriy versiya: `video/xalqbank_xazna_antifrod_v4.mp4` (1920×1080, 30 fps, ~117 s).
Diktor ovozi `assets/media/diktor.wav`, fon musiqasisiz, zamonaviy kinematik SFX bilan.

## v3 tuzilishi
| Fayl | Vazifasi |
|---|---|
| `src/rolik.html` | Sahna sahifasi (`lib.js` + `v3.js`) |
| `src/v3.js` | Oq + to‘q ko‘k + to‘q yashil fon, 3D proyeksiya (telefon, kartalar, kub o‘tish), kinetik matn, sahnalar |
| `src/lib.js` | Ikonalar va ilova ekranlari |
| `src/build_timeline.py` | Diktor ovozidagi pauzalar asosida sahna vaqtlari va subtitrlar → `timeline.json` |
| `src/sfx.py` | Tovush dizayni (whoosh, braam, riser, impact, glitch, UI) + diktor miksi |
| `src/prep_assets.py` | Xazna logotipini kesib olish |

## Qayta yig‘ish
```bash
python3 src/prep_assets.py
mkdir -p src/build/clip && ffmpeg -i assets/media/bank_xodimlari.mp4 -vf fps=30 -q:v 3 src/build/clip/f_%04d.jpg
python3 src/build_timeline.py
python3 src/sfx.py mix.wav
node src/render.js mix.wav video/out.mp4
```
Bitta kadrni ko‘rish: `node src/preview.js <papka> 12.5 40`.

Eski versiyalar: `src/rolik_v2.html` + `src/music.py` (v2), birinchi rolik `video/xazna_antifrod_rolik_16x9.mp4`.
