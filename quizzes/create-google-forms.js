/**
 * 2026 RealCoding - Google Forms Quiz Generator
 *
 * ⚠️  이 파일은 자동 생성됩니다. 직접 수정하지 마세요.
 *     quizzes/week*-quiz.md 를 수정한 뒤
 *     `python3 quizzes/generate-script.py` 를 실행하면 재생성됩니다.
 *
 * 사용법:
 * 1. Google Apps Script (https://script.google.com) 에서 새 프로젝트 생성
 * 2. 이 코드를 전체 복사하여 붙여넣기
 * 3. createAllForms() 실행 -> 6개 퀴즈 폼 전부 생성
 * 4. createWeekForm(1) 실행 -> 특정 주차 퀴즈 폼만 생성
 *
 * 주의:
 * - 퀴즈 모드에서 정답 공개 설정(Google Forms UI에서 '성적 공개 설정')이
 *   '제출 후 즉시'로 되어 있는지 확인하세요.
 * - Apps Script API는 해당 설정을 직접 제어할 수 없습니다.
 */

var QUIZ_DATA = [
  {
    week: 1,
    title: '1주차 퀴즈: 환경설정, 프로젝트 시작, GET API',
    questions: [
      {
        question: '@SpringBootApplication 어노테이션이 내부적으로 포함하고 있지 않은 어노테이션은?',
        choices: [
          '@SpringBootConfiguration',
          '@EnableAutoConfiguration',
          '@ComponentScan',
          '@RestController',
          '위 보기 중 포함하지 않는 것은 하나뿐이다',
        ],
        answer: 3,
        explanation: '@SpringBootApplication은 @SpringBootConfiguration, @EnableAutoConfiguration, @ComponentScan 세 가지를 포함한다. @RestController는 컨트롤러 클래스에 사용하는 별도의 어노테이션이다.'
      },
      {
        question: 'build.gradle의 dependencies 블록에서 spring-boot-starter-web을 추가하면 자동으로 포함되지 않는 것은?',
        choices: [
          'Spring MVC',
          '내장 톰캣 (Embedded Tomcat)',
          'Jackson (JSON 처리)',
          'JPA (데이터베이스 접근)',
          'Bean Validation',
        ],
        answer: 3,
        explanation: 'spring-boot-starter-web은 Spring MVC, 내장 톰캣, Jackson, Bean Validation을 포함한다. JPA는 spring-boot-starter-data-jpa를 별도로 추가해야 사용할 수 있다.'
      },
      {
        question: 'Gradle Wrapper(gradlew / gradlew.bat)에 대한 설명으로 올바르지 않은 것은?',
        choices: [
          'Gradle을 직접 설치하지 않아도 빌드가 가능하다',
          '팀원 모두 동일한 Gradle 버전을 사용하도록 보장한다',
          'Windows cmd에서는 ./gradlew 대신 gradlew.bat을 사용해야 한다',
          'Gradle Wrapper의 버전 정보는 build.gradle에 명시되어 있다',
          'Git Bash를 사용하면 Windows에서도 ./gradlew가 동작한다',
        ],
        answer: 3,
        explanation: 'Gradle Wrapper의 버전 정보는 build.gradle이 아니라 gradle/wrapper/gradle-wrapper.properties 파일에 지정되어 있다.'
      },
      {
        question: 'Spring Boot의 기본 내장 웹 서버 포트 번호와, 이를 변경하기 위해 수정해야 하는 파일의 조합으로 올바른 것은?',
        choices: [
          '80 포트, build.gradle',
          '8080 포트, application.properties',
          '8080 포트, settings.gradle',
          '3000 포트, application.properties',
          '8080 포트, BackendApplication.java',
        ],
        answer: 1,
        explanation: 'Spring Boot의 기본 포트는 8080이며, application.properties 파일에 server.port=9090과 같이 설정하면 포트를 변경할 수 있다.'
      },
      {
        question: '@RestController에 대한 설명으로 올바른 것은?',
        choices: [
          '@Controller와 완전히 동일한 기능을 한다',
          '@Controller + @ResponseBody를 합친 것이다',
          '반환값이 HTML 템플릿 이름으로 해석된다',
          '서버 사이드 렌더링 전용 어노테이션이다',
          '@RequestMapping을 대체하는 어노테이션이다',
        ],
        answer: 1,
        explanation: '@RestController는 @Controller와 @ResponseBody를 합친 것으로, 메서드의 반환값이 뷰 이름이 아니라 HTTP 응답 본문(Body)으로 직접 전달된다. Jackson이 자동으로 Java 객체를 JSON으로 변환한다.'
      },
      {
        question: '다음 코드에서 GET /users/search?name=홍길동 요청을 처리하려면 빈칸에 들어갈 어노테이션은?',
        choices: [
          '@PathVariable',
          '@RequestBody',
          '@RequestParam',
          '@RequestHeader',
          '@ModelAttribute',
        ],
        answer: 2,
        explanation: '쿼리 파라미터(?name=홍길동)로 전달되는 값은 @RequestParam을 사용하여 받는다. @PathVariable은 경로 변수(/users/1), @RequestHeader는 HTTP 헤더 값을 받을 때 사용한다.'
      },
      {
        question: '다음 코드의 실행 결과로 올바른 것은?\nGET /users/-1/detail 요청 시 반환되는 HTTP 상태코드는?',
        choices: [
          '200 OK',
          '201 Created',
          '400 Bad Request',
          '404 Not Found',
          '500 Internal Server Error',
        ],
        answer: 2,
        explanation: 'id가 -1이므로 id <= 0 조건이 참이 되어 ResponseEntity.badRequest().build()가 실행된다. badRequest()는 HTTP 400 상태코드를 반환한다.'
      },
      {
        question: 'Java의 record를 DTO로 사용하는 것에 대한 설명으로 올바르지 않은 것은?',
        choices: [
          'record로 선언하면 private final 필드가 자동 생성된다',
          '생성자, getter, equals(), hashCode(), toString()이 자동 생성된다',
          'record는 Java 16에서 도입되었다',
          'record의 getter 메서드는 getName() 형태로 생성된다',
          'record는 불변(immutable) 데이터 객체이다',
        ],
        answer: 3,
        explanation: 'record의 getter 메서드는 getName()이 아니라 name()과 같이 필드 이름 그대로 생성된다. 예를 들어 User(Long id, String name, String email)이면 id(), name(), email() 메서드가 생성된다.'
      },
      {
        question: '같은 경로 /pages/users에서 HTML과 JSON을 구분하여 응답하기 위해 사용하는 @GetMapping의 속성은?',
        choices: [
          'consumes',
          'produces',
          'headers',
          'params',
          'method',
        ],
        answer: 1,
        explanation: 'produces 속성은 해당 엔드포인트가 생성(produce)하는 응답의 미디어 타입을 지정한다. 클라이언트의 Accept 헤더에 따라 적절한 메서드가 호출된다. consumes는 요청 본문의 타입을 지정할 때 사용한다.'
      },
    ]
  },
  {
    week: 2,
    title: '2주차 퀴즈: POST/PUT/DELETE, Swagger, 예외처리',
    questions: [
      {
        question: '@RestControllerAdvice와 @ExceptionHandler를 사용한 전역 예외 처리가 필요한 이유로 가장 적절한 것은?',
        choices: [
          'Spring Boot에서 예외 처리 없이는 컴파일이 되지 않기 때문이다',
          '모든 컨트롤러에서 같은 형태의 에러 응답을 통일하고, Controller에서 예외 처리 코드를 제거하여 깔끔하게 만들기 위해서이다',
          '데이터베이스 롤백을 자동으로 처리하기 위해서이다',
          'HTTP 상태 코드를 사용하지 않기 위해서이다',
          'Swagger 문서 자동 생성을 위해서이다',
        ],
        answer: 1,
        explanation: '전역 예외 처리는 에러 응답 형식을 통일하고, 개별 Controller에서 반복되는 try-catch와 예외 처리 로직을 제거하여 비즈니스 로직에 집중할 수 있게 한다. DB 롤백은 @Transactional의 역할이며, 전역 예외 처리와는 별개이다.'
      },
      {
        question: '커스텀 예외 클래스를 만들 때 RuntimeException을 상속하는 이유로 올바른 것은?',
        choices: [
          'RuntimeException만 Spring에서 처리할 수 있기 때문이다',
          'RuntimeException은 Checked Exception이라 컴파일 시점에 에러를 잡을 수 있기 때문이다',
          'RuntimeException은 Unchecked Exception이라 throws 선언 없이 어디서든 던질 수 있어 코드가 깔끔해지기 때문이다',
          'RuntimeException을 상속하면 자동으로 HTTP 500 응답이 되기 때문이다',
          'RuntimeException은 try-catch를 반드시 작성해야 하므로 안전하기 때문이다',
        ],
        answer: 2,
        explanation: 'RuntimeException은 Unchecked Exception으로, throws 선언 없이 어디서든 자유롭게 던질 수 있어 코드가 깔끔해진다. Spring의 @ExceptionHandler가 이를 자동으로 잡아서 처리해준다. Checked Exception은 반드시 try-catch나 throws 선언이 필요하다.'
      },
      {
        question: 'Swagger(OpenAPI)를 Spring Boot 프로젝트에 도입하는 이유로 가장 적절하지 않은 것은?',
        choices: [
          'API 명세를 코드와 함께 관리하여 문서와 실제 동작의 불일치를 줄일 수 있다',
          'Swagger UI에서 바로 API를 호출해 볼 수 있어 Postman 없이 테스트가 가능하다',
          '프론트엔드 개발자에게 API 사용법을 빠르게 공유할 수 있다',
          '어노테이션만 추가하면 별도의 문서 작성 없이 API 문서가 자동 생성된다',
          'Swagger를 사용하면 API 응답 속도가 빨라진다',
        ],
        answer: 4,
        explanation: 'Swagger는 API 문서화와 테스트 도구이며, 응답 속도와는 관계가 없다. 코드와 문서를 함께 관리할 수 있고, 자동 생성되며, UI에서 바로 호출해볼 수 있는 등 개발 생산성을 높이는 것이 Swagger를 쓰는 이유이다.'
      },
      {
        question: 'HTTP 메서드와 CRUD 작업의 매핑으로 올바른 것은?',
        choices: [
          'GET - Create, POST - Read, PUT - Update, DELETE - Delete',
          'GET - Read, POST - Create, PUT - Delete, DELETE - Update',
          'GET - Read, POST - Create, PUT - Update, DELETE - Delete',
          'GET - Read, POST - Update, PUT - Create, DELETE - Delete',
          'GET - Create, POST - Delete, PUT - Read, DELETE - Update',
        ],
        answer: 2,
        explanation: 'REST API에서 GET은 조회(Read), POST는 생성(Create), PUT은 수정(Update), DELETE는 삭제(Delete)에 대응한다.'
      },
      {
        question: '클라이언트가 보낸 JSON 요청 본문을 Java 객체로 변환하기 위해 사용하는 어노테이션은?',
        choices: [
          '@RequestParam',
          '@PathVariable',
          '@RequestBody',
          '@RequestHeader',
          '@ModelAttribute',
        ],
        answer: 2,
        explanation: '@RequestBody는 HTTP 요청 본문(Body)의 JSON 데이터를 Jackson을 통해 Java 객체로 자동 변환한다. @RequestParam은 쿼리 파라미터, @PathVariable은 경로 변수를 받을 때 사용한다.'
      },
      {
        question: 'POST 요청으로 새 리소스를 생성했을 때 반환 가능한 HTTP 상태코드를 모두 고르면? (복수 정답)',
        choices: [
          '200 OK',
          '201 Created',
          '204 No Content',
          '301 Moved Permanently',
          '404 Not Found',
        ],
        answer: [0, 1],
        explanation: '새 리소스가 성공적으로 생성되었을 때는 201 Created를 반환하는 것이 REST API의 관례이지만, 실무에서는 일반적인 성공 응답인 200 OK를 사용하는 경우도 많다. 둘 다 허용 가능한 응답이다. 204 No Content는 응답 본문이 없을 때(주로 DELETE 성공 시) 사용한다.'
      },
      {
        question: '다음 코드에서 DELETE 요청이 성공했을 때 반환되는 응답으로 올바른 것은?',
        choices: [
          '200 OK와 삭제된 유저 정보',
          '201 Created와 빈 응답',
          '204 No Content와 빈 응답 본문',
          '404 Not Found와 에러 메시지',
          '400 Bad Request와 에러 메시지',
        ],
        answer: 2,
        explanation: '삭제가 성공하면 ResponseEntity.noContent().build()가 실행되어 204 No Content가 반환된다. ResponseEntity<Void>로 선언되어 응답 본문이 없음을 명시한다.'
      },
      {
        question: 'Swagger UI를 Spring Boot 프로젝트에 추가하기 위해 build.gradle에 추가해야 하는 의존성은?',
        choices: [
          'org.springframework.boot:spring-boot-starter-swagger',
          'io.springfox:springfox-boot-starter',
          'org.springdoc:springdoc-openapi-starter-webmvc-ui',
          'org.springframework.boot:spring-boot-starter-openapi',
          'io.swagger:swagger-spring-boot-starter',
        ],
        answer: 2,
        explanation: '본 강의에서는 org.springdoc:springdoc-openapi-starter-webmvc-ui:3.0.1 의존성을 추가하여 Swagger UI를 활성화한다. 이 한 줄만 추가하면 Swagger UI가 자동으로 사용 가능해진다.'
      },
      {
        question: 'Swagger 어노테이션과 그 역할의 연결로 올바르지 않은 것은?',
        choices: [
          '@Tag - 컨트롤러를 그룹으로 묶어 분류',
          '@Operation - API의 요약(summary)과 설명(description)',
          '@Parameter - 파라미터의 설명과 예시값',
          '@ApiResponse - 응답 코드별 설명',
          '@Tag - 개별 API 메서드의 요약 설명',
        ],
        answer: 4,
        explanation: '@Tag는 클래스 레벨에 사용하여 컨트롤러를 그룹으로 분류하는 역할을 한다. 개별 API 메서드의 요약 설명은 @Operation의 summary 속성을 사용한다.'
      },
      {
        question: '다음 GlobalExceptionHandler 코드에서, 존재하지 않는 유저 ID로 조회 시 반환되는 응답의 형태로 올바른 것은?',
        choices: [
          '{"status": 400, "error": "Bad Request", "message": "..."}',
          '{"status": 404, "error": "Not Found", "message": "유저를 찾을 수 없습니다. ID: 999"}',
          '{"error": "UserNotFoundException"}',
          'null',
          '{"status": 500, "error": "Internal Server Error", "message": "..."}',
        ],
        answer: 1,
        explanation: 'UserNotFoundException이 발생하면 handleUserNotFound 메서드가 호출되어 404 상태코드와 함께 ErrorResponse 형태의 통일된 에러 응답이 반환된다. ErrorResponse는 status, error, message, timestamp 필드를 포함한다.'
      },
    ]
  },
  {
    week: 3,
    title: '3주차 퀴즈: 로깅, Profile, Actuator (Step 7-9)',
    questions: [
      {
        question: 'System.out.println() 대신 로깅 프레임워크를 사용해야 하는 이유로 적절하지 않은 것은?',
        choices: [
          '로그 레벨로 출력을 제어할 수 있다',
          '콘솔뿐만 아니라 파일, 원격 서버 등 다양한 출력 대상을 지원한다',
          '시간, 스레드 정보가 자동으로 포함된다',
          '레벨 미달 시 로그 실행 비용이 0이다',
          '별도의 의존성 없이 Java 기본 라이브러리만으로 사용할 수 있다',
        ],
        answer: 4,
        explanation: 'SLF4J + Logback은 Spring Boot에 기본 포함되어 별도 추가가 필요 없지만, Java 기본 라이브러리가 아니라 별도의 로깅 프레임워크이다. System.out.println()이 오히려 Java 기본 기능이며, 레벨 제어·출력 대상 다양화·메타 정보 자동 포함·Lazy 평가 등의 이점을 제공하지 못한다.'
      },
      {
        question: 'Spring Profile을 도입하는 이유로 가장 적절한 것은?',
        choices: [
          '개발 환경과 운영 환경에서 포트, DB, 로그 레벨 등의 설정을 코드 수정 없이 전환하기 위해서이다',
          'Java 컴파일 속도를 향상시키기 위해서이다',
          '하나의 파일에 모든 환경 설정을 몰아넣어 관리를 단순화하기 위해서이다',
          '테스트 코드를 자동으로 생성하기 위해서이다',
          'Spring Boot 애플리케이션을 여러 개 띄우기 위해 필수로 필요하기 때문이다',
        ],
        answer: 0,
        explanation: 'Spring Profile은 환경별(dev, prod, test 등)로 설정을 분리하여 코드를 수정하지 않고 실행 인자(--spring.profiles.active=prod)만 바꿔서 환경을 전환할 수 있게 한다. 개발 DB와 운영 DB, 로그 레벨, 포트 등 환경마다 달라져야 하는 값을 안전하게 관리할 수 있다.'
      },
      {
        question: '운영(prod) 환경에서 Actuator 엔드포인트를 health와 info만 노출하는 이유로 가장 적절한 것은?',
        choices: [
          '다른 엔드포인트는 prod 환경에서 동작하지 않기 때문이다',
          'metrics, env, beans 등이 외부에 노출되면 서버 내부 정보가 유출되어 보안 위험이 있기 때문이다',
          '엔드포인트가 많으면 서버 성능이 크게 저하되기 때문이다',
          'health와 info 외의 엔드포인트는 유료 기능이기 때문이다',
          'Spring Boot 라이선스 정책에 따라 운영 환경에서는 제한되기 때문이다',
        ],
        answer: 1,
        explanation: 'Actuator는 서버 내부 정보를 노출한다. metrics, env, beans 등이 외부에 노출되면 보안 위험이 있으므로, 운영 환경에서는 꼭 필요한 health와 info만 노출하도록 설정한다.'
      },
      {
        question: 'SLF4J와 Logback의 관계를 올바르게 설명한 것은?',
        choices: [
          'SLF4J는 구현체이고, Logback은 인터페이스이다',
          'SLF4J는 로깅 API의 추상화 계층(인터페이스)이고, Logback은 실제 로그를 출력하는 구현체이다',
          'SLF4J와 Logback은 동일한 라이브러리의 다른 이름이다',
          'Logback은 SLF4J 없이는 단독으로 사용할 수 없다',
          'SLF4J는 파일 출력만, Logback은 콘솔 출력만 담당한다',
        ],
        answer: 1,
        explanation: 'SLF4J는 로깅 API의 추상화 계층(인터페이스) 역할을 하고, Logback은 실제 로그를 출력하는 구현체이다. 코드 -> SLF4J(인터페이스) -> Logback(구현체) 구조로 동작한다.'
      },
      {
        question: '로그 레벨을 INFO로 설정했을 때, 출력되는 로그 레벨의 조합으로 올바른 것은?',
        choices: [
          'INFO만 출력',
          'TRACE, DEBUG, INFO 출력',
          'INFO, WARN, ERROR 출력',
          'DEBUG, INFO, WARN, ERROR 출력',
          'TRACE, DEBUG, INFO, WARN, ERROR 모두 출력',
        ],
        answer: 2,
        explanation: '로그 레벨은 TRACE < DEBUG < INFO < WARN < ERROR 순이며, 설정한 레벨 이상만 출력된다. INFO로 설정하면 INFO, WARN, ERROR가 출력된다.'
      },
      {
        question: '다음 코드에서 빈칸에 들어갈 내용으로 올바른 것은?',
        choices: [
          'e.toString()',
          'e.getStackTrace()',
          'e',
          'e.getCause()',
          'e.printStackTrace()',
        ],
        answer: 2,
        explanation: 'log.error("메시지", e) 처럼 마지막 인자로 예외 객체 e를 넘기면 스택트레이스가 자동으로 출력된다. e.printStackTrace()를 호출하면 System.err로 직접 출력되므로 로깅 프레임워크의 장점을 활용하지 못한다.'
      },
      {
        question: 'logback-spring.xml에서 Rolling File Appender의 역할로 올바른 것은?',
        choices: [
          '로그를 콘솔에 컬러로 출력한다',
          '로그를 단일 파일에 계속 추가한다',
          '날짜와 크기 기반으로 로그 파일을 자동 분할하고 오래된 파일을 삭제한다',
          '로그를 원격 서버에 전송한다',
          '로그 파일을 암호화하여 저장한다',
        ],
        answer: 2,
        explanation: 'Rolling File Appender는 로그 파일이 너무 커지지 않도록 날짜+크기 기반으로 자동 분할하고 오래된 파일을 삭제해주는 설정이다. 강의에서는 파일 하나 최대 10MB, 최대 30일 보관, 전체 로그 최대 1GB로 설정했다.'
      },
      {
        question: 'Spring Profile에 대한 설명으로 올바르지 않은 것은?',
        choices: [
          'application-dev.properties와 application-prod.properties로 환경별 설정을 분리할 수 있다',
          'spring.profiles.active=dev로 활성 프로필을 지정한다',
          '프로필별 설정 파일의 네이밍 규칙은 application-{프로필명}.properties이다',
          '코드를 수정해야만 프로필을 전환할 수 있다',
          'logback-spring.xml에서 <springProfile> 태그로 환경별 로그 설정을 적용할 수 있다',
        ],
        answer: 3,
        explanation: '프로필 전환은 코드 수정 없이 실행 인자(--spring.profiles.active=prod)만 바꾸면 된다. 이것이 Profile의 핵심 장점이다.'
      },
      {
        question: 'Spring Boot Actuator의 /actuator/health 엔드포인트에 커스텀 항목을 추가하려면 어떻게 해야 하는가?',
        choices: [
          'application.properties에 커스텀 health 항목을 선언한다',
          'HealthIndicator 인터페이스를 구현한 클래스를 @Component로 등록한다',
          '@HealthCheck 어노테이션을 사용한다',
          'logback-spring.xml에 health 항목을 추가한다',
          '@RestController에 /actuator/health 엔드포인트를 직접 정의한다',
        ],
        answer: 1,
        explanation: 'HealthIndicator 인터페이스를 구현한 빈을 @Component로 등록하면 Actuator가 자동으로 감지한다. 클래스 이름에서 HealthIndicator를 뗀 나머지가 항목 이름이 된다(예: UserHealthIndicator -> "user").'
      },
      {
        question: '다음 코드에서 user.created.count 메트릭의 역할로 올바른 것은?',
        choices: [
          '현재 접속 중인 유저 수를 실시간으로 표시한다',
          '유저 생성 API의 응답 시간을 측정한다',
          '유저 생성이 호출될 때마다 누적 카운트를 증가시킨다',
          '유저 삭제 횟수를 추적한다',
          '유저 생성 요청의 실패 횟수만 추적한다',
        ],
        answer: 2,
        explanation: 'Counter는 누적 카운트 메트릭으로, 숫자가 계속 올라가기만 하는 측정값이다. userCreateCounter.increment()가 호출될 때마다 유저 생성 횟수가 1씩 증가한다.'
      },
    ]
  },
  {
    week: 4,
    title: '4주차 퀴즈: 계층분리, 제네릭 Repository, JPA (Step 10-12)',
    questions: [
      {
        question: '계층을 분리하지 않고 Controller 하나에 모든 로직을 넣었을 때 발생하는 문제로 적절하지 않은 것은?',
        choices: [
          'HTTP 요청 없이 비즈니스 로직만 테스트하기 어렵다',
          '같은 로직을 다른 Controller에서 재사용하려면 복사해야 한다',
          '저장소를 바꾸면 Controller까지 수정해야 한다',
          '애플리케이션의 실행 속도가 크게 느려진다',
          '한 파일에 HTTP 처리, 비즈니스 로직, 데이터 접근이 섞여 가독성이 떨어진다',
        ],
        answer: 3,
        explanation: '계층 분리는 코드의 구조와 유지보수성에 관한 것이지, 실행 속도와는 직접적인 관계가 없다. 계층을 분리하지 않아도 실행 속도 자체가 크게 느려지지는 않는다.'
      },
      {
        question: '다음 코드에서 UserService가 UserRepository 인터페이스에 의존하는 이유로 가장 적절한 것은?',
        choices: [
          'Java에서는 클래스 간 직접 의존이 금지되어 있기 때문이다',
          '인터페이스를 사용하면 코드 실행 속도가 빨라지기 때문이다',
          '구현체가 바뀌어도(Memory -> JDBC -> JPA) Service 코드를 수정할 필요가 없기 때문이다',
          'Spring에서 인터페이스 없이는 빈 등록이 불가능하기 때문이다',
          '인터페이스를 사용해야만 로깅 기능을 추가할 수 있기 때문이다',
        ],
        answer: 2,
        explanation: 'Repository를 인터페이스로 정의하면 구현체(MemoryUserRepository, JdbcUserRepository, JpaUserRepository)를 교체할 수 있다. Service는 인터페이스에만 의존하므로 구현체가 바뀌어도 코드 수정이 필요 없다. 이것이 DI(의존성 주입)를 통한 의존성 역전 원칙이다.'
      },
      {
        question: 'MemoryUserRepository에서 ConcurrentHashMap과 AtomicLong을 사용하는 이유는?',
        choices: [
          '일반 HashMap과 long보다 메모리를 적게 사용하기 때문이다',
          '여러 요청이 동시에 와도 안전하게 데이터를 저장하고 ID를 생성하기 위해서이다',
          'Spring에서 @Repository 사용 시 필수로 요구하는 자료구조이기 때문이다',
          '데이터베이스와의 연결을 관리하기 위해서이다',
          'JSON 직렬화 성능이 더 좋기 때문이다',
        ],
        answer: 1,
        explanation: 'ConcurrentHashMap은 멀티스레드 환경에서 안전한 Map이고, AtomicLong은 동시 요청에도 안전하게 숫자를 증가시키는 도구이다. 웹 서버는 여러 요청이 동시에 들어오므로 스레드 안전한 자료구조가 필요하다.'
      },
      {
        question: '다음 코드에서 UserRepository가 findByNameContaining만 선언한 이유는?',
        choices: [
          '나머지 메서드는 아직 구현되지 않았기 때문이다',
          'findAll, findById, save 등 기본 CRUD는 CrudRepository를 상속받아 자동으로 제공되기 때문이다',
          '커스텀 메서드만 인터페이스에 선언할 수 있는 Java 규칙 때문이다',
          'Spring이 기본 CRUD 메서드 선언을 금지하기 때문이다',
          '성능 최적화를 위해 필요한 메서드만 선언한 것이다',
        ],
        answer: 1,
        explanation: 'CrudRepository<User, Long>을 extends하면 findAll, findById, save, deleteById, existsById, count 등 기본 CRUD 메서드가 상속으로 자동 제공된다. 따라서 커스텀 메서드(findByNameContaining)만 추가로 선언하면 된다.'
      },
      {
        question: 'JPA Entity에 record 대신 class를 사용해야 하는 이유로 올바른 것은?',
        choices: [
          'record는 Java에서 deprecated 예정이기 때문이다',
          'record는 불변(immutable)이라 setter가 없고, JPA가 필드를 변경하거나 기본 생성자로 객체를 생성할 수 없기 때문이다',
          'record는 데이터베이스 연결을 지원하지 않기 때문이다',
          'record는 어노테이션을 붙일 수 없기 때문이다',
          'record는 Spring Boot에서 지원하지 않는 문법이기 때문이다',
        ],
        answer: 1,
        explanation: 'JPA는 기본 생성자로 빈 객체를 생성한 후 Reflection으로 필드를 설정하고, 변경 감지(Dirty Checking)를 수행한다. record는 불변이므로 setter가 없고 필드를 변경할 수 없어 JPA Entity로 사용할 수 없다.'
      },
      {
        question: '3계층 아키텍처에서 각 계층의 역할이 올바르게 연결된 것은?',
        choices: [
          'Controller - 비즈니스 로직, Service - HTTP 처리, Repository - 데이터 접근',
          'Controller - 데이터 접근, Service - HTTP 처리, Repository - 비즈니스 로직',
          'Controller - HTTP 요청/응답, Service - 비즈니스 로직, Repository - 데이터 접근',
          'Controller - HTTP 요청/응답, Service - 데이터 접근, Repository - 비즈니스 로직',
          'Controller - 비즈니스 로직, Service - 데이터 접근, Repository - HTTP 처리',
        ],
        answer: 2,
        explanation: 'Controller는 HTTP 요청 수신과 응답 반환을 담당하고, Service는 비즈니스 로직(검증, 예외 처리, 로깅)을 담당하며, Repository는 데이터 저장/조회/수정/삭제(CRUD)를 담당한다.'
      },
      {
        question: '제네릭 CrudRepository<T, ID>에서 T와 ID의 의미로 올바른 것은?',
        choices: [
          'T는 테이블 이름, ID는 인덱스 번호이다',
          'T는 저장할 엔티티 타입, ID는 기본키 타입이다',
          'T는 트랜잭션 타입, ID는 식별자 문자열이다',
          'T는 스레드 타입, ID는 데이터베이스 연결 번호이다',
          'T는 타임스탬프, ID는 고유 식별 코드이다',
        ],
        answer: 1,
        explanation: '제네릭에서 T는 엔티티 타입(User, Product 등), ID는 기본키 타입(Long, String, UUID 등)을 의미한다. 이를 통해 하나의 인터페이스로 모든 엔티티의 기본 CRUD를 정의할 수 있다.'
      },
      {
        question: '다음 UserService 코드에서 @Transactional 관련 설명으로 올바른 것은?',
        choices: [
          'getAllUsers()는 @Transactional이 적용되지 않는다',
          'createUser()는 readOnly = true가 적용된다',
          'getAllUsers()는 클래스 레벨의 readOnly = true가 적용되고, createUser()와 deleteUser()는 메서드 레벨의 @Transactional(readOnly = false)이 적용된다',
          '모든 메서드에 readOnly = true가 적용된다',
          'deleteUser()는 트랜잭션 없이 실행된다',
        ],
        answer: 2,
        explanation: '클래스 레벨에 @Transactional(readOnly = true)를 선언하면 모든 메서드에 기본 적용된다. 하지만 createUser()와 deleteUser()처럼 메서드 레벨에 @Transactional을 별도로 선언하면 해당 메서드는 readOnly = false로 오버라이드된다.'
      },
      {
        question: 'Spring Data JPA를 도입했을 때 삭제해도 되는 파일은?',
        choices: [
          'CrudRepository.java만 삭제',
          'MemoryUserRepository.java만 삭제',
          'CrudRepository.java와 MemoryUserRepository.java 모두 삭제',
          'UserRepository.java와 MemoryUserRepository.java 모두 삭제',
          '모든 파일을 삭제하고 새로 작성해야 한다',
        ],
        answer: 2,
        explanation: 'Spring Data JPA를 사용하면 CrudRepository는 Spring Data의 JpaRepository로 대체되고, MemoryUserRepository는 Spring이 프록시로 자동 생성하므로 구현 클래스가 불필요하다. UserRepository는 JpaRepository<UserEntity, Long>을 상속하도록 수정하여 유지한다.'
      },
      {
        question: '다음 JPA 설정에서 spring.jpa.hibernate.ddl-auto=update의 의미로 올바른 것은?',
        choices: [
          '애플리케이션 시작 시 기존 테이블을 모두 삭제하고 새로 생성한다',
          '엔티티 기반으로 테이블을 자동 생성하거나 변경된 부분만 수정한다',
          '엔티티와 테이블 구조가 일치하는지 검증만 하고, 불일치 시 에러를 발생시킨다',
          'DDL 실행을 완전히 비활성화한다',
          '데이터베이스의 모든 데이터를 업데이트한다',
        ],
        answer: 1,
        explanation: 'ddl-auto=update는 엔티티 기반으로 테이블을 자동 생성하거나, 변경된 부분(새 컬럼 등)만 수정한다. 이는 개발(dev) 환경에서 사용하며, 운영(prod) 환경에서는 validate(검증만)를 사용한다.'
      },
    ]
  },
  {
    week: 5,
    title: '5주차 퀴즈: 네이버 API, JWT 인증, Pageable',
    questions: [
      {
        question: '세션 방식 대신 JWT(JSON Web Token)로 인증을 구현하는 이유로 가장 적절한 것은?',
        choices: [
          'JWT는 세션보다 암호화 강도가 높아 보안이 우수하기 때문이다',
          '서버가 세션 상태를 저장하지 않아도 되는 Stateless 방식이라, 서버 확장(Scale-out)이 쉽고 여러 서버에서 공유가 필요 없기 때문이다',
          'JWT는 브라우저의 쿠키 저장 용량 제한을 받지 않기 때문이다',
          'JWT는 Spring Security 없이는 사용할 수 없어 보안성이 보장되기 때문이다',
          '세션은 모바일 앱에서 동작하지 않기 때문이다',
        ],
        answer: 1,
        explanation: 'JWT의 가장 큰 장점은 Stateless(무상태) 방식이라는 점이다. 서버가 세션을 저장하지 않으므로 서버를 여러 대로 확장해도 세션 공유 문제가 없고, 토큰 자체에 사용자 정보가 담겨 있어 인증 상태를 서버 간에 공유할 필요가 없다. 암호화가 아닌 서명(Signature)으로 위변조만 검증한다.'
      },
      {
        question: 'Spring 6.1에서 RestClient가 새로 도입되어 권장되는 이유로 가장 적절한 것은?',
        choices: [
          'RestTemplate보다 훨씬 빠른 성능을 제공하기 때문이다',
          'RestTemplate은 유지보수 모드이고, RestClient는 WebClient와 유사한 간결한 Fluent API를 동기 방식으로 제공하기 때문이다',
          'RestClient만 JSON 응답을 파싱할 수 있기 때문이다',
          'RestTemplate은 Spring Boot 4에서 완전히 삭제되었기 때문이다',
          'RestClient는 비동기 처리를 지원하기 때문이다',
        ],
        answer: 1,
        explanation: 'RestTemplate은 유지보수 모드(새 기능 추가 없음)이며, WebClient는 비동기/리액티브 방식이다. RestClient는 Spring 6.1에서 도입된 동기 HTTP 클라이언트로, WebClient와 비슷한 Fluent API(체이닝 방식)를 제공하면서도 동기 코드로 작성할 수 있어 가장 권장되는 선택이다.'
      },
      {
        question: 'API 키 같은 민감한 정보를 Spring Boot에서 안전하게 관리하기 위해 사용하는 어노테이션은?',
        choices: [
          '@Autowired',
          '@Resource',
          '@Value',
          '@ConfigurationProperties',
          '@Inject',
        ],
        answer: 2,
        explanation: '@Value("${naver.client-id}")와 같이 application.properties의 값을 필드에 주입받을 수 있다. 환경변수 폴백(${ENV_VAR:default})과 함께 사용하면 API 키를 소스코드에 직접 넣지 않고 안전하게 관리할 수 있다.'
      },
      {
        question: '수동 페이징(stream().skip().limit())과 비교했을 때 Spring Data JPA의 Pageable이 효율적인 이유로 가장 적절한 것은?',
        choices: [
          'Java의 Stream API가 Pageable보다 느리기 때문이다',
          'DB 레벨에서 LIMIT/OFFSET으로 필요한 데이터만 조회하여 메모리를 절약하기 때문이다',
          'Pageable은 캐시를 자동으로 사용하기 때문이다',
          '수동 페이징은 정렬을 지원하지 않기 때문이다',
          'Pageable은 비동기로 동작하기 때문이다',
        ],
        answer: 1,
        explanation: '수동 페이징은 전체 데이터를 DB에서 메모리로 로드한 뒤 Java에서 잘라내므로 비효율적이다. Pageable은 DB에서 LIMIT/OFFSET 쿼리로 필요한 페이지의 데이터만 가져오고, COUNT 쿼리도 자동 실행하여 totalElements를 제공한다.'
      },
      {
        question: 'Spring Boot에서 외부 API를 호출할 때 사용하는 동기 HTTP 클라이언트로, Spring 6.1에서 도입되어 현재 권장되는 것은?',
        choices: [
          'WebClient',
          'RestTemplate',
          'RestClient',
          'HttpClient',
          'FeignClient',
        ],
        answer: 2,
        explanation: 'RestClient는 Spring 6.1+에서 도입된 동기 HTTP 클라이언트로, RestTemplate의 후속이다. WebClient는 비동기/리액티브 방식이고, RestTemplate은 유지보수 모드이다.'
      },
      {
        question: '네이버 쇼핑 검색 API를 호출할 때 인증을 위해 HTTP 요청 헤더에 포함해야 하는 것은?',
        choices: [
          'Authorization: Bearer {token}',
          'X-Naver-Client-Id와 X-Naver-Client-Secret',
          'Cookie에 세션 ID',
          'X-API-Key와 X-API-Secret',
          'Content-Type: application/json',
        ],
        answer: 1,
        explanation: '네이버 쇼핑 검색 API는 요청 헤더에 X-Naver-Client-Id와 X-Naver-Client-Secret을 포함하여 인증한다.'
      },
      {
        question: 'JWT(JSON Web Token)의 구조로 올바른 것은?',
        choices: [
          'Username.Password.Token',
          'Header.Payload.Signature',
          'Key.Value.Hash',
          'Token.Claims.Secret',
          'Issuer.Subject.Audience',
        ],
        answer: 1,
        explanation: 'JWT는 점(.)으로 구분된 Header(알고리즘/타입), Payload(클레임 데이터), Signature(서명) 3개의 파트로 구성된다.'
      },
      {
        question: 'JWT의 Payload에 대한 설명으로 올바른 것은?',
        choices: [
          '비밀키로 암호화되어 있어 내용을 읽을 수 없다',
          'Base64URL로 인코딩되어 있어 누구나 디코딩하여 읽을 수 있다',
          '바이너리 형식으로 저장되어 파싱이 불가능하다',
          '서버의 비밀키 없이는 디코딩할 수 없다',
          'Header와 동일한 알고리즘 정보를 담고 있다',
        ],
        answer: 1,
        explanation: 'Payload는 암호화가 아니라 Base64URL 인코딩이다. 누구나 디코딩하여 내용을 읽을 수 있으므로 비밀번호 같은 민감 정보는 넣으면 안 된다.'
      },
      {
        question: 'Spring Data JPA에서 Pageable을 사용할 때, 페이지 번호는 몇부터 시작하는가?',
        choices: [
          '-1',
          '0',
          '1',
          '임의로 설정 가능하며 기본값은 없다',
          '10',
        ],
        answer: 1,
        explanation: 'Pageable의 페이지 번호는 0부터 시작한다. GET /users?page=0&size=10은 첫 번째 페이지의 10건을 조회한다.'
      },
      {
        question: '다음 코드에서 환경변수 NAVER_CLIENT_ID가 설정되지 않았을 때 clientId에 주입되는 값은?',
        choices: [
          'null',
          '빈 문자열 ("")',
          'your-client-id',
          'NAVER_CLIENT_ID',
          '애플리케이션 시작 시 에러 발생',
        ],
        answer: 2,
        explanation: '${NAVER_CLIENT_ID:your-client-id} 구문에서 콜론(:) 뒤의 값은 환경변수가 없을 때 사용되는 기본값(폴백)이다. 환경변수가 없으면 your-client-id가 주입된다.'
      },
      {
        question: '다음 JWT 검증 코드에서 validateToken이 false를 반환하는 경우가 아닌 것은?',
        choices: [
          '토큰이 2개의 파트로만 구성된 경우',
          '토큰의 Payload가 변조된 경우',
          '토큰의 만료 시간이 지난 경우',
          '토큰이 정상적이고 만료되지 않은 경우',
          '토큰의 Signature가 변조된 경우',
        ],
        answer: 3,
        explanation: '토큰이 3개의 파트로 구성되고, 서명이 일치하며, 만료 시간이 지나지 않았다면 validateToken은 true를 반환한다. 나머지 보기들은 모두 false를 반환하는 경우이다.'
      },
      {
        question: '다음 Controller 코드에서 GET /users?page=1&size=5&sort=name,asc 요청 시 실행되는 SQL로 가장 적절한 것은?',
        choices: [
          'SELECT * FROM users;',
          'SELECT * FROM users LIMIT 5;',
          'SELECT * FROM users ORDER BY name ASC LIMIT 5 OFFSET 5;',
          'SELECT * FROM users ORDER BY name ASC LIMIT 5 OFFSET 1;',
          'SELECT * FROM users WHERE page = 1 AND size = 5;',
        ],
        answer: 2,
        explanation: 'page=1, size=5이므로 두 번째 페이지(0부터 시작)를 요청한다. OFFSET = page  size = 1  5 = 5이고, LIMIT = size = 5이며, sort=name,asc에 의해 ORDER BY name ASC가 추가된다. 또한 totalElements 계산을 위한 SELECT COUNT(*) 쿼리도 자동 실행된다.'
      },
    ]
  },
  {
    week: 6,
    title: '6주차 퀴즈: CORS, 프론트엔드 연동',
    questions: [
      {
        question: 'CORS가 필요한 이유로 가장 적절한 것은?',
        choices: [
          '서버 간 통신을 암호화하기 위해',
          '브라우저의 Same-Origin Policy로 인해 다른 출처의 요청이 기본적으로 차단되기 때문에',
          'HTTP 프로토콜이 보안을 지원하지 않기 때문에',
          '백엔드 서버의 성능을 향상시키기 위해',
          '프론트엔드 코드의 빌드를 최적화하기 위해',
        ],
        answer: 1,
        explanation: '브라우저는 보안을 위해 Same-Origin Policy를 적용하여 다른 출처(Origin)의 요청을 기본적으로 차단한다. 프론트엔드(localhost:3000)와 백엔드(localhost:8080)처럼 포트가 다르면 다른 Origin으로 간주되어 CORS 설정이 필요하다.'
      },
      {
        question: '프론트엔드 연동 시, 주문(Order) API에서 userId를 클라이언트가 보내지 않고 JWT 토큰에서 서버가 추출하는 이유는?',
        choices: [
          '클라이언트가 userId를 모르기 때문이다',
          'userId를 URL에 포함시키면 길어지기 때문이다',
          '클라이언트가 보낸 userId를 신뢰하면 다른 유저로 위장 주문이 가능하기 때문이다',
          'JWT 토큰에 userId를 넣으면 전송 속도가 빨라지기 때문이다',
          'REST API 표준에서 userId를 body에 포함하는 것을 금지하기 때문이다',
        ],
        answer: 2,
        explanation: '클라이언트가 보낸 userId를 신뢰하면 다른 유저의 ID로 위장하여 주문을 생성할 수 있다. JWT 토큰에서 서버가 직접 userId를 추출하면 토큰 발급 시 인증된 유저만 해당 ID를 사용할 수 있어 보안이 확보된다.'
      },
      {
        question: '주문(Order) 테이블에 상품명(title), 이미지(image), 가격(price)을 별도로 저장하는(스냅샷) 이유는?',
        choices: [
          '네이버 API를 매번 호출하면 비용이 발생하기 때문이다',
          '외부 API의 상품 정보는 가격 변동, 삭제, 변경될 수 있어 주문 시점의 정보를 보존해야 하기 때문이다',
          '데이터베이스의 조인(JOIN) 성능을 향상시키기 위해서이다',
          '네이버 API 서버가 항상 가용하지 않기 때문이다',
          'Spring Data JPA에서 외부 API 데이터를 직접 참조할 수 없기 때문이다',
        ],
        answer: 1,
        explanation: '네이버 쇼핑 API의 상품 정보는 언제든 가격이 변동되거나, 상품이 삭제되거나, 상품명이 변경될 수 있다. 주문 테이블에 주문 시점의 상품 정보를 스냅샷으로 저장하면 "내가 주문할 때 가격이 얼마였는지"를 정확히 보존할 수 있다.'
      },
      {
        question: '프론트엔드와 백엔드를 분리하는 아키텍처(SPA + REST API)를 채택하는 이유로 가장 적절하지 않은 것은?',
        choices: [
          '프론트엔드와 백엔드를 독립적으로 개발·배포할 수 있어 역할 분담과 생산성이 높아진다',
          '하나의 백엔드 API가 웹, 모바일 앱, 외부 파트너 등 여러 클라이언트를 동시에 지원할 수 있다',
          '프론트엔드는 정적 리소스로 CDN 등에 배포하고, 백엔드는 API 서버에 집중할 수 있어 확장성이 좋아진다',
          '화면 이동 시 서버 렌더링이 필요 없어 사용자 경험(UX)을 개선할 수 있다',
          '브라우저의 Same-Origin Policy가 자동으로 해제되어 CORS 설정이 필요 없어진다',
        ],
        answer: 4,
        explanation: '오히려 프론트/백이 다른 도메인/포트로 분리되면 CORS 설정이 꼭 필요해진다. 분리 아키텍처의 장점은 독립 개발·배포, 다중 클라이언트 지원, 확장성, 나은 UX이다.'
      },
      {
        question: 'CORS 설정을 컨트롤러마다 @CrossOrigin 어노테이션으로 흩어 두지 않고, WebMvcConfigurer.addCorsMappings()로 전역 설정하는 이유로 가장 적절한 것은?',
        choices: [
          '@CrossOrigin은 Spring Boot 4에서 더 이상 지원되지 않기 때문이다',
          '전역 설정이 @CrossOrigin보다 성능이 훨씬 빠르기 때문이다',
          'CORS 정책을 한 곳에서 관리하여 정책 변경 시 여러 파일을 수정할 필요가 없고, 누락된 컨트롤러로 인한 보안 사고를 예방할 수 있기 때문이다',
          '@CrossOrigin은 GET 요청만 허용하기 때문이다',
          '전역 설정만 allowCredentials 옵션을 지원하기 때문이다',
        ],
        answer: 2,
        explanation: '@CrossOrigin은 개별 컨트롤러/메서드에 붙여서 쓸 수 있지만, 컨트롤러가 많아지면 정책이 일관되지 않거나 일부 컨트롤러에 누락될 수 있다. WebMvcConfigurer로 전역 설정하면 모든 API에 일관된 CORS 정책이 적용되어 유지보수와 보안 관점에서 유리하다.'
      },
      {
        question: 'Origin을 구성하는 요소의 조합으로 올바른 것은?',
        choices: [
          '호스트 + 포트 + 경로',
          '프로토콜 + 호스트 + 경로',
          '프로토콜 + 호스트 + 포트',
          '프로토콜 + 포트 + 쿼리스트링',
          '호스트 + 포트 + 쿠키',
        ],
        answer: 2,
        explanation: 'Origin은 프로토콜(http/https) + 호스트(localhost, example.com) + 포트(3000, 8080)로 구성된다. 이 중 하나라도 다르면 다른 Origin으로 간주된다.'
      },
      {
        question: '브라우저가 Preflight(사전 확인) 요청을 보내는 경우가 아닌 것은?',
        choices: [
          'PUT 메서드로 요청할 때',
          'DELETE 메서드로 요청할 때',
          'Content-Type이 application/json인 POST 요청',
          '기본 헤더만 사용하는 단순 GET 요청',
          'Custom 헤더(Authorization 등)를 포함한 요청',
        ],
        answer: 3,
        explanation: '기본 헤더만 사용하는 GET, HEAD 요청은 Simple Request로 분류되어 Preflight 없이 바로 요청이 전송된다. PUT, DELETE, application/json Content-Type, Custom 헤더가 포함된 요청은 Preflight(OPTIONS) 요청이 먼저 전송된다.'
      },
      {
        question: '다음 Spring Boot CORS 설정에서 에러가 발생하는 부분은?',
        choices: [
          '(1) - addMapping에 /**를 사용할 수 없다',
          '(2) - allowedMethods에 여러 메서드를 지정할 수 없다',
          '(1)과 (4) - allowedOrigins("*")와 allowCredentials(true)는 함께 사용할 수 없다',
          '(3) - allowedHeaders에 *를 사용할 수 없다',
          '(5) - maxAge에 3600은 너무 큰 값이다',
        ],
        answer: 2,
        explanation: 'allowCredentials(true)를 사용하면 보안상 allowedOrigins("*")는 사용할 수 없다. 모든 출처를 허용하면서 인증 정보도 허용하면 위험하기 때문이다. 반드시 특정 Origin(예: "http://localhost:3000")을 명시해야 한다.'
      },
      {
        question: 'CORS 설정에서 maxAge(3600)의 역할은?',
        choices: [
          '서버의 응답 타임아웃을 3600초로 설정한다',
          'JWT 토큰의 만료 시간을 3600초로 설정한다',
          'Preflight(OPTIONS) 요청의 결과를 3600초(1시간) 동안 캐시한다',
          '클라이언트의 연결을 3600초 동안 유지한다',
          'CORS 정책의 유효 기간을 3600초로 제한한다',
        ],
        answer: 2,
        explanation: 'maxAge는 Preflight(OPTIONS) 요청의 결과를 브라우저가 캐시하는 시간(초)이다. 3600초(1시간)으로 설정하면 같은 요청에 대해 매번 OPTIONS 요청을 보내지 않아 성능이 향상된다.'
      },
      {
        question: '다음 OrderRepository의 메서드명에서 Spring Data JPA가 자동으로 생성하는 SQL 쿼리로 올바른 것은?',
        choices: [
          'SELECT * FROM orders WHERE ordered_at DESC',
          'SELECT * FROM orders WHERE user_id = ? ORDER BY ordered_at DESC LIMIT ? OFFSET ?',
          'SELECT * FROM orders ORDER BY user_id, ordered_at DESC',
          'SELECT * FROM orders WHERE user_id = ? AND ordered_at IS NOT NULL',
          'SELECT * FROM orders WHERE user_id = ? GROUP BY ordered_at DESC',
        ],
        answer: 1,
        explanation: 'findBy(SELECT) + UserId(WHERE user_id = ?) + OrderByOrderedAtDesc(ORDER BY ordered_at DESC) + Pageable(LIMIT ? OFFSET ?)로 분석된다. Spring Data JPA가 메서드명을 파싱하여 자동으로 쿼리를 생성한다.'
      },
      {
        question: '다음 JavaScript 코드에서 주문 API 호출 시 headers에 포함된 두 가지 헤더의 역할을 올바르게 설명한 것은?',
        choices: [
          'Content-Type은 응답 형식을 지정하고, Authorization은 CORS를 우회한다',
          'Content-Type은 요청 본문이 JSON임을 명시하고, Authorization은 JWT 토큰으로 인증한다',
          'Content-Type은 인코딩 방식을 지정하고, Authorization은 API 키를 전달한다',
          '두 헤더 모두 CORS Preflight를 방지하기 위한 것이다',
          'Content-Type은 캐시 정책을 설정하고, Authorization은 세션 ID를 전달한다',
        ],
        answer: 1,
        explanation: 'Content-Type: application/json은 요청 본문(body)이 JSON 형식임을 서버에 알려주고, Authorization: Bearer {token}은 JWT 토큰을 포함하여 서버가 인증된 유저인지 확인할 수 있게 한다. 참고로 이 두 헤더가 포함되면 브라우저는 Preflight(OPTIONS) 요청을 먼저 보낸다.'
      },
    ]
  },
];

/**
 * 주차 번호로 단일 폼 생성
 */
function createWeekForm(weekNumber) {
  for (var i = 0; i < QUIZ_DATA.length; i++) {
    if (QUIZ_DATA[i].week === weekNumber) {
      var form = createQuizForm(QUIZ_DATA[i]);
      Logger.log(weekNumber + '주차 퀴즈 생성 완료');
      Logger.log('편집 URL: ' + form.getEditUrl());
      Logger.log('응답 URL: ' + form.getPublishedUrl());
      return form;
    }
  }
  Logger.log('해당 주차를 찾을 수 없습니다: ' + weekNumber);
  return null;
}

/**
 * 모든 주차 폼 생성
 */
function createAllForms() {
  var results = [];
  for (var i = 0; i < QUIZ_DATA.length; i++) {
    try {
      var form = createQuizForm(QUIZ_DATA[i]);
      results.push({
        week: QUIZ_DATA[i].week,
        title: QUIZ_DATA[i].title,
        editUrl: form.getEditUrl(),
        publishedUrl: form.getPublishedUrl()
      });
      Logger.log(QUIZ_DATA[i].week + '주차 퀴즈 생성 완료');
    } catch (e) {
      Logger.log(QUIZ_DATA[i].week + '주차 퀴즈 생성 실패: ' + e);
    }
  }
  Logger.log('\n===== 전체 결과 =====');
  for (var j = 0; j < results.length; j++) {
    Logger.log(JSON.stringify(results[j]));
  }
  return results;
}

/**
 * 퀴즈 데이터로 하나의 Google Form을 생성한다.
 * 폼의 맨 앞에는 '학번' 필수 입력 필드가 추가된다.
 */
function createQuizForm(quizData) {
  var form = FormApp.create(quizData.title);
  form.setTitle(quizData.title);
  form.setDescription(
    '2026 RealCoding - Spring Boot Backend 퀴즈\n\n' +
    '* 학번을 먼저 입력한 뒤 모든 문제를 풀고 제출하세요.\n' +
    '* 제출 후 즉시 정답과 해설을 확인할 수 있습니다.'
  );
  form.setIsQuiz(true);
  form.setCollectEmail(false);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage(
    '제출이 완료되었습니다!\n\n' +
    '"점수 보기" 버튼을 누르면 정답과 해설을 확인할 수 있습니다.'
  );

  // 1) 학번 필수 입력 필드
  var studentIdItem = form.addTextItem();
  studentIdItem.setTitle('학번');
  studentIdItem.setHelpText('학번을 입력하세요 (필수)');
  studentIdItem.setRequired(true);
  try {
    var validation = FormApp.createTextValidation()
      .setHelpText('학번은 숫자만 입력하세요')
      .requireNumber()
      .build();
    studentIdItem.setValidation(validation);
  } catch (e) {
    Logger.log('학번 validation 설정 중 경고: ' + e);
  }

  // 2) 퀴즈 문항 추가
  for (var i = 0; i < quizData.questions.length; i++) {
    var q = quizData.questions[i];
    if (Array.isArray(q.answer)) {
      addCheckboxQuestion(form, q);
    } else {
      addMultipleChoiceQuestion(form, q);
    }
  }

  return form;
}

/**
 * 단일 정답 객관식 문항 추가
 */
function addMultipleChoiceQuestion(form, q) {
  var item = form.addMultipleChoiceItem();
  item.setTitle(q.question);
  item.setPoints(10);
  item.setRequired(true);

  var choices = [];
  for (var i = 0; i < q.choices.length; i++) {
    choices.push(item.createChoice(q.choices[i], i === q.answer));
  }
  item.setChoices(choices);

  var correctFeedback = FormApp.createFeedback()
    .setText('정답입니다! ' + q.explanation)
    .build();
  var incorrectFeedback = FormApp.createFeedback()
    .setText('오답입니다. ' + q.explanation)
    .build();
  item.setFeedbackForCorrect(correctFeedback);
  item.setFeedbackForIncorrect(incorrectFeedback);
}

/**
 * 복수 정답 체크박스 문항 추가
 */
function addCheckboxQuestion(form, q) {
  var item = form.addCheckboxItem();
  item.setTitle(q.question);
  item.setPoints(10);
  item.setRequired(true);

  var choices = [];
  for (var i = 0; i < q.choices.length; i++) {
    var isCorrect = q.answer.indexOf(i) !== -1;
    choices.push(item.createChoice(q.choices[i], isCorrect));
  }
  item.setChoices(choices);

  var correctFeedback = FormApp.createFeedback()
    .setText('정답입니다! ' + q.explanation)
    .build();
  var incorrectFeedback = FormApp.createFeedback()
    .setText('오답입니다. ' + q.explanation)
    .build();
  item.setFeedbackForCorrect(correctFeedback);
  item.setFeedbackForIncorrect(incorrectFeedback);
}
