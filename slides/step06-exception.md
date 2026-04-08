---
marp: true
theme: default
paginate: true
---

# Step 6: 예외 처리와 글로벌 예외 핸들러

**2026 RealCoding**

브랜치: `web/exception`
실습: `web/exception-practice`

---

# 문제 상황

API 서버에서 에러가 발생하면?

- 어떤 API는 `null` 반환
- 어떤 API는 문자열 `"에러입니다"` 반환
- 어떤 API는 Spring 기본 에러 페이지 반환

**클라이언트 개발자:** "에러 응답이 매번 달라서 파싱이 불가능해요..."

---

# 해결: 전역 예외 처리

```
Client → Controller → Service에서 예외 발생!
                          ↓
                  GlobalExceptionHandler가 잡음
                          ↓
                  통일된 ErrorResponse로 응답
```

**원칙:** Controller는 예외를 **던지기만**, 처리는 **한 곳에서**

---

# Before: Controller에서 직접 처리

```java
// 모든 메서드에 if-else가 반복됨
@GetMapping("/{id}")
public ResponseEntity<?> getUser(@PathVariable Long id) {
    User user = userService.findById(id);
    if (user == null) {
        return ResponseEntity.status(404)
            .body("유저를 찾을 수 없습니다");
    }
    return ResponseEntity.ok(user);
}
```

- 에러 형식이 제각각 (문자열, 빈 body...)
- 코드 중복이 심함

---

# After: 예외 던지기 + Handler

```java
// Controller는 깔끔!
@GetMapping("/{id}")
public User getUser(@PathVariable Long id) {
    return userService.getUserById(id);
}
```

> 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다.
> `.map()`, `.orElseThrow()`는 Optional + 람다 문법이다. "값이 없으면 예외를 던진다"는 흐름만 파악하자.

```java
// Service에서 예외를 던짐
public User getUserById(Long id) {
    return userRepository.findById(id)       // Optional<User> 반환
        .map(this::toDto)                    // 값이 있으면 변환
        .orElseThrow(() -> new UserNotFoundException(id));  // 없으면 예외
}
```

---

# 커스텀 예외 클래스

```java
// 404 Not Found
public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(Long id) {
        super("유저를 찾을 수 없습니다. ID: " + id);
    }
}
```

```java
// 400 Bad Request
public class InvalidRequestException extends RuntimeException {
    public InvalidRequestException(String message) {
        super(message);
    }
}
```

> `RuntimeException` = Unchecked Exception (실행 중 발생하는 예외로, try-catch를 강제하지 않는다) = `throws` 선언 불필요
> 반면 Checked Exception (예: `IOException`)은 반드시 try-catch 또는 `throws`가 필요하다.

---

# ErrorResponse: 통일된 에러 형식

```java
public record ErrorResponse(
    int status,
    String error,
    String message,
    LocalDateTime timestamp
) {
    public static ErrorResponse of(int status, String error, String message) {
        return new ErrorResponse(status, error, message, LocalDateTime.now());
    }
}
```

```json
{
    "status": 404,
    "error": "Not Found",
    "message": "유저를 찾을 수 없습니다. ID: 999",
    "timestamp": "2026-02-21T14:30:00.123"
}
```

---

# GlobalExceptionHandler (1/2)

```java
@RestControllerAdvice  // 모든 Controller에 적용
public class GlobalExceptionHandler {

    private static final Logger log =
        LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(
            UserNotFoundException e) {
        log.warn("UserNotFoundException: {}", e.getMessage());
        ErrorResponse body = ErrorResponse.of(
            HttpStatus.NOT_FOUND.value(), "Not Found", e.getMessage()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }
```

---

# GlobalExceptionHandler (2/2)

```java
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRequest(
            InvalidRequestException e) {
        log.warn("InvalidRequestException: {}", e.getMessage());
        ErrorResponse body = ErrorResponse.of(
            HttpStatus.BAD_REQUEST.value(), "Bad Request", e.getMessage()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(Exception.class)  // 최후의 안전망
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        log.error("Unhandled exception: {}", e.getMessage(), e);
        ErrorResponse body = ErrorResponse.of(
            500, "Internal Server Error", e.getMessage()
        );
        return ResponseEntity.status(500).body(body);
    }
}
```

---

# 핵심 어노테이션 정리

| 어노테이션 | 역할 |
|---|---|
| `@RestControllerAdvice` | 전체 Controller 대상 예외 처리 클래스 |
| `@ExceptionHandler` | 특정 예외 타입을 잡아 처리 |

**동작 순서:**
1. Controller/Service에서 예외 발생
2. Spring이 해당 예외 타입에 맞는 `@ExceptionHandler` 탐색
3. 매칭되는 Handler 메서드 실행
4. `ResponseEntity`로 클라이언트에 응답

---

# 테스트해보기

```bash
# 존재하지 않는 유저 → 404
curl -s http://localhost:8080/users/999 | python3 -m json.tool

# 잘못된 ID → 400
curl -s http://localhost:8080/users/-1/detail | python3 -m json.tool

# 정상 조회 → 200
curl -s http://localhost:8080/users/1 | python3 -m json.tool
```

> (Windows에서는 Git Bash 또는 PowerShell에서 실행)

---

# 파일 구조

```
src/main/java/com/inspire12/backend/
├── controller/
│   └── UserController.java        ← 예외를 던지기만 함
├── service/
│   └── UserService.java           ← 비즈니스 검증 + 예외 발생
├── dto/
│   └── ErrorResponse.java         ← 통일된 에러 응답 포맷
└── exception/
    ├── GlobalExceptionHandler.java ← 전역 예외 처리
    ├── UserNotFoundException.java  ← 404
    └── InvalidRequestException.java ← 400
```

---

# 실습 안내

```bash
git checkout web/exception-practice
```

**TODO 항목:**
1. `UserNotFoundException` 구현
2. `InvalidRequestException` 구현
3. `ErrorResponse` record 구현
4. `GlobalExceptionHandler` 구현

**완성 코드:** `git checkout web/exception`

---

# 핵심 정리

> **예외는 Service에서 던지고,
> GlobalExceptionHandler에서 잡아
> 통일된 형식으로 응답한다.**

- Controller는 예외 처리 코드 없이 깔끔하게
- 에러 응답은 어디서든 같은 포맷으로
- 새 예외 추가 = Handler에 메서드 하나 추가
