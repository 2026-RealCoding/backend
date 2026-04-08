# Step 10: 계층 분리 - Service와 Repository

> **브랜치**: `layered/service-repository`
> **실습 브랜치**: `layered/service-repository-practice`

---

## 학습 목표

1. Controller, Service, Repository 3계층 아키텍처를 이해한다
2. 각 계층의 역할과 책임을 명확히 구분할 수 있다
3. 왜 계층을 분리하는지 (테스트 용이, 교체 용이, 관심사 분리) 설명할 수 있다
4. `ConcurrentHashMap`(여러 요청이 동시에 와도 안전하게 데이터를 저장하는 Map) + `AtomicLong`(동시 요청에도 안전하게 숫자를 증가시키는 도구)을 사용한 인메모리 저장소를 구현할 수 있다

---

## 핵심 개념

### 왜 계층을 분리하는가?

이전 단계에서는 Controller 하나에 모든 로직이 들어 있었다. 유저 목록 관리, 검증, 저장, HTTP 응답 생성까지 전부 한 곳에서 처리했다. 코드가 늘어나면 다음과 같은 문제가 발생한다.

| 문제 | 설명 |
|------|------|
| **테스트 어려움** | HTTP 요청 없이 비즈니스 로직만 테스트할 수 없다 |
| **코드 재사용 불가** | 같은 로직을 다른 Controller에서 쓰려면 복사해야 한다 |
| **변경 영향 범위 확대** | 저장소를 바꾸면 Controller까지 수정해야 한다 |
| **가독성 저하** | 한 파일에 HTTP 처리 + 비즈니스 로직 + 데이터 접근이 섞여 있다 |

### 3계층 아키텍처 (Layered Architecture)

```
[Client]  ←→  [Controller]  ←→  [Service]  ←→  [Repository]  ←→  [데이터 저장소]
               HTTP 요청/응답     비즈니스 로직     데이터 접근        메모리/DB/파일
```

| 계층 | 역할 | Spring 어노테이션 |
|------|------|-------------------|
| **Controller** | HTTP 요청 수신, 응답 반환. 최대한 얇게 유지 | `@RestController` |
| **Service** | 비즈니스 로직, 검증, 예외 처리, 로깅 | `@Service` |
| **Repository** | 데이터 저장/조회/수정/삭제 (CRUD) | `@Repository` |

### 관심사 분리 (Separation of Concerns)

각 계층은 자기 역할에만 집중한다.

- **Controller**: "이 요청을 어떤 메서드에 보낼까? 응답 코드는 뭘까?"
- **Service**: "이 데이터가 유효한가? 비즈니스 규칙을 만족하는가?"
- **Repository**: "데이터를 어디에 어떻게 저장할까?"

### 인터페이스를 사용하는 이유

Repository를 인터페이스로 정의하면, 구현체를 교체할 수 있다.

```
UserRepository (인터페이스)
  ├── MemoryUserRepository   (인메모리 - 지금)
  ├── JdbcUserRepository     (JDBC - 나중에)
  └── JpaUserRepository      (JPA - 나중에)
```

Service는 `UserRepository` 인터페이스에만 의존하므로, 구현체가 바뀌어도 Service 코드는 수정할 필요가 없다. 이것이 **DI(Dependency Injection, 의존성 주입)** 를 통한 **의존성 역전 원칙**이다.

---

## 주요 코드

### Before: 모든 것이 Controller에 있던 구조

```java
@RestController
@RequestMapping("/users")
public class UserController {

    // Controller에 데이터 저장 로직이 직접 존재
    private final Map<Long, User> store = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong(1);

    @GetMapping
    public List<User> getUsers() {
        return new ArrayList<>(store.values());
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User request) {
        // 검증 로직도 Controller에
        if (request.name() == null || request.name().isBlank()) {
            throw new InvalidRequestException("이름은 필수입니다");
        }
        // 저장 로직도 Controller에
        Long id = sequence.getAndIncrement();
        User user = new User(id, request.name(), request.email());
        store.put(id, user);
        return ResponseEntity.created(URI.create("/users/" + id)).body(user);
    }
}
```

### After: 3계층으로 분리

#### 1. UserRepository (인터페이스) - 데이터 접근 계약

```java
package com.inspire12.backend.repository;

import com.inspire12.backend.dto.User;
import java.util.List;
import java.util.Optional;

// 데이터 접근 계약: "무엇을 할 수 있는가"만 정의
// > 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다.
// Optional: 값이 있을 수도 있고 없을 수도 있는 컨테이너
// 구현 방법(메모리, DB, 파일 등)은 구현체가 결정
public interface UserRepository {
    List<User> findAll();
    Optional<User> findById(Long id);
    User save(User user);
    void deleteById(Long id);
    boolean existsById(Long id);
    long count();
    List<User> findByNameContaining(String name);
}
```

#### 2. MemoryUserRepository (구현체) - 인메모리 저장

```java
package com.inspire12.backend.repository;

import com.inspire12.backend.dto.User;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

// @Repository: Spring이 이 클래스를 데이터 접근 계층 Bean으로 등록
// ConcurrentHashMap: 멀티스레드 환경에서 안전한 Map
// AtomicLong: 멀티스레드 환경에서 안전한 ID 생성기
@Repository
public class MemoryUserRepository implements UserRepository {

    private final Map<Long, User> store = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong(1);

    // 초기 데이터 (생성자에서 삽입)
    public MemoryUserRepository() {
        save(new User(null, "홍길동", "hong@example.com"));
        save(new User(null, "김철수", "kim@example.com"));
        save(new User(null, "이영희", "lee@example.com"));
    }

    @Override
    public List<User> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public User save(User user) {
        Long id = (user.id() == null) ? sequence.getAndIncrement() : user.id();
        User saved = new User(id, user.name(), user.email());
        store.put(id, saved);
        return saved;
    }

    @Override
    public void deleteById(Long id) {
        store.remove(id);
    }

    @Override
    public boolean existsById(Long id) {
        return store.containsKey(id);
    }

    @Override
    public long count() {
        return store.size();
    }

    @Override
    public List<User> findByNameContaining(String name) {
        // > 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다.
        // stream(): 컬렉션의 요소를 하나씩 처리하는 Java Stream API
        return store.values().stream()
                .filter(u -> u.name().contains(name))
                .toList();
    }
}
```

#### 3. UserService - 비즈니스 로직

```java
package com.inspire12.backend.service;

import com.inspire12.backend.dto.User;
import com.inspire12.backend.exception.UserNotFoundException;
import com.inspire12.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

// @Service: Spring이 이 클래스를 비즈니스 로직 계층 Bean으로 등록
// 비즈니스 로직: 검증, 예외 처리, 로깅 등
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    // 생성자 주입: UserRepository 인터페이스에 의존
    // Spring이 MemoryUserRepository를 자동으로 주입
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll();
        log.info("유저 목록 조회 - 총 {}명", users.size());
        return users;
    }

    public User getUserById(Long id) {
        log.debug("유저 단건 조회 - id: {}", id);
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    public User createUser(User request) {
        log.info("유저 생성 요청 - name: {}, email: {}", request.name(), request.email());
        User saved = userRepository.save(request);
        log.info("유저 생성 완료 - id: {}", saved.id());
        return saved;
    }

    public User updateUser(Long id, User request) {
        log.info("유저 수정 요청 - id: {}", id);
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        User updated = new User(id, request.name(), request.email());
        return userRepository.save(updated);
    }

    public void deleteUser(Long id) {
        log.info("유저 삭제 요청 - id: {}", id);
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        userRepository.deleteById(id);
        log.warn("유저 삭제 완료 - id: {}", id);
    }

    public List<User> searchByName(String name) {
        log.info("유저 검색 - name: {}", name);
        return userRepository.findByNameContaining(name);
    }
}
```

#### 4. UserController - HTTP 요청/응답만 담당

```java
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    // Controller는 Service에만 의존 (Repository를 직접 사용하지 않음)
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<User> getUsers() {
        return userService.getAllUsers();  // Service에 위임
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User request) {
        User created = userService.createUser(request);  // Service에 위임
        return ResponseEntity
                .created(URI.create("/users/" + created.id()))
                .body(created);
    }
    // ...
}
```

### 의존성 흐름 비교

```
Before:  Controller → (직접 데이터 관리)
After:   Controller → Service → Repository(인터페이스) ← MemoryUserRepository(구현체)
```

---

## 실습 가이드

### 1. practice 브랜치로 전환

```bash
git checkout layered/service-repository-practice
```

### 2. 실습 과제

practice 브랜치에는 빈 메서드와 TODO 주석이 있다. 다음을 직접 구현해 보자.

#### 과제 1: UserRepository 인터페이스 작성
- `findAll`, `findById`, `save`, `deleteById`, `existsById` 메서드 시그니처를 정의한다

#### 과제 2: MemoryUserRepository 구현
- `ConcurrentHashMap`과 `AtomicLong`을 사용하여 인메모리 저장소를 구현한다
- `@Repository` 어노테이션을 붙인다

#### 과제 3: UserService 구현
- `UserRepository`를 생성자 주입으로 받는다
- 비즈니스 로직 (검증, 예외 처리)을 추가한다
- `@Service` 어노테이션을 붙인다

#### 과제 4: UserController 리팩토링
- 기존 Controller에서 데이터 관련 코드를 모두 제거한다
- `UserService`만 주입받아 사용하도록 변경한다

### 3. 정답 확인

```bash
git diff layered/service-repository-practice..layered/service-repository
```

### 4. 테스트

```bash
# 서버 실행
./gradlew bootRun
# Windows: gradlew.bat bootRun

# 유저 목록 조회 (Windows에서는 Git Bash 또는 PowerShell에서 실행)
curl http://localhost:8080/users

# 유저 생성
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"name":"박지성","email":"park@example.com"}'

# 유저 검색
curl http://localhost:8080/users/search?name=홍
```

---

## 핵심 정리

> **Controller는 HTTP만, Service는 비즈니스 로직, Repository는 데이터 접근 - 각 계층은 자기 역할에만 집중하고, 인터페이스를 통해 느슨하게 연결한다.**
