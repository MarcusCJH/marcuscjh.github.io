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
        "strip": ["AWS Certified "], "group": "Amazon Web Services",
    },
    "Google Cloud": {
        "label": "GCP", "color": "4285F4", "logo": "google-cloud",
        "strip": [], "group": "Google Cloud",
    },
    "HashiCorp": {
        "label": "HashiCorp", "color": "7B42BC", "logo": "terraform",
        "strip": ["HashiCorp Certified: "], "group": "HashiCorp",
    },
    "Databricks": {
        "label": "Databricks", "color": "FF3621", "logo": "databricks",
        "strip": ["Databricks Certified "], "group": "Databricks",
    },
    "Scrum Alliance": {
        "label": "Scrum Alliance", "color": "009FDA", "logo": None,
        "strip": [], "group": "Scrum Alliance",
    },
    "Alibaba Cloud": {
        "label": "Alibaba Cloud", "color": "FF6A00", "logo": "alibabacloud",
        "strip": ["Alibaba Cloud "], "group": "Alibaba Cloud",
    },
    "Axelos": {
        "label": "Axelos", "color": "6E1C7A", "logo": None,
        "strip": [], "group": "Axelos",
    },
    "Pegasystems": {
        "label": "Pega", "color": "FF0000", "logo": None,
        "strip": [], "group": "Pegasystems",
    },
}

TECH_CFG = {
    # Languages
    "TypeScript":  {"color": "3178C6", "logo": "typescript"},
    "JavaScript":  {"color": "323330", "logo": "javascript"},
    "Python":      {"color": "3776AB", "logo": "python"},
    "Java":        {"color": "ED8B00", "logo": "openjdk"},
    "C#":          {"color": "239120", "logo": "csharp"},
    "SQL":         {"color": "4479A1", "logo": "postgresql"},
    # AWS
    "AWS":         {"color": "FF9900", "logo": "amazon-aws"},
    "DynamoDB":    {"color": "4053D6", "logo": "amazondynamodb"},
    # Backend / frameworks
    "Node.js":     {"color": "339933", "logo": "node.js"},
    "Next.js":     {"color": "000000", "logo": "next.js"},
    "FastAPI":     {"color": "009688", "logo": "fastapi"},
    "GraphQL":     {"color": "E10098", "logo": "graphql"},
    "Django":      {"color": "092E20", "logo": "django"},
    # DevOps / infra
    "Terraform":   {"color": "7B42BC", "logo": "terraform"},
    "Docker":      {"color": "2496ED", "logo": "docker"},
    "Git":         {"color": "F05032", "logo": "git"},
    "Linux":       {"color": "FCC624", "logo": "linux"},
    # Data
    "Databricks":  {"color": "FF3621", "logo": "databricks"},
    # Other
    "Vite":        {"color": "646CFF", "logo": "vite"},
    "PWA":         {"color": "5A0FC8", "logo": "pwa"},
    "Alibaba Cloud": {"color": "FF6A00", "logo": "alibabacloud"},
    "Amazon Q":    {"color": "FF9900", "logo": "amazon-aws"},
    "Ollama":      {"color": "000000", "logo": None},
}

VENDOR_ORDER = [
    "Amazon Web Services",
    "Google Cloud",
    "HashiCorp",
    "Databricks",
    "Scrum Alliance",
    "Alibaba Cloud",
    "Axelos",
    "Pegasystems",
]

# Skills categories to show as tech badges, in order
SKILL_CATEGORIES = ["languages", "devops"]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def shield_enc(s: str) -> str:
    result = []
    for c in s:
        if c in ("-", "–", "—"):
            result.append("--")
        elif c == "_":
            result.append("__")
        elif c == " ":
            result.append("_")
        elif ord(c) > 127:
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


def tech_badge(name: str) -> str:
    cfg = TECH_CFG.get(name, {"color": "444444", "logo": None})
    url = (
        f"https://img.shields.io/badge/{shield_enc(name)}-{cfg['color']}"
        f"?style=flat-square&logoColor=white"
    )
    if cfg.get("logo"):
        url += f"&logo={cfg['logo']}"
    return f"![{name}]({url})"


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
        current_role = f"{work[0]['title']} @ {work[0]['company']}"

    # ── About Me ─────────────────────────────────────────────────────────────
    summary = config.get("summary", "")
    about_block = f"> {summary}"
    if current_role:
        about_block += f"\n>\n> **Currently:** {current_role}"

    # ── Tech Stack from skills section ───────────────────────────────────────
    seen, tech_list = set(), []
    for cat in SKILL_CATEGORIES:
        for tech in skills.get(cat, []):
            # Skip meta-terms that aren't badgeable technologies
            if tech not in seen and "/" not in tech and "CI" not in tech:
                seen.add(tech)
                tech_list.append(tech)

    tech_section = " ".join(tech_badge(t) for t in tech_list)

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

    cert_rows = []
    for company in VENDOR_ORDER:
        if company not in groups:
            continue
        badges_str = " ".join(groups[company])
        cert_rows.append(f"**{company}** &nbsp; {badges_str}")

    cert_section = "  \n".join(cert_rows)

    # ── Projects table ────────────────────────────────────────────────────────
    table_rows = []
    for proj in showcase[:6]:
        modal  = proj.get("modalContent", {})
        title  = modal.get("title", proj.get("title", ""))
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
[![Telegram](https://img.shields.io/badge/Telegram-%232CA5E0.svg?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/marcuscjh)
[![Portfolio](https://img.shields.io/badge/Portfolio-000000.svg?style=for-the-badge&logo=about.me&logoColor=white)](https://marcuscjh.com)

</div>

---

## About Me

{about_block}

---

## Tech Stack

{tech_section}

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

## GitHub Stats

<div align="center">

[![GitHub Stats](https://readme-stats-fast.vercel.app/api?username=marcuscjh&show_icons=true&theme=default&hide_border=true)](https://github.com/marcuscjh)
[![Top Langs](https://readme-stats-fast.vercel.app/api/top-langs/?username=marcuscjh&layout=compact&theme=default&hide_border=true)](https://github.com/marcuscjh)

</div>

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
