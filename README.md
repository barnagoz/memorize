# Memorize — Local-First Text & Poem Memorization PWA

A modern, client-side Progressive Web Application (PWA) designed to help students, actors, and orators memorize poems, speeches, prose, and custom texts using cognitive minigames and spaced repetition.

Operates **100% offline** without user accounts, analytics, or server dependencies.

---

## 🚀 Key Features

### 1. Zero-Backend Local-First Architecture
- **IndexedDB via Dexie.js**: All documents, user progress, streak histories, and settings are stored locally in the browser's IndexedDB.
- **Offline PWA**: Full Service Worker and Web App Manifest (`manifest.json`) configuration for offline installation on iOS, Android, macOS, Windows, and Linux.
- **Export & Import**: Settings page provides single-click JSON backup and restore functionality.

### 2. Unicode & Extended Script Support (CRITICAL)
- Full support for Hungarian accents (`á, é, í, ó, ö, ő, ú, ü, ű`), German (`ä, ö, ü, ß`), Spanish (`ñ, á, é, í, ó, ú`), French, and other languages.
- Unicode property escapes (`/\p{L}/u`) and `String.prototype.normalize('NFC')` throughout the tokenizer and comparison routines.
- Accurately tokenizes words while preserving hyphens (e.g., *Ősz-hajú*), punctuation anchors, spaces, indentation, and stanza line breaks.

### 3. Cognitive Learning Minigames

The 7 minigames are divided into three cognitive phases:

#### A. Familiarize Phase (Unscored Practice)
1. **Tap to Reveal**: Text is masked with blur and opacity filters. Tapping anywhere or hitting `Space` unmasks the next line with a smooth CSS transition and auto-scroll centering.
2. **Density Slider**: A continuous slider thins out words based on deterministic position hashes, allowing users to test partial recall dynamically.

#### B. Solidify Phase (Scaffolded Active Recall)
3. **First Letter**: Obscures words so only their initial letter and punctuation remain visible (e.g., `M... ny... a v...`). Users type character keys sequentially; wrong keystrokes trigger an animated red shake without resetting position. Accents are strictly validated.
4. **Blanks (Cloze Deletion)**: Hides words at 20%, 40%, or 60% density into inline fill-in inputs with immediate visual evaluation.
5. **Scramble**: Shuffles lines using the Fisher-Yates algorithm. Users reorder lines via drag-and-drop, ▲ / ▼ reorder buttons, or click-to-swap.

#### C. Evaluate Phase (Formal Recall & Scoring)
6. **Type It**: Full verbatim typing in an unassisted text buffer with character-by-character real-time diffing and an optional "First-Letter Mode" scaffolding toggle.
7. **Multiple Choice**: Progressive word-by-word examination presenting 6 options (1 ground truth + 5 contextual distractors from other parts of the text).

### 4. SM-2 Spaced Repetition & Gamification
- **SuperMemo-2 (SM-2)**: Evaluates recall sessions on a 0–5 scale, dynamically adjusting the Easiness Factor ($EF \ge 1.3$) and calculating review intervals ($I$) and due dates.
- **Mastery Score**: Continuous composite score tracking long-term retention.
- **Daily Streaks**: Non-penalizing streak tracking across calendar days.
- **XP Progression**: Earn XP across familiarization and scored evaluation sessions.

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production PWA bundle
npm run build

# Preview production build
npm run preview
```
