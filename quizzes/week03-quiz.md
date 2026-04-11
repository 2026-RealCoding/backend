# 3주차 퀴즈: 로깅, Profile, Actuator (Step 7-9)

## Q1. `System.out.println()` 대신 로깅 프레임워크를 사용해야 하는 이유로 **적절하지 않은** 것은?
- A) 로그 레벨로 출력을 제어할 수 있다
- B) 콘솔뿐만 아니라 파일, 원격 서버 등 다양한 출력 대상을 지원한다
- C) 시간, 스레드 정보가 자동으로 포함된다
- D) 레벨 미달 시 로그 실행 비용이 0이다
- E) 별도의 의존성 없이 Java 기본 라이브러리만으로 사용할 수 있다

**정답:** E
**해설:** SLF4J + Logback은 Spring Boot에 기본 포함되어 별도 추가가 필요 없지만, Java 기본 라이브러리가 아니라 별도의 로깅 프레임워크이다. `System.out.println()`이 오히려 Java 기본 기능이며, 레벨 제어·출력 대상 다양화·메타 정보 자동 포함·Lazy 평가 등의 이점을 제공하지 못한다.

---

## Q2. Spring Profile을 도입하는 이유로 가장 적절한 것은?
- A) 개발 환경과 운영 환경에서 포트, DB, 로그 레벨 등의 설정을 **코드 수정 없이** 전환하기 위해서이다
- B) Java 컴파일 속도를 향상시키기 위해서이다
- C) 하나의 파일에 모든 환경 설정을 몰아넣어 관리를 단순화하기 위해서이다
- D) 테스트 코드를 자동으로 생성하기 위해서이다
- E) Spring Boot 애플리케이션을 여러 개 띄우기 위해 필수로 필요하기 때문이다

**정답:** A
**해설:** Spring Profile은 환경별(dev, prod, test 등)로 설정을 분리하여 **코드를 수정하지 않고** 실행 인자(`--spring.profiles.active=prod`)만 바꿔서 환경을 전환할 수 있게 한다. 개발 DB와 운영 DB, 로그 레벨, 포트 등 환경마다 달라져야 하는 값을 안전하게 관리할 수 있다.

---

## Q3. 운영(prod) 환경에서 Actuator 엔드포인트를 `health`와 `info`만 노출하는 이유로 가장 적절한 것은?
- A) 다른 엔드포인트는 prod 환경에서 동작하지 않기 때문이다
- B) `metrics`, `env`, `beans` 등이 외부에 노출되면 서버 내부 정보가 유출되어 보안 위험이 있기 때문이다
- C) 엔드포인트가 많으면 서버 성능이 크게 저하되기 때문이다
- D) health와 info 외의 엔드포인트는 유료 기능이기 때문이다
- E) Spring Boot 라이선스 정책에 따라 운영 환경에서는 제한되기 때문이다

**정답:** B
**해설:** Actuator는 서버 내부 정보를 노출한다. `metrics`, `env`, `beans` 등이 외부에 노출되면 보안 위험이 있으므로, 운영 환경에서는 꼭 필요한 `health`와 `info`만 노출하도록 설정한다.

---

## Q4. SLF4J와 Logback의 관계를 올바르게 설명한 것은?
- A) SLF4J는 구현체이고, Logback은 인터페이스이다
- B) SLF4J는 로깅 API의 추상화 계층(인터페이스)이고, Logback은 실제 로그를 출력하는 구현체이다
- C) SLF4J와 Logback은 동일한 라이브러리의 다른 이름이다
- D) Logback은 SLF4J 없이는 단독으로 사용할 수 없다
- E) SLF4J는 파일 출력만, Logback은 콘솔 출력만 담당한다

**정답:** B
**해설:** SLF4J는 로깅 API의 추상화 계층(인터페이스) 역할을 하고, Logback은 실제 로그를 출력하는 구현체이다. 코드 -> SLF4J(인터페이스) -> Logback(구현체) 구조로 동작한다.

---

## Q5. 로그 레벨을 `INFO`로 설정했을 때, 출력되는 로그 레벨의 조합으로 올바른 것은?
- A) INFO만 출력
- B) TRACE, DEBUG, INFO 출력
- C) INFO, WARN, ERROR 출력
- D) DEBUG, INFO, WARN, ERROR 출력
- E) TRACE, DEBUG, INFO, WARN, ERROR 모두 출력

**정답:** C
**해설:** 로그 레벨은 TRACE < DEBUG < INFO < WARN < ERROR 순이며, 설정한 레벨 이상만 출력된다. INFO로 설정하면 INFO, WARN, ERROR가 출력된다.

---

## Q6. 다음 코드에서 빈칸에 들어갈 내용으로 올바른 것은?

```java
@ExceptionHandler(Exception.class)
public ResponseEntity<ErrorResponse> handleException(Exception e) {
    log.error("Unhandled exception: {}", e.getMessage(), ______);
    // ...
}
```
- A) e.toString()
- B) e.getStackTrace()
- C) e
- D) e.getCause()
- E) e.printStackTrace()

**정답:** C
**해설:** `log.error("메시지", e)` 처럼 마지막 인자로 예외 객체 `e`를 넘기면 스택트레이스가 자동으로 출력된다. `e.printStackTrace()`를 호출하면 System.err로 직접 출력되므로 로깅 프레임워크의 장점을 활용하지 못한다.

---

## Q7. `logback-spring.xml`에서 **Rolling File Appender**의 역할로 올바른 것은?
- A) 로그를 콘솔에 컬러로 출력한다
- B) 로그를 단일 파일에 계속 추가한다
- C) 날짜와 크기 기반으로 로그 파일을 자동 분할하고 오래된 파일을 삭제한다
- D) 로그를 원격 서버에 전송한다
- E) 로그 파일을 암호화하여 저장한다

**정답:** C
**해설:** Rolling File Appender는 로그 파일이 너무 커지지 않도록 날짜+크기 기반으로 자동 분할하고 오래된 파일을 삭제해주는 설정이다. 강의에서는 파일 하나 최대 10MB, 최대 30일 보관, 전체 로그 최대 1GB로 설정했다.

---

## Q8. Spring Profile에 대한 설명으로 **올바르지 않은** 것은?
- A) `application-dev.properties`와 `application-prod.properties`로 환경별 설정을 분리할 수 있다
- B) `spring.profiles.active=dev`로 활성 프로필을 지정한다
- C) 프로필별 설정 파일의 네이밍 규칙은 `application-{프로필명}.properties`이다
- D) 코드를 수정해야만 프로필을 전환할 수 있다
- E) `logback-spring.xml`에서 `<springProfile>` 태그로 환경별 로그 설정을 적용할 수 있다

**정답:** D
**해설:** 프로필 전환은 코드 수정 없이 실행 인자(`--spring.profiles.active=prod`)만 바꾸면 된다. 이것이 Profile의 핵심 장점이다.

---

## Q9. Spring Boot Actuator의 `/actuator/health` 엔드포인트에 커스텀 항목을 추가하려면 어떻게 해야 하는가?
- A) `application.properties`에 커스텀 health 항목을 선언한다
- B) `HealthIndicator` 인터페이스를 구현한 클래스를 `@Component`로 등록한다
- C) `@HealthCheck` 어노테이션을 사용한다
- D) `logback-spring.xml`에 health 항목을 추가한다
- E) `@RestController`에 `/actuator/health` 엔드포인트를 직접 정의한다

**정답:** B
**해설:** `HealthIndicator` 인터페이스를 구현한 빈을 `@Component`로 등록하면 Actuator가 자동으로 감지한다. 클래스 이름에서 `HealthIndicator`를 뗀 나머지가 항목 이름이 된다(예: `UserHealthIndicator` -> "user").

---

## Q10. 다음 코드에서 `user.created.count` 메트릭의 역할로 올바른 것은?

```java
this.userCreateCounter = Counter.builder("user.created.count")
        .description("유저 생성 횟수")
        .tag("controller", "UserController")
        .register(meterRegistry);
```
- A) 현재 접속 중인 유저 수를 실시간으로 표시한다
- B) 유저 생성 API의 응답 시간을 측정한다
- C) 유저 생성이 호출될 때마다 누적 카운트를 증가시킨다
- D) 유저 삭제 횟수를 추적한다
- E) 유저 생성 요청의 실패 횟수만 추적한다

**정답:** C
**해설:** `Counter`는 누적 카운트 메트릭으로, 숫자가 계속 올라가기만 하는 측정값이다. `userCreateCounter.increment()`가 호출될 때마다 유저 생성 횟수가 1씩 증가한다.

---
