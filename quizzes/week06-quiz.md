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

## Q2. 프론트엔드 연동 시, 주문(Order) API에서 userId를 클라이언트가 보내지 않고 JWT 토큰에서 서버가 추출하는 이유는?
- A) 클라이언트가 userId를 모르기 때문이다
- B) userId를 URL에 포함시키면 길어지기 때문이다
- C) 클라이언트가 보낸 userId를 신뢰하면 다른 유저로 위장 주문이 가능하기 때문이다
- D) JWT 토큰에 userId를 넣으면 전송 속도가 빨라지기 때문이다
- E) REST API 표준에서 userId를 body에 포함하는 것을 금지하기 때문이다

**정답:** C
**해설:** 클라이언트가 보낸 userId를 신뢰하면 다른 유저의 ID로 위장하여 주문을 생성할 수 있다. JWT 토큰에서 서버가 직접 userId를 추출하면 토큰 발급 시 인증된 유저만 해당 ID를 사용할 수 있어 보안이 확보된다.

---

## Q3. 주문(Order) 테이블에 상품명(title), 이미지(image), 가격(price)을 별도로 저장하는(스냅샷) 이유는?
- A) 네이버 API를 매번 호출하면 비용이 발생하기 때문이다
- B) 외부 API의 상품 정보는 가격 변동, 삭제, 변경될 수 있어 주문 시점의 정보를 보존해야 하기 때문이다
- C) 데이터베이스의 조인(JOIN) 성능을 향상시키기 위해서이다
- D) 네이버 API 서버가 항상 가용하지 않기 때문이다
- E) Spring Data JPA에서 외부 API 데이터를 직접 참조할 수 없기 때문이다

**정답:** B
**해설:** 네이버 쇼핑 API의 상품 정보는 언제든 가격이 변동되거나, 상품이 삭제되거나, 상품명이 변경될 수 있다. 주문 테이블에 주문 시점의 상품 정보를 스냅샷으로 저장하면 "내가 주문할 때 가격이 얼마였는지"를 정확히 보존할 수 있다.

---

## Q4. 프론트엔드와 백엔드를 분리하는 아키텍처(SPA + REST API)를 채택하는 이유로 가장 적절하지 **않은** 것은?
- A) 프론트엔드와 백엔드를 독립적으로 개발·배포할 수 있어 역할 분담과 생산성이 높아진다
- B) 하나의 백엔드 API가 웹, 모바일 앱, 외부 파트너 등 여러 클라이언트를 동시에 지원할 수 있다
- C) 프론트엔드는 정적 리소스로 CDN 등에 배포하고, 백엔드는 API 서버에 집중할 수 있어 확장성이 좋아진다
- D) 화면 이동 시 서버 렌더링이 필요 없어 사용자 경험(UX)을 개선할 수 있다
- E) 브라우저의 Same-Origin Policy가 자동으로 해제되어 CORS 설정이 필요 없어진다

**정답:** E
**해설:** 오히려 프론트/백이 다른 도메인/포트로 분리되면 **CORS 설정이 꼭 필요해진다**. 분리 아키텍처의 장점은 독립 개발·배포, 다중 클라이언트 지원, 확장성, 나은 UX이다.

---

## Q5. CORS 설정을 컨트롤러마다 `@CrossOrigin` 어노테이션으로 흩어 두지 않고, `WebMvcConfigurer.addCorsMappings()`로 전역 설정하는 이유로 가장 적절한 것은?
- A) `@CrossOrigin`은 Spring Boot 4에서 더 이상 지원되지 않기 때문이다
- B) 전역 설정이 `@CrossOrigin`보다 성능이 훨씬 빠르기 때문이다
- C) CORS 정책을 한 곳에서 관리하여 정책 변경 시 여러 파일을 수정할 필요가 없고, 누락된 컨트롤러로 인한 보안 사고를 예방할 수 있기 때문이다
- D) `@CrossOrigin`은 GET 요청만 허용하기 때문이다
- E) 전역 설정만 allowCredentials 옵션을 지원하기 때문이다

**정답:** C
**해설:** `@CrossOrigin`은 개별 컨트롤러/메서드에 붙여서 쓸 수 있지만, 컨트롤러가 많아지면 정책이 일관되지 않거나 일부 컨트롤러에 누락될 수 있다. `WebMvcConfigurer`로 전역 설정하면 모든 API에 일관된 CORS 정책이 적용되어 유지보수와 보안 관점에서 유리하다.

---

## Q6. Origin을 구성하는 요소의 조합으로 올바른 것은?
- A) 호스트 + 포트 + 경로
- B) 프로토콜 + 호스트 + 경로
- C) 프로토콜 + 호스트 + 포트
- D) 프로토콜 + 포트 + 쿼리스트링
- E) 호스트 + 포트 + 쿠키

**정답:** C
**해설:** Origin은 프로토콜(http/https) + 호스트(localhost, example.com) + 포트(3000, 8080)로 구성된다. 이 중 하나라도 다르면 다른 Origin으로 간주된다.

---

## Q7. 브라우저가 Preflight(사전 확인) 요청을 보내는 경우가 아닌 것은?
- A) PUT 메서드로 요청할 때
- B) DELETE 메서드로 요청할 때
- C) Content-Type이 application/json인 POST 요청
- D) 기본 헤더만 사용하는 단순 GET 요청
- E) Custom 헤더(Authorization 등)를 포함한 요청

**정답:** D
**해설:** 기본 헤더만 사용하는 GET, HEAD 요청은 Simple Request로 분류되어 Preflight 없이 바로 요청이 전송된다. PUT, DELETE, application/json Content-Type, Custom 헤더가 포함된 요청은 Preflight(OPTIONS) 요청이 먼저 전송된다.

---

## Q8. 다음 Spring Boot CORS 설정에서 에러가 발생하는 부분은?

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

## Q9. CORS 설정에서 maxAge(3600)의 역할은?
- A) 서버의 응답 타임아웃을 3600초로 설정한다
- B) JWT 토큰의 만료 시간을 3600초로 설정한다
- C) Preflight(OPTIONS) 요청의 결과를 3600초(1시간) 동안 캐시한다
- D) 클라이언트의 연결을 3600초 동안 유지한다
- E) CORS 정책의 유효 기간을 3600초로 제한한다

**정답:** C
**해설:** maxAge는 Preflight(OPTIONS) 요청의 결과를 브라우저가 캐시하는 시간(초)이다. 3600초(1시간)으로 설정하면 같은 요청에 대해 매번 OPTIONS 요청을 보내지 않아 성능이 향상된다.

---

## Q10. 다음 OrderRepository의 메서드명에서 Spring Data JPA가 자동으로 생성하는 SQL 쿼리로 올바른 것은?

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

## Q11. 다음 JavaScript 코드에서 주문 API 호출 시 headers에 포함된 두 가지 헤더의 역할을 올바르게 설명한 것은?

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
