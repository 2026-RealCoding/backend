---
marp: true
theme: default
paginate: true
---

# Step 8: Spring Profile로 환경 분리

**2026 RealCoding**

브랜치: `web/profile`
실습: `web/profile-practice`

---

# 왜 프로필이 필요한가?

개발 환경과 운영 환경은 요구사항이 다르다.

| 항목 | 개발 (dev) | 운영 (prod) |
|---|---|---|
| 포트 | 8080 | 80 |
| 로그 레벨 | DEBUG | WARN |
| SQL 로그 | 출력 | 끔 |
| Actuator | 전체 노출 | 최소한 |
| DDL 모드 | update | validate |

> **하나의 코드**로 **설정만 바꿔서** 다르게 동작하게!

---

# 설정 파일 구조

```
src/main/resources/
├── application.properties         ← 공통 설정
├── application-dev.properties     ← dev 전용
└── application-prod.properties    ← prod 전용
```

**규칙:** `application-{프로필명}.properties`

Spring Boot가 활성 프로필에 해당하는 파일을 **자동으로** 로드

---

# application.properties (공통)

```properties
spring.application.name=backend

# 기본 프로필: dev
spring.profiles.active=dev
```

프로필 전환 방법:
```bash
# 1. properties 파일에서 설정
spring.profiles.active=dev

# 2. 실행 인자로 전달
# macOS / Linux
./gradlew bootRun --args='--spring.profiles.active=prod'
# Windows (cmd)
gradlew.bat bootRun --args="--spring.profiles.active=prod"
# Windows (PowerShell)
gradlew.bat bootRun --args='--spring.profiles.active=prod'

# 3. 환경 변수
# macOS / Linux
export SPRING_PROFILES_ACTIVE=prod
# Windows (cmd)
set SPRING_PROFILES_ACTIVE=prod
# Windows (PowerShell)
$env:SPRING_PROFILES_ACTIVE="prod"
```

---

# application-dev.properties

```properties
server.port=8080

# 로그: 상세하게 출력
logging.level.com.inspire12.backend=DEBUG
logging.level.org.springframework.web=DEBUG

# Actuator: 모든 엔드포인트 노출
management.endpoints.web.exposure.include=*
management.endpoint.health.show-details=always

# JPA: 개발 편의
spring.jpa.show-sql=true
spring.jpa.hibernate.ddl-auto=update
```

---

# application-prod.properties

```properties
server.port=80

# 로그: 최소한만 출력
logging.level.com.inspire12.backend=INFO
logging.level.org.springframework.web=WARN

# Actuator: 최소한만 노출
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=never

# JPA: 안전하게
spring.jpa.show-sql=false
spring.jpa.hibernate.ddl-auto=validate
```

---

# logback-spring.xml: springProfile

```xml
<!-- DEV: 콘솔만 사용, DEBUG 레벨 -->
<springProfile name="dev">
    <logger name="com.inspire12.backend" level="DEBUG"/>
    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
    </root>
</springProfile>

<!-- PROD: 콘솔 + 롤링 파일, WARN 레벨 -->
<springProfile name="prod">
    <logger name="com.inspire12.backend" level="INFO"/>
    <logger name="org.springframework" level="WARN"/>
    <root level="WARN">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="ROLLING_FILE"/>
    </root>
</springProfile>
```

> `<springProfile name="dev">` = `spring.profiles.active=dev`일 때만 적용

---

# SystemController: 프로필 확인

```java
@RestController
@RequestMapping("/system")
public class SystemController {
    private final Environment environment;

    @Value("${spring.application.name}")
    private String appName;

    @Value("${server.port:8080}")
    private String serverPort;

    @GetMapping("/profile")
    public Map<String, Object> getProfile() {
        String[] activeProfiles = environment.getActiveProfiles();
        String profile = activeProfiles.length > 0
            ? activeProfiles[0] : "default";
        return Map.of(
            "appName", appName,
            "activeProfile", profile,
            "serverPort", serverPort
        );
    }
}
```

---

# SystemController: 로그 레벨 테스트

```java
@GetMapping("/log-test")
public Map<String, String> logTest() {
    log.trace("TRACE 레벨 로그입니다");  // dev에서도 안 보임
    log.debug("DEBUG 레벨 로그입니다");  // dev에서만 보임
    log.info("INFO 레벨 로그입니다");    // dev에서 보임
    log.warn("WARN 레벨 로그입니다");    // 항상 보임
    log.error("ERROR 레벨 로그입니다");  // 항상 보임
    return Map.of("message",
        "콘솔에서 어떤 레벨까지 출력되는지 확인하세요");
}
```

> dev: DEBUG 이상 5개 중 4개 출력
> prod: WARN 이상 5개 중 2개 출력

---

# Before vs After

**Before:** 설정 파일 하나에 모든 값
```properties
# 배포할 때마다 수동으로 수정...
server.port=8080
logging.level.com.inspire12.backend=DEBUG
```

**After:** 프로필로 자동 전환
```bash
# 개발
# macOS / Linux
./gradlew bootRun
# Windows (cmd / PowerShell)
gradlew.bat bootRun

# 운영
# macOS / Linux
./gradlew bootRun --args='--spring.profiles.active=prod'
# Windows (cmd)
gradlew.bat bootRun --args="--spring.profiles.active=prod"
# Windows (PowerShell)
gradlew.bat bootRun --args='--spring.profiles.active=prod'
```

코드 수정 없이, 실행 인자만 바꾸면 끝!

---

# dev vs prod 비교 요약

| 항목 | dev | prod |
|---|---|---|
| 포트 | 8080 | 80 |
| 로그 레벨 | DEBUG | WARN |
| 로그 출력 | 콘솔만 | 콘솔 + 롤링파일 |
| Actuator | 전체 노출 | health, info만 |
| SQL 로그 | 출력 | 끔 |
| DDL 모드 | update | validate |
| Health 상세 | always | never |

---

# 실습 안내

```bash
git checkout web/profile-practice
```

**TODO 항목:**
1. `application.properties` - 공통 설정
2. `application-dev.properties` - 개발 설정
3. `application-prod.properties` - 운영 설정
4. `logback-spring.xml`에 `<springProfile>` 추가
5. `SystemController` 구현

**테스트:** (Windows에서는 Git Bash 또는 PowerShell에서 실행)
```bash
curl http://localhost:8080/system/profile
curl http://localhost:8080/system/log-test
```

---

# 핵심 정리

> **하나의 코드, 여러 환경 = Spring Profile**

- `application-{profile}.properties`로 설정 분리
- `spring.profiles.active`로 환경 전환
- `logback-spring.xml`의 `<springProfile>`로 로그 전략 분리
- 코드 변경 없이, 실행 인자만으로 환경 전환
