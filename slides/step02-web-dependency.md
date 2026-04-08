---
marp: true
theme: default
paginate: true
---

# Step 2: 프로젝트 시작하기

**2026 RealCoding - Spring Boot Backend**

브랜치: `web/start`

---

## 학습 목표

- Spring Boot 프로젝트의 기본 구조를 이해한다
- `@SpringBootApplication`의 역할을 파악한다
- `build.gradle`의 핵심 구성 요소를 읽을 수 있다
- `spring-boot-starter-web`의 역할을 이해한다
- `./gradlew bootRun`으로 웹 서버를 실행하고 접속할 수 있다

---

## 왜 Spring Boot인가?

> 용어를 몰라도 괜찮다! "옛날에는 복잡했는데, 이제 간단하다"가 핵심

| 기존 Spring | Spring Boot |
|---|---|
| XML/Java로 복잡한 설정 필요 | 자동 설정 (Auto Configuration) |
| 외부 WAS(웹 서버) 별도 설치 필요 | 내장 서버 포함 |
| 의존성(라이브러리) 버전 직접 관리 | 스타터로 일괄 관리 |
| 설정에 많은 시간 소요 | 관례를 따르면 설정 불필요 |

---

## Spring Boot의 4가지 핵심 특징

- **자동 설정(Auto Configuration):** 의존성을 추가하면 관련 설정이 자동으로 적용
- **내장 서버:** 별도의 WAS(Tomcat 등) 설치 없이 바로 실행 가능
- **스타터 의존성:** `spring-boot-starter-*` 하나로 필요한 라이브러리를 묶어서 관리
- **Opinionated Defaults:** 합리적인 기본값을 제공하여 "관례"를 따르면 설정 불필요

> 하나씩 체험하면서 이해하게 된다!

---

## 프로젝트 구조

```
cnu26-backend/
├── build.gradle             ← 빌드 설정 (의존성, Java 버전)
├── settings.gradle          ← 프로젝트 이름
├── gradlew                  ← Gradle Wrapper (macOS/Linux)
├── gradlew.bat              ← Gradle Wrapper (Windows)
├── gradle/wrapper/          ← Gradle Wrapper 설정 파일
└── src/
    ├── main/java/.../
    │   └── BackendApplication.java  ← 메인 클래스
    ├── main/resources/
    │   └── application.properties   ← 설정 파일
    └── test/java/.../
        └── BackendApplicationTests.java
```

---

## 파일은 어디에 있나요?

Java 프로젝트는 폴더가 깊다! 당황하지 말자.

| 파일 | 위치 | 역할 |
|------|------|------|
| 메인 클래스 | `src/main/java/com/inspire12/backend/BackendApplication.java` | 앱 시작점 |
| 설정 파일 | `src/main/resources/application.properties` | 서버 포트 등 |
| 빌드 파일 | `build.gradle` (루트) | 의존성 관리 |
| 테스트 | `src/test/java/...` | 테스트 코드 |

> Windows: `\` (역슬래시), macOS: `/` (슬래시) — IntelliJ에서는 자동 처리

---

## IntelliJ에서 파일 찾기 팁

- **`Shift` 두 번** → "Search Everywhere" → 파일/클래스/설정 뭐든 검색
- **`Ctrl+Shift+N`** (macOS: `Cmd+Shift+O`) → 파일 이름으로 검색
- 좌측 **Project** 패널에서 폴더 탐색

> `BackendApplication`을 검색해서 찾아보자!

---

## @SpringBootApplication

```java
@SpringBootApplication
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
```

이 어노테이션 = **"이 클래스가 앱의 시작점이다"**

내부적으로 세 가지 기능이 있지만 지금은 시작점 표시로만 이해하면 충분하다:
- `@SpringBootConfiguration` - 설정 클래스 선언
- `@EnableAutoConfiguration` - 자동 설정 활성화
- `@ComponentScan` - 코드 자동 스캔

---

## @SpringBootApplication 핵심 포인트

- `SpringApplication.run()` 호출로 Spring 컨테이너를 초기화하고 앱을 시작한다
- `main` 메서드가 Java 프로그램의 진입점이며, Spring Boot도 결국 **일반 Java 프로그램**이다

```java
public static void main(String[] args) {
    SpringApplication.run(BackendApplication.class, args);
}
```

> 이 한 줄이 Spring Boot 애플리케이션 전체를 시작한다!

---

## build.gradle - plugins

```groovy
plugins {
    id 'java'                                          // Java 컴파일
    id 'org.springframework.boot' version '4.0.2'      // Spring Boot
    id 'io.spring.dependency-management' version '1.1.7' // 버전 관리
}
```

| 플러그인 | 역할 |
|---|---|
| `java` | Java 소스 컴파일, 테스트, JAR 패키징 |
| `org.springframework.boot` | `bootRun`, `bootJar` 태스크 제공 |
| `io.spring.dependency-management` | Spring BOM으로 라이브러리 버전 자동 맞춤 |

---

## build.gradle - toolchain (Java 버전)

```groovy
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)  // Java 21 사용
    }
}
```

### 중요: 설치된 Java 버전과 일치해야 한다!

```bash
java -version  # 여기서 나온 버전과 of(N)의 N이 같아야 함
```

| 설치된 Java | `build.gradle` 설정 | 결과 |
|---|---|---|
| Java 21 | `of(21)` | OK |
| Java 17 | `of(21)` | **에러!** `of(17)`로 변경 필요 |

> 숫자가 다르면 `No matching toolchains found` 에러 발생! **반드시 맞추자!**

---

## build.gradle - dependencies

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter'
    implementation 'org.springframework.boot:spring-boot-starter-web'  // 웹!
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}
```

| 의존성 | 역할 |
|---|---|
| `spring-boot-starter` | 핵심 스타터 (자동 설정, 로깅) |
| **`spring-boot-starter-web`** | **웹 서버 (톰캣 + MVC + JSON)** |
| `spring-boot-starter-test` | 테스트 (JUnit 5 + Mockito) |

---

## 전체 build.gradle

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '4.0.2'
    id 'io.spring.dependency-management' version '1.1.7'
}
group = 'com.inspire12'
version = '0.0.1-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}
repositories {
    mavenCentral()
}
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}
```

---

## spring-boot-starter-web이 가져오는 것

| 포함 라이브러리 | 역할 |
|---|---|
| Spring MVC | 웹 프레임워크 (컨트롤러, 요청 매핑) |
| Embedded Tomcat | 내장 웹 서버 (별도 설치 불필요) |
| Jackson | JSON 변환 |
| Bean Validation | 입력값 검증 |

```
spring-boot-starter-web
├── spring-boot-starter          ← 핵심 스타터
├── spring-webmvc                ← Spring MVC
├── tomcat-embed-core            ← 내장 톰캣
├── jackson-databind             ← JSON 처리
└── ...                          ← 기타 관련 라이브러리
```

> 스타터 하나 = 관련 라이브러리 **묶음**. 버전 호환성도 자동 관리

---

## 내장 톰캣(Embedded Tomcat)이란?

**전통적인 방식:**
1. Tomcat 서버를 별도로 설치
2. 프로젝트를 WAR 파일로 패키징
3. WAR를 Tomcat에 배포(deploy)

**Spring Boot 방식:**
1. 프로젝트 안에 Tomcat이 내장
2. JAR 파일 하나로 패키징
3. `./gradlew bootRun`으로 바로 실행!

> **핵심:** 서버를 설치하고 배포하는 과정이 사라진다!

---

## 내장 톰캣 vs 전통적 방식 비교

| 전통적 방식 | Spring Boot 방식 |
|---|---|
| Tomcat 별도 설치 | 프로젝트에 내장 |
| WAR 패키징 + 배포 | JAR 하나로 실행 |
| 서버 관리 필요 | `java -jar app.jar` |
| 설정 복잡 | 자동 설정 |

> 서버 설치와 배포 과정이 **사라진다**!

---

## Auto Configuration이 하는 일

> 참고용 — 지금 외울 필요 없다. "자동으로 이런 것들이 준비된다"는 것만 알면 됨

`spring-boot-starter-web` 추가 시 자동으로:

1. **DispatcherServlet** 등록
   - HTTP 요청이 들어오면 적절한 코드로 연결해주는 역할
2. **내장 톰캣** 시작
   - 기본 포트: 8080
3. **Jackson ObjectMapper** 등록
   - Java 객체를 JSON(데이터 형식)으로 자동 변환
4. **기본 에러 페이지** 설정
   - `/error` 경로의 Whitelabel Error Page

---

## Gradle Wrapper란?

```bash
./gradlew bootRun      # macOS / Linux
gradlew.bat bootRun    # Windows (cmd / PowerShell)
```

- Gradle을 **직접 설치하지 않아도** 빌드 가능
- 팀원 모두 **동일한 Gradle 버전**(9.3.0) 사용 보장
- `gradle/wrapper/gradle-wrapper.properties`에 버전 지정

> **Windows 사용자:** `./gradlew`는 안 된다! → `gradlew.bat` 사용
> (Git Bash에서는 `./gradlew` 가능)

---

## 실행해보기 - 브랜치 전환

> **브랜치(branch)**란 코드의 다른 버전이다.
> `web/start` 브랜치에 이번 실습 코드가 준비되어 있다.

```bash
git checkout web/start
```

---

## 실행해보기 - 터미널

```bash
# 실행
./gradlew bootRun      # macOS / Linux
gradlew.bat bootRun    # Windows
```

실행 후 콘솔에 다음이 출력되면 성공:

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
...
Tomcat initialized with port 8080 (http)
Started BackendApplication in X.XXX seconds
```

> 톰캣이 8080 포트에서 대기한다!

---

## 실행해보기 - IntelliJ

터미널 대신 IntelliJ에서 직접 실행할 수도 있다:

1. `BackendApplication.java` 파일 열기
2. `main` 메서드 왼쪽의 **▶ (초록색 재생 버튼)** 클릭
3. **Run 'BackendApplication'** 선택
4. 하단 **Run** 탭에서 로그 확인

또는 상단 툴바의 **▶ 버튼** 클릭

> `Shift` 두 번 → `BackendApplication` 검색하면 빠르게 찾을 수 있다

---

## 접속 확인 - 브라우저

서버가 실행 중인 상태에서:

주소창에 `http://localhost:8080` 입력

**Whitelabel Error Page**가 보이면 **성공!**
(아직 컨트롤러가 없으므로 에러 페이지가 정상)

---

## 접속 확인 - Postman & curl

**Postman에서:**
1. 새 탭 열기
2. **GET** `http://localhost:8080`
3. **Send** 클릭
4. 상태 코드 `404`와 에러 응답이 오면 성공

**curl에서 (터미널):**
```bash
# 다른 터미널을 열고 실행
# (Windows 10 이상에서 사용 가능. 없으면 브라우저나 Postman 사용)
curl http://localhost:8080
```

---

## 서버 종료하기

- **터미널:** `Ctrl+C`
- **IntelliJ:** Run 탭의 **빨간 정지 버튼(■)** 클릭

> 다음 실행 전에 **반드시 이전 서버를 종료**해야 한다!
> (안 그러면 "Port 8080 already in use" 에러 발생)

---

## 포트 변경해보기 (선택)

`src/main/resources/application.properties`에 다음을 추가:

```properties
server.port=9090
```

다시 실행하면 **9090** 포트에서 시작되는 것을 확인할 수 있다.

> Spring Boot는 `application.properties`로 다양한 설정을 변경할 수 있다.

---

## 의존성 확인해보기 (선택)

```bash
# macOS / Linux
./gradlew dependencies --configuration runtimeClasspath

# Windows
gradlew.bat dependencies --configuration runtimeClasspath
```

출력에서 `spring-webmvc`, `tomcat-embed-core`, `jackson-databind` 등이 포함된 것을 확인!

> 출력이 매우 길다 — `spring-webmvc`만 찾아보면 된다

---

## 트러블슈팅 - 포트 충돌

### "Port 8080 already in use" 에러

**방법 1:** 포트 변경
```properties
# application.properties
server.port=9090
```

**방법 2:** 기존 프로세스 종료
```bash
lsof -i :8080                        # macOS/Linux
netstat -ano | findstr :8080          # Windows
```

---

## 트러블슈팅 - 빌드 실패 & 한글 깨짐

### "No matching toolchains found" 에러
`build.gradle`의 `of(21)`과 설치된 Java 버전이 다를 때 발생
```bash
java -version    # 설치된 버전 확인 → build.gradle에서 숫자 맞추기
```

### Windows에서 한글 깨짐
IntelliJ 콘솔 출력이 깨지는 경우:
- `Help` → `Edit Custom VM Options` → `-Dfile.encoding=UTF-8` 추가
- 또는 `Run Configuration` → `VM options`에 `-Dfile.encoding=UTF-8`

---

## 핵심 정리

| 파일 | 역할 |
|---|---|
| `BackendApplication.java` | 진입점 (`@SpringBootApplication`) |
| `build.gradle` | 의존성 + 빌드 설정 |
| `settings.gradle` | 프로젝트 이름 (`rootProject.name = 'backend'`) |
| `application.properties` | 애플리케이션 설정 (서버 포트 등) |
| `gradlew` / `gradlew.bat` | Gradle Wrapper (macOS / Windows) |

---

## 키워드 정리

| 키워드 | 설명 |
|---|---|
| `spring-boot-starter-web` | 웹 개발에 필요한 모든 것을 포함하는 스타터 |
| Embedded Tomcat | 별도 설치 없이 JAR 안에 내장된 웹 서버 |
| Auto Configuration | 의존성 추가만으로 관련 설정이 자동 적용 |
| Gradle Wrapper | Gradle 설치 없이 빌드 가능, 팀 동일 버전 보장 |

> **한 줄 요약:** `spring-boot-starter-web` 한 줄로 내장 톰캣 + Spring MVC + Jackson이 자동 설정된다.

---

## 다음 단계

**Step 3: GET 요청/응답 다루기** (`web/get`)

- `@RestController`로 첫 번째 API 만들기
- 다양한 GET 요청 패턴 학습
- Postman으로 API 테스트
