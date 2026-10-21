from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse


class VelloraError(HTTPException):
    def __init__(self, status_code: int, detail: str, code: str = "error"):
        super().__init__(status_code=status_code, detail=detail)
        self.code = code


class BadRequestError(VelloraError):
    def __init__(self, detail: str):
        super().__init__(status.HTTP_400_BAD_REQUEST, detail, "bad_request")


class UnauthorizedError(VelloraError):
    def __init__(self, detail: str = "Authentication required."):
        super().__init__(status.HTTP_401_UNAUTHORIZED, detail, "unauthorized")


class ForbiddenError(VelloraError):
    def __init__(self, detail: str = "You do not have permission to perform this action."):
        super().__init__(status.HTTP_403_FORBIDDEN, detail, "forbidden")


class NotFoundError(VelloraError):
    def __init__(self, detail: str = "The requested resource was not found."):
        super().__init__(status.HTTP_404_NOT_FOUND, detail, "not_found")


class ConflictError(VelloraError):
    def __init__(self, detail: str):
        super().__init__(status.HTTP_409_CONFLICT, detail, "conflict")


class UnprocessableError(VelloraError):
    def __init__(self, detail: str):
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, detail, "unprocessable")


class WorkflowStageError(VelloraError):
    def __init__(self, detail: str):
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, detail, "WORKFLOW_STAGE_REQUIRED")


def error_payload(status_code: int, detail: str, code: str = "error") -> dict:
    return {
        "error": True,
        "code": code,
        "message": detail,
        "status": status_code,
    }


async def http_exception_handler(request: Request, exc: HTTPException):
    code = getattr(exc, "code", "error")
    detail = exc.detail if isinstance(exc.detail, str) else "Request could not be completed."
    return JSONResponse(status_code=exc.status_code, content=error_payload(exc.status_code, detail, code))


async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_payload(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "An unexpected server error occurred. Please try again.",
            "server_error",
        ),
    )
