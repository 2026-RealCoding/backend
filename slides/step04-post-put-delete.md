---
marp: true
theme: default
paginate: true
---

# Step 4: Post, Put, Delete 요청 처리

**2026 RealCoding - Spring Boot Backend**

브랜치: `web/post` | 실습: `web/post-practice`

---

## 학습 목표

- HTTP 메서드별 의미(GET/POST/PUT/DELETE)를 이해한다
- `@RequestBody`로 JSON 요청을 수신한다
- 적절한 HTTP 상태코드를 반환한다
- 인메모리 CRUD를 구현한다

---

## HTTP 메서드와 CRUD

| HTTP 메서드 | CRUD | 의미 | 상태코드 |
|---|---|---|---|
| **GET** | Read | 조회 | 200 OK |
| **POST** | Create | 생성 | **201 Created** |
| **PUT** | Update | 전체 수정 | 200 OK |
| **DELETE** | Delete | 삭제 | **204 No Content** |

> 각 메서드에 맞는 **의미 있는 상태코드**를 반환하는 것이 REST API의 기본

> **멱등성이란?** 같은 요청을 여러 번 보내도 결과가 동일한 성질. "이름을 홍길동으로 바꿔줘"를 10번 보내도 이름은 홍길동(PUT, 멱등). "유저 추가해줘"를 10번 보내면 10명 추가(POST, 비멱등).

---

## Before vs After: 핵심 변화

**Before (web/get):** 하드코딩된 데이터

```java
@GetMapping
public List<User> getUsers() {
    return List.of(new User(1L, "홍길동", "hong@example.com")); // 불변!
}
```

**After (web/post):** 인메모리 저장소

```java
private final List<User> users = new ArrayList<>(List.of(...)); // 가변!
private final AtomicLong idGenerator = new AtomicLong(4); // (동시에 여러 요청이 와도 안전하게 숫자를 증가시키는 도구)

@GetMapping
public List<User> getUsers() {
    return users;  // 실제 데이터 반환
}
```

---

## @RequestBody란?

```
POST /users
Content-Type: application/json

{"name": "박민수", "email": "park@example.com"}
```

```java
@PostMapping
public ResponseEntity<User> createUser(@RequestBody User request) {
    // request.name() → "박민수"
    // request.email() → "park@example.com"
}
```

> Jackson이 **JSON을 Java 객체로 자동 변환**한다

---

## POST - 유저 생성 (201 Created)

```java
@PostMapping
public ResponseEntity<User> createUser(@RequestBody User request) {
    User newUser = new User(
            idGenerator.getAndIncrement(),  // 새 ID 발급
            request.name(),
            request.email()
    );
    users.add(newUser);
    return ResponseEntity
            .created(URI.create("/users/" + newUser.id()))  // 201
            .body(newUser);
}
```

- `201 Created` + `Location` 헤더로 생성된 리소스 위치 반환
- `@RequestBody`로 JSON 본문 수신

---

## PUT - 유저 수정 (200 OK)

```java
@PutMapping("/{id}")
public ResponseEntity<User> updateUser(
        @PathVariable Long id,
        @RequestBody User request) {
    for (int i = 0; i < users.size(); i++) {
        if (users.get(i).id().equals(id)) {
            User updated = new User(id, request.name(), request.email());
            users.set(i, updated);
            return ResponseEntity.ok(updated);      // 200 OK
        }
    }
    return ResponseEntity.notFound().build();        // 404 Not Found
}
```

- `@PathVariable` = **누구를**, `@RequestBody` = **어떻게** 수정
- record는 불변이므로 새 객체 생성 후 교체

---

## DELETE - 유저 삭제 (204 No Content)

> 지금 이해하지 못해도 괜찮다. 나중에 다시 만나게 된다. `removeIf(u -> ...)` 의 `->` 는 **람다 표현식**이라는 문법이다. "조건에 맞는 것을 삭제"라고 이해하면 충분하다.

```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
    boolean removed = users.removeIf(u -> u.id().equals(id));
    if (removed) {
        return ResponseEntity.noContent().build();   // 204 No Content
    }
    return ResponseEntity.notFound().build();         // 404 Not Found
}
```

- 삭제 성공 시 **본문 없이** 204 반환
- `ResponseEntity<Void>` = 응답 본문 없음

---

## 상태코드 정리

| 상태코드 | 의미 | 언제 사용? |
|---|---|---|
| `200 OK` | 성공 | GET 조회, PUT 수정 |
| `201 Created` | 생성 완료 | POST 생성 성공 |
| `204 No Content` | 성공 (본문 없음) | DELETE 삭제 성공 |
| `400 Bad Request` | 잘못된 요청 | 유효성 검증 실패 |
| `404 Not Found` | 리소스 없음 | 존재하지 않는 ID |

---

## API 테스트

> (Windows에서는 Git Bash 또는 PowerShell에서 실행)

```bash
# 생성
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"박민수","email":"park@example.com"}' \
  http://localhost:8080/users

# 수정
curl -X PUT -H "Content-Type: application/json" \
  -d '{"name":"홍길동2","email":"hong2@example.com"}' \
  http://localhost:8080/users/1

# 삭제
curl -X DELETE http://localhost:8080/users/1

# 확인
curl http://localhost:8080/users
```

---

## CRUD 흐름 한눈에

```
[클라이언트]                    [서버 - UserController]
    |                                |
    |--- POST /users (JSON) -------->|  createUser()  → 201 + 새 유저
    |--- GET /users ---------------->|  getUsers()    → 200 + 목록
    |--- GET /users/1 -------------->|  getUser()     → 200 + 유저
    |--- PUT /users/1 (JSON) ------->|  updateUser()  → 200 + 수정됨
    |--- DELETE /users/1 ----------->|  deleteUser()   → 204 (본문 없음)
```

---

## 실습: web/post-practice

```bash
git checkout web/post-practice
```

```bash
./gradlew bootRun
# Windows: gradlew.bat bootRun
```

TODO 빈칸을 채워 CRUD를 완성하세요!

**확인 포인트:**
1. POST 후 GET으로 목록에 추가되었는지 확인
2. PUT 후 GET으로 수정 반영 확인
3. DELETE 후 GET으로 삭제 확인
4. 없는 ID로 PUT/DELETE 시 404 확인

---

## 핵심 정리

> **`@RequestBody`로 JSON을 받아 POST(201), PUT(200), DELETE(204)를 구현하고, 각 HTTP 메서드의 의미에 맞는 상태코드를 반환한다.**

다음 단계: **Step 5 - Swagger (OpenAPI)** (`web/swagger`)
