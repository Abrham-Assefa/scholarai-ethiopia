from fastapi import APIRouter, Depends
from scholarai_ai.chat_agent import ChatAgent
from scholarai_ai.essay_coach import essay_feedback
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_router
from ..models import Scholarship
from ..schemas import ChatIn, EssayIn

router = APIRouter(prefix="/v1", tags=["ai"])


@router.post("/chat")
def chat(body: ChatIn, db: Session = Depends(get_db)):
    scholarships = [s.to_dict() for s in db.scalars(select(Scholarship).where(Scholarship.status != "closed")).all()]
    agent = ChatAgent(scholarships, router=get_router())
    return agent.reply(body.message, lang=body.lang, history=body.history)


@router.post("/essays/feedback")
def essay(body: EssayIn):
    return essay_feedback(
        body.content, prompt=body.prompt, word_limit=body.wordLimit, lang=body.lang, router=get_router()
    )
