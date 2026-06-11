# Isotope Searcher -- 데이터 모델

> 이 문서는 앱에서 다루는 핵심 데이터의 구조를 정의합니다.
> 개발자가 아니어도 이해할 수 있는 "개념적 ERD"입니다.
> 서버 DB 없음: 동위원소·간섭 데이터는 앱에 내장(정적 JSON/TS), 즐겨찾기는 브라우저 localStorage.

---

## 전체 구조

```
[Element 원소] --1:N--> [Isotope 동위원소]
       │                       │
       │ N:M (구성)             │ 정수 질량 일치 시 간섭
       ▼                       ▼
[Compound 화합물] ----계산----> [Interference 간섭종]
 (메인 물질/즐겨찾기)            (동질량/다원자/이중하전)
       │                       │
       └──────────┬────────────┘
                  ▼
        [Recommendation 추천결과]
        (원소별 최적 질량 + 권장 모드)
```

---

## 엔티티 상세

### Element (원소)
주기율표의 원소 1개. 앱에 전체 내장.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| symbol | 원소 기호 (고유 식별자) | Hf | O |
| name | 원소 이름 (영문) | Hafnium | O |
| atomicNumber | 원자번호 | 72 | O |
| icpmsMeasurable | 일반 ICP-MS로 측정 대상인지 (H, C, N, O, 희가스 등 제외 플래그) | true | O |

### Isotope (동위원소)
원소 1개가 가진 동위원소. NIST 자연존재비 기준.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| elementSymbol | 소속 원소 | Hf | O |
| massNumber | 질량수 (정수, 쿼드러폴 판정 기준) | 178 | O |
| exactMass | 정밀 질량 (amu) | 177.9437 | O |
| abundance | 자연존재비 (%) | 27.28 | O |

### Compound (화합물)
사용자가 입력하는 메인 물질. 기본 목록 내장 + 사용자 즐겨찾기는 localStorage.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 | hfcl4 | O |
| name | 표시 이름 (관용명) | HfCl4 / 3DMAS | O |
| formula | 화학식 | HfCl4 / SiH(N(CH3)2)3 | O |
| composition | 구성 원소와 개수 (파서 결과) | {Hf:1, Cl:4} | O |
| category | 분류 | Metal Halide / Si Organic | X |
| isBuiltin | 기본 내장 여부 (false = 사용자 추가) | true | O |

### Interference (간섭종)
계산 엔진이 생성하거나 큐레이션 목록에서 가져온 간섭 1건.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| type | 유형 | isobaric / polyatomic / doubly-charged | O |
| composition | 조성 (구성 동위원소) | ⁴⁰Ar³⁵Cl⁺ | O |
| targetMass | 발생하는 정수 질량 (m/z) | 75 | O |
| precursorElements | 전구체 원소 (매트릭스 유래 추적용) | [Ar, Cl] | O |
| severity | 심각도 (전구체 존재비 곱 기반: high/medium/low) | high | O |
| source | 출처 (계산 생성 / 문헌 큐레이션) | calculated / curated | O |

### Recommendation (추천결과)
계산 1회 실행 시 원소별로 생성되는 결과 행. 저장하지 않고 화면에서 즉시 생성.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| elementSymbol | 대상 원소 | As | O |
| recommendedMass | 추천 질량수 (간섭 최소 동위원소) | 75 | O |
| abundance | 추천 동위원소의 존재비 (감도 참고) | 100% | O |
| interferences | 해당 질량의 간섭 목록 | [⁴⁰Ar³⁵Cl⁺] | O |
| status | 판정 배지 | clean / avoidable / mode-required / difficult | O |
| recommendedMode | 권장 측정 모드 | Standard / KED(He) / DRC(NH3·O2·H2) | O |
| alternativeMasses | 차선 질량 후보 (상세보기용) | [77] | X |

### 관계
- Element 1개가 여러 개의 Isotope를 가짐 (내장 데이터)
- Compound 1개는 여러 Element로 구성됨 (composition 맵)
- 계산 시: Compound 구성 원소 + 배경 매트릭스(Ar, H, N, O, C)의 Isotope들을 조합해 Interference를 생성
- Recommendation은 Element마다 1행씩, Interference 목록을 품고 생성됨

---

## 왜 이 구조인가

- **서버리스 정적 구조**: 동위원소 존재비는 변하지 않는 자연 상수이므로 DB가 불필요. 정적 파일 내장 → 더블클릭 실행·사내망·AWS S3 어디서든 동일하게 동작 (Phase 3 이전 비용 제로)
- **정수 질량(massNumber) 중심 판정**: 쿼드러폴 단위분해능(1 amu) 현실을 모델에 직접 반영. exactMass는 참고·표시용으로만 보존
- **Interference의 source 분리**: 2원자 조합은 계산으로 전수 생성하되, Ar2⁺ 같은 3원자·특수종은 문헌 큐레이션 목록으로 보완 — 조합 폭발 없이 커버리지 확보
- **확장성**: Phase 2의 DRC/KED 추천은 Recommendation.recommendedMode 필드 채우는 로직 추가만으로, Phase 3의 주기율표 뷰는 Recommendation.status 색상 매핑만으로 구현 가능 — 뼈대 유지

---

## [NEEDS CLARIFICATION]

- [ ] severity 등급 경계값 (전구체 존재비 곱 기준 %, 초기 제안값으로 시작 후 조정)
- [ ] 유기 화합물 즐겨찾기의 화학식 정규 표기 확정 (3DMAS, BTBAS, OMCTS, CPME의 분자식)
- [ ] 이중하전(M²⁺) 간섭 적용 대상: 2가 이온화 경향이 큰 원소(Ba, REE 등)로 한정할지 전 원소 적용할지
