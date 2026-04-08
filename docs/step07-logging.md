# Step 7: 로깅 설정과 Logback 활용

> **브랜치:** `web/logging` | **실습 브랜치:** `web/logging-practice`

---

## 학습 목표

1. 왜 `System.out.println()` 대신 로깅 프레임워크를 써야 하는지 이해한다.
2. SLF4J + Logback의 관계를 이해한다.
3. `logback-spring.xml`로 콘솔, 파일, 롤링 파일 Appender를 설정한다.
4. 로그 레벨의 의미를 알고 상황에 맞게 사용한다.

---

## 핵심 개념

### System.out.println() vs 로깅 프레임워크

| 비교 항목 | `System.out.println()` | 로깅 프레임워크 (SLF4J + Logback) |
|---|---|---|
| 레벨 구분 | 없음 | TRACE, DEBUG, INFO, WARN, ERROR |
| 출력 대상 | 콘솔만 | 콘솔, 파일, 원격 서버 등 |
| 성능 | 항상 실행 | 레벨 미달 시 무시 (비용 0) |
| 운영 제어 | 코드 수정 필요 | 설정 파일만 변경 |
| 시간/스레드 정보 | 직접 작성 | 자동 포함 |

### SLF4J + Logback

```
코드 → SLF4J (인터페이스) → Logback (구현체)
```

- **SLF4J**: 로깅 API의 추상화 계층 (인터페이스)
- **Logback**: 실제 로그를 출력하는 구현체
- Spring Boot에 기본 포함되어 별도 의존성 추가가 필요 없다.

### 로그 레벨

```
TRACE < DEBUG < INFO < WARN < ERROR
```

| 레벨 | 용도 | 예시 |
|---|---|---|
| `TRACE` | 가장 상세한 추적 정보 | 메서드 진입/종료, 파라미터 값 |
| `DEBUG` | 개발 시 디버깅 정보 | 쿼리 결과, 중간 계산 값 |
| `INFO` | 비즈니스 이벤트 | 유저 생성, 주문 완료 |
| `WARN` | 주의가 필요한 상황 | 데이터 삭제, 재시도 발생 |
| `ERROR` | 에러 + 스택트레이스 | 예외 발생, 외부 API 실패 |

> **설정한 레벨 이상만 출력된다.** 예: `INFO`로 설정하면 INFO, WARN, ERROR만 출력.

---

## 주요 코드

### 1. Logger 사용법

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class UserService {

    // Logger 선언: 클래스 이름으로 생성
    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    public List<User> getAllUsers() {
        // 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다.
        // 아래의 .stream(), .map(), .toList()는 Stream API와 람다 문법이다.
        // "목록을 변환한다"는 흐름만 이해하면 된다.
        List<User> users = userRepository.findAll().stream()
                .map(this::toDto)
                .toList();
        log.info("유저 목록 조회 - 총 {}명", users.size());  // {} = 플레이스홀더 (중괄호 자리에 뒤의 인자 값이 자동으로 채워진다)
        return users;
    }

    public User getUserById(Long id) {
        log.debug("유저 단건 조회 - id: {}", id);
        return userRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    @Transactional
    public void deleteUser(Long id) {
        log.info("유저 삭제 요청 - id: {}", id);
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        userRepository.deleteById(id);
        log.warn("유저 삭제 완료 - id: {}", id);  // 삭제는 주의 필요 → WARN
    }
}
```

**GlobalExceptionHandler에서의 로깅:**

```java
@ExceptionHandler(Exception.class)
public ResponseEntity<ErrorResponse> handleException(Exception e) {
    // error 레벨 + 스택트레이스 출력 (세 번째 인자 e)
    log.error("Unhandled exception: {}", e.getMessage(), e);
    // ...
}
```

> **`log.error("메시지", e)`** 처럼 마지막 인자로 예외 객체를 넘기면 **스택트레이스가 자동 출력**된다.

### 2. logback-spring.xml 설정

파일 위치: `src/main/resources/logback-spring.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>

    <!-- ========== 변수 정의 ========== -->
    <!-- 로그 파일 저장 경로: Windows에서는 프로젝트 루트의 logs 폴더 (.\logs\) -->
    <property name="LOG_DIR" value="./logs"/>
    <property name="LOG_FILE" value="application"/>

    <!-- ========== 콘솔 출력 (Console Appender) ========== -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %highlight(%-5level) %cyan(%logger{36}) - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- ========== 파일 출력 (File Appender) ========== -->
    <appender name="FILE" class="ch.qos.logback.core.FileAppender">
        <file>${LOG_DIR}/${LOG_FILE}.log</file>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- ========== 롤링 파일 (Rolling File Appender) ========== -->
    <!-- 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다. -->
    <!-- Rolling File은 로그 파일이 너무 커지지 않도록 자동으로 분할/삭제해주는 설정이다. -->
    <appender name="ROLLING_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${LOG_DIR}/${LOG_FILE}-rolling.log</file>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n</pattern>
        </encoder>
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>${LOG_DIR}/archived/${LOG_FILE}.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
            <maxFileSize>10MB</maxFileSize>      <!-- 파일 하나 최대 10MB -->
            <maxHistory>30</maxHistory>           <!-- 최대 30일 보관 -->
            <totalSizeCap>1GB</totalSizeCap>     <!-- 전체 로그 최대 1GB -->
        </rollingPolicy>
    </appender>

    <!-- 기본 설정 -->
    <logger name="com.inspire12.backend" level="DEBUG"/>
    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="FILE"/>
    </root>

</configuration>
```

### 3. Appender 종류 비교

| Appender | 용도 | 특징 |
|---|---|---|
| **Console** | 콘솔 출력 | 개발 시 즉시 확인, 컬러 지원 |
| **File** | 파일 저장 | `./logs/application.log`에 기록 |
| **Rolling File** | 파일 회전 저장 | 날짜+크기 기반으로 자동 분할/삭제 |

### 4. 패턴 문자열 해설

```
%d{yyyy-MM-dd HH:mm:ss.SSS}  → 날짜/시간
[%thread]                      → 스레드 이름
%highlight(%-5level)           → 로그 레벨 (컬러, 왼쪽 정렬 5자)
%cyan(%logger{36})             → 로거 이름 (시안색, 최대 36자)
%msg                           → 로그 메시지
%n                             → 줄바꿈
```

출력 예시:

```
2026-02-21 14:30:00.123 [http-nio-8080-exec-1] INFO  c.i.b.service.UserService - 유저 목록 조회 - 총 3명
```

---

## 실습 가이드

### 1. 브랜치 전환

```bash
git checkout web/logging-practice
```

### 2. 실습 과제

1. **`UserService`에 로그 추가**
   - `Logger` 선언
   - 각 메서드에 적절한 레벨로 로그 추가
     - `getAllUsers()` → `log.info()`
     - `getUserById()` → `log.debug()`
     - `createUser()` → `log.info()`
     - `deleteUser()` → `log.warn()`

2. **`logback-spring.xml` 작성**
   - Console Appender (컬러 패턴)
   - File Appender (`./logs/application.log`)
   - Rolling File Appender (10MB, 30일, 1GB)

3. **`GlobalExceptionHandler`에 로그 추가**
   - `handleUserNotFound()` → `log.warn()`
   - `handleException()` → `log.error()` + 스택트레이스

### 3. 테스트

```bash
# 서버 실행
# macOS / Linux
./gradlew bootRun

# Windows (cmd / PowerShell)
gradlew.bat bootRun

# API 호출 후 콘솔 로그 확인 (Windows에서는 Git Bash 또는 PowerShell에서 실행)
curl http://localhost:8080/users
curl http://localhost:8080/users/1
curl http://localhost:8080/users/999

# 파일 로그 확인
# macOS / Linux
cat ./logs/application.log

# Windows (cmd)
type .\logs\application.log

# Windows (PowerShell)
Get-Content .\logs\application.log
```

### 4. 완성 코드 확인

```bash
git checkout web/logging
```

---

## 핵심 정리

> **`System.out.println()` 대신 `log.info()/debug()/warn()/error()`를 사용하라.**
> 레벨로 출력을 제어하고, Appender로 출력 대상(콘솔/파일)을 설정 파일에서 관리한다.
