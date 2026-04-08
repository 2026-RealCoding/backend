# Step 11: 제네릭 Repository 패턴

> **브랜치**: `layered/generic-repository`
> **실습 브랜치**: `layered/generic-repository-practice`

---

## 학습 목표

1. Java 제네릭(Generic)을 활용하여 범용 Repository 인터페이스를 설계할 수 있다
2. 기본 CRUD를 상속으로 제공하고, 커스텀 메서드만 추가하는 패턴을 이해한다
3. 이 패턴이 Spring Data JPA의 `JpaRepository`와 동일한 구조임을 인식한다
4. 코드 중복 제거와 일관된 데이터 접근 패턴의 가치를 이해한다

---

## 핵심 개념

### 이전 단계의 문제

Step 10에서 만든 `UserRepository`는 User 전용이었다. 만약 `Product`, `Order`, `Comment` 등 다른 엔티티가 추가된다면?

```java
// User 전용
public interface UserRepository {
    List<User> findAll();
    Optional<User> findById(Long id);
    User save(User user);
    void deleteById(Long id);
    // ...
}

// Product 전용 - 거의 동일한 코드 반복!
public interface ProductRepository {
    List<Product> findAll();
    Optional<Product> findById(Long id);
    Product save(Product product);
    void deleteById(Long id);
    // ...
}
```

`findAll`, `findById`, `save`, `deleteById`는 **모든 엔티티에서 동일한 패턴**이다. 이 반복을 제거할 수 있을까?

### 제네릭(Generic)으로 해결

제네릭은 **타입을 파라미터로** 받는 문법이다. `T`는 "아직 정해지지 않은 타입"을 의미한다. (T는 저장할 데이터 타입, ID는 식별자 타입을 의미한다. 예: T=User, ID=Long)

```java
// T: 엔티티 타입 (User, Product, ...), ID: 기본키 타입 (Long, String, ...)
public interface CrudRepository<T, ID> {
    List<T> findAll();
    Optional<T> findById(ID id);
    T save(T entity);
    void deleteById(ID id);
    boolean existsById(ID id);
    long count();
}
```

이 하나의 인터페이스로 **모든 엔티티**의 기본 CRUD를 정의할 수 있다.

### Spring Data JPA와의 연결

우리가 만드는 `CrudRepository<T, ID>`는 Spring Data JPA의 `JpaRepository<T, ID>`와 **동일한 구조**이다. 이 단계를 거치면 나중에 JPA를 도입할 때 구조가 친숙하게 느껴질 것이다.

```
우리가 만드는 것          Spring Data JPA
─────────────────────────────────────────
CrudRepository<T, ID>  ≒  CrudRepository<T, ID>
UserRepository          ≒  UserRepository
MemoryUserRepository    ≒  (Spring이 자동 생성)
```

---

## 주요 코드

### Before: User 전용 Repository

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

모든 메서드가 `User`, `Long` 타입에 고정되어 있다.

### After: 제네릭 CrudRepository + UserRepository

#### 1. CrudRepository<T, ID> - 범용 인터페이스

```java
package com.inspire12.backend.repository;

import java.util.List;
import java.util.Optional;

// 모든 엔티티에 공통으로 적용되는 기본 CRUD 인터페이스
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

#### 2. UserRepository - CrudRepository를 상속

```java
package com.inspire12.backend.repository;

import com.inspire12.backend.dto.User;
import java.util.List;

// CrudRepository<User, Long>을 상속(extends)하면:
// - findAll, findById, save, deleteById, existsById, count → 자동으로 상속
// - 커스텀 메서드(findByNameContaining)만 추가로 선언
// > 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다. (상속/extends 개념)
public interface UserRepository extends CrudRepository<User, Long> {
    // 기본 CRUD 메서드는 상속으로 제공 (선언 불필요!)

    // 커스텀 메서드만 추가
    List<User> findByNameContaining(String name);
}
```

**변경점 요약:**
- Before: 7개 메서드를 모두 직접 선언
- After: `extends CrudRepository<User, Long>` + 커스텀 1개만 선언

#### 3. MemoryUserRepository - 구현은 동일

```java
@Repository
public class MemoryUserRepository implements UserRepository {

    private final Map<Long, User> store = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong(1);

    // CrudRepository의 메서드 + 커스텀 메서드 모두 구현
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
        return store.values().stream()
                .filter(u -> u.name().contains(name))
                .toList();
    }
}
```

#### 4. 다른 엔티티에도 적용 가능

```java
// 만약 Product 엔티티가 추가된다면?
public interface ProductRepository extends CrudRepository<Product, Long> {
    // 기본 CRUD는 상속!
    List<Product> findByPriceGreaterThan(int price);  // 커스텀만 추가
}
```

### UserService - 변경 없음

```java
@Service
public class UserService {
    private final UserRepository userRepository;
    // UserRepository 인터페이스만 사용하므로
    // CrudRepository 도입과 관계없이 코드 변경이 없다!
}
```

---

## Spring Data JPA 미리보기

이 패턴이 왜 중요한지, 다음 단계(Step 12)를 미리 보자.

```java
// Step 12에서 이렇게 바뀐다:
// 우리가 만든 CrudRepository → Spring의 JpaRepository
// MemoryUserRepository → Spring이 자동 생성 (구현 클래스 불필요!)

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    List<UserEntity> findByNameContaining(String name);
}
// 끝! 구현 클래스를 만들 필요가 없다!
```

---

## 실습 가이드

### 1. practice 브랜치로 전환

```bash
git checkout layered/generic-repository-practice
```

### 2. 실습 과제

#### 과제 1: CrudRepository<T, ID> 인터페이스 작성
- `findAll`, `findById`, `save`, `deleteById`, `existsById`, `count` 메서드를 제네릭으로 정의한다
- `T`와 `ID`가 타입 파라미터임을 이해한다

#### 과제 2: UserRepository 수정
- 기존 메서드 선언을 모두 제거한다
- `extends CrudRepository<User, Long>`을 추가한다
- `findByNameContaining`만 커스텀 메서드로 남긴다

#### 과제 3: 동작 확인
- `MemoryUserRepository`는 수정하지 않아도 된다 (인터페이스 구조만 바뀜)
- 기존 API가 모두 동일하게 동작하는지 확인한다

### 3. 정답 확인

```bash
git diff layered/generic-repository-practice..layered/generic-repository
```

### 4. 테스트

```bash
./gradlew bootRun
# Windows: gradlew.bat bootRun

# 기존과 동일하게 동작하는지 확인 (Windows에서는 Git Bash 또는 PowerShell에서 실행)
curl http://localhost:8080/users
curl http://localhost:8080/users/1
curl http://localhost:8080/users/search?name=홍
```

---

## 핵심 정리

> **제네릭 CrudRepository<T, ID>로 기본 CRUD를 추상화하면, 엔티티별 Repository는 extends만으로 기본 CRUD를 상속받고 커스텀 메서드만 추가하면 된다. 이 구조가 Spring Data JPA의 JpaRepository와 동일하다.**
