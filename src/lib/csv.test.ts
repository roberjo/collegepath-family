import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("quotes commas, quotes, and newlines", () => {
    expect(toCsv([{ a: 'He said "hi", ok', b: "line1\nline2", c: null }])).toBe(
      'a,b,c\r\n"He said ""hi"", ok","line1\nline2",',
    );
  });

  it("neutralises spreadsheet formulas", () => {
    expect(toCsv([{ a: "=HYPERLINK(1)", b: "-5", c: 7 }])).toBe("a,b,c\r\n'=HYPERLINK(1),'-5,7");
  });

  it("uses a fixed column order when given", () => {
    expect(toCsv([{ b: 2, a: 1 }], ["a", "b"])).toBe("a,b\r\n1,2");
  });
});
