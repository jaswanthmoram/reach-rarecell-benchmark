"""Tests for REACH CLI."""

from typer.testing import CliRunner

from rarecellbenchmark import __version__
from rarecellbenchmark.cli import app

runner = CliRunner()


def test_cli_help() -> None:
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert "REACH" in result.output


def test_cli_version() -> None:
    result = runner.invoke(app, ["--version"])
    assert result.exit_code == 0
    assert __version__ in result.output


def test_cli_init() -> None:
    result = runner.invoke(app, ["init"])
    assert result.exit_code == 0
    assert "Initialization complete" in result.output
