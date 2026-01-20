// Mock modules BEFORE any imports
jest.mock("gifsicle", () => "/usr/local/bin/gifsicle");

const mockExecFile = jest.fn();
jest.mock("child_process", () => ({
  execFile: mockExecFile,
}));

jest.mock("util", () => ({
  promisify: (fn) => fn,
}));

// Now import modules after mocks are set up
const fs = require("fs").promises;

const {
  optimizeGifWithQuality,
  optimizeGifToTargetSize,
  calculateLossyFromQuality,
} = require("../utils/gifOptimizer");

describe("GIF Optimizer", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation for execFile
    mockExecFile.mockImplementation(async () => {
      return { stdout: "", stderr: "" };
    });
  });

  describe("calculateLossyFromQuality", () => {
    it("should convert quality 100 to lossy 10", () => {
      expect(calculateLossyFromQuality(100)).toBe(10);
    });

    it("should convert quality 1 to lossy close to 200", () => {
      const result = calculateLossyFromQuality(1);
      expect(result).toBeGreaterThanOrEqual(195);
      expect(result).toBeLessThanOrEqual(200);
    });

    it("should convert quality 50 to approximately lossy 105", () => {
      const result = calculateLossyFromQuality(50);
      expect(result).toBeGreaterThanOrEqual(100);
      expect(result).toBeLessThanOrEqual(110);
    });

    it("should handle edge cases within bounds", () => {
      expect(calculateLossyFromQuality(0)).toBeGreaterThanOrEqual(10);
      expect(calculateLossyFromQuality(100)).toBeLessThanOrEqual(200);
    });
  });

  describe("optimizeGifWithQuality", () => {
    it("should reject non-buffer input", async () => {
      await expect(optimizeGifWithQuality("not a buffer", 85)).rejects.toThrow(
        "Input must be a Buffer"
      );
    });

    it("should reject quality out of range", async () => {
      const buffer = Buffer.from("fake gif data");

      await expect(optimizeGifWithQuality(buffer, 0)).rejects.toThrow(
        "Quality must be between 1 and 100"
      );

      await expect(optimizeGifWithQuality(buffer, 101)).rejects.toThrow(
        "Quality must be between 1 and 100"
      );
    });

    it("should reject frame width less than 16px", async () => {
      const buffer = Buffer.from("fake gif data");

      await expect(
        optimizeGifWithQuality(buffer, 85, {
          enabled: true,
          width: 15,
          preserveAspectRatio: true,
        })
      ).rejects.toThrow("Frame width must be at least 16px");
    });

    it("should reject frame height less than 16px", async () => {
      const buffer = Buffer.from("fake gif data");

      await expect(
        optimizeGifWithQuality(buffer, 85, {
          enabled: true,
          height: 10,
          preserveAspectRatio: true,
        })
      ).rejects.toThrow("Frame height must be at least 16px");
    });

    it("should process valid input successfully", async () => {
      const inputBuffer = Buffer.from("GIF89a fake gif data");
      const outputBuffer = Buffer.from("GIF89a optimized");

      // Mock fs operations
      jest.spyOn(fs, "mkdtemp").mockResolvedValue("/tmp/gif-optimize-test");
      jest.spyOn(fs, "writeFile").mockResolvedValue();
      jest.spyOn(fs, "readFile").mockResolvedValue(outputBuffer);
      jest.spyOn(fs, "unlink").mockResolvedValue();
      jest.spyOn(fs, "rmdir").mockResolvedValue();

      const result = await optimizeGifWithQuality(inputBuffer, 85);

      expect(result).toHaveProperty("buffer");
      expect(result).toHaveProperty("size");
      expect(result).toHaveProperty("lossy");
      expect(result.buffer).toBe(outputBuffer);
      expect(result.size).toBe(outputBuffer.length);
      expect(typeof result.lossy).toBe("number");
    });
  });

  describe("optimizeGifToTargetSize", () => {
    it("should reject non-buffer input", async () => {
      await expect(optimizeGifToTargetSize("not a buffer", 1572864)).rejects.toThrow(
        "Input must be a Buffer"
      );
    });

    it("should reject target size less than 10KB", async () => {
      const buffer = Buffer.from("fake gif data");

      await expect(optimizeGifToTargetSize(buffer, 5000)).rejects.toThrow(
        "Target size must be at least 10KB"
      );
    });

    it("should reject target size more than 50MB", async () => {
      const buffer = Buffer.from("fake gif data");

      await expect(optimizeGifToTargetSize(buffer, 60 * 1024 * 1024)).rejects.toThrow(
        "Target size must not exceed 50MB"
      );
    });

    it("should use binary search to find optimal size", async () => {
      const inputBuffer = Buffer.from("GIF89a fake gif data with lots of content to compress");

      // Mock different sizes based on lossy value
      let callCount = 0;
      jest.spyOn(fs, "mkdtemp").mockResolvedValue("/tmp/gif-target-test");
      jest.spyOn(fs, "writeFile").mockResolvedValue();
      jest.spyOn(fs, "unlink").mockResolvedValue();
      jest.spyOn(fs, "rmdir").mockResolvedValue();
      jest.spyOn(fs, "readdir").mockResolvedValue([]);

      jest.spyOn(fs, "stat").mockImplementation(async (_filepath) => {
        callCount++;
        // Simulate different file sizes based on iteration
        // Lower lossy = larger file, higher lossy = smaller file
        const sizes = [2000000, 1800000, 1600000, 1550000, 1520000];
        const size = sizes[Math.min(callCount - 1, sizes.length - 1)];
        return { size };
      });

      jest.spyOn(fs, "readFile").mockImplementation(async (filepath) => {
        if (filepath.includes("input.gif")) {
          return inputBuffer;
        }
        return Buffer.from("GIF89a optimized to target size");
      });

      const targetSize = 1572864; // 1.5 MB
      const result = await optimizeGifToTargetSize(inputBuffer, targetSize);

      expect(result).toHaveProperty("buffer");
      expect(result).toHaveProperty("size");
      expect(result).toHaveProperty("lossy");
      expect(result).toHaveProperty("iterations");

      // Should be within 5% tolerance
      const tolerance = targetSize * 0.05;
      expect(result.size).toBeLessThanOrEqual(targetSize + tolerance);

      // Should have made multiple iterations (binary search)
      expect(result.iterations).toBeGreaterThan(0);
      expect(result.iterations).toBeLessThanOrEqual(10);
    });

    it("should handle frame resize options", async () => {
      const inputBuffer = Buffer.from("GIF89a fake gif data");
      const outputBuffer = Buffer.from("GIF89a resized");

      jest.spyOn(fs, "mkdtemp").mockResolvedValue("/tmp/gif-target-resize");
      jest.spyOn(fs, "writeFile").mockResolvedValue();
      jest.spyOn(fs, "readFile").mockResolvedValue(outputBuffer);
      jest.spyOn(fs, "unlink").mockResolvedValue();
      jest.spyOn(fs, "rmdir").mockResolvedValue();
      jest.spyOn(fs, "readdir").mockResolvedValue([]);
      jest.spyOn(fs, "stat").mockResolvedValue({ size: 1500000 });

      const frameResize = {
        enabled: true,
        width: 400,
        height: 300,
        preserveAspectRatio: true,
      };

      const result = await optimizeGifToTargetSize(inputBuffer, 1572864, frameResize);

      expect(result).toHaveProperty("buffer");
      expect(mockExecFile).toHaveBeenCalled();

      // Check that resize arguments were passed to gifsicle
      const calls = mockExecFile.mock.calls;
      const hasResizeArg = calls.some(
        (call) => call[1] && call[1].some((arg) => arg.includes("--resize"))
      );
      expect(hasResizeArg).toBe(true);
    });

    it("should return warning when cannot reach target size", async () => {
      const inputBuffer = Buffer.from("GIF89a large gif data that cannot be compressed enough");

      jest.spyOn(fs, "mkdtemp").mockResolvedValue("/tmp/gif-target-warning");
      jest.spyOn(fs, "writeFile").mockResolvedValue();
      jest.spyOn(fs, "unlink").mockResolvedValue();
      jest.spyOn(fs, "rmdir").mockResolvedValue();
      jest.spyOn(fs, "readdir").mockResolvedValue([]);

      // Always return size larger than target
      jest.spyOn(fs, "stat").mockResolvedValue({ size: 3000000 });

      jest.spyOn(fs, "readFile").mockImplementation(async (filepath) => {
        if (filepath.includes("input.gif")) {
          return inputBuffer;
        }
        return Buffer.from("GIF89a max compressed but still too large");
      });

      const result = await optimizeGifToTargetSize(inputBuffer, 1000000);

      expect(result).toHaveProperty("warning");
      expect(result.warning).toContain("Could not reach target size");
      expect(result.lossy).toBe(200); // Maximum compression
    });
  });

  describe("Integration scenarios", () => {
    it("should optimize GIF with quality and then to target size", async () => {
      const inputBuffer = Buffer.from("GIF89a test gif");
      const optimizedBuffer = Buffer.from("GIF89a optimized");

      jest.spyOn(fs, "mkdtemp").mockResolvedValue("/tmp/gif-integration");
      jest.spyOn(fs, "writeFile").mockResolvedValue();
      jest.spyOn(fs, "readFile").mockResolvedValue(optimizedBuffer);
      jest.spyOn(fs, "unlink").mockResolvedValue();
      jest.spyOn(fs, "rmdir").mockResolvedValue();
      jest.spyOn(fs, "readdir").mockResolvedValue([]);
      jest.spyOn(fs, "stat").mockResolvedValue({ size: 1500000 });

      // First optimize with quality
      const qualityResult = await optimizeGifWithQuality(inputBuffer, 85);
      expect(qualityResult.buffer).toBeDefined();

      // Then optimize to target size
      const targetResult = await optimizeGifToTargetSize(inputBuffer, 1572864);
      expect(targetResult.buffer).toBeDefined();
      expect(targetResult.iterations).toBeGreaterThan(0);
    });
  });

  describe("Error handling", () => {
    it("should handle gifsicle execution errors", async () => {
      const inputBuffer = Buffer.from("GIF89a test");

      jest.spyOn(fs, "mkdtemp").mockResolvedValue("/tmp/gif-error");
      jest.spyOn(fs, "writeFile").mockResolvedValue();
      jest.spyOn(fs, "unlink").mockResolvedValue();
      jest.spyOn(fs, "rmdir").mockResolvedValue();

      mockExecFile.mockRejectedValue(new Error("Gifsicle execution failed"));

      await expect(optimizeGifWithQuality(inputBuffer, 85)).rejects.toThrow();
    });

    it("should handle timeout errors", async () => {
      const inputBuffer = Buffer.from("GIF89a test");

      jest.spyOn(fs, "mkdtemp").mockResolvedValue("/tmp/gif-timeout");
      jest.spyOn(fs, "writeFile").mockResolvedValue();
      jest.spyOn(fs, "unlink").mockResolvedValue();
      jest.spyOn(fs, "rmdir").mockResolvedValue();

      const timeoutError = new Error("Command failed");
      timeoutError.killed = true;
      mockExecFile.mockRejectedValue(timeoutError);

      await expect(optimizeGifWithQuality(inputBuffer, 85)).rejects.toThrow(
        "GIF optimization timed out"
      );
    });
  });
});
