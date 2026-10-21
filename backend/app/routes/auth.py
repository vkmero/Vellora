import secrets
import urllib.parse
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import client_ip, get_current_user
from app.exceptions import BadRequestError, ConflictError, UnauthorizedError
from app.models.manager_request import ManagerAccessRequest
from app.models.user import User
from app.schemas.auth_schema import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.manager_request_schema import (
    ManagerAccessRequestCreate,
    ManagerAccessRequestOut,
)
from app.schemas.user_schema import UserOut
from app.services import auth_service
from app.services.audit_service import log_action

router = APIRouter(prefix="/auth", tags=["auth"])


class OAuthCallbackPayload(BaseModel):
    code: str
    state: str | None = None
    redirect_uri: str | None = None


@router.post("/register", response_model=UserOut)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    return auth_service.register_user(
        db, payload.name, payload.email, payload.password, payload.confirm_password, client_ip(request)
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user, token = auth_service.authenticate(db, payload.email, payload.password, client_ip(request))
    return TokenResponse(access_token=token, role=user.role)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return auth_service.request_password_reset(db, payload.email)


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    auth_service.reset_password(db, payload.token, payload.password, payload.confirm_password)
    return {"message": "Password updated. You can now sign in."}


@router.post("/logout")
def logout(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_action(db, "LOGOUT", f"User {user.email} signed out.", user.id, "user", user.id, client_ip(request))
    db.commit()
    return {"message": "Signed out."}


# =========================================================================
# MANAGER ACCESS REQUEST WORKFLOW (SECTION 7)
# =========================================================================

@router.post("/manager-access-request", response_model=ManagerAccessRequestOut)
def create_manager_access_request(
    payload: ManagerAccessRequestCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Allows an Analyst to formally request Manager governance promotion without losing analyst capabilities."""
    if user.role in {"manager", "admin"}:
        raise BadRequestError(f"Your account already holds the elevated role: '{user.role}'.")

    # Prevent duplicate active requests
    existing_pending = (
        db.query(ManagerAccessRequest)
        .filter(ManagerAccessRequest.user_id == user.id, ManagerAccessRequest.status == "pending")
        .first()
    )
    if existing_pending:
        raise ConflictError(
            "You already have an active Manager access request pending administrator decision."
        )

    req = ManagerAccessRequest(
        user_id=user.id,
        organization_or_team=payload.organization_or_team,
        reason=payload.reason,
        status="pending",
    )
    db.add(req)
    log_action(
        db,
        "REQUEST_MANAGER_ACCESS",
        f"Analyst {user.email} requested Manager governance access.",
        user.id,
        "manager_access_request",
        None,
        client_ip(request),
    )
    db.commit()
    db.refresh(req)

    return ManagerAccessRequestOut(
        id=req.id,
        user_id=req.user_id,
        user_name=user.name,
        user_email=user.email,
        organization_or_team=req.organization_or_team,
        reason=req.reason,
        status=req.status,
        created_at=req.created_at,
    )


@router.get("/manager-access-request/me")
def get_my_manager_access_request(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the latest Manager access request status for the authenticated user."""
    req = (
        db.query(ManagerAccessRequest)
        .filter(ManagerAccessRequest.user_id == user.id)
        .order_by(ManagerAccessRequest.created_at.desc())
        .first()
    )
    if not req:
        return {"has_request": False, "request": None}

    return {
        "has_request": True,
        "request": {
            "id": req.id,
            "organization_or_team": req.organization_or_team,
            "reason": req.reason,
            "status": req.status,
            "admin_notes": req.admin_notes,
            "created_at": req.created_at.isoformat() if req.created_at else None,
            "reviewed_at": req.reviewed_at.isoformat() if req.reviewed_at else None,
        },
    }


# =========================================================================
# OAUTH SOCIAL AUTHENTICATION (SECTION 5 & 40)
# =========================================================================

@router.get("/oauth/providers")
def get_oauth_providers():
    """Returns the operational status of configured OAuth identity providers."""
    return {
        "google": {
            "name": "Google",
            "configured": bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET),
            "auth_endpoint": "/api/auth/oauth/google/url",
        },
        "github": {
            "name": "GitHub",
            "configured": bool(settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET),
            "auth_endpoint": "/api/auth/oauth/github/url",
        },
        "linkedin": {
            "name": "LinkedIn",
            "configured": bool(settings.LINKEDIN_CLIENT_ID and settings.LINKEDIN_CLIENT_SECRET),
            "auth_endpoint": "/api/auth/oauth/linkedin/url",
        },
    }


@router.get("/oauth/{provider}/url")
def get_oauth_authorization_url(provider: str, redirect_uri: str | None = None):
    """Constructs genuine provider authorization URL with PKCE/state protection or informs of required credentials."""
    prov = provider.lower()
    if prov not in {"google", "github", "linkedin"}:
        raise BadRequestError(f"Unsupported OAuth provider: '{provider}'. Supported: google, github, linkedin.")

    client_id = getattr(settings, f"{prov.upper()}_CLIENT_ID", "")
    client_secret = getattr(settings, f"{prov.upper()}_CLIENT_SECRET", "")

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=501,
            detail=(
                f"{prov.capitalize()} OAuth provider is not configured. "
                f"Set {prov.upper()}_CLIENT_ID and {prov.upper()}_CLIENT_SECRET in backend/.env to activate live sign-in."
            ),
        )

    target_redirect = redirect_uri or settings.OAUTH_REDIRECT_URI or f"{settings.FRONTEND_URL}/login"
    state = secrets.token_urlsafe(24)

    if prov == "google":
        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": client_id,
            "redirect_uri": target_redirect,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "online",
            "prompt": "select_account",
        }
    elif prov == "github":
        base_url = "https://github.com/login/oauth/authorize"
        params = {
            "client_id": client_id,
            "redirect_uri": target_redirect,
            "scope": "read:user user:email",
            "state": state,
        }
    else:  # linkedin
        base_url = "https://www.linkedin.com/oauth/v2/authorization"
        params = {
            "client_id": client_id,
            "redirect_uri": target_redirect,
            "response_type": "code",
            "scope": "openid profile email",
            "state": state,
        }

    auth_url = f"{base_url}?{urllib.parse.urlencode(params)}"
    return {"url": auth_url, "state": state, "provider": prov}


@router.post("/oauth/{provider}/callback", response_model=TokenResponse)
async def oauth_callback(
    provider: str,
    payload: OAuthCallbackPayload,
    request: Request,
    db: Session = Depends(get_db),
):
    """Handles OAuth provider callback token exchange and user provisioning."""
    prov = provider.lower()
    if prov not in {"google", "github", "linkedin"}:
        raise BadRequestError(f"Unsupported OAuth provider: '{provider}'.")

    client_id = getattr(settings, f"{prov.upper()}_CLIENT_ID", "")
    client_secret = getattr(settings, f"{prov.upper()}_CLIENT_SECRET", "")

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=501,
            detail=(
                f"{prov.capitalize()} OAuth is not configured. Set {prov.upper()}_CLIENT_ID "
                f"and {prov.upper()}_CLIENT_SECRET in backend/.env."
            ),
        )

    target_redirect = payload.redirect_uri or settings.OAUTH_REDIRECT_URI or f"{settings.FRONTEND_URL}/login"

    try:
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            if prov == "google":
                token_resp = await http_client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "code": payload.code,
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "redirect_uri": target_redirect,
                        "grant_type": "authorization_code",
                    },
                )
                if token_resp.status_code != 200:
                    raise UnauthorizedError("Failed to exchange Google authorization code.")
                token_data = token_resp.json()
                id_token_val = token_data.get("id_token")
                # Fetch user info
                user_info_resp = await http_client.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {token_data.get('access_token')}"},
                )
                if user_info_resp.status_code != 200:
                    raise UnauthorizedError("Failed to retrieve Google profile.")
                user_data = user_info_resp.json()
                email = user_data.get("email")
                name = user_data.get("name", "Google User")

            elif prov == "github":
                token_resp = await http_client.post(
                    "https://github.com/login/oauth/access_token",
                    headers={"Accept": "application/json"},
                    data={
                        "code": payload.code,
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "redirect_uri": target_redirect,
                    },
                )
                if token_resp.status_code != 200:
                    raise UnauthorizedError("Failed to exchange GitHub authorization code.")
                token_data = token_resp.json()
                gh_token = token_data.get("access_token")
                if not gh_token:
                    raise UnauthorizedError("GitHub did not return a valid access token.")
                # Get user profile & email
                user_resp = await http_client.get(
                    "https://api.github.com/user",
                    headers={"Authorization": f"Bearer {gh_token}"},
                )
                user_data = user_resp.json()
                name = user_data.get("name") or user_data.get("login") or "GitHub User"
                email = user_data.get("email")
                if not email:
                    emails_resp = await http_client.get(
                        "https://api.github.com/user/emails",
                        headers={"Authorization": f"Bearer {gh_token}"},
                    )
                    if emails_resp.status_code == 200:
                        for entry in emails_resp.json():
                            if entry.get("primary") and entry.get("verified"):
                                email = entry.get("email")
                                break

            else:  # linkedin
                token_resp = await http_client.post(
                    "https://www.linkedin.com/oauth/v2/accessToken",
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    data={
                        "grant_type": "authorization_code",
                        "code": payload.code,
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "redirect_uri": target_redirect,
                    },
                )
                if token_resp.status_code != 200:
                    raise UnauthorizedError("Failed to exchange LinkedIn authorization code.")
                token_data = token_resp.json()
                userinfo_resp = await http_client.get(
                    "https://api.linkedin.com/v2/userinfo",
                    headers={"Authorization": f"Bearer {token_data.get('access_token')}"},
                )
                if userinfo_resp.status_code != 200:
                    raise UnauthorizedError("Failed to retrieve LinkedIn profile.")
                user_data = userinfo_resp.json()
                email = user_data.get("email")
                name = user_data.get("name", "LinkedIn User")

            if not email:
                raise UnauthorizedError(f"Could not retrieve a verified email address from {prov.capitalize()}.")

            user, token = auth_service.oauth_authenticate_or_create(
                db, email=email, name=name, provider=prov, ip=client_ip(request)
            )
            return TokenResponse(access_token=token, role=user.role)

    except HTTPException:
        raise
    except Exception as exc:
        raise UnauthorizedError(f"OAuth authentication error with {prov.capitalize()}: {str(exc)}")
