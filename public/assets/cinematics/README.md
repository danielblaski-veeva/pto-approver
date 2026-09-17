# Cinematics

In-game cinematic videos. Drop the three files here with these exact names:

| File | When it plays |
| :--- | :------------ |
| `intro.mp4` | At game start, after the player confirms their character |
| `preboss.mp4` | When stage 3 begins, just before the Manager boss appears |
| `ending.mp4` | After the Manager is defeated and the PTO is collected (victory) |

## Format
- **Container/codec:** MP4 (H.264 video + AAC audio) for the widest browser support.
  WebM (VP9) also works in Chrome — if you use it, rename the files to `.webm`
  and update `CINEMATICS` in `src/game/main.js`.
- **Resolution:** the game canvas is 960×540 (16:9). Match that aspect ratio;
  the video is letterboxed to fit, so any 16:9 size (e.g. 1280×720, 1920×1080) is fine.
- Keep file sizes reasonable so the first frame starts quickly.

## Behavior
- Served by Vite from `/assets/cinematics/<name>.mp4` (the `public/` prefix is dropped).
- Each cinematic is **skippable** — press Start / A (or Enter / Space).
- A **missing file is skipped gracefully**: the game logs a warning and continues,
  so development isn't blocked if a video isn't in place yet.
