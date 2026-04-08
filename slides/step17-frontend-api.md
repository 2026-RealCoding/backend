---
marp: true
theme: default
paginate: true
---

# Step 17: 프론트엔드 연동 API 완성
## 비즈니스 요구사항을 API 로 풀어내기

**2026 RealCoding**
브랜치: `feature/frontend-api`

---

## 프론트엔드 팀의 요구사항

1. 회원가입
2. 로그인
3. 상품 검색
4. 구매 (유저 체크)
5. 주문 목록 조회

> 5개 기능 중 **3개는 이미 만들어져 있다!**

---

## 기존 API 재사용 vs 신규 개발

```
기존 API (재사용)            신규 API (이번 Step)
─────────────────            ──────────────────
POST /users         ← 회원가입
POST /users/login   ← 로그인
GET  /shop/search   ← 상품 검색
                          POST /orders   ← 구매
                          GET  /orders   ← 주문 목록
```

핵심: 새로 만드는 것보다 **기존 API 를 잘 조합**하는 것이 중요

---

## "유저 체크" 란?

### 1. 인증 (Authentication)

```
클라이언트 → Authorization: Bearer <JWT 토큰> → 서버
JwtAuthInterceptor 가 토큰 검증 → userId 추출
```

### 2. 유효성 검증 (Validation)

```java
// OrderService
if (!userRepository.existsById(userId)) {
    throw new UserNotFoundException(userId);
}
```

JWT 인증 + DB 유저 확인 = **유저 체크 완료**

---

## OrderEntity 설계

```java
@Entity
@Table(name = "orders")
public class OrderEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;         // 누가?
    private Long productId;      // 무엇을?
    private String title;        // 상품명 (스냅샷)
    private String image;        // 이미지 (스냅샷)
    private int price;           // 가격 (스냅샷)
    private int quantity;        // 얼마나?
    private LocalDateTime orderedAt;  // 언제?
}
```

---

## 왜 상품 정보를 복사하는가?

```
네이버 쇼핑 API 상품 정보는 언제든 변할 수 있다:
  - 가격 변동
  - 상품 삭제
  - 상품명 변경

→ 주문 시점의 정보를 스냅샷으로 저장
→ "주문할 때 가격이 얼마였지?" 를 정확히 보관
```

---

## OrderRepository

```java
public interface OrderRepository
        extends JpaRepository<OrderEntity, Long> {

    Page<OrderEntity> findByUserIdOrderByOrderedAtDesc(
            Long userId, Pageable pageable);
}
```

쿼리 메서드 분석:
- `findBy` → SELECT
- `UserId` → WHERE user_id = ?
- `OrderByOrderedAtDesc` → ORDER BY ordered_at DESC

---

## OrderService - 핵심 로직

```java
@Transactional
public OrderResponse createOrder(Long userId, OrderRequest request) {
    // 1. 유저 체크
    if (!userRepository.existsById(userId)) {
        throw new UserNotFoundException(userId);
    }
    // 2. 입력값 검증
    if (request.quantity() <= 0) {
        throw new InvalidRequestException("수량은 1 이상이어야 합니다");
    }
    // 3. 주문 생성
    OrderEntity entity = new OrderEntity(
            userId, request.productId(), request.title(),
            request.image(), request.price(), request.quantity());
    return toDto(orderRepository.save(entity));
}
```

---

## OrderController

```java
@RestController
@RequestMapping("/orders")
public class OrderController {

    @PostMapping  // 구매
    public ResponseEntity<OrderResponse> createOrder(
            @RequestAttribute("userId") Long userId, // 인터셉터에서 설정한 값을 받아오는 어노테이션
            @RequestBody OrderRequest request) { ... }

    @GetMapping   // 주문 목록
    public Page<OrderResponse> getMyOrders(
            @RequestAttribute("userId") Long userId,
            Pageable pageable) { ... }
}
```

`userId` 는 JWT 에서 추출 → 클라이언트가 보낸 값을 믿지 않음

---

## 왜 userId 를 요청 Body 에 넣지 않는가?

```java
// ❌ 잘못된 설계
public record OrderRequest(Long userId, Long productId, ...)
// → 다른 유저로 위장 주문 가능!

// ✅ 올바른 설계
public record OrderRequest(Long productId, ...)
// → userId 는 JWT 토큰에서 서버가 직접 추출
```

---

## 인증 경로 설정

```java
// WebMvcConfig.java
registry.addInterceptor(jwtAuthInterceptor)
        .addPathPatterns("/shop/**", "/users/me", "/orders/**");
//                                                 ^^^^^^^^^^^ 추가
```

| 경로 | 인증 | 설명 |
|------|------|------|
| `POST /users` | 불필요 | 회원가입 |
| `POST /users/login` | 불필요 | 로그인 |
| `GET /shop/**` | 필요 | 상품 검색 |
| `POST /orders` | 필요 | 구매 |
| `GET /orders` | 필요 | 주문 목록 |

---

## 전체 API 요약

| 기능 | Method | URL | 인증 |
|------|--------|-----|------|
| 회원가입 | POST | `/users` | X |
| 로그인 | POST | `/users/login` | X |
| 상품 검색 | GET | `/shop/search?query=맥북` | O |
| 구매 | POST | `/orders` | O |
| 주문 목록 | GET | `/orders?page=0&size=10` | O |

---

## 프론트엔드 호출 흐름

```javascript
// 1. 회원가입
const user = await fetch('/users', { method: 'POST',
  body: JSON.stringify({ name: '홍길동', email: 'hong@...' }) });

// 2. 로그인 → 토큰 저장
const { token } = await fetch('/users/login', { method: 'POST',
  body: JSON.stringify({ userId: user.id }) });

// 3. 상품 검색 (토큰 필요)
const items = await fetch('/shop/search?query=맥북',
  { headers: { Authorization: `Bearer ${token}` } });

// 4. 구매 (토큰 필요)
await fetch('/orders', { method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ productId: 123, title: '맥북',
    image: 'url', price: 2590000, quantity: 1 }) });

// 5. 주문 목록 (토큰 필요)
const orders = await fetch('/orders',
  { headers: { Authorization: `Bearer ${token}` } });
```

---

## 이번 Step 변경 요약

```
신규 파일:
  entity/OrderEntity.java
  repository/OrderRepository.java
  service/OrderService.java
  controller/OrderController.java
  dto/OrderRequest.java
  dto/OrderResponse.java

수정 파일:
  config/WebMvcConfig.java  ← /orders/** 인증 추가
  data.sql                  ← orders 초기 데이터
```

---

## 실습 (practice 브랜치)

```bash
git checkout feature/frontend-api-practice
```

코드에 `// TODO` 주석으로 비어 있는 부분을 채우면 된다.

**과제:**
1. `OrderEntity` 클래스를 완성하라 (JPA 어노테이션 추가)
2. `OrderRepository` 인터페이스를 작성하라 (JpaRepository 상속 + 쿼리 메서드)
3. `OrderController`의 API 엔드포인트를 구현하라

**실행:**
```bash
# macOS / Linux
./gradlew bootRun

# Windows
gradlew.bat bootRun
```

**테스트:** (Windows에서는 Git Bash 또는 PowerShell에서 실행)
```bash
# 주문 생성
curl -X POST http://localhost:8080/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"productId":123,"title":"맥북","image":"url","price":2590000,"quantity":1}'

# 주문 목록 조회
curl "http://localhost:8080/orders?page=0&size=10" \
  -H "Authorization: Bearer $TOKEN"
```

**정답 확인:**
```bash
git diff feature/frontend-api-practice..feature/frontend-api
```

---

## 생각해볼 점

- 회원가입에 비밀번호가 없다? → 실무에서는 BCrypt 해싱
- 로그인이 userId 기반? → 실무에서는 이메일 + 비밀번호
- 주문 취소는? → 요구사항에 없으므로 미구현, 필요시 추가
- 결제 연동은? → PG 연동 필요, 현재는 "주문 = 완료"로 간소화

**비즈니스 요구사항은 항상 변한다 → 지금 필요한 것만 만들자!**
