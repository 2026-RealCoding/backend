---
marp: true
theme: default
paginate: true
---

# Step 15: Pageable로 페이징 처리
## 데이터를 필요한 만큼만 조회하기

**2026 RealCoding**
브랜치: `feature/pageable`

---

## 왜 페이징이 필요한가?

유저가 **10만 명**이라면?

```java
// 전체 데이터를 한번에 조회
List<User> all = userRepository.findAll();  // 10만 건 메모리 로드!
```

- 메모리 폭발
- 네트워크 전송 시간 증가
- 클라이언트가 다 보여줄 수도 없음

**페이징** = 필요한 만큼만 잘라서 조회

---

## Before vs After

### Before: 수동 페이징 (비효율)

```java
List<User> all = userService.getAllUsers();  // 전체 조회!
List<User> paged = all.stream()
    .skip((long) page * size)  // Java 에서 건너뛰기
    .limit(size)               // Java 에서 자르기
    .toList();
```

### After: Pageable (효율)

```java
Page<User> users = userRepository.findAll(pageable).map(this::toDto);
// → SQL: SELECT * FROM users LIMIT 10 OFFSET 0
// → SQL: SELECT COUNT(*) FROM users
```

DB 에서 필요한 데이터만 가져옴!

---

## Pageable = 페이징 요청 정보

```
GET /users?page=0&size=10&sort=name,asc
```

Spring MVC 가 자동 변환:

```java
Pageable pageable = PageRequest.of(
    0,                              // page: 0번째 페이지
    10,                             // size: 10건씩
    Sort.by("name").ascending()     // sort: 이름 오름차순
);
```

| 파라미터 | 설명 | 기본값 |
|---------|------|--------|
| `page` | 페이지 번호 (0부터) | 0 |
| `size` | 페이지 크기 | 20 |
| `sort` | 정렬 (필드,방향) | 없음 |

---

## Page<T> = 페이징 응답

```json
{
  "content": [
    {"id": 1, "name": "홍길동", "email": "hong@example.com"}
  ],
  "totalElements": 100,
  "totalPages": 10,
  "number": 0,
  "size": 10,
  "first": true,
  "last": false,
  "empty": false
}
```

데이터 + **페이징 메타데이터**(페이지 번호, 전체 개수 등 데이터에 대한 부가 정보) 를 함께 제공

---

## Repository 변경

```java
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    // 기존: 전체 결과 반환
    List<UserEntity> findByNameContaining(String name);

    // 추가: Pageable 파라미터 → Page 반환
    Page<UserEntity> findByNameContaining(String name, Pageable pageable);
}
```

`findAll(Pageable)` 은 JpaRepository 가 이미 제공!

커스텀 메서드에도 `Pageable` 파라미터만 추가하면 자동 동작

---

## Service 변경

```java
// Before
public List<User> getAllUsers() {
    return userRepository.findAll().stream()
        .map(this::toDto)
        .toList();
}

// After
public Page<User> getAllUsers(Pageable pageable) {
    return userRepository.findAll(pageable)
        .map(this::toDto);  // Page.map() 으로 간편 변환!
}
```

`Page.map()` = Entity → DTO 변환 시 메타데이터 자동 유지

---

## Controller 변경

```java
// Before
@GetMapping
public List<User> getUsers() {
    return userService.getAllUsers();
}

// After
@GetMapping
public Page<User> getUsers(Pageable pageable) {
    return userService.getAllUsers(pageable);
}
```

`Pageable` 파라미터를 추가하면 Spring 이 쿼리 파라미터를 자동 변환!

> 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다. (내부적으로 `PageableHandlerMethodArgumentResolver` 가 처리)

**GET /users/page** (수동 페이징) → **삭제** (GET /users 로 대체)

---

## 실행되는 SQL

```sql
-- GET /users?page=1&size=5&sort=name,asc

-- 1. 데이터 조회
SELECT * FROM users
ORDER BY name ASC
LIMIT 5 OFFSET 5;

-- 2. 전체 개수 (totalElements)
SELECT COUNT(*) FROM users;
```

수동 페이징: 전체 10만 건 → Java 에서 잘라냄
**Pageable: DB 에서 5건만 조회** → 효율적!

---

## API 사용 예시

```bash
# 기본 조회 (page=0, size=20)
curl http://localhost:8080/users

# 5건씩, 첫 페이지
curl "http://localhost:8080/users?page=0&size=5"

# 이름 내림차순 정렬
curl "http://localhost:8080/users?sort=name,desc"

# 검색 + 페이징
curl "http://localhost:8080/users/search?name=홍&page=0&size=5"
```

---

## 실습 (practice 브랜치)

```bash
git checkout feature/pageable-practice
```

**실행:**
```bash
# macOS / Linux
./gradlew bootRun

# Windows
gradlew.bat bootRun
```

**과제:**
1. `UserRepository` 에 `Page<UserEntity> findByNameContaining(String, Pageable)` 추가
2. `UserService` 의 `getAllUsers`, `searchByName` 을 Pageable 버전으로 변경
3. `UserController` 에 Pageable 파라미터 적용, /page 엔드포인트 제거

**테스트:** (Windows에서는 Git Bash 또는 PowerShell에서 실행)
```bash
curl "http://localhost:8080/users?page=0&size=5"
curl "http://localhost:8080/users/search?name=홍&page=0&size=5"
curl "http://localhost:8080/users?sort=name,desc"
```

---

## 핵심 정리

> **Pageable = 페이징 요청 (page, size, sort)
> Page = 페이징 응답 (content + 메타데이터)
> DB 레벨에서 LIMIT/OFFSET 처리 → 효율적!**

**기억할 키워드:**
- `Pageable` - 페이징 요청 객체 (Spring 자동 바인딩)
- `Page<T>` - 페이징 응답 (content + totalElements + totalPages)
- `Page.map()` - Entity → DTO 변환 (메타데이터 유지)
- `?page=0&size=10&sort=name,asc` - 쿼리 파라미터
- 수동 `skip/limit` → Pageable 로 대체
