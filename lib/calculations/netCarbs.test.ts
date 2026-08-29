import { describe, expect, it } from "vitest";
import { computeNetCarbs, isKetoFriendly, ketoVerdict, KETO_NET_CARB_THRESHOLD_G } from "./netCarbs";

describe("computeNetCarbs", () => {
  it("subtracts fiber and sugar alcohols from total carbs", () => {
    expect(computeNetCarbs(15, 7, 6)).toBe(2);
  });

  it("clamps to zero instead of going negative", () => {
    expect(computeNetCarbs(5, 10, 0)).toBe(0);
  });

  it("handles zero fiber and sugar alcohols", () => {
    expect(computeNetCarbs(9, 0, 0)).toBe(9);
  });
});

describe("isKetoFriendly", () => {
  it("is true at or under the default threshold", () => {
    expect(isKetoFriendly(KETO_NET_CARB_THRESHOLD_G)).toBe(true);
    expect(isKetoFriendly(3)).toBe(true);
  });

  it("is false above the default threshold", () => {
    expect(isKetoFriendly(11)).toBe(false);
  });

  it("respects a custom threshold", () => {
    expect(isKetoFriendly(8, 5)).toBe(false);
  });
});

describe("ketoVerdict", () => {
  it("returns great for very low net carbs", () => {
    expect(ketoVerdict(0).verdict).toBe("great");
    expect(ketoVerdict(5).verdict).toBe("great");
  });

  it("returns ok in the moderate band", () => {
    expect(ketoVerdict(6).verdict).toBe("ok");
    expect(ketoVerdict(10).verdict).toBe("ok");
  });

  it("returns over above the threshold", () => {
    expect(ketoVerdict(11).verdict).toBe("over");
  });
});
