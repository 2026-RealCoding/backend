# Step 15: Pageable로 페이징 처리

> **브랜치**: `feature/pageable`
> **실습 브랜치**: `feature/pageable-practice`

---

## 학습 목표

1. Spring Data JPA 의 `Pageable` 인터페이스를 이해한다
2. `Page<T>` 응답 구조(content, totalElements, totalPages 등)를 이해한다
3. 수동 페이징(`stream().skip().limit()`)과 Pageable 의 차이를 비교할 수 있다
4. 쿼리 파라미터(`page`, `size`, `sort`)로 페이징과 정렬을 제어할 수 있다

---

## 핵심 개념

### 왜 페이징이 필요한가?

유저가 10만 명이라면 `findAll()` 로 전부 조회하면:
- 메모리를 대량으로 사용
- 네트워크 전송 시간 증가
- 클라이언트가 데이터를 다 표시할 수도 없음

**페이징** = 전체 데이터를 일정 크기(page size)로 잘라서 필요한 부분만 조회

### Pageable 이란?

Spring Data 에서 제공하는 **페이징 요청 정보를 담는 인터페이스**

```java
public interface Pageable {
    int getPageNumber();  // 몇 번째 페이지? (0부터 시작)
    int getPageSize();    // 한 페이지에 몇 건?
    Sort getSort();       // 정렬 기준
}
```

Spring MVC 가 쿼리 파라미터를 자동으로 `Pageable` 객체로 변환한다:

```
GET /users?page=0&size=10&sort=name,asc
           ↓
PageRequest.of(0, 10, Sort.by("name").ascending())
```

### Page<T> 란?

조회 결과 + 페이징 메타데이터(페이지 번호, 전체 개수 등 데이터에 대한 부가 정보)를 담는 **응답 객체**

```json
{
  "content": [...],           // 실제 데이터
  "totalElements": 100,       // 전체 데이터 수
  "totalPages": 10,           // 전체 페이지 수
  "number": 0,                // 현재 페이지 번호
  "size": 10,                 // 페이지 크기
  "first": true,              // 첫 페이지 여부
  "last": false,              // 마지막 페이지 여부
  "numberOfElements": 10,     // 현재 페이지의 데이터 수
  "empty": false              // 비어있는지 여부
}
```

### 수동 페이징 vs Pageable 비교

#### Before: 수동 페이징 (비효율적)

```java
// 1. DB 에서 전체 데이터 조회 (10만 건 모두 메모리에 로드!)
List<User> all = userService.getAllUsers();

// 2. Java 스트림으로 잘라내기
List<User> paged = all.stream()
        .skip((long) page * size)  // 앞부분 건너뛰기
        .limit(size)               // size 만큼만
        .toList();
```

**문제점:**
- 항상 전체 데이터를 DB 에서 가져옴 → 메모리 낭비
- COUNT 쿼리가 없어서 totalPages 계산을 직접 해야 함
- 정렬도 Java 에서 처리해야 함

#### After: Pageable (효율적)

```java
// DB 에서 필요한 페이지만 조회 (LIMIT + OFFSET)
Page<User> users = userRepository.findAll(pageable).map(this::toDto);
```

**장점:**
- DB 레벨에서 `LIMIT`, `OFFSET` 으로 필요한 데이터만 조회
- `COUNT` 쿼리를 자동 실행하여 총 개수 제공
- 정렬도 DB 에서 `ORDER BY` 로 처리
- `Page` 객체에 페이징 메타데이터 자동 포함

### 실제 실행되는 SQL

```sql
-- 데이터 조회 (page=1, size=5, sort=name,asc)
SELECT * FROM users ORDER BY name ASC LIMIT 5 OFFSET 5;

-- 전체 개수 조회 (totalElements 계산용)
SELECT COUNT(*) FROM users;
```

---

## 주요 코드

### UserRepository - Pageable 메서드 추가

```java
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    // 기존: List 반환 (전체 결과)
    List<UserEntity> findByNameContaining(String name);

    // 추가: Page 반환 (페이징 결과)
    // Pageable 파라미터를 추가하면 Spring Data JPA 가
    // LIMIT/OFFSET + COUNT 쿼리를 자동 생성
    Page<UserEntity> findByNameContaining(String name, Pageable pageable);
}
```

> `JpaRepository` 는 `PagingAndSortingRepository` 를 상속하므로
> `findAll(Pageable)` 은 이미 기본 제공됨. 커스텀 메서드만 추가하면 됨.

### UserService - Page 반환으로 변경

```java
// Before
public List<User> getAllUsers() {
    return userRepository.findAll().stream()
            .map(this::toDto)
            .toList();
}

// After
public Page<User> getAllUsers(Pageable pageable) {
    return userRepository.findAll(pageable).map(this::toDto);
}
```

**`Page.map()`** 을 사용하면 `Page<Entity>` → `Page<DTO>` 변환이 간편하다.
페이징 메타데이터(totalElements, totalPages 등)는 자동으로 유지된다.

```java
// Before
public List<User> searchByName(String name) {
    return userRepository.findByNameContaining(name).stream()
            .map(this::toDto)
            .toList();
}

// After
public Page<User> searchByName(String name, Pageable pageable) {
    return userRepository.findByNameContaining(name, pageable).map(this::toDto);
}
```

### UserController - Pageable 파라미터 적용

```java
// Before: 전체 목록 반환
@GetMapping
public List<User> getUsers() {
    return userService.getAllUsers();
}

// After: Pageable 파라미터 자동 바인딩
@GetMapping
public Page<User> getUsers(Pageable pageable) {
    return userService.getAllUsers(pageable);
}
```

> 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다.

Spring MVC 의 `PageableHandlerMethodArgumentResolver` 가
쿼리 파라미터(`page`, `size`, `sort`)를 자동으로 `Pageable` 객체로 변환한다.

```java
// Before: 수동 페이징 (삭제됨)
@GetMapping("/page")
public Map<String, Object> getUsersWithPage(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
    List<User> all = userService.getAllUsers();
    List<User> paged = all.stream().skip(...).limit(...).toList();
    return Map.of("content", paged, ...);
}

// After: GET /users?page=0&size=10 으로 대체되어 /page 엔드포인트 삭제
```

---

## API 호출 예시

### 기본 조회 (기본값: page=0, size=20)

```bash
curl http://localhost:8080/users
```

### 페이지 지정

```bash
curl "http://localhost:8080/users?page=0&size=5"
```

### 정렬 추가

```bash
# 이름 오름차순
curl "http://localhost:8080/users?page=0&size=5&sort=name,asc"

# 이름 내림차순
curl "http://localhost:8080/users?sort=name,desc"

# 여러 필드 정렬
curl "http://localhost:8080/users?sort=name,asc&sort=id,desc"
```

### 검색 + 페이징

```bash
curl "http://localhost:8080/users/search?name=홍&page=0&size=5"
```

### 응답 예시

```json
{
  "content": [
    {"id": 1, "name": "홍길동", "email": "hong@example.com"},
    {"id": 2, "name": "홍길순", "email": "gilsun@example.com"}
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 5,
    "sort": {"sorted": true, "direction": "ASC", "property": "name"}
  },
  "totalElements": 8,
  "totalPages": 2,
  "number": 0,
  "size": 5,
  "first": true,
  "last": false,
  "numberOfElements": 5,
  "empty": false
}
```

---

## 실습 가이드

### 1. practice 브랜치로 전환

```bash
git checkout feature/pageable-practice
```

### 2. 실습 과제

#### 과제 1: UserRepository 에 Pageable 메서드 추가
- `findByNameContaining(String name, Pageable pageable)` 메서드를 추가한다
- 반환 타입은 `Page<UserEntity>`

#### 과제 2: UserService 수정
- `getAllUsers()` → `getAllUsers(Pageable pageable)` 로 변경
- `searchByName()` → `searchByName(String name, Pageable pageable)` 로 변경
- `Page.map()` 을 사용하여 Entity → DTO 변환

#### 과제 3: UserController 수정
- `GET /users` → `Pageable` 파라미터 추가, `Page<User>` 반환
- `GET /users/search` → `Pageable` 파라미터 추가, `Page<User>` 반환
- `GET /users/page` → 수동 페이징 코드 제거 (Pageable 로 대체)

### 3. 정답 확인

```bash
git diff feature/pageable-practice..feature/pageable
```

### 4. 테스트

```bash
# macOS / Linux
./gradlew bootRun

# Windows
gradlew.bat bootRun
```

> curl 명령어는 Windows에서는 Git Bash 또는 PowerShell에서 실행한다.

```bash
# 기본 조회
curl http://localhost:8080/users

# 페이징
curl "http://localhost:8080/users?page=0&size=5"

# 검색 + 페이징
curl "http://localhost:8080/users/search?name=홍&page=0&size=5"

# 정렬
curl "http://localhost:8080/users?sort=name,desc"
```

---

## 핵심 정리

> **Spring Data JPA 의 Pageable 을 사용하면 DB 레벨에서 효율적으로 페이징과 정렬을 처리할 수 있다. Controller 에 Pageable 파라미터를 추가하면 쿼리 파라미터(page, size, sort)가 자동 바인딩되고, Page 객체로 데이터와 메타정보를 함께 반환한다. 수동 페이징(skip/limit)은 전체 데이터를 메모리에 로드하므로 비효율적이다.**
