# Step 17: 프론트엔드 연동 API 완성 - 비즈니스 요구사항을 API 로 풀어내기

> **브랜치**: `feature/frontend-api`
> **실습 브랜치**: `feature/frontend-api-practice`

---

## 학습 목표

1. 프론트엔드의 화면 흐름을 백엔드 API 로 매핑하는 사고 과정을 이해한다
2. 비즈니스 요구사항에서 "유저 체크"의 의미를 이해한다 (인증 vs 유효성 검증)
3. 주문(Order) 도메인을 Entity → Repository → Service → Controller 로 구현한다
4. 기존에 만든 API 를 재사용하여 프론트엔드 전체 흐름을 완성한다

---

## 비즈니스 요구사항 분석

프론트엔드 팀에서 요청한 기능:

| # | 화면 | 설명 |
|---|------|------|
| 1 | 회원가입 | 유저 생성 (이름, 이메일) |
| 2 | 로그인 | JWT 토큰 발급 |
| 3 | 상품 검색 | 네이버 쇼핑 API 로 검색 |
| 4 | 구매 | 상품 주문 (유저 체크 필요) |
| 5 | 주문 목록 | 내 주문 내역 조회 |

### 기존 API 재사용 vs 신규 개발

```
기존 API (재사용)          신규 API (이번 Step)
─────────────────          ──────────────────
POST /users          ←── 회원가입
POST /users/login    ←── 로그인
GET  /shop/search    ←── 상품 검색
                          POST /orders    ←── 구매 (신규)
                          GET  /orders    ←── 주문 목록 (신규)
```

**포인트**: 5개 기능 중 3개는 이미 만들어져 있다! 프론트엔드 연동은 새로운 API 를 만드는 것보다 **기존 API 를 잘 조합**하는 것이 더 중요하다.

---

## 핵심 개념

### "유저 체크" 란?

프론트엔드 팀이 말한 "구매 시 유저 체크"는 두 가지 의미:

**1. 인증 (Authentication) - "로그인한 유저인가?"**
```
클라이언트 → Authorization: Bearer <JWT 토큰> → 서버
서버: JwtAuthInterceptor 가 토큰 검증
  → 유효하면 userId 추출 → 컨트롤러에 전달
  → 유효하지 않으면 401 Unauthorized 반환
```

**2. 유효성 검증 (Validation) - "실제 존재하는 유저인가?"**
```
OrderService.createOrder(userId, request):
  1. userRepository.existsById(userId) → 존재하는 유저인지 확인
  2. 수량/가격 등 요청 데이터 검증
  3. 주문 생성
```

> JWT 에서 추출한 userId 를 신뢰하되, DB 에서 유저 존재 여부를 한번 더 확인한다.
> 이는 유저가 탈퇴했거나 비활성화된 경우를 대비하기 위함.

### 주문 시 상품 정보를 복사하는 이유

```
네이버 쇼핑 API 의 상품 정보는 언제든 바뀔 수 있다:
  - 가격이 변동될 수 있음
  - 상품이 삭제될 수 있음
  - 상품명이 변경될 수 있음

→ 주문 테이블에 주문 시점의 상품 정보를 스냅샷으로 저장
→ "내가 주문할 때 가격이 얼마였지?" 를 정확히 알 수 있음
```

### API 에서 userId 를 받지 않는 이유

```java
// ❌ 잘못된 설계: 클라이언트가 userId 를 보냄
public record OrderRequest(Long userId, Long productId, ...)

// ✅ 올바른 설계: JWT 에서 userId 를 추출
public record OrderRequest(Long productId, ...)
// Controller 에서: @RequestAttribute("userId") Long userId
```

클라이언트가 보낸 userId 를 신뢰하면 **다른 유저로 위장 주문**이 가능하다.
JWT 토큰에서 서버가 직접 추출하는 것이 안전하다.

---

## 구현

### 1. OrderEntity - 주문 테이블 매핑

```java
@Entity
@Table(name = "orders")
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;        // 주문한 유저
    private Long productId;     // 상품 ID (네이버 쇼핑)
    private String title;       // 상품명 (스냅샷)
    private String image;       // 상품 이미지 (스냅샷)
    private int price;          // 가격 (스냅샷)
    private int quantity;       // 수량
    private LocalDateTime orderedAt;  // 주문 시각
}
```

**설계 포인트**:
- `userId` → FK 관계 대신 단순 ID 저장 (강의 단계에서는 간단하게)
- `title`, `image`, `price` → 주문 시점의 상품 정보 스냅샷
- `orderedAt` → 생성자에서 `LocalDateTime.now()` 로 자동 설정

### 2. OrderRepository

```java
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    Page<OrderEntity> findByUserIdOrderByOrderedAtDesc(Long userId, Pageable pageable);
}
```

Spring Data JPA 쿼리 메서드 분석:
- `findBy` → SELECT
- `UserId` → WHERE user_id = ?
- `OrderByOrderedAtDesc` → ORDER BY ordered_at DESC
- `Pageable` → LIMIT ? OFFSET ?

### 3. OrderService - 비즈니스 로직

```java
@Transactional
public OrderResponse createOrder(Long userId, OrderRequest request) {
    // 1. 유저 체크: 존재하는 유저인지 확인
    if (!userRepository.existsById(userId)) {
        throw new UserNotFoundException(userId);
    }

    // 2. 요청 검증
    if (request.quantity() <= 0) {
        throw new InvalidRequestException("수량은 1 이상이어야 합니다");
    }

    // 3. 주문 생성 및 저장
    OrderEntity entity = new OrderEntity(
            userId, request.productId(), request.title(),
            request.image(), request.price(), request.quantity()
    );
    OrderEntity saved = orderRepository.save(entity);
    return toDto(saved);
}
```

### 4. OrderController

```java
@RestController
@RequestMapping("/orders")
public class OrderController {

    // POST /orders - 구매
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @RequestAttribute("userId") Long userId,  // JWT 에서 추출 (인터셉터나 필터에서 설정한 값을 컨트롤러에서 받아오는 어노테이션)
            @RequestBody OrderRequest request) {
        OrderResponse created = orderService.createOrder(userId, request);
        return ResponseEntity.created(URI.create("/orders/" + created.id())).body(created);
    }

    // GET /orders - 내 주문 목록
    @GetMapping
    public Page<OrderResponse> getMyOrders(
            @RequestAttribute("userId") Long userId,  // JWT 에서 추출
            Pageable pageable) {
        return orderService.getOrdersByUserId(userId, pageable);
    }
}
```

### 5. WebMvcConfig - 인증 경로 추가

```java
registry.addInterceptor(jwtAuthInterceptor)
        .addPathPatterns("/shop/**", "/users/me", "/orders/**");  // /orders/** 추가
```

---

## 프론트엔드 연동 전체 흐름

### API 목록 요약

| 기능 | Method | URL | 인증 | 요청 Body | 응답 |
|------|--------|-----|------|-----------|------|
| 회원가입 | POST | `/users` | 불필요 | `{"name":"홍길동","email":"hong@example.com"}` | User (201) |
| 로그인 | POST | `/users/login` | 불필요 | `{"userId":1}` | `{"token":"eyJ..."}` |
| 상품 검색 | GET | `/shop/search?query=맥북&display=10` | Bearer 토큰 | - | ShoppingItem[] |
| 구매 | POST | `/orders` | Bearer 토큰 | `{"productId":123,"title":"맥북","image":"url","price":2590000,"quantity":1}` | OrderResponse (201) |
| 주문 목록 | GET | `/orders?page=0&size=10` | Bearer 토큰 | - | Page\<OrderResponse\> |

### 프론트엔드 호출 예시 (JavaScript)

```javascript
// 1. 회원가입
const user = await fetch('/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: '홍길동', email: 'hong@example.com' })
}).then(res => res.json());

// 2. 로그인 → 토큰 저장
const { token } = await fetch('/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: user.id })
}).then(res => res.json());

// 3. 상품 검색 (토큰 필요)
const items = await fetch('/shop/search?query=맥북', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(res => res.json());

// 4. 구매 (토큰 필요)
const order = await fetch('/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    productId: items[0].productId,
    title: items[0].title,
    image: items[0].image,
    price: parseInt(items[0].lprice),
    quantity: 1
  })
}).then(res => res.json());

// 5. 주문 목록 (토큰 필요)
const orders = await fetch('/orders?page=0&size=10', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(res => res.json());
```

---

## 이번 Step 에서 추가된 파일

```
src/main/java/com/inspire12/backend/
├── controller/OrderController.java     ← 신규
├── service/OrderService.java           ← 신규
├── repository/OrderRepository.java     ← 신규
├── entity/OrderEntity.java             ← 신규
├── dto/OrderRequest.java               ← 신규
├── dto/OrderResponse.java              ← 신규
└── config/WebMvcConfig.java            ← 수정 (/orders/** 인증 추가)

src/main/resources/
└── data.sql                            ← 수정 (orders 초기 데이터 추가)
```

---

## 실습 가이드

### 브랜치 전환

```bash
git checkout feature/frontend-api-practice
```

### practice 브랜치 사용법

코드에 `// TODO` 주석으로 비어 있는 부분을 채우면 된다.

### 실습 과제

1. `OrderEntity` 클래스를 완성하라 (JPA 어노테이션 추가)
2. `OrderRepository` 인터페이스를 작성하라 (JpaRepository 상속 + 쿼리 메서드)
3. `OrderController`의 API 엔드포인트를 구현하라

### 확인 방법

```bash
# macOS / Linux
./gradlew bootRun

# Windows
gradlew.bat bootRun
```

> curl 명령어는 Windows에서는 Git Bash 또는 PowerShell에서 실행한다.

Postman이나 curl로 다음을 테스트:
- `POST /orders` — 주문 생성
- `GET /orders?userId=1` — 주문 목록 조회

### 정답 확인

```bash
git diff feature/frontend-api-practice..feature/frontend-api
```

---

## 핵심 정리

> **프론트엔드 연동은 새로운 API 를 만드는 것보다 기존 API 를 잘 조합하는 것이 중요하다. 주문 시 상품 정보는 스냅샷으로 저장하고, userId 는 JWT 토큰에서 서버가 직접 추출하여 보안을 확보한다.**

---

## 생각해볼 점

1. **회원가입에 비밀번호가 없다?**
   - 현재는 간소화된 구조 (이름 + 이메일만). 실무에서는 비밀번호 해싱(BCrypt), 이메일 인증 등이 추가됨.

2. **로그인이 userId 기반이다?**
   - 현재는 JWT 학습 목적으로 간소화. 실무에서는 이메일+비밀번호 → 검증 후 토큰 발급.

3. **주문 취소는?**
   - 프론트엔드 요구사항에 없으므로 미구현. 필요시 `DELETE /orders/{id}` 또는 `PUT /orders/{id}/cancel` 로 추가 가능.

4. **결제 연동은?**
   - 실무에서는 PG(Payment Gateway) 연동이 필요. 현재 단계에서는 "주문 = 구매 완료"로 간소화.
