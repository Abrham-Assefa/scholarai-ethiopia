from datetime import date

from scholarai_ai.chat_agent import ChatAgent
from scholarai_ai.essay_coach import essay_feedback

TODAY = date(2026, 10, 6)


def test_chat_search_tool_en(scholarships, router):
    agent = ChatAgent(scholarships, router=router, today=TODAY)
    r = agent.reply("Find master's scholarships in Germany")
    assert r["toolCalls"][0]["name"] == "search_scholarships"
    assert any("DAAD" in s["title"] for s in r["sources"])
    assert "DAAD" in r["reply"]


def test_chat_deadlines_tool(scholarships, router):
    agent = ChatAgent(scholarships, router=router, today=TODAY)
    r = agent.reply("What deadlines are coming up?")
    assert r["toolCalls"][0]["name"] == "get_deadlines"
    assert r["sources"] and r["sources"][0]["deadline"] >= "2026-10-06"


def test_chat_amharic(scholarships, router):
    agent = ChatAgent(scholarships, router=router, today=TODAY)
    r = agent.reply("ሰላም", lang="am")
    assert "ስኮላር" in r["reply"]
    r2 = agent.reply("በጀርመን የማስተርስ ስኮላርሺፕ", lang="am")
    assert r2["intent"] == "search"
    assert "ስኮላርሺፖች" in r2["reply"] or "አላገኘሁም" in r2["reply"]


def test_essay_feedback(router):
    text = (
        "Ever since I was a child I wanted to make a difference. " * 3
    ) + "I studied at Bahir Dar University in 2022 and led a team of 5."
    fb = essay_feedback(text, word_limit=300, router=router)
    assert 0 <= fb["score"] <= 100
    assert any(i["type"] == "cliche" for i in fb["issues"])
    assert fb["wordCount"] > 0
    assert fb["comments"]
