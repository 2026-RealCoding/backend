---
marp: true
theme: default
paginate: true
---

# Step 1: 개발 환경 설정

**2026 RealCoding - Spring Boot Backend**

코드를 작성하기 전에, 개발에 필요한 도구를 설치합니다.

---

## 학습 목표

- Java 21을 설치하고 버전을 확인할 수 있다
- IntelliJ IDEA를 설치하고 프로젝트를 열 수 있다
- Postman을 설치하고 간단한 요청을 보낼 수 있다
- Git을 설치하고 저장소를 클론할 수 있다

---

## 시작하기 전에

- **인터넷 연결** 필요 (모든 설치 파일을 다운로드)
- 약 **5GB 이상 여유 디스크 공간** 필요
- 학교 네트워크가 느리면 **미리 집에서 설치**해오는 것을 권장

| 도구 | 용도 | 필수 |
|------|------|------|
| **Java 21** | 프로그래밍 언어 & 실행 환경 | O |
| **IntelliJ IDEA** | 코드 편집기 (IDE) | O |
| **Postman** | API 테스트 도구 | O |
| **Git** | 소스코드 버전 관리 | O |

---

## Java란?

- **프로그래밍 언어**이자 **실행 환경**이다
- Spring Boot 프로젝트를 컴파일하고 실행하려면 컴퓨터에 Java가 설치되어 있어야 한다
- 이 강의에서 사용할 프레임워크(Spring Boot)는 **Java 17 이상**이 필요하며, 우리는 **Java 21**을 사용한다

---

## Java 21 설치 - macOS

```bash
# Homebrew 설치 (이미 있으면 건너뛰기)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Java 21 설치
brew install openjdk@21
```

> Homebrew는 macOS용 패키지 관리자다 (앱 스토어 같은 것)

---

## macOS - 환경변수 설정

> **환경변수란?** 운영체제가 프로그램을 찾을 때 참고하는 "주소록"이다.
> `JAVA_HOME`은 Java가 설치된 위치, `PATH`는 명령어를 찾아볼 폴더 목록을 뜻한다.

```bash
# ~/.zshrc에 환경변수 추가 (컴퓨터가 Java 위치를 기억하도록 등록)
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 21)' >> ~/.zshrc
echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> ~/.zshrc

# 설정 적용
source ~/.zshrc

# 확인
java -version
```

> `openjdk version "21.x.x"` 이 출력되면 성공!

---

## Java 21 설치 - Windows (1/2)

**1단계: 다운로드**
- https://adoptium.net/ 접속
- **Temurin 21 (LTS)** 선택 → **Windows x64** → `.msi` 다운로드

**2단계: 설치** — 옵션 반드시 확인!

| 옵션 | 설정 |
|------|------|
| **Set JAVA_HOME variable** | **반드시 체크** |
| **Add to PATH** | **반드시 체크** |

> **중요:** "Set JAVA_HOME variable"을 체크하지 않으면
> 이후 Gradle 빌드 시 Java를 찾지 못해 에러가 발생한다!

---

## Java 21 설치 - Windows (2/2)

**3단계: 확인**

`Windows키` 누르고 `cmd` 검색 → "명령 프롬프트" 클릭 (**새 창**을 열어야 한다!)

```cmd
java -version
```

> `openjdk version "21.0.x"` 이 출력되면 성공!

**안 되면? 수동 환경변수 설정:**
1. `Windows키 + R` → `sysdm.cpl` 입력 → 확인
2. **고급** 탭 → **환경 변수** 클릭
3. 시스템 변수 → **새로 만들기**: `JAVA_HOME` = `C:\Program Files\Eclipse Adoptium\jdk-21...`
4. **Path** 편집 → **새로 만들기** → `%JAVA_HOME%\bin` 추가

---

## IntelliJ IDEA 설치

**다운로드:** https://www.jetbrains.com/idea/download/

| | Community (무료) | Ultimate (유료) |
|---|---|---|
| Java / Spring Boot 개발 | O | O |
| Spring 전용 지원 (자동완성) | X | O |
| 데이터베이스 도구 | X | O |
| 가격 | **무료** | **학생 무료** (edu 이메일) |

> Community Edition으로 충분! Ultimate은 https://www.jetbrains.com/student/

---

## IntelliJ 설치 - OS별

### macOS
```bash
brew install --cask intellij-idea-ce
```
또는 홈페이지에서 `.dmg` 다운로드

### Windows
`.exe` 다운로드 후 설치. 옵션:

| 설치 옵션 | 권장 |
|---|---|
| Create Desktop Shortcut | 체크 |
| Add "Open Folder as Project" | **체크** (우클릭으로 프로젝트 열기) |
| Add to PATH | 체크 |
| Associate .java files | 체크 |

---

## IntelliJ - 프로젝트 열기

1. IntelliJ 실행 → **Open** (또는 File → Open)
2. 클론한 `cnu26-backend` 폴더 선택
3. **Open as Project** 선택
4. Gradle sync가 시작된다 (처음에는 **수 분** 소요)
5. 우측 하단 진행 바가 사라지면 완료!

> **Gradle**은 프로젝트를 빌드하고 외부 라이브러리를 관리하는 도구다.

---

## IntelliJ - JDK 설정 확인 (중요!)

IntelliJ가 올바른 Java를 사용하는지 확인한다:

**Project SDK:**
- `File` → `Project Structure` (macOS: `Cmd+;` / Windows: `Ctrl+Alt+Shift+S`)
- **Project** 탭 → SDK = **Java 21** 확인
- 목록에 없으면 **Add SDK** → **Download JDK** → 21 선택

**Gradle JDK:**
- `File` → `Settings` (macOS: `Preferences`)
- `Build, Execution, Deployment` → `Build Tools` → `Gradle`
- Gradle JDK = **Java 21**

> Gradle sync 실패 시 → **이 설정을 먼저 확인!**

---

## Postman이란?

> **HTTP란?** 브라우저와 서버가 통신하는 규약이다.
> 데이터 요청 방식: **GET**(조회), **POST**(생성), **PUT**(수정), **DELETE**(삭제)

- 브라우저 주소창으로는 **GET 요청만** 보낼 수 있다
- **Postman**을 쓰면 모든 종류의 HTTP 요청을 편리하게 보낼 수 있다

---

## Postman 설치

**다운로드:** https://www.postman.com/downloads/

1. macOS / Windows 버전 다운로드 & 설치
2. 실행 시 **"Skip and go to the app"** 클릭 (회원가입 불필요)

### 설치 확인
1. **+** 버튼 → 새 탭
2. 메서드: **GET**
3. URL: `https://httpbin.org/get`
4. **Send** 클릭
5. 하단에 JSON 응답이 오면 성공!

> Postman은 Step 3(GET 요청)부터 본격적으로 사용한다

---

## Git 설치 - macOS

```bash
# Xcode Command Line Tools (Git 포함)
xcode-select --install

# 또는 Homebrew로 설치
brew install git
```

---

## Git 설치 - Windows

1. https://git-scm.com/download/win 접속 → 다운로드
2. 설치 시 **기본 옵션 유지** (Next만 클릭해도 된다)
3. **Git Bash**가 함께 설치된다 (터미널 대용으로 사용 가능)

---

## Git 확인 & 초기 설정

```bash
git --version
# git version 2.x.x 이 출력되면 성공
```

처음 사용한다면 이름과 이메일을 등록한다:

```bash
# 코드 수정 기록에 "누가 했는지" 남기기 위해 필요
git config --global user.name "홍길동"
git config --global user.email "student@cnu.ac.kr"
```

---

## 프로젝트 클론

```bash
# 원하는 위치로 이동
cd ~/Documents                             # macOS
cd C:\Users\student\Documents              # Windows (cmd) - 본인 이름으로 변경

# 클론 (프로젝트 다운로드)
git clone https://github.com/cnu-realcoding/cnu26-backend.git
cd cnu26-backend
```

### Windows 경로 주의사항

- **좋은 예:** `C:\Users\student\projects\cnu26-backend`
- **나쁜 예:** `C:\Users\학생\내 문서\cnu26-backend`

> 경로에 **한글**이나 **공백**이 있으면 빌드 오류가 생길 수 있다!

---

## 환경 확인 체크리스트

```bash
java -version     # → openjdk version "21.x.x"
git --version     # → git version 2.x.x
```

| 항목 | 확인 방법 | 기대 결과 |
|------|-----------|-----------|
| Java 21 | `java -version` | 21.x.x |
| Git | `git --version` | 2.x.x |
| IntelliJ | 프로젝트 열기 + Gradle sync | 에러 없음 |
| Postman | 테스트 요청 보내기 | 응답 수신 |
| 프로젝트 | `ls cnu26-backend/` (Windows: `dir`) | `build.gradle` 존재 |

---

## 트러블슈팅 (1/2)

### java 버전이 다르다
**macOS:**
```bash
/usr/libexec/java_home -V   # 설치된 Java 목록 확인
echo $JAVA_HOME             # 현재 JAVA_HOME 확인
```

**Windows:**
```cmd
echo %JAVA_HOME%   # JAVA_HOME 확인
where java          # 어떤 Java가 잡히는지 확인
```

---

## 트러블슈팅 (2/2)

| 문제 | 해결 |
|------|------|
| Gradle sync 실패 | IntelliJ의 Gradle JDK를 21로 변경 |
| `./gradlew` 안 됨 (Windows) | `gradlew.bat` 사용 |
| Permission denied (macOS) | `chmod +x gradlew` |
| Gradle 다운로드 안 됨 | 프록시/방화벽 설정 확인 |
| IntelliJ Cache 문제 | `File` → `Invalidate Caches and Restart` |

---

## 핵심 정리

> **다음 단계로 넘어가기 전에 모든 도구가 정상 설치되었는지 확인하자.**
> 환경 설정은 한 번만 하면 되지만, 제대로 하지 않으면 이후 모든 단계에서 문제가 생긴다.

---

## 다음 단계

**Step 2: 프로젝트 시작하기** (`web/start`)

- Spring Boot 프로젝트 구조 이해
- build.gradle 읽기
- 첫 번째 웹 서버 실행!
