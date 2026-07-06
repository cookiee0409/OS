# CookieLab OS — 멀티 윈도우 후속 개선 제안서

작성일: 2026-07-02
상태: 제안 단계 (코드 미작성, 설계 검토용)
선행 문서: [MULTI_WINDOW_PROPOSAL.md](./MULTI_WINDOW_PROPOSAL.md) (1차 제안, 코덱스가 구현 완료)
대상: 이 문서를 보고 구현할 개발자 / Codex 등 병행 작업 도구

---

## 1. 배경

`MULTI_WINDOW_PROPOSAL.md`에서 제안한 멀티 윈도우 전환이 구현되었다. 실제 브라우저에서
직접 확인한 결과 다음 핵심 기능은 정상 동작한다:

- `state.windows` 맵 기반 멀티 윈도우 (여러 창 동시 오픈, 겹침, 독립 z-index)
- 드래그 이동 (`pointerdown/move/up`, 뷰포트 경계 클램핑 포함)
- 트래픽라이트 버튼 실제 동작 (닫기/최소화/최대화)
- 최소화 시 `hidden` + `aria-hidden="true"` + `inert` 적용 (접근성 트리 제외 정상)
- 최대화/복원 토글, CSS `!important` 인셋 오버라이드
- 키보드 방향키로 창 이동 (Shift = 큰 스텝, 최대화/최소화 상태에서는 비활성)
- 60초 시계 tick이 더 이상 전체 `render()`를 호출하지 않고 `updateClockNodes()`만 호출
  (선행 버그 수정 완료)
- 기존 `aria-pressed` truthy-string 버그 해결됨
- SoundCloud iframe이 로컬 오디오로 교체되어 관련 이슈 소멸

이 문서는 후속 리뷰에서 발견된 **남은 이슈**만 다룬다. 이미 해결된 항목은 재언급하지 않는다.

---

## 2. 우선순위: 심각 (Critical)

### 2.1 최소화 시 포커스가 사라짐 (닫기와 비대칭)

- **위치**: `src/app.js:436-453` (`minimizeWindow`)
- **증상**: `closeWindow`(`src/app.js:428-433`)는 창을 닫은 뒤
  `focusWindowElement(state.focusedWindowId)`를 호출해 다음 창으로 포커스를 옮기지만,
  `minimizeWindow`는 다음 포커스 대상(`topVisibleWindow()`)을 계산만 하고
  `render()`만 호출한다. `render()`가 `innerHTML`을 통째로 교체하므로 방금 클릭한
  최소화 버튼의 DOM 노드가 파괴되고, 포커스는 명시적으로 이동되지 않아 `<body>`로
  떨어진다.
- **제안 수정**: `minimizeWindow` 끝에 `closeWindow`와 동일한 패턴 추가:
  ```js
  if (state.focusedWindowId) {
    focusWindowElement(state.focusedWindowId);
  }
  ```

### 2.2 마지막 창을 닫으면 포커스가 완전히 사라짐

- **위치**: `src/app.js:417-423` (`closeWindow`)
- **증상**: `nextWindow`가 없을 때(즉, 열린 창이 하나도 안 남았을 때)
  `state.focusedWindowId`가 빈 문자열이 되고, 이후 아무 곳에도 포커스를 주지 않는다.
  이는 1차 제안서 §5에서 이미 지적했던 "닫기 후 원래 트리거로 포커스 복귀" 문제가
  이번 구현에서도 반영되지 않은 것.
- **제안 수정**: 두 가지 방식 중 선택
  1. **(권장, 구현 간단)** 열린 창이 없을 때 작업표시줄의 Start 버튼 또는 첫 번째
     고정 아이콘으로 포커스 폴백.
  2. **(더 정확, 구현 큼)** `openWindow(kind, options)` 호출 시 트리거 요소
     (`document.activeElement` 또는 클릭 이벤트의 `event.target`)를 창 상태에
     `triggerElementSelector` 형태로 저장해두고, 해당 창이 마지막으로 닫힐 때
     그 요소로 포커스를 복귀.

---

## 3. 우선순위: 경고 (Warning)

### 3.1 리사이즈가 마우스/포인터 전용, 키보드 대안 없음

- **위치**: 키보드 이동 핸들러 `src/app.js:1994-2030`에는 방향키 창 *이동*만 있고
  리사이즈 로직이 없음. 리사이즈 핸들(`data-window-resize-handle`,
  `src/app.js:1824` 부근)은 포인터 이벤트로만 동작.
- **부가 이슈**: 핸들 히트 영역이 18×18px (`styles/retro-os.css:826-833`)로
  WCAG 2.5.8 최소 터치 타겟(24×24 CSS px) 기준 미달.
- **제안 수정**: 타이틀바 포커스 상태에서 `Shift+Ctrl+방향키` 등으로 리사이즈하는
  보조 경로 추가, 핸들 히트 영역을 최소 24×24px로 확대 (시각적 크기는 유지하고
  `::after` 가상 요소나 패딩으로 히트 영역만 확장 가능).

### 3.2 트래픽라이트 버튼 라벨이 영어, 나머지 UI는 한국어

- **위치**: `src/app.js:817, 825, 833`
  ```js
  aria-label="${escapeHtml(title)} close"
  aria-label="${escapeHtml(title)} minimize"
  aria-label="${escapeHtml(title)} maximize or restore"
  title="Close" / "Minimize" / "Maximize"
  ```
- **비교**: 레거시 닫기 버튼(`src/app.js:843`)은 `"${title} 닫기"`, 대부분의 다른
  라벨(예: `src/app.js:936` `"소개 창 열기"`)도 한국어.
- **문제**: 스크린리더 사용자가 창마다 언어가 섞인 안내를 듣게 됨 (locale 일관성 붕괴).
- **제안 수정**: `"${title} 닫기"` / `"${title} 최소화"` / `"${title} 최대화 또는 복원"`으로
  통일, `title` 툴팁도 `"닫기"/"최소화"/"최대화"`로 변경.

### 3.3 Escape 키가 입력 필드 포커스 여부와 무관하게 창을 닫음

- **위치**: `src/app.js:2041-2056`
- **증상**: 방향키 이동 핸들러(`src/app.js:2003`)에는
  `event.target.closest("button, a, input, textarea, select")` 가드가 있어 폼
  컨트롤에 포커스가 있을 때는 방향키가 창 이동으로 새지 않는다. 반면 Escape 핸들러에는
  이런 가드가 없어, 현재 유일한 폼 컨트롤인 볼륨 슬라이더(`src/app.js:1198-1204`)에
  포커스가 있어도 Escape를 누르면 창이 그대로 닫힌다.
- **영향**: 지금은 폼 컨트롤이 볼륨 슬라이더 하나뿐이라 체감 영향 적음. 하지만 향후
  텍스트 입력(검색창, 필터 등)이 추가되면 "입력값 지우려고 Escape 눌렀는데 창이
  닫히는" 문제가 생김. 패턴이 커지기 전에 지금 고쳐두는 것을 권장.
- **제안 수정**: Escape 핸들러 상단에 동일한 폼 컨트롤 가드 추가, 폼 컨트롭에
  포커스가 있으면 `blur()`만 하고 `return`.

### 3.4 모바일/컴팩트 모드에서 최대화 버튼이 죽은 컨트롤

- **위치**: `src/app.js:461-465` (`toggleMaximizeWindow` 내 `isCompactWindowMode()` 분기),
  CSS `styles/retro-os.css:2139-2148`
- **증상**: 컴팩트 모드에서는 모든 창이 CSS `!important`로 강제 풀스크린되므로,
  초록 버튼을 눌러도(`maximized = true`로만 설정되고 토글되지 않음) 시각적으로
  아무 변화가 없다. 버튼은 여전히 포커스 가능하고 클릭 가능한 상태로 남아있음.
- **제안 수정**: `isCompactWindowMode()`가 참일 때 초록 버튼에
  `aria-disabled="true"` + 시각적 비활성 스타일(`opacity` 낮춤, `pointer-events: none`)
  적용, 또는 컴팩트 모드에서는 트래픽라이트에서 초록 버튼 자체를 숨김.

### 3.5 `app.url`에 URL 스킴 검증 없음 (1차 리뷰에서 이미 지적, 미해결)

- **위치**: `src/app.js:1005, 1326` — `href="${escapeHtml(launchUrl)}"` /
  `href="${escapeHtml(app.url)}"`
- **문제**: `escapeHtml`은 HTML 엔티티만 인코딩할 뿐 URL 스킴(`javascript:`, `data:`)을
  막지 않는다. 현재 `app.url`은 `src/data/apps.js`에 개발자가 직접 작성한 정적
  데이터라 실질 위험은 낮지만, 향후 이 데이터가 CMS/원격 소스로 바뀌면 그대로
  익스플로잇 가능한 구멍이 된다.
- **제안 수정**: 렌더링 전에 허용 스킴 검사 추가:
  ```js
  const safeUrl = /^https?:\/\//i.test(url) ? url : "#";
  ```

---

## 4. 우선순위: 제안 (Suggestion)

### 4.1 최소화 애니메이션이 즉시 스냅 (1차 제안서의 축소 애니메이션 미구현)

- **위치**: `styles/retro-os.css`에 `.window-panel.is-minimized` 규칙 자체가 없음
  (`.taskbar-window.is-minimized`만 존재, 별개).
- **증상**: `hidden` 속성이 즉시 `display: none`을 적용해 창이 순간적으로 사라짐.
  1차 제안서(§3.5)에서 권장한 `scale(0.1) translateY(40vh)` 같은 부드러운 축소
  애니메이션은 적용되지 않았다.
- **판단 필요**: 의도적 단순화(v1 범위 축소)인지, 누락인지 확인 후 결정.
  애니메이션을 추가한다면 `prefers-reduced-motion` 대응도 함께 고려.

### 4.2 클릭 위임 핸들러가 여전히 긴 if/else 체인

- **위치**: `src/app.js:1872-1981`
- **비고**: 새로 추가된 4개 액션(`focus-window`, `window-close`, `window-minimize`,
  `window-maximize`)이 기존 스타일을 그대로 따라 추가되어 리뷰 관점에서 "회귀"는
  아니지만, 분기 수가 더 늘어났다. 드래그/리사이즈 로직은 `updateWindowGesture`/
  `finishWindowGesture`(`src/app.js:1734-1808`)로 잘 분리되어 있어 그 부분은 개선된 상태.
- **제안**: 액션명 → 핸들러 함수 매핑 테이블로 리팩터링 (급하지 않음, 후속 정리 과제).

---

## 5. 구현 순서 제안

1. **§2.1, §2.2 포커스 복귀 버그** — 접근성 회귀가 가장 뚜렷한 부분, 최우선.
2. **§3.3 Escape 가드** — 간단한 수정, 향후 입력 필드 추가 전에 미리 처리.
3. **§3.2 라벨 언어 통일** — 문자열만 바꾸면 되는 간단한 수정.
4. **§3.4 컴팩트 모드 최대화 버튼 비활성화** — 간단한 조건부 스타일/속성 추가.
5. **§3.5 URL 스킴 검증** — 간단한 정규식 가드 추가.
6. **§3.1 리사이즈 키보드 대안 + 히트 영역 확대** — 중간 규모 작업.
7. **§4.1, §4.2** — 선택 사항, 여유 있을 때 처리.

---

## 6. 참고 — 코드 위치 인덱스

- `src/app.js:417-423` — `closeWindow` (마지막 창 닫을 때 포커스 유실)
- `src/app.js:428-433` — `closeWindow`의 정상 포커스 복귀 로직 (참고용, minimizeWindow에 동일 적용)
- `src/app.js:436-453` — `minimizeWindow` (포커스 복귀 누락)
- `src/app.js:461-465` — `toggleMaximizeWindow`의 컴팩트 모드 분기
- `src/app.js:817, 825, 833` — 트래픽라이트 버튼 영문 라벨
- `src/app.js:843` — 레거시 닫기 버튼 한글 라벨 (비교 기준)
- `src/app.js:1005, 1326` — `app.url` href 렌더링 (스킴 검증 없음)
- `src/app.js:1198-1204` — 볼륨 슬라이더 (Escape 가드 미적용 대상)
- `src/app.js:1734-1808` — `updateWindowGesture`/`finishWindowGesture` (드래그, 참고: 잘 분리됨)
- `src/app.js:1872-1981` — 클릭 위임 핸들러
- `src/app.js:1994-2030` — 키보드 방향키 이동 핸들러 (리사이즈 대안 없음)
- `src/app.js:2003` — 폼 컨트롤 가드 패턴 (Escape 핸들러에도 동일 적용 권장)
- `src/app.js:2041-2056` — Escape 키 핸들러 (가드 없음)
- `styles/retro-os.css:826-833` — 리사이즈 핸들 히트 영역 (18×18px, 기준 미달)
- `styles/retro-os.css:2139-2148` — 컴팩트 모드 강제 풀스크린 CSS

---

## 7. 범위 밖 (이번 제안서에서 다루지 않음)

- 8방향 전체 리사이즈, 창 스냅
- 최소화 애니메이션의 정확한 타겟 좌표 계산 (여전히 범용 애니메이션 권장)
- 클릭 위임 핸들러 전체 리팩터링 (§4.2는 후속 과제로만 명시)
