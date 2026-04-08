---
marp: true
theme: default
paginate: true
---

# Step 16: CORS 설정으로 프론트엔드 연동하기
## 다른 출처 간 요청 허용하기

**2026 RealCoding**
브랜치: `feature/cors`

---

## 문제 상황

프론트엔드(`localhost:3000`)에서 백엔드(`localhost:8080`) 호출 시:

```
❌ Access to fetch at 'http://localhost:8080/users'
   from origin 'http://localhost:3000'
   has been blocked by CORS policy
```

**브라우저**가 보안을 위해 **다른 Origin** 요청을 차단!

---

## Origin 이란?

Origin = **프로토콜 + 호스트 + 포트**

| URL | Origin |
|-----|--------|
| `http://localhost:3000/page` | `http://localhost:3000` |
| `http://localhost:8080/api` | `http://localhost:8080` |

**포트가 다르면 → 다른 Origin → CORS 필요!**

---

## CORS 동작 원리

서버가 **"이 Origin 은 허용한다"** 고 응답 헤더에 명시

```
[브라우저] → GET /users
            Origin: http://localhost:3000

[서버]    ← Access-Control-Allow-Origin: http://localhost:3000
            ✅ 허용!
```

서버가 헤더를 안 보내면 → 브라우저가 차단

---

## Preflight 요청 (OPTIONS)

POST, PUT, DELETE 등은 **사전 확인** 후 실제 요청

```
1단계: [브라우저] → OPTIONS /users (이 요청 보내도 되나요?)
       [서버]    ← 허용 메서드: GET, POST, PUT, DELETE ✅

2단계: [브라우저] → POST /users (실제 요청)
       [서버]    ← 200 OK + 데이터
```

`maxAge` 설정 → Preflight 결과 캐시 (매번 안 보냄)

---

## Simple vs Preflight

| 구분 | Simple Request | Preflight Request |
|------|---------------|-------------------|
| 메서드 | GET, HEAD, POST | PUT, DELETE, PATCH |
| Content-Type | form-data, text/plain | **application/json** |
| 사전 확인 | 없음 | OPTIONS 먼저 |

우리의 API 는 `application/json` 사용 → **Preflight 발생!**

---

## Spring Boot CORS 설정

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

---

## 각 설정의 의미

| 메서드 | 설명 | 값 |
|--------|------|----|
| `addMapping("/**")` | 모든 경로에 CORS 적용 | `/**` |
| `allowedOrigins` | 허용할 프론트엔드 주소 | `http://localhost:3000` |
| `allowedMethods` | 허용할 HTTP 메서드 | GET, POST, PUT, DELETE, OPTIONS |
| `allowedHeaders("*")` | 모든 요청 헤더 허용 | `*` |
| `allowCredentials(true)` | 쿠키/JWT 전송 허용 | `true` |
| `maxAge(3600)` | Preflight 캐시 1시간 | `3600`초 |

---

## 주의: allowCredentials + allowedOrigins

보안상 모든 출처를 허용하면서 인증 정보도 허용하면 위험하기 때문:

```java
// ❌ 에러! credentials 사용 시 * 불가
.allowedOrigins("*")
.allowCredentials(true)

// ✅ 특정 Origin 명시
.allowedOrigins("http://localhost:3000")
.allowCredentials(true)

// ✅ 여러 Origin 허용
.allowedOrigins("http://localhost:3000", "https://myapp.com")
.allowCredentials(true)
```

---

## CORS 응답 헤더

서버 → 브라우저로 전달되는 헤더:

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: *
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

브라우저는 이 헤더를 보고 요청 허용/차단을 결정

---

## 확인 방법

> curl 명령어는 Windows에서는 Git Bash 또는 PowerShell에서 실행한다.

```bash
# Preflight 확인 (OPTIONS)
curl -v -X OPTIONS http://localhost:8080/users \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"

# 일반 요청 CORS 헤더 확인
curl -v http://localhost:8080/users \
  -H "Origin: http://localhost:3000"

# 허용되지 않은 Origin (차단됨)
curl -v http://localhost:8080/users \
  -H "Origin: http://localhost:9999"
```

---

## 실습 (practice 브랜치)

```bash
git checkout feature/cors-practice
```

**실행:**
```bash
# macOS / Linux
./gradlew bootRun

# Windows
gradlew.bat bootRun
```

**과제:**
`WebMvcConfig.addCorsMappings()` 메서드 내부를 완성하세요

- `addMapping` → 모든 경로
- `allowedOrigins` → `http://localhost:3000`
- `allowedMethods` → GET, POST, PUT, DELETE, OPTIONS
- `allowedHeaders` → 전부 허용
- `allowCredentials` → true
- `maxAge` → 3600

---

## 핵심 정리

> **CORS = 다른 Origin 간 요청을 허용하는 메커니즘
> 브라우저가 차단 → 서버가 허용 헤더로 해제
> Preflight(OPTIONS) → 사전 확인 후 실제 요청**

**기억할 키워드:**
- Same-Origin Policy - 브라우저 보안 정책
- `addCorsMappings()` - Spring CORS 설정
- `allowedOrigins` - 허용할 프론트엔드 주소
- `allowCredentials(true)` - JWT/쿠키 전송 허용
- `maxAge` - Preflight 캐시 시간
