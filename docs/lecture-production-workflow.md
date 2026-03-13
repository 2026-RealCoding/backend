# 강의 제작 워크플로우

> 이 문서는 2026 RealCoding Backend 강의 Step 을 새로 추가하는 전체 과정을 기록한 것입니다.
> Step 17 (프론트엔드 연동 API) 제작 과정을 기준으로 작성되었습니다.

---

## 전체 흐름 요약

```
1. 요구사항 분석
   └→ 기존 API 재사용 가능 여부 파악

2. 코드 구현
   └→ Entity → Repository → Service → Controller → DTO

3. 문서 작성
   ├→ docs/stepNN-xxx.md     (강의 문서)
   ├→ slides/stepNN-xxx.md   (Marp 슬라이드)
   └→ README.md              (Step 목록 업데이트)

4. QA (빌드 + API 테스트)
   ├→ 정상 케이스 검증
   └→ 에러 케이스 검증

5. HTML 슬라이드 변환
   └→ python slides/convert-slides.py

6. 브랜치 구성 및 푸시
   ├→ feature/xxx              (완성 브랜치)
   ├→ feature/xxx-practice     (실습 브랜치, TODO blanks)
   └→ main                     (문서만)

7. PR 생성
   └→ gh pr create --base develop
```

---

## 1단계: 요구사항 분석

### 프론트엔드 팀의 요청 사항

```
1. 회원가입
2. 로그인
3. 상품 검색
4. 구매 (유저 체크)
5. 주문 목록 조회
```

### 기존 API 재사용 분석

기존 코드베이스를 탐색하여 어떤 API 가 이미 있는지 확인한다:

```
기존 API (재사용 가능)         신규 API (개발 필요)
─────────────────────         ──────────────────
POST /users         ← 회원가입
POST /users/login   ← 로그인
GET  /shop/search   ← 상품 검색
                          POST /orders   ← 구매
                          GET  /orders   ← 주문 목록
```

**확인 포인트:**
- 기존 컨트롤러 엔드포인트 목록 (`UserController`, `ShoppingController`)
- JWT 인증 구조 (`JwtUtil`, `JwtAuthInterceptor`, `WebMvcConfig`)
- Entity/DTO/Service/Repository 패턴 확인
- CORS 설정 확인

---

## 2단계: 코드 구현

### 파일 구조 (기존 패턴 따르기)

```
src/main/java/com/inspire12/backend/
├── entity/OrderEntity.java           ← UserEntity 패턴 따르기
├── repository/OrderRepository.java   ← UserRepository 패턴 따르기
├── service/OrderService.java         ← UserService 패턴 따르기
├── controller/OrderController.java   ← UserController 패턴 따르기
├── dto/OrderRequest.java             ← LoginRequest 패턴 따르기
├── dto/OrderResponse.java            ← User record 패턴 따르기
└── config/WebMvcConfig.java          ← 인증 경로 추가
```

### 구현 순서

#### 2-1. Entity 설계

비즈니스 요구사항을 테이블 설계로 변환:

```
"유저가 상품을 구매한다"
  → 누가? (userId), 무엇을? (productId, title, image, price),
    얼마나? (quantity), 언제? (orderedAt)
```

핵심 설계 결정:
- 외부 API(네이버 쇼핑) 상품 정보는 **스냅샷으로 저장** (가격 변동 대비)
- `orderedAt` 은 생성자에서 `LocalDateTime.now()` 자동 설정

#### 2-2. Repository

Spring Data JPA 쿼리 메서드 네이밍으로 SQL 자동 생성:

```java
Page<OrderEntity> findByUserIdOrderByOrderedAtDesc(Long userId, Pageable pageable);
// → SELECT * FROM orders WHERE user_id = ? ORDER BY ordered_at DESC LIMIT ? OFFSET ?
```

#### 2-3. Service

비즈니스 로직의 핵심 — "유저 체크"의 두 가지 의미:
1. **인증 (Authentication)**: JWT 토큰 → `JwtAuthInterceptor` 가 담당
2. **유효성 (Validation)**: `userRepository.existsById(userId)` → Service 에서 담당

#### 2-4. Controller

`@RequestAttribute("userId")` 로 JWT 에서 추출한 userId 를 주입받는 패턴.
클라이언트가 보낸 userId 를 신뢰하지 않는 보안 설계.

#### 2-5. WebMvcConfig 수정

```java
.addPathPatterns("/shop/**", "/users/me", "/orders/**");  // /orders/** 추가
```

#### 2-6. data.sql 수정

초기 테스트 데이터 추가 (`INSERT OR IGNORE` — SQLite 문법).

---

## 3단계: 문서 작성

### 3-1. 강의 문서 (`docs/stepNN-xxx.md`)

구조:
```markdown
# Step NN: 제목

> 브랜치 정보

## 학습 목표
## 핵심 개념
## 구현
## 전체 흐름 (프론트엔드 호출 예시)
## 이번 Step 에서 추가된 파일
## 생각해볼 점
```

**포인트**: "비즈니스 요구사항 → API 설계" 사고 과정을 강조하는 컨셉

### 3-2. Marp 슬라이드 (`slides/stepNN-xxx.md`)

```markdown
---
marp: true
theme: default
paginate: true
---

# 제목
## 부제목

**2026 RealCoding**
브랜치: `feature/xxx`

---

## 슬라이드 내용
```

- `---` 로 슬라이드 구분 (Marp 문법)
- 코드 블록은 짧게 핵심만 (슬라이드에서 읽을 수 있는 분량)
- Before/After 비교 패턴 활용

### 3-3. README.md 업데이트

`## Step 진행 과정` 섹션에 새 Step 추가.

---

## 4단계: QA

### 빌드 확인

```bash
JAVA_HOME=/path/to/jdk21 ./gradlew build
```

### API 테스트 (서버 실행 후)

```bash
# 기존 DB 초기화 후 서버 실행
rm -f ./data/app.db
./gradlew bootRun

# 정상 케이스
curl -X POST /users ...                          # 1. 회원가입
curl -X POST /users/login ...                    # 2. 로그인 → 토큰
curl /shop/search?query=맥북 -H "Bearer ..."     # 3. 상품 검색
curl -X POST /orders -H "Bearer ..." ...         # 4. 구매
curl /orders -H "Bearer ..."                     # 5. 주문 목록

# 에러 케이스
curl -X POST /orders (인증 없음)                   # → 401
curl -X POST /orders -H "Bearer invalid"          # → 401
curl -X POST /orders ... quantity=0               # → 400
curl -X POST /users/login ... userId=999          # → 404
```

---

## 5단계: HTML 슬라이드 변환

### convert-slides.py

Marp 마크다운을 Reveal.js HTML 로 변환하는 Python 스크립트.

#### 동작 원리

```
slides/step*.md  →  convert-slides.py  →  slides/html/step*.html
                                        →  slides/html/index.html
```

1. `slides/` 디렉토리에서 `step*.md` 파일을 수집 (정렬)
2. 각 파일에 대해:
   - Marp YAML frontmatter 제거 (`---` ... `---`)
   - 첫 번째 `# ` 에서 타이틀 추출
   - `</textarea>`, `</script>` 태그 이스케이프
   - Reveal.js HTML 템플릿에 내용 삽입
   - prev/next 네비게이션 링크 생성
3. `index.html` 생성 (모든 슬라이드 링크가 있는 랜딩 페이지)

#### 새 Step 추가 시 해야 할 것

`STEP_BRANCHES` 딕셔너리에 매핑 추가:

```python
STEP_BRANCHES = {
    ...
    "step16": "feature/cors",
    "step17": "feature/frontend-api",  # ← 추가
}
```

#### 실행

```bash
python3 slides/convert-slides.py
```

출력 예:
```
  step01-project-init.md -> html/step01-project-init.html
  ...
  step17-frontend-api.md -> html/step17-frontend-api.html
  index.html generated (17 slides)
```

### GitHub Actions 자동 배포

`main` 브랜치에 `slides/**` 변경이 푸시되면 자동으로:
1. Python 3.12 환경 설정
2. `convert-slides.py` 실행
3. `slides/html/` 디렉토리를 GitHub Pages 에 배포

워크플로우 파일: `.github/workflows/deploy-slides.yml`

---

## 6단계: 브랜치 구성 및 푸시

### 브랜치 전략

각 Step 마다 3개 브랜치에 반영:

| 브랜치 | 내용 | 기반 |
|--------|------|------|
| `feature/xxx` | 완성 코드 + 문서 | main 기반 |
| `feature/xxx-practice` | TODO blanks 실습용 | main 기반 |
| `main` | 문서만 (docs, slides, README) | - |

### 완성 브랜치 (`feature/frontend-api`)

```bash
git checkout -b feature/frontend-api main

# 소스 코드 커밋
git add src/main/java/.../entity/OrderEntity.java \
        src/main/java/.../repository/OrderRepository.java \
        src/main/java/.../service/OrderService.java \
        src/main/java/.../controller/OrderController.java \
        src/main/java/.../dto/OrderRequest.java \
        src/main/java/.../dto/OrderResponse.java \
        src/main/java/.../config/WebMvcConfig.java \
        src/main/resources/data.sql
git commit -m "feat: add Order API for frontend integration (step17)"

# 문서 커밋
git add docs/step17-frontend-api.md slides/step17-frontend-api.md README.md
git commit -m "docs: add step17 frontend API lecture documents and slides"
```

### 실습 브랜치 (`feature/frontend-api-practice`)

```bash
git checkout -b feature/frontend-api-practice main
```

완성 코드의 핵심 부분을 TODO 주석으로 교체:

```java
// 완성 버전
private Long userId;
private Long productId;

// 실습 버전
// TODO: 필드를 추가하세요
// private Long userId;
// private Long productId;
```

실습 브랜치의 파일은 **컴파일은 되지만 로직은 비어있는** 상태로 제공.

### main 브랜치

```bash
git checkout main
git checkout feature/frontend-api -- docs/step17-frontend-api.md slides/step17-frontend-api.md
git add README.md docs/step17-frontend-api.md slides/step17-frontend-api.md
git commit -m "docs: add step17 frontend API lecture document and slides"
```

### 푸시

```bash
git push origin main
git push origin -u feature/frontend-api
git push origin -u feature/frontend-api-practice
```

---

## 7단계: PR 생성

```bash
gh pr create \
  --base develop \
  --head feature/frontend-api \
  --title "Step 17: 프론트엔드 연동 API - 주문 기능 추가" \
  --body "..."
```

PR 본문 구조:
```markdown
## Summary
- 변경 요약 (3줄 이내)

## 변경 내역
### 신규 파일
### 수정 파일
### 문서

## 프론트엔드 연동 API 요약 (테이블)

## Test plan
- [x] 빌드 성공
- [x] 정상 케이스 테스트
- [x] 에러 케이스 테스트
```

---

## 체크리스트 (새 Step 추가 시)

- [ ] 요구사항 분석 및 기존 API 재사용 여부 확인
- [ ] Entity, Repository, Service, Controller, DTO 구현
- [ ] 기존 설정 파일 수정 (WebMvcConfig, data.sql 등)
- [ ] `docs/stepNN-xxx.md` 강의 문서 작성
- [ ] `slides/stepNN-xxx.md` Marp 슬라이드 작성
- [ ] `README.md` 에 Step 추가
- [ ] `slides/convert-slides.py` 의 `STEP_BRANCHES` 에 매핑 추가
- [ ] `python3 slides/convert-slides.py` 실행하여 HTML 생성
- [ ] `./gradlew build` 빌드 확인
- [ ] 서버 실행 후 API 테스트 (정상 + 에러 케이스)
- [ ] 완성 브랜치 생성 및 커밋 (`feature/xxx`)
- [ ] 실습 브랜치 생성 및 커밋 (`feature/xxx-practice`)
- [ ] main 브랜치에 문서 반영
- [ ] 3개 브랜치 푸시
- [ ] PR 생성 (`develop` 대상)
