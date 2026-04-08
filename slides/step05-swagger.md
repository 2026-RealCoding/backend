---
marp: true
theme: default
paginate: true
---

# Step 5: Swagger로 API 문서 자동화

**2026 RealCoding - Spring Boot Backend**

브랜치: `web/swagger` | 실습: `web/swagger-practice`

---

## 학습 목표

- API 문서화가 왜 중요한지 이해한다
- `springdoc-openapi`를 추가하고 Swagger UI를 사용한다
- `@Tag`, `@Operation`, `@Parameter`, `@ApiResponse`를 활용한다

---

## API 문서화가 필요한 이유

프론트엔드 개발자가 우리 API를 쓰려면 알아야 할 것:

- 어떤 **URL**로 요청?
- 어떤 **HTTP 메서드**?
- 어떤 **파라미터**?
- 어떤 **응답** 형식?
- **에러** 코드는?

> 코드를 직접 읽거나 구두 전달 = **비효율**
> Swagger = 코드에서 **자동으로** 문서 생성!

---

## OpenAPI vs Swagger

| 용어 | 설명 |
|---|---|
| **OpenAPI** | REST API의 구조를 설명하는 국제 표준 형식 |
| **Swagger UI** | 명세를 웹에서 보여주는 도구 |
| **springdoc-openapi** | Spring Boot용 OpenAPI 자동 생성 라이브러리 |

---

## 의존성 추가 (build.gradle)

```diff
 dependencies {
     implementation 'org.springframework.boot:spring-boot-starter'
     implementation 'org.springframework.boot:spring-boot-starter-web'
+    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:3.0.1'
     testImplementation 'org.springframework.boot:spring-boot-starter-test'
 }
```

> 이 **한 줄**만 추가하면 Swagger UI가 자동으로 활성화!

접속: `http://localhost:8080/swagger-ui/index.html`

---

## @Tag - 컨트롤러 그룹

```java
@Tag(name = "User", description = "유저 API")
@RestController
@RequestMapping("/users")
public class UserController {
    // ...
}
```

- Swagger UI에서 **API를 그룹별로 분류**
- 같은 Tag의 API가 한 묶음으로 표시됨

---

## @Operation - API 설명

```java
@Operation(summary = "유저 목록 조회",
           description = "전체 유저 목록을 반환합니다")
@GetMapping
public List<User> getUsers() {
    return users;
}
```

- `summary`: Swagger UI 목록에 표시되는 **한 줄 요약**
- `description`: 펼쳤을 때 보이는 **상세 설명**

---

## @Parameter - 파라미터 설명

```java
@Operation(summary = "유저 단건 조회")
@GetMapping("/{id}")
public User getUser(
        @Parameter(description = "유저 ID") @PathVariable Long id) {
    // ...
}

@Operation(summary = "현재 유저 조회")
@GetMapping("/me")
public ResponseEntity<User> getCurrentUser(
        @Parameter(description = "Bearer JWT 토큰", example = "Bearer eyJ...")
        @RequestHeader("Authorization") String authorization) {
    // ...
}
```

- `description`: 파라미터가 무엇인지 설명
- `example`: 예시값 제공

---

## @ApiResponse / @ApiResponses

> 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다. `@ApiResponses({ ... })` 안의 중괄호 `{}`는 Java 배열 문법으로, 여러 개의 `@ApiResponse`를 묶는 것이다.

```java
@Operation(summary = "유저 삭제")
@ApiResponses({
    @ApiResponse(responseCode = "204", description = "삭제 성공"),
    @ApiResponse(responseCode = "404", description = "유저를 찾을 수 없음")
})
@DeleteMapping("/{id}")
public ResponseEntity<Void> deleteUser(
        @Parameter(description = "유저 ID") @PathVariable Long id) {
    // ...
}
```

- 각 **응답 코드별 의미**를 명시
- API 사용자가 에러 처리를 할 수 있도록 안내

---

## Before vs After 비교

**Before (web/post):**
```java
@GetMapping("/{id}")
public User getUser(@PathVariable Long id) { ... }
```
Swagger UI: 기본적인 정보만 표시, 의미 파악 어려움

**After (web/swagger):**
```java
@Operation(summary = "유저 단건 조회", description = "ID로 유저를 조회합니다")
@GetMapping("/{id}")
public User getUser(
        @Parameter(description = "유저 ID") @PathVariable Long id) { ... }
```
Swagger UI: 명확한 설명 + 파라미터 안내

---

## Swagger UI 활용

브라우저에서 `http://localhost:8080/swagger-ui/index.html` 접속

1. **API 목록** - Tag별로 그룹화
2. **상세 정보** - 파라미터, 요청/응답 형식
3. **"Try it out"** - 직접 API 호출 테스트!
4. **응답 코드** - 성공/실패 경우 확인

OpenAPI JSON 명세: `http://localhost:8080/v3/api-docs`

---

## 주요 어노테이션 정리

| 어노테이션 | 위치 | 역할 |
|---|---|---|
| `@Tag` | 클래스 | 컨트롤러 그룹 분류 |
| `@Operation` | 메서드 | API 요약 + 설명 |
| `@Parameter` | 파라미터 | 파라미터 설명, 예시값 |
| `@ApiResponse` | 메서드 | 응답 코드별 설명 |
| `@ApiResponses` | 메서드 | 여러 ApiResponse 묶음 |

---

## 실습: web/swagger-practice

```bash
git checkout web/swagger-practice
```

```bash
./gradlew bootRun
# Windows: gradlew.bat bootRun
```

TODO를 채워 Swagger 문서화를 완성하세요!

**확인 포인트:**
- [ ] Swagger UI에서 "User" 태그가 보이는가?
- [ ] 각 API에 summary가 있는가?
- [ ] 파라미터 설명이 표시되는가?
- [ ] "Try it out"으로 API 호출이 성공하는가?

---

## 핵심 정리

> **`springdoc-openapi` 의존성 + `@Tag`/`@Operation`/`@Parameter`/`@ApiResponse` 어노테이션으로 코드에서 자동으로 API 문서가 생성되고, Swagger UI에서 확인 및 테스트할 수 있다.**

API 문서화는 **팀 협업의 기본**이다!
