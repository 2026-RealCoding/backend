#!/usr/bin/env python3
"""Marp markdown → Reveal.js HTML 변환 스크립트

Theme: Solarized + Blue accent + Monokai code + Fade transition
Features: progress bar, prev/next nav, index link, keyboard shortcut hint
"""

import glob
import os
import re
import shutil

SLIDES_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SLIDES_DIR, "html")
IMAGES_SRC = os.path.join(SLIDES_DIR, "images")
IMAGES_DST = os.path.join(OUTPUT_DIR, "images")

# Step number → branch name mapping
STEP_BRANCHES = {
    "step01": "web/start",
    "step02": "web/start",
    "step03": "web/get",
    "step04": "web/post",
    "step05": "web/swagger",
    "step06": "web/exception",
    "step07": "web/logging",
    "step08": "web/profile",
    "step09": "web/actuator",
    "step10": "layered/service-repository",
    "step11": "layered/generic-repository",
    "step12": "layered/jpa",
    "step13": "shop/naver-api",
    "step14": "shop/auth",
    "step15": "feature/pageable",
    "step16": "feature/cors",
    "step17": "feature/frontend-api",
}

HTML_TEMPLATE = """\
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reset.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/solarized.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/highlight/monokai.css">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

  :root {{
    --r-heading-font: 'Noto Sans KR', sans-serif;
    --r-main-font: 'Noto Sans KR', sans-serif;
    --r-code-font: 'JetBrains Mono', 'D2Coding', monospace;
    --r-heading-color: #2563eb;
    --r-link-color: #2563eb;
    --r-link-color-hover: #1d4ed8;
    --accent: #2563eb;
    --accent-dark: #1e40af;
  }}

  .reveal h1, .reveal h2, .reveal h3 {{
    text-transform: none;
  }}
  .reveal h1 {{
    font-size: 1.8em;
    color: var(--accent);
  }}
  .reveal h2 {{
    font-size: 1.3em;
    color: var(--accent-dark);
    border-bottom: 3px solid var(--accent);
    padding-bottom: 0.3em;
    margin-bottom: 0.5em;
  }}
  .reveal h3 {{
    font-size: 1.05em;
    color: var(--accent-dark);
  }}

  /* Images */
  .reveal img {{
    max-height: 460px;
    max-width: 90%;
    border-radius: 6px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.18);
  }}

  /* Code blocks */
  .reveal pre {{
    font-size: 0.65em;
    max-height: 480px;
    overflow: auto;
    width: 100%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    border-radius: 8px;
  }}
  .reveal pre code {{
    max-height: 480px;
    padding: 16px;
    line-height: 1.4;
  }}
  .reveal code {{
    font-family: 'JetBrains Mono', 'D2Coding', monospace;
  }}
  .reveal p code, .reveal li code, .reveal td code {{
    background: #eee8d5;
    padding: 0.15em 0.4em;
    border-radius: 4px;
    font-size: 0.88em;
    color: #cb4b16;
  }}

  /* Tables */
  .reveal table {{
    font-size: 0.7em;
    border-collapse: collapse;
    margin: 0.5em auto;
  }}
  .reveal table th {{
    background: var(--accent);
    color: white;
    padding: 0.5em 1em;
    font-weight: 500;
  }}
  .reveal table td {{
    padding: 0.4em 1em;
    border-bottom: 1px solid #d3cbb7;
  }}
  .reveal table tr:nth-child(even) {{
    background: #eee8d5;
  }}

  /* Blockquote */
  .reveal blockquote {{
    background: #eee8d5;
    border-left: 4px solid var(--accent);
    padding: 0.8em 1.2em;
    font-size: 0.85em;
    border-radius: 0 8px 8px 0;
    width: 90%;
    text-align: left;
    box-shadow: none;
  }}

  /* Lists */
  .reveal ul, .reveal ol {{
    font-size: 0.85em;
    text-align: left;
    display: block;
  }}
  .reveal li {{
    margin-bottom: 0.3em;
    line-height: 1.5;
  }}

  /* Typography */
  .reveal strong {{
    color: var(--accent-dark);
  }}
  .reveal del {{
    opacity: 0.5;
  }}

  /* Layout */
  .reveal .slides section {{
    text-align: left;
    padding: 20px 40px;
  }}
  .reveal .slides section h1,
  .reveal .slides section h2 {{
    text-align: left;
  }}

  /* Slide number */
  .reveal .slide-number {{
    font-size: 0.6em;
    color: #93a1a1;
    right: 16px;
    bottom: 42px;
  }}

  /* Controls */
  .reveal .controls {{
    color: var(--accent);
  }}

  /* Progress bar */
  .reveal .progress {{
    color: var(--accent);
    height: 4px;
  }}

  /* Step navigation bar */
  .step-nav {{
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 36px;
    background: #073642;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.75rem;
    z-index: 100;
    box-shadow: 0 -1px 4px rgba(0,0,0,0.15);
  }}
  .step-nav a {{
    color: #93a1a1;
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;
  }}
  .step-nav a:hover {{
    color: #fdf6e3;
    background: #586e75;
  }}
  .step-nav .nav-center {{
    color: #839496;
  }}
  .step-nav .nav-center a {{
    color: #2aa198;
  }}
  .step-nav .nav-center a:hover {{
    color: #fdf6e3;
  }}
  .step-nav .shortcut-hint {{
    color: #586e75;
    font-size: 0.65rem;
  }}

  /* Adjust reveal progress bar above nav */
  .reveal .progress {{
    bottom: 36px;
  }}
</style>
</head>
<body>
<div class="reveal">
  <div class="slides">
    <section data-markdown data-separator="^\\n---\\n$" data-separator-vertical="^\\n----\\n$">
      <textarea data-template>
{content}
      </textarea>
    </section>
  </div>
</div>

<!-- Step navigation bar -->
<div class="step-nav">
  <div>{prev_link}</div>
  <div class="nav-center"><a href="index.html">&#9776; Index</a></div>
  <div>{next_link} <span class="shortcut-hint">&nbsp;&nbsp;?=shortcuts</span></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/markdown/markdown.js"></script>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/highlight/highlight.js"></script>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/notes/notes.js"></script>
<script>
  Reveal.initialize({{
    hash: true,
    slideNumber: true,
    transition: 'fade',
    width: 1200,
    height: 700,
    margin: 0.04,
    progress: true,
    help: true,
    plugins: [RevealMarkdown, RevealHighlight, RevealNotes]
  }});
</script>
</body>
</html>
"""


def remove_frontmatter(content: str) -> str:
    """Remove Marp YAML frontmatter (first --- ... --- block)."""
    lines = content.split("\n")
    if lines and lines[0].strip() == "---":
        for i in range(1, len(lines)):
            if lines[i].strip() == "---":
                return "\n".join(lines[i + 1 :])
    return content


def extract_title(content: str) -> str:
    """Extract title from first # heading."""
    for line in content.split("\n"):
        line = line.strip()
        if line.startswith("# "):
            return line[2:].strip()
    return "Slide"


def escape_for_textarea(content: str) -> str:
    """Escape </textarea> and </script> tags inside markdown content."""
    content = content.replace("</textarea>", "&lt;/textarea&gt;")
    content = content.replace("</script>", "&lt;/script&gt;")
    return content


def convert_file(md_path: str, prev_link: str, next_link: str) -> str:
    """Convert a single Marp markdown file to Reveal.js HTML."""
    with open(md_path, "r", encoding="utf-8") as f:
        raw = f.read()

    content = remove_frontmatter(raw)
    content = content.strip()

    title = extract_title(content)
    content = escape_for_textarea(content)

    return HTML_TEMPLATE.format(
        title=title,
        content=content,
        prev_link=prev_link,
        next_link=next_link,
    )


def generate_index(files: list[tuple[str, str, str]]) -> str:
    """Generate index.html with links to all slide files.

    files: list of (step_key, html_filename, title)
    """
    rows = ""
    for step_key, html_filename, title in files:
        branch = STEP_BRANCHES.get(step_key, "")
        num = step_key.replace("step", "")
        rows += f"""\
        <a href="{html_filename}" class="card">
          <span class="step-num">Step {num}</span>
          <span class="step-title">{title}</span>
          <span class="step-branch">{branch}</span>
        </a>
"""

    return f"""\
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>2026 RealCoding - Spring Boot Backend</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

  * {{ margin: 0; padding: 0; box-sizing: border-box; }}

  body {{
    font-family: 'Noto Sans KR', sans-serif;
    background: #fdf6e3;
    color: #586e75;
    min-height: 100vh;
  }}

  .container {{
    max-width: 900px;
    margin: 0 auto;
    padding: 3rem 1.5rem;
  }}

  header {{
    text-align: center;
    margin-bottom: 3rem;
  }}

  header h1 {{
    font-size: 2rem;
    color: #2563eb;
    margin-bottom: 0.5rem;
  }}

  header p {{
    color: #93a1a1;
    font-size: 1.1rem;
  }}

  .hint {{
    text-align: center;
    margin-bottom: 2rem;
    color: #93a1a1;
    font-size: 0.85rem;
  }}

  .hint kbd {{
    background: #eee8d5;
    border: 1px solid #d3cbb7;
    border-radius: 3px;
    padding: 0.1em 0.5em;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85em;
  }}

  .cards {{
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }}

  .card {{
    display: flex;
    align-items: center;
    background: #eee8d5;
    border-radius: 12px;
    padding: 1.1rem 1.5rem;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    transition: transform 0.15s, box-shadow 0.15s;
    border: 1px solid #d3cbb7;
  }}

  .card:hover {{
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(37,99,235,0.15);
    border-color: #2563eb;
    background: #fdf6e3;
  }}

  .step-num {{
    background: #2563eb;
    color: white;
    font-weight: 700;
    font-size: 0.8rem;
    padding: 0.3em 0.8em;
    border-radius: 6px;
    min-width: 70px;
    text-align: center;
    white-space: nowrap;
  }}

  .step-title {{
    flex: 1;
    font-weight: 500;
    font-size: 1rem;
    margin-left: 1rem;
    color: #073642;
  }}

  .step-branch {{
    font-family: 'JetBrains Mono', 'D2Coding', monospace;
    font-size: 0.78rem;
    color: #2aa198;
    background: #fdf6e3;
    padding: 0.25em 0.7em;
    border-radius: 4px;
    white-space: nowrap;
  }}

  footer {{
    text-align: center;
    margin-top: 3rem;
    color: #93a1a1;
    font-size: 0.85rem;
  }}

  @media (max-width: 600px) {{
    .card {{ flex-wrap: wrap; gap: 0.5rem; }}
    .step-branch {{ margin-left: 0; }}
  }}
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>2026 RealCoding</h1>
    <p>Spring Boot Backend - Lecture Slides</p>
  </header>
  <div class="hint">
    Slides: <kbd>&larr;</kbd> <kbd>&rarr;</kbd> navigate
    &middot; <kbd>?</kbd> keyboard shortcuts
    &middot; <kbd>Esc</kbd> overview
    &middot; <kbd>F</kbd> fullscreen
  </div>
  <div class="cards">
{rows}  </div>
  <footer>
    <p>Built with Reveal.js</p>
  </footer>
</div>
</body>
</html>
"""


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Copy images directory to output if it exists
    if os.path.isdir(IMAGES_SRC):
        if os.path.isdir(IMAGES_DST):
            shutil.rmtree(IMAGES_DST)
        shutil.copytree(IMAGES_SRC, IMAGES_DST)
        image_count = len(os.listdir(IMAGES_DST))
        print(f"  images/ copied ({image_count} file(s))")

    md_files = sorted(glob.glob(os.path.join(SLIDES_DIR, "step*.md")))

    if not md_files:
        print("No step*.md files found in", SLIDES_DIR)
        return

    # First pass: collect metadata
    entries = []
    for md_path in md_files:
        basename = os.path.splitext(os.path.basename(md_path))[0]
        html_filename = basename + ".html"
        step_key = re.match(r"(step\d+)", basename).group(1)
        with open(md_path, "r", encoding="utf-8") as f:
            raw = f.read()
        title = extract_title(remove_frontmatter(raw))
        entries.append((md_path, basename, html_filename, step_key, title))

    # Second pass: generate HTML with prev/next links
    for i, (md_path, basename, html_filename, step_key, title) in enumerate(entries):
        # Build prev/next links
        if i > 0:
            prev_file = entries[i - 1][2]
            prev_title = entries[i - 1][4]
            # Shorten title: take only up to the first colon or use step number
            prev_short = f"Step {entries[i-1][3].replace('step', '')}"
            prev_link = f'<a href="{prev_file}">&larr; {prev_short}</a>'
        else:
            prev_link = ""

        if i < len(entries) - 1:
            next_file = entries[i + 1][2]
            next_short = f"Step {entries[i+1][3].replace('step', '')}"
            next_link = f'<a href="{next_file}">{next_short} &rarr;</a>'
        else:
            next_link = ""

        html_content = convert_file(md_path, prev_link, next_link)
        html_path = os.path.join(OUTPUT_DIR, html_filename)

        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        print(f"  {basename}.md -> html/{html_filename}")

    # Generate index.html
    index_entries = [(e[3], e[2], e[4]) for e in entries]
    index_html = generate_index(index_entries)
    index_path = os.path.join(OUTPUT_DIR, "index.html")
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(index_html)
    print(f"  index.html generated ({len(entries)} slides)")

    print(f"\nDone! {len(entries)} HTML files + index.html in {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
