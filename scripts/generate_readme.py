#!/usr/bin/env python3
"""Generate and push GitHub profile README from portfolio public/data.json."""

import base64
import json
import os
import re
import sys
import urllib.parse
import urllib.request

# ---------------------------------------------------------------------------
# Badge config — maps data.json values to shields.io params
# ---------------------------------------------------------------------------

CERT_CFG = {
    "Amazon Web Services": {
        "label": "AWS", "color": "FF9900", "logo": "amazon-aws",
        "strip": ["AWS Certified "],
    },
    "Google Cloud": {
        "label": "GCP", "color": "4285F4", "logo": "google-cloud",
        "strip": [],
    },
    "HashiCorp": {
        "label": "HashiCorp", "color": "7B42BC", "logo": "terraform",
        "strip": ["HashiCorp Certified: "],
    },
    "Databricks": {
        "label": "Databricks", "color": "FF3621", "logo": "databricks",
        "strip": ["Databricks Certified "],
    },
    "Scrum Alliance": {
        "label": "Scrum Alliance", "color": "009FDA", "logo": None,
        "strip": [],
    },
    "Alibaba Cloud": {
        "label": "Alibaba Cloud", "color": "FF6A00", "logo": "alibabacloud",
        "strip": ["Alibaba Cloud "],
    },
    "Axelos": {
        "label": "Axelos", "color": "6E1C7A", "logo": None,
        "strip": [],
    },
    "Pegasystems": {
        "label": "Pega", "color": "FF0000", "logo": None,
        "strip": [],
    },
}

# Display labels for data.json skill categories (order comes from data.json)
SKILL_LABELS = {
    "languages":  "Languages",
    "fullstack":  "Full Stack",
    "cloud":      "Cloud",
    "platform":   "Platform & DevOps",
    "ai":         "AI & Data",
    "leadership": "Leadership",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def shield_enc(s: str) -> str:
    # Characters that need percent-encoding in a shields.io path segment
    _ENCODE = set('#%?&=+')
    result = []
    for c in s:
        if c in ("-", "–", "—"):
            result.append("--")
        elif c == "_":
            result.append("__")
        elif c == " ":
            result.append("_")
        elif ord(c) > 127 or c in _ENCODE:
            result.append(urllib.parse.quote(c, safe=""))
        else:
            result.append(c)
    return "".join(result)


def make_badge(label: str, message: str, color: str, logo: str | None = None) -> str:
    url = (
        f"https://img.shields.io/badge/{shield_enc(label)}-{shield_enc(message)}-{color}"
        f"?style=flat-square&logoColor=white"
    )
    if logo:
        url += f"&logo={logo}"
    return f"![{label}: {message}]({url})"


def cert_message(title: str, cfg: dict) -> str:
    msg = title
    for prefix in cfg.get("strip", []):
        if msg.startswith(prefix):
            msg = msg[len(prefix):]
            break
    msg = re.sub(r"\s*\(\d+\)$", "", msg)
    m = re.search(r"\(([A-Z®©]+)\)$", msg)
    if m:
        return m.group(1)
    if len(msg) > 30:
        words, acc = msg.split(), []
        for w in words:
            if acc and len(" ".join(acc + [w])) > 25:
                break
            acc.append(w)
        msg = " ".join(acc)
    return msg


def link_icon(text: str) -> str:
    t = text.lower()
    if "live" in t or "demo" in t:
        return "🌐"
    if "source" in t or "code" in t or "repo" in t:
        return "💻"
    if "story" in t or "article" in t or "medium" in t or "blog" in t or "read" in t:
        return "📝"
    return "🔗"


def github_api(method: str, path: str, token: str, body: dict | None = None) -> dict:
    url = f"https://api.github.com{path}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "readme-sync-bot",
    }
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"GitHub API {e.code}: {e.read().decode()}", file=sys.stderr)
        sys.exit(1)

# ---------------------------------------------------------------------------
# README generation
# ---------------------------------------------------------------------------

def generate_readme(data: dict) -> str:
    config   = data["config"]
    timeline = data["timeline"]
    showcase = data["showcase"]
    skills   = data.get("skills", {})

    # ── Current role ────────────────────────────────────────────────────────
    work = sorted(
        [t for t in timeline if t.get("category") == "work"],
        key=lambda x: x.get("order", 0),
        reverse=True,
    )
    current_role = ""
    if work and work[0].get("endDate", "").lower() in ("present", ""):
        company = work[0]["company"]
        current_role = f"{config['title']} @ {company}"

    # ── About Me ─────────────────────────────────────────────────────────────
    summary = config.get("summary", "")
    about_block = f"> {summary}"
    if current_role:
        about_block += f"\n>\n> **Currently:** {current_role}"

    # ── Focus areas from skills section ─────────────────────────────────────
    # Two trailing spaces = markdown line break, matching the cert rows below
    focus_section = "  \n".join(
        f"**{SKILL_LABELS.get(cat, cat.title())}** &nbsp; {' · '.join(items)}"
        for cat, items in skills.items() if items
    )

    # ── Certifications grouped by vendor ────────────────────────────────────
    certs = sorted(
        [t for t in timeline if t.get("category") == "certification"],
        key=lambda x: x.get("order", 0),
        reverse=True,
    )

    groups: dict[str, list[str]] = {}
    for cert in certs:
        company = cert.get("company", "Other")
        cfg = CERT_CFG.get(
            company,
            {"label": company, "color": "555555", "logo": None, "strip": []},
        )
        msg = cert_message(cert.get("title", ""), cfg)
        groups.setdefault(company, []).append(
            make_badge(cfg["label"], msg, cfg["color"], cfg.get("logo"))
        )

    # CERT_CFG order drives display order; any unlisted vendor goes last
    ordered = list(CERT_CFG) + [c for c in groups if c not in CERT_CFG]
    cert_rows = [
        f"**{c}** &nbsp; {' '.join(groups[c])}" for c in ordered if c in groups
    ]

    cert_section = "  \n".join(cert_rows)

    # ── Projects table ────────────────────────────────────────────────────────
    table_rows = []
    for proj in showcase[:6]:
        modal  = proj.get("modalContent", {})
        title  = proj.get("title", modal.get("title", ""))
        techs  = " · ".join(proj.get("technologies", []))
        links  = modal.get("links", [])
        first_url = links[0]["url"] if links else "https://marcuscjh.com"
        link_parts = [
            f"[{link_icon(l['text'])} {l['text']}]({l['url']})"
            for l in links
        ]
        table_rows.append(
            f"| **[{title}]({first_url})** | `{techs}` | {'&nbsp;&nbsp;'.join(link_parts)} |"
        )

    projects_table = "\n".join(table_rows)

    # ── Assemble ──────────────────────────────────────────────────────────────
    return f"""\
<div align="center">

# Marcus Chan

### {config['title']} · Singapore

[![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/marcuschanjh)
[![GitHub](https://img.shields.io/badge/GitHub-%23181717.svg?style=for-the-badge&logo=github&logoColor=white)](https://github.com/MarcusCJH)
[![Telegram](https://img.shields.io/badge/Telegram-%232CA5E0.svg?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/marcuscjh)
[![Portfolio](https://img.shields.io/badge/Portfolio-000000.svg?style=for-the-badge&logo=about.me&logoColor=white)](https://marcuscjh.com)

</div>

---

## About Me

{about_block}

---

## Focus Areas

{focus_section}

<sub>What I'm working with right now, not a ceiling. Picking up new stacks is the part of the job I enjoy most.</sub>

---

## Certifications · {len(certs)}

{cert_section}

---

## Featured Projects

| Project | Stack | Links |
|---------|-------|-------|
{projects_table}

<div align="right"><a href="https://marcuscjh.com">View all projects →</a></div>

---

<div align="center">
<sub>Updated automatically from <a href="https://marcuscjh.com">marcuscjh.com</a></sub>
</div>
"""

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    token = os.environ.get("PROFILE_README_TOKEN")
    if not token:
        print("PROFILE_README_TOKEN is not set.", file=sys.stderr)
        sys.exit(1)

    with open("public/data.json", encoding="utf-8") as f:
        data = json.load(f)

    content = generate_readme(data)
    encoded = base64.b64encode(content.encode()).decode()

    current = github_api("GET", "/repos/MarcusCJH/marcuscjh/contents/README.md", token)

    github_api(
        "PUT",
        "/repos/MarcusCJH/marcuscjh/contents/README.md",
        token,
        {
            "message": "chore: sync profile README from portfolio data.json [skip ci]",
            "content": encoded,
            "sha": current["sha"],
        },
    )

    print("Profile README updated successfully.")


if __name__ == "__main__":
    main()
