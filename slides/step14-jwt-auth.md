---
marp: true
theme: default
paginate: true
---

# Step 14: JWT 인증 직접 구현하기
## 라이브러리 없이 만드는 토큰 인증

**2026 RealCoding**
브랜치: `shop/auth`

---

## 왜 인증이 필요한가?

HTTP는 **무상태(stateless)** - 서버는 각 요청이 누구의 것인지 모른다

```
1. 로그인       → 서버가 JWT 토큰 발급
2. 이후 모든 요청 → 헤더에 토큰 포함 → 서버가 검증 → "아, 1번 유저구나"
```

토큰 = **"나는 누구다"를 증명하는 신분증**

---

## JWT 구조: Header.Payload.Signature

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzA4MTI3MDU2fQ.X5Z_abc123
|_____________________| |________________________________________| |__________|
       Header                       Payload                        Signature
```

| 파트 | 내용 | 역할 |
|------|------|------|
| Header | `{"alg":"HS256","typ":"JWT"}` | 알고리즘 정보 |
| Payload | `{"sub":"1","iat":...,"exp":...}` | 사용자 데이터 (Claim = JWT 안에 담긴 데이터 항목) |
| Signature | HMAC-SHA256(header.payload, 비밀키) | 위조 방지 서명 |

각 파트는 **Base64URL 인코딩**된 상태

---

## JWT 동작 원리

### 토큰 생성 (서버)
```
1. Header JSON  → Base64URL 인코딩
2. Payload JSON → Base64URL 인코딩
3. Header.Payload + 비밀키 → HMAC-SHA256 → 서명
4. Header.Payload.Signature = JWT 토큰
```

### 토큰 검증 (서버)
```
1. 토큰을 . 으로 분리 → Header, Payload, Signature
2. Header.Payload + 비밀키 → HMAC-SHA256 → 다시 서명
3. 기존 Signature == 새로 만든 Signature? → 변조 여부 확인
4. Payload의 exp > 현재 시간? → 만료 여부 확인
```

---

## JwtUtil - 토큰 생성

```java
public class JwtUtil {
    private static final String SECRET_KEY =
        "my-secret-key-for-jwt-signing-must-be-long-enough";
    private static final long EXPIRATION_SECONDS = 3600; // 1시간

    public static String generateToken(Long userId) {
        String header = """
            {"alg":"HS256","typ":"JWT"}""";

        long now = Instant.now().getEpochSecond(); // Unix timestamp (1970년 1월 1일부터의 초)
        long exp = now + EXPIRATION_SECONDS;
        String payload = """
            {"sub":"%d","iat":%d,"exp":%d}"""
            .formatted(userId, now, exp);

        String encodedHeader = encodeBase64Url(header);
        String encodedPayload = encodeBase64Url(payload);
        String signature = sign(encodedHeader + "." + encodedPayload);

        return encodedHeader + "." + encodedPayload + "." + signature;
    }
}
```

---

## JwtUtil - 토큰 검증

```java
public static boolean validateToken(String token) {
    try {
        String[] parts = token.split("\\.");
        if (parts.length != 3) return false;

        // 1. 서명 검증: 다시 서명해서 일치하는지 확인
        String dataToSign = parts[0] + "." + parts[1];
        String expectedSignature = sign(dataToSign);
        if (!expectedSignature.equals(parts[2])) {
            return false;  // 서명 불일치 = 변조됨!
        }

        // 2. 만료 시간 검증
        String payload = decodeBase64Url(parts[1]);
        long exp = extractLongFromJson(payload, "exp");
        return Instant.now().getEpochSecond() < exp;

    } catch (Exception e) {
        return false;
    }
}
```

---

## JwtUtil - HMAC-SHA256 서명

```java
private static String sign(String data) {
    try {
        // javax.crypto.Mac - Java 표준 라이브러리
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(
            SECRET_KEY.getBytes(StandardCharsets.UTF_8),
            "HmacSHA256");
        mac.init(keySpec);
        byte[] signature = mac.doFinal(
            data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(signature);
    } catch (Exception e) {
        throw new RuntimeException("JWT 서명 생성 실패", e);
    }
}
```

**순수 Java만으로 구현 - 외부 라이브러리 없음!**

---

## 로그인 API - POST /users/login

```java
@PostMapping("/login")
public ResponseEntity<Map<String, String>> login(
        @RequestBody Map<String, Long> request) {
    Long userId = request.get("userId");

    // 유저 존재 여부 확인
    userService.getUserById(userId);

    // JWT 토큰 생성
    String token = JwtUtil.generateToken(userId);
    return ResponseEntity.ok(Map.of("token", token));
}
```

> curl 명령어는 Windows에서는 Git Bash 또는 PowerShell에서 실행한다.

```bash
curl -X POST http://localhost:8080/users/login \
  -H "Content-Type: application/json" \
  -d '{"userId": 1}'
# → {"token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIi..."}
```

---

## GET /users/me - Before vs After

### Before (토큰을 그대로 반환)
```java
@GetMapping("/me")
public String getCurrentUser(@RequestHeader("Authorization") String token) {
    return "현재 유저 토큰: " + token;
}
```

### After (JWT 검증 → 유저 조회)
```java
@GetMapping("/me")
public ResponseEntity<User> getCurrentUser(
        @RequestHeader("Authorization") String authorization) {
    String token = authorization.replace("Bearer ", "");

    if (!JwtUtil.validateToken(token)) {
        return ResponseEntity.status(401).build();  // 인증 실패
    }

    Long userId = JwtUtil.getUserIdFromToken(token);
    User user = userService.getUserById(userId);
    return ResponseEntity.ok(user);  // 실제 유저 정보 반환!
}
```

---

## 인증 흐름 전체

```
1. 로그인
   POST /users/login {"userId": 1}
   → {"token": "eyJ..."}

2. 인증된 요청
   GET /users/me
   Authorization: Bearer eyJ...
   → {"id":1, "name":"홍길동", "email":"hong@example.com"}

3. 잘못된 토큰
   GET /users/me
   Authorization: Bearer 변조된토큰
   → 401 Unauthorized

4. 만료된 토큰
   GET /users/me
   Authorization: Bearer 만료된토큰
   → 401 Unauthorized
```

---

> 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다.

## 실무 라이브러리 소개

| 라이브러리 | Gradle 의존성 | 특징 |
|-----------|--------------|------|
| **jjwt** | `io.jsonwebtoken:jjwt-api` | 가장 많이 사용 |
| **auth0-java-jwt** | `com.auth0:java-jwt` | 간결한 API |

```java
// jjwt 예시
String token = Jwts.builder()
    .subject(userId.toString())
    .expiration(new Date(System.currentTimeMillis() + 3600000))
    .signWith(secretKey)
    .compact();

// auth0-java-jwt 예시
String token = JWT.create()
    .withSubject(userId.toString())
    .withExpiresAt(Instant.now().plusSeconds(3600))
    .sign(Algorithm.HMAC256(secretKey));
```

---

## 실습 (practice 브랜치)

```bash
git checkout shop/auth-practice
```

**과제:**
1. `JwtUtil` 클래스 구현 (generateToken, validateToken, getUserIdFromToken)
2. `POST /users/login` - 토큰 발급 API
3. `GET /users/me` - JWT 검증 후 유저 조회로 개선

**테스트:**
```bash
# macOS / Linux
TOKEN=$(curl -s -X POST http://localhost:8080/users/login \
  -H "Content-Type: application/json" \
  -d '{"userId":1}' | jq -r '.token')

# Windows (PowerShell)
$TOKEN = (Invoke-RestMethod -Method Post -Uri http://localhost:8080/users/login `
  -ContentType "application/json" -Body '{"userId":1}').token

# 또는 Postman에서 토큰을 복사하여 사용

# 내 정보 조회
curl http://localhost:8080/users/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 핵심 정리

> **JWT = Header.Payload.Signature
> HMAC-SHA256 서명으로 변조 방지, 만료 시간으로 유효기간 제한
> 실무에서는 jjwt 또는 auth0-java-jwt 사용**

**기억할 키워드:**
- JWT = `Header.Payload.Signature`
- `HMAC-SHA256` - 비밀키 기반 서명
- `Base64URL` - URL 안전한 인코딩
- `Authorization: Bearer {token}` - 인증 헤더 규칙
- `validateToken` - 서명 검증 + 만료 확인
