# Step 8: Spring Profile로 환경 분리

> **브랜치:** `web/profile` | **실습 브랜치:** `web/profile-practice`

---

## 학습 목표

1. Spring Profile이 왜 필요한지 이해한다.
2. 환경별 설정 파일을 분리하고 활성화하는 방법을 익힌다.
3. `logback-spring.xml`에서 `<springProfile>`로 환경별 로그 설정을 적용한다.
4. `SystemController`로 현재 프로필을 확인하고 로그 레벨을 테스트한다.
5. `.env` 파일로 민감 정보(API 키 등)를 분리 관리하는 방법을 익힌다.

---

## 핵심 개념

### 왜 프로필이 필요한가?

개발 환경과 운영 환경은 요구사항이 다르다:

| 항목 | 개발 (dev) | 운영 (prod) |
|---|---|---|
| 포트 | 8080 | 80 |
| 로그 레벨 | DEBUG (상세하게) | WARN (최소한으로) |
| SQL 로그 | 출력 | 끔 |
| Actuator | 전체 노출 | health, info만 |
| DDL 모드 | update (자동 생성) | validate (검증만) |

**하나의 코드**로 이 모든 환경을 지원하려면, **설정만 바꿔서** 다르게 동작하게 해야 한다.

### 설정 파일 구조

```
src/main/resources/
├── application.properties          ← 공통 설정 + 기본 프로필 지정
├── application-dev.properties      ← dev 프로필 전용 설정
└── application-prod.properties     ← prod 프로필 전용 설정
```

**규칙:** `application-{프로필명}.properties`

Spring Boot는 활성 프로필에 해당하는 파일을 자동으로 로드하고, 공통 설정에 덮어쓴다.

---

## 주요 코드

### 1. application.properties (공통 설정)

```properties
spring.application.name=backend

# 기본 활성 프로필 설정
spring.profiles.active=dev

# .env 파일에서 환경변수 로드 (프로젝트 루트의 .env, 파일이 없으면 무시)
spring.config.import=optional:file:.env[.properties]
```

#### `.env` 파일이란?

`.env`는 **민감한 정보(API 키, 비밀번호, DB 계정 등)**를 코드와 분리하여 관리하는 관례적인 파일이다.

| 항목 | `application.properties` | `.env` |
|------|--------------------------|--------|
| **Git 커밋** | O (공개 OK) | **X (절대 커밋 금지)** |
| **용도** | 공통 설정, 로직 관련 | 민감 정보, 로컬 전용 값 |
| **팀원 공유** | 그대로 공유 | `.env.example` 템플릿만 공유 |

**`spring.config.import`로 불러오는 이유**:
- `spring.config.import=optional:file:.env[.properties]`를 추가하면, Spring Boot가 프로젝트 루트의 `.env` 파일을 **추가 설정 파일**로 인식한다.
- `optional:`: 파일이 없어도 에러가 발생하지 않는다 (개발자마다 `.env` 유무가 다를 수 있기 때문).
- `[.properties]`: 파일 확장자가 `.env`여도 `.properties` 형식으로 파싱한다.

#### `.env.example`과 `.env` 분리 패턴

```
프로젝트 루트/
├── .env.example       ← Git에 커밋 (템플릿, 빈 값)
├── .env               ← Git에 커밋 X (실제 값, 로컬 전용)
└── .gitignore         ← .env를 제외 목록에 추가
```

**작업 흐름:**

1. **`.env.example` (템플릿) 생성 및 Git 커밋**
   ```properties
   # .env.example
   naver.client-id=your-naver-client-id-here
   naver.client-secret=your-naver-client-secret-here
   ```

2. **`.gitignore`에 `.env` 추가**
   ```
   .env
   .env.*
   !.env.example
   ```

3. **팀원(학생)은 `.env.example`을 복사하여 `.env`를 만든다**
   ```bash
   # macOS / Linux / Git Bash
   cp .env.example .env

   # Windows (cmd)
   copy .env.example .env
   ```

4. **`.env` 파일을 열어 본인의 값을 채운다**
   ```properties
   # .env
   naver.client-id=abcd1234efgh5678
   naver.client-secret=ijkl9012mnop3456
   ```

5. **Spring Boot가 실행되면 `.env`의 값이 `application.properties`에 주입된다**

> **왜 이 패턴을 쓰는가?**
> - `.env.example`은 팀원에게 "어떤 설정이 필요한지" 알려주는 **체크리스트** 역할을 한다.
> - 실제 값이 담긴 `.env`는 Git에 올라가지 않아 **유출 위험이 없다**.
> - 새 팀원이 프로젝트를 받으면 `.env.example`만 보고 필요한 키를 알 수 있다.

### 2. application-dev.properties

```properties
# ========== DEV Profile ==========
server.port=8080

# 로그 레벨: DEBUG (상세 출력)
logging.level.com.inspire12.backend=DEBUG
logging.level.org.springframework.web=DEBUG

# Actuator: 모든 엔드포인트 노출
management.endpoints.web.exposure.include=*
management.endpoint.health.show-details=always

# JPA: SQL 로그 출력, DDL 자동 생성
spring.jpa.show-sql=true
spring.jpa.hibernate.ddl-auto=update
```

### 3. application-prod.properties

```properties
# ========== PROD Profile ==========
server.port=80

# 로그 레벨: WARN 이상만
logging.level.com.inspire12.backend=INFO
logging.level.org.springframework.web=WARN

# Actuator: health, info만 노출
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=never

# JPA: SQL 로그 끔, DDL 검증만
spring.jpa.show-sql=false
spring.jpa.hibernate.ddl-auto=validate
```

### 4. logback-spring.xml에서 `<springProfile>` 사용

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>

    <property name="LOG_DIR" value="./logs"/>
    <property name="LOG_FILE" value="application"/>

    <!-- Appender 정의 (CONSOLE, FILE, ROLLING_FILE) -->
    <!-- ... (생략) ... -->

    <!-- DEV: 콘솔만 사용, DEBUG 레벨 -->
    <springProfile name="dev">
        <logger name="com.inspire12.backend" level="DEBUG"/>
        <logger name="org.springframework.web" level="DEBUG"/>
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

    <!-- 프로필 미지정 시 기본 설정 -->
    <springProfile name="default">
        <logger name="com.inspire12.backend" level="DEBUG"/>
        <root level="INFO">
            <appender-ref ref="CONSOLE"/>
            <appender-ref ref="FILE"/>
        </root>
    </springProfile>

</configuration>
```

> **`<springProfile name="dev">`**: `spring.profiles.active=dev`일 때만 해당 블록이 적용된다.

### 5. Before/After 비교

#### Before: 환경마다 설정 파일을 수동으로 바꿈

```properties
# application.properties 하나에 모든 설정
server.port=8080
logging.level.com.inspire12.backend=DEBUG
management.endpoints.web.exposure.include=*
# 운영 배포할 때마다 이 값을 일일이 수정...
```

**문제점:**
- 배포할 때 설정을 바꾸다 실수할 수 있다.
- 개발 설정이 운영에 그대로 나갈 위험이 있다.
- 로그 레벨을 바꾸려면 코드를 수정해야 한다.

#### After: 프로필로 환경별 설정 자동 전환

```bash
# 개발 환경 실행
# macOS / Linux
./gradlew bootRun
# Windows (cmd / PowerShell)
gradlew.bat bootRun
# → application-dev.properties 적용 (port=8080, DEBUG)

# 운영 환경 실행
# macOS / Linux
./gradlew bootRun --args='--spring.profiles.active=prod'

# Windows (cmd)
gradlew.bat bootRun --args="--spring.profiles.active=prod"

# Windows (PowerShell)
gradlew.bat bootRun --args='--spring.profiles.active=prod'
# → application-prod.properties 적용 (port=80, WARN)
```

**개선점:**
- 코드 수정 없이 실행 인자만 바꾸면 된다.
- 환경별 설정이 명확히 분리되어 실수 방지.
- logback도 프로필에 따라 자동 전환.

### 6. SystemController - 프로필 확인 API

```java
@RestController
@RequestMapping("/system")
public class SystemController {

    private static final Logger log = LoggerFactory.getLogger(SystemController.class);

    private final Environment environment;

    @Value("${spring.application.name}")
    private String appName;

    @Value("${server.port:8080}")
    private String serverPort;

    public SystemController(Environment environment) {
        this.environment = environment;
    }

    // 현재 활성 프로필 확인
    @GetMapping("/profile")
    public Map<String, Object> getProfile() {
        String[] activeProfiles = environment.getActiveProfiles();
        String profile = activeProfiles.length > 0 ? activeProfiles[0] : "default";

        log.info("프로필 조회 - active: {}", profile);

        return Map.of(
                "appName", appName,
                "activeProfile", profile,
                "serverPort", serverPort
        );
    }

    // 로그 레벨 테스트
    @GetMapping("/log-test")
    public Map<String, String> logTest() {
        log.trace("TRACE 레벨 로그입니다");
        log.debug("DEBUG 레벨 로그입니다");
        log.info("INFO 레벨 로그입니다");
        log.warn("WARN 레벨 로그입니다");
        log.error("ERROR 레벨 로그입니다");

        String[] activeProfiles = environment.getActiveProfiles();
        String profile = activeProfiles.length > 0 ? activeProfiles[0] : "default";

        return Map.of(
                "message", "콘솔에서 어떤 레벨까지 출력되는지 확인하세요",
                "activeProfile", profile
        );
    }
}
```

---

## 실습 가이드

### 1. 브랜치 전환

```bash
git checkout web/profile-practice
```

### 2. 실습 과제

1. **`application.properties`** 작성
   - `spring.application.name=backend`
   - `spring.profiles.active=dev`

2. **`application-dev.properties`** 작성
   - `server.port=8080`
   - 로그 레벨: DEBUG
   - Actuator: 전체 노출
   - JPA: SQL 출력, DDL auto update

3. **`application-prod.properties`** 작성
   - `server.port=80`
   - 로그 레벨: WARN
   - Actuator: health, info만
   - JPA: SQL 끔, DDL validate

4. **`logback-spring.xml`에 `<springProfile>` 추가**
   - dev: 콘솔만, DEBUG
   - prod: 콘솔 + 롤링파일, WARN

5. **`SystemController`** 작성
   - `/system/profile` - 현재 프로필 조회
   - `/system/log-test` - 로그 레벨 테스트

### 3. 테스트

```bash
# dev 프로필로 실행 (기본)
# macOS / Linux
./gradlew bootRun
# Windows (cmd / PowerShell)
gradlew.bat bootRun

# 프로필 확인 (Windows에서는 Git Bash 또는 PowerShell에서 실행)
curl http://localhost:8080/system/profile

# 로그 테스트 - 콘솔에서 DEBUG까지 출력되는지 확인
curl http://localhost:8080/system/log-test

# prod 프로필로 실행
# macOS / Linux
./gradlew bootRun --args='--spring.profiles.active=prod'

# Windows (cmd)
gradlew.bat bootRun --args="--spring.profiles.active=prod"

# Windows (PowerShell)
gradlew.bat bootRun --args='--spring.profiles.active=prod'

# 로그 테스트 - 콘솔에서 WARN, ERROR만 출력되는지 확인
curl http://localhost:80/system/log-test
```

### 4. 완성 코드 확인

```bash
git checkout web/profile
```

---

## 핵심 정리

> **하나의 코드, 여러 환경 = Spring Profile.**
> `application-{profile}.properties`로 설정을 분리하고,
> `spring.profiles.active`로 환경을 전환한다.
> logback도 `<springProfile>`로 환경별 로그 전략을 적용한다.
