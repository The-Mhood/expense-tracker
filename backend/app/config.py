from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    DATABASE_URL: str
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS_ORIGINS into a list, stripping whitespace.

        In production set CORS_ORIGINS to your deployed frontend origin(s), e.g.:
        CORS_ORIGINS=https://expenses.yourdomain.com,https://your-project.vercel.app
        """
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
