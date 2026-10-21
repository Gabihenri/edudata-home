"""Regression tests for fail-closed production JWT configuration."""
import os
import subprocess
import sys
import unittest


class ProductionJWTSecretConfigurationTests(unittest.TestCase):
    def _import_config(self, *, secret_key=None):
        env = os.environ.copy()
        env.pop("RENDER_SERVICE_ID", None)
        env.pop("ENVIRONMENT", None)
        env["APP_ENV"] = "production"
        if secret_key is None:
            env.pop("SECRET_KEY", None)
        else:
            env["SECRET_KEY"] = secret_key

        return subprocess.run(
            [
                sys.executable,
                "-c",
                "from app.core import config; print('config-loaded')",
            ],
            cwd=os.path.dirname(os.path.dirname(__file__)),
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )

    def test_production_rejects_missing_jwt_secret(self):
        result = self._import_config()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(
            "SECRET_KEY must be configured with a unique secret in production.",
            result.stderr,
        )

    def test_production_rejects_known_development_jwt_secret(self):
        result = self._import_config(
            secret_key="edudata-ia-development-secret-change-in-production"
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(
            "SECRET_KEY must be configured with a unique secret in production.",
            result.stderr,
        )

    def test_production_accepts_explicit_jwt_secret(self):
        result = self._import_config(secret_key="test-only-secret-not-for-deployment")
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        self.assertIn("config-loaded", result.stdout)


if __name__ == "__main__":
    unittest.main()
