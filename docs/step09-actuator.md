# Step 9: Actuator와 Metric으로 모니터링

> **브랜치:** `web/metric` | **실습 브랜치:** `web/metric-practice`

---

## 학습 목표

1. Spring Boot Actuator가 무엇이고 왜 필요한지 이해한다.
2. `/actuator/health`, `/actuator/metrics` 엔드포인트를 사용한다.
3. 프로필별로 Actuator 노출 범위를 다르게 설정한다.
4. 커스텀 Health Indicator를 구현한다.
5. Micrometer `Counter`로 비즈니스 메트릭을 수집한다.

---

## 핵심 개념

### Actuator란?

Spring Boot Actuator는 애플리케이션의 **상태를 모니터링**하고 **운영 정보를 제공**하는 도구다.

실무에서는 이런 질문에 답해야 한다:
- "서버가 살아있는가?" → `/actuator/health`
- "요청이 얼마나 들어오는가?" → `/actuator/metrics`
- "유저가 몇 명 생성됐는가?" → 커스텀 메트릭

### 주요 엔드포인트

| 엔드포인트 | 용도 |
|---|---|
| `/actuator` | 사용 가능한 엔드포인트 목록 |
| `/actuator/health` | 애플리케이션 상태 (UP/DOWN) |
| `/actuator/info` | 애플리케이션 정보 |
| `/actuator/metrics` | 메트릭 목록 |
| `/actuator/metrics/{name}` | 특정 메트릭 상세 |

### 의존성 추가

```groovy
// build.gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
}
```

---

## 주요 코드

### 1. 프로필별 Actuator 노출 설정

**application-dev.properties** (개발: 모두 노출)

```properties
# 모든 Actuator 엔드포인트 노출
management.endpoints.web.exposure.include=*
management.endpoint.health.show-details=always
```

**application-prod.properties** (운영: 최소한만)

```properties
# health, info만 노출
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=never
```

> **왜 운영에서는 제한하는가?**
> Actuator는 서버 내부 정보를 노출한다. `metrics`, `env`, `beans` 등이 외부에 노출되면 보안 위험이 있다.

### 2. /actuator/health 응답 예시

```json
{
    "status": "UP",
    "components": {
        "db": {
            "status": "UP",
            "details": {
                "database": "SQLite",
                "validationQuery": "isValid()"
            }
        },
        "diskSpace": {
            "status": "UP",
            "details": {
                "total": 499963174912,
                "free": 123456789012
            }
        },
        "user": {
            "status": "UP",
            "details": {
                "userService": "유저 서비스 정상",
                "userCount": 3
            }
        }
    }
}
```

### 3. 커스텀 Health Indicator (UserHealthIndicator)

```java
package com.inspire12.backend.config;

import com.inspire12.backend.repository.UserRepository;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

// /actuator/health에서 "user" 항목으로 표시됨
@Component
public class UserHealthIndicator implements HealthIndicator {

    private final UserRepository userRepository;

    public UserHealthIndicator(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public Health health() {
        try {
            long count = userRepository.count();
            return Health.up()
                    .withDetail("userService", "유저 서비스 정상")
                    .withDetail("userCount", count)
                    .build();
        } catch (Exception e) {
            return Health.down()
                    .withDetail("userService", "유저 서비스 장애")
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
```

**동작 원리:**
- `HealthIndicator`를 구현한 빈을 등록하면, Actuator가 자동으로 감지한다.
- 클래스 이름에서 `HealthIndicator`를 뗀 나머지(`User`)가 항목 이름이 된다.
- `Health.up()` / `Health.down()`으로 상태를 반환한다.

> **주의 (Spring Boot 4):** 패키지가 `org.springframework.boot.health.contributor`로 변경되었다. Spring Boot 3에서는 `org.springframework.boot.actuate.health`였다.

### 4. Micrometer Counter - 비즈니스 메트릭

```java
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final Counter userCreateCounter;

    // MeterRegistry: Micrometer의 메트릭 등록소 — 모든 측정값을 관리하는 중앙 객체
    public UserController(UserService userService, MeterRegistry meterRegistry) {
        this.userService = userService;
        // Counter 등록 (Counter: 누적 카운트 메트릭 — 숫자가 계속 올라가기만 하는 측정값)
        this.userCreateCounter = Counter.builder("user.created.count")
                .description("유저 생성 횟수")
                .tag("controller", "UserController")
                .register(meterRegistry);
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User request) {
        User created = userService.createUser(request);
        userCreateCounter.increment();  // 유저 생성 시 카운터 증가
        return ResponseEntity
                .created(URI.create("/users/" + created.id()))
                .body(created);
    }
}
```

**확인 방법:**

```bash
# 유저를 몇 명 생성한 후
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"name": "테스트", "email": "test@test.com"}'

# 카운터 메트릭 확인
curl http://localhost:8080/actuator/metrics/user.created.count
```

응답 예시:

```json
{
    "name": "user.created.count",
    "description": "유저 생성 횟수",
    "measurements": [
        {
            "statistic": "COUNT",
            "value": 3.0
        }
    ],
    "availableTags": [
        {
            "tag": "controller",
            "values": ["UserController"]
        }
    ]
}
```

### 5. Micrometer란?

```
애플리케이션 코드 → Micrometer (추상화) → 다양한 모니터링 시스템
                                            ├── Prometheus
                                            ├── Datadog
                                            ├── CloudWatch
                                            └── ...
```

- **Micrometer**는 메트릭 수집의 **추상화 계층**이다 (SLF4J의 메트릭 버전).
- Spring Boot Actuator에 기본 포함되어 있다.
- `Counter` (누적 카운트), `Gauge` (현재 값), `Timer` (소요 시간) 등 다양한 메트릭 타입을 제공한다.

### 6. Actuator 엔드포인트 안내 API

```java
@GetMapping("/actuator-guide")
public Map<String, String> actuatorGuide() {
    return Map.of(
            "전체 목록", "/actuator",
            "헬스 체크", "/actuator/health",
            "앱 정보", "/actuator/info",
            "메트릭 목록", "/actuator/metrics",
            "커스텀 메트릭", "/actuator/metrics/user.created.count",
            "HTTP 요청 메트릭", "/actuator/metrics/http.server.requests"
    );
}
```

---

## 실습 가이드

### 1. 브랜치 전환

```bash
git checkout web/metric-practice
```

### 2. 실습 과제

1. **의존성 추가**
   - `build.gradle`에 `spring-boot-starter-actuator` 추가

2. **프로필별 Actuator 설정**
   - `application-dev.properties`: 전체 노출
   - `application-prod.properties`: health, info만

3. **`UserHealthIndicator`** 구현
   - `HealthIndicator` 인터페이스 구현
   - `userRepository.count()`로 유저 수 조회
   - 정상이면 `Health.up()`, 예외 시 `Health.down()`

4. **`UserController`에 Counter 추가**
   - `MeterRegistry`를 생성자 주입
   - `Counter.builder("user.created.count")` 등록
   - `createUser()` 호출 시 `increment()`

### 3. 테스트

```bash
# 서버 실행
# macOS / Linux
./gradlew bootRun
# Windows (cmd / PowerShell)
gradlew.bat bootRun

# 헬스 체크 (user 항목 포함 확인)
curl -s http://localhost:8080/actuator/health | python3 -m json.tool

# 메트릭 목록
curl -s http://localhost:8080/actuator/metrics | python3 -m json.tool

# 유저 생성
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"name": "홍길동", "email": "hong@test.com"}'

# 유저 생성 카운터 확인
curl -s http://localhost:8080/actuator/metrics/user.created.count | python3 -m json.tool

# HTTP 요청 메트릭 확인
curl -s http://localhost:8080/actuator/metrics/http.server.requests | python3 -m json.tool
```

> (Windows에서는 Git Bash 또는 PowerShell에서 curl 명령을 실행)

### 4. 완성 코드 확인

```bash
git checkout web/metric
```

---

## 핵심 정리

> **Actuator로 서버 상태를 모니터링하고, Micrometer Counter로 비즈니스 메트릭을 수집한다.**
> Health Indicator로 커스텀 상태 체크를 추가하고,
> 프로필별로 노출 범위를 제어해 운영 환경의 보안을 지킨다.
