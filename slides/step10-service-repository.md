---
marp: true
theme: default
paginate: true
---

# Step 10: 계층 분리
## Service와 Repository로 구조화

**2026 RealCoding**
브랜치: `layered/service-repository`

---

## 이전 단계의 문제점

Controller 하나에 **모든 것**이 들어 있었다

```java
@RestController
public class UserController {
    private final Map<Long, User> store = new ConcurrentHashMap<>(); // 저장소
    private final AtomicLong sequence = new AtomicLong(1);           // ID 생성

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody User req) {
        if (req.name() == null) { /* 검증 로직 */ }  // 비즈니스 로직
        store.put(id, user);                          // 데이터 저장
        return ResponseEntity.created(...).body(user); // HTTP 응답
    }
}
```

- 테스트 어려움, 코드 재사용 불가, 변경 영향 범위 확대

---

## 3계층 아키텍처

```
[Client] ←→ [Controller] ←→ [Service] ←→ [Repository] ←→ [저장소]
              HTTP 처리       비즈니스 로직    데이터 접근      메모리/DB
```

| 계층 | 역할 | 어노테이션 |
|------|------|-----------|
| Controller | HTTP 요청/응답 (얇게!) | `@RestController` |
| Service | 비즈니스 로직, 검증, 로깅 | `@Service` |
| Repository | 데이터 CRUD | `@Repository` |

---

## 왜 분리하는가?

### 1. 테스트 용이
- Service를 단독으로 테스트할 수 있다 (HTTP 불필요)

### 2. 교체 용이
- Repository 구현체만 바꾸면 저장소 교체 가능 (메모리 -> DB)

### 3. 관심사 분리
- Controller: "응답 코드는 뭘까?"
- Service: "데이터가 유효한가?"
- Repository: "어디에 저장할까?"

---

## UserRepository - 인터페이스 (계약)

```java
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

**인터페이스 = "무엇을 할 수 있는가"만 정의**
구현 방법(메모리, DB, 파일)은 구현체가 결정

---

## MemoryUserRepository - 인메모리 구현체

```java
@Repository
public class MemoryUserRepository implements UserRepository {

    private final Map<Long, User> store = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong(1);

    @Override
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public User save(User user) {
        Long id = (user.id() == null)
            ? sequence.getAndIncrement() : user.id();
        User saved = new User(id, user.name(), user.email());
        store.put(id, saved);
        return saved;
    }
    // ...
}
```

---

## UserService - 비즈니스 로직 계층

```java
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private final UserRepository userRepository;  // 인터페이스에 의존

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;  // 생성자 주입
    }

    public User getUserById(Long id) {
        log.debug("유저 단건 조회 - id: {}", id);
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    public User createUser(User request) {
        log.info("유저 생성 - name: {}", request.name());
        return userRepository.save(request);
    }
}
```

---

## UserController - HTTP만 담당 (얇은 계층)

```java
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;  // Service에만 의존

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<User> getUsers() {
        return userService.getAllUsers();  // Service에 위임!
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User request) {
        User created = userService.createUser(request);
        return ResponseEntity.created(URI.create("/users/" + created.id()))
                .body(created);
    }
}
```

---

## 의존성 흐름 비교

### Before
```
Controller → (직접 Map, AtomicLong 관리)
```

### After
```
Controller → Service → Repository(인터페이스)
                              ↑
                     MemoryUserRepository(구현체)
```

**Service는 인터페이스에 의존 = 구현체를 교체해도 Service 코드는 변경 없음**

---

## 인터페이스를 사용하는 이유

```
UserRepository (인터페이스)
  ├── MemoryUserRepository   ← 지금 (인메모리)
  ├── JdbcUserRepository     ← 나중에 (JDBC)
  └── JpaUserRepository      ← 나중에 (JPA)
```

Service 코드를 **한 줄도 바꾸지 않고** 저장소를 교체할 수 있다

이것이 **의존성 역전 원칙 (DIP)**

---

## Spring이 하는 일

```java
// Spring이 자동으로 처리하는 과정:
// 1. @Repository 발견 → MemoryUserRepository Bean 생성
// 2. @Service 발견   → UserService Bean 생성
//    - 생성자에 UserRepository 필요
//    - MemoryUserRepository를 자동 주입
// 3. @RestController  → UserController Bean 생성
//    - 생성자에 UserService 필요
//    - UserService를 자동 주입
```

개발자는 `new`를 직접 호출하지 않는다
Spring이 **의존성 주입 (DI)** 으로 조립해 준다

---

## ConcurrentHashMap vs HashMap

```java
// 위험: 여러 요청이 동시에 들어오면 데이터 깨짐
private final Map<Long, User> store = new HashMap<>();

// 안전: 멀티스레드 환경에서 안전한 Map
private final Map<Long, User> store = new ConcurrentHashMap<>();

// 안전: 멀티스레드 환경에서 안전한 ID 생성
private final AtomicLong sequence = new AtomicLong(1);
```

웹 서버는 여러 요청을 **동시에** 처리한다
데이터 저장소는 반드시 **Thread-safe** 자료구조를 사용

---

## 실습 (practice 브랜치)

```bash
git checkout layered/service-repository-practice
```

**과제:**
1. `UserRepository` 인터페이스 작성
2. `MemoryUserRepository` 구현 (`@Repository`)
3. `UserService` 비즈니스 로직 구현 (`@Service`)
4. `UserController`에서 데이터 코드 제거, Service에 위임

**정답 확인:**
```bash
git diff layered/service-repository-practice..layered/service-repository
```

---

## 핵심 정리

> **Controller는 HTTP만, Service는 비즈니스 로직, Repository는 데이터 접근**
> 각 계층은 자기 역할에만 집중하고, 인터페이스를 통해 느슨하게 연결한다

**기억할 키워드:**
- `@Service`, `@Repository` - Spring Bean 등록
- 인터페이스 의존 - 구현체 교체 용이
- `ConcurrentHashMap` - Thread-safe 저장소
- 생성자 주입 - Spring DI
