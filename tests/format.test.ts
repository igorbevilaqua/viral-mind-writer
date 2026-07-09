import { describe, expect, test } from "vitest";
import { fmtNum } from "@/lib/format";

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
