"""Tests for GoogleTokenVerifier."""

from unittest.mock import patch

import pytest

from miam.infra.google_auth import GoogleTokenVerifier


class TestGoogleTokenVerifier:
    def test_valid_token_returns_user_info(self) -> None:
        verifier = GoogleTokenVerifier(client_id="test-client-id")

        mock_idinfo = {
            "email": "alice@gmail.com",
            "name": "Alice",
            "sub": "google-123",
            "picture": "https://example.com/alice.jpg",
            "email_verified": True,
        }

        with patch(
            "miam.infra.google_auth.id_token.verify_oauth2_token"
        ) as mock_verify:
            mock_verify.return_value = mock_idinfo
            result = verifier.verify("valid-token")

        assert result.email == "alice@gmail.com"
        assert result.name == "Alice"
        assert result.google_id == "google-123"
        assert result.picture == "https://example.com/alice.jpg"

    def test_valid_token_without_picture(self) -> None:
        verifier = GoogleTokenVerifier(client_id="test-client-id")

        mock_idinfo = {
            "email": "bob@gmail.com",
            "name": "Bob",
            "sub": "google-456",
            "email_verified": True,
        }

        with patch(
            "miam.infra.google_auth.id_token.verify_oauth2_token"
        ) as mock_verify:
            mock_verify.return_value = mock_idinfo
            result = verifier.verify("valid-token")

        assert result.picture is None

    def test_invalid_token_raises_value_error(self) -> None:
        verifier = GoogleTokenVerifier(client_id="test-client-id")

        with patch(
            "miam.infra.google_auth.id_token.verify_oauth2_token"
        ) as mock_verify:
            mock_verify.side_effect = ValueError("Token expired")
            with pytest.raises(ValueError, match="Invalid Google token"):
                verifier.verify("expired-token")

    def test_unverified_email_raises_value_error(self) -> None:
        verifier = GoogleTokenVerifier(client_id="test-client-id")

        mock_idinfo = {
            "email": "unverified@gmail.com",
            "name": "Unverified",
            "sub": "google-000",
            "email_verified": False,
        }

        with patch(
            "miam.infra.google_auth.id_token.verify_oauth2_token"
        ) as mock_verify:
            mock_verify.return_value = mock_idinfo
            with pytest.raises(ValueError, match="Google email not verified"):
                verifier.verify("valid-token")

    def test_passes_client_id_to_google(self) -> None:
        verifier = GoogleTokenVerifier(client_id="my-client-id")

        mock_idinfo = {
            "email": "test@gmail.com",
            "name": "Test",
            "sub": "google-789",
            "email_verified": True,
        }

        with patch(
            "miam.infra.google_auth.id_token.verify_oauth2_token"
        ) as mock_verify:
            mock_verify.return_value = mock_idinfo
            verifier.verify("some-token")

        mock_verify.assert_called_once()
        call_args = mock_verify.call_args
        assert (
            call_args[1].get("audience") == "my-client-id"
            or call_args[0][2] == "my-client-id"
        )
