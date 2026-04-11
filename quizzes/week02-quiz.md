# 2주차 퀴즈: POST/PUT/DELETE, Swagger, 예외처리

## Q1. `@RestControllerAdvice`와 `@ExceptionHandler`를 사용한 전역 예외 처리가 필요한 이유로 가장 적절한 것은?
- A) Spring Boot에서 예외 처리 없이는 컴파일이 되지 않기 때문이다
- B) 모든 컨트롤러에서 같은 형태의 에러 응답을 통일하고, Controller에서 예외 처리 코드를 제거하여 깔끔하게 만들기 위해서이다
- C) 데이터베이스 롤백을 자동으로 처리하기 위해서이다
- D) HTTP 상태 코드를 사용하지 않기 위해서이다
- E) Swagger 문서 자동 생성을 위해서이다

**정답:** B
**해설:** 전역 예외 처리는 에러 응답 형식을 통일하고, 개별 Controller에서 반복되는 `try-catch`와 예외 처리 로직을 제거하여 비즈니스 로직에 집중할 수 있게 한다. DB 롤백은 `@Transactional`의 역할이며, 전역 예외 처리와는 별개이다.

---

## Q2. 커스텀 예외 클래스를 만들 때 `RuntimeException`을 상속하는 이유로 올바른 것은?
- A) `RuntimeException`만 Spring에서 처리할 수 있기 때문이다
- B) `RuntimeException`은 Checked Exception이라 컴파일 시점에 에러를 잡을 수 있기 때문이다
- C) `RuntimeException`은 Unchecked Exception이라 `throws` 선언 없이 어디서든 던질 수 있어 코드가 깔끔해지기 때문이다
- D) `RuntimeException`을 상속하면 자동으로 HTTP 500 응답이 되기 때문이다
- E) `RuntimeException`은 `try-catch`를 반드시 작성해야 하므로 안전하기 때문이다

**정답:** C
**해설:** `RuntimeException`은 Unchecked Exception으로, `throws` 선언 없이 어디서든 자유롭게 던질 수 있어 코드가 깔끔해진다. Spring의 `@ExceptionHandler`가 이를 자동으로 잡아서 처리해준다. Checked Exception은 반드시 `try-catch`나 `throws` 선언이 필요하다.

---

## Q3. Swagger(OpenAPI)를 Spring Boot 프로젝트에 도입하는 이유로 가장 적절하지 **않은** 것은?
- A) API 명세를 코드와 함께 관리하여 문서와 실제 동작의 불일치를 줄일 수 있다
- B) Swagger UI에서 바로 API를 호출해 볼 수 있어 Postman 없이 테스트가 가능하다
- C) 프론트엔드 개발자에게 API 사용법을 빠르게 공유할 수 있다
- D) 어노테이션만 추가하면 별도의 문서 작성 없이 API 문서가 자동 생성된다
- E) Swagger를 사용하면 API 응답 속도가 빨라진다

**정답:** E
**해설:** Swagger는 API 문서화와 테스트 도구이며, 응답 속도와는 관계가 없다. 코드와 문서를 함께 관리할 수 있고, 자동 생성되며, UI에서 바로 호출해볼 수 있는 등 개발 생산성을 높이는 것이 Swagger를 쓰는 이유이다.

---

## Q4. HTTP 메서드와 CRUD 작업의 매핑으로 올바른 것은?
- A) GET - Create, POST - Read, PUT - Update, DELETE - Delete
- B) GET - Read, POST - Create, PUT - Delete, DELETE - Update
- C) GET - Read, POST - Create, PUT - Update, DELETE - Delete
- D) GET - Read, POST - Update, PUT - Create, DELETE - Delete
- E) GET - Create, POST - Delete, PUT - Read, DELETE - Update

**정답:** C
**해설:** REST API에서 GET은 조회(Read), POST는 생성(Create), PUT은 수정(Update), DELETE는 삭제(Delete)에 대응한다.

---

## Q5. 클라이언트가 보낸 JSON 요청 본문을 Java 객체로 변환하기 위해 사용하는 어노테이션은?
- A) `@RequestParam`
- B) `@PathVariable`
- C) `@RequestBody`
- D) `@RequestHeader`
- E) `@ModelAttribute`

**정답:** C
**해설:** `@RequestBody`는 HTTP 요청 본문(Body)의 JSON 데이터를 Jackson을 통해 Java 객체로 자동 변환한다. `@RequestParam`은 쿼리 파라미터, `@PathVariable`은 경로 변수를 받을 때 사용한다.

---

## Q6. POST 요청으로 새 리소스를 생성했을 때 반환 가능한 HTTP 상태코드를 **모두** 고르면? (복수 정답)
- A) 200 OK
- B) 201 Created
- C) 204 No Content
- D) 301 Moved Permanently
- E) 404 Not Found

**정답:** A, B
**해설:** 새 리소스가 성공적으로 생성되었을 때는 201 Created를 반환하는 것이 REST API의 관례이지만, 실무에서는 일반적인 성공 응답인 200 OK를 사용하는 경우도 많다. 둘 다 허용 가능한 응답이다. 204 No Content는 응답 본문이 없을 때(주로 DELETE 성공 시) 사용한다.

---

## Q7. 다음 코드에서 DELETE 요청이 성공했을 때 반환되는 응답으로 올바른 것은?

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

## Q8. Swagger UI를 Spring Boot 프로젝트에 추가하기 위해 `build.gradle`에 추가해야 하는 의존성은?
- A) `org.springframework.boot:spring-boot-starter-swagger`
- B) `io.springfox:springfox-boot-starter`
- C) `org.springdoc:springdoc-openapi-starter-webmvc-ui`
- D) `org.springframework.boot:spring-boot-starter-openapi`
- E) `io.swagger:swagger-spring-boot-starter`

**정답:** C
**해설:** 본 강의에서는 `org.springdoc:springdoc-openapi-starter-webmvc-ui:3.0.1` 의존성을 추가하여 Swagger UI를 활성화한다. 이 한 줄만 추가하면 Swagger UI가 자동으로 사용 가능해진다.

---

## Q9. Swagger 어노테이션과 그 역할의 연결로 올바르지 않은 것은?
- A) `@Tag` - 컨트롤러를 그룹으로 묶어 분류
- B) `@Operation` - API의 요약(summary)과 설명(description)
- C) `@Parameter` - 파라미터의 설명과 예시값
- D) `@ApiResponse` - 응답 코드별 설명
- E) `@Tag` - 개별 API 메서드의 요약 설명

**정답:** E
**해설:** `@Tag`는 클래스 레벨에 사용하여 컨트롤러를 그룹으로 분류하는 역할을 한다. 개별 API 메서드의 요약 설명은 `@Operation`의 `summary` 속성을 사용한다.

---

## Q10. 다음 GlobalExceptionHandler 코드에서, 존재하지 않는 유저 ID로 조회 시 반환되는 응답의 형태로 올바른 것은?

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
