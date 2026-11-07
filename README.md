# Xazna Antifrod — animatsion rolik (16:9)

Tayyor video: `video/xazna_antifrod_rolik_16x9.mp4` (1920×1080, 30 fps, 72.6 s, musiqa va effekt tovushlari bilan).

## Qayta yig‘ish (v2)
```bash
python3 src/build_timeline.py          # voice/seg_XX.wav uzunligiga qarab sahna vaqtlari + subtitrlar
python3 src/music.py music.wav         # musiqa + kinematik SFX + diktor ovozi (ducking bilan)
node src/render.js music.wav video/out.mp4
```
Logotip qismlari: `assets/` (asl fayl `assets/xalqbank_logo_src.png`).
Brauzerda ko‘rish: `src/rolik.html?play` (alohida kadr: `?t=40`).
Matnlar va vaqtlar `src/rolik.html` ichidagi sahna funksiyalarida (`s1`…`s7`, `SCENES`).
