---
name: miri-design
description: 명리 앱 디자인 시스템. UI/디자인 작업 시 반드시 참조. 컬러, 타이포, 카드, 애니메이션, 금지 목록 등 모든 디자인 원칙 포함. 새로운 컴포넌트, 화면, 스타일 수정 시 이 스킬을 적용.
license: MIT
metadata:
  author: leeio6-lab
  version: "1.0.0"
---

# 명리 디자인 시스템

명리 앱의 모든 UI/디자인 작업의 기준 문서.
새로운 컴포넌트, 화면, 애니메이션을 만들 때 반드시 이 원칙을 따른다.

## When to Apply

이 스킬은 다음 작업 시 반드시 참조:
- 새로운 화면/컴포넌트 생성
- 기존 UI 스타일 수정
- 카드, 버튼, 구분선 등 UI 요소 추가
- 애니메이션 구현
- 컬러/타이포 관련 작업
- 코드 리뷰 시 디자인 일관성 확인

## 1. 브랜드 철학

**"고요한 서재에서 펼치는 운명의 책"**

명리(命理)는 운명(命)의 이치(理)를 다루는 앱이다.
사주명리학의 정식 명칭에서 이름을 가져왔다.
'미리 알다'의 미리가 아니라, 운명의 원리 그 자체.
3,000년 동양 역학의 무게를 이름 두 글자에 담았다.

태그라인: **"운명의 이치를 읽다"**

"命理" 두 글자가 한자 현판에 새겨진 듯한 무게감.

### 디자인 키워드

해야 하는 것:
- 고요함 (Stillness) — 여백이 말하게 하라
- 격조 (Dignity) — 싸 보이면 실패
- 신비로움 (Mystery) — 다 보여주지 마라
- 온기 (Warmth) — 차갑지 않게
- 전통미 (Heritage) — 동양의 선, 한자의 무게

하면 안 되는 것:
- 화려함 / 귀여움 / 기본값 / 과잉 / 공포

## 2. 컬러 시스템

### 기본 팔레트

```
배경:
  page:           #FFFFFF
  card-default:   #FFFFFF
  card-gold:      #FFFDF8

골드 (브랜드 액센트):
  gold-bright:    #E8B04A    (메인 골드. CTA.)
  gold-medium:    #D4A84B    (테두리, 장식.)
  gold-dark:      #C4912E    (눌림 상태.)
  gold-muted:     #B8A070    (그림자 색.)

텍스트:
  text-primary:   #1A1A1A    (#000 금지)
  text-secondary: #555555
  text-tertiary:  #999999
  text-gold:      #C4912E

보더:
  border-subtle:  rgba(212, 168, 75, 0.12)
  border-medium:  rgba(212, 168, 75, 0.25)
  divider:        rgba(212, 168, 75, 0.08)
```

### 오행 컬러

```
금(金) — 쿨톤 실버:  primary #6B7B8D, light #EDF0F4
목(木) — 자연 초록:  primary #5B7A4A, light #EDF3E8
수(水) — 딥 블루:   primary #3D6B8E, light #E8F0F6
화(火) — 웜 레드:   primary #B85450, light #F8EDEC
토(土) — 웜 브라운:  primary #8B6E4E, light #F3EDE6
```

### 색상 원칙

- 배경은 깨끗한 화이트 #FFFFFF
- 그림자는 골드 틴트(#B8A070). 검정 그림자 금지
- 텍스트 #000 금지. #1A1A1A 사용
- 골드는 화면의 15% 이하

## 3. 타이포그래피

```
타이틀/한자:    NotoSerifKR (세리프)
본문/UI:       NotoSansKR (산세리프)

페이지 타이틀:  22px  Serif   w700  letterSpacing 2
섹션 타이틀:   16px  Serif   w600  letterSpacing 1.5
카드 타이틀:   14px  Serif   w600  letterSpacing 1
본문:         13px  Sans    w400  lineHeight 1.7  color #555
캡션/힌트:    11px  Sans    w400  letterSpacing 0.5  color #999
점수 (대형):   42px  Sans    w500  color #E8B04A
점수 (중형):   28px  Sans    w500
한자 (대형):   32px  Serif   w700  color #E8B04A
한자 (중형):   18px  Serif   w600
```

원칙:
- letterSpacing 넓힐 것. 기본값 금지
- lineHeight 본문 × 1.7
- 타이틀=세리프, 본문=산세리프
- 한자는 항상 세리프

## 4. 카드 & 박스 (GlassCard)

### default variant

```
배경: #FFFFFF, borderRadius: 20, padding: 24
그림자: shadowColor #B8A070, offset {0,6}, opacity 0.06, radius 20
테두리: SVG 모서리 꺾임 장식 (L자, 14px, stroke #D4A84B, opacity 0.25)
```

### gold variant

```
배경: #FFFDF8, borderRadius: 20, padding: 24
그림자: shadowColor #C4912E, offset {0,8}, opacity 0.07, radius 24
테두리: 모서리 꺾임 강조 (opacity 0.35)
```

카드 간 marginBottom: 20, 카드 내 padding: 24 (최소 20)

## 5. 구분선

```
height: 1px
backgroundColor: rgba(212, 168, 75, 0.08) (골드 틴트)
marginVertical: 20
```

검정/회색 구분선 금지.

## 6. 버튼

```
PremiumButton: 배경 #E8B04A, borderRadius 14, 텍스트 #FFF 16px bold
              그림자 #C4912E, shimmer 3초 주기, 눌림 scale 0.95
Primary:      배경 #E8B04A, 텍스트 #FFF
Secondary:    배경 transparent, 보더 1.5px #E8B04A, 텍스트 #C4912E
Ghost:        배경 transparent, 텍스트 #999
```

## 7. 애니메이션 원칙

1. **순차** — 하나씩 움직임. 동시 움직임 금지
2. **부드러움** — 모든 전환 300ms 이상. ease-in-out
3. **절제** — 파티클, 네온 글로우 금지. 페이드/슬라이드/스케일만
4. **의미** — 장식용 애니메이션 금지
5. **성능** — transform + opacity만. layout 속성 애니메이션 금지

화면 진입: 카드 순차 FadeInDown, stagger 100ms, duration 400ms
점수: 0→목표값 카운트업 1초

## 8. 아이콘 & 심볼

- **이모지 금지**. SVG 커스텀 아이콘 사용
- 라인아트 스타일 (stroke only), strokeWidth 1~1.5
- 색상: 골드(#D4A84B) 또는 오행색
- 한자는 핵심 디자인 요소. 항상 세리프
- 브랜드 심볼: 命 추상화 기하학 (삼각형 + 가로선 + 원 + 점)

## 9. 금지 목록

이것을 하면 명리가 아님:
- 이모지 사용
- 순수 검정(#000) 텍스트
- 순백(#FFF) 페이지 배경
- 검정 그림자 (shadowColor #000)
- CSS border 기본값
- borderRadius 30 이상
- 네온 글로우, 무지개색
- 머티리얼 디자인 기본 모양
- letterSpacing 0
- lineHeight 1.4 이하
- padding 16 이하
- 한자를 산세리프로 쓰기
