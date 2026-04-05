# 2026 RealCoding - Spring Boot Backend

Spring Boot 기반 백엔드 강의 프로젝트입니다.
쇼핑몰(유저 기능 + 네이버 쇼핑 정보)을 단계별로 만들어갑니다.

## 기술 스택

- Java 21
- Spring Boot 4.0.2
- Gradle

## 실행 방법

```bash
./gradlew bootRun
```

서버 실행 후 http://localhost:8080 으로 접속

## 중간 목표: 쇼핑몰

- 유저 기능 (회원가입, 로그인, 조회)
- 네이버 쇼핑 API 연동 (상품 검색, 상품 정보 조회)

## Step 진행 과정

### Step 1. 프로젝트 초기 설정
- **branch:** `main`
- Spring Boot 프로젝트 생성 및 Gradle 설정

### Step 2. Web 의존성 추가
- **branch:** `web/start`
- `spring-boot-starter-web` 의존성 추가

### Step 3. GET 요청/응답 다루기
- **branch:** `web/get`
- `UserController` - REST API JSON 응답
  - `GET /users/hello` : 단순 문자열 응답
  - `GET /users` : 유저 목록 조회
  - `GET /users/{id}` : PathVariable
  - `GET /users/search?name=` : RequestParam
  - `GET /users/page?page=0&size=10` : RequestParam 기본값 + 페이징
  - `GET /users/me` : RequestHeader (Authorization)
  - `GET /users/{id}/detail` : ResponseEntity 상태코드 제어
- `UserPageController` - HTML 응답 비교
  - `GET /pages/users` : HTML / JSON content negotiation
  - `GET /pages/users/{id}` : HTML 상세 페이지

### Step 4. POST, PUT, DELETE 요청 다루기
- **branch:** `web/post`
- 인메모리 유저 저장소로 CRUD 동작 확인
- `UserController` 확장
  - `POST /users` : RequestBody 로 유저 생성 (201 Created)
  - `PUT /users/{id}` : 유저 정보 전체 수정
  - `DELETE /users/{id}` : 유저 삭제 (204 No Content)

### Step 5. Swagger (OpenAPI) 문서화
- **branch:** `web/swagger`
- `springdoc-openapi-starter-webmvc-ui` 의존성 추가
- Swagger 애노테이션 적용
  - `@Tag` : 컨트롤러 그룹 이름
  - `@Operation` : API 설명 (summary, description)
  - `@Parameter` : 파라미터 설명
  - `@ApiResponse` / `@ApiResponses` : 응답 상태코드 설명
- Swagger UI: http://localhost:8080/swagger-ui/index.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

### Step 6. 예외 처리와 Global Exception Handler
- **branch:** `web/exception`
- 커스텀 예외 클래스
  - `UserNotFoundException` : 유저 조회 실패 시 (→ 404)
  - `InvalidRequestException` : 잘못된 요청 시 (→ 400)
- `ErrorResponse` record : 통일된 에러 응답 형식 (status, error, message, timestamp)
- `GlobalExceptionHandler` (`@RestControllerAdvice`)
  - `@ExceptionHandler` 로 예외 타입별 응답 분기
  - 컨트롤러에서 `null` 반환 / `ResponseEntity` 분기 → 예외 던지기로 변경
- Before vs After 비교
  - Before: `return ResponseEntity.notFound().build()`
  - After: `throw new UserNotFoundException(id)` → GlobalExceptionHandler 가 처리

### Step 7. 로깅 (Logback)
- **branch:** `web/logging`
- `logback-spring.xml` 설정
  - Console Appender : 터미널 출력 (컬러 하이라이트)
  - File Appender : `./logs/application.log` 파일 저장
  - Rolling File Appender : 날짜 + 크기 기반 롤링 (`10MB`, `30일`, `1GB`)
- 로그 레벨 사용 예시
  - `log.debug()` : 상세 디버깅 정보 (단건 조회 파라미터)
  - `log.info()` : 주요 비즈니스 이벤트 (생성, 수정, 검색)
  - `log.warn()` : 주의 필요한 이벤트 (삭제, 예외 발생)
  - `log.error()` : 예상치 못한 에러 (스택 트레이스 포함)
- 패키지별 로그 레벨 분리
  - `com.inspire12.backend` → DEBUG
  - `org.springframework` → INFO
  - `org.hibernate` → WARN

### Step 8. Spring Profile
- **branch:** `web/profile`
- 프로필별 설정 파일 분리
  - `application.properties` : 공통 설정 + `spring.profiles.active=dev`
  - `application-dev.properties` : 개발 환경 (port 8080, DEBUG 로그)
  - `application-prod.properties` : 운영 환경 (port 80, INFO/WARN 로그)
- `logback-spring.xml` 에서 `<springProfile>` 로 프로필별 Appender 분기
  - dev: 콘솔만, DEBUG
  - prod: 콘솔 + 롤링 파일, WARN
- `SystemController` : 현재 프로필 조회, 로그 레벨 테스트 API
- 실행 방법: `./gradlew bootRun --args='--spring.profiles.active=prod'`

### Step 9. Actuator & Metric
- **branch:** `web/metric`
- `spring-boot-starter-actuator` 의존성 추가
- Actuator 엔드포인트
  - `/actuator/health` : 헬스 체크 (커스텀 Health Indicator 포함)
  - `/actuator/metrics` : 메트릭 목록
  - `/actuator/metrics/http.server.requests` : HTTP 요청 메트릭
  - `/actuator/metrics/user.created.count` : 커스텀 메트릭
- 프로필별 Actuator 노출 범위
  - dev: 모든 엔드포인트 노출, health 상세 표시
  - prod: health, info 만 노출
- 커스텀 구현
  - `UserHealthIndicator` : 커스텀 헬스 체크
  - `Counter` (Micrometer) : 유저 생성 횟수 카운터

### Step 10. Layered Architecture - Service & Repository
- **branch:** `layered/service-repository`
- Controller → Service → Repository 계층 분리
  - `UserRepository` (인터페이스) : 데이터 접근 계약 정의
  - `MemoryUserRepository` (`@Repository`) : 인메모리 구현체 (ConcurrentHashMap)
  - `UserService` (`@Service`) : 비즈니스 로직 (검증, 예외 처리, 로깅)
  - `UserController` : HTTP 요청/응답만 담당 (얇은 계층)
- 각 계층의 역할
  - Controller: 요청 파싱, 응답 생성, Swagger 문서화
  - Service: 비즈니스 로직, 예외 던지기, 로깅
  - Repository: 데이터 CRUD (저장소 추상화)

### Step 11. 제네릭 Repository 패턴 (JPA 이해를 위한 중간 단계)
- **branch:** `layered/generic-repository`
- `CrudRepository<T, ID>` 제네릭 인터페이스 도입
  - `findAll`, `findById`, `save`, `deleteById`, `existsById`, `count`
  - 어떤 엔티티든 기본 CRUD 를 제공하는 공통 인터페이스
- `UserRepository extends CrudRepository<User, Long>`
  - 기본 CRUD 는 상속, 커스텀 메서드(`findByNameContaining`)만 추가 선언
- 비교 포인트: 이 패턴이 Spring Data JPA 의 `JpaRepository` 와 동일한 구조
  - 우리가 만든 것: `UserRepository extends CrudRepository<User, Long>`
  - Spring Data JPA: `UserRepository extends JpaRepository<UserEntity, Long>`

### Step 12. Spring Data JPA + SQLite
- **branch:** `layered/jpa`
- `spring-boot-starter-data-jpa` + SQLite JDBC + Hibernate Community Dialects 추가
- `UserEntity` JPA 엔티티 클래스 생성
  - `@Entity`, `@Table`, `@Id`, `@GeneratedValue`
  - JPA Entity (class) vs DTO (record) 비교
- `UserRepository extends JpaRepository<UserEntity, Long>` 로 교체
  - `CrudRepository`, `MemoryUserRepository` 삭제 (Spring Data JPA 가 자동 구현)
  - `findByNameContaining` 쿼리 메서드 유지
- `UserService` 에 Entity ↔ DTO 변환 로직 추가
  - `@Transactional(readOnly = true)` / `@Transactional` 적용
- `data.sql` 로 초기 데이터 삽입
- 비교 포인트:
  - Before (이전 단계): `UserRepository extends CrudRepository<User, Long>` + `MemoryUserRepository` 직접 구현
  - After (JPA): `UserRepository extends JpaRepository<UserEntity, Long>` + 구현체 자동 생성

### Step 13. 외부 API 연동 - 네이버 쇼핑 검색
- **branch:** `shop/naver-api`
- `RestClient` 를 사용한 외부 API 호출
  - Spring 6.1+ 에서 도입된 동기 HTTP 클라이언트
  - `RestTemplate` 의 후속, 더 간결한 API
- 네이버 쇼핑 검색 API (`https://openapi.naver.com/v1/search/shop.json`)
  - `X-Naver-Client-Id`, `X-Naver-Client-Secret` 헤더 인증
  - `@Value` 로 설정값 주입, 환경변수 폴백 지원
- 새로운 파일 구조:
  - `ShoppingController` : `GET /shop/search?query=키워드&display=10`
  - `NaverShoppingService` : RestClient 로 네이버 API 호출
  - `NaverShoppingResponse`, `ShoppingItem` : 응답 DTO (record)

### Step 14. JWT 인증 (외부 라이브러리 없이)
- **branch:** `shop/auth`
- 순수 Java 로 JWT 구현 (`JwtUtil` 유틸리티 클래스)
  - JWT 구조 이해: `header.payload.signature`
  - `Base64URL` 인코딩 + `HMAC-SHA256` 서명
  - 토큰 생성 (`generateToken`), 검증 (`validateToken`), 파싱 (`getUserIdFromToken`)
- `POST /users/login` : userId 로 JWT 토큰 발급
- `GET /users/me` 개선: JWT 토큰 검증 → userId 추출 → 실제 유저 정보 반환
- Before vs After 비교:
  - Before: 토큰을 문자열로 그대로 반환 (인증 없음)
  - After: JWT 서명 검증 + 만료 시간 체크 → 실제 유저 조회

### Step 15. Pageable 적용 (Spring Data JPA 페이징)
- **branch:** `feature/pageable`
- Spring Data JPA 의 `Pageable` / `Page<T>` 활용
  - `GET /users` → `Pageable` 파라미터 추가, `Page<User>` 반환
  - `GET /users/search` → `Pageable` 파라미터 추가, `Page<User>` 반환
  - `GET /users/page` → 수동 페이징 제거 (Pageable 로 대체)
- Before vs After 비교:
  - Before: `stream().skip().limit()` 로 전체 데이터를 메모리에 로드 후 수동 페이징
  - After: DB 레벨에서 `LIMIT`/`OFFSET` + `COUNT` 쿼리 자동 생성
- API 사용: `GET /users?page=0&size=10&sort=name,asc`

### Step 17. 프론트엔드 연동 API 완성 - 비즈니스 요구사항을 API 로 풀어내기
- **branch:** `feature/frontend-api`
- 프론트엔드 화면 흐름 → 백엔드 API 매핑
  - 회원가입: `POST /users` (기존 API 재사용)
  - 로그인: `POST /users/login` (기존 API 재사용)
  - 상품 검색: `GET /shop/search` (기존 API 재사용)
  - 구매: `POST /orders` (신규, JWT 인증 필요)
  - 주문 목록: `GET /orders` (신규, JWT 인증 필요)
- 주문(Order) 도메인 구현: Entity → Repository → Service → Controller
- 비즈니스 요구사항 분석
  - "유저 체크" = JWT 인증 (로그인 여부) + DB 유효성 검증 (유저 존재 여부)
  - 주문 시 상품 정보 스냅샷 저장 (외부 API 데이터 변동 대비)
  - userId 는 요청 Body 가 아닌 JWT 토큰에서 추출 (보안)
