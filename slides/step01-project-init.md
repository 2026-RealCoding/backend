---
marp: true
theme: default
paginate: true
---

# Step 1: 프로젝트 초기 설정

**2026 RealCoding - Spring Boot Backend**

브랜치: `main`

---

## 학습 목표

- Spring Boot 프로젝트의 기본 구조를 이해한다
- `@SpringBootApplication`의 역할을 파악한다
- `build.gradle`의 핵심 구성 요소를 읽을 수 있다
- `./gradlew bootRun`으로 애플리케이션을 실행할 수 있다

---

## 왜 Spring Boot인가?

| 기존 Spring | Spring Boot |
|---|---|
| XML/Java로 복잡한 설정 필요 | 자동 설정 (Auto Configuration) |
| 외부 WAS 별도 설치 필요 | 내장 서버 포함 |
| 의존성 버전 직접 관리 | 스타터로 일괄 관리 |
| 설정에 많은 시간 소요 | 관례를 따르면 설정 불필요 |

---

## 프로젝트 구조

```
cnu26-backend/
├── build.gradle             ← 빌드 설정
├── settings.gradle          ← 프로젝트 이름
├── gradlew                  ← Gradle Wrapper
└── src/
    ├── main/java/.../
    │   └── BackendApplication.java  ← 메인 클래스
    ├── main/resources/
    │   └── application.properties   ← 설정 파일
    └── test/java/.../
        └── BackendApplicationTests.java
```

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

이 어노테이션 하나 = **세 가지 기능**:
- `@SpringBootConfiguration` - 설정 클래스 선언
- `@EnableAutoConfiguration` - 자동 설정 활성화
- `@ComponentScan` - 컴포넌트 자동 스캔

---

## build.gradle - plugins

```groovy
plugins {
    id 'java'                                          // Java 컴파일
    id 'org.springframework.boot' version '4.0.2'      // Spring Boot
    id 'io.spring.dependency-management' version '1.1.7' // 버전 관리
}
```

- **java**: Java 소스 컴파일 + 테스트 지원
- **spring-boot**: `bootRun`, `bootJar` 태스크 제공
- **dependency-management**: Spring BOM으로 버전 자동 맞춤

---

## build.gradle - toolchain & dependencies

```groovy
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)  // Java 21 사용
    }
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}
```

> `spring-boot-starter`는 핵심 스타터. **아직 웹 기능은 없음!**

---

## Gradle Wrapper란?

```bash
./gradlew bootRun    # macOS/Linux
gradlew.bat bootRun  # Windows
```

- Gradle을 **직접 설치하지 않아도** 빌드 가능
- 팀원 모두 **동일한 Gradle 버전** 사용 보장
- `gradle/wrapper/gradle-wrapper.properties`에 버전 지정

---

## 실행해보기

```bash
# 프로젝트 빌드
./gradlew build

# 애플리케이션 실행
./gradlew bootRun
```

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
...
Started BackendApplication in X.XXX seconds
```

> 아직 웹 의존성이 없으므로 시작 후 바로 종료된다!

---

## settings.gradle

```groovy
rootProject.name = 'backend'
```

- 프로젝트 이름을 지정하는 파일
- 멀티 모듈 프로젝트에서는 하위 모듈도 여기에 선언

---

## 핵심 정리

| 파일 | 역할 |
|---|---|
| `BackendApplication.java` | 진입점 (`@SpringBootApplication`) |
| `build.gradle` | 의존성 + 빌드 설정 |
| `settings.gradle` | 프로젝트 이름 |
| `application.properties` | 애플리케이션 설정 |
| `gradlew` | Gradle Wrapper 스크립트 |

> **한 줄 요약:** Spring Boot는 `@SpringBootApplication` 하나로 자동 설정, 컴포넌트 스캔, 설정 클래스 선언을 모두 처리한다.

---

## 다음 단계

**Step 2: Web 의존성 추가** (`web/start`)

- `spring-boot-starter-web` 추가
- 내장 톰캣으로 HTTP 서버 실행
- 브라우저에서 접속 가능한 서버 만들기
