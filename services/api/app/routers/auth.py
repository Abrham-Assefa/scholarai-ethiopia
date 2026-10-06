from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import create_token, get_current_user
from ..config import settings
from ..db import get_db
from ..models import User
from ..schemas import OTPRequest, OTPVerify, TokenOut, UserOut

router = APIRouter(prefix="/v1/auth", tags=["auth"])


@router.post("/otp/request")
def request_otp(body: OTPRequest):
    """Demo OTP: no SMS is sent; the code is always `123456` in dev."""
    return {"sent": True, "phone": body.phone, "hint": f"Demo mode — use code {settings.demo_otp_code}"}


@router.post("/otp/verify", response_model=TokenOut)
def verify_otp(body: OTPVerify, db: Session = Depends(get_db)):
    if body.code != settings.demo_otp_code:
        raise HTTPException(400, "Invalid OTP code")
    user = db.scalar(select(User).where(User.phone == body.phone))
    if not user:
        user = User(phone=body.phone)
        db.add(user)
        db.commit()
        db.refresh(user)
    return TokenOut(accessToken=create_token(user), user=UserOut.model_validate(user, from_attributes=True))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user, from_attributes=True)
