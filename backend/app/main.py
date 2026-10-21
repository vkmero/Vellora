from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.exceptions import error_payload, http_exception_handler, unhandled_exception_handler
from app.routes import (
    admin,
    analytics,
    approvals,
    auth,
    cleaning,
    communications,
    dashboard,
    datasets,
    deliverables,
    health,
    history,
    insights,
    manager_reports,
    notifications,
    predictions,
    profiling,
    projects,
    quality,
    reports,
    summaries,
    upload,
    users,
    validation,
    visualization,
)

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.APP_DEBUG and not settings.is_production,
    docs_url="/api/docs" if not settings.is_production else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)


@app.exception_handler(RequestValidationError)
async def validation_handler(request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=error_payload(422, "Please review the submitted values.", "unprocessable"),
    )


prefix = "/api"
app.include_router(health.router, prefix=prefix)
app.include_router(auth.router, prefix=prefix)
app.include_router(users.router, prefix=prefix)
app.include_router(upload.router, prefix=prefix)
app.include_router(datasets.router, prefix=prefix)
app.include_router(profiling.router, prefix=prefix)
app.include_router(quality.router, prefix=prefix)
app.include_router(cleaning.router, prefix=prefix)
app.include_router(approvals.router, prefix=prefix)
app.include_router(validation.router, prefix=prefix)
app.include_router(analytics.router, prefix=prefix)
app.include_router(visualization.router, prefix=prefix)
app.include_router(insights.router, prefix=prefix)
app.include_router(predictions.router, prefix=prefix)
app.include_router(reports.router, prefix=prefix)
app.include_router(projects.router, prefix=prefix)
app.include_router(summaries.router, prefix=prefix)
app.include_router(deliverables.router, prefix=prefix)
app.include_router(communications.router, prefix=prefix)
app.include_router(manager_reports.router, prefix=prefix)
app.include_router(dashboard.router, prefix=prefix)
app.include_router(history.router, prefix=prefix)
app.include_router(notifications.router, prefix=prefix)
app.include_router(admin.router, prefix=prefix)


@app.get("/")
def root():
    return {"name": settings.APP_NAME, "status": "running"}
