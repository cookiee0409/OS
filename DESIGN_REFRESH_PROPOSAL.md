# CookieLab OS — 디자인 리프레시 제안서 (레트로 → 밝은 글래스 + 비비드 그라디언트)

작성일: 2026-07-03
상태: 제안 단계 (코드 미작성, 사용자 방향 확정 완료)
선행 문서: MULTI_WINDOW_PROPOSAL.md, WINDOW_SYSTEM_FOLLOWUP_PROPOSAL.md
대상: 이 문서를 보고 구현할 개발자 / Codex 등 병행 작업 도구

---

## 1. 확정된 방향

사용자 확인 완료 (2026-07-03):

- **전체 디자인**: 밝은 글래스 + 비비드 그라디언트
  (어두운 레트로 터미널 → 밝고 생동감 있는 "게이밍 PC" 느낌)
- **아이콘 에셋**: Microsoft Fluent Emoji 3D (MIT 라이선스)로 교체
- 레트로 요소(스캔라인, 모노스페이스, 네온 다크)는 유지할 필요 없음
- **멀티 윈도우 로직(JS)은 변경하지 않는다** — 이번 작업은 CSS/에셋/마크업 일부 교체가
  중심. 창 드래그/리사이즈/트래픽라이트/포커스 로직은 이미 완성되어 있으므로 건드리지 말 것.

참고 레퍼런스:
- Puter (https://puter.com) — 밝은 배경 + 흰 창 + 컬러 아이콘 조합
- Win11React (https://win11.blueedge.me) — 아크릴 블러, 둥근 모서리
- macos-web (https://macos-web.app) — 독 인터랙션
- 글래스모피즘 트렌드 — 반투명 10~40% 불투명도, blur 10~20px, 비비드 배경 위에서 효과 극대화

---

## 2. 새 디자인 토큰 (styles/retro-os.css `:root` 교체)

현재 다크 토큰(`retro-os.css:1-30`)을 아래로 교체한다.
파일명도 `retro-os.css` → `glass-os.css`로 바꾸는 것을 권장 (index.html:12 링크 동기화).

```css
:root {
  /* 배경 — 비비드 그라디언트는 body에서 직접 */
  --bg-gradient: linear-gradient(135deg, #93c5fd 0%, #a5b4fc 30%, #c4b5fd 55%, #f0abfc 80%, #f9a8d4 100%);

  /* 유리 표면 */
  --glass-strong: rgba(255, 255, 255, 0.78);   /* 포커스된 창 본체 */
  --glass-soft: rgba(255, 255, 255, 0.45);     /* 비포커스 창, 배경 패널 */
  --glass-bar: rgba(255, 255, 255, 0.55);      /* 상단바, 독, taskbar */
  --glass-border: rgba(255, 255, 255, 0.7);
  --glass-blur: 14px;

  /* 텍스트 — 밝은 배경이므로 어두운 슬레이트 계열 */
  --text-main: #0f172a;
  --text-muted: #475569;
  --text-dim: #94a3b8;

  /* 액센트 — 생동감 담당 (독 타일, 상태 뱃지, 포커스 링) */
  --accent-blue: #3b82f6;
  --accent-violet: #8b5cf6;
  --accent-pink: #ec4899;
  --accent-emerald: #10b981;
  --accent-amber: #f59e0b;
  --danger: #f87171;
  --warning: #fbbf24;
  --success: #34d399;

  /* 상태 뱃지 (연한 배경 + 진한 글자 페어) */
  --badge-live-bg: #d1fae5;    --badge-live-text: #047857;
  --badge-wip-bg: #fef3c7;     --badge-wip-text: #92400e;
  --badge-proto-bg: #dbeafe;   --badge-proto-text: #1d4ed8;
  --badge-exp-bg: #fce7f3;     --badge-exp-text: #be185d;

  --shadow-window: 0 18px 40px rgba(30, 41, 59, 0.18);
  --shadow-window-focused: 0 24px 56px rgba(30, 41, 59, 0.26);

  --radius-window: 16px;
  --radius-tile: 12px;

  --sans: "Pretendard Variable", Pretendard, Inter, ui-sans-serif, system-ui,
    -apple-system, "Segoe UI", sans-serif;
  /* --mono는 System Log 본문 등 로그 표시에만 잔존 사용 */
}
```

Pretendard 로드 (index.html `<head>`):
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
```
(오프라인 요구가 있으면 생략하고 Inter/system-ui 폴백 유지)

---

## 3. 주요 영역별 변경 사항

### 3.1 배경 (월페이퍼)

- `body` 배경: `var(--bg-gradient)` 고정 + 장식용 대형 블러 원(orb) 2~3개를
  `body::before/::after` 또는 `.desktop-bg` 요소로 배치
  (`border-radius: 50%; background: rgba(255,255,255,0.35)` / `rgba(56,189,248,0.25)` 등).
- **스캔라인 오버레이 제거**: `body::before`의 스캔라인(`retro-os.css:51-65`)과
  `scanlines-off` 토글 삭제. 관련 환경설정 항목(`state.environment`의 스캔라인 토글)은
  JS에서 옵션 자체를 제거하거나 no-op 처리 (System Folder 설정 UI에서 해당 버튼 제거).
- 기존 월페이퍼 선택 기능(AURORA 등)은 그라디언트 프리셋 3~4종으로 교체:
  예) `sky`(기본, 위 그라디언트), `sunset`(#fdba74→#f9a8d4→#c4b5fd),
  `mint`(#6ee7b7→#67e8f9→#93c5fd), `night`(#312e81→#7c3aed→#db2777, 다크 취향용 1종).
- 은은한 배경 애니메이션(orb가 60~90초 주기로 천천히 이동)은 선택 사항.
  추가한다면 `transform` 기반 + `prefers-reduced-motion` 시 정지.

### 3.2 창 (window-panel) — JS 변경 없음, CSS만

- `.window-panel`: `background: var(--glass-strong)` + `backdrop-filter: blur(var(--glass-blur))`
  + `border: 1px solid var(--glass-border)` + `border-radius: var(--radius-window)`
  + `box-shadow: var(--shadow-window)`.
- `.window-panel.is-focused`: `--shadow-window-focused` + 테두리 약간 더 선명.
- `.window-panel:not(.is-focused)`: `background: var(--glass-soft)` + `opacity` 낮추지 말 것
  (내용 가독성 유지) — 타이틀바 글자색만 `--text-muted`로.
- 트래픽라이트: 현재 색 유지하되 밝은 톤으로 — `#f87171`(닫기), `#fbbf24`(최소화),
  `#34d399`(최대화). 비포커스 창에서는 회색(`#cbd5e1`)으로 탈색 (macOS 컨벤션).
- `backdrop-filter` 미지원 브라우저 폴백: `@supports not (backdrop-filter: blur(1px))`
  일 때 `background: rgba(255,255,255,0.92)` (불투명도 올려 가독성 확보).

### 3.3 상단바 / taskbar / 독

- 상단바: `var(--glass-bar)` + blur, 하단 1px 유리 테두리. 글자는 `--text-main`.
- **taskbar를 "독" 스타일로 재해석**: 하단 중앙 정렬 유리 필(pill) 형태
  (`border-radius: 18px`, 좌우 마진 자동). 고정 앱 아이콘은 44×44px 컬러 타일.
  열린 창 목록은 독 오른쪽에 구분선 두고 유지 (기존 taskbar-window 마크업 재사용).
- 독 아이콘 hover: `transform: scale(1.15)` + `transition 120ms` (reduced-motion 시 생략).
- Start 버튼/메뉴도 동일한 유리 스타일.

### 3.4 데스크탑 아이콘 / 앱 목록

- 데스크탑 아이콘 타일: 52×52px, `border-radius: 14px`, `var(--glass-soft)` 배경 +
  유리 테두리, 아이콘 이미지 28~32px. 라벨은 `--text-main` 11~12px.
- SYSTEM DISK / PROJECT FILES 리스트의 각 앱 행: 흰 배경(반투명 80%) 카드,
  좌측 36×36px 아이콘 타일, 상태 뱃지는 §2의 badge 토큰 페어 사용
  (현재의 네온 글로우 뱃지 제거).

### 3.5 System Log

- 유리 창 스타일 통일. 로그 본문만 `--mono` 유지 (로그라는 정체성 유지, 색은
  `--text-muted`).
- CPU/MEM 모니터 게이지가 있다면 액센트 컬러 프로그레스 바로 교체.

---

## 4. 아이콘 에셋 — Fluent Emoji 3D

### 4.1 조달 방법

Microsoft Fluent Emoji (MIT): https://github.com/microsoft/fluentui-emoji
경로 규칙: `assets/<Emoji Name>/3D/<snake_name>_3d.png`

**로컬 다운로드 방식 권장** (오프라인 동작, CDN 장애 무관):
`assets/icons/` 폴더에 PNG 저장 (각 256px 내외, 총 12개 ≈ 1MB 미만).

다운로드 URL 패턴 (raw):
```
https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/{Emoji Name}/3D/{snake_name}_3d.png
```

### 4.2 현재 이모지 → Fluent Emoji 3D 매핑

`src/data/apps.js`의 `icon` 필드(현재 이모지 문자열)를 이미지 경로로 교체한다.

| 앱 | 현재 | Fluent Emoji 이름 | 파일 |
|---|---|---|---|
| System Folder | 🗂️ | Card index dividers | `card_index_dividers_3d.png` |
| Music Player | 🎛️ | Control knobs | `control_knobs_3d.png` |
| Crypto Dashboard | 📈 | Chart increasing | `chart_increasing_3d.png` |
| IPO Center | 🏢 | Office building | `office_building_3d.png` |
| Stock Research | 📊 | Bar chart | `bar_chart_3d.png` |
| News Poster | 📰 | Newspaper | `newspaper_3d.png` |
| Trend Collector | 📡 | Satellite antenna | `satellite_antenna_3d.png` |
| Flight Globe | 🌍 | Globe showing Europe-Africa | `globe_showing_europe-africa_3d.png` |
| Pixel Ocean | 🌊 | Water wave | `water_wave_3d.png` |
| Bible Helper | 📖 | Open book | `open_book_3d.png` |
| Image Tools | 🛠️ | Hammer and wrench | `hammer_and_wrench_3d.png` |

(정확한 폴더명은 repo에서 확인 필요 — 폴더명은 "Chart increasing"처럼 공백 포함
표기, 파일명은 snake_case. 다운로드 스크립트 작성 시 대소문자/하이픈 주의.)

### 4.3 데이터/렌더링 변경

- `src/data/apps.js`: `icon: "📈"` → `icon: "./assets/icons/chart_increasing_3d.png"`.
- 렌더링부(`AppIcon`, `Taskbar`, 독 등 이모지 텍스트를 출력하던 곳):
  `<span class="app-emoji">${icon}</span>` → `<img class="app-icon-img" src="${escapeHtml(icon)}" alt="" width="32" height="32" loading="lazy" decoding="async" />`
  (아이콘은 장식이므로 `alt=""` — 라벨 텍스트가 이미 접근성 이름 제공.)
- 이미지 로드 실패 폴백: CSS로 `.app-icon-img { background: var(--glass-soft); border-radius: 8px; }`
  정도면 충분 (깨진 아이콘 이미지 대신 유리 타일이 보임).
- 트래픽라이트/시스템 글리프(×, −, + 등)는 이미지 불필요 — 현재처럼 CSS/텍스트 유지.

---

## 5. 접근성 — 밝은 테마 전환 시 필수 체크

1. **대비**: 유리 배경 위 텍스트는 반드시 `--text-main`(#0f172a) 사용.
   `--text-dim`(#94a3b8)은 대형 텍스트/장식 전용 — 본문에 쓰면 WCAG AA(4.5:1) 미달 위험.
   상태 뱃지는 §2의 페어(연한 배경 + 같은 계열 진한 글자)만 사용.
2. **그라디언트 배경 위 직접 텍스트 금지**: 데스크탑 아이콘 라벨처럼 배경 위에
   바로 놓이는 텍스트는 `text-shadow: 0 1px 2px rgba(255,255,255,0.6)` 또는
   반투명 칩 배경을 깔아 가독성 확보.
3. **포커스 링**: 기존 민트색 아웃라인은 밝은 배경에서 안 보임 —
   `outline: 2px solid var(--accent-blue); outline-offset: 2px`로 교체.
4. **`prefers-reduced-motion`**: 기존 전역 규칙 유지. 새로 추가되는 hover 스케일,
   배경 orb 애니메이션 모두 이 규칙의 적용을 받는지 확인.
5. **`prefers-color-scheme: dark` 대응은 이번 범위 밖** — 단일 밝은 테마로 출시,
   다크 변형은 월페이퍼 프리셋(`night`)으로만 제공.

---

## 6. 구현 순서 제안

1. **토큰 교체** (§2) — `:root` 변수 교체 + 스캔라인 제거. 이 단계만으로 전체 톤 전환.
2. **창/상단바/독 유리 스타일** (§3.2, §3.3) — CSS만, JS 무변경.
3. **아이콘 에셋 다운로드 + 교체** (§4) — `assets/icons/` 생성, apps.js 경로 교체,
   렌더링부 `<img>` 전환.
4. **데스크탑 아이콘/앱 목록/뱃지** (§3.4) + System Log (§3.5).
5. **월페이퍼 프리셋 교체** (§3.1) — 기존 월페이퍼 선택 UI 재활용.
6. **접근성 패스** (§5) — 대비 확인, 포커스 링, reduced-motion.
7. (선택) 배경 orb 애니메이션, 독 hover 마이크로 인터랙션 다듬기.

각 단계는 독립적으로 배포 가능. 1~2단계 완료 시점에 이미 "밝은 글래스" 인상 완성.

---

## 7. 범위 밖

- 멀티 윈도우 JS 로직 변경 (완성된 상태 — 건드리지 말 것)
- 다크 모드 자동 전환 (`prefers-color-scheme`)
- 프레임워크/빌드 도구 도입
- 사운드/오디오 관련 변경
- 앱 콘텐츠(창 내부 정보 구조) 개편 — 스타일만 교체
