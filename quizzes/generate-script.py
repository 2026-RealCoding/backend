#!/usr/bin/env python3
"""
Quiz Markdown → Google Apps Script 생성기

사용법:
    python3 quizzes/generate-script.py

동작:
1. quizzes/week*-quiz.md 파일을 모두 읽는다
2. 문제/보기/정답/해설을 파싱한다
3. quizzes/create-google-forms.js 파일을 생성한다

파싱 규칙:
- 제목: '# 1주차 퀴즈: ...' 형식의 첫 줄
- 문제: '## Q1. 문제 텍스트'
- 보기: '- A) 선택지'
- 정답: '**정답:** A' (단일) 또는 '**정답:** A, B' (복수)
- 해설: '**해설:** 설명'
"""

import os
import re
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = SCRIPT_DIR / "create-google-forms.js"


def strip_markdown(text: str) -> str:
    """Markdown 서식을 제거하여 일반 텍스트로 변환한다."""
    # 코드블록 제거 (```...```)
    text = re.sub(r"```[\s\S]*?```", "", text)
    # 인라인 코드 (`code`) → code
    text = re.sub(r"`([^`]+)`", r"\1", text)
    # 볼드 (**text**) → text
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    # 이탤릭 (*text*) → text
    text = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"\1", text)
    # 줄바꿈 정리
    text = re.sub(r"\n{2,}", "\n", text)
    return text.strip()


def js_escape(text: str) -> str:
    """JavaScript single-quoted 문자열에 안전하게 삽입할 수 있도록 이스케이프한다."""
    return (
        text.replace("\\", "\\\\")
        .replace("'", "\\'")
        .replace("\n", "\\n")
        .replace("\r", "")
    )


def parse_answer(answer_raw: str):
    """'A' → 0, 'A, B' → [0, 1] 형태로 변환한다."""
    letters = [a.strip() for a in answer_raw.split(",") if a.strip()]
    indices = [ord(letter.upper()) - ord("A") for letter in letters]
    if len(indices) == 1:
        return indices[0]
    return indices


def parse_quiz_file(path: Path) -> dict:
    """퀴즈 md 파일 하나를 파싱한다."""
    with path.open("r", encoding="utf-8") as f:
        content = f.read()

    # 제목 추출
    title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    if not title_match:
        raise ValueError(f"{path.name}: 제목(# ...)을 찾을 수 없음")
    title = title_match.group(1).strip()

    # 문제 블록 분리
    # '## QN.' 로 구분
    question_blocks = re.split(r"\n## Q\d+\.\s*", content)
    # 첫 블록은 제목 부분이므로 제거
    question_blocks = question_blocks[1:]

    questions = []
    for block in question_blocks:
        block = block.strip()
        if not block:
            continue

        # 문제 텍스트는 첫 번째 '- A)' 이전까지
        choice_start = re.search(r"\n-\s+A\)", block)
        if not choice_start:
            # 코드블록이 문제에 포함된 경우 첫 빈 줄로 분리
            lines = block.split("\n")
            question_lines = []
            for line in lines:
                if re.match(r"^-\s+[A-E]\)", line):
                    break
                question_lines.append(line)
            question_text = "\n".join(question_lines).strip()
            remainder = block[len(question_text):].strip()
        else:
            question_text = block[: choice_start.start()].strip()
            remainder = block[choice_start.start():].strip()

        # 보기 파싱
        choices = []
        for m in re.finditer(r"^-\s+([A-E])\)\s*(.+?)(?=\n-\s+[A-E]\)|\n\*\*정답|\Z)",
                              remainder, re.MULTILINE | re.DOTALL):
            letter = m.group(1)
            text = m.group(2).strip()
            choices.append(text)

        # 정답 파싱
        answer_match = re.search(r"\*\*정답:\*\*\s*(.+?)(?:\n|$)", block)
        if not answer_match:
            raise ValueError(f"{path.name}: 정답을 찾을 수 없음\n{block[:200]}")
        answer = parse_answer(answer_match.group(1).strip())

        # 해설 파싱
        explanation_match = re.search(
            r"\*\*해설:\*\*\s*(.+?)(?=\n---|\Z)", block, re.DOTALL
        )
        explanation = ""
        if explanation_match:
            explanation = explanation_match.group(1).strip()

        questions.append({
            "question": strip_markdown(question_text),
            "choices": [strip_markdown(c) for c in choices],
            "answer": answer,
            "explanation": strip_markdown(explanation),
        })

    return {"title": title, "questions": questions}


def format_js_value(value) -> str:
    """Python 값을 JS 리터럴 문자열로 변환한다."""
    if isinstance(value, str):
        return "'" + js_escape(value) + "'"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, list):
        return "[" + ", ".join(format_js_value(v) for v in value) + "]"
    raise TypeError(f"지원하지 않는 타입: {type(value)}")


def generate_quiz_data_js(quizzes: list) -> str:
    """QUIZ_DATA 배열을 JS 코드로 생성한다."""
    out = ["var QUIZ_DATA = ["]
    for week_idx, quiz in enumerate(quizzes, start=1):
        out.append("  {")
        out.append(f"    week: {week_idx},")
        out.append(f"    title: {format_js_value(quiz['title'])},")
        out.append("    questions: [")
        for q in quiz["questions"]:
            out.append("      {")
            out.append(f"        question: {format_js_value(q['question'])},")
            out.append("        choices: [")
            for c in q["choices"]:
                out.append(f"          {format_js_value(c)},")
            out.append("        ],")
            out.append(f"        answer: {format_js_value(q['answer'])},")
            out.append(f"        explanation: {format_js_value(q['explanation'])}")
            out.append("      },")
        out.append("    ]")
        out.append("  },")
    out.append("];")
    return "\n".join(out)


APPS_SCRIPT_TEMPLATE = """/**
 * 2026 RealCoding - Google Forms Quiz Generator
 *
 * ⚠️  이 파일은 자동 생성됩니다. 직접 수정하지 마세요.
 *     quizzes/week*-quiz.md 를 수정한 뒤
 *     `python3 quizzes/generate-script.py` 를 실행하면 재생성됩니다.
 *
 * 사용법:
 * 1. Google Apps Script (https://script.google.com) 에서 새 프로젝트 생성
 * 2. 이 코드를 전체 복사하여 붙여넣기
 * 3. createAllForms() 실행 -> 6개 퀴즈 폼 전부 생성
 * 4. createWeekForm(1) 실행 -> 특정 주차 퀴즈 폼만 생성
 *
 * 주의:
 * - 퀴즈 모드에서 정답 공개 설정(Google Forms UI에서 '성적 공개 설정')이
 *   '제출 후 즉시'로 되어 있는지 확인하세요.
 * - Apps Script API는 해당 설정을 직접 제어할 수 없습니다.
 */

{quiz_data}

/**
 * 주차 번호로 단일 폼 생성
 */
function createWeekForm(weekNumber) {{
  for (var i = 0; i < QUIZ_DATA.length; i++) {{
    if (QUIZ_DATA[i].week === weekNumber) {{
      var form = createQuizForm(QUIZ_DATA[i]);
      Logger.log(weekNumber + '주차 퀴즈 생성 완료');
      Logger.log('편집 URL: ' + form.getEditUrl());
      Logger.log('응답 URL: ' + form.getPublishedUrl());
      return form;
    }}
  }}
  Logger.log('해당 주차를 찾을 수 없습니다: ' + weekNumber);
  return null;
}}

/**
 * 모든 주차 폼 생성
 */
function createAllForms() {{
  var results = [];
  for (var i = 0; i < QUIZ_DATA.length; i++) {{
    try {{
      var form = createQuizForm(QUIZ_DATA[i]);
      results.push({{
        week: QUIZ_DATA[i].week,
        title: QUIZ_DATA[i].title,
        editUrl: form.getEditUrl(),
        publishedUrl: form.getPublishedUrl()
      }});
      Logger.log(QUIZ_DATA[i].week + '주차 퀴즈 생성 완료');
    }} catch (e) {{
      Logger.log(QUIZ_DATA[i].week + '주차 퀴즈 생성 실패: ' + e);
    }}
  }}
  Logger.log('\\n===== 전체 결과 =====');
  for (var j = 0; j < results.length; j++) {{
    Logger.log(JSON.stringify(results[j]));
  }}
  return results;
}}

/**
 * 퀴즈 데이터로 하나의 Google Form을 생성한다.
 * 폼의 맨 앞에는 '학번' 필수 입력 필드가 추가된다.
 */
function createQuizForm(quizData) {{
  var form = FormApp.create(quizData.title);
  form.setTitle(quizData.title);
  form.setDescription(
    '2026 RealCoding - Spring Boot Backend 퀴즈\\n\\n' +
    '* 학번을 먼저 입력한 뒤 모든 문제를 풀고 제출하세요.\\n' +
    '* 제출 후 즉시 정답과 해설을 확인할 수 있습니다.'
  );
  form.setIsQuiz(true);
  form.setCollectEmail(false);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage(
    '제출이 완료되었습니다!\\n\\n' +
    '"점수 보기" 버튼을 누르면 정답과 해설을 확인할 수 있습니다.'
  );

  // 1) 학번 필수 입력 필드
  var studentIdItem = form.addTextItem();
  studentIdItem.setTitle('학번');
  studentIdItem.setHelpText('학번을 입력하세요 (필수)');
  studentIdItem.setRequired(true);
  try {{
    var validation = FormApp.createTextValidation()
      .setHelpText('학번은 숫자만 입력하세요')
      .requireNumber()
      .build();
    studentIdItem.setValidation(validation);
  }} catch (e) {{
    Logger.log('학번 validation 설정 중 경고: ' + e);
  }}

  // 2) 퀴즈 문항 추가
  for (var i = 0; i < quizData.questions.length; i++) {{
    var q = quizData.questions[i];
    if (Array.isArray(q.answer)) {{
      addCheckboxQuestion(form, q);
    }} else {{
      addMultipleChoiceQuestion(form, q);
    }}
  }}

  return form;
}}

/**
 * 단일 정답 객관식 문항 추가
 */
function addMultipleChoiceQuestion(form, q) {{
  var item = form.addMultipleChoiceItem();
  item.setTitle(q.question);
  item.setPoints(10);
  item.setRequired(true);

  var choices = [];
  for (var i = 0; i < q.choices.length; i++) {{
    choices.push(item.createChoice(q.choices[i], i === q.answer));
  }}
  item.setChoices(choices);

  var correctFeedback = FormApp.createFeedback()
    .setText('정답입니다! ' + q.explanation)
    .build();
  var incorrectFeedback = FormApp.createFeedback()
    .setText('오답입니다. ' + q.explanation)
    .build();
  item.setFeedbackForCorrect(correctFeedback);
  item.setFeedbackForIncorrect(incorrectFeedback);
}}

/**
 * 복수 정답 체크박스 문항 추가
 */
function addCheckboxQuestion(form, q) {{
  var item = form.addCheckboxItem();
  item.setTitle(q.question);
  item.setPoints(10);
  item.setRequired(true);

  var choices = [];
  for (var i = 0; i < q.choices.length; i++) {{
    var isCorrect = q.answer.indexOf(i) !== -1;
    choices.push(item.createChoice(q.choices[i], isCorrect));
  }}
  item.setChoices(choices);

  var correctFeedback = FormApp.createFeedback()
    .setText('정답입니다! ' + q.explanation)
    .build();
  var incorrectFeedback = FormApp.createFeedback()
    .setText('오답입니다. ' + q.explanation)
    .build();
  item.setFeedbackForCorrect(correctFeedback);
  item.setFeedbackForIncorrect(incorrectFeedback);
}}
"""


def main():
    md_files = sorted(SCRIPT_DIR.glob("week*-quiz.md"))
    if not md_files:
        print("ERROR: quizzes/week*-quiz.md 파일을 찾을 수 없습니다.", file=sys.stderr)
        sys.exit(1)

    print(f"📄 {len(md_files)}개 퀴즈 파일 발견")

    quizzes = []
    total_questions = 0
    for md_file in md_files:
        try:
            quiz = parse_quiz_file(md_file)
        except Exception as e:
            print(f"❌ {md_file.name} 파싱 실패: {e}", file=sys.stderr)
            sys.exit(1)
        q_count = len(quiz["questions"])
        total_questions += q_count
        print(f"  ✅ {md_file.name}: {q_count}문제 - {quiz['title']}")
        quizzes.append(quiz)

    print(f"\n📊 총 {total_questions}문제")

    # Apps Script 생성
    quiz_data_js = generate_quiz_data_js(quizzes)
    script_content = APPS_SCRIPT_TEMPLATE.format(quiz_data=quiz_data_js)

    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        f.write(script_content)

    print(f"\n✨ 생성 완료: {OUTPUT_FILE.relative_to(SCRIPT_DIR.parent)}")


if __name__ == "__main__":
    main()
