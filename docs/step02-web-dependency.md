# Step 2: 프로젝트 시작하기

> **브랜치:** `web/start`

---

## 학습 목표

- Spring Boot 프로젝트의 기본 구조를 이해한다.
- `@SpringBootApplication` 어노테이션의 역할을 파악한다.
- `build.gradle`의 핵심 구성 요소(plugins, dependencies, toolchain)를 읽을 수 있다.
- `spring-boot-starter-web`의 역할을 이해한다.
- `./gradlew bootRun` 명령으로 웹 서버를 실행하고 브라우저에서 접속할 수 있다.

---

## 핵심 개념 설명

### 왜 Spring Boot인가?

Spring Framework는 강력하지만 설정이 복잡하다. Spring Boot는 이 문제를 해결하기 위해 등장했다.

> 아래 표의 용어를 아직 모르는 것이 정상이다. "옛날에는 복잡했는데, Spring Boot 덕에 간단해졌다"는 느낌만 받으면 된다.

| 기존 Spring | Spring Boot |
|---|---|
| XML/Java로 복잡한 설정 필요 | 자동 설정 (Auto Configuration) |
| 외부 WAS(웹 서버 프로그램) 별도 설치 필요 | 내장 서버 포함 |
| 의존성(라이브러리) 버전 직접 관리 | 스타터로 일괄 관리 |
| 설정에 많은 시간 소요 | 관례를 따르면 설정 불필요 |

- **자동 설정(Auto Configuration):** 의존성을 추가하면 관련 설정이 자동으로 적용된다.
- **내장 서버:** 별도의 WAS(Tomcat 등) 설치 없이 바로 실행 가능하다.
- **스타터 의존성:** `spring-boot-starter-*` 하나로 필요한 라이브러리를 묶어서 관리한다.
- **Opinionated Defaults:** 합리적인 기본값을 제공하여 "관례"를 따르면 설정 없이 동작한다.

### 프로젝트 구조

```
cnu26-backend/
├── build.gradle              ← 빌드 설정 (의존성, 플러그인, Java 버전)
├── settings.gradle           ← 프로젝트 이름 설정
├── gradlew                   ← Gradle Wrapper (macOS/Linux)
├── gradlew.bat               ← Gradle Wrapper (Windows)
├── gradle/wrapper/           ← Gradle Wrapper 설정 파일
└── src/
    ├── main/
    │   ├── java/com/inspire12/backend/
    │   │   └── BackendApplication.java   ← 메인 클래스 (진입점)
    │   └── resources/
    │       └── application.properties    ← 애플리케이션 설정
    └── test/
        └── java/com/inspire12/backend/
            └── BackendApplicationTests.java  ← 테스트 클래스
```

### 파일은 어디에 있나요?

처음 Java 프로젝트를 열면 폴더가 깊어서 파일을 찾기 어려울 수 있다.

| 파일/폴더 | macOS/Linux 경로 | Windows 경로 | 역할 |
|---|---|---|---|
| 메인 클래스 | `src/main/java/com/inspire12/backend/BackendApplication.java` | `src\main\java\com\inspire12\backend\BackendApplication.java` | 앱 시작점 |
| 설정 파일 | `src/main/resources/application.properties` | `src\main\resources\application.properties` | 서버 포트, DB 설정 등 |
| 빌드 파일 | `build.gradle` (프로젝트 루트) | `build.gradle` (프로젝트 루트) | 의존성, 빌드 설정 |
| 테스트 | `src/test/java/...` | `src\test\java\...` | 테스트 코드 |

> **IntelliJ 팁:** 좌측 Project 패널에서 `BackendApplication`을 검색하면 빠르게 찾을 수 있다. `Ctrl+Shift+N` (macOS: `Cmd+Shift+O`)으로 파일 검색도 가능하다.

### @SpringBootApplication의 의미

이 어노테이션은 Spring Boot에게 **"이 클래스가 앱의 시작점이다"**라고 알려주는 표시다. 내부적으로 세 가지 기능이 포함되어 있다:

| 어노테이션 | 역할 |
|---|---|
| `@SpringBootConfiguration` | Spring Boot 설정 클래스임을 선언 |
| `@EnableAutoConfiguration` | 추가된 라이브러리를 기반으로 자동 설정 |
| `@ComponentScan` | 현재 패키지 하위의 코드를 자동으로 찾아 등록 |

> 지금은 "시작점 표시"로만 이해하면 충분하다. 각 기능의 의미는 이후 단계에서 하나씩 체감하게 된다.

### build.gradle 이해하기

#### plugins 블록

```groovy
plugins {
    id 'java'                                          // Java 컴파일 + 테스트
    id 'org.springframework.boot' version '4.0.2'      // Spring Boot 지원
    id 'io.spring.dependency-management' version '1.1.7' // 의존성 버전 자동 관리
}
```

| 플러그인 | 역할 |
|---|---|
| `java` | Java 소스 컴파일, 테스트, JAR 패키징 |
| `org.springframework.boot` | `bootRun`, `bootJar` 태스크 제공 |
| `io.spring.dependency-management` | Spring BOM으로 라이브러리 버전 자동 맞춤 |

#### toolchain 블록 (Java 버전 지정)

```groovy
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)  // Java 21 사용
    }
}
```

> **중요:** 이 숫자는 **실제로 설치된 Java 버전과 일치**해야 한다!
> - `java -version`으로 확인한 버전이 21이면 → `of(21)` (OK)
> - 만약 Java 17을 설치했다면 → `of(17)`로 변경해야 빌드가 된다
> - 버전이 다르면 Gradle 빌드 시 `No matching toolchains found` 에러가 발생한다

#### dependencies 블록

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter'       // Spring Boot 핵심
    implementation 'org.springframework.boot:spring-boot-starter-web'   // 웹 기능 (Tomcat + MVC)
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}
```

| 의존성 | 역할 |
|---|---|
| `spring-boot-starter` | Spring Boot 핵심 스타터 (자동 설정, 로깅 등) |
| `spring-boot-starter-web` | **웹 서버 기능** (내장 톰캣 + Spring MVC + Jackson) |
| `spring-boot-starter-test` | 테스트 라이브러리 (JUnit 5 + Mockito) |

### spring-boot-starter-web이 가져오는 것들

`spring-boot-starter-web` 한 줄을 추가하면 다음이 모두 포함된다:

| 포함 라이브러리 | 역할 |
|---|---|
| Spring MVC | 웹 MVC 프레임워크 (컨트롤러, 요청 매핑 등) |
| Embedded Tomcat | 내장 웹 서버 (별도 설치 불필요) |
| Jackson | JSON 직렬화/역직렬화 |
| Bean Validation | 입력값 검증 |

```
spring-boot-starter-web
├── spring-boot-starter          ← 핵심 스타터
├── spring-webmvc                ← Spring MVC
├── tomcat-embed-core            ← 내장 톰캣
├── jackson-databind             ← JSON 처리
└── ...                          ← 기타 관련 라이브러리
```

> 하나의 스타터 = 관련 라이브러리 **묶음**. 버전 호환성도 자동으로 관리된다.

### Gradle Wrapper란?

```bash
./gradlew bootRun    # macOS/Linux
gradlew.bat bootRun  # Windows (cmd / PowerShell)
```

- Gradle을 **직접 설치하지 않아도** 빌드 가능하다.
- 팀원 모두 **동일한 Gradle 버전**(9.3.0)을 사용하도록 보장한다.
- `gradle/wrapper/gradle-wrapper.properties`에 Gradle 버전이 지정되어 있다.

> **Windows 사용자:** `./gradlew`는 macOS/Linux 전용이다. Windows cmd에서는 반드시 `gradlew.bat`을 사용한다. Git Bash를 사용하면 `./gradlew`도 동작한다.

### 내장 톰캣(Embedded Tomcat)이란?

**전통적인 방식:**
1. Tomcat 서버를 별도로 설치한다.
2. 프로젝트를 WAR 파일로 패키징한다.
3. WAR를 Tomcat에 배포(deploy)한다.

**Spring Boot 방식:**
1. 프로젝트 안에 Tomcat이 내장되어 있다.
2. JAR 파일 하나로 패키징한다.
3. `java -jar app.jar` 또는 `./gradlew bootRun`으로 바로 실행한다.

| 전통적 방식 | Spring Boot 방식 |
|---|---|
| Tomcat 별도 설치 | 프로젝트에 내장 |
| WAR 패키징 + 배포 | JAR 하나로 실행 |
| 서버 관리 필요 | `java -jar app.jar` |
| 설정 복잡 | 자동 설정 |

> **핵심:** 서버를 설치하고 배포하는 과정이 사라진다. 개발과 배포가 훨씬 간단해진다.

### Auto Configuration이 하는 일

> 아래 용어를 지금 다 외울 필요 없다. "의존성 한 줄 추가하면 이런 것들이 자동으로 준비된다"는 것만 알면 된다.

`spring-boot-starter-web`을 추가하면 Spring Boot의 자동 설정이:

1. **DispatcherServlet**을 등록한다 (HTTP 요청이 들어오면 적절한 코드로 연결해주는 역할).
2. **내장 톰캣**을 기본 포트 8080으로 시작한다.
3. **Jackson ObjectMapper**를 등록한다 (Java 객체를 JSON으로 변환해주는 도구).
4. **기본 에러 페이지**를 설정한다 (`/error` 경로의 Whitelabel Error Page).

---

## 주요 코드

### BackendApplication.java

```java
package com.inspire12.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
```

**핵심 포인트:**
- `SpringApplication.run()` 호출로 Spring 컨테이너를 초기화하고 애플리케이션을 시작한다.
- `main` 메서드가 Java 프로그램의 진입점이며, Spring Boot도 결국 일반 Java 프로그램이다.

### build.gradle

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '4.0.2'
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'com.inspire12'
version = '0.0.1-SNAPSHOT'
description = 'backend'

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

tasks.named('test') {
    useJUnitPlatform()
}
```

**핵심 포인트:**
- `spring-boot-starter`: Spring Boot의 핵심 스타터.
- `spring-boot-starter-web`: 이 한 줄로 내장 톰캣 + Spring MVC + Jackson이 자동 설정된다.
- `JavaLanguageVersion.of(21)`: Java 21을 사용하도록 지정. **설치된 Java 버전과 일치해야 한다.**

### settings.gradle

```groovy
rootProject.name = 'backend'
```

---

## 실습 가이드

### 1. 브랜치 전환

브랜치(branch)는 코드의 다른 버전이다. `web/start` 브랜치에 이번 실습 코드가 준비되어 있다.

```bash
git checkout web/start
```

### 2. 터미널에서 실행하기

```bash
# macOS / Linux
./gradlew bootRun

# Windows (cmd / PowerShell)
gradlew.bat bootRun
```

실행 후 콘솔에 다음과 같은 로그가 출력되면 성공:

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
...
Tomcat initialized with port 8080 (http)
Started BackendApplication in X.XXX seconds
```

> 톰캣이 8080 포트에서 대기하고 있다!

### 3. IntelliJ에서 실행하기

터미널 대신 IntelliJ에서 직접 실행할 수도 있다:

1. `src/main/java/com/inspire12/backend/BackendApplication.java` 파일 열기
2. `main` 메서드 왼쪽의 **▶ (초록색 재생 버튼)** 클릭
3. **Run 'BackendApplication'** 선택
4. 하단 **Run** 탭에서 로그 확인

또는 상단 툴바의 **▶ 버튼**을 클릭해도 된다.

> **IntelliJ 팁:** `Shift`를 두 번 빠르게 누르면 "Search Everywhere" 창이 열린다. 여기서 `BackendApplication`을 검색하면 바로 찾을 수 있다.

### 4. 접속 확인

서버가 실행 중인 상태에서:

**브라우저에서:**
- 주소창에 `http://localhost:8080` 입력
- **Whitelabel Error Page**가 보이면 **성공!** (아직 컨트롤러가 없으므로 에러 페이지가 정상)

**Postman에서:**
1. 새 탭 열기
2. **GET** `http://localhost:8080`
3. **Send** 클릭
4. 상태 코드 `404`와 에러 응답이 오면 성공

**curl에서 (터미널):**
```bash
# 다른 터미널을 열고 실행 (Windows 10 이상에서 사용 가능. 없으면 브라우저나 Postman 사용)
curl http://localhost:8080
```

### 5. 의존성 확인하기

```bash
# macOS / Linux
./gradlew dependencies --configuration runtimeClasspath

# Windows
gradlew.bat dependencies --configuration runtimeClasspath
```

출력에서 `spring-webmvc`, `tomcat-embed-core`, `jackson-databind` 등이 포함된 것을 확인할 수 있다.

### 6. 포트 변경해보기 (선택)

`src/main/resources/application.properties`에 다음을 추가:

```properties
server.port=9090
```

다시 실행하면 9090 포트에서 시작되는 것을 확인할 수 있다.

> Spring Boot는 `application.properties`로 다양한 설정을 변경할 수 있다.

### 서버 종료하기

- **터미널:** `Ctrl+C`
- **IntelliJ:** Run 탭의 **빨간 정지 버튼(■)** 클릭

---

## 트러블슈팅

### 포트 충돌 — "Port 8080 already in use"

이미 8080 포트를 사용하는 프로세스가 있는 경우:

**방법 1:** `application.properties`에서 포트 변경
```properties
server.port=9090
```

**방법 2:** 기존 프로세스 종료
```bash
# macOS/Linux — 8080 포트를 사용하는 프로세스 찾기
lsof -i :8080

# Windows
netstat -ano | findstr :8080
```

### Gradle 빌드 실패 — "No matching toolchains found"

`build.gradle`의 `JavaLanguageVersion.of(21)`과 설치된 Java 버전이 다를 때 발생한다.

```bash
# 설치된 Java 버전 확인
java -version

# 만약 17이면 build.gradle에서 21 → 17로 변경
```

### Windows에서 한글 깨짐

IntelliJ에서 콘솔 출력이 깨지는 경우:
- IntelliJ 상단 메뉴에서 `Help` → `Edit Custom VM Options` 클릭 → 파일 끝에 `-Dfile.encoding=UTF-8` 추가
- 또는 `Run Configuration` → `VM options`에 `-Dfile.encoding=UTF-8` 추가

---

## 핵심 정리

| 파일 | 역할 |
|---|---|
| `BackendApplication.java` | 진입점 (`@SpringBootApplication`) |
| `build.gradle` | 의존성 + 빌드 설정 |
| `settings.gradle` | 프로젝트 이름 |
| `application.properties` | 애플리케이션 설정 (포트, 프로필 등) |
| `gradlew` / `gradlew.bat` | Gradle Wrapper (macOS / Windows) |

| 키워드 | 설명 |
|---|---|
| `spring-boot-starter-web` | 웹 개발에 필요한 모든 것을 포함하는 스타터 |
| Embedded Tomcat | 별도 설치 없이 JAR 안에 내장된 웹 서버 |
| Auto Configuration | 의존성 추가만으로 관련 설정이 자동 적용 |
| Gradle Wrapper | Gradle 설치 없이 빌드 가능, 팀 동일 버전 보장 |

> **한 줄 요약:** `spring-boot-starter-web` 한 줄 추가로 내장 톰캣 + Spring MVC + Jackson이 자동 설정되며, `./gradlew bootRun` (Windows: `gradlew.bat bootRun`)으로 바로 실행할 수 있다.
