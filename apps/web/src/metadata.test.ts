import assert from "node:assert/strict";
import test from "node:test";

import { decodeMetadataUri, metadataImageSrc } from "./metadata.js";

test("metadataImageSrc refuses remote metadata image beacons", () => {
  assert.equal(metadataImageSrc("https://tracker.example/image.png"), undefined);
  assert.equal(metadataImageSrc("http://127.0.0.1/beacon.png"), undefined);
  assert.equal(metadataImageSrc("//tracker.example/image.png"), undefined);
});

test("metadataImageSrc allows same-origin image paths", () => {
  assert.equal(metadataImageSrc("/agent.png"), "/agent.png");
});

test("decodeMetadataUri keeps image metadata without making it renderable", () => {
  const uri = `data:application/json;base64,${Buffer.from(JSON.stringify({
    name: "Beacon Demo",
    image: "https://tracker.example/image.png"
  })).toString("base64")}`;
  const decoded = decodeMetadataUri(uri);

  assert.equal(decoded.image, "https://tracker.example/image.png");
  assert.equal(metadataImageSrc(decoded.image), undefined);
});
