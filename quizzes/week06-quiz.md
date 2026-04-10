# 6주차 퀴즈: CORS, 프론트엔드 연동

## Q1. CORS가 필요한 이유로 가장 적절한 것은?
- A) 서버 간 통신을 암호화하기 위해
- B) 브라우저의 Same-Origin Policy로 인해 다른 출처의 요청이 기본적으로 차단되기 때문에
- C) HTTP 프로토콜이 보안을 지원하지 않기 때문에
- D) 백엔드 서버의 성능을 향상시키기 위해
- E) 프론트엔드 코드의 빌드를 최적화하기 위해

**정답:** B
**해설:** 브라우저는 보안을 위해 Same-Origin Policy를 적용하여 다른 출처(Origin)의 요청을 기본적으로 차단한다. 프론트엔드(localhost:3000)와 백엔드(localhost:8080)처럼 포트가 다르면 다른 Origin으로 간주되어 CORS 설정이 필요하다.

---

## Q2. Origin을 구성하는 요소의 조합으로 올바른 것은?
- A) 호스트 + 포트 + 경로
- B) 프로토콜 + 호스트 + 경로
- C) 프로토콜 + 호스트 + 포트
- D) 프로토콜 + 포트 + 쿼리스트링
- E) 호스트 + 포트 + 쿠키

**정답:** C
**해설:** Origin은 프로토콜(http/https) + 호스트(localhost, example.com) + 포트(3000, 8080)로 구성된다. 이 중 하나라도 다르면 다른 Origin으로 간주된다.

---

## Q3. 브라우저가 Preflight(사전 확인) 요청을 보내는 경우가 아닌 것은?
- A) PUT 메서드로 요청할 때
- B) DELETE 메서드로 요청할 때
- C) Content-Type이 application/json인 POST 요청
- D) 기본 헤더만 사용하는 단순 GET 요청
- E) Custom 헤더(Authorization 등)를 포함한 요청

**정답:** D
**해설:** 기본 헤더만 사용하는 GET, HEAD 요청은 Simple Request로 분류되어 Preflight 없이 바로 요청이 전송된다. PUT, DELETE, application/json Content-Type, Custom 헤더가 포함된 요청은 Preflight(OPTIONS) 요청이 먼저 전송된다.

---

## Q4. 다음 Spring Boot CORS 설정에서 에러가 발생하는 부분은?

```java
registry.addMapping("/**")
        .allowedOrigins("*")           // (1)
        .allowedMethods("GET", "POST") // (2)
        .allowedHeaders("*")           // (3)
        .allowCredentials(true)        // (4)
        .maxAge(3600);                 // (5)
```

- A) (1) - addMapping에 /**를 사용할 수 없다
- B) (2) - allowedMethods에 여러 메서드를 지정할 수 없다
- C) (1)과 (4) - allowedOrigins("*")와 allowCredentials(true)는 함께 사용할 수 없다
- D) (3) - allowedHeaders에 *를 사용할 수 없다
- E) (5) - maxAge에 3600은 너무 큰 값이다

**정답:** C
**해설:** allowCredentials(true)를 사용하면 보안상 allowedOrigins("*")는 사용할 수 없다. 모든 출처를 허용하면서 인증 정보도 허용하면 위험하기 때문이다. 반드시 특정 Origin(예: "http://localhost:3000")을 명시해야 한다.

---

## Q5. CORS 설정에서 maxAge(3600)의 역할은?
- A) 서버의 응답 타임아웃을 3600초로 설정한다
- B) JWT 토큰의 만료 시간을 3600초로 설정한다
- C) Preflight(OPTIONS) 요청의 결과를 3600초(1시간) 동안 캐시한다
- D) 클라이언트의 연결을 3600초 동안 유지한다
- E) CORS 정책의 유효 기간을 3600초로 제한한다

**정답:** C
**해설:** maxAge는 Preflight(OPTIONS) 요청의 결과를 브라우저가 캐시하는 시간(초)이다. 3600초(1시간)으로 설정하면 같은 요청에 대해 매번 OPTIONS 요청을 보내지 않아 성능이 향상된다.

---

## Q6. 프론트엔드 연동 시, 주문(Order) API에서 userId를 클라이언트가 보내지 않고 JWT 토큰에서 서버가 추출하는 이유는?
- A) 클라이언트가 userId를 모르기 때문이다
- B) userId를 URL에 포함시키면 길어지기 때문이다
- C) 클라이언트가 보낸 userId를 신뢰하면 다른 유저로 위장 주문이 가능하기 때문이다
- D) JWT 토큰에 userId를 넣으면 전송 속도가 빨라지기 때문이다
- E) REST API 표준에서 userId를 body에 포함하는 것을 금지하기 때문이다

**정답:** C
**해설:** 클라이언트가 보낸 userId를 신뢰하면 다른 유저의 ID로 위장하여 주문을 생성할 수 있다. JWT 토큰에서 서버가 직접 userId를 추출하면 토큰 발급 시 인증된 유저만 해당 ID를 사용할 수 있어 보안이 확보된다.

---

## Q7. 주문(Order) 테이블에 상품명(title), 이미지(image), 가격(price)을 별도로 저장하는(스냅샷) 이유는?
- A) 네이버 API를 매번 호출하면 비용이 발생하기 때문이다
- B) 외부 API의 상품 정보는 가격 변동, 삭제, 변경될 수 있어 주문 시점의 정보를 보존해야 하기 때문이다
- C) 데이터베이스의 조인(JOIN) 성능을 향상시키기 위해서이다
- D) 네이버 API 서버가 항상 가용하지 않기 때문이다
- E) Spring Data JPA에서 외부 API 데이터를 직접 참조할 수 없기 때문이다

**정답:** B
**해설:** 네이버 쇼핑 API의 상품 정보는 언제든 가격이 변동되거나, 상품이 삭제되거나, 상품명이 변경될 수 있다. 주문 테이블에 주문 시점의 상품 정보를 스냅샷으로 저장하면 "내가 주문할 때 가격이 얼마였는지"를 정확히 보존할 수 있다.

---

## Q8. 다음 프론트엔드 연동 시나리오에서 기존에 이미 만들어져 있어 재사용 가능한 API가 아닌 것은?
- A) POST /users (회원가입)
- B) POST /users/login (로그인)
- C) GET /shop/search (상품 검색)
- D) POST /orders (구매)
- E) GET /users/me (내 정보 조회)

**정답:** D
**해설:** 프론트엔드 연동 5개 기능 중 회원가입(POST /users), 로그인(POST /users/login), 상품 검색(GET /shop/search)은 기존에 구현되어 재사용한다. 구매(POST /orders)와 주문 목록(GET /orders)은 Step 17에서 신규로 개발한다.

---

## Q9. 다음 OrderRepository의 메서드명에서 Spring Data JPA가 자동으로 생성하는 SQL 쿼리로 올바른 것은?

```java
Page<OrderEntity> findByUserIdOrderByOrderedAtDesc(Long userId, Pageable pageable);
```

- A) SELECT * FROM orders WHERE ordered_at DESC
- B) SELECT * FROM orders WHERE user_id = ? ORDER BY ordered_at DESC LIMIT ? OFFSET ?
- C) SELECT * FROM orders ORDER BY user_id, ordered_at DESC
- D) SELECT * FROM orders WHERE user_id = ? AND ordered_at IS NOT NULL
- E) SELECT * FROM orders WHERE user_id = ? GROUP BY ordered_at DESC

**정답:** B
**해설:** findBy(SELECT) + UserId(WHERE user_id = ?) + OrderByOrderedAtDesc(ORDER BY ordered_at DESC) + Pageable(LIMIT ? OFFSET ?)로 분석된다. Spring Data JPA가 메서드명을 파싱하여 자동으로 쿼리를 생성한다.

---

## Q10. 다음 JavaScript 코드에서 주문 API 호출 시 headers에 포함된 두 가지 헤더의 역할을 올바르게 설명한 것은?

```javascript
const order = await fetch('/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ productId: 123, title: '맥북', price: 2590000, quantity: 1 })
});
```

- A) Content-Type은 응답 형식을 지정하고, Authorization은 CORS를 우회한다
- B) Content-Type은 요청 본문이 JSON임을 명시하고, Authorization은 JWT 토큰으로 인증한다
- C) Content-Type은 인코딩 방식을 지정하고, Authorization은 API 키를 전달한다
- D) 두 헤더 모두 CORS Preflight를 방지하기 위한 것이다
- E) Content-Type은 캐시 정책을 설정하고, Authorization은 세션 ID를 전달한다

**정답:** B
**해설:** Content-Type: application/json은 요청 본문(body)이 JSON 형식임을 서버에 알려주고, Authorization: Bearer {token}은 JWT 토큰을 포함하여 서버가 인증된 유저인지 확인할 수 있게 한다. 참고로 이 두 헤더가 포함되면 브라우저는 Preflight(OPTIONS) 요청을 먼저 보낸다.

---
