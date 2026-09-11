import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const tracksSource = readFileSync(new URL("../src/data/tracks.js", import.meta.url), "utf8");
const tracksModule = await import(`data:text/javascript;base64,${Buffer.from(tracksSource).toString("base64")}`);
const tracks = tracksModule.tracks;
const experienceSource = app.slice(app.indexOf("const fragmentExperiences ="), app.indexOf("function getFragmentConfig"));
const experienceIds = [...experienceSource.matchAll(/^\s{2}([a-z]+): \{/gm)].map(match => match[1]);

assert.ok(tracks.length > 0, "tracks must be configured");
for (const track of tracks) {
  assert.ok(track.fragment, `${track.id} must define its shared lifecycle config`);
  assert.ok(experienceIds.includes(track.fragment.experience), `${track.id} must reference a registered visual experience`);
  assert.ok(track.fragment.audioDurationMs > 0, `${track.id} must define audio timing`);
  assert.ok(track.fragment.visualDurationMs >= track.fragment.audioDurationMs, `${track.id} visual timing must cover its audio`);
  assert.equal(typeof track.fragment.dismissOnBackground, "boolean", `${track.id} must define background dismissal`);
  assert.equal(typeof track.fragment.autoDismiss, "boolean", `${track.id} must define completion behavior`);
}
assert.match(app, /function exitActiveFragment\(reason = "background"/);
assert.match(app, /await exitActiveFragment\("track-switch"\)/);
assert.match(app, /exitActiveFragment\("scene-change"\)/);
assert.match(app, /exitActiveFragment\("audio-ended"\)/);
assert.match(app, /exitActiveFragment\("auto-timeout"\)/);
assert.match(app, /await exitActiveFragment\("reset"\)/);
assert.match(app, /scope\.listen\(audio, "ended"/);
assert.match(app, /scope\.cancelScheduled\(\)/);
assert.match(app, /fadeActiveTrackAudio\(session/);
assert.doesNotMatch(app, /fragmentTimer/);
assert.doesNotMatch(app, /activeAudio\.addEventListener\("ended"/);

for (const surface of ["grass-message", "dawn-scene", "shelter-scene", "goodnews-scene", "wilds-formation"]) {
  assert.match(html, new RegExp(`class="[^"]*${surface}[^"]*fragment-surface`), `${surface} must use the shared exit surface`);
}
assert.match(html, /goodnews-score-hit" data-fragment-interactive/);
assert.match(html, /grass-message-copy" data-fragment-interactive/);
assert.match(html, /dawn-earth-image"[^>]+data-fragment-interactive/);
assert.match(html, /dream-todo"[^>]+data-fragment-interactive/);
assert.match(styles, /\.stage\.fragment-exiting \.fragment-surface/);
assert.match(styles, /\[data-fragment-interactive\] \{ pointer-events: auto; \}/);
assert.match(styles, /\.fragment-caption\[data-fragment-interactive\] \{ pointer-events: none; \}/);
assert.match(styles, /\.fragment-caption\.visible\[data-fragment-interactive\] \{ pointer-events: auto; \}/);

console.log(`fragment lifecycle contract passed for ${tracks.length} tracks`);
