# Step 14: JWT 인증 직접 구현하기

> **브랜치**: `shop/auth`
> **실습 브랜치**: `shop/auth-practice`

---

## 학습 목표

1. JWT(JSON Web Token)의 구조(Header, Payload, Signature)를 이해한다
2. 순수 Java(`javax.crypto.Mac`)로 JWT를 생성하고 검증할 수 있다
3. Base64URL 인코딩과 HMAC-SHA256 서명의 원리를 이해한다
4. 로그인(토큰 발급) → 인증(토큰 검증) → 유저 조회 흐름을 구현할 수 있다
5. 실무에서 사용하는 JWT 라이브러리(jjwt, auth0-java-jwt)를 알고 있다

---

## 핵심 개념

### 인증이 왜 필요한가?

HTTP는 **무상태(stateless)** 프로토콜이다. 서버는 각 요청이 누구의 것인지 모른다. 따라서 "나는 누구인가"를 매 요청마다 증명해야 한다. 이때 사용하는 것이 **토큰(Token)** 이다.

```
1. 로그인 요청  →  서버가 JWT 토큰 발급
2. 이후 요청    →  요청 헤더에 토큰 포함  →  서버가 토큰 검증  →  유저 확인
```

### JWT 구조

JWT는 점(`.`)으로 구분된 **3개의 파트**로 구성된다.

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzA4MTIzNDU2LCJleHAiOjE3MDgxMjcwNTZ9.X5Z_abc123...
|_______________________________|  |_______________________________________________|  |______________|
          Header                                  Payload                                Signature
```

#### 1. Header (헤더)

사용할 알고리즘과 토큰 타입을 지정한다.

```json
{"alg": "HS256", "typ": "JWT"}
```

이 JSON을 **Base64URL로 인코딩**하면 Header 파트가 된다.

#### 2. Payload (페이로드)

전달할 데이터(클레임, Claims — JWT 안에 담긴 데이터 항목. 예: 사용자 ID, 만료 시간)를 담는다.

```json
{
  "sub": "1",           // Subject: 사용자 ID
  "iat": 1708123456,    // Issued At: 발급 시간 (Unix timestamp — 1970년 1월 1일부터 현재까지의 초 단위 시간)
  "exp": 1708127056     // Expiration: 만료 시간 (Unix timestamp)
}
```

이 JSON을 **Base64URL로 인코딩**하면 Payload 파트가 된다.

> **주의**: Payload는 암호화가 아니라 인코딩이다. 누구나 디코딩하여 내용을 읽을 수 있다. 따라서 비밀번호 같은 민감 정보는 넣으면 안 된다.

#### 3. Signature (서명)

토큰이 변조되지 않았음을 보증하는 서명이다.

```
Signature = HMAC-SHA256(
    base64UrlEncode(Header) + "." + base64UrlEncode(Payload),
    secretKey
)
```

서버만 알고 있는 `secretKey`로 서명하므로, 토큰이 변조되면 서명이 일치하지 않아 검증에 실패한다.

### Base64URL 인코딩

일반 Base64와 달리, URL에서 안전하게 사용할 수 있도록 변환한다.

```
Base64:    + / =  (URL에서 특수문자로 처리됨)
Base64URL: - _ (패딩 없음)  → URL, 쿠키, 헤더에서 안전
```

### HMAC-SHA256

- **HMAC**: Hash-based Message Authentication Code
- **SHA-256**: 256비트 해시 함수
- 비밀키와 메시지를 조합하여 고정 길이의 해시를 생성
- 같은 키 + 같은 메시지 = 항상 같은 해시 → 검증 가능
- 비밀키 없이는 해시를 재현할 수 없음 → 위조 불가

---

## 주요 코드

### JwtUtil 클래스 (순수 Java 구현)

```java
package com.inspire12.backend.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

public class JwtUtil {

    // 서명에 사용할 비밀키 (실무에서는 외부 설정으로 관리)
    private static final String SECRET_KEY =
            "my-secret-key-for-jwt-signing-must-be-long-enough";

    // 토큰 만료 시간: 1시간 (초 단위)
    private static final long EXPIRATION_SECONDS = 3600;

    // Base64URL 인코더/디코더 (URL-safe, 패딩 없음)
    private static final Base64.Encoder encoder =
            Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder decoder =
            Base64.getUrlDecoder();
```

#### 토큰 생성 (generateToken)

```java
    public static String generateToken(Long userId) {
        // 1. Header
        String header = """
                {"alg":"HS256","typ":"JWT"}""";

        // 2. Payload
        long now = Instant.now().getEpochSecond();
        long exp = now + EXPIRATION_SECONDS;
        String payload = """
                {"sub":"%d","iat":%d,"exp":%d}""".formatted(userId, now, exp);

        // 3. Base64URL 인코딩
        String encodedHeader = encodeBase64Url(header);
        String encodedPayload = encodeBase64Url(payload);

        // 4. Signature: HMAC-SHA256(header.payload, secretKey)
        String dataToSign = encodedHeader + "." + encodedPayload;
        String signature = sign(dataToSign);

        // 5. 최종 JWT: header.payload.signature
        return encodedHeader + "." + encodedPayload + "." + signature;
    }
```

#### 토큰 검증 (validateToken)

```java
    public static boolean validateToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return false;

            // 서명 검증: 다시 서명해서 일치하는지 확인
            String dataToSign = parts[0] + "." + parts[1];
            String expectedSignature = sign(dataToSign);
            if (!expectedSignature.equals(parts[2])) {
                return false;  // 서명 불일치 = 토큰 변조됨
            }

            // 만료 시간 검증
            String payload = decodeBase64Url(parts[1]);
            long exp = extractLongFromJson(payload, "exp");
            return Instant.now().getEpochSecond() < exp;

        } catch (Exception e) {
            return false;
        }
    }
```

#### 사용자 ID 추출 (getUserIdFromToken)

```java
    public static Long getUserIdFromToken(String token) {
        try {
            String[] parts = token.split("\\.");
            String payload = decodeBase64Url(parts[1]);
            String sub = extractStringFromJson(payload, "sub");
            return Long.parseLong(sub);
        } catch (Exception e) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다");
        }
    }
```

#### HMAC-SHA256 서명 메서드

```java
    private static String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                    SECRET_KEY.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256");
            mac.init(keySpec);
            byte[] signature = mac.doFinal(
                    data.getBytes(StandardCharsets.UTF_8));
            return encoder.encodeToString(signature);
        } catch (Exception e) {
            throw new RuntimeException("JWT 서명 생성 실패", e);
        }
    }
```

### UserController - 로그인 & 인증

#### POST /users/login - JWT 토큰 발급

```java
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(
            @RequestBody Map<String, Long> request) {
        Long userId = request.get("userId");

        // 유저 존재 여부 확인 (없으면 UserNotFoundException)
        userService.getUserById(userId);

        // JWT 토큰 생성
        String token = JwtUtil.generateToken(userId);
        return ResponseEntity.ok(Map.of("token", token));
    }
```

#### GET /users/me - JWT 검증 후 유저 조회

**Before** (토큰을 문자열로 그대로 반환):
```java
    @GetMapping("/me")
    public String getCurrentUser(
            @RequestHeader("Authorization") String token) {
        return "현재 유저 토큰: " + token;
    }
```

**After** (JWT 검증 → userId 추출 → 유저 조회):
```java
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(
            @RequestHeader("Authorization") String authorization) {
        // "Bearer " 접두어 제거
        String token = authorization.replace("Bearer ", "");

        // JWT 토큰 검증
        if (!JwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).build();
        }

        // 토큰에서 userId 추출 → DB에서 유저 조회
        Long userId = JwtUtil.getUserIdFromToken(token);
        User user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }
```

### 인증 흐름 전체

```
1. 로그인 요청
   POST /users/login  {"userId": 1}
                    ↓
   서버: JWT 생성 → {"token": "eyJ..."}

2. 인증된 요청
   GET /users/me
   Header: Authorization: Bearer eyJ...
                    ↓
   서버: JWT 검증 → userId 추출 → 유저 조회 → 유저 정보 반환

3. 잘못된 토큰
   GET /users/me
   Header: Authorization: Bearer 변조된토큰
                    ↓
   서버: JWT 검증 실패 → 401 Unauthorized
```

---

> 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다.

## 실무에서 사용하는 JWT 라이브러리

이번 실습에서는 JWT의 구조를 이해하기 위해 순수 Java로 구현했다. 실무에서는 아래 라이브러리를 사용한다.

### 1. jjwt (io.jsonwebtoken)

```groovy
implementation 'io.jsonwebtoken:jjwt-api:0.12.6'
runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.6'
runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.6'
```

```java
// 토큰 생성
String token = Jwts.builder()
    .subject(userId.toString())
    .issuedAt(new Date())
    .expiration(new Date(System.currentTimeMillis() + 3600000))
    .signWith(secretKey)
    .compact();

// 토큰 검증 + 파싱
Claims claims = Jwts.parser()
    .verifyWith(secretKey)
    .build()
    .parseSignedClaims(token)
    .getPayload();
```

### 2. auth0-java-jwt

```groovy
implementation 'com.auth0:java-jwt:4.4.0'
```

```java
// 토큰 생성
String token = JWT.create()
    .withSubject(userId.toString())
    .withIssuedAt(Instant.now())
    .withExpiresAt(Instant.now().plusSeconds(3600))
    .sign(Algorithm.HMAC256(secretKey));

// 토큰 검증
DecodedJWT jwt = JWT.require(Algorithm.HMAC256(secretKey))
    .build()
    .verify(token);
```

---

## 실습 가이드

### 1. practice 브랜치로 전환

```bash
git checkout shop/auth-practice
```

### 2. 실습 과제

#### 과제 1: JwtUtil 클래스 구현
- `generateToken(Long userId)`: Header + Payload + Signature로 JWT 생성
- `validateToken(String token)`: 서명 검증 + 만료 시간 체크
- `getUserIdFromToken(String token)`: Payload에서 sub(userId) 추출
- `sign(String data)`: HMAC-SHA256 서명 생성

#### 과제 2: 로그인 API 구현
- `POST /users/login` - userId를 받아 JWT 토큰을 발급한다
- 유저 존재 여부를 먼저 확인한다

#### 과제 3: GET /users/me 개선
- Authorization 헤더에서 토큰을 추출한다
- `Bearer ` 접두어를 제거한다
- JWT 검증 → userId 추출 → 유저 조회 → 유저 정보 반환

### 3. 정답 확인

```bash
git diff shop/auth-practice..shop/auth
```

### 4. 테스트

```bash
# macOS / Linux
./gradlew bootRun

# Windows
gradlew.bat bootRun
```

> curl 명령어는 Windows에서는 Git Bash 또는 PowerShell에서 실행한다.

```bash
# 1. 로그인 (토큰 발급)
curl -X POST http://localhost:8080/users/login \
  -H "Content-Type: application/json" \
  -d '{"userId": 1}'
# 응답: {"token":"eyJ..."}

# 2. 발급받은 토큰으로 내 정보 조회
# macOS / Linux
TOKEN=$(curl -s -X POST http://localhost:8080/users/login \
  -H "Content-Type: application/json" \
  -d '{"userId":1}' | jq -r '.token')

# Windows (PowerShell)
$TOKEN = (Invoke-RestMethod -Method Post -Uri http://localhost:8080/users/login `
  -ContentType "application/json" -Body '{"userId":1}').token

# 또는 Postman에서 토큰을 복사하여 사용

curl http://localhost:8080/users/me \
  -H "Authorization: Bearer $TOKEN"
# 응답: {"id":1,"name":"홍길동","email":"hong@example.com"}

# 3. 잘못된 토큰으로 요청
curl http://localhost:8080/users/me \
  -H "Authorization: Bearer invalid-token"
# 응답: 401 Unauthorized
```

---

## 핵심 정리

> **JWT는 Header.Payload.Signature 구조로, HMAC-SHA256 서명으로 변조를 방지한다. 로그인 시 토큰을 발급하고, 이후 요청에서 토큰을 검증하여 사용자를 식별한다. 실무에서는 jjwt나 auth0-java-jwt 라이브러리를 사용한다.**
