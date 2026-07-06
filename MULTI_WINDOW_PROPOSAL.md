# CookieLab OS — 멀티 윈도우 전환 제안서

작성일: 2026-07-01
상태: 제안 단계 (코드 미작성, 설계 검토용)
대상: 이 문서를 보고 구현할 개발자 / Codex 등 병행 작업 도구

---

## 1. 배경 및 목표

현재 CookieLab OS는 바닐라 JS/HTML/CSS로 만든 레트로 데스크탑 스타일 프로젝트 런처다.
빌드 도구, 프레임워크 없이 단일 IIFE(`src/app.js`, ~1720줄)가 `state` 객체를 기반으로
`render()`가 전체 `innerHTML`을 문자열로 재생성하는 구조다.

**목표**: 폴더/앱 아이콘 클릭 시 macOS/Windows 스타일의 실제 팝업 창이 뜨고,
- 여러 창이 동시에 겹쳐서 열릴 수 있어야 하고 (진짜 멀티 윈도우)
- 각 창은 독립적으로 드래그 이동 가능해야 하고
- 좌측 상단 빨강/노랑/초록 버튼이 각각 닫기/최소화/최대화로 실제 동작해야 한다.

전체적으로 "정적 화면 → 반응형(인터랙티브) 화면"으로 전환하는 것이 목표다.
프레임워크 도입은 범위 밖 — 기존 vanilla-JS, 문자열 템플릿 기반 렌더링 패턴은 유지한다.

---

## 2. 현재 구조 요약 (변경 전 상태)

- `state.selectedAppId` (`src/app.js:193`)가 **문자열 하나**로 "현재 열린 창"을 표현.
  `AppDetailWindow()`(`src/app.js:1145`)가 이 값을 보고 SystemFolderWindow / MusicPlayerWindow /
  일반 상세 창 중 하나를 반환 → **동시에 두 개 이상의 앱 창을 열 수 없음.**
- `WelcomeWindow()`, `SystemLog()`는 항상 렌더링되는 고정 위치 패널이며, CSS 그리드
  슬롯(`.center-stack`, `.detail-slot`)에 배치될 뿐 절대 위치도 z-index 관리도 없음.
- `WindowPanel({ id, title, className, children, actions, closeAction, focusable })`
  (`src/app.js:632-668`)가 모든 창 타입의 공통 셸을 렌더링.
  - 트래픽라이트(`.window-controls` 내부 `.control-dot` 3개, `src/app.js:653-658`)는
    `aria-hidden="true"`가 붙은 순수 장식용 `<span>` — 클릭 핸들러도, `data-action`도 없음.
  - 닫기는 별도의 `.window-close` 버튼(`data-action="${closeAction}"`)으로만 동작.
  - 최소화/최대화 기능은 코드베이스 어디에도 존재하지 않음.
- 창 호출부: Welcome(`~784`), SystemFolder(`~850`), MusicPlayer(`~1095`),
  AppDetail(`~1164`), SystemLog(`~1223`) — 모두 `WindowPanel()`을 호출.
- 이벤트 처리: `root.addEventListener("click", ...)` (`src/app.js:1547-1699`)에
  20개 가까운 `if/else` 분기로 모든 액션을 위임 처리. 드래그(`mousedown/mousemove/mouseup`)
  로직은 전혀 없음.
- 상태 변경 → `render()` → **전체 데스크탑 DOM을 문자열로 재생성 후 `innerHTML` 교체.**
  60초 시계 tick(`src/app.js:1714-1719`)도 이 경로를 타서 SoundCloud iframe이
  1분마다 파괴/재생성되는 부작용이 있음 (별도 버그, 이 문서 범위 밖이지만 연관 있음).

---

## 3. 목표 아키텍처 (멀티 윈도우 모델)

### 3.1 상태 모델

`state.selectedAppId` 단일 문자열을 폐기하고, 창 인스턴스를 맵으로 관리한다.

```js
state.windows = {
  "app-detail:crypto-dashboard": {
    id: "app-detail:crypto-dashboard",
    kind: "app-detail",       // "welcome" | "system-log" | "system-folder" | "music-player" | "app-detail"
    appId: "crypto-dashboard", // kind별로 필요한 참조 데이터 (없을 수도 있음)
    x: 120, y: 96,             // 데스크탑 기준 절대 좌표 (px)
    width: 480, height: 360,
    zIndex: 3,
    minimized: false,
    maximized: false,
    prevBounds: null,          // 최대화 전 {x,y,width,height} 저장, 복원용
    focusable: true,
  },
  // ... 여러 창 동시 존재 가능
};

state.nextZIndex = 4;          // 포커스 시 증가하는 z-index 카운터
state.focusedWindowId = "app-detail:crypto-dashboard";
```

- 기존 `render()`의 "state → 문자열 템플릿 → innerHTML 교체" 패턴은 그대로 유지.
  각 `WindowPanel` 호출부가 `state.windows[id]`를 읽어 인라인
  `style="left:...; top:...; width:...; height:...; z-index:..."`와
  `.is-minimized` / `.is-maximized` / `.is-focused` 클래스를 넣는 방식으로 확장.
- VDOM diffing 도입 없이 기존 스타일과 일관성 유지.
- `Welcome`, `SystemLog`도 이제 "항상 열려 있는 창 인스턴스"로 `state.windows`에
  등록해 다른 창과 동일한 방식(드래그, 닫기, z-index)으로 다뤄질지, 혹은 계속
  고정 배경 패널로 둘지는 결정 필요 (§6 열린 질문 참조).

### 3.2 창 열기/닫기/포커스 함수

`selectApp` / `closeDetail` 등 기존 단일-창 가정 함수들을 교체:

- `openWindow(kind, options)` — `state.windows`에 새 인스턴스 추가 (또는 이미 열려 있으면
  해당 창에 포커스만 이동), 기본 위치는 계단식(cascade) 오프셋으로 배치.
- `closeWindow(id)` — `state.windows`에서 해당 id 제거.
- `focusWindow(id)` — `state.focusedWindowId = id`, `zIndex = ++state.nextZIndex`.
- `minimizeWindow(id)` / `restoreWindow(id)` — `minimized` 플래그 토글.
- `toggleMaximizeWindow(id)` — `maximized` 플래그 토글, 토글 시 `prevBounds` 저장/복원.

### 3.3 트래픽라이트 버튼

`src/app.js:653-658`의 `aria-hidden` `<span>` 3개를 실제 `<button>`으로 교체:

```html
<span class="window-controls">
  <button type="button" class="control-dot control-danger"
          data-action="window-close" data-window-id="${id}"
          aria-label="${escapeHtml(title)} 닫기"></button>
  <button type="button" class="control-dot control-warning"
          data-action="window-minimize" data-window-id="${id}"
          aria-label="${escapeHtml(title)} 최소화"></button>
  <button type="button" class="control-dot control-success"
          data-action="window-maximize" data-window-id="${id}"
          aria-label="${escapeHtml(title)} 최대화"></button>
</span>
```

기존 `.window-close` 버튼은 제거하거나(권장) 중복 닫기 UI를 두지 않는다 — 스크린리더
사용자 입장에서 헤더에 닫기 버튼이 두 개 있으면 혼란스럽다.

기존 클릭 위임 핸들러(`src/app.js:1547`)에 세 액션 분기 추가, `data-window-id`로
대상 창을 특정해 `closeWindow`/`minimizeWindow`/`toggleMaximizeWindow` 호출.

### 3.4 드래그 & 리사이즈

**성능이 가장 중요한 부분**: 드래그 중 매 `mousemove`마다 `render()`(전체 innerHTML
재생성)를 호출하면 안 된다. 60+ 이벤트/초로 눈에 띄게 버벅인다.

권장 구현 (`attachWindowChrome(state, render)` 같은 별도 작은 모듈로 분리, 기존
1547줄짜리 거대 클릭 핸들러에 더 쑤셔 넣지 않는다):

1. `.window-titlebar`에서 `pointerdown` (단, `.window-controls button` 클릭은 제외) →
   시작 오프셋 기록.
2. `pointermove` 중에는 **DOM 엘리먼트에 직접** `style.left/top`만 갱신 (state 커밋 X,
   재렌더 X).
3. `pointerup` 시점에만 `state.windows[id].x/y`에 커밋하고 필요 시 재렌더.
4. `pointerdown`이 `.window-panel` 어디든 발생하면 `focusWindow(id)` 호출
   (포커스/z-index는 클래스 토글 + 인라인 z-index만 갱신, 전체 재렌더 지양).
5. 리사이즈는 v1 범위로 우하단 코너 핸들 하나만 (8~10px 히트 영역, `cursor: nwse-resize`).
   전체 8방향 리사이즈는 범위 밖 (레트로 OS 컨셉에 비해 과함).

### 3.5 최대화 / 최소화 동작

- **최대화**: `.window-panel.is-maximized`가 인라인 `left/top/width/height`를
  `!important`로 덮어쓰거나 `position: fixed`로 전체 뷰포트(상단바/작업표시줄 높이 제외)를
  채우도록. 최대화 상태에서는 드래그/리사이즈 비활성화 (실제 OS 컨벤션).
  타이틀바 더블클릭으로도 동일 동작 트리거 (초록 버튼과 동일 함수 재사용).
- **최소화**: 정확한 타겟 좌표 계산(taskbar 아이콘 `getBoundingClientRect()`) 대신,
  범용 축소 애니메이션(`scale(0.1) translateY(40vh)` 등)으로 "최소화됨"을 표현 —
  taskbar 레이아웃이 리플로우돼도 깨지지 않음. 최소화된 창은 `hidden` 속성 또는
  `aria-hidden="true"` + `inert`로 접근성 트리에서 완전히 제외 (단순히 시각적으로
  scale(0) 처리만 하면 스크린리더 사용자가 보이지 않는 창에 탭으로 들어가는 문제 발생).

---

## 4. CSS 변경 사항 (`styles/retro-os.css`)

- `.window-panel` (`:600-610` 부근): `position: absolute` 추가 (멀티 윈도우 전환 시),
  `transition: box-shadow 160ms ease, transform 160ms ease;` 추가 (현재는 열릴 때
  `windowOpen` 애니메이션만 있고 상태 변화 시 트랜지션 없음).
- `.window-panel.is-focused`: 강한 `box-shadow`로 깊이감 표현.
- `.window-panel:not(.is-focused) .window-titlebar`: 배경 불투명도/글자색을 흐리게 —
  macOS의 비활성 창 타이틀바 흐림 효과 모사.
- `.control-dot`: `cursor: pointer`, `border: none`, `:focus-visible` 아웃라인
  (`outline: 2px solid var(--accent-mint); outline-offset: 2px`), hover 시 내부에
  ×/−/+ 글리프 표시 (색상만으로 구분되지 않도록 — 마우스 사용자 발견성 보강).
- `.window-titlebar { cursor: grab; }`, `.window-titlebar:active { cursor: grabbing; }`,
  단 `.window-controls, .window-controls * { cursor: pointer; }`로 컨트롤 버튼은 예외.
- `.window-resize-handle`: 우하단 8~10px 히트 영역, `cursor: nwse-resize`.
- `.window-panel.is-maximized`: `inset: <topbar-height> 0 <taskbar-height> 0 !important;`
  (또는 `position: fixed` 풀스크린), 리사이즈 핸들/드래그 커서 숨김.

---

## 5. 접근성 — 반드시 지켜야 할 것

- **드래그가 창 이동의 유일한 수단이면 안 됨.** 타이틀바가 포커스된 상태에서
  방향키로 20px씩 이동 (Shift+방향키는 더 큰 스텝), 최대화/최소화도 키보드 단축키
  또는 버튼의 Enter/Space로 동일하게 동작해야 함.
- 기존 `focusable: true` + `tabindex="-1"` + `.focus()` 패턴(`src/app.js:639/651,
  1459/1485/1491`)을 새 트래픽라이트 버튼에도 유지 — Tab 순서상 타이틀바(컨트롤
  버튼 포함)가 본문보다 먼저 오도록 마크업 순서 확인.
- 최대화는 더블클릭에만 의존하지 말고 초록 버튼 단일 클릭으로도 동일하게 동작
  (터치/키보드 사용자 배려).
- 최소화/최대화 애니메이션은 `prefers-reduced-motion` 존중 — 코드베이스에 이미
  유사 패턴 있음 (`selectApp`의 `scrollIntoView`, `src/app.js:1462`). `matchMedia
  ("(prefers-reduced-motion: reduce)").matches`일 때 트랜지션 0ms 처리.
- 최소화된 창은 `hidden` 또는 `aria-hidden="true"` + `inert`로 접근성 트리에서 제외.
- 창 닫기(Escape 키 또는 닫기 버튼) 후 포커스를 원래 트리거(아이콘)로 복귀시키는
  로직 추가 — 현재 코드에는 이 복귀 로직 자체가 없음 (기존 리뷰에서 발견된 별도 이슈,
  멀티 윈도우 전환과 함께 고치는 게 자연스러움).

---

## 6. 결정이 필요한 열린 질문

1. **Welcome / System Log 창의 취급**: 항상 열려 있는 고정 배경 패널로 유지할지,
   아니면 다른 앱 창과 동일하게 닫기/드래그/최소화 가능한 일반 창으로 승격할지.
   → 일관성을 위해 후자로 선택. 단 첫 진입 시 기본 위치/크기를 데스크탑 크기에 맞춰
   센터 정렬하는 로직 필요. 

2. **창 최대 개수 제한 여부**: 동일 앱을 여러 번 열 수 있게 할지, 앱당 창 인스턴스는
   하나로 제한하고 이미 열려 있으면 포커스만 이동시킬지. → 앱당 1개 인스턴스 제한.
   (레트로 OS 컨셉에서 동일 앱 중복 실행은 혼란 유발 가능성).

3. **모바일/좁은 화면 대응**: 현재 CSS에 `max-width: 420px` 반응형 브레이크포인트가
   있음 (`styles/retro-os.css:2118-2131`). 절대 위치 기반 자유 이동 창은 좁은 화면에서
   사용성이 떨어짐 — 좁은 화면에서는 드래그/리사이즈를 비활성화하고 항상 최대화
   상태로 강제.

4. **터치 디바이스 드래그 지원 범위**: `pointerdown/pointermove/pointerup`은 터치도
   커버하지만, 터치 스크롤과의 충돌(`touch-action: none` 필요 여부) 검토 필요.

5. **기존 60초 렌더 tick과의 상호작용**: 현재 시계 tick이 `render()`를 호출해 전체
   DOM을 재생성하는 버그(별도 이슈, §2 참고)가 있는데, 멀티 윈도우 전환 시 드래그 중
   tick이 발생하면 드래그 중인 창의 임시 DOM 위치(state 미반영 상태)가 시계 tick의
   전체 재렌더로 덮어써질 수 있음. **이 버그는 멀티 윈도우 구현 전에 먼저 고치는 것을
   권장** — 그렇지 않으면 드래그 중 창이 원위치로 순간이동하는 새로운 버그가 생김.
   → 해당 사항을 먼저 고치는 것으로 결정

---

## 7. 구현 순서 제안 (단계별, 각 단계 후 동작 확인 가능)

1. **선행 버그 수정** (§6-5): 60초 tick이 전체 `render()`를 호출하지 않고 `<time>`
   요소만 갱신하도록 수정. (멀티 윈도우 작업의 전제 조건)
2. `state.windows` 맵 도입 + `openWindow`/`closeWindow`/`focusWindow` 함수 작성,
   기존 `selectedAppId` 경로를 이 맵 기반으로 교체 (아직 드래그/최소화/최대화 없이
   "여러 창이 동시에 열리고 겹칠 수 있다"만 먼저 동작 확인).
3. 트래픽라이트 버튼 실제 동작화 (닫기/최소화/최대화 로직, 아직 드래그 없이).
4. 드래그 구현 (`attachWindowChrome`), z-index/포커스 스태킹.
5. 최대화 상태 CSS/토글, 더블클릭 타이틀바 바인딩.
6. 리사이즈 핸들 (우하단만, v1).
7. 접근성 패스: 키보드 이동/최대화, 포커스 복귀, `inert`/`aria-hidden` 처리,
   `prefers-reduced-motion` 대응.
8. 반응형/모바일 대응 (§6-3 결정에 따라).

---

## 8. 참고 — 기존 코드 위치 인덱스

- `src/app.js:193` — `state.selectedAppId` (교체 대상)
- `src/app.js:632-668` — `WindowPanel()` 공통 셸
- `src/app.js:653-658` — 트래픽라이트 장식용 span (교체 대상)
- `src/app.js:780-808, 810-899, 901-1123, 1145-1200, 1202-1239` — 창 호출부
  (Welcome, SystemFolder, MusicPlayer, AppDetail, SystemLog)
- `src/app.js:1284` 부근 — `Taskbar()` (최소화 타겟 참고용)
- `src/app.js:1369-1418` — `Desktop()`/레이아웃 슬롯, `render()`
- `src/app.js:1428-1493` — `selectApp`, `closeDetail`, 포커스 헬퍼 (교체 대상)
- `src/app.js:1547-1699` — 클릭 위임 핸들러 (액션 분기 추가 지점)
- `src/app.js:1714-1719` — 60초 tick (선행 수정 대상)
- `styles/retro-os.css:600-696` — `.window-panel`, `.window-titlebar`, `.control-dot`,
  `.window-close`, `.window-body`
- `styles/retro-os.css:2118-2131` — 좁은 화면(≤420px) 반응형 브레이크포인트

---

## 9. 범위 밖 (이번 제안서에서 다루지 않음)

- 프레임워크/빌드 도구 도입
- 8방향 전체 리사이즈
- 창 스냅(Windows Aero Snap 스타일 절반/모서리 정렬)
- 다중 모니터/가상 데스크탑 개념
- SoundCloud iframe tick 버그 외의 다른 기존 버그 수정 (별도 이슈로 트래킹 권장)
