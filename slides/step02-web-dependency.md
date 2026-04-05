---
marp: true
theme: default
paginate: true
---

# Step 2: Web 의존성 추가

**2026 RealCoding - Spring Boot Backend**

브랜치: `web/start`

---

## 학습 목표

- `spring-boot-starter-web`이 가져오는 것들을 이해한다
- 내장 톰캣(Embedded Tomcat)이 무엇인지 안다
- 한 줄 추가 전/후의 차이를 체감한다

---

## Before: main 브랜치

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter'
    // ... 웹 관련 없음
}
```

```
Started BackendApplication in 0.8 seconds
// 바로 종료됨!
```

> 웹 서버가 없으므로 시작 후 할 일이 없어 종료된다.

---

## After: web/start 브랜치

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter'
    implementation 'org.springframework.boot:spring-boot-starter-web'  // 추가!
    // ...
}
```

```
Tomcat initialized with port 8080 (http)
Started BackendApplication in 1.5 seconds
```

> 톰캣이 8080 포트에서 대기한다!

---

## 단 한 줄의 차이

```diff
 dependencies {
     implementation 'org.springframework.boot:spring-boot-starter'
+    implementation 'org.springframework.boot:spring-boot-starter-web'
     testImplementation 'org.springframework.boot:spring-boot-starter-test'
 }
```

이 한 줄이 가져오는 것:
- **Spring MVC** - 웹 프레임워크
- **Embedded Tomcat** - 내장 웹 서버
- **Jackson** - JSON 변환 라이브러리

---

## 내장 톰캣 vs 전통적 방식

| 전통적 방식 | Spring Boot 방식 |
|---|---|
| Tomcat 별도 설치 | 프로젝트에 내장 |
| WAR 패키징 + 배포 | JAR 하나로 실행 |
| 서버 관리 필요 | `java -jar app.jar` |
| 설정 복잡 | 자동 설정 |

---

## Auto Configuration이 하는 일

`spring-boot-starter-web` 추가 시 자동으로:

1. **DispatcherServlet** 등록
   - 모든 HTTP 요청의 진입점
2. **내장 톰캣** 시작
   - 기본 포트: 8080
3. **Jackson ObjectMapper** 등록
   - Java 객체를 JSON으로 자동 변환
4. **기본 에러 페이지** 설정
   - `/error` 경로의 Whitelabel Error Page

---

## 스타터 의존성이란?

```
spring-boot-starter-web
├── spring-boot-starter          ← 핵심 스타터
├── spring-webmvc                ← Spring MVC
├── tomcat-embed-core            ← 내장 톰캣
├── jackson-databind             ← JSON 처리
└── ...                          ← 기타 관련 라이브러리
```

> 하나의 스타터 = 관련 라이브러리 **묶음**
> 버전 호환성도 자동으로 관리된다.

---

## 확인해보기

```bash
# 브랜치 전환
git checkout web/start

# 실행
./gradlew bootRun

# 다른 터미널에서 테스트
curl http://localhost:8080
```

Whitelabel Error Page가 나오면 **성공**!
(컨트롤러가 아직 없으므로 에러 페이지가 정상)

---

## 포트 변경 (선택)

`application.properties`에 추가:

```properties
server.port=9090
```

다시 실행하면 9090 포트에서 시작된다.

> Spring Boot는 `application.properties`로 다양한 설정을 변경할 수 있다.

---

## 핵심 정리

| 키워드 | 설명 |
|---|---|
| `spring-boot-starter-web` | 웹 개발에 필요한 모든 것을 포함하는 스타터 |
| Embedded Tomcat | 별도 설치 없이 JAR 안에 내장된 웹 서버 |
| Auto Configuration | 의존성 추가만으로 관련 설정이 자동 적용 |

> **한 줄 요약:** `spring-boot-starter-web` 한 줄로 내장 톰캣 + Spring MVC + Jackson이 자동 설정된다.

---

## 다음 단계

**Step 3: GET 요청/응답 다루기** (`web/get`)

- `@RestController`로 첫 번째 API 만들기
- 다양한 GET 요청 패턴 학습
