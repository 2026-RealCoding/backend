# 2주차 퀴즈: POST/PUT/DELETE, Swagger, 예외처리

## Q1. HTTP 메서드와 CRUD 작업의 매핑으로 올바른 것은?
- A) GET - Create, POST - Read, PUT - Update, DELETE - Delete
- B) GET - Read, POST - Create, PUT - Delete, DELETE - Update
- C) GET - Read, POST - Create, PUT - Update, DELETE - Delete
- D) GET - Read, POST - Update, PUT - Create, DELETE - Delete
- E) GET - Create, POST - Delete, PUT - Read, DELETE - Update

**정답:** C
**해설:** REST API에서 GET은 조회(Read), POST는 생성(Create), PUT은 수정(Update), DELETE는 삭제(Delete)에 대응한다.

---

## Q2. 다음 중 멱등성(Idempotency)이 없는 HTTP 메서드는?
- A) GET
- B) PUT
- C) DELETE
- D) POST
- E) GET과 PUT 모두

**정답:** D
**해설:** POST는 호출할 때마다 새로운 리소스가 생성되므로 멱등성이 없다. GET, PUT, DELETE는 같은 요청을 여러 번 보내도 결과가 동일하므로 멱등성을 가진다.

---

## Q3. 클라이언트가 보낸 JSON 요청 본문을 Java 객체로 변환하기 위해 사용하는 어노테이션은?
- A) `@RequestParam`
- B) `@PathVariable`
- C) `@RequestBody`
- D) `@RequestHeader`
- E) `@ModelAttribute`

**정답:** C
**해설:** `@RequestBody`는 HTTP 요청 본문(Body)의 JSON 데이터를 Jackson을 통해 Java 객체로 자동 변환한다. `@RequestParam`은 쿼리 파라미터, `@PathVariable`은 경로 변수를 받을 때 사용한다.

---

## Q4. POST 요청으로 새 리소스를 생성했을 때 반환해야 하는 적절한 HTTP 상태코드는?
- A) 200 OK
- B) 201 Created
- C) 204 No Content
- D) 301 Moved Permanently
- E) 404 Not Found

**정답:** B
**해설:** 새 리소스가 성공적으로 생성되었을 때는 201 Created를 반환하는 것이 REST API의 관례이다. 200 OK는 일반적인 성공, 204 No Content는 삭제 성공 시 사용한다.

---

## Q5. 다음 코드에서 DELETE 요청이 성공했을 때 반환되는 응답으로 올바른 것은?

```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
    boolean removed = users.removeIf(u -> u.id().equals(id));
    if (removed) {
        return ResponseEntity.noContent().build();
    }
    return ResponseEntity.notFound().build();
}
```

- A) 200 OK와 삭제된 유저 정보
- B) 201 Created와 빈 응답
- C) 204 No Content와 빈 응답 본문
- D) 404 Not Found와 에러 메시지
- E) 400 Bad Request와 에러 메시지

**정답:** C
**해설:** 삭제가 성공하면 `ResponseEntity.noContent().build()`가 실행되어 204 No Content가 반환된다. `ResponseEntity<Void>`로 선언되어 응답 본문이 없음을 명시한다.

---

## Q6. Swagger UI를 Spring Boot 프로젝트에 추가하기 위해 `build.gradle`에 추가해야 하는 의존성은?
- A) `org.springframework.boot:spring-boot-starter-swagger`
- B) `io.springfox:springfox-boot-starter`
- C) `org.springdoc:springdoc-openapi-starter-webmvc-ui`
- D) `org.springframework.boot:spring-boot-starter-openapi`
- E) `io.swagger:swagger-spring-boot-starter`

**정답:** C
**해설:** 본 강의에서는 `org.springdoc:springdoc-openapi-starter-webmvc-ui:3.0.1` 의존성을 추가하여 Swagger UI를 활성화한다. 이 한 줄만 추가하면 Swagger UI가 자동으로 사용 가능해진다.

---

## Q7. Swagger 어노테이션과 그 역할의 연결로 올바르지 않은 것은?
- A) `@Tag` - 컨트롤러를 그룹으로 묶어 분류
- B) `@Operation` - API의 요약(summary)과 설명(description)
- C) `@Parameter` - 파라미터의 설명과 예시값
- D) `@ApiResponse` - 응답 코드별 설명
- E) `@Tag` - 개별 API 메서드의 요약 설명

**정답:** E
**해설:** `@Tag`는 클래스 레벨에 사용하여 컨트롤러를 그룹으로 분류하는 역할을 한다. 개별 API 메서드의 요약 설명은 `@Operation`의 `summary` 속성을 사용한다.

---

## Q8. `@RestControllerAdvice`와 `@ExceptionHandler`를 사용한 전역 예외 처리의 장점이 아닌 것은?
- A) 모든 API에서 같은 형태의 에러 응답이 반환된다
- B) Controller에 예외 처리 코드가 없어 깔끔해진다
- C) 에러 로깅을 한 곳에서 관리할 수 있다
- D) 예외가 발생하면 자동으로 데이터베이스 롤백이 된다
- E) 새 예외 타입 추가 시 Handler에 메서드 하나만 추가하면 된다

**정답:** D
**해설:** `@RestControllerAdvice`는 예외를 잡아 통일된 에러 응답을 반환하는 역할을 한다. 데이터베이스 트랜잭션 롤백은 `@Transactional` 어노테이션의 역할이며, 전역 예외 처리와는 별개의 기능이다.

---

## Q9. 다음 GlobalExceptionHandler 코드에서, 존재하지 않는 유저 ID로 조회 시 반환되는 응답의 형태로 올바른 것은?

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException e) {
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.NOT_FOUND.value(), "Not Found", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }
}
```

- A) `{"status": 400, "error": "Bad Request", "message": "..."}`
- B) `{"status": 404, "error": "Not Found", "message": "유저를 찾을 수 없습니다. ID: 999"}`
- C) `{"error": "UserNotFoundException"}`
- D) `null`
- E) `{"status": 500, "error": "Internal Server Error", "message": "..."}`

**정답:** B
**해설:** `UserNotFoundException`이 발생하면 `handleUserNotFound` 메서드가 호출되어 404 상태코드와 함께 `ErrorResponse` 형태의 통일된 에러 응답이 반환된다. `ErrorResponse`는 `status`, `error`, `message`, `timestamp` 필드를 포함한다.

---

## Q10. 커스텀 예외 클래스를 만들 때 `RuntimeException`을 상속하는 이유로 올바른 것은?
- A) `RuntimeException`만 Spring에서 처리할 수 있기 때문이다
- B) `RuntimeException`은 Checked Exception이라 컴파일 시점에 에러를 잡을 수 있다
- C) `RuntimeException`은 Unchecked Exception이라 `throws` 선언 없이 어디서든 던질 수 있다
- D) `RuntimeException`을 상속하면 자동으로 HTTP 500 응답이 된다
- E) `RuntimeException`은 `try-catch`를 반드시 작성해야 하므로 안전하다

**정답:** C
**해설:** `RuntimeException`은 Unchecked Exception으로, `throws` 선언 없이 어디서든 자유롭게 던질 수 있어 코드가 깔끔해진다. Spring의 `@ExceptionHandler`가 이를 자동으로 잡아서 처리해준다. Checked Exception은 반드시 `try-catch`나 `throws` 선언이 필요하다.

---
