# 4주차 퀴즈: 계층분리, 제네릭 Repository, JPA (Step 10-12)

## Q1. 계층을 분리하지 않고 Controller 하나에 모든 로직을 넣었을 때 발생하는 문제로 **적절하지 않은** 것은?
- A) HTTP 요청 없이 비즈니스 로직만 테스트하기 어렵다
- B) 같은 로직을 다른 Controller에서 재사용하려면 복사해야 한다
- C) 저장소를 바꾸면 Controller까지 수정해야 한다
- D) 애플리케이션의 실행 속도가 크게 느려진다
- E) 한 파일에 HTTP 처리, 비즈니스 로직, 데이터 접근이 섞여 가독성이 떨어진다

**정답:** D
**해설:** 계층 분리는 코드의 구조와 유지보수성에 관한 것이지, 실행 속도와는 직접적인 관계가 없다. 계층을 분리하지 않아도 실행 속도 자체가 크게 느려지지는 않는다.

---

## Q2. 다음 코드에서 `UserService`가 `UserRepository` 인터페이스에 의존하는 이유로 가장 적절한 것은?

```java
@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
```
- A) Java에서는 클래스 간 직접 의존이 금지되어 있기 때문이다
- B) 인터페이스를 사용하면 코드 실행 속도가 빨라지기 때문이다
- C) 구현체가 바뀌어도(Memory -> JDBC -> JPA) Service 코드를 수정할 필요가 없기 때문이다
- D) Spring에서 인터페이스 없이는 빈 등록이 불가능하기 때문이다
- E) 인터페이스를 사용해야만 로깅 기능을 추가할 수 있기 때문이다

**정답:** C
**해설:** Repository를 인터페이스로 정의하면 구현체(MemoryUserRepository, JdbcUserRepository, JpaUserRepository)를 교체할 수 있다. Service는 인터페이스에만 의존하므로 구현체가 바뀌어도 코드 수정이 필요 없다. 이것이 DI(의존성 주입)를 통한 의존성 역전 원칙이다.

---

## Q3. `MemoryUserRepository`에서 `ConcurrentHashMap`과 `AtomicLong`을 사용하는 이유는?
- A) 일반 HashMap과 long보다 메모리를 적게 사용하기 때문이다
- B) 여러 요청이 동시에 와도 안전하게 데이터를 저장하고 ID를 생성하기 위해서이다
- C) Spring에서 `@Repository` 사용 시 필수로 요구하는 자료구조이기 때문이다
- D) 데이터베이스와의 연결을 관리하기 위해서이다
- E) JSON 직렬화 성능이 더 좋기 때문이다

**정답:** B
**해설:** `ConcurrentHashMap`은 멀티스레드 환경에서 안전한 Map이고, `AtomicLong`은 동시 요청에도 안전하게 숫자를 증가시키는 도구이다. 웹 서버는 여러 요청이 동시에 들어오므로 스레드 안전한 자료구조가 필요하다.

---

## Q4. 다음 코드에서 `UserRepository`가 `findByNameContaining`만 선언한 이유는?

```java
public interface UserRepository extends CrudRepository<User, Long> {
    List<User> findByNameContaining(String name);
}
```
- A) 나머지 메서드는 아직 구현되지 않았기 때문이다
- B) `findAll`, `findById`, `save` 등 기본 CRUD는 `CrudRepository`를 상속받아 자동으로 제공되기 때문이다
- C) 커스텀 메서드만 인터페이스에 선언할 수 있는 Java 규칙 때문이다
- D) Spring이 기본 CRUD 메서드 선언을 금지하기 때문이다
- E) 성능 최적화를 위해 필요한 메서드만 선언한 것이다

**정답:** B
**해설:** `CrudRepository<User, Long>`을 extends하면 `findAll`, `findById`, `save`, `deleteById`, `existsById`, `count` 등 기본 CRUD 메서드가 상속으로 자동 제공된다. 따라서 커스텀 메서드(`findByNameContaining`)만 추가로 선언하면 된다.

---

## Q5. JPA Entity에 `record` 대신 `class`를 사용해야 하는 이유로 올바른 것은?
- A) record는 Java에서 deprecated 예정이기 때문이다
- B) record는 불변(immutable)이라 setter가 없고, JPA가 필드를 변경하거나 기본 생성자로 객체를 생성할 수 없기 때문이다
- C) record는 데이터베이스 연결을 지원하지 않기 때문이다
- D) record는 어노테이션을 붙일 수 없기 때문이다
- E) record는 Spring Boot에서 지원하지 않는 문법이기 때문이다

**정답:** B
**해설:** JPA는 기본 생성자로 빈 객체를 생성한 후 Reflection으로 필드를 설정하고, 변경 감지(Dirty Checking)를 수행한다. record는 불변이므로 setter가 없고 필드를 변경할 수 없어 JPA Entity로 사용할 수 없다.

---

## Q6. 3계층 아키텍처에서 각 계층의 역할이 올바르게 연결된 것은?
- A) Controller - 비즈니스 로직, Service - HTTP 처리, Repository - 데이터 접근
- B) Controller - 데이터 접근, Service - HTTP 처리, Repository - 비즈니스 로직
- C) Controller - HTTP 요청/응답, Service - 비즈니스 로직, Repository - 데이터 접근
- D) Controller - HTTP 요청/응답, Service - 데이터 접근, Repository - 비즈니스 로직
- E) Controller - 비즈니스 로직, Service - 데이터 접근, Repository - HTTP 처리

**정답:** C
**해설:** Controller는 HTTP 요청 수신과 응답 반환을 담당하고, Service는 비즈니스 로직(검증, 예외 처리, 로깅)을 담당하며, Repository는 데이터 저장/조회/수정/삭제(CRUD)를 담당한다.

---

## Q7. 제네릭 `CrudRepository<T, ID>`에서 `T`와 `ID`의 의미로 올바른 것은?
- A) T는 테이블 이름, ID는 인덱스 번호이다
- B) T는 저장할 엔티티 타입, ID는 기본키 타입이다
- C) T는 트랜잭션 타입, ID는 식별자 문자열이다
- D) T는 스레드 타입, ID는 데이터베이스 연결 번호이다
- E) T는 타임스탬프, ID는 고유 식별 코드이다

**정답:** B
**해설:** 제네릭에서 T는 엔티티 타입(User, Product 등), ID는 기본키 타입(Long, String, UUID 등)을 의미한다. 이를 통해 하나의 인터페이스로 모든 엔티티의 기본 CRUD를 정의할 수 있다.

---

## Q8. 다음 `UserService` 코드에서 `@Transactional` 관련 설명으로 올바른 것은?

```java
@Service
@Transactional(readOnly = true)
public class UserService {

    public List<User> getAllUsers() { /* ... */ }

    @Transactional
    public User createUser(User request) { /* ... */ }

    @Transactional
    public void deleteUser(Long id) { /* ... */ }
}
```
- A) `getAllUsers()`는 `@Transactional`이 적용되지 않는다
- B) `createUser()`는 `readOnly = true`가 적용된다
- C) `getAllUsers()`는 클래스 레벨의 `readOnly = true`가 적용되고, `createUser()`와 `deleteUser()`는 메서드 레벨의 `@Transactional`(readOnly = false)이 적용된다
- D) 모든 메서드에 `readOnly = true`가 적용된다
- E) `deleteUser()`는 트랜잭션 없이 실행된다

**정답:** C
**해설:** 클래스 레벨에 `@Transactional(readOnly = true)`를 선언하면 모든 메서드에 기본 적용된다. 하지만 `createUser()`와 `deleteUser()`처럼 메서드 레벨에 `@Transactional`을 별도로 선언하면 해당 메서드는 readOnly = false로 오버라이드된다.

---

## Q9. Spring Data JPA를 도입했을 때 **삭제해도 되는** 파일은?

```
이전 구조:
├── CrudRepository.java (직접 작성한 제네릭 인터페이스)
├── UserRepository.java (CrudRepository 상속)
├── MemoryUserRepository.java (직접 구현한 인메모리 저장소)
└── UserService.java
```
- A) `CrudRepository.java`만 삭제
- B) `MemoryUserRepository.java`만 삭제
- C) `CrudRepository.java`와 `MemoryUserRepository.java` 모두 삭제
- D) `UserRepository.java`와 `MemoryUserRepository.java` 모두 삭제
- E) 모든 파일을 삭제하고 새로 작성해야 한다

**정답:** C
**해설:** Spring Data JPA를 사용하면 `CrudRepository`는 Spring Data의 `JpaRepository`로 대체되고, `MemoryUserRepository`는 Spring이 프록시로 자동 생성하므로 구현 클래스가 불필요하다. `UserRepository`는 `JpaRepository<UserEntity, Long>`을 상속하도록 수정하여 유지한다.

---

## Q10. 다음 JPA 설정에서 `spring.jpa.hibernate.ddl-auto=update`의 의미로 올바른 것은?

```properties
spring.datasource.url=jdbc:sqlite:./data/app.db
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```
- A) 애플리케이션 시작 시 기존 테이블을 모두 삭제하고 새로 생성한다
- B) 엔티티 기반으로 테이블을 자동 생성하거나 변경된 부분만 수정한다
- C) 엔티티와 테이블 구조가 일치하는지 검증만 하고, 불일치 시 에러를 발생시킨다
- D) DDL 실행을 완전히 비활성화한다
- E) 데이터베이스의 모든 데이터를 업데이트한다

**정답:** B
**해설:** `ddl-auto=update`는 엔티티 기반으로 테이블을 자동 생성하거나, 변경된 부분(새 컬럼 등)만 수정한다. 이는 개발(dev) 환경에서 사용하며, 운영(prod) 환경에서는 `validate`(검증만)를 사용한다.

---
