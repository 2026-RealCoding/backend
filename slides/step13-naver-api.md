---
marp: true
theme: default
paginate: true
---

# Step 13: 외부 API 연동
## 네이버 쇼핑 검색 API

**2026 RealCoding**
브랜치: `shop/naver-api`

---

## 외부 API 연동이란?

지금까지: 우리 서버 안에서 데이터 관리
이번 단계: **다른 서비스의 데이터를 가져와서 사용**

```
[브라우저] → [우리 서버 (Spring Boot)] → [네이버 API 서버]
               클라이언트 역할              외부 서비스
```

우리 서버가 **HTTP 클라이언트** 역할을 한다

---

## RestClient - Spring 6.1+ 동기 HTTP 클라이언트

| HTTP 클라이언트 | 도입 시기 | 방식 | 상태 |
|----------------|----------|------|------|
| `RestTemplate` | Spring 3 | 동기 | 유지보수 모드 |
| `WebClient` | Spring 5 | 비동기 | 현역 |
| **`RestClient`** | **Spring 6.1** | **동기** | **권장** |

```java
// RestClient 생성
RestClient restClient = RestClient.builder()
        .baseUrl("https://openapi.naver.com")
        .build();
```

`RestTemplate`의 후속 - 더 간결하고 현대적인 API

---

## 네이버 쇼핑 검색 API

**엔드포인트**: `GET https://openapi.naver.com/v1/search/shop.json`

요청:
```
GET /v1/search/shop.json?query=맥북&display=10
Headers:
  X-Naver-Client-Id: {Client ID}
  X-Naver-Client-Secret: {Client Secret}
```

응답:
```json
{
  "total": 12345,
  "display": 10,
  "items": [
    { "title": "맥북 프로", "lprice": "2390000", "brand": "Apple" }
  ]
}
```

---

## DTO 정의 (record)

```java
// 전체 응답 구조
public record NaverShoppingResponse(
    String lastBuildDate,
    int total,
    int start,
    int display,
    List<ShoppingItem> items
) { }

// 개별 상품 정보
public record ShoppingItem(
    String title,       // 상품명
    String link,        // 상품 URL
    String image,       // 이미지 URL
    String lprice,      // 최저가
    String hprice,      // 최고가
    String mallName,    // 쇼핑몰
    Long productId,     // 상품 ID
    String brand,       // 브랜드
    String maker        // 제조사
    // ...
) { }
```

**JSON 필드명 = record 필드명 -> 자동 매핑**

---

## NaverShoppingService 구현

```java
@Service
public class NaverShoppingService {

    private final RestClient restClient;

    @Value("${naver.client-id}")       // 설정 파일에서 주입
    private String clientId;

    @Value("${naver.client-secret}")
    private String clientSecret;

    public NaverShoppingService() {
        this.restClient = RestClient.builder()
                .baseUrl("https://openapi.naver.com")
                .build();
    }
    // ...
}
```

---

## RestClient 호출 흐름

```java
public List<ShoppingItem> searchProducts(String query, int display) {

    NaverShoppingResponse response = restClient.get()   // 1. GET 메서드
        .uri(uriBuilder -> uriBuilder                    // 2. URL 구성
            .path("/v1/search/shop.json")
            .queryParam("query", query)
            .queryParam("display", display)
            .build())
        .header("X-Naver-Client-Id", clientId)           // 3. 인증 헤더
        .header("X-Naver-Client-Secret", clientSecret)
        .retrieve()                                       // 4. 요청 실행
        .body(NaverShoppingResponse.class);               // 5. JSON → 객체

    return response.items();
}
```

**메서드 체이닝(Method Chaining)**: 각 메서드가 자기 자신을 반환하여 `.`으로 연결하는 패턴. 마치 문장을 읽듯이 코드를 작성할 수 있다.

---

## ShoppingController

```java
@RestController
@RequestMapping("/shop")
public class ShoppingController {

    private final NaverShoppingService naverShoppingService;

    public ShoppingController(NaverShoppingService naverShoppingService) {
        this.naverShoppingService = naverShoppingService;
    }

    // GET /shop/search?query=맥북&display=10
    @GetMapping("/search")
    public List<ShoppingItem> searchProducts(
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int display) {
        return naverShoppingService.searchProducts(query, display);
    }
}
```

---

## @Value + 환경변수 폴백

```properties
# application.properties
naver.client-id=${NAVER_CLIENT_ID:your-client-id}
naver.client-secret=${NAVER_CLIENT_SECRET:your-client-secret}
```

```
${NAVER_CLIENT_ID:your-client-id}
  ↓
환경변수 NAVER_CLIENT_ID가 있으면 → 그 값 사용
없으면 → "your-client-id" (기본값) 사용
```

> **주의:** API 키를 소스코드에 직접 입력하면 안 된다! 반드시 환경변수나 설정 파일을 사용하자.

- 코드에 넣으면 → Git에 노출될 위험
- 환경변수로 관리 → 안전

---

## 전체 호출 흐름

```
[Client]
  ↓  GET /shop/search?query=맥북
[ShoppingController]
  ↓  naverShoppingService.searchProducts("맥북", 10)
[NaverShoppingService]
  ↓  RestClient → 네이버 API 서버
[네이버 API 서버]
  ↓  JSON 응답
[NaverShoppingService]
  ↓  NaverShoppingResponse → List<ShoppingItem>
[ShoppingController]
  ↓  JSON 응답
[Client]
```

계층 구조 유지: Controller -> Service -> 외부 API

---

## 실습 (practice 브랜치)

```bash
git checkout shop/naver-api-practice
```

**사전 준비:** https://developers.naver.com 에서 API 키 발급

**과제:**
1. `NaverShoppingResponse`, `ShoppingItem` DTO 작성
2. `NaverShoppingService` 구현 (RestClient + @Value)
3. `ShoppingController` 구현 (GET /shop/search)
4. `application.properties`에 API 키 설정

**테스트:**
```bash
# macOS / Linux
export NAVER_CLIENT_ID=발급받은_ID
export NAVER_CLIENT_SECRET=발급받은_Secret

# Windows (cmd)
set NAVER_CLIENT_ID=발급받은_ID
set NAVER_CLIENT_SECRET=발급받은_Secret

# Windows (PowerShell)
$env:NAVER_CLIENT_ID="발급받은_ID"
$env:NAVER_CLIENT_SECRET="발급받은_Secret"

./gradlew bootRun
# Windows: gradlew.bat bootRun

# (Windows에서는 Git Bash 또는 PowerShell에서 실행)
curl "http://localhost:8080/shop/search?query=맥북&display=5"
```

---

## 핵심 정리

> **RestClient로 외부 API를 호출하고, JSON 응답을 DTO로 변환한다.
> API 키는 @Value + 환경변수 폴백으로 안전하게 관리한다.**

**기억할 키워드:**
- `RestClient` - Spring 6.1+ 동기 HTTP 클라이언트
- `.retrieve().body(Class)` - JSON 자동 변환
- `@Value("${key}")` - 설정 값 주입
- `${ENV_VAR:default}` - 환경변수 폴백 패턴
