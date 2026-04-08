# Step 1: 개발 환경 설정

> 이 단계에서는 코드를 작성하지 않습니다. 개발에 필요한 도구를 설치하고 환경을 준비합니다.

---

## 학습 목표

- Java 21을 설치하고 버전을 확인할 수 있다.
- IntelliJ IDEA를 설치하고 프로젝트를 열 수 있다.
- Postman을 설치하고 간단한 요청을 보낼 수 있다.
- Git을 설치하고 저장소를 클론할 수 있다.

---

## 시작하기 전에

- **인터넷 연결**이 필요하다 (모든 설치 파일을 다운로드해야 한다).
- 약 **5GB 이상의 여유 디스크 공간**이 필요하다 (Java + IntelliJ + Postman + Git).
- 학교 네트워크에서 다운로드가 느린 경우, 미리 집에서 설치해오는 것을 권장한다.

---

## 1. Java 21 설치

이 강의에서 사용할 프레임워크(Spring Boot)는 **Java 17 이상**이 필요하며, 우리는 **Java 21**을 사용한다.

> **Java란?** 프로그래밍 언어이자 실행 환경이다. Spring Boot 프로젝트를 컴파일하고 실행하려면 컴퓨터에 Java가 설치되어 있어야 한다.

### macOS

**Homebrew를 사용하는 경우:**

```bash
# Homebrew 설치 (이미 설치되어 있다면 건너뛰기)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Java 21 설치
brew install openjdk@21
```

설치 후 **환경변수**를 설정한다.

> **환경변수란?** 운영체제가 프로그램을 찾을 때 참고하는 "주소록"이다. `JAVA_HOME`은 Java가 설치된 위치를, `PATH`는 터미널에서 명령어를 실행할 때 찾아볼 폴더 목록을 뜻한다. 이 설정을 해야 터미널에서 `java` 명령어를 인식한다.

터미널(Terminal 앱)을 열고 다음을 실행:

```bash
# ~/.zshrc에 환경변수 추가
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 21)' >> ~/.zshrc
echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> ~/.zshrc

# 설정 적용
source ~/.zshrc
```

**확인:**

```bash
java -version
# openjdk version "21.x.x" 이 출력되면 성공
```

### Windows

**1단계: 다운로드**

Adoptium(Eclipse Temurin)에서 다운로드한다:
- https://adoptium.net/ 접속
- **Temurin 21 (LTS)** 선택
- **Windows x64** → `.msi` 파일 다운로드

**2단계: 설치**

다운로드한 `.msi` 파일을 실행한다.

| 설치 옵션 | 설정 |
|---|---|
| **Set JAVA_HOME variable** | **반드시 체크** (자동으로 환경변수 설정) |
| **Add to PATH** | **반드시 체크** |
| JavaSoft (Oracle) registry keys | 체크 (선택) |

> **중요:** "Set JAVA_HOME variable"을 체크하지 않으면 이후 Gradle 빌드 시 Java를 찾지 못해 에러가 발생한다.

**3단계: 확인**

**새 명령 프롬프트(cmd)** 또는 **PowerShell**을 열고 확인한다 (기존 창은 환경변수가 반영되지 않을 수 있다):

> **cmd 여는 법:** `Windows키`를 누르고 `cmd`를 검색 → "명령 프롬프트" 클릭
> **PowerShell 여는 법:** `Windows키`를 누르고 `powershell`을 검색 → "Windows PowerShell" 클릭

```cmd
java -version
```

```
openjdk version "21.0.x" ...
```

위와 같이 출력되면 성공이다.

**환경변수가 안 잡히는 경우 (수동 설정):**

1. `Windows키 + R` → `sysdm.cpl` 입력 → 확인
2. **고급** 탭 → **환경 변수** 클릭
3. **시스템 변수**에서:
   - **새로 만들기**: 변수 이름 `JAVA_HOME`, 변수 값 `C:\Program Files\Eclipse Adoptium\jdk-21.0.x.x-hotspot` (실제 설치 경로)
   - **Path** 편집 → **새로 만들기** → `%JAVA_HOME%\bin` 추가
4. 확인 → 새 명령 프롬프트에서 `java -version` 재확인

---

## 2. IntelliJ IDEA 설치

### Community Edition vs Ultimate

| | Community (무료) | Ultimate (유료) |
|---|---|---|
| Java / Spring Boot 개발 | O | O |
| Spring 전용 지원 (자동완성 등) | X | O |
| 데이터베이스 도구 | X | O |
| 가격 | 무료 | **학생 무료** (edu 이메일) |

> **이 강의에서는 Community Edition으로 충분하다.** Ultimate을 원하면 https://www.jetbrains.com/student/ 에서 학생 라이선스를 신청할 수 있다.

### macOS

```bash
# Homebrew로 설치
brew install --cask intellij-idea-ce
```

또는 https://www.jetbrains.com/idea/download/ 에서 `.dmg` 파일을 다운로드하여 설치한다.

### Windows

1. https://www.jetbrains.com/idea/download/ 접속
2. **Community Edition** → `.exe` 다운로드
3. 설치 진행 시 옵션:

| 설치 옵션 | 권장 |
|---|---|
| Create Desktop Shortcut | 체크 |
| Add "Open Folder as Project" | **체크** (우클릭으로 프로젝트 열기 가능) |
| Add to PATH | 체크 |
| Associate .java files | 체크 |

### IntelliJ에서 프로젝트 열기

1. IntelliJ 실행 → **Open** (또는 File → Open)
2. 클론한 프로젝트 폴더 선택 (예: `cnu26-backend`)
3. **Open as Project** 선택
4. Gradle 프로젝트를 자동으로 인식하고 import가 시작된다 (Gradle은 프로젝트를 빌드하고 외부 라이브러리를 관리하는 도구다)
5. 우측 하단에 **"Gradle sync"** 진행 바가 나타나면 완료될 때까지 기다린다 (처음에는 수 분이 걸릴 수 있다)

### JDK 설정 확인

IntelliJ가 올바른 Java 버전을 사용하는지 확인한다:

**Project SDK 확인:**
- `File` → `Project Structure` (단축키: `Ctrl+Alt+Shift+S` / macOS: `Cmd+;`)
- **Project** 탭 → SDK가 **Java 21**인지 확인
- 목록에 없으면 **Add SDK** → **Download JDK** → 21 선택

**Gradle JDK 확인:**
- `File` → `Settings` (macOS: `IntelliJ IDEA` → `Preferences`)
- `Build, Execution, Deployment` → `Build Tools` → `Gradle`
- **Gradle JDK**가 **Java 21**인지 확인

---

## 3. Postman 설치

Postman은 API를 테스트하는 도구다.

> **HTTP란?** 브라우저와 서버가 통신하는 규약이다. 데이터를 요청하는 방식에는 여러 종류가 있는데, 대표적으로 GET(조회), POST(생성), PUT(수정), DELETE(삭제)가 있다. 브라우저 주소창으로는 GET 요청만 보낼 수 있지만, Postman을 쓰면 모든 종류의 요청을 편리하게 보낼 수 있다.

### macOS / Windows 공통

1. https://www.postman.com/downloads/ 접속
2. 운영체제에 맞는 버전 다운로드 & 설치
3. 실행 시 **"Skip and go to the app"** 클릭 (회원가입 없이 사용 가능)

### 간단한 테스트

설치 확인을 위해 아무 요청이나 보내본다:

1. **+** 버튼을 눌러 새 탭 열기
2. 메서드: **GET**
3. URL: `https://httpbin.org/get`
4. **Send** 클릭
5. 하단에 JSON 응답이 오면 성공

> Postman은 Step 3(GET 요청)부터 본격적으로 사용한다.

---

## 4. Git 설치

### macOS

```bash
# Xcode Command Line Tools (Git 포함)
xcode-select --install

# 또는 Homebrew로 설치
brew install git
```

### Windows

1. https://git-scm.com/download/win 접속 → 다운로드
2. 설치 시 **기본 옵션 유지** (Next만 클릭해도 된다)
3. **Git Bash**가 함께 설치된다 (터미널 대용으로 사용 가능)

### 확인

```bash
git --version
# git version 2.x.x 이 출력되면 성공
```

### Git 초기 설정

처음 사용한다면 이름과 이메일을 설정한다:

```bash
git config --global user.name "홍길동"
git config --global user.email "student@cnu.ac.kr"
```

---

## 5. 프로젝트 클론

모든 도구가 설치되었다면 프로젝트를 다운로드한다.

### 터미널 / Git Bash / cmd에서 실행

```bash
# 원하는 위치로 이동 (예: 홈 디렉토리)
cd ~

# 프로젝트 클론
git clone https://github.com/cnu-realcoding/cnu26-backend.git

# 프로젝트 폴더로 이동
cd cnu26-backend
```

### Windows에서 추천하는 프로젝트 위치

```cmd
# C 드라이브 또는 사용자 폴더 아래를 추천
cd C:\Users\{사용자이름}\Documents
git clone https://github.com/cnu-realcoding/cnu26-backend.git
```

> **주의:** 경로에 한글이나 공백이 있으면 빌드 시 문제가 생길 수 있다.
> - **좋은 예:** `C:\Users\student\projects\cnu26-backend`
> - **나쁜 예:** `C:\Users\학생\내 문서\cnu26-backend`

---

## 6. 환경 확인 체크리스트

모든 설치가 끝났다면 다음을 확인한다:

```bash
# Java 버전 확인
java -version
# → openjdk version "21.x.x" (OK)

# Git 버전 확인
git --version
# → git version 2.x.x (OK)
```

| 항목 | 확인 방법 | 기대 결과 |
|---|---|---|
| Java 21 | `java -version` | `openjdk version "21.x.x"` |
| Git | `git --version` | `git version 2.x.x` |
| IntelliJ IDEA | 프로젝트 열기 + Gradle sync 완료 | 에러 없이 프로젝트 로드 |
| Postman | 실행 후 테스트 요청 | 응답 수신 성공 |
| 프로젝트 클론 | `ls cnu26-backend/` (Windows: `dir cnu26-backend\`) | `build.gradle` 파일 존재 |

---

## 트러블슈팅

### java -version이 다른 버전을 보여준다

여러 Java 버전이 설치된 경우 발생한다.

**macOS:**
```bash
# 설치된 Java 버전 목록 확인
/usr/libexec/java_home -V

# .zshrc에서 JAVA_HOME이 21을 가리키는지 확인
echo $JAVA_HOME
```

**Windows:**
```cmd
# JAVA_HOME 확인
echo %JAVA_HOME%

# Path에서 다른 Java가 먼저 잡히고 있는지 확인
where java
```

### IntelliJ에서 Gradle sync가 실패한다

- `File` → `Settings` → `Build Tools` → `Gradle` → Gradle JDK를 **Java 21**로 변경
- `File` → `Invalidate Caches and Restart` 시도

### Windows에서 `./gradlew`가 안 된다

Windows에서는 `./gradlew` 대신 `gradlew.bat`을 사용한다:

```cmd
gradlew.bat bootRun
```

Git Bash를 사용하는 경우에는 `./gradlew`가 동작한다.

### macOS에서 Permission denied가 발생한다

```bash
chmod +x gradlew
./gradlew bootRun
```

### 프록시/방화벽 환경에서 Gradle 다운로드가 안 된다

학교 네트워크에서 프록시를 사용하는 경우:

```properties
# gradle.properties 파일에 추가
systemProp.http.proxyHost=프록시주소
systemProp.http.proxyPort=포트번호
systemProp.https.proxyHost=프록시주소
systemProp.https.proxyPort=포트번호
```

---

## 핵심 정리

> **다음 단계로 넘어가기 전에 Java 21, IntelliJ IDEA, Postman, Git이 모두 정상적으로 설치되었는지 확인하자. 환경 설정은 한 번만 하면 되지만, 제대로 하지 않으면 이후 모든 단계에서 문제가 생긴다.**
