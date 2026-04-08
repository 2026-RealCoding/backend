# Step 13: 외부 API 연동 - 네이버 쇼핑 검색

> **브랜치**: `shop/naver-api`
> **실습 브랜치**: `shop/naver-api-practice`

---

## 학습 목표

1. RestClient를 사용하여 외부 API를 호출하는 방법을 이해한다
2. 네이버 쇼핑 검색 API의 요청/응답 구조를 이해한다
3. @Value를 사용한 외부 설정 주입과 환경변수 폴백을 구현할 수 있다
4. 외부 API 응답을 DTO(record)로 매핑하는 방법을 이해한다

---

## 핵심 개념

### 외부 API 연동이란?

지금까지는 우리 서버 안에서 데이터를 관리했다. 하지만 실무에서는 다른 서비스의 데이터를 가져와서 사용하는 일이 매우 많다. 이것이 **외부 API 연동**이다.

```
[브라우저] → [우리 서버] → [네이버 API 서버]
              ↑                    ↑
          Spring Boot       openapi.naver.com
```

우리 서버가 **클라이언트** 역할을 해서 네이버 API 서버에 HTTP 요청을 보낸다.

### RestClient란?

Spring 6.1+에서 도입된 **동기 HTTP 클라이언트**이다. 이전의 `RestTemplate`의 후속이다.

| HTTP 클라이언트 | 도입 시기 | 방식 | 상태 |
|----------------|----------|------|------|
| `RestTemplate` | Spring 3.0 | 동기 | 유지보수 모드 |
| `WebClient` | Spring 5.0 | 비동기/리액티브 | 현역 |
| **`RestClient`** | **Spring 6.1** | **동기** | **현역 (권장)** |

`RestClient`는 `RestTemplate`보다 간결하고 현대적인 API를 제공한다. 동기 방식이 필요할 때 권장된다.

### 네이버 쇼핑 검색 API

- **엔드포인트**: `GET https://openapi.naver.com/v1/search/shop.json`
- **인증 방식**: 헤더에 Client ID와 Client Secret을 포함
- **API 등록**: https://developers.naver.com 에서 앱을 등록하면 키를 발급받을 수 있다

#### 요청

```
GET /v1/search/shop.json?query=맥북&display=10
Headers:
  X-Naver-Client-Id: {발급받은 Client ID}
  X-Naver-Client-Secret: {발급받은 Client Secret}
```

#### 응답

```json
{
  "lastBuildDate": "Mon, 17 Feb 2026 10:00:00 +0900",
  "total": 12345,
  "start": 1,
  "display": 10,
  "items": [
    {
      "title": "<b>맥북</b> 프로 14인치",
      "link": "https://...",
      "image": "https://...",
      "lprice": "2390000",
      "hprice": "2890000",
      "mallName": "네이버",
      "productId": 12345678,
      "brand": "Apple",
      "maker": "Apple",
      "category1": "디지털/가전",
      "category2": "노트북",
      "category3": "Apple",
      "category4": ""
    }
  ]
}
```

### @Value와 환경변수

> **주의:** API 키를 소스코드에 직접 입력하면 안 된다! 반드시 환경변수나 설정 파일을 사용하자.

API 키 같은 민감한 정보는 코드에 직접 넣으면 안 된다. 설정 파일 또는 환경변수에서 주입받는다.

```java
// application.properties의 값을 필드에 주입
@Value("${naver.client-id}")
private String clientId;
```

```properties
# 환경변수 폴백: 환경변수가 있으면 그 값, 없으면 기본값 사용
naver.client-id=${NAVER_CLIENT_ID:your-client-id}
naver.client-secret=${NAVER_CLIENT_SECRET:your-client-secret}
```

- `${NAVER_CLIENT_ID:your-client-id}` 의미:
  - 환경변수 `NAVER_CLIENT_ID`가 있으면 → 그 값 사용
  - 없으면 → `your-client-id` (기본값) 사용

---

## 주요 코드

### DTO: NaverShoppingResponse

```java
package com.inspire12.backend.dto;

import java.util.List;

// 네이버 쇼핑 검색 API의 전체 응답 구조
// JSON 필드명과 record 필드명이 동일하면 자동 매핑됨
public record NaverShoppingResponse(
        String lastBuildDate,        // 검색 결과 생성 시간
        int total,                   // 전체 검색 결과 수
        int start,                   // 검색 시작 위치
        int display,                 // 한 번에 표시할 검색 결과 수
        List<ShoppingItem> items     // 상품 목록
) {
}
```

### DTO: ShoppingItem

```java
package com.inspire12.backend.dto;

// 네이버 쇼핑 검색 API 응답의 개별 상품 정보
// JSON 필드명과 동일하게 record 필드를 정의하면 자동 매핑됨
public record ShoppingItem(
        String title,           // 상품명 (HTML 태그 포함 가능)
        String link,            // 상품 상세 URL
        String image,           // 상품 이미지 URL
        String lprice,          // 최저가
        String hprice,          // 최고가
        String mallName,        // 쇼핑몰 이름
        Long productId,         // 상품 ID
        String productType,     // 상품 타입
        String brand,           // 브랜드
        String maker,           // 제조사
        String category1,       // 카테고리 1
        String category2,       // 카테고리 2
        String category3,       // 카테고리 3
        String category4        // 카테고리 4
) {
}
```

### NaverShoppingService

```java
package com.inspire12.backend.service;

import com.inspire12.backend.dto.NaverShoppingResponse;
import com.inspire12.backend.dto.ShoppingItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
public class NaverShoppingService {

    private static final Logger log = LoggerFactory.getLogger(NaverShoppingService.class);

    private final RestClient restClient;

    // application.properties에서 값을 주입받음
    @Value("${naver.client-id}")
    private String clientId;

    @Value("${naver.client-secret}")
    private String clientSecret;

    public NaverShoppingService() {
        // RestClient 생성: baseUrl을 지정하면 이후 호출에서 경로만 사용 가능
        this.restClient = RestClient.builder()
                .baseUrl("https://openapi.naver.com")
                .build();
    }

    public List<ShoppingItem> searchProducts(String query, int display) {
        log.info("네이버 쇼핑 검색 요청 - query: {}, display: {}", query, display);

        NaverShoppingResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1/search/shop.json")
                        .queryParam("query", query)
                        .queryParam("display", display)
                        .build())
                // 네이버 API 인증 헤더
                .header("X-Naver-Client-Id", clientId)
                .header("X-Naver-Client-Secret", clientSecret)
                // 응답을 NaverShoppingResponse로 변환
                .retrieve()
                .body(NaverShoppingResponse.class);

        if (response == null || response.items() == null) {
            log.warn("네이버 쇼핑 검색 결과 없음 - query: {}", query);
            return List.of();
        }

        log.info("네이버 쇼핑 검색 완료 - 총 {}건 중 {}건 반환",
                response.total(), response.items().size());
        return response.items();
    }
}
```

#### RestClient 호출 흐름 분석

아래 코드는 **메서드 체이닝(Method Chaining)** 패턴을 사용한다. 각 메서드가 자기 자신을 반환하여 `.`으로 연결하는 방식으로, 마치 문장을 읽듯이 코드를 작성할 수 있다.

```java
restClient.get()                    // 1. HTTP GET 메서드
    .uri(uriBuilder -> uriBuilder   // 2. URL 구성
        .path("/v1/search/shop.json")
        .queryParam("query", query)
        .queryParam("display", display)
        .build())
    .header("X-Naver-Client-Id", clientId)       // 3. 인증 헤더
    .header("X-Naver-Client-Secret", clientSecret)
    .retrieve()                     // 4. 요청 실행
    .body(NaverShoppingResponse.class);           // 5. 응답 → 객체 변환
```

### ShoppingController

```java
package com.inspire12.backend.controller;

import com.inspire12.backend.dto.ShoppingItem;
import com.inspire12.backend.service.NaverShoppingService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

### application.properties

```properties
# 네이버 API 키 설정
# 환경변수가 있으면 환경변수 사용, 없으면 기본값 사용
naver.client-id=${NAVER_CLIENT_ID:your-client-id}
naver.client-secret=${NAVER_CLIENT_SECRET:your-client-secret}
```

### 전체 호출 흐름

```
[Client]
  ↓  GET /shop/search?query=맥북&display=10
[ShoppingController]
  ↓  naverShoppingService.searchProducts("맥북", 10)
[NaverShoppingService]
  ↓  RestClient → GET https://openapi.naver.com/v1/search/shop.json?query=맥북&display=10
[네이버 API 서버]
  ↓  JSON 응답
[NaverShoppingService]
  ↓  NaverShoppingResponse → List<ShoppingItem>
[ShoppingController]
  ↓  JSON 응답
[Client]
```

---

## 실습 가이드

### 1. 네이버 개발자 센터에서 API 키 발급

1. https://developers.naver.com 접속
2. 애플리케이션 등록 → "검색" API 선택
3. Client ID와 Client Secret 발급

### 2. practice 브랜치로 전환

```bash
git checkout shop/naver-api-practice
```

### 3. 실습 과제

#### 과제 1: DTO 클래스 작성
- `NaverShoppingResponse` record를 작성한다 (lastBuildDate, total, start, display, items)
- `ShoppingItem` record를 작성한다 (title, link, image, lprice 등)

#### 과제 2: NaverShoppingService 구현
- `RestClient`를 생성하고 `baseUrl`을 설정한다
- `@Value`로 API 키를 주입받는다
- `searchProducts` 메서드를 구현한다

#### 과제 3: ShoppingController 구현
- `GET /shop/search` 엔드포인트를 만든다
- `query`와 `display` 파라미터를 받는다

#### 과제 4: 설정 파일 작성
- `application.properties`에 네이버 API 키 설정을 추가한다

### 4. 정답 확인

```bash
git diff shop/naver-api-practice..shop/naver-api
```

### 5. 테스트

```bash
# 환경변수로 API 키 설정 후 실행

# macOS / Linux
export NAVER_CLIENT_ID=발급받은_Client_ID
export NAVER_CLIENT_SECRET=발급받은_Client_Secret

# Windows (cmd)
set NAVER_CLIENT_ID=발급받은_Client_ID
set NAVER_CLIENT_SECRET=발급받은_Client_Secret

# Windows (PowerShell)
$env:NAVER_CLIENT_ID="발급받은_Client_ID"
$env:NAVER_CLIENT_SECRET="발급받은_Client_Secret"

./gradlew bootRun
# Windows: gradlew.bat bootRun

# 상품 검색 (Windows에서는 Git Bash 또는 PowerShell에서 실행)
curl "http://localhost:8080/shop/search?query=맥북&display=5"

# Swagger UI에서 테스트
# http://localhost:8080/swagger-ui.html
```

---

## 핵심 정리

> **RestClient는 Spring 6.1+의 동기 HTTP 클라이언트로, 외부 API를 호출하여 JSON 응답을 DTO로 변환할 수 있다. API 키 같은 민감 정보는 @Value + 환경변수 폴백으로 안전하게 관리한다.**
