# 1주차 퀴즈: 환경설정, 프로젝트 시작, GET API

## Q1. Spring Boot 프로젝트에서 사용하는 Java 최소 요구 버전과 본 강의에서 실제 사용하는 버전의 조합으로 올바른 것은?
- A) 최소 Java 11, 사용 버전 Java 17
- B) 최소 Java 17, 사용 버전 Java 21
- C) 최소 Java 8, 사용 버전 Java 17
- D) 최소 Java 21, 사용 버전 Java 21
- E) 최소 Java 11, 사용 버전 Java 21

**정답:** B
**해설:** 강의에서 사용하는 Spring Boot는 Java 17 이상이 필요하며, 본 강의에서는 Java 21을 사용한다.

---

## Q2. `@SpringBootApplication` 어노테이션이 내부적으로 포함하고 있지 않은 어노테이션은?
- A) `@SpringBootConfiguration`
- B) `@EnableAutoConfiguration`
- C) `@ComponentScan`
- D) `@RestController`
- E) 위 보기 중 포함하지 않는 것은 하나뿐이다

**정답:** D
**해설:** `@SpringBootApplication`은 `@SpringBootConfiguration`, `@EnableAutoConfiguration`, `@ComponentScan` 세 가지를 포함한다. `@RestController`는 컨트롤러 클래스에 사용하는 별도의 어노테이션이다.

---

## Q3. `build.gradle`의 `dependencies` 블록에서 `spring-boot-starter-web`을 추가하면 자동으로 포함되지 않는 것은?
- A) Spring MVC
- B) 내장 톰캣 (Embedded Tomcat)
- C) Jackson (JSON 처리)
- D) JPA (데이터베이스 접근)
- E) Bean Validation

**정답:** D
**해설:** `spring-boot-starter-web`은 Spring MVC, 내장 톰캣, Jackson, Bean Validation을 포함한다. JPA는 `spring-boot-starter-data-jpa`를 별도로 추가해야 사용할 수 있다.

---

## Q4. Gradle Wrapper(`gradlew` / `gradlew.bat`)에 대한 설명으로 올바르지 않은 것은?
- A) Gradle을 직접 설치하지 않아도 빌드가 가능하다
- B) 팀원 모두 동일한 Gradle 버전을 사용하도록 보장한다
- C) Windows cmd에서는 `./gradlew` 대신 `gradlew.bat`을 사용해야 한다
- D) Gradle Wrapper의 버전 정보는 `build.gradle`에 명시되어 있다
- E) Git Bash를 사용하면 Windows에서도 `./gradlew`가 동작한다

**정답:** D
**해설:** Gradle Wrapper의 버전 정보는 `build.gradle`이 아니라 `gradle/wrapper/gradle-wrapper.properties` 파일에 지정되어 있다.

---

## Q5. Spring Boot의 기본 내장 웹 서버 포트 번호와, 이를 변경하기 위해 수정해야 하는 파일의 조합으로 올바른 것은?
- A) 80 포트, `build.gradle`
- B) 8080 포트, `application.properties`
- C) 8080 포트, `settings.gradle`
- D) 3000 포트, `application.properties`
- E) 8080 포트, `BackendApplication.java`

**정답:** B
**해설:** Spring Boot의 기본 포트는 8080이며, `application.properties` 파일에 `server.port=9090`과 같이 설정하면 포트를 변경할 수 있다.

---

## Q6. `@RestController`에 대한 설명으로 올바른 것은?
- A) `@Controller`와 완전히 동일한 기능을 한다
- B) `@Controller` + `@ResponseBody`를 합친 것이다
- C) 반환값이 HTML 템플릿 이름으로 해석된다
- D) 서버 사이드 렌더링 전용 어노테이션이다
- E) `@RequestMapping`을 대체하는 어노테이션이다

**정답:** B
**해설:** `@RestController`는 `@Controller`와 `@ResponseBody`를 합친 것으로, 메서드의 반환값이 뷰 이름이 아니라 HTTP 응답 본문(Body)으로 직접 전달된다. Jackson이 자동으로 Java 객체를 JSON으로 변환한다.

---

## Q7. 다음 코드에서 `GET /users/search?name=홍길동` 요청을 처리하려면 빈칸에 들어갈 어노테이션은?

```java
@GetMapping("/search")
public List<User> searchUsers(______ String name) {
    return List.of(new User(1L, name, "hong@example.com"));
}
```

- A) `@PathVariable`
- B) `@RequestBody`
- C) `@RequestParam`
- D) `@RequestHeader`
- E) `@ModelAttribute`

**정답:** C
**해설:** 쿼리 파라미터(`?name=홍길동`)로 전달되는 값은 `@RequestParam`을 사용하여 받는다. `@PathVariable`은 경로 변수(`/users/1`), `@RequestHeader`는 HTTP 헤더 값을 받을 때 사용한다.

---

## Q8. 다음 코드의 실행 결과로 올바른 것은?

```java
@RestController
@RequestMapping("/users")
public class UserController {
    @GetMapping("/{id}/detail")
    public ResponseEntity<User> getUserDetail(@PathVariable Long id) {
        if (id <= 0) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(new User(id, "홍길동", "hong@example.com"));
    }
}
```

`GET /users/-1/detail` 요청 시 반환되는 HTTP 상태코드는?

- A) 200 OK
- B) 201 Created
- C) 400 Bad Request
- D) 404 Not Found
- E) 500 Internal Server Error

**정답:** C
**해설:** `id`가 `-1`이므로 `id <= 0` 조건이 참이 되어 `ResponseEntity.badRequest().build()`가 실행된다. `badRequest()`는 HTTP 400 상태코드를 반환한다.

---

## Q9. Java의 `record`를 DTO로 사용하는 것에 대한 설명으로 올바르지 않은 것은?
- A) `record`로 선언하면 `private final` 필드가 자동 생성된다
- B) 생성자, getter, `equals()`, `hashCode()`, `toString()`이 자동 생성된다
- C) `record`는 Java 16에서 도입되었다
- D) `record`의 getter 메서드는 `getName()` 형태로 생성된다
- E) `record`는 불변(immutable) 데이터 객체이다

**정답:** D
**해설:** `record`의 getter 메서드는 `getName()`이 아니라 `name()`과 같이 필드 이름 그대로 생성된다. 예를 들어 `User(Long id, String name, String email)`이면 `id()`, `name()`, `email()` 메서드가 생성된다.

---

## Q10. 같은 경로 `/pages/users`에서 HTML과 JSON을 구분하여 응답하기 위해 사용하는 `@GetMapping`의 속성은?

```java
@GetMapping(value = "/users", ______ = MediaType.TEXT_HTML_VALUE)
public String usersPage() { ... }

@GetMapping(value = "/users", ______ = MediaType.APPLICATION_JSON_VALUE)
public String usersJson() { ... }
```

- A) `consumes`
- B) `produces`
- C) `headers`
- D) `params`
- E) `method`

**정답:** B
**해설:** `produces` 속성은 해당 엔드포인트가 생성(produce)하는 응답의 미디어 타입을 지정한다. 클라이언트의 `Accept` 헤더에 따라 적절한 메서드가 호출된다. `consumes`는 요청 본문의 타입을 지정할 때 사용한다.

---
