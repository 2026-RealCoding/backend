# Step 6: 예외 처리와 Global Exception Handler

> **브랜치:** `web/exception` | **실습 브랜치:** `web/exception-practice`

---

## 학습 목표

1. 왜 예외 처리를 체계적으로 해야 하는지 이해한다.
2. 커스텀 예외 클래스를 만들어 비즈니스 의미를 담는다.
3. `@RestControllerAdvice`와 `@ExceptionHandler`로 전역 예외 처리기를 구현한다.
4. 통일된 에러 응답 포맷(`ErrorResponse`)의 중요성을 체감한다.

---

## 핵심 개념

### 왜 전역 예외 처리가 필요한가?

API 서버는 **클라이언트(프론트엔드, 모바일 앱)와 약속된 형식**으로 통신해야 한다. 만약 예외 처리를 Controller마다 따로 하면:

- 어떤 API는 `null`을 반환하고, 어떤 API는 `500 Internal Server Error`를 반환한다.
- 클라이언트 개발자가 에러를 파싱하기 어렵다.
- 로깅이 누락되거나 일관성이 없다.

**전역 예외 처리**를 도입하면:

- 모든 API에서 **같은 형태의 에러 응답**이 내려간다.
- Controller는 **비즈니스 예외를 던지기만** 하면 된다 (처리 로직 없음).
- 에러 로깅이 **한 곳**에서 관리된다.

### 동작 흐름

```
Client → Controller → Service에서 예외 발생!
                          ↓
                  GlobalExceptionHandler가 잡음
                          ↓
                  ErrorResponse로 변환하여 응답
```

### 주요 어노테이션

| 어노테이션 | 역할 |
|---|---|
| `@RestControllerAdvice` | 전체 Controller에 적용되는 예외 처리 클래스 |
| `@ExceptionHandler` | 특정 예외 타입을 잡아 처리하는 메서드 |

---

## 주요 코드

### 1. 커스텀 예외 클래스

**UserNotFoundException** (404 Not Found)

```java
package com.inspire12.backend.exception;

public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(Long id) {
        super("유저를 찾을 수 없습니다. ID: " + id);
    }
}
```

**InvalidRequestException** (400 Bad Request)

```java
package com.inspire12.backend.exception;

public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String message) {
        super(message);
    }
}
```

> **왜 `RuntimeException`을 상속하는가?**
> - `RuntimeException`은 **Unchecked Exception**이다 (RuntimeException은 실행 중 발생하는 예외로, try-catch를 강제하지 않는다).
> - 반면 **Checked Exception** (예: `IOException`)은 반드시 try-catch로 처리하거나 `throws`로 선언해야 한다.
> - `throws` 선언 없이 어디서든 던질 수 있어 코드가 깔끔하다.
> - Spring의 `@ExceptionHandler`가 자동으로 잡아준다.

### 2. 통일된 에러 응답 포맷 (ErrorResponse)

```java
package com.inspire12.backend.dto;

import java.time.LocalDateTime;

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

응답 예시 (JSON):

```json
{
    "status": 404,
    "error": "Not Found",
    "message": "유저를 찾을 수 없습니다. ID: 999",
    "timestamp": "2026-02-21T14:30:00.123"
}
```

### 3. GlobalExceptionHandler

```java
package com.inspire12.backend.exception;

import com.inspire12.backend.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 1. UserNotFoundException → 404
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException e) {
        log.warn("UserNotFoundException: {}", e.getMessage());
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.NOT_FOUND.value(),
                "Not Found",
                e.getMessage()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    // 2. InvalidRequestException → 400
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRequest(InvalidRequestException e) {
        log.warn("InvalidRequestException: {}", e.getMessage());
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request",
                e.getMessage()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // 3. 그 외 모든 예외 → 500
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        log.error("Unhandled exception: {}", e.getMessage(), e);
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                e.getMessage()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
```

### 4. Before/After 비교

#### Before: Controller에서 직접 null 반환 / ResponseEntity 분기

```java
// BAD: Controller에 예외 처리 로직이 섞여 있음
@GetMapping("/{id}")
public ResponseEntity<?> getUser(@PathVariable Long id) {
    User user = userService.findById(id);
    if (user == null) {
        return ResponseEntity.status(404).body("유저를 찾을 수 없습니다");
    }
    return ResponseEntity.ok(user);
}

@GetMapping("/{id}/detail")
public ResponseEntity<?> getUserDetail(@PathVariable Long id) {
    if (id <= 0) {
        return ResponseEntity.badRequest().body("잘못된 ID입니다");
    }
    User user = userService.findById(id);
    if (user == null) {
        return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(user);
}
```

**문제점:**
- 모든 Controller 메서드에 `if-else` 분기가 반복된다.
- 에러 응답 형식이 제각각이다 (문자열, 빈 body 등).
- 새로운 API를 만들 때마다 같은 패턴을 복사-붙여넣기 해야 한다.

#### After: 예외 던지기 + GlobalExceptionHandler가 처리

```java
// GOOD: Controller는 비즈니스 로직만 호출
@GetMapping("/{id}")
public User getUser(@PathVariable Long id) {
    return userService.getUserById(id);  // 없으면 UserNotFoundException 발생
}

@GetMapping("/{id}/detail")
public User getUserDetail(@PathVariable Long id) {
    return userService.getUserDetail(id);  // 검증 실패시 InvalidRequestException 발생
}
```

> 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다.
> 아래 코드의 `.map()`, `.orElseThrow()`는 Optional과 람다(Lambda) 문법이다. 지금은 "값이 없으면 예외를 던진다"는 흐름만 이해하면 된다.

```java
// Service에서 예외를 던짐
public User getUserById(Long id) {
    return userRepository.findById(id)       // Optional<User>를 반환
            .map(this::toDto)                // 값이 있으면 변환
            .orElseThrow(() -> new UserNotFoundException(id));  // 값이 없으면 예외 발생
}

public User getUserDetail(Long id) {
    if (id <= 0) {
        throw new InvalidRequestException("ID는 1 이상이어야 합니다. 입력값: " + id);
    }
    return getUserById(id);
}
```

**개선점:**
- Controller가 깔끔하다 (예외 처리 코드 없음).
- 모든 API에서 동일한 형태의 에러 응답이 내려간다.
- 새 예외 타입 추가 시 Handler에 메서드 하나만 추가하면 된다.

---

## 실습 가이드

### 1. 브랜치 전환

```bash
git checkout web/exception-practice
```

### 2. 실습 과제

`web/exception-practice` 브랜치에는 아래 항목이 **TODO**로 비워져 있다. 직접 구현해보자.

1. **`UserNotFoundException`** 작성
   - `RuntimeException`을 상속
   - 생성자에서 유저 ID를 포함한 메시지 설정

2. **`InvalidRequestException`** 작성
   - `RuntimeException`을 상속
   - 생성자에서 커스텀 메시지를 받음

3. **`ErrorResponse`** record 작성
   - `status`, `error`, `message`, `timestamp` 필드
   - `of()` 정적 팩토리 메서드

4. **`GlobalExceptionHandler`** 작성
   - `@RestControllerAdvice` 적용
   - `UserNotFoundException` → 404 처리
   - `InvalidRequestException` → 400 처리
   - `Exception` → 500 처리 (fallback)

### 3. 테스트

서버를 실행한 후:

```bash
# 서버 실행
# macOS / Linux
./gradlew bootRun

# Windows (cmd / PowerShell)
gradlew.bat bootRun
```

```bash
# 존재하지 않는 유저 조회 → 404
curl -s http://localhost:8080/users/999 | python3 -m json.tool

# 잘못된 ID로 상세 조회 → 400
curl -s http://localhost:8080/users/-1/detail | python3 -m json.tool

# 정상 조회
curl -s http://localhost:8080/users/1 | python3 -m json.tool
```

> (Windows에서는 Git Bash 또는 PowerShell에서 실행)

### 4. 완성 코드 확인

```bash
git checkout web/exception
```

---

## 핵심 정리

> **예외는 Service에서 던지고, GlobalExceptionHandler에서 잡아 통일된 형식으로 응답한다.**
> Controller는 예외 처리 코드 없이 깔끔하게, 에러 응답은 어디서든 같은 포맷으로.
