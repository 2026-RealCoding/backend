---
marp: true
theme: default
paginate: true
---

# Step 12: Spring Data JPA + SQLite
## 진짜 데이터베이스 연결

**2026 RealCoding**
브랜치: `layered/jpa`

---

## 이전 단계 vs 이번 단계

| 항목 | Step 11 (이전) | Step 12 (이번) |
|------|--------------|---------------|
| CRUD 인터페이스 | `CrudRepository` (직접 작성) | `JpaRepository` (Spring 제공) |
| 구현체 | `MemoryUserRepository` (직접 작성) | **Spring이 자동 생성!** |
| 저장소 | `ConcurrentHashMap` (메모리) | SQLite (파일 DB) |
| 데이터 모델 | `User` record | `UserEntity` class + `User` record |
| 서버 재시작 | 데이터 사라짐 | **데이터 유지!** |

---

## 의존성 추가 (build.gradle)

```groovy
dependencies {
    // Spring Data JPA
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'

    // SQLite JDBC 드라이버
    runtimeOnly 'org.xerial:sqlite-jdbc:3.47.1.0'

    // Hibernate 7.x SQLite Dialect (커뮤니티 모듈)
    runtimeOnly 'org.hibernate.orm:hibernate-community-dialects'
}
```

**3개의 의존성만 추가하면 DB 연결 완료!**

---

## Entity vs DTO - 왜 둘 다 필요한가?

```java
// DTO (record, 불변) - Client ↔ Controller 데이터 전달용
public record User(Long id, String name, String email) { }

// Entity (class, 가변) - DB ↔ Application 매핑용
@Entity @Table(name = "users")
public class UserEntity {
    @Id @GeneratedValue(strategy = IDENTITY)
    private Long id;
    private String name;
    private String email;
    // setter 존재, JPA가 관리
}
```

| 구분 | Entity (class) | DTO (record) |
|------|---------------|-------------|
| 가변/불변 | 가변 (setter 있음) | 불변 |
| 기본 생성자 | **필수** (JPA 규칙) | 불필요 |
| JPA 관리 | O (변경 감지) | X |

---

## JPA Entity 규칙

```java
@Entity                                    // 1. @Entity 필수
@Table(name = "users")                     // 테이블 이름 지정
public class UserEntity {

    @Id                                    // 2. @Id로 기본키 지정
    @GeneratedValue(strategy = IDENTITY)   // 3. ID 자동 생성 전략
    private Long id;

    private String name;
    private String email;

    protected UserEntity() { }             // 4. 기본 생성자 필수!

    public UserEntity(String name, String email) {
        this.name = name;
        this.email = email;
    }
    // Getter / Setter ...
}
```

**record를 사용할 수 없는 이유**: JPA가 기본 생성자로 빈 객체를 만들고, setter로 값을 채워야 하기 때문

---

## UserRepository - 구현체 자동 생성!

```java
// Before: 직접 만든 CrudRepository + MemoryUserRepository (구현 직접 작성)
public interface UserRepository extends CrudRepository<User, Long> { }

// After: Spring Data JPA의 JpaRepository (구현 자동 생성!)
public interface UserRepository
    extends JpaRepository<UserEntity, Long> {

    // 메서드 이름만으로 쿼리 자동 생성!
    // → SELECT * FROM users WHERE name LIKE '%keyword%'
    List<UserEntity> findByNameContaining(String name);
}
```

**삭제된 파일:**
- ~~CrudRepository.java~~ (Spring 것으로 대체)
- ~~MemoryUserRepository.java~~ (Spring이 자동 생성)

---

## UserService - Entity ↔ DTO 변환

```java
@Service
@Transactional(readOnly = true)  // 클래스 레벨: 조회 전용
public class UserService {

    private final UserRepository userRepository;

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .map(this::toDto)           // Entity → DTO 변환
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    @Transactional                          // 메서드 레벨: 쓰기 작업
    public User createUser(User request) {
        UserEntity entity = new UserEntity(request.name(), request.email());
        UserEntity saved = userRepository.save(entity);  // DB에 저장!
        return toDto(saved);                // Entity → DTO 변환
    }

    private User toDto(UserEntity entity) {
        return new User(entity.getId(), entity.getName(), entity.getEmail());
    }
}
```

---

## @Transactional 이해하기

```java
@Service
@Transactional(readOnly = true)  // 기본값: 조회 전용 (성능 최적화)
public class UserService {

    public List<User> getAllUsers() { }   // readOnly = true (상속)
    public User getUserById() { }         // readOnly = true (상속)

    @Transactional                         // 오버라이드: 쓰기 작업
    public User createUser() { }          // readOnly = false

    @Transactional
    public User updateUser() { }          // readOnly = false

    @Transactional
    public void deleteUser() { }          // readOnly = false
}
```

- `readOnly = true`: 변경 감지 비활성화, 읽기 성능 최적화
- 쓰기 작업에서 예외 발생 시 **자동 롤백**

---

## JPA 변경 감지 (Dirty Checking)

```java
@Transactional
public User updateUser(Long id, User request) {
    // 1. DB에서 Entity 조회
    UserEntity entity = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));

    // 2. Entity 필드 변경
    entity.setName(request.name());
    entity.setEmail(request.email());

    // 3. save() 호출하지 않아도 트랜잭션 종료 시 자동 UPDATE!
    //    (명시적으로 호출하는 것이 의도가 더 명확하긴 함)
    return toDto(userRepository.save(entity));
}
```

JPA가 Entity의 변경 사항을 **자동 감지**하여 UPDATE 쿼리를 실행한다

---

## application-dev.properties

```properties
# SQLite 파일 기반 DB
spring.datasource.url=jdbc:sqlite:./data/app.db
spring.datasource.driver-class-name=org.sqlite.JDBC

# Hibernate 설정
spring.jpa.database-platform=org.hibernate.community.dialect.SQLiteDialect
spring.jpa.hibernate.ddl-auto=update   # Entity 기반 테이블 자동 생성
spring.jpa.show-sql=true               # SQL 콘솔 출력

# 초기 데이터
spring.sql.init.mode=always
spring.jpa.defer-datasource-initialization=true
```

```sql
-- data.sql (초기 데이터)
INSERT OR IGNORE INTO users (id, name, email)
    VALUES (1, '홍길동', 'hong@example.com');
INSERT OR IGNORE INTO users (id, name, email)
    VALUES (2, '김철수', 'kim@example.com');
```

---

## Query Method - 메서드 이름으로 쿼리 생성

```java
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    // findBy + 필드명 + 조건 → SQL 자동 생성!
    List<UserEntity> findByNameContaining(String name);
    // → WHERE name LIKE '%name%'

    // 다른 예시:
    List<UserEntity> findByEmail(String email);
    // → WHERE email = ?

    List<UserEntity> findByNameAndEmail(String name, String email);
    // → WHERE name = ? AND email = ?

    Optional<UserEntity> findByEmailContaining(String keyword);
    // → WHERE email LIKE '%keyword%'
}
```

---

## 실습 (practice 브랜치)

```bash
git checkout layered/jpa-practice
```

**과제:**
1. `build.gradle`에 JPA + SQLite 의존성 추가
2. `UserEntity` 클래스 작성 (`@Entity`, `@Id`, 기본 생성자)
3. `UserRepository`를 `JpaRepository` 상속으로 변경
4. `CrudRepository.java`, `MemoryUserRepository.java` 삭제
5. `UserService`에 Entity-DTO 변환 + `@Transactional` 추가
6. `application-dev.properties`, `data.sql` 설정

**정답 확인:**
```bash
git diff layered/jpa-practice..layered/jpa
```

---

## 핵심 정리

> **JpaRepository를 extends하면 기본 CRUD 구현체가 자동 생성된다.
> Entity는 DB 매핑용 class(가변), DTO는 데이터 전달용 record(불변).**

**기억할 키워드:**
- `JpaRepository<Entity, ID>` - 기본 CRUD 자동 제공
- `@Entity`, `@Id`, `@GeneratedValue` - JPA 어노테이션
- Entity(class) vs DTO(record)
- `@Transactional` - 트랜잭션 관리
- `data.sql` - 초기 데이터
