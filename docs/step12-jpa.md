# Step 12: Spring Data JPA + SQLite

> **브랜치**: `layered/jpa`
> **실습 브랜치**: `layered/jpa-practice`

---

## 학습 목표

1. Spring Data JPA의 개념과 JpaRepository 사용법을 이해한다
2. JPA Entity 클래스의 규칙과 어노테이션을 이해한다
3. Entity(class, 가변)와 DTO(record, 불변)의 차이를 설명할 수 있다
4. SQLite를 연결하고 JPA 설정을 구성할 수 있다
5. Entity-DTO 변환과 @Transactional의 역할을 이해한다

---

## 핵심 개념

### Spring Data JPA란?

이전 단계에서 우리는 `CrudRepository<T, ID>` 인터페이스를 직접 만들고, `MemoryUserRepository`라는 구현체도 직접 작성했다. Spring Data JPA를 사용하면 **구현체를 직접 만들 필요가 없다**.

```
이전 단계 (직접 구현)              →  JPA (자동 구현)
─────────────────────────────────────────────────────
CrudRepository<User, Long>       →  JpaRepository<UserEntity, Long>
MemoryUserRepository (직접 작성)  →  Spring이 프록시로 자동 생성!
findByNameContaining (직접 구현)  →  메서드 이름으로 쿼리 자동 생성
```

### JPA Entity란?

JPA Entity는 **데이터베이스 테이블과 매핑되는 Java 클래스**이다. 각 인스턴스는 테이블의 한 행(row)에 해당한다.

### Entity vs DTO

| 구분 | Entity (class) | DTO (record) |
|------|---------------|--------------|
| **형태** | class (가변) | record (불변) |
| **용도** | DB ↔ 애플리케이션 매핑 | Controller ↔ Client 데이터 전달 |
| **특징** | setter 존재, JPA가 관리 | 불변, 간단, 데이터 전달만 |
| **기본 생성자** | 필수 (JPA 규칙) | 불필요 |
| **JPA 관리** | O (변경 감지, 지연 로딩 등) | X |

### 왜 Entity에 record를 사용할 수 없는가?

JPA는 내부적으로 다음과 같은 작업을 수행한다.

1. **기본 생성자로 객체 생성**: DB에서 데이터를 읽어 빈 객체를 먼저 만든다
2. **Reflection으로 필드 설정**: setter나 필드 접근으로 값을 채운다
3. **변경 감지 (Dirty Checking)**: JPA가 엔티티의 변경을 자동으로 감지하여 UPDATE 쿼리를 실행하는 기능

`record`는 불변(immutable)이므로 setter가 없고, 필드를 변경할 수 없다. 따라서 JPA Entity로 사용할 수 없다.

### @Transactional

> 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다. (@Transactional의 세부 동작, Lazy Loading 등)

트랜잭션은 "모두 성공하거나, 모두 실패하는" 작업 단위이다.

```java
@Transactional          // 쓰기 작업: 실패 시 자동 롤백
@Transactional(readOnly = true)  // 조회 전용: 성능 최적화 (변경 감지 비활성화)
```

---

## 주요 코드

### 의존성 추가 (build.gradle)

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'

    // SQLite JDBC 드라이버 + Hibernate SQLite Dialect
    // Hibernate 7.x부터 커뮤니티 Dialect가 별도 모듈로 분리됨
    runtimeOnly 'org.xerial:sqlite-jdbc:3.47.1.0'
    runtimeOnly 'org.hibernate.orm:hibernate-community-dialects'
}
```

### application-dev.properties (JPA + SQLite 설정)

```properties
# ========== JPA + SQLite ==========
# SQLite 파일 기반 DB (프로젝트 루트: data/app.db)
spring.datasource.url=jdbc:sqlite:./data/app.db
spring.datasource.driver-class-name=org.sqlite.JDBC

# Hibernate 설정
spring.jpa.database-platform=org.hibernate.community.dialect.SQLiteDialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# 초기 데이터 (data.sql 실행)
spring.sql.init.mode=always
spring.jpa.defer-datasource-initialization=true
```

| 설정 | 설명 |
|------|------|
| `datasource.url` | SQLite DB 파일 경로 (Windows에서도 동일 경로 사용 - Gradle이 자동 처리) |
| `ddl-auto=update` | 엔티티 기반으로 테이블 자동 생성/수정 |
| `show-sql=true` | 실행되는 SQL을 콘솔에 출력 |
| `defer-datasource-initialization` | JPA 초기화 후 data.sql 실행 |

### Before: 인메모리 Repository (직접 구현)

```java
// CrudRepository.java - 직접 만든 제네릭 인터페이스
public interface CrudRepository<T, ID> {
    List<T> findAll();
    Optional<T> findById(ID id);
    T save(T entity);
    // ...
}

// UserRepository.java - 직접 만든 인터페이스
public interface UserRepository extends CrudRepository<User, Long> {
    List<User> findByNameContaining(String name);
}

// MemoryUserRepository.java - 직접 구현한 인메모리 저장소
@Repository
public class MemoryUserRepository implements UserRepository {
    private final Map<Long, User> store = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong(1);

    @Override
    public User save(User user) {
        Long id = (user.id() == null) ? sequence.getAndIncrement() : user.id();
        User saved = new User(id, user.name(), user.email());
        store.put(id, saved);
        return saved;
    }
    // ... 모든 메서드를 직접 구현
}
```

### After: Spring Data JPA (자동 구현)

#### 1. UserEntity 클래스

```java
package com.inspire12.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// JPA Entity 규칙:
// 1. @Entity 필수
// 2. @Id로 기본키 지정
// 3. 기본 생성자(no-args constructor) 필수
// 4. record는 사용할 수 없음
@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // 데이터베이스가 자동으로 ID 번호를 부여하는 전략
    private Long id;

    private String name;

    private String email;

    // JPA가 내부에서 사용하는 기본 생성자
    protected UserEntity() {
    }

    public UserEntity(String name, String email) {
        this.name = name;
        this.email = email;
    }

    // Getter / Setter
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
```

| 어노테이션 | 설명 |
|-----------|------|
| `@Entity` | 이 클래스가 JPA Entity임을 선언 |
| `@Table(name = "users")` | 매핑할 DB 테이블 이름 |
| `@Id` | 기본키(Primary Key) 필드 |
| `@GeneratedValue(IDENTITY)` | DB가 자동으로 ID 생성 (AUTO_INCREMENT) |

#### 2. UserRepository - JpaRepository 상속

```java
package com.inspire12.backend.repository;

import com.inspire12.backend.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

// JpaRepository를 extends하면:
// - findAll(), findById(), save(), deleteById() 등 기본 CRUD 자동 제공
// - 구현 클래스를 만들 필요 없음! Spring이 자동 생성
// - 메서드 이름만으로 쿼리 자동 생성 (Query Method)
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    // 메서드 이름으로 쿼리 자동 생성
    // → SELECT * FROM users WHERE name LIKE '%keyword%'
    List<UserEntity> findByNameContaining(String name);
}
```

**삭제된 파일:**
- `CrudRepository.java` - Spring Data JPA의 것으로 대체
- `MemoryUserRepository.java` - Spring이 자동 생성하므로 불필요

#### 3. UserService - Entity ↔ DTO 변환 추가

```java
@Service
@Transactional(readOnly = true)  // 클래스 레벨: 기본적으로 읽기 전용
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        // Entity → DTO 변환
        List<User> users = userRepository.findAll().stream()
                .map(this::toDto)
                .toList();
        log.info("유저 목록 조회 - 총 {}명", users.size());
        return users;
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    @Transactional  // 쓰기 작업: readOnly = false (오버라이드)
    public User createUser(User request) {
        // DTO → Entity 변환 후 저장
        UserEntity entity = new UserEntity(request.name(), request.email());
        UserEntity saved = userRepository.save(entity);
        return toDto(saved);
    }

    @Transactional
    public User updateUser(Long id, User request) {
        UserEntity entity = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        // JPA 변경 감지 (Dirty Checking)
        entity.setName(request.name());
        entity.setEmail(request.email());
        UserEntity updated = userRepository.save(entity);
        return toDto(updated);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        userRepository.deleteById(id);
    }

    // Entity → DTO 변환 메서드
    private User toDto(UserEntity entity) {
        return new User(entity.getId(), entity.getName(), entity.getEmail());
    }
}
```

#### 4. data.sql - 초기 데이터

```sql
-- 기존 MemoryUserRepository 생성자에서 넣던 데이터를 SQL로 대체
-- INSERT OR IGNORE: 이미 데이터가 있으면 무시 (SQLite 문법)
INSERT OR IGNORE INTO users (id, name, email) VALUES (1, '홍길동', 'hong@example.com');
INSERT OR IGNORE INTO users (id, name, email) VALUES (2, '김철수', 'kim@example.com');
INSERT OR IGNORE INTO users (id, name, email) VALUES (3, '이영희', 'lee@example.com');
```

### 변경 전후 비교 요약

| 항목 | Before | After |
|------|--------|-------|
| 기본 CRUD 인터페이스 | `CrudRepository<T, ID>` (직접 작성) | `JpaRepository<T, ID>` (Spring 제공) |
| 구현체 | `MemoryUserRepository` (직접 작성) | Spring이 자동 생성 |
| 데이터 모델 | `User` record (DTO 겸용) | `UserEntity` class + `User` record |
| 데이터 저장소 | `ConcurrentHashMap` (메모리) | SQLite (파일 DB) |
| 초기 데이터 | 생성자에서 삽입 | `data.sql` |
| 트랜잭션 | 없음 | `@Transactional` |

---

## 실습 가이드

### 1. practice 브랜치로 전환

```bash
git checkout layered/jpa-practice
```

### 2. 실습 과제

#### 과제 1: 의존성 추가
- `build.gradle`에 `spring-boot-starter-data-jpa`, `sqlite-jdbc`, `hibernate-community-dialects`를 추가한다

#### 과제 2: UserEntity 클래스 작성
- `@Entity`, `@Table`, `@Id`, `@GeneratedValue` 어노테이션을 사용한다
- 기본 생성자를 `protected`로 추가한다
- Getter/Setter를 작성한다

#### 과제 3: UserRepository 수정
- `JpaRepository<UserEntity, Long>`을 상속하도록 변경한다
- `CrudRepository.java`, `MemoryUserRepository.java`를 삭제한다

#### 과제 4: UserService에 Entity ↔ DTO 변환 추가
- `toDto` 메서드를 작성한다
- `@Transactional`을 적절히 배치한다

#### 과제 5: 설정 파일 작성
- `application-dev.properties`에 JPA + SQLite 설정을 추가한다
- `data.sql`에 초기 데이터를 넣는다

### 3. 정답 확인

```bash
git diff layered/jpa-practice..layered/jpa
```

### 4. 테스트

```bash
./gradlew bootRun
# Windows: gradlew.bat bootRun

# DB에서 데이터 조회 (data.sql로 삽입된 초기 데이터)
# (Windows에서는 Git Bash 또는 PowerShell에서 실행)
curl http://localhost:8080/users

# 유저 생성 (DB에 저장됨 - 서버 재시작해도 유지!)
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"name":"박지성","email":"park@example.com"}'

# 유저 수정
curl -X PUT http://localhost:8080/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"홍길동수정","email":"hong2@example.com"}'

# DB 파일 확인
ls -la data/app.db
```

---

## 핵심 정리

> **Spring Data JPA를 사용하면 JpaRepository를 extends하는 것만으로 기본 CRUD 구현체가 자동 생성된다. Entity는 DB 매핑용 class(가변), DTO는 데이터 전달용 record(불변)로 구분하여 사용한다.**
