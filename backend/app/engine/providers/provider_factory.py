from app.engine.providers.claude_provider import ClaudeProvider


class ProviderFactory:

    @staticmethod
    def get(provider: str = "claude"):

        if provider == "claude":
            return ClaudeProvider()

        raise ValueError("Provider não suportado.")