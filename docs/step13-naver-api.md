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

네이버 쇼핑 검색 API를 사용하려면 **네이버 개발자 센터**에서 애플리케이션을 등록하고 Client ID / Client Secret를 발급받아야 한다. 발급은 무료이며, 네이버 계정만 있으면 된다.

#### 1-1. 네이버 개발자 센터 접속 및 로그인

1. https://developers.naver.com 접속
2. 우측 상단 **로그인** → 네이버 계정으로 로그인
3. 상단 메뉴에서 **Application** → **애플리케이션 등록** 클릭
   - 또는 바로 https://developers.naver.com/apps/#/register 접속

#### 1-2. 애플리케이션 등록 정보 입력

| 항목 | 입력 값 |
|------|---------|
| **애플리케이션 이름** | `2026-realcoding-backend` (원하는 이름) |
| **사용 API** | `검색` 선택 (드롭다운에서) |
| **비로그인 오픈 API 서비스 환경** | `WEB 설정` 선택 |
| **웹 서비스 URL** | `http://localhost:8080` 입력 |

> **"사용 API"**에서 반드시 **"검색"**을 선택해야 한다. 다른 API를 선택하면 쇼핑 검색 호출 시 401/403 에러가 발생한다.

#### 1-3. 약관 동의 후 등록

1. 약관 동의 체크
2. **등록하기** 버튼 클릭
3. 등록 완료 후 내 애플리케이션 목록으로 이동

#### 1-4. Client ID / Client Secret 확인

1. 방금 등록한 애플리케이션 이름 클릭
2. **개요** 탭에서 다음을 확인할 수 있다:
   - **Client ID**: 공개 식별자 (예: `abcd1234efgh5678`)
   - **Client Secret**: 비밀키 — **보기** 버튼을 눌러야 표시된다

> **중요:**
> - **Client Secret는 절대 공개되면 안 된다.** GitHub, 블로그, 스크린샷 등에 노출되지 않도록 주의하자.
> - 실수로 노출한 경우 즉시 **재발급** 버튼을 눌러 새 키를 발급받자.
> - 본 강의에서는 환경변수로 관리하여 소스코드에 직접 넣지 않는다.

#### 1-5. 호출량 한도 (참고)

- 검색 API는 **일 25,000회**까지 무료 호출이 가능하다
- 한도 초과 시 429 (Too Many Requests) 응답이 반환된다
- 실습에는 충분한 한도이다

#### 1-6. 발급받은 키 설정 — 두 가지 방법

발급받은 키는 **소스코드나 `application.properties`에 직접 입력하지 말 것!** 대신 다음 두 방법 중 하나를 사용한다.

> **복습:** Step 8에서 배운 `.env` 파일 방식과 Step 1에서 배운 OS 환경변수 방식이다. 둘 다 민감 정보를 코드에서 분리하여 Git 유출을 방지하는 방법이다.

##### 방법 A: `.env` 파일 사용 (권장, 편리함)

**`application.properties`에 다음이 이미 있는지 확인:**

```properties
spring.config.import=optional:file:.env[.properties]
```

**프로젝트 루트의 `.env.example`을 복사하여 `.env` 파일 생성:**

```bash
# macOS / Linux / Git Bash
cp .env.example .env

# Windows (cmd)
copy .env.example .env
```

**`.env` 파일을 열어 본인 값으로 채운다:**

```properties
# .env
naver.client-id=발급받은_Client_ID
naver.client-secret=발급받은_Client_Secret
```

**실행:**

```bash
./gradlew bootRun
# Windows: gradlew.bat bootRun
```

> **장점:**
> - 매번 환경변수를 설정할 필요가 없다 (파일로 저장됨)
> - IntelliJ, 터미널 어디서 실행해도 동일하게 동작한다
> - `.gitignore`에 등록되어 있어 Git 유출 위험이 없다

##### 방법 B: OS 환경변수 사용 (CI/CD, 서버 배포에 적합)

```bash
# macOS / Linux
export NAVER_CLIENT_ID=발급받은_Client_ID
export NAVER_CLIENT_SECRET=발급받은_Client_Secret
```

```cmd
:: Windows (cmd)
set NAVER_CLIENT_ID=발급받은_Client_ID
set NAVER_CLIENT_SECRET=발급받은_Client_Secret
```

```powershell
# Windows (PowerShell)
$env:NAVER_CLIENT_ID="발급받은_Client_ID"
$env:NAVER_CLIENT_SECRET="발급받은_Client_Secret"
```

> **주의:** cmd/PowerShell에서 `set`/`$env:`은 **현재 세션에만 적용**된다. 터미널을 닫으면 사라진다. 영구 저장하려면 **시스템 환경 변수**에 등록해야 한다.

##### 두 방법의 우선순위

`application.properties`의 값은 다음 순서로 덮어써진다 (나중이 더 강함):

1. `application.properties` 기본값 (`your-client-id`)
2. `.env` 파일 값
3. OS 환경변수 (`NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`)

> 즉, `.env`와 OS 환경변수가 동시에 있으면 **OS 환경변수가 이긴다**.

```bash
# macOS / Linux (.zshrc 또는 .bashrc에 추가하면 영구 저장)
export NAVER_CLIENT_ID=발급받은_Client_ID
export NAVER_CLIENT_SECRET=발급받은_Client_Secret
```

```cmd
:: Windows (cmd) - 현재 세션에만 적용
set NAVER_CLIENT_ID=발급받은_Client_ID
set NAVER_CLIENT_SECRET=발급받은_Client_Secret
```

```powershell
# Windows (PowerShell) - 현재 세션에만 적용
$env:NAVER_CLIENT_ID="발급받은_Client_ID"
$env:NAVER_CLIENT_SECRET="발급받은_Client_Secret"
```

> **영구 저장 팁 (Windows):** `Windows키 + R` → `sysdm.cpl` → **고급 탭** → **환경 변수** → **사용자 변수 새로 만들기**에서 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`을 등록하면 재부팅 후에도 유지된다.

#### 1-7. IntelliJ에서 실행할 때 환경변수 설정

터미널이 아닌 IntelliJ의 **Run** 버튼으로 실행한다면 환경변수를 별도로 등록해야 한다:

1. 상단 툴바 → **BackendApplication** 드롭다운 → **Edit Configurations...**
2. **Environment variables** 필드 우측 아이콘 클릭
3. 다음을 추가:
   - `NAVER_CLIENT_ID` = `발급받은_Client_ID`
   - `NAVER_CLIENT_SECRET` = `발급받은_Client_Secret`
4. **OK** → 이후 Run 시 자동 적용됨

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
