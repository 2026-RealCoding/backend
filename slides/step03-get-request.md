---
marp: true
theme: default
paginate: true
---

# Step 3: GET 요청/응답 다루기

**2026 RealCoding - Spring Boot Backend**

브랜치: `web/get` | 실습: `web/get-practice`

---

## 학습 목표

- `@RestController`와 `@RequestMapping`을 사용할 수 있다
- `@PathVariable`, `@RequestParam`, `@RequestHeader`를 구분한다
- `ResponseEntity`로 상태코드를 제어한다
- Java `record`를 DTO로 활용한다

---

## @RestController란?

```java
@RestController          // 이 클래스는 REST API 컨트롤러!
@RequestMapping("/users") // 공통 경로: /users
public class UserController {
    // ...
}
```

| 어노테이션 | 반환 | 용도 |
|---|---|---|
| `@Controller` | View 이름 (HTML) | 서버 사이드 렌더링 |
| `@RestController` | JSON 데이터 | REST API |

> `@RestController` = `@Controller` + `@ResponseBody`

---

## User DTO - Java Record

```java
public record User(Long id, String name, String email) {
}
```

record 한 줄이면 자동 생성:
- `private final` 필드 3개
- 생성자
- getter: `id()`, `name()`, `email()`
- `equals()`, `hashCode()`, `toString()`

> Jackson이 이 record를 **자동으로 JSON 변환**

---

## GET 패턴 1: 단순 문자열 + 목록 조회

```java
// GET /users/hello → "Hello, User!"
@GetMapping("/hello")
public String hello() {
    return "Hello, User!";
}

// GET /users → JSON 배열
@GetMapping
public List<User> getUsers() {
    return List.of(
        new User(1L, "홍길동", "hong@example.com"),
        new User(2L, "김철수", "kim@example.com")
    );
}
```

---

## GET 패턴 2: @PathVariable

```java
// GET /users/1 → id = 1
// GET /users/42 → id = 42
@GetMapping("/{id}")
public User getUser(@PathVariable Long id) {
    return new User(id, "홍길동", "hong@example.com");
}
```

- URL 경로의 `{id}` 부분을 변수로 추출
- **리소스를 식별**할 때 사용 (유저 ID, 게시글 ID 등)

---

## GET 패턴 3: @RequestParam

```java
// GET /users/search?name=홍길동
@GetMapping("/search")
public List<User> searchUsers(@RequestParam String name) {
    return List.of(new User(1L, name, "hong@example.com"));
}

// GET /users/page?page=0&size=10 (기본값 지원)
@GetMapping("/page")
public Map<String, Object> getUsersWithPage(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
    return Map.of("page", page, "size", size, ...);
}
```

- **검색, 필터링, 페이징**에 사용

---

## GET 패턴 4: @RequestHeader

```java
// curl -H "Authorization: Bearer my-token" localhost:8080/users/me
@GetMapping("/me")
public ResponseEntity<User> getCurrentUser(
        @RequestHeader("Authorization") String authorization) {
    String token = authorization.replace("Bearer ", "");
    return ResponseEntity.ok(
        new User(1L, "홍길동 (token: " + token + ")", "hong@example.com")
    );
}
```

- HTTP **헤더**에서 값을 추출
- 주로 **인증 토큰** 처리에 사용

---

## GET 패턴 5: ResponseEntity

```java
@GetMapping("/{id}/detail")
public ResponseEntity<User> getUserDetail(@PathVariable Long id) {
    if (id <= 0) {
        return ResponseEntity.badRequest().build();  // 400
    }
    return ResponseEntity.ok(                        // 200
        new User(id, "홍길동", "hong@example.com")
    );
}
```

- **HTTP 상태코드**를 직접 제어
- `.ok()` → 200, `.badRequest()` → 400, `.notFound()` → 404

---

## 데이터를 받는 3가지 방법 비교

| 방법 | 어노테이션 | 위치 | 예시 |
|---|---|---|---|
| 경로 변수 | `@PathVariable` | URL 경로 | `/users/1` |
| 쿼리 파라미터 | `@RequestParam` | `?key=value` | `/users/search?name=홍` |
| 헤더 | `@RequestHeader` | HTTP 헤더 | `Authorization: Bearer ...` |

---

## HTML vs JSON (UserPageController)

```java
// 같은 URL, 다른 응답 타입!
@GetMapping(value = "/users", produces = MediaType.TEXT_HTML_VALUE)
public String usersPage() { return "<html>...</html>"; }

@GetMapping(value = "/users", produces = MediaType.APPLICATION_JSON_VALUE)
public String usersJson() { return "[{...}]"; }
```

```bash
curl -H "Accept: text/html" localhost:8080/pages/users        # HTML
curl -H "Accept: application/json" localhost:8080/pages/users  # JSON
```

> `produces` 속성으로 **Content Negotiation** 구현

---

## API 테스트

```bash
curl http://localhost:8080/users/hello
curl http://localhost:8080/users
curl http://localhost:8080/users/1
curl "http://localhost:8080/users/search?name=홍길동"
curl "http://localhost:8080/users/page?page=0&size=5"
curl -H "Authorization: Bearer my-token" http://localhost:8080/users/me
curl http://localhost:8080/users/1/detail
curl -v http://localhost:8080/users/-1/detail
```

---

## 실습: web/get-practice

```bash
git checkout web/get-practice
```

TODO 빈칸을 채워 넣으세요:

```java
@GetMapping("/{id}")
public User getUser(/* TODO: id를 받으려면? */) {
    // TODO: User 반환
}
```

완성 후 `./gradlew bootRun`으로 확인!

---

## 핵심 정리

> **`@RestController`로 JSON API를 만들고, `@PathVariable`/`@RequestParam`/`@RequestHeader`로 데이터를 받고, `ResponseEntity`로 상태코드를 제어한다.**

다음 단계: **Step 4 - POST, PUT, DELETE** (`web/post`)
