# Step 4: Post, Put, Delete 요청 처리

> **브랜치:** `web/post`
> **실습 브랜치:** `web/post-practice`

---

## 학습 목표

- HTTP 메서드별 의미(GET/POST/PUT/DELETE)를 이해한다.
- `@RequestBody`로 JSON 요청 본문을 수신할 수 있다.
- `ResponseEntity`로 201 Created, 204 No Content 등 적절한 상태코드를 반환할 수 있다.
- 인메모리 `ArrayList`를 이용해 간단한 CRUD를 구현할 수 있다.
- Step 3(GET only)에서 Step 4(CRUD)로의 변화를 이해한다.

---

## 핵심 개념 설명

### HTTP 메서드와 CRUD

REST API에서 각 HTTP 메서드는 특정 작업을 의미한다:

| HTTP 메서드 | CRUD | 의미 | 멱등성 |
|---|---|---|---|
| **GET** | Read | 조회 | O (여러 번 호출해도 결과 동일) |
| **POST** | Create | 생성 | X (호출할 때마다 새 리소스 생성) |
| **PUT** | Update | 전체 수정 | O (같은 데이터로 여러 번 수정해도 동일) |
| **DELETE** | Delete | 삭제 | O (이미 삭제된 것을 다시 삭제해도 동일) |

> **멱등성(Idempotency)이란?** 같은 요청을 여러 번 보내도 결과가 동일한 성질을 말한다. 예를 들어, "이름을 홍길동으로 변경해줘"를 10번 보내도 이름은 여전히 홍길동이다(PUT, 멱등). 반면 "유저를 한 명 추가해줘"를 10번 보내면 10명이 추가된다(POST, 비멱등).

### @RequestBody

클라이언트가 보낸 **JSON 요청 본문**을 Java 객체로 변환한다.

```
POST /users
Content-Type: application/json

{"name": "박민수", "email": "park@example.com"}
```

위 JSON이 `@RequestBody User request`를 통해 `User` 객체로 자동 변환된다 (Jackson이 처리).

### 적절한 HTTP 상태코드

| 상태코드 | 의미 | 사용 시점 |
|---|---|---|
| 200 OK | 성공 | GET 조회, PUT 수정 성공 |
| 201 Created | 생성 완료 | POST로 새 리소스 생성 |
| 204 No Content | 성공 (본문 없음) | DELETE 삭제 성공 |
| 400 Bad Request | 잘못된 요청 | 유효하지 않은 입력 |
| 404 Not Found | 리소스 없음 | 존재하지 않는 ID 조회 |

---

## 주요 코드

### Before (web/get) - GET만 존재

```java
@RestController
@RequestMapping("/users")
public class UserController {

    // 하드코딩된 데이터를 직접 반환
    @GetMapping
    public List<User> getUsers() {
        return List.of(
                new User(1L, "홍길동", "hong@example.com"),
                new User(2L, "김철수", "kim@example.com")
        );
    }

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return new User(id, "홍길동", "hong@example.com");
    }
    // ... GET 메서드들만 존재
}
```

**문제점:**
- 데이터가 하드코딩되어 있어 추가/수정/삭제 불가
- 항상 같은 데이터만 반환

### After (web/post) - CRUD 완성

```java
@RestController
@RequestMapping("/users")
public class UserController {

    // 인메모리 저장소
    private final List<User> users = new ArrayList<>(List.of(
            new User(1L, "홍길동", "hong@example.com"),
            new User(2L, "김철수", "kim@example.com"),
            new User(3L, "이영희", "lee@example.com")
    ));
    private final AtomicLong idGenerator = new AtomicLong(4); // (동시에 여러 요청이 와도 안전하게 숫자를 증가시키는 도구)
```

**변경점:**
- `List.of()`(불변) 대신 `ArrayList`(가변)를 사용하여 데이터 추가/삭제 가능
- `AtomicLong`으로 새 유저의 ID를 자동 생성

#### GET (조회) - 실제 데이터 사용

> 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다. 아래 코드에서 `.stream()`, `.filter()`, `.findFirst()` 등은 Java의 **Stream API**로, 리스트에서 원하는 데이터를 찾는 방법이다. 지금은 "리스트에서 조건에 맞는 것을 찾는 코드"라고 이해하면 충분하다.

```java
    @GetMapping
    public List<User> getUsers() {
        return users;    // 인메모리 리스트 반환
    }

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return users.stream()                    // 리스트를 하나씩 살펴보면서
                .filter(u -> u.id().equals(id))  // id가 일치하는 것을 찾아서
                .findFirst()                     // 첫 번째 결과를 가져온다
                .orElse(null);                   // 없으면 null 반환
    }

    @GetMapping("/search")
    public List<User> searchUsers(@RequestParam String name) {
        return users.stream()                        // 리스트를 하나씩 살펴보면서
                .filter(u -> u.name().contains(name)) // 이름에 검색어가 포함된 것만
                .toList();                            // 리스트로 모은다
    }
```

#### POST (생성) - 201 Created

```java
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User request) {
        User newUser = new User(
                idGenerator.getAndIncrement(),   // 새 ID 자동 발급
                request.name(),
                request.email()
        );
        users.add(newUser);
        return ResponseEntity
                .created(URI.create("/users/" + newUser.id()))  // 201 + Location 헤더
                .body(newUser);
    }
```

**핵심 포인트:**
- `@RequestBody`로 JSON을 `User` 객체로 변환
- `ResponseEntity.created()`로 201 상태코드 반환
- `URI.create("/users/" + id)`로 생성된 리소스의 위치(Location 헤더) 설정

#### PUT (수정) - 200 OK 또는 404

```java
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @RequestBody User request) {
        for (int i = 0; i < users.size(); i++) {
            if (users.get(i).id().equals(id)) {
                User updated = new User(id, request.name(), request.email());
                users.set(i, updated);
                return ResponseEntity.ok(updated);           // 200 OK
            }
        }
        return ResponseEntity.notFound().build();             // 404 Not Found
    }
```

**핵심 포인트:**
- `@PathVariable`로 수정할 대상 ID, `@RequestBody`로 수정할 데이터를 받음
- record는 불변이므로 새 `User` 객체를 생성하여 교체
- 해당 ID가 없으면 404 반환

#### DELETE (삭제) - 204 No Content 또는 404

> 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다. `removeIf(u -> u.id().equals(id))` 에서 `u -> ...` 부분은 **람다 표현식(Lambda)**이라는 문법이다. 지금은 "조건에 맞는 항목을 삭제하는 코드"라고 이해하면 충분하다.

```java
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        boolean removed = users.removeIf(u -> u.id().equals(id));
        if (removed) {
            return ResponseEntity.noContent().build();        // 204 No Content
        }
        return ResponseEntity.notFound().build();             // 404 Not Found
    }
```

**핵심 포인트:**
- 삭제 성공 시 **본문 없이** 204 반환 (삭제된 데이터를 굳이 보낼 필요 없음)
- `ResponseEntity<Void>` - 응답 본문이 없음을 명시

---

## API 테스트 (curl 명령어)

> (Windows에서는 Git Bash 또는 PowerShell에서 실행)

```bash
# 전체 조회
curl http://localhost:8080/users

# 생성 (POST)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"박민수","email":"park@example.com"}' \
  http://localhost:8080/users

# 수정 (PUT)
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"name":"홍길동2","email":"hong2@example.com"}' \
  http://localhost:8080/users/1

# 삭제 (DELETE)
curl -X DELETE http://localhost:8080/users/1

# 삭제 확인
curl http://localhost:8080/users
```

---

## 실습 가이드

### 브랜치 전환

```bash
# 완성 코드 확인
git checkout web/post

# 실습 (TODO 빈칸 채우기)
git checkout web/post-practice
```

### 서버 실행

```bash
./gradlew bootRun
# Windows: gradlew.bat bootRun
```

### practice 브랜치 사용법

`web/post-practice` 브랜치에는 POST, PUT, DELETE 메서드의 핵심 부분이 TODO로 비어 있다.

예시:
```java
@PostMapping
public ResponseEntity<User> createUser(/* TODO: JSON 본문을 User로 받기 */) {
    // TODO: 새 User 생성 및 리스트에 추가
    // TODO: 201 Created 응답 반환
}
```

### 확인 포인트

1. POST 후 GET으로 생성된 유저가 목록에 있는지 확인
2. PUT 후 GET으로 수정된 내용이 반영되었는지 확인
3. DELETE 후 GET으로 삭제된 유저가 목록에서 사라졌는지 확인
4. 존재하지 않는 ID로 PUT/DELETE 시 404가 반환되는지 확인

---

## 핵심 정리

> **`@RequestBody`로 JSON을 받아 POST(생성, 201), PUT(수정, 200), DELETE(삭제, 204)를 구현하고, 인메모리 ArrayList로 간단한 CRUD를 완성하며, 각 HTTP 메서드에 맞는 상태코드를 반환한다.**
