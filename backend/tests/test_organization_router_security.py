"""Regression tests for organization-route authorization.

Run from backend/: python -m unittest discover -s tests -v
"""
import os
import unittest
from unittest.mock import patch

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-only-key")

from fastapi import HTTPException

from app.routers import organization as organization_router


class OrganizationRouterSecurityTests(unittest.TestCase):
    def setUp(self):
        self.actor = {"id": "user-1", "email": "user@example.test"}

    def test_organization_id_requires_a_valid_identity(self):
        with patch.object(organization_router, "require_membership") as membership:
            with self.assertRaises(HTTPException) as raised:
                organization_router._require_organization_scope(
                    "org-1", {"id": "   "}
                )
        self.assertEqual(raised.exception.status_code, 401)
        membership.assert_not_called()

    def test_organization_id_checks_current_membership_before_lookup(self):
        organization = {"id": "org-1", "name": "Example"}
        with (
            patch.object(organization_router, "require_membership") as membership,
            patch.object(
                organization_router.OrganizationService,
                "find_by_id",
                return_value=organization,
            ) as lookup,
        ):
            result = organization_router.get_organization_by_id(
                "org-1", actor=self.actor
            )

        membership.assert_called_once_with(
            user_id="user-1",
            organization_id="org-1",
            school_id=None,
        )
        lookup.assert_called_once_with("org-1")
        self.assertEqual(result["data"], organization)

    def test_membership_denial_prevents_organization_lookup(self):
        with (
            patch.object(
                organization_router,
                "require_membership",
                side_effect=HTTPException(status_code=403, detail="Forbidden"),
            ),
            patch.object(
                organization_router.OrganizationService, "find_by_id"
            ) as lookup,
        ):
            with self.assertRaises(HTTPException) as raised:
                organization_router.get_organization_by_id(
                    "org-other", actor=self.actor
                )

        self.assertEqual(raised.exception.status_code, 403)
        lookup.assert_not_called()

    def test_slug_lookup_checks_membership_before_returning_data(self):
        organization = {"id": "org-1", "slug": "example"}
        with (
            patch.object(
                organization_router.OrganizationService,
                "find_by_slug",
                return_value=organization,
            ) as lookup,
            patch.object(organization_router, "require_membership") as membership,
        ):
            result = organization_router.get_organization_by_slug(
                "example", actor=self.actor
            )

        lookup.assert_called_once_with("example")
        membership.assert_called_once_with(
            user_id="user-1",
            organization_id="org-1",
            school_id=None,
        )
        self.assertEqual(result["data"], organization)

    def test_global_list_is_blocked_without_calling_service(self):
        with patch.object(
            organization_router.OrganizationService, "list"
        ) as list_organizations:
            with self.assertRaises(HTTPException) as raised:
                organization_router.list_organizations(actor=self.actor)

        self.assertEqual(raised.exception.status_code, 403)
        list_organizations.assert_not_called()

    def test_mutating_organization_routes_fail_closed(self):
        cases = (
            ("create_organization", (None,), "create"),
            ("update_organization", ("org-1", None), "update"),
            ("activate_organization", ("org-1",), "activate"),
            ("deactivate_organization", ("org-1",), "deactivate"),
        )
        for route_name, args, service_method in cases:
            with self.subTest(route=route_name):
                with patch.object(
                    organization_router.OrganizationService, service_method
                ) as mutation:
                    route = getattr(organization_router, route_name)
                    with self.assertRaises(HTTPException) as raised:
                        route(*args, actor=self.actor)

                self.assertEqual(raised.exception.status_code, 403)
                mutation.assert_not_called()


if __name__ == "__main__":
    unittest.main()
