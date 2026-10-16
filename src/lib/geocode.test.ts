import { test } from "node:test";
import assert from "node:assert/strict";
import { withCity } from "./geocode.server.ts";

test("street addresses get the city added", () => {
  assert.equal(
    withCity("1000 Bardstown Rd", "Louisville", "KY"),
    "1000 Bardstown Rd, Louisville, KY",
  );
  assert.equal(
    withCity("100 Main St, St Matthews", "Louisville", "KY"),
    "100 Main St, St Matthews, Louisville, KY",
  );
  assert.equal(
    withCity("Kentucky Kingdom", "Louisville", "KY"),
    "Kentucky Kingdom, Louisville, KY",
  );
});

test("text that already names a city, state or ZIP is left alone", () => {
  for (const a of [
    "Clarksville Little League, Clarksville, IN",
    "501 E Court Ave, Jeffersonville, IN 47130",
    "1920 Newburg Rd, Louisville",
    "Falls of the Ohio State Park, Clarksville, Indiana",
  ]) {
    assert.equal(withCity(a, "Louisville", "KY"), a);
  }
});
