# Step 3: GET 요청/응답 다루기

> **브랜치:** `web/get`
> **실습 브랜치:** `web/get-practice`

---

## 학습 목표

- `@RestController`와 `@RequestMapping`의 역할을 이해한다.
- 다양한 GET 요청 패턴(`@PathVariable`, `@RequestParam`, `@RequestHeader`)을 사용할 수 있다.
- `ResponseEntity`를 이용해 HTTP 상태코드를 직접 제어할 수 있다.
- Java의 `record`를 DTO로 활용하는 방법을 안다.
- `produces` 속성으로 응답 타입(HTML/JSON)을 구분할 수 있다.

---

## 핵심 개념 설명

### @RestController vs @Controller

| 어노테이션 | 반환 | 용도 |
|---|---|---|
| `@Controller` | View 이름 (HTML 템플릿) | 서버 사이드 렌더링 |
| `@RestController` | 데이터 그 자체 (JSON) | REST API |

`@RestController` = `@Controller` + `@ResponseBody`

즉, 메서드의 반환값이 **뷰 이름이 아니라 HTTP 응답 본문(Body)**으로 직접 전달된다. Jackson이 자동으로 Java 객체를 JSON으로 변환한다.

### @RequestMapping

클래스 레벨에 `@RequestMapping("/users")`를 붙이면, 이 컨트롤러의 **모든 엔드포인트에 `/users` 접두사**가 붙는다.

```java
@RestController
@RequestMapping("/users")     // 공통 경로
public class UserController {
    @GetMapping("/hello")     // 실제 경로: GET /users/hello
    public String hello() { ... }
}
```

### Java Record를 DTO로 사용하기

Java 16에서 도입된 `record`는 **불변 데이터 객체**를 간결하게 정의할 수 있다:

```java
// record 한 줄이면 끝
public record User(Long id, String name, String email) {}

// 위 코드는 아래와 동일하다:
// - private final 필드 3개
// - 생성자
// - getter (id(), name(), email())
// - equals(), hashCode(), toString()
```

### GET 요청에서 데이터를 받는 방법

| 방법 | 어노테이션 | 예시 URL | 용도 |
|---|---|---|---|
| 경로 변수 | `@PathVariable` | `/users/1` | 리소스 식별 |
| 쿼리 파라미터 | `@RequestParam` | `/users/search?name=홍` | 필터링, 검색 |
| 헤더 | `@RequestHeader` | `Authorization: Bearer ...` | 인증 토큰 |

---

## 주요 코드

### User DTO (record)

```java
package com.inspire12.backend.dto;

public record User(Long id, String name, String email) {
}
```

### UserController - 전체 코드

```java
@RestController
@RequestMapping("/users")
public class UserController {

    // 1. 가장 단순한 GET 요청 - 문자열 응답
    @GetMapping("/hello")
    public String hello() {
        return "Hello, User!";
    }

    // 2. 유저 목록 조회 - JSON 배열 응답
    @GetMapping
    public List<User> getUsers() {
        return List.of(
                new User(1L, "홍길동", "hong@example.com"),
                new User(2L, "김철수", "kim@example.com"),
                new User(3L, "이영희", "lee@example.com")
        );
    }

    // 3. PathVariable - 경로에서 값 추출
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return new User(id, "홍길동", "hong@example.com");
    }

    // 4. RequestParam - 쿼리 파라미터
    @GetMapping("/search")
    public List<User> searchUsers(@RequestParam String name) {
        return List.of(
                new User(1L, name, "hong@example.com")
        );
    }

    // 5. RequestParam 기본값 + 페이징
    @GetMapping("/page")
    public Map<String, Object> getUsersWithPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Map.of(
                "page", page,
                "size", size,
                "totalElements", 100,
                "content", List.of(
                        new User(1L, "홍길동", "hong@example.com"),
                        new User(2L, "김철수", "kim@example.com")
                )
        );
    }

    // 6. RequestHeader - 요청 헤더 읽기
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(
            @RequestHeader("Authorization") String authorization) {
        String token = authorization.replace("Bearer ", "");
        return ResponseEntity.ok(
                new User(1L, "홍길동 (token: " + token + ")", "hong@example.com")
        );
    }

    // 7. ResponseEntity - HTTP 상태코드 직접 제어
    @GetMapping("/{id}/detail")
    public ResponseEntity<User> getUserDetail(@PathVariable Long id) {
        if (id <= 0) {
            return ResponseEntity.badRequest().build();    // 400 Bad Request
        }
        return ResponseEntity.ok(                          // 200 OK
                new User(id, "홍길동", "hong@example.com")
        );
    }
}
```

### UserPageController - HTML vs JSON

같은 경로(`/pages/users`)에서 **Accept 헤더에 따라** HTML 또는 JSON을 반환:

```java
@RestController
@RequestMapping("/pages")
public class UserPageController {

    // HTML 응답
    @GetMapping(value = "/users", produces = MediaType.TEXT_HTML_VALUE)
    public String usersPage() {
        return """
                <html>
                <body>
                    <h1>유저 목록</h1>
                    <ul>
                        <li>홍길동 - hong@example.com</li>
                    </ul>
                </body>
                </html>
                """;
    }

    // JSON 응답
    @GetMapping(value = "/users", produces = MediaType.APPLICATION_JSON_VALUE)
    public String usersJson() {
        return """
                [
                    {"id": 1, "name": "홍길동", "email": "hong@example.com"}
                ]
                """;
    }
}
```

테스트:
```bash
# HTML 응답 요청
curl -H "Accept: text/html" http://localhost:8080/pages/users

# JSON 응답 요청
curl -H "Accept: application/json" http://localhost:8080/pages/users
```

> (Windows에서는 Git Bash 또는 PowerShell에서 실행)

---

## API 테스트 (curl 명령어)

> (Windows에서는 Git Bash 또는 PowerShell에서 실행)

```bash
# 1. 단순 문자열
curl http://localhost:8080/users/hello

# 2. 전체 목록
curl http://localhost:8080/users

# 3. PathVariable
curl http://localhost:8080/users/1

# 4. RequestParam
curl "http://localhost:8080/users/search?name=홍길동"

# 5. 페이징
curl "http://localhost:8080/users/page?page=0&size=5"

# 6. RequestHeader
curl -H "Authorization: Bearer my-token" http://localhost:8080/users/me

# 7. ResponseEntity (정상)
curl http://localhost:8080/users/1/detail

# 7. ResponseEntity (에러)
curl -v http://localhost:8080/users/-1/detail
```

---

## 실습 가이드

### 브랜치 전환

```bash
# 완성 코드 확인
git checkout web/get

# 실습 (TODO 빈칸 채우기)
git checkout web/get-practice
```

### practice 브랜치 사용법

`web/get-practice` 브랜치에는 코드의 주요 부분이 `// TODO:` 주석으로 비어 있다. 각 TODO를 채워 넣으며 학습한다.

예시:
```java
@GetMapping("/{id}")
public User getUser(/* TODO: @PathVariable 사용하여 id 받기 */) {
    // TODO: User 객체 반환
}
```

### 확인 방법

1. 서버를 실행한다:
   ```bash
   ./gradlew bootRun
   # Windows: gradlew.bat bootRun
   ```
2. 각 엔드포인트를 curl 또는 브라우저로 호출한다.
3. 기대한 JSON 응답이 오는지 확인한다.

---

## 핵심 정리

> **`@RestController`는 반환값을 JSON으로 자동 변환하고, `@PathVariable`/`@RequestParam`/`@RequestHeader`로 클라이언트의 다양한 데이터를 받으며, `ResponseEntity`로 HTTP 상태코드까지 직접 제어할 수 있다.**
