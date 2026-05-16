from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "ali_support"
    DB_USER: str = "ali_user"
    DB_PASSWORD: str = ""

    SECRET_KEY: str = "change_me_secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    WHATSAPP_BRIDGE_URL: str = "http://localhost:3001"
    WHATSAPP_BRIDGE_SECRET: str = "change_me_bridge_secret"
    BRIDGE_SECRET: str = "change_me_bridge_secret"

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "Ali Support <no-reply@example.com>"

    MEDIA_BASE_URL: str = "http://localhost:8000/media"

    class Config:
        env_file = ".env"


settings = Settings()
