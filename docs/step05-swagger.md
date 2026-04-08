# Step 5: Swagger로 API 문서 자동화

> **브랜치:** `web/swagger`
> **실습 브랜치:** `web/swagger-practice`

---

## 학습 목표

- API 문서화가 왜 중요한지 이해한다.
- `springdoc-openapi`를 프로젝트에 추가하고 Swagger UI를 사용할 수 있다.
- `@Tag`, `@Operation`, `@Parameter`, `@ApiResponse` 어노테이션을 적절히 활용할 수 있다.
- Swagger UI에서 API를 직접 테스트할 수 있다.
- Step 4(문서화 없음)에서 Step 5(Swagger 문서화)로의 변화를 이해한다.

---

## 핵심 개념 설명

### API 문서화가 필요한 이유

프론트엔드 개발자, 다른 팀, 외부 파트너가 우리 API를 사용하려면 다음을 알아야 한다:

- 어떤 **URL**로 요청해야 하는지
- 어떤 **HTTP 메서드**를 사용하는지
- 어떤 **파라미터**를 보내야 하는지
- 어떤 **응답**이 오는지
- **에러**가 발생하면 어떤 코드가 오는지

이 정보를 코드를 읽거나 구두로 전달하는 것은 비효율적이다. **Swagger(OpenAPI)**는 코드에서 자동으로 API 문서를 생성해준다.

### OpenAPI vs Swagger

| 용어 | 설명 |
|---|---|
| **OpenAPI** | REST API의 구조를 설명하는 국제 표준 형식 (어떤 URL이 있고, 어떤 파라미터를 받고, 어떤 응답을 주는지를 정해진 형식으로 기술) |
| **Swagger** | OpenAPI 명세를 기반으로 한 도구 모음 (UI, 코드 생성 등) |
| **Swagger UI** | OpenAPI 명세를 웹 브라우저에서 시각적으로 보여주는 도구 |
| **springdoc-openapi** | Spring Boot 프로젝트에서 OpenAPI 명세를 자동 생성하는 라이브러리 |

### 주요 어노테이션

| 어노테이션 | 위치 | 역할 |
|---|---|---|
| `@Tag` | 클래스 | 컨트롤러를 그룹으로 묶어 분류 |
| `@Operation` | 메서드 | API의 요약(summary)과 설명(description) |
| `@Parameter` | 파라미터 | 파라미터의 설명, 예시값 |
| `@ApiResponse` | 메서드 | 응답 코드별 설명 |
| `@ApiResponses` | 메서드 | 여러 `@ApiResponse`를 묶음 |

---

## 주요 코드

### 의존성 추가 (build.gradle)

```diff
 dependencies {
     implementation 'org.springframework.boot:spring-boot-starter'
     implementation 'org.springframework.boot:spring-boot-starter-web'
+    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:3.0.1'
     testImplementation 'org.springframework.boot:spring-boot-starter-test'
 }
```

> 이 한 줄만 추가하면 Swagger UI가 자동으로 활성화된다!

### Before (web/post) - 어노테이션 없음

```java
@RestController
@RequestMapping("/users")
public class UserController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello, User!";
    }

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        // ...
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User request) {
        // ...
    }
}
```

Swagger UI에는 기본적인 정보만 표시되고, API의 의미를 파악하기 어렵다.

### After (web/swagger) - 어노테이션 추가

```java
@Tag(name = "User", description = "유저 API")
@RestController
@RequestMapping("/users")
public class UserController {

    @Operation(summary = "인사 메시지", description = "단순 문자열 응답을 반환합니다")
    @GetMapping("/hello")
    public String hello() {
        return "Hello, User!";
    }

    @Operation(summary = "유저 단건 조회", description = "ID로 유저를 조회합니다")
    @GetMapping("/{id}")
    public User getUser(
            @Parameter(description = "유저 ID") @PathVariable Long id) {
        // ...
    }

    @Operation(summary = "유저 생성", description = "새로운 유저를 생성합니다")
    @ApiResponse(responseCode = "201", description = "생성 성공")
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User request) {
        // ...
    }

    @Operation(summary = "유저 수정", description = "기존 유저 정보를 수정합니다")
    // 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다.
    // @ApiResponses({ ... }) 안의 중괄호는 Java 배열 문법으로, 여러 개의 @ApiResponse를 묶는 것이다.
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "404", description = "유저를 찾을 수 없음")
    })
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(
            @Parameter(description = "유저 ID") @PathVariable Long id,
            @RequestBody User request) {
        // ...
    }

    @Operation(summary = "유저 삭제", description = "유저를 삭제합니다")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "삭제 성공"),
            @ApiResponse(responseCode = "404", description = "유저를 찾을 수 없음")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @Parameter(description = "유저 ID") @PathVariable Long id) {
        // ...
    }
}
```

### UserPageController에도 적용

```java
@Tag(name = "User Page", description = "유저 HTML 페이지 API")
@RestController
@RequestMapping("/pages")
public class UserPageController {

    @Operation(summary = "유저 목록 HTML", description = "유저 목록을 HTML 로 반환합니다")
    @GetMapping(value = "/users", produces = MediaType.TEXT_HTML_VALUE)
    public String usersPage() { ... }

    @Operation(summary = "유저 목록 JSON", description = "유저 목록을 JSON 으로 반환합니다")
    @GetMapping(value = "/users", produces = MediaType.APPLICATION_JSON_VALUE)
    public String usersJson() { ... }
}
```

---

## Swagger UI 접속

애플리케이션 실행 후 브라우저에서:

```
http://localhost:8080/swagger-ui/index.html
```

Swagger UI에서 할 수 있는 것:
1. **모든 API 목록** 확인 (Tag로 그룹화)
2. 각 API의 **파라미터, 요청/응답 형식** 확인
3. **"Try it out"** 버튼으로 직접 API 호출 테스트
4. **응답 코드별 설명** 확인

### OpenAPI JSON 명세

```
http://localhost:8080/v3/api-docs
```

이 URL에서 OpenAPI 3.0 형식의 JSON 명세를 직접 확인할 수 있다. 이 명세를 다른 도구(Postman 등)에서 임포트할 수도 있다.

---

## 실습 가이드

### 브랜치 전환

```bash
# 완성 코드 확인
git checkout web/swagger

# 실습 (TODO 빈칸 채우기)
git checkout web/swagger-practice
```

### practice 브랜치 사용법

`web/swagger-practice` 브랜치에는 Swagger 어노테이션이 TODO로 비어 있다.

예시:
```java
// TODO: @Tag 어노테이션 추가 (name = "User", description = "유저 API")
@RestController
@RequestMapping("/users")
public class UserController {

    // TODO: @Operation 어노테이션 추가 (summary, description)
    @GetMapping("/hello")
    public String hello() {
        return "Hello, User!";
    }

    // TODO: @Operation + @Parameter 어노테이션 추가
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) { ... }

    // TODO: @Operation + @ApiResponse 어노테이션 추가
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User request) { ... }
}
```

### 확인 방법

1. 서버를 실행한다:
   ```bash
   ./gradlew bootRun
   # Windows: gradlew.bat bootRun
   ```
2. `http://localhost:8080/swagger-ui/index.html` 접속한다.
3. 각 API에 summary, description, parameter 설명이 표시되는지 확인한다.
4. "Try it out"으로 실제 API를 호출해본다.

### 확인 포인트

- [ ] Swagger UI에서 "User" 태그로 API가 그룹화되어 있는가?
- [ ] 각 API의 summary가 표시되는가?
- [ ] 파라미터에 description이 있는가?
- [ ] POST 201, DELETE 204 등 응답 코드 설명이 있는가?
- [ ] "Try it out"으로 API 호출이 성공하는가?

---

## 핵심 정리

> **`springdoc-openapi` 의존성 하나와 `@Tag`/`@Operation`/`@Parameter`/`@ApiResponse` 어노테이션으로, 코드에서 자동으로 API 문서가 생성되고 Swagger UI에서 시각적으로 확인 및 테스트할 수 있다.**
