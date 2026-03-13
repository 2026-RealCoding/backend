---
marp: true
theme: default
paginate: true
---

# Step 11: 제네릭 Repository 패턴
## JPA 이해를 위한 중간 단계

**2026 RealCoding**
브랜치: `layered/generic-repository`

---

## 이전 단계의 문제: 코드 중복

```java
// User 전용
public interface UserRepository {
    List<User> findAll();
    Optional<User> findById(Long id);
    User save(User user);
    void deleteById(Long id);
}

// Product가 추가되면? 거의 동일한 코드 반복!
public interface ProductRepository {
    List<Product> findAll();
    Optional<Product> findById(Long id);
    Product save(Product product);
    void deleteById(Long id);
}
```

**findAll, findById, save, deleteById는 모든 엔티티에서 동일한 패턴!**

---

## 해결: 제네릭 (Generic)

타입을 **파라미터**로 받는다

```java
// T: 엔티티 타입 (User, Product, Order, ...)
// ID: 기본키 타입 (Long, String, UUID, ...)
public interface CrudRepository<T, ID> {
    List<T> findAll();
    Optional<T> findById(ID id);
    T save(T entity);
    void deleteById(ID id);
    boolean existsById(ID id);
    long count();
}
```

**하나의 인터페이스로 모든 엔티티의 기본 CRUD를 정의!**

---

## Before: 모든 메서드를 직접 선언

```java
public interface UserRepository {
    List<User> findAll();           // 직접 선언
    Optional<User> findById(Long id); // 직접 선언
    User save(User user);            // 직접 선언
    void deleteById(Long id);        // 직접 선언
    boolean existsById(Long id);     // 직접 선언
    long count();                     // 직접 선언
    List<User> findByNameContaining(String name); // 커스텀
}
```

**7개 메서드를 모두 직접 선언해야 한다**

---

## After: extends만으로 기본 CRUD 제공

```java
public interface UserRepository extends CrudRepository<User, Long> {
    // 기본 CRUD 6개 메서드는 상속으로 자동 제공!

    // 커스텀 메서드만 추가
    List<User> findByNameContaining(String name);
}
```

**extends 한 줄 + 커스텀 1개만 선언!**

다른 엔티티도 동일하게 적용:
```java
public interface ProductRepository extends CrudRepository<Product, Long> {
    List<Product> findByPriceGreaterThan(int price);
}
```

---

## 구현체는 동일

```java
@Repository
public class MemoryUserRepository implements UserRepository {

    private final Map<Long, User> store = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong(1);

    @Override
    public List<User> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public User save(User user) {
        Long id = (user.id() == null)
            ? sequence.getAndIncrement() : user.id();
        User saved = new User(id, user.name(), user.email());
        store.put(id, saved);
        return saved;
    }
    // ... 나머지 메서드 동일
}
```

---

## UserService - 변경 없음!

```java
@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }
    // ...
}
```

**Service는 UserRepository 인터페이스에만 의존**
내부 구조(CrudRepository 상속)가 바뀌어도 영향 없음

---

## 제네릭 문법 정리

```java
// 제네릭 인터페이스 선언
public interface CrudRepository<T, ID> {
    T save(T entity);           // T: User, Product, ...
    Optional<T> findById(ID id); // ID: Long, String, ...
}

// 제네릭 인터페이스 사용 (타입 지정)
public interface UserRepository
    extends CrudRepository<User, Long> {
    //                      ↑ T=User  ↑ ID=Long
}

// 결과: T → User, ID → Long 으로 치환됨
// User save(User entity);
// Optional<User> findById(Long id);
```

---

## 이 패턴이 Spring Data JPA와 동일하다!

```
우리가 만드는 것                Spring Data JPA
───────────────────────────────────────────────────
CrudRepository<T, ID>    ≒    CrudRepository<T, ID>
UserRepository            ≒    UserRepository
MemoryUserRepository      ≒    (Spring이 자동 생성!)
```

### 다음 단계 (Step 12) 미리보기:
```java
// CrudRepository → JpaRepository로 교체
// MemoryUserRepository 삭제! (Spring이 자동 구현)
public interface UserRepository
    extends JpaRepository<UserEntity, Long> {
    List<UserEntity> findByNameContaining(String name);
}
```

---

## 전체 구조 변화

```
Step 10: UserRepository (7개 메서드 직접 선언)
           ↓
Step 11: CrudRepository<T, ID> ← UserRepository (extends + 커스텀만)
           ↓
Step 12: JpaRepository<T, ID> ← UserRepository (구현체도 자동!)
```

**점진적으로 추상화 수준을 높여간다**

---

## 실습 (practice 브랜치)

```bash
git checkout layered/generic-repository-practice
```

**과제:**
1. `CrudRepository<T, ID>` 인터페이스 작성 (6개 메서드)
2. `UserRepository`에서 기본 CRUD 선언 제거, `extends CrudRepository<User, Long>` 추가
3. 커스텀 메서드 `findByNameContaining`만 남기기
4. 기존 API가 동일하게 동작하는지 확인

**정답 확인:**
```bash
git diff layered/generic-repository-practice..layered/generic-repository
```

---

## 핵심 정리

> **제네릭 CrudRepository로 기본 CRUD를 추상화하면,
> extends만으로 기본 기능을 상속받고 커스텀만 추가하면 된다.
> 이 구조가 곧 Spring Data JPA의 JpaRepository이다.**

**기억할 키워드:**
- `CrudRepository<T, ID>` - 범용 CRUD 인터페이스
- `extends` - 상속으로 코드 중복 제거
- 제네릭 `<T, ID>` - 타입을 파라미터로
- JPA 미리보기 - 동일한 패턴
