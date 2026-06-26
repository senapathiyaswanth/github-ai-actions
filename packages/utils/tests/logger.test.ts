import * as core from "@actions/core";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { Logger } from "../src/logger.js";

// Mock @actions/core
vi.mock("@actions/core", () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  startGroup: vi.fn(),
  endGroup: vi.fn(),
}));

describe("Logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("creates logger with default prefix and level", () => {
      const log = new Logger();
      expect(log).toBeDefined();
    });

    it("creates logger with custom prefix", () => {
      const log = new Logger("my-action");
      log.info("test");
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining("[my-action]"));
    });
  });

  describe("log levels", () => {
    it("logs debug messages when level is debug", () => {
      const log = new Logger("test", "debug");
      log.debug("debug message");
      expect(core.debug).toHaveBeenCalledWith(expect.stringContaining("debug message"));
    });

    it("does not log debug when level is info", () => {
      const log = new Logger("test", "info");
      log.debug("debug message");
      expect(core.debug).not.toHaveBeenCalled();
    });

    it("logs info messages", () => {
      const log = new Logger("test", "info");
      log.info("info message");
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining("info message"));
    });

    it("logs warn messages", () => {
      const log = new Logger("test");
      log.warn("warning message");
      expect(core.warning).toHaveBeenCalledWith(expect.stringContaining("warning message"));
    });

    it("logs error messages", () => {
      const log = new Logger("test");
      log.error("error message");
      expect(core.error).toHaveBeenCalledWith(expect.stringContaining("error message"));
    });

    it("logs error with Error instance", () => {
      const log = new Logger("test");
      const err = new Error("Test error");
      log.error("Something failed", err);
      expect(core.error).toHaveBeenCalledWith(expect.stringContaining("Test error"));
    });

    it("does not log info when level is warn", () => {
      const log = new Logger("test", "warn");
      log.info("should not appear");
      expect(core.info).not.toHaveBeenCalled();
    });
  });

  describe("setLevel", () => {
    it("updates log level at runtime", () => {
      const log = new Logger("test", "warn");
      log.setLevel("debug");
      log.debug("now visible");
      expect(core.debug).toHaveBeenCalled();
    });
  });

  describe("data serialization", () => {
    it("serializes additional data as JSON", () => {
      const log = new Logger("test");
      log.info("message", { key: "value" });
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('"key"'));
    });
  });

  describe("section", () => {
    it("logs a section header", () => {
      const log = new Logger("test");
      log.section("My Section");
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining("My Section"));
    });
  });

  describe("child", () => {
    it("creates child logger with combined prefix", () => {
      const parent = new Logger("parent");
      const child = parent.child("child");
      child.info("test");
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining("[parent:child]"));
    });
  });

  describe("group", () => {
    it("calls startGroup and endGroup", () => {
      const log = new Logger("test");
      log.group("My Group", () => {
        // sync fn
      });
      expect(core.startGroup).toHaveBeenCalledWith("My Group");
      expect(core.endGroup).toHaveBeenCalled();
    });
  });
});
