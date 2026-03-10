"""Tests for JwtTokenHandler."""

from uuid import uuid4

import pytest

from miam.infra.jwt_handler import JwtTokenHandler


class TestCreateAccessToken:
    def test_returns_string(self) -> None:
        handler = JwtTokenHandler(
            secret_key="test-secret-that-is-long-enough-for-hmac-sha256"
        )
        token = handler.create_access_token(uuid4())
        assert isinstance(token, str)
        assert len(token) > 0

    def test_different_users_get_different_tokens(self) -> None:
        handler = JwtTokenHandler(
            secret_key="test-secret-that-is-long-enough-for-hmac-sha256"
        )
        t1 = handler.create_access_token(uuid4())
        t2 = handler.create_access_token(uuid4())
        assert t1 != t2


class TestDecodeAccessToken:
    def test_round_trip(self) -> None:
        handler = JwtTokenHandler(
            secret_key="test-secret-that-is-long-enough-for-hmac-sha256"
        )
        user_id = uuid4()
        token = handler.create_access_token(user_id)
        decoded = handler.decode_access_token(token)
        assert decoded == user_id

    def test_invalid_token_raises(self) -> None:
        handler = JwtTokenHandler(
            secret_key="test-secret-that-is-long-enough-for-hmac-sha256"
        )
        with pytest.raises(ValueError, match="Invalid or expired token"):
            handler.decode_access_token("garbage-token")

    def test_wrong_secret_raises(self) -> None:
        handler1 = JwtTokenHandler(secret_key="secret-a-that-is-long-enough-for-hmac")
        handler2 = JwtTokenHandler(secret_key="secret-b-that-is-long-enough-for-hmac")
        token = handler1.create_access_token(uuid4())
        with pytest.raises(ValueError, match="Invalid or expired token"):
            handler2.decode_access_token(token)

    def test_expired_token_raises(self) -> None:
        handler = JwtTokenHandler(
            secret_key="test-secret-that-is-long-enough-for-hmac-sha256",
            expiration_minutes=-1,
        )
        token = handler.create_access_token(uuid4())
        with pytest.raises(ValueError, match="Invalid or expired token"):
            handler.decode_access_token(token)

    def test_custom_algorithm(self) -> None:
        handler = JwtTokenHandler(
            secret_key="test-secret-that-is-long-enough-for-hmac-sha384-algorithm!",
            algorithm="HS384",
        )
        user_id = uuid4()
        token = handler.create_access_token(user_id)
        decoded = handler.decode_access_token(token)
        assert decoded == user_id
