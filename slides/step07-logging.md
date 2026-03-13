---
marp: true
theme: default
paginate: true
---

# Step 7: 로깅 설정과 Logback 활용

**2026 RealCoding**

브랜치: `web/logging`
실습: `web/logging-practice`

---

# System.out.println()의 문제

```java
System.out.println("유저 조회: " + id);  // 이러면 안 됩니다!
```

| 문제 | 설명 |
|---|---|
| 레벨 구분 없음 | 디버깅 로그와 에러 로그가 구분 안 됨 |
| 출력 대상 고정 | 콘솔만 가능, 파일 저장 불가 |
| 성능 문제 | 항상 실행됨 (운영 환경에서도) |
| 제어 불가 | 끄려면 코드를 수정해야 함 |

---

# SLF4J + Logback

```
코드 → SLF4J (인터페이스) → Logback (구현체)
```

- **SLF4J**: 로깅 API 추상화 (인터페이스)
- **Logback**: 실제 로그 출력 (구현체)
- Spring Boot에 기본 포함 (의존성 추가 불필요)

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

private static final Logger log = LoggerFactory.getLogger(MyClass.class);
```

---

# 로그 레벨

```
TRACE < DEBUG < INFO < WARN < ERROR
```

| 레벨 | 용도 | 예시 |
|---|---|---|
| `TRACE` | 가장 상세한 추적 | 메서드 진입/종료 |
| `DEBUG` | 디버깅 정보 | 쿼리 결과, 중간 값 |
| `INFO` | 비즈니스 이벤트 | 유저 생성, 주문 완료 |
| `WARN` | 주의 필요 | 데이터 삭제, 재시도 |
| `ERROR` | 에러 발생 | 예외, API 실패 |

> 설정한 레벨 **이상만** 출력. INFO 설정 시 → INFO, WARN, ERROR만 출력

---

# 사용 예시

```java
@Service
public class UserService {
    private static final Logger log =
        LoggerFactory.getLogger(UserService.class);

    public List<User> getAllUsers() {
        List<User> users = /* ... */;
        log.info("유저 목록 조회 - 총 {}명", users.size());
        return users;
    }

    public User getUserById(Long id) {
        log.debug("유저 단건 조회 - id: {}", id);
        // ...
    }

    public void deleteUser(Long id) {
        log.warn("유저 삭제 완료 - id: {}", id);
    }
}
```

> `{}` = 플레이스홀더. 문자열 연결(+) 대신 사용하면 성능 이점

---

# 에러 로깅: 스택트레이스 포함

```java
// 마지막 인자로 예외 객체를 넘기면 스택트레이스 자동 출력
log.error("Unhandled exception: {}", e.getMessage(), e);
```

출력 결과:
```
ERROR GlobalExceptionHandler - Unhandled exception: / by zero
java.lang.ArithmeticException: / by zero
    at com.inspire12.backend.service.UserService.method(UserService.java:42)
    at sun.reflect.NativeMethodAccessorImpl.invoke0(...)
    ...
```

---

# logback-spring.xml: Appender 3종

| Appender | 용도 | 파일 |
|---|---|---|
| **Console** | 콘솔 출력 | - |
| **File** | 파일 저장 | `./logs/application.log` |
| **Rolling File** | 회전 저장 | 날짜+크기 기반 분할 |

```xml
<!-- 콘솔: 컬러 출력 -->
<appender name="CONSOLE"
    class="ch.qos.logback.core.ConsoleAppender">
    <encoder>
        <pattern>%d{HH:mm:ss.SSS} [%thread]
            %highlight(%-5level) %cyan(%logger{36})
            - %msg%n</pattern>
    </encoder>
</appender>
```

---

# Rolling File Appender

```xml
<appender name="ROLLING_FILE"
    class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>${LOG_DIR}/${LOG_FILE}-rolling.log</file>
    <encoder>
        <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread]
            %-5level %logger{50} - %msg%n</pattern>
    </encoder>
    <rollingPolicy class="ch.qos.logback.core.rolling
        .SizeAndTimeBasedRollingPolicy">
        <fileNamePattern>${LOG_DIR}/archived/
            ${LOG_FILE}.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
        <maxFileSize>10MB</maxFileSize>
        <maxHistory>30</maxHistory>
        <totalSizeCap>1GB</totalSizeCap>
    </rollingPolicy>
</appender>
```

- 파일 크기 10MB 초과 시 새 파일 생성
- 30일 지난 로그 자동 삭제
- 전체 로그 용량 1GB 제한

---

# 패턴 문자열 해설

```
%d{yyyy-MM-dd HH:mm:ss.SSS}  → 날짜/시간
[%thread]                      → 스레드 이름
%highlight(%-5level)           → 로그 레벨 (컬러)
%cyan(%logger{36})             → 로거 이름 (시안색)
%msg                           → 로그 메시지
%n                             → 줄바꿈
```

출력 예시:
```
2026-02-21 14:30:00.123 [http-nio-8080-exec-1]
INFO  c.i.b.service.UserService - 유저 목록 조회 - 총 3명
```

---

# 레벨별 사용 가이드라인

```java
// DEBUG: 개발자를 위한 상세 정보
log.debug("유저 단건 조회 - id: {}", id);

// INFO: 비즈니스 이벤트 기록
log.info("유저 생성 완료 - id: {}", saved.getId());

// WARN: 주의가 필요한 동작
log.warn("유저 삭제 완료 - id: {}", id);

// ERROR: 에러 + 스택트레이스
log.error("Unhandled exception: {}", e.getMessage(), e);
```

> 운영 환경에서는 보통 INFO 또는 WARN 이상만 출력

---

# 실습 안내

```bash
git checkout web/logging-practice
```

**TODO 항목:**
1. `UserService`에 Logger 선언 및 로그 추가
2. `logback-spring.xml` 작성 (3종 Appender)
3. `GlobalExceptionHandler`에 로그 추가

**테스트:**
```bash
curl http://localhost:8080/users      # → 콘솔에서 INFO 로그 확인
curl http://localhost:8080/users/999  # → WARN 로그 확인
cat ./logs/application.log            # → 파일 로그 확인
```

---

# 핵심 정리

> **`System.out.println()` 대신 `log.info()/debug()/warn()/error()`**

- 레벨로 출력을 제어 (코드 수정 없이!)
- Appender로 출력 대상을 설정 (콘솔/파일/롤링)
- `{}` 플레이스홀더로 성능 유지
- `log.error("msg", e)` 로 스택트레이스 자동 포함
