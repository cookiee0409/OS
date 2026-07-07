# CookieLab OS — Simple Vibe IDE 컨셉 반영 제안서

작성일: 2026-07-07
상태: 제안 단계 (코드 미작성, 설계 검토용)
선행 문서: MULTI_WINDOW_PROPOSAL.md, WINDOW_SYSTEM_FOLLOWUP_PROPOSAL.md, DESIGN_REFRESH_PROPOSAL.md
분석 대상: https://github.com/NA-DEGEN-GIRL/simple-vibe-ide
대상: 이 문서를 보고 구현할 개발자 / Codex 등 병행 작업 도구

---

## 1. 배경 — Simple Vibe IDE는 어떤 프로젝트인가

Simple Vibe IDE는 LLM 집중 코딩 세션("바이브 코딩")을 위한 **Tauri v2(Rust) + TypeScript
데스크탑 앱**이다. 핵심 가치는 다음과 같다:

- **워크스페이스 탭**: 패널 배치(geometry), 열린 에디터/브라우저/노트/셸 컨텍스트를
  스냅샷으로 저장하고, 탭 전환·재시작 후에도 복원
- **이동/리사이즈 가능한 위젯 8종**: Explorer, Editor, Image Preview, Browser, Notes,
  Snippets, Calculator, Terminal — 모두 타이틀바 드래그 이동, 엣지 그립 리사이즈,
  **인접 엣지 스냅**, 위젯별 불투명도(`Op` 버튼) 저장
- **메모리 세이버**: 비활성 워크스페이스의 PTY를 정리하되 레이아웃 스냅샷은 유지
- **Liquid Glass 테마 시스템**: WebGL 기반 글래스 효과 + 배경/설정을 **JSON으로
  내보내기/가져오기**, 번들 테마 시딩
- **터미널 중심 UX**: PTY 셸, LLM 런처(Codex/Claude/Grok), 에이전트 상태 카드
- **브라우저 위젯**: URL 박스 + 디바이스 프리셋(데스크탑/폰/태블릿), 터미널 출력에서
  localhost URL 자동 감지
- **UI 스케일**: `Ctrl +/-` 로 포커스된 위젯 또는 전체 IDE 배율 조정

CookieLab OS는 빌드 도구 없는 바닐라 JS 정적 웹앱이므로 Rust 백엔드가 필요한 기능
(PTY 터미널, SSH, tmux, LLM CLI 실행, env 파일 편집, 캡처 방지)은 **반영 불가**다.
그러나 Vibe IDE의 진짜 강점은 백엔드가 아니라 **"작업 환경을 통째로 저장하고,
가벼운 위젯들을 자유롭게 띄워 쓰는" 데스크탑 UX**이며, 이는 CookieLab OS의
멀티 윈도우 시스템(이미 구현 완료) 위에 그대로 이식할 수 있다.

---

## 2. 반영 아이디어 매핑 요약

| Vibe IDE 원본 기능 | CookieLab OS 적용안 | 우선순위 |
| --- | --- | --- |
| 워크스페이스 스냅샷 (패널 geometry 저장/복원) | 창 레이아웃 localStorage 영속화 — 새로고침해도 열린 창/위치/크기 복원 | **1 (핵심)** |
| 메모리 세이버 (비활성 PTY 정리) | 최소화된 앱 창의 iframe 절전(unload) → 복귀 시 재로드 | **1 (핵심)** |
| 위젯 인접 엣지 스냅 | 창 드래그 시 화면 가장자리 하프 스냅 + 창끼리 엣지 자석 | 1 |
| Terminal (PTY 셸) | **가짜 터미널 앱**: OS 자체를 명령어로 조작 (`open`, `wallpaper`, `pet` …) | 2 |
| Notes 위젯 (탭/자동저장/투명도) | 스티키 노트 앱 (multi-tab, localStorage 자동저장) | 2 |
| Snippets (검색+복사 치트시트) | 스니펫 보관함 앱 (지갑 주소, 자주 쓰는 링크 등) | 2 |
| Browser 위젯 (URL 박스+디바이스 프리셋) | 미니 브라우저 앱 — 내 Vercel 앱들의 모바일/태블릿 뷰 미리보기 | 2 |
| Calculator | 계산기 앱 (히스토리 포함) | 2 |
| 테마 JSON 내보내기/가져오기 | 환경 설정(배경/밀도/효과) JSON 파일 export/import + 커스텀 배경 업로드 | 3 |
| 위젯별 `Op` 불투명도 버튼 | 창별 불투명도 조절 (기존 Liquid Glass 토글 옆) | 3 |
| `Ctrl +/-` 스케일 | 전역 UI 스케일 설정 (System Folder에 추가) | 3 |
| PTY/SSH/tmux/LLM 런처/env 편집기/캡처 방지 | **반영 안 함** — 브라우저 정적 앱에서 불가능하거나 무의미 | — |

---

## 3. Tier 1 — 핵심 (가장 먼저 구현 권장)

### 3.1 워크스페이스 스냅샷: 창 레이아웃 영속화

**원본 컨셉**: Vibe IDE의 가장 큰 매력. 패널을 어떻게 배치했든 재시작하면 그대로 복원.

**현재 상태**: `state.windows`(src/app.js:247)는 메모리에만 존재. 저장 키는
environment/music/pet/schedules 4종뿐(src/app.js:3-6)이라 **새로고침하면 모든 창이
사라지고 Welcome 창만 다시 뜬다**. 창 시스템이 이미 잘 만들어져 있는데 휘발되는 것이
가장 아까운 부분.

**설계**:

```js
const windowLayoutStorageKey = "cookielab-os-window-layout";

function saveWindowLayout() {
  const windows = Object.values(state.windows).map((w) => ({
    id: w.id,
    kind: w.kind,
    appId: w.appId,
    x: w.x, y: w.y, width: w.width, height: w.height,
    zIndex: w.zIndex,
    minimized: w.minimized,
    maximized: w.maximized,
    liquidGlass: w.liquidGlass,
    launched: Boolean(w.launched), // app-detail iframe 실행 상태도 복원
  }));
  try {
    localStorage.setItem(
      windowLayoutStorageKey,
      JSON.stringify({ version: 1, focusedWindowId: state.focusedWindowId, windows }),
    );
  } catch (error) { /* 저장 실패는 무시 (private mode 등) */ }
}
```

- **저장 시점**: `openWindow`/`closeWindow`/`minimizeWindow`/`toggleMaximizeWindow`/
  `toggleWindowLiquidGlass`/`finishWindowGesture`(src/app.js:3060) 끝에서 호출.
  드래그 중(`updateWindowGesture`)에는 호출하지 않는다 (성능).
- **복원 시점**: `ensureInitialWindows`(src/app.js:817)에서 스냅샷이 있으면 Welcome
  기본 창 대신 스냅샷을 재구성. 각 창은 `zIndex` 오름차순으로 정렬해 넣고
  `state.nextZIndex`를 최대값+1로 갱신, 마지막에 `normalizeWindowBounds`로
  뷰포트 변화(모니터 변경 등)에 대응.
- **검증**: `kind`가 유효한지, `appId`가 `appById()`로 조회되는지 확인하고 아니면
  해당 항목만 버린다 (apps.js에서 앱이 삭제된 경우 대비).
- **주의**: `getDefaultWindowBounds`의 도크/패널 기준 배치 로직(src/app.js:508)은
  복원 경로에서는 타지 않아야 한다 — 저장된 좌표를 그대로 쓴다.

**효과**: 사용자가 "크립토 대시보드 왼쪽, IPO 오른쪽, 노트 하단" 같은 자기만의
작업 배치를 만들어두면 매번 그대로 시작. Vibe IDE의 워크스페이스 경험과 동일.

**확장(선택)**: 여러 벌의 레이아웃을 이름 붙여 저장하는 "워크스페이스 프리셋"
(예: `리서치 모드`, `모니터링 모드`)을 Start Menu에서 전환. 1단계에서는 단일
스냅샷만으로 충분하다.

### 3.2 메모리 세이버: 최소화된 iframe 절전

**원본 컨셉**: 비활성 워크스페이스의 PTY를 정리해 RAM을 아끼되 레이아웃은 유지.

**CookieLab 번역**: 앱 창의 iframe(src/app.js:2403-2410)은 각각 완전한 Vercel
앱(React 대시보드 등)이라 창 4~5개를 띄우면 메모리·CPU 부담이 상당하다.
최소화된 창의 iframe은 어차피 안 보이므로 내려도 된다.

**설계**:

- `windowState.suspended` 필드 추가. `minimizeWindow`에서 `kind === "app-detail" &&
  launched`인 창에 대해 타이머(기본 3분) 시작 → 만료 시 `suspended = true` + `render()`.
- `AppDetailWindow`에서 `launched && suspended`이면 iframe 대신 절전 플레이스홀더
  (앱 아이콘 + "절전 모드 — 창을 열면 다시 로드됩니다") 렌더링.
- `focusWindow`/최소화 해제 시 `suspended = false`로 되돌리면 다음 render에서
  iframe이 자연스럽게 재생성된다 (문자열 템플릿 구조라 별도 로직 불필요).
- System Folder에 토글 추가: `메모리 세이버 (최소화된 앱 절전)` on/off +
  대기 시간. 설정은 `environment`에 저장.
- 스냅샷(3.1)과 결합: 복원 시 `launched`였던 창은 `suspended: true`로 시작시키면
  **부팅 시 iframe 5개가 동시에 로드되는 폭탄을 피할 수 있다**. 포커스된 창만
  즉시 로드.

### 3.3 창 엣지 스냅 (하프 스냅 + 자석)

**원본 컨셉**: Vibe IDE 위젯은 이동/리사이즈 시 인접 엣지에 스냅된다.

**설계** (기존 제스처 코드에 삽입):

- `updateWindowGesture`(src/app.js:3008)에서 포인터가 작업영역 좌/우 가장자리
  24px 이내로 들어오면 반투명 스냅 프리뷰 오버레이 표시.
- `finishWindowGesture`(src/app.js:3060)에서 프리뷰가 활성 상태면 창을 해당
  절반(좌 50% / 우 50%)으로 배치. `prevBounds`에 원래 크기를 저장해두고
  타이틀바를 다시 드래그하면 원복 — `toggleMaximizeWindow`(src/app.js:784)의
  기존 패턴 재사용.
- 창끼리 자석: 드래그 중 다른 창의 엣지와 ±8px 이내로 근접하면 좌표를 흡착.
  계산은 보이는 창(`!minimized`)의 bounds 목록과 비교하는 단순 O(n) 루프면 충분.
- 상단 가장자리 스냅 = 최대화(Windows 관례)로 연결하면 학습 비용 없음.

---

## 4. Tier 2 — 새 시스템 위젯 앱

Vibe IDE 위젯 8종 중 브라우저에서 의미 있는 5종을 CookieLab 시스템 앱으로 이식한다.
모두 기존 `WindowPanel`(src/app.js:1577) + `data-action` 위임 패턴을 그대로 쓰고,
apps.js에 `system: true` 항목으로 등록한다 (System Folder / Music Player와 동일한 방식,
`AppDetailWindow`의 분기(src/app.js:2379-2389)에 case 추가).

### 4.1 CookieLab Terminal — 이 제안의 시그니처 앱

**원본 컨셉**: Vibe IDE의 중심은 터미널이다. PTY는 불가능하지만, **"OS를 키보드로
조작하는 터미널"**은 데스크탑 셸 컨셉과 정확히 맞아떨어진다. 부트 스크린
(`bootLines`, src/app.js:342)의 ROM 감성과도 연결된다.

**명령어 셋 (1차)**:

```
help                  명령어 목록
apps                  설치된 앱 목록 (status 포함)
open <app-id>         앱 창 열기 (launchAppInWindow 재사용)
close [app-id]        창 닫기 (인자 없으면 포커스된 창)
wallpaper [id]        배경 목록 / 변경 (setWallpaper 재사용)
density <id>          아이콘 밀도 변경
music play|pause|next 뮤직 플레이어 제어 (기존 함수 재사용)
pet on|off            데스크탑 펫 토글
date / time           달력·시계
neofetch              CookieLab OS 로고 + 시스템 정보 (재미 요소)
clear                 화면 지우기
```

**구현 포인트**:

- 명령어 레지스트리를 `{ name, description, run(args) }` 배열로 만들면 `help`가
  자동 생성되고, 아래 커맨드 팔레트와 공유 가능.
- 출력 히스토리는 `state.terminal.lines` 배열로 관리하되, **입력 중 문자는 state에
  넣지 않는다** (§6 render 주의사항 참고). 명령 실행 시점에만 state를 갱신.
- 위/아래 화살표로 명령 히스토리 탐색, Tab으로 app-id 자동완성까지 하면 완성도가
  크게 올라간다.

**보너스 — 커맨드 팔레트**: 같은 레지스트리를 `Ctrl+K` 오버레이(퍼지 검색 + Enter
실행)로 노출. Vibe IDE 사용자층(키보드 중심)이 기대하는 UX이며 구현 비용은
터미널 대비 매우 작다.

### 4.2 Notes (스티키 노트)

**원본 컨셉**: 워크스페이스별 스크래치패드, 멀티 탭, 자동저장, 탭별 테마/투명도.

- 저장 키 `cookielab-os-notes`: `{ version, tabs: [{ id, title, body, accent }], activeTabId }`
- `input` 이벤트에서 debounce(500ms) 자동저장. **textarea 값은 render() 경로와
  분리**해야 한다 — §6 참고.
- 탭별 accent 색(민트/블루/옐로/핑크 — 기존 팔레트 재사용)과 창 자체의 Liquid
  Glass 토글이 이미 있으므로 투명도 요구는 Tier 3의 Op 버튼이 해결.
- 리서치 OS라는 정체성과 잘 맞는다: 대시보드 보면서 메모하는 용도가 명확.

### 4.3 Snippets 보관함

**원본 컨셉**: 전역 치트시트 (검색 + 원클릭 복사).

- 크립토/에어드랍 사용자에게 실용성이 높다: 지갑 주소, 컨트랙트 주소, 자주 쓰는
  링크, 반복 입력 텍스트를 등록해두고 검색 → `navigator.clipboard.writeText` 복사
  → `showNotice("복사됨")`.
- 저장 키 `cookielab-os-snippets`: `[{ id, label, value, tag }]`. 태그 필터 +
  검색 인풋이면 충분. CRUD는 Scheduler 창(src/app.js:2648)의 폼 패턴 재사용.

### 4.4 Mini Browser (디바이스 프리셋 프리뷰)

**원본 컨셉**: URL 박스 + 데스크탑/폰/태블릿 프리셋을 가진 브라우저 위젯.

- URL 입력창 + 프리셋 버튼(Desktop / Tablet 768 / Phone 375). 프리셋 선택 시
  iframe을 해당 CSS 픽셀 폭의 내부 프레임으로 렌더링 (창 안에서 중앙 정렬).
- **핵심 용도**: 사용자의 Vercel 앱들은 전부 자기 소유라 iframe 허용 —
  **내 대시보드들의 모바일 레이아웃을 OS 안에서 바로 점검**할 수 있다.
- 외부 임의 URL은 `X-Frame-Options`/CSP로 거부될 수 있으므로, iframe `load` 실패를
  감지하기 어렵다는 한계를 UI 문구로 안내 ("일부 사이트는 임베드를 차단합니다.
  Open Externally를 사용하세요").
- apps.js의 앱 목록을 북마크 드롭다운으로 제공하면 입력 없이 전환 가능.

### 4.5 Calculator

- 사칙연산 + 괄호 + `%`, 결과 히스토리(클릭하면 재입력). `eval` 금지 —
  단순 재귀하강 파서 또는 shunting-yard로 안전하게. 코드 100줄 내외의 소품이지만
  "OS다움"을 채워주는 앱.

---

## 5. Tier 3 — 테마/폴리시

### 5.1 테마 JSON 내보내기/가져오기 + 커스텀 배경

**원본 컨셉**: Vibe IDE는 배경 이미지 + Glass 설정을 JSON으로 저장/공유하고,
번들 테마(`theme/glass_set_01.json`)로 시딩한다.

- System Folder에 `테마 내보내기` 버튼: `environment` + (추가된다면) 커스텀 색
  변수를 JSON 파일로 다운로드 (`Blob` + `URL.createObjectURL` + `<a download>`).
- `테마 가져오기`: `<input type="file" accept=".json">` → 파싱/검증 →
  `saveEnvironment()` + `applyEnvironment()`.
- **커스텀 배경 업로드**: 이미지 파일 → IndexedDB 저장(권장, localStorage는 5MB
  한계) → `--bg-image` CSS 변수로 적용. `wallpaperOptions`(src/app.js:28)에
  `custom` 항목 추가.

### 5.2 창별 불투명도 (Op 버튼)

**원본 컨셉**: 모든 위젯에 `Op` 버튼이 있어 위젯별 투명도를 저장.

- 타이틀바의 Liquid Glass 토글 옆에 Op 버튼 추가 → 클릭 시 80% ↔ 60% ↔ 100%
  순환(또는 작은 슬라이더 팝오버). `windowState.opacity`로 저장하고 3.1 스냅샷에
  포함. 노트를 반투명으로 띄워놓고 뒤 대시보드를 보는 Vibe IDE 특유의 사용법이
  그대로 재현된다.

### 5.3 전역 UI 스케일

- System Folder에 스케일 슬라이더(85%~120%): `document.documentElement.style
  .fontSize` 또는 `--ui-scale` 변수 하나로 제어. `environment.scale`로 저장.
- `Ctrl +/-`는 브라우저 줌과 충돌하므로 단축키는 잡지 않는다 (설정 UI만).

---

## 6. 아키텍처 주의사항 — render() 전체 교체와 입력 위젯

MULTI_WINDOW_PROPOSAL.md 시절부터의 구조적 제약: `render()`(src/app.js:2781)는
`innerHTML` 전체 교체이므로 **렌더 시점에 textarea/터미널 입력값·커서·스크롤이
파괴된다**. SoundCloud iframe 파괴 버그와 동일한 계열의 문제.

Notes/Terminal/Browser 창을 넣을 때 반드시 다음 중 하나를 따라야 한다:

1. **(권장)** 입력 노드는 render 문자열에 초기값만 넣고, 이후 갱신은
   `updateClockNodes`(src/app.js:827)/`updateCryptoTickerNodes` 패턴처럼
   **타깃 노드만 부분 업데이트**한다. 전체 render()가 불가피하게 돌 때를 대비해
   render() 직전에 활성 입력값·스크롤 위치를 읽어 state에 백업하고 직후 복원하는
   훅(`captureVolatileState()` / `restoreVolatileState()`)을 한 쌍 만들어두면
   신규 위젯 전부가 재사용할 수 있다.
2. 크립토 티커 60초 갱신, 시계 tick 등이 전체 render()를 타지 않는지 재확인한다
   (현재는 부분 업데이트로 분리되어 있음 — 이 상태를 유지해야 신규 입력 위젯이
   안전하다).

또한 localStorage 키가 5종 → 8종+로 늘어나므로, 각 스냅샷에 `version` 필드를
넣고 로드 함수는 예외 시 기본값 반환(기존 `loadSchedules` 패턴, src/app.js:218)을
지키면 마이그레이션이 쉬워진다.

---

## 7. 유사 컨셉 참고 프로젝트

| 프로젝트 | 참고 포인트 |
| --- | --- |
| [daedalOS](https://github.com/DustinBrett/daedalOS) | 브라우저 데스크탑의 정점. **터미널 명령어 셋, 창 스냅, 동적 배경(셰이더), 파일시스템** 아이디어의 보고 |
| [Puter](https://github.com/HeyPuter/puter) | DESIGN_REFRESH에서 이미 참조. 앱스토어/파일 저장 등 "진짜 OS화" 장기 방향 |
| [awesome-web-desktops](https://github.com/syxanash/awesome-web-desktops) | 웹 데스크탑 프로젝트 큐레이션 목록 — UI 아이디어 탐색용 |
| [win11React](https://win11.blueedge.me) / [macos-web](https://macos-web.app) | 스냅 프리뷰 연출, 독 인터랙션 (기존 참조 유지) |

---

## 8. 권장 구현 순서

1. **3.1 창 레이아웃 영속화** — 효과 대비 비용이 가장 좋고, 이후 기능(절전 상태,
   불투명도)의 저장 인프라가 된다.
2. **3.2 메모리 세이버** — 3.1의 복원 경로와 함께 구현하면 부팅 성능 문제를
   원천 차단.
3. **6장 입력 보존 훅** — Tier 2 위젯들의 선행 조건.
4. **4.1 Terminal + 커맨드 팔레트** — 시그니처 기능. 명령 레지스트리가 이후 앱들의
   진입점 역할.
5. **4.2 Notes → 4.3 Snippets → 4.5 Calculator → 4.4 Mini Browser** — 각각 독립적,
   병렬 작업 가능.
6. **3.3 엣지 스냅, Tier 3** — 폴리시 단계.

각 단계는 독립 커밋/독립 검증이 가능하도록 위 순서를 유지한다.
