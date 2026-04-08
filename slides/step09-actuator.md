---
marp: true
theme: default
paginate: true
---

# Step 9: Actuator와 Metric으로 모니터링

**2026 RealCoding**

브랜치: `web/metric`
실습: `web/metric-practice`

---

# Actuator란?

애플리케이션의 **상태 모니터링** + **운영 정보 제공** 도구

실무에서 답해야 하는 질문들:
- "서버가 살아있는가?" → `/actuator/health`
- "요청이 얼마나 들어오는가?" → `/actuator/metrics`
- "유저가 몇 명 생성됐는가?" → 커스텀 메트릭

```groovy
// build.gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
}
```

---

# 주요 엔드포인트

| 엔드포인트 | 용도 |
|---|---|
| `/actuator` | 사용 가능한 엔드포인트 목록 |
| `/actuator/health` | 상태 확인 (UP/DOWN) |
| `/actuator/info` | 애플리케이션 정보 |
| `/actuator/metrics` | 메트릭 목록 |
| `/actuator/metrics/{name}` | 특정 메트릭 상세 |

```bash
curl http://localhost:8080/actuator/health
# → {"status": "UP", "components": {...}}
```

> (Windows에서는 Git Bash 또는 PowerShell에서 curl 명령을 실행)

---

# 프로필별 노출 설정

**dev: 전부 노출 (개발 편의)**
```properties
management.endpoints.web.exposure.include=*
management.endpoint.health.show-details=always
```

**prod: 최소한만 (보안)**
```properties
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=never
```

> 운영 환경에서 `metrics`, `env`, `beans`가 노출되면 **보안 위험**!

---

# /actuator/health 응답 예시

```json
{
    "status": "UP",
    "components": {
        "db": {
            "status": "UP",
            "details": { "database": "SQLite" }
        },
        "diskSpace": {
            "status": "UP",
            "details": { "total": 499963174912 }
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

`"user"` 항목 = 우리가 만든 **커스텀 Health Indicator**

---

# 커스텀 Health Indicator

```java
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;

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
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}
```

---

# Health Indicator 동작 원리

- `HealthIndicator` 구현 빈 등록 시 Actuator가 **자동 감지**
- 클래스명에서 `HealthIndicator`를 뗀 이름이 항목명
  - `UserHealthIndicator` → `"user"`
- `Health.up()` = 정상 / `Health.down()` = 장애

> **Spring Boot 4 패키지 변경:**
> `org.springframework.boot.health.contributor.HealthIndicator`
> (기존: `org.springframework.boot.actuate.health`)

---

# Micrometer Counter: 비즈니스 메트릭

```java
@RestController
@RequestMapping("/users")
public class UserController {
    private final Counter userCreateCounter;

    // MeterRegistry: Micrometer의 메트릭 등록소 — 모든 측정값을 관리하는 중앙 객체
    public UserController(UserService userService,
                          MeterRegistry meterRegistry) {
        this.userService = userService;
        // Counter: 누적 카운트 메트릭 — 숫자가 계속 올라가기만 하는 측정값
        this.userCreateCounter = Counter
            .builder("user.created.count")
            .description("유저 생성 횟수")
            .tag("controller", "UserController")
            .register(meterRegistry);
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User req) {
        User created = userService.createUser(req);
        userCreateCounter.increment();  // 카운터 증가!
        return ResponseEntity.created(...).body(created);
    }
}
```

---

# 메트릭 확인

```bash
# 유저 생성 (Windows에서는 Git Bash 또는 PowerShell에서 실행)
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"name":"홍길동","email":"hong@test.com"}'

# 카운터 확인
curl http://localhost:8080/actuator/metrics/user.created.count
```

```json
{
    "name": "user.created.count",
    "description": "유저 생성 횟수",
    "measurements": [
        { "statistic": "COUNT", "value": 3.0 }
    ],
    "availableTags": [
        { "tag": "controller", "values": ["UserController"] }
    ]
}
```

---

# Micrometer란?

```
앱 코드 → Micrometer (추상화) → 모니터링 시스템
                                  ├── Prometheus
                                  ├── Datadog
                                  ├── CloudWatch
                                  └── ...
```

- 메트릭 수집의 **추상화 계층** (= SLF4J의 메트릭 버전)
- Spring Boot Actuator에 **기본 포함**
- 주요 메트릭 타입:
  - **Counter** - 누적 카운트 (유저 생성 횟수)
  - **Gauge** - 현재 값 (접속 중인 유저 수)
  - **Timer** - 소요 시간 (API 응답 시간)

---

# 기본 내장 메트릭

Actuator는 다양한 메트릭을 **자동 수집**한다:

```bash
# HTTP 요청 메트릭
/actuator/metrics/http.server.requests

# JVM 메모리
/actuator/metrics/jvm.memory.used

# 활성 스레드
/actuator/metrics/jvm.threads.live

# DB 커넥션 풀
/actuator/metrics/hikaricp.connections.active
```

> 커스텀 메트릭(`user.created.count`)과 함께 활용!

---

# 실습 안내

```bash
git checkout web/metric-practice
```

**TODO 항목:**
1. `build.gradle`에 actuator 의존성 추가
2. 프로필별 Actuator 노출 설정
3. `UserHealthIndicator` 구현
4. `UserController`에 Counter 추가

**테스트:** (Windows에서는 Git Bash 또는 PowerShell에서 실행)
```bash
# 서버 실행: ./gradlew bootRun (Windows: gradlew.bat bootRun)
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/metrics
curl http://localhost:8080/actuator/metrics/user.created.count
```

---

# 핵심 정리

> **Actuator = 서버 상태 모니터링**
> **Micrometer Counter = 비즈니스 메트릭 수집**

- `/actuator/health` 로 서버 상태 확인
- `HealthIndicator`로 커스텀 상태 체크 추가
- `Counter`로 비즈니스 이벤트 카운팅
- 프로필별 노출 범위를 제어해 보안 유지
