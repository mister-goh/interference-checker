# 배포 가이드 — Interference Checker

전 기능이 클라이언트(브라우저)에서 동작하는 정적 웹앱입니다. 서버·DB·환경변수 불필요.
유일한 네트워크 호출은 PubChem 물질명 검색이며, 인터넷이 없으면 내장 별칭 → 화학식 직접 입력 → 원소 직접 선택 fallback으로 모든 분석이 가능합니다.

## 1. 오프라인 배포 — 단일 HTML 파일 (권장: 개인 PC/USB 배포)

```powershell
npm run build:offline
```

- 산출물: `dist-offline/index.html` **파일 1개** (JS/CSS 전부 인라인, 약 1~2MB).
- 배포: 이 파일 하나를 메일·USB·공유폴더로 전달 → 받는 사람은 **더블클릭**으로 실행 (서버·설치 불필요, Chrome/Edge 권장).
- 데이터(즐겨찾기·프리셋·저장된 분석·동족 설정)는 **브라우저 localStorage**에 저장됩니다.
  - 같은 PC·같은 브라우저면 파일을 새 버전으로 교체해도 데이터 유지.
  - 다른 PC로 데이터가 따라가지는 않음.
- 인터넷이 없으면 PubChem 물질명 검색만 실패 — 화학식 입력(예: `HfCl4`, `La(CH3)3`), 내장 별칭(BTBAS, 3DMAS 등), 원소 직접 선택은 모두 동작.

## 2. 인트라넷 정적 서버 배포 (권장: 부서 공용)

```powershell
npm run build
```

- 산출물: `dist/` 폴더 (index.html + assets/).
- 배포: `dist/` 내용물을 IIS·nginx·아무 정적 파일 서버의 원하는 경로에 복사.
- 상대 경로 빌드(`base: './'`)라 루트가 아닌 **하위 경로**(예: `http://lab-server/isotope/`)에 두어도 동작.
- 배포 후 확인: 브라우저에서 해당 URL 접속 → 검색·계산 동작.

로컬에서 미리 확인:

```powershell
npm run preview   # dist/를 로컬 서버로 서빙
```

## 3. 온라인 배포 (추후)

`dist/`를 그대로 정적 호스팅에 올리면 끝 — 코드 변경 불필요.

| 호스팅 | 방법 |
|--------|------|
| GitHub Pages | 저장소 Settings → Pages, `dist/` 업로드(또는 Actions 빌드) |
| AWS S3 (+CloudFront) | S3 정적 웹사이트 호스팅에 `dist/` 업로드 |
| Netlify / Vercel | 저장소 연결, build command `npm run build`, publish dir `dist` |

- 전 기능 클라이언트 동작이므로 백엔드·API 키·환경변수 없음.
- PubChem 호출은 사용자 브라우저에서 직접 일어나므로 호스팅 위치와 무관하게 동일 동작. HTTPS 호스팅 권장.

## 참고

- 단일 파일 빌드에서 favicon은 표시되지 않을 수 있음(무해).
- PWA/Service Worker는 사용하지 않음 — file:// 및 사내 http 환경과 충돌하고, 단일 파일 방식이 더 단순·확실.
