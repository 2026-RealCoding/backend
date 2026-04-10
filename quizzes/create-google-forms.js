/**
 * Google Apps Script - 주차별 퀴즈 Google Form 자동 생성
 *
 * 사용법:
 * 1. Google Drive에서 Apps Script 프로젝트 생성 (script.google.com)
 * 2. 이 코드를 붙여넣기
 * 3. 아래 QUIZ_DATA 배열에 퀴즈 데이터를 넣기 (또는 parseMarkdown 함수 사용)
 * 4. createAllForms() 함수 실행
 * 5. Google Drive에 Form이 생성됨
 */

// ============================================================
// 퀴즈 데이터 (Markdown에서 파싱한 결과를 여기에 넣는다)
// ============================================================

/**
 * Markdown 텍스트를 파싱하여 퀴즈 데이터 배열로 변환
 * @param {string} markdown - 퀴즈 Markdown 텍스트
 * @returns {Object} { title: string, questions: Array }
 */
function parseMarkdown(markdown) {
  var lines = markdown.split('\n');
  var title = '';
  var questions = [];
  var current = null;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();

    // 제목 파싱: # 1주차 퀴즈: ...
    if (line.match(/^# /) && !line.match(/^## /)) {
      title = line.replace(/^# /, '');
      continue;
    }

    // 문제 파싱: ## Q1. ...
    var qMatch = line.match(/^## Q\d+\.\s*(.+)/);
    if (qMatch) {
      if (current) {
        questions.push(current);
      }
      current = {
        question: qMatch[1],
        choices: [],
        answer: '',
        explanation: ''
      };
      continue;
    }

    // 선택지 파싱: - A) ...
    var choiceMatch = line.match(/^- ([A-E])\)\s*(.+)/);
    if (choiceMatch && current) {
      current.choices.push({
        letter: choiceMatch[1],
        text: choiceMatch[2]
      });
      continue;
    }

    // 정답 파싱: **정답:** A
    var answerMatch = line.match(/^\*\*정답:\*\*\s*([A-E])/);
    if (answerMatch && current) {
      current.answer = answerMatch[1];
      continue;
    }

    // 해설 파싱: **해설:** ...
    var explMatch = line.match(/^\*\*해설:\*\*\s*(.+)/);
    if (explMatch && current) {
      current.explanation = explMatch[1];
      continue;
    }
  }

  // 마지막 문제 추가
  if (current) {
    questions.push(current);
  }

  return { title: title, questions: questions };
}

// ============================================================
// Google Form 생성
// ============================================================

/**
 * 파싱된 퀴즈 데이터로 Google Form 생성
 * @param {Object} quizData - { title: string, questions: Array }
 * @returns {string} Form URL
 */
function createQuizForm(quizData) {
  var form = FormApp.create(quizData.title);
  form.setIsQuiz(true);
  form.setDescription('2026 RealCoding - Spring Boot Backend 퀴즈\n자동 채점됩니다. 정답을 신중하게 선택하세요.');
  form.setConfirmationMessage('제출 완료! 점수는 자동으로 채점됩니다.');
  form.setShowLinkToRespondAgain(false);

  var pointsPerQuestion = 10;

  for (var i = 0; i < quizData.questions.length; i++) {
    var q = quizData.questions[i];
    var item = form.addMultipleChoiceItem();
    item.setTitle('Q' + (i + 1) + '. ' + q.question);
    item.setRequired(true);
    item.setPoints(pointsPerQuestion);

    var choices = [];
    var correctIndex = -1;

    for (var j = 0; j < q.choices.length; j++) {
      var choiceText = q.choices[j].letter + ') ' + q.choices[j].text;
      if (q.choices[j].letter === q.answer) {
        correctIndex = j;
      }
      choices.push(choiceText);
    }

    // 선택지 생성 (정답 표시 포함)
    var formChoices = [];
    for (var j = 0; j < choices.length; j++) {
      if (j === correctIndex) {
        formChoices.push(item.createChoice(choices[j], true));
      } else {
        formChoices.push(item.createChoice(choices[j], false));
      }
    }
    item.setChoices(formChoices);

    // 정답 피드백 설정
    if (q.explanation) {
      var feedback = FormApp.createFeedback()
        .setText(q.explanation)
        .build();
      item.setFeedbackForCorrect(feedback);
      item.setFeedbackForIncorrect(feedback);
    }
  }

  Logger.log('Form 생성 완료: ' + quizData.title);
  Logger.log('편집 URL: ' + form.getEditUrl());
  Logger.log('응답 URL: ' + form.getPublishedUrl());

  return form.getPublishedUrl();
}

// ============================================================
// 메인 실행 함수들
// ============================================================

/**
 * Markdown 텍스트로부터 Form을 생성하는 헬퍼 함수
 * @param {string} markdown - 퀴즈 Markdown 텍스트
 * @returns {string} Form URL
 */
function createFormFromMarkdown(markdown) {
  var quizData = parseMarkdown(markdown);
  return createQuizForm(quizData);
}

/**
 * 모든 주차 퀴즈를 한 번에 생성
 * 아래 배열에 각 주차의 Markdown 텍스트를 넣고 실행한다.
 */
function createAllForms() {
  // 각 주차의 Markdown 내용을 여기에 붙여넣기
  var weeklyMarkdowns = [
    // week01 Markdown을 여기에 붙여넣기
    WEEK01_MARKDOWN,
    // week02 Markdown을 여기에 붙여넣기
    WEEK02_MARKDOWN,
    // week03 Markdown을 여기에 붙여넣기
    WEEK03_MARKDOWN,
    // week04 Markdown을 여기에 붙여넣기
    WEEK04_MARKDOWN,
    // week05 Markdown을 여기에 붙여넣기
    WEEK05_MARKDOWN,
    // week06 Markdown을 여기에 붙여넣기
    WEEK06_MARKDOWN,
  ];

  var urls = [];
  for (var i = 0; i < weeklyMarkdowns.length; i++) {
    try {
      var url = createFormFromMarkdown(weeklyMarkdowns[i]);
      urls.push(url);
      Logger.log((i + 1) + '주차 퀴즈 생성 완료: ' + url);
    } catch (e) {
      Logger.log((i + 1) + '주차 퀴즈 생성 실패: ' + e.message);
    }
  }

  Logger.log('\n===== 전체 결과 =====');
  for (var i = 0; i < urls.length; i++) {
    Logger.log((i + 1) + '주차: ' + urls[i]);
  }
}

// ============================================================
// 개별 주차 생성 함수 (하나씩 테스트할 때 사용)
// ============================================================

/**
 * 특정 주차만 생성하려면 이 함수를 수정하여 사용
 * Markdown 내용을 직접 붙여넣고 실행한다.
 */
function createSingleWeek() {
  var markdown = `
# 1주차 퀴즈: 환경설정, 프로젝트 시작, GET API

## Q1. 예시 문제
- A) 선택지 1
- B) 선택지 2
- C) 선택지 3
- D) 선택지 4
- E) 선택지 5

**정답:** A
**해설:** 이것은 예시 문제입니다.
`;

  var url = createFormFromMarkdown(markdown);
  Logger.log('생성된 Form URL: ' + url);
}

// ============================================================
// Google Drive 파일에서 읽어오는 방식 (선택)
// ============================================================

/**
 * Google Drive에 업로드한 Markdown 파일에서 읽어와 Form 생성
 * @param {string} fileId - Google Drive 파일 ID
 */
function createFormFromDriveFile(fileId) {
  var file = DriveApp.getFileById(fileId);
  var markdown = file.getBlob().getDataAsString('utf-8');
  var url = createFormFromMarkdown(markdown);
  Logger.log('생성된 Form URL: ' + url);
  return url;
}

/**
 * Google Drive 폴더에서 모든 Markdown 파일을 읽어 Form 생성
 * @param {string} folderId - Google Drive 폴더 ID
 */
function createFormsFromDriveFolder(folderId) {
  var folder = DriveApp.getFolderById(folderId);
  var files = folder.getFilesByType('text/markdown');

  // text/markdown이 안 되면 text/plain으로 시도
  if (!files.hasNext()) {
    files = folder.getFiles();
  }

  var results = [];
  while (files.hasNext()) {
    var file = files.next();
    var name = file.getName();
    if (name.match(/^week\d+-quiz\.md$/)) {
      Logger.log('처리 중: ' + name);
      var markdown = file.getBlob().getDataAsString('utf-8');
      var url = createFormFromMarkdown(markdown);
      results.push({ name: name, url: url });
    }
  }

  Logger.log('\n===== 생성 결과 =====');
  for (var i = 0; i < results.length; i++) {
    Logger.log(results[i].name + ' → ' + results[i].url);
  }
}

// ============================================================
// 주차별 Markdown 데이터 (여기에 붙여넣기)
// ============================================================
// 사용법: 각 weekNN-quiz.md 파일의 전체 내용을 아래 변수에 붙여넣는다.
// 그 후 createAllForms() 함수를 실행한다.

var WEEK01_MARKDOWN = ''; // week01-quiz.md 내용을 여기에 붙여넣기
var WEEK02_MARKDOWN = ''; // week02-quiz.md 내용을 여기에 붙여넣기
var WEEK03_MARKDOWN = ''; // week03-quiz.md 내용을 여기에 붙여넣기
var WEEK04_MARKDOWN = ''; // week04-quiz.md 내용을 여기에 붙여넣기
var WEEK05_MARKDOWN = ''; // week05-quiz.md 내용을 여기에 붙여넣기
var WEEK06_MARKDOWN = ''; // week06-quiz.md 내용을 여기에 붙여넣기
