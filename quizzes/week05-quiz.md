# 5주차 퀴즈: 네이버 API, JWT 인증, Pageable

## Q1. Spring Boot에서 외부 API를 호출할 때 사용하는 동기 HTTP 클라이언트로, Spring 6.1에서 도입되어 현재 권장되는 것은?
- A) WebClient
- B) RestTemplate
- C) RestClient
- D) HttpClient
- E) FeignClient

**정답:** C
**해설:** RestClient는 Spring 6.1+에서 도입된 동기 HTTP 클라이언트로, RestTemplate의 후속이다. WebClient는 비동기/리액티브 방식이고, RestTemplate은 유지보수 모드이다.

---

## Q2. 네이버 쇼핑 검색 API를 호출할 때 인증을 위해 HTTP 요청 헤더에 포함해야 하는 것은?
- A) Authorization: Bearer {token}
- B) X-Naver-Client-Id와 X-Naver-Client-Secret
- C) Cookie에 세션 ID
- D) X-API-Key와 X-API-Secret
- E) Content-Type: application/json

**정답:** B
**해설:** 네이버 쇼핑 검색 API는 요청 헤더에 X-Naver-Client-Id와 X-Naver-Client-Secret을 포함하여 인증한다.

---

## Q3. API 키 같은 민감한 정보를 Spring Boot에서 안전하게 관리하기 위해 사용하는 어노테이션은?
- A) @Autowired
- B) @Resource
- C) @Value
- D) @ConfigurationProperties
- E) @Inject

**정답:** C
**해설:** @Value("${naver.client-id}")와 같이 application.properties의 값을 필드에 주입받을 수 있다. 환경변수 폴백(${ENV_VAR:default})과 함께 사용하면 API 키를 소스코드에 직접 넣지 않고 안전하게 관리할 수 있다.

---

## Q4. JWT(JSON Web Token)의 구조로 올바른 것은?
- A) Username.Password.Token
- B) Header.Payload.Signature
- C) Key.Value.Hash
- D) Token.Claims.Secret
- E) Issuer.Subject.Audience

**정답:** B
**해설:** JWT는 점(.)으로 구분된 Header(알고리즘/타입), Payload(클레임 데이터), Signature(서명) 3개의 파트로 구성된다.

---

## Q5. JWT의 Payload에 대한 설명으로 올바른 것은?
- A) 비밀키로 암호화되어 있어 내용을 읽을 수 없다
- B) Base64URL로 인코딩되어 있어 누구나 디코딩하여 읽을 수 있다
- C) 바이너리 형식으로 저장되어 파싱이 불가능하다
- D) 서버의 비밀키 없이는 디코딩할 수 없다
- E) Header와 동일한 알고리즘 정보를 담고 있다

**정답:** B
**해설:** Payload는 암호화가 아니라 Base64URL 인코딩이다. 누구나 디코딩하여 내용을 읽을 수 있으므로 비밀번호 같은 민감 정보는 넣으면 안 된다.

---

## Q6. Spring Data JPA에서 Pageable을 사용할 때, 페이지 번호는 몇부터 시작하는가?
- A) -1
- B) 0
- C) 1
- D) 임의로 설정 가능하며 기본값은 없다
- E) 10

**정답:** B
**해설:** Pageable의 페이지 번호는 0부터 시작한다. GET /users?page=0&size=10은 첫 번째 페이지의 10건을 조회한다.

---

## Q7. 다음 코드에서 환경변수 NAVER_CLIENT_ID가 설정되지 않았을 때 clientId에 주입되는 값은?

```properties
naver.client-id=${NAVER_CLIENT_ID:your-client-id}
```

- A) null
- B) 빈 문자열 ("")
- C) your-client-id
- D) NAVER_CLIENT_ID
- E) 애플리케이션 시작 시 에러 발생

**정답:** C
**해설:** ${NAVER_CLIENT_ID:your-client-id} 구문에서 콜론(:) 뒤의 값은 환경변수가 없을 때 사용되는 기본값(폴백)이다. 환경변수가 없으면 your-client-id가 주입된다.

---

## Q8. 다음 JWT 검증 코드에서 validateToken이 false를 반환하는 경우가 아닌 것은?

```java
public static boolean validateToken(String token) {
    String[] parts = token.split("\\.");
    if (parts.length != 3) return false;
    String dataToSign = parts[0] + "." + parts[1];
    String expectedSignature = sign(dataToSign);
    if (!expectedSignature.equals(parts[2])) return false;
    String payload = decodeBase64Url(parts[1]);
    long exp = extractLongFromJson(payload, "exp");
    return Instant.now().getEpochSecond() < exp;
}
```

- A) 토큰이 2개의 파트로만 구성된 경우
- B) 토큰의 Payload가 변조된 경우
- C) 토큰의 만료 시간이 지난 경우
- D) 토큰이 정상적이고 만료되지 않은 경우
- E) 토큰의 Signature가 변조된 경우

**정답:** D
**해설:** 토큰이 3개의 파트로 구성되고, 서명이 일치하며, 만료 시간이 지나지 않았다면 validateToken은 true를 반환한다. 나머지 보기들은 모두 false를 반환하는 경우이다.

---

## Q9. 수동 페이징(stream().skip().limit())과 비교했을 때 Spring Data JPA의 Pageable이 효율적인 이유로 가장 적절한 것은?
- A) Java의 Stream API가 Pageable보다 느리기 때문이다
- B) DB 레벨에서 LIMIT/OFFSET으로 필요한 데이터만 조회하여 메모리를 절약하기 때문이다
- C) Pageable은 캐시를 자동으로 사용하기 때문이다
- D) 수동 페이징은 정렬을 지원하지 않기 때문이다
- E) Pageable은 비동기로 동작하기 때문이다

**정답:** B
**해설:** 수동 페이징은 전체 데이터를 DB에서 메모리로 로드한 뒤 Java에서 잘라내므로 비효율적이다. Pageable은 DB에서 LIMIT/OFFSET 쿼리로 필요한 페이지의 데이터만 가져오고, COUNT 쿼리도 자동 실행하여 totalElements를 제공한다.

---

## Q10. 다음 Controller 코드에서 GET /users?page=1&size=5&sort=name,asc 요청 시 실행되는 SQL로 가장 적절한 것은?

```java
@GetMapping
public Page<User> getUsers(Pageable pageable) {
    return userService.getAllUsers(pageable);
}
```

- A) SELECT * FROM users;
- B) SELECT * FROM users LIMIT 5;
- C) SELECT * FROM users ORDER BY name ASC LIMIT 5 OFFSET 5;
- D) SELECT * FROM users ORDER BY name ASC LIMIT 5 OFFSET 1;
- E) SELECT * FROM users WHERE page = 1 AND size = 5;

**정답:** C
**해설:** page=1, size=5이므로 두 번째 페이지(0부터 시작)를 요청한다. OFFSET = page * size = 1 * 5 = 5이고, LIMIT = size = 5이며, sort=name,asc에 의해 ORDER BY name ASC가 추가된다. 또한 totalElements 계산을 위한 SELECT COUNT(*) 쿼리도 자동 실행된다.

---
