import { describe, expect, test } from "vitest";
import { fmtNum, fmtRatio, ratioTone } from "@/lib/format";

describe("fmtNum", () => {
  test("abaixo de mil: número exato", () => {
    expect(fmtNum(999)).toBe("999");
  });

  test("milhares: arredondado + k", () => {
    expect(fmtNum(1500)).toBe("2k");
  });

  test("milhões: uma casa decimal + M", () => {
    expect(fmtNum(1_200_000)).toBe("1.2M");
  });

  test("zero", () => {
    expect(fmtNum(0)).toBe("0");
  });
});

// WP-F.2: multiplicador baseline vs real no PublishBox
describe("fmtRatio", () => {
  test("uma casa decimal + x", () => {
    expect(fmtRatio(1.84)).toBe("1.8x");
    expect(fmtRatio(0.5)).toBe("0.5x");
    expect(fmtRatio(1)).toBe("1.0x");
  });
});

describe("ratioTone", () => {
  test("≥1.2 é dourado (inclusive na borda)", () => {
    expect(ratioTone(1.2)).toBe("gold");
    expect(ratioTone(3)).toBe("gold");
  });

  test("<0.8 é âmbar", () => {
    expect(ratioTone(0.79)).toBe("amber");
    expect(ratioTone(0.1)).toBe("amber");
  });

  test("faixa intermediária é neutra (bordas 0.8 e 1.19)", () => {
    expect(ratioTone(0.8)).toBe("neutral");
    expect(ratioTone(1)).toBe("neutral");
    expect(ratioTone(1.19)).toBe("neutral");
  });
});
