# Step 16: CORS 설정으로 프론트엔드 연동하기

> **브랜치**: `feature/cors`
> **실습 브랜치**: `feature/cors-practice`

---

## 학습 목표

1. CORS 가 무엇이고 왜 필요한지 이해한다
2. 브라우저의 Same-Origin Policy 와 CORS 의 관계를 이해한다
3. Preflight 요청(OPTIONS)의 동작 원리를 이해한다
4. Spring Boot 에서 `WebMvcConfigurer` 를 통해 CORS 를 설정할 수 있다

---

## 핵심 개념

### 왜 CORS 가 필요한가?

프론트엔드(`http://localhost:3000`)에서 백엔드(`http://localhost:8080`) API 를 호출하면:

```
[브라우저] → fetch("http://localhost:8080/users")
           → 브라우저가 차단! ❌
           → "CORS policy 에 의해 차단되었습니다"
```

**Same-Origin Policy**: 브라우저는 보안을 위해 **다른 출처(Origin)**의 요청을 기본적으로 차단한다.

### Origin 이란?

Origin = **프로토콜 + 호스트 + 포트**

| URL | Origin |
|-----|--------|
| `http://localhost:3000/page` | `http://localhost:3000` |
| `http://localhost:8080/api` | `http://localhost:8080` |
| `https://example.com/api` | `https://example.com` |

포트가 다르면 **다른 Origin** → CORS 필요!

### CORS 동작 원리

백엔드가 응답 헤더에 "이 Origin 은 허용한다"고 명시하면 브라우저가 요청을 허용한다:

```
[브라우저] → GET /users
[서버]    ← Access-Control-Allow-Origin: http://localhost:3000
[브라우저] → 허용된 Origin 이니까 통과! ✅
```

### Preflight 요청 (OPTIONS)

`POST`, `PUT`, `DELETE` 같은 요청은 브라우저가 **먼저 확인 요청(Preflight)**을 보낸다:

```
1. [브라우저] → OPTIONS /users (사전 확인)
   [서버]    ← 허용 메서드: GET, POST, PUT, DELETE
              ← 허용 Origin: http://localhost:3000

2. [브라우저] → POST /users (실제 요청)
   [서버]    ← 200 OK + 데이터
```

`maxAge` 를 설정하면 Preflight 결과를 캐시하여 매번 보내지 않아도 된다.

### Simple Request vs Preflight Request

| 구분 | Simple Request | Preflight Request |
|------|---------------|-------------------|
| 메서드 | GET, HEAD, POST | PUT, DELETE, PATCH 등 |
| 헤더 | 기본 헤더만 | Custom 헤더 포함 |
| Content-Type | form-data, text/plain | application/json |
| 사전 확인 | 없음 | OPTIONS 요청 먼저 |

---

## 주요 코드

### WebMvcConfig - CORS 설정 추가

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")                             // 모든 경로에 CORS 적용
                .allowedOrigins("http://localhost:3000")        // 허용할 Origin
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")  // 허용할 HTTP 메서드
                .allowedHeaders("*")                            // 모든 헤더 허용
                .allowCredentials(true)                         // 쿠키/인증 헤더 포함 허용
                .maxAge(3600);                                  // Preflight 캐시 1시간
    }
}
```

### 각 설정의 의미

| 메서드 | 설명 | 예시 |
|--------|------|------|
| `addMapping` | CORS 를 적용할 URL 패턴 | `"/**"` = 전체 |
| `allowedOrigins` | 허용할 프론트엔드 주소 | `"http://localhost:3000"` |
| `allowedMethods` | 허용할 HTTP 메서드 | GET, POST, PUT, DELETE, OPTIONS |
| `allowedHeaders` | 허용할 요청 헤더 | `"*"` = 전부 허용 |
| `allowCredentials` | 쿠키/인증 정보 포함 여부 | `true` = JWT 토큰 전송 가능 |
| `maxAge` | Preflight 캐시 시간 (초) | `3600` = 1시간 |

### 주의: allowCredentials 와 allowedOrigins

`allowCredentials(true)` 를 사용하면 `allowedOrigins("*")` 는 사용할 수 없다 (보안상 모든 출처를 허용하면서 인증 정보도 허용하면 위험하기 때문).
반드시 특정 Origin 을 명시해야 한다:

```java
// ❌ 에러 발생
.allowedOrigins("*")
.allowCredentials(true)

// ✅ 올바른 사용
.allowedOrigins("http://localhost:3000")
.allowCredentials(true)

// ✅ 여러 Origin 허용
.allowedOrigins("http://localhost:3000", "https://myapp.com")
.allowCredentials(true)
```

### CORS 응답 헤더 (서버 → 브라우저)

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: *
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

---

## 확인 방법

### 1. 서버 실행

```bash
# macOS / Linux
./gradlew bootRun

# Windows
gradlew.bat bootRun
```

### 2. CORS 헤더 확인 (OPTIONS Preflight)

> curl 명령어는 Windows에서는 Git Bash 또는 PowerShell에서 실행한다.

```bash
curl -v -X OPTIONS http://localhost:8080/users \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
```

응답에 `Access-Control-Allow-Origin: http://localhost:3000` 이 포함되어야 한다.

### 3. 일반 요청 CORS 헤더 확인

```bash
curl -v http://localhost:8080/users \
  -H "Origin: http://localhost:3000"
```

### 4. 허용되지 않은 Origin 테스트

```bash
curl -v http://localhost:8080/users \
  -H "Origin: http://localhost:9999"
```

`Access-Control-Allow-Origin` 헤더가 없으면 브라우저에서 차단된다.

---

## 실습 가이드

### 1. practice 브랜치로 전환

```bash
git checkout feature/cors-practice
```

### 2. 실습 과제

#### 과제 1: WebMvcConfig 에 CORS 설정 완성
- `addCorsMappings` 메서드 내부를 채운다
- `allowedOrigins`: `http://localhost:3000`
- `allowedMethods`: GET, POST, PUT, DELETE, OPTIONS
- `allowedHeaders`: `*`
- `allowCredentials`: `true`
- `maxAge`: `3600`

### 3. 정답 확인

```bash
git diff feature/cors-practice..feature/cors
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
# Preflight 확인
curl -v -X OPTIONS http://localhost:8080/users \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"

# 일반 요청 CORS 확인
curl -v http://localhost:8080/users \
  -H "Origin: http://localhost:3000"
```

---

## 핵심 정리

> **CORS 는 브라우저의 Same-Origin Policy 로 인해 프론트엔드와 백엔드의 Origin 이 다를 때 필요하다. Spring Boot 에서는 `WebMvcConfigurer.addCorsMappings()` 로 허용할 Origin, 메서드, 헤더를 설정한다. `allowCredentials(true)` 사용 시 `allowedOrigins("*")` 는 불가하며 특정 Origin 을 명시해야 한다. Preflight(OPTIONS) 요청의 캐시 시간은 `maxAge` 로 제어한다.**
