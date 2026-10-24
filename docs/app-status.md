# App status and release lifecycle

Issue #22 replaces the GitHub branch-head indicator and automatic offline save
with one App status control on every generated course page. The public labels
match the contract in Assembly Lab #35, Metadata Systems #2 and Video Lab #6.
The installed app and a normal browser tab use the same lifecycle.

## Release contract

`release.json` is same-origin, app-relative metadata (`schema: 1`):

- `id`: a deterministic 64-character SHA-256 build identity. The build hashes
  every shipped course file and the worker implementation before substituting
  the identity into HTML. It changes even when assets change without a new commit.
- `commit`, `date`: the checked-out source commit and its UTC date, or `null`
  for archives and dirty development builds. HTML embeds the running build ID
  and retains a source link/date only for a clean Git revision.
- `files`: sorted `{path, bytes, sha256}` records for every required lesson,
  module, stylesheet, image, manifest and example download.
- `bytes`: the exact sum of file body bytes. This is decoded content size;
  compression, HTTP headers and browser storage bookkeeping differ.

`releases/<id>/release.json` describes that immutable snapshot; its files live
under the same directory. Root HTML and the cached HTML reference scripts,
styles and images under that release ID, including on an uncontrolled first
visit. Publish the whole built `dist/` atomically, as the Pages workflow does.
Do not rewrite immutable files in place. Retaining older immutable directories
on other hosting platforms allows repairs of older releases; Pages publishes
only the current snapshot. If an old uncached file is no longer on the host,
its download fails honestly and the learner can prepare the current release.
A missing old file never falls through to an incompatible new root asset.

Checks use an eight-second deadline, a unique URL, `cache: no-store`, a no-cache
request header and strict metadata validation. GitHub Pages legitimately returns
positive `Age` values from its shared cache. Accept them only with an explicit
`max-age` of at most 600 seconds while `Age` is below that lifetime; reject expired,
unbounded or malformed cache responses. The panel explains that publication may
take up to ten minutes. Immutable running manifests need validation, not freshness.
The worker always forwards release metadata to the network. Aborted/late checks
cannot mark the app up to date. A check cancelled when the app is hidden preserves
the last verified status and retries on return. A failed check clears the offered
release, so Retry cannot appear alongside a stale deployment and Update button. Opening, focus, reconnect and visibility changes
check with a 15-second throttle; visible connected pages check once a minute.
Manual checks bypass the throttle and concurrent checks are deduplicated.
No version check prepares app assets. Static hosting cannot prove freshness
against a misconfigured intermediary that ignores cache directives and lies
about response age; the deployment must honour the network-only contract.

## Downloads and activation

Worker installation fetches no course assets. Once a document has loaded, its
already-visited HTML and resource URLs are retained and verified as a small
visited-page cache. Later visits are cached on demand. This pins the running
release across refresh/reopen even for online-only tabs; it neither downloads
unvisited lessons nor grants offline consent. Initial retention can require a
repeat request when the browser has no reusable HTTP response. Explicit Download for offline use
or Update prepares the selected manifest, checks every file's length and SHA-256,
and reports verified bytes. Cancellation/failure retains valid partial files for
resume and leaves the previously selected complete release intact. The real
browser quota test verifies the same failure path under storage pressure.

Background cleanup and explicit cache mutations are coordinated: an operation
reserves its lock before waiting for in-progress pruning to finish. Cleanup cannot
delete a staging cache created during a download. Cancellation still reaches a
queued download. A deterministic worker test pauses cleanup and starts an update;
it reproduces the former race without relying on timing.

The worker stores a small selection record separately from per-release caches.
Preparing an update sets `pending`; only Restart to update changes `active`.
Closing all tabs, reopening the browser, visibility changes and ordinary refresh
never select a pending release. Later dismisses the dialog, not its badge.

Preparing an online-only update also stages a complete small snapshot to make
activation coherent, but does not set the durable offline-consent flag. Its
status remains Not saved for offline use. A previously saved installation keeps
that intent across updates and reports Available offline only after verifying
its selected manifest against all cached file bodies. Focus/reopen rechecks
completeness; eviction becomes Offline download incomplete with a repair action.

Before committing, every supported open course window must acknowledge a
snapshot saved to its own session storage. Controls, visual selections, outputs,
trace positions, challenge state, expanded details, scroll position and routes
are restored. Composition, registered busy/unsaved guards, missing experiment
initialisation, inaccessible session storage and non-responsive windows block
the whole restart. Prepared participants lock their controls, unlock on abort,
and reload only after the selection record is committed. Navigation requests
wait during that transaction. Assets are pinned per document, so a delayed window
cannot accidentally load a different release's JavaScript. Snapshot failures on
restore retain a downloadable JSON recovery copy instead of discarding inputs.

The stable worker protocol is separate from the app release. Future incompatible
protocol changes require a migration; do not use unconditional `skipWaiting`.
Caches are scoped to the exact registration base URL. Cleanup keeps the active,
previous, pending and resumable snapshots and only removes obsolete caches when
all known course windows report the selected release. Remove offline copy asks
for confirmation, unregisters this app only, and deletes its scoped caches. It
never clears localStorage, sessionStorage, learner work or sibling app caches.

## Existing installations

The previous worker's complete caches remain intact during migration. Its waiting
worker can still require all old tabs/windows to be closed once before the new
protocol controls the app. Reopen online to load the new App status interface.
Legacy caches count as prior offline consent, but are not asserted to match the
new running manifest. Repair offline copy verifies and completes the new release
explicitly; an update also preserves that existing offline intent. The regression
fixture is the actual worker from commit `4875086`, not a mock worker API.

## Validation and review

- `npm run check`: dependency-free Node model/build tests and production build.
- `python tests/browser.py`: all existing lesson flows, phone/desktop themes,
  keyboard navigation, no-JavaScript content, plus deployed metadata comparison,
  unchanged running identity, failed/malformed/cached responses, real timeout,
  late-response rejection and dialog focus restoration.
- `python tests/offline.py`: two independently built releases with real Chromium
  workers. Explicit save, measured size, cancel/resume, every offline asset/page,
  real quota failure, failed replacement, Later, input composition, unsaved guard,
  denied snapshot storage, non-responsive tab, multi-tab route/input/result/trace
  restoration, eviction/repair, confirmed scoped removal, online-only deferred refresh/reopen, persistent cold offline
  startup, no activation on closing windows, and legacy-worker migration.
- Screenshots: [before phone](app-status/before-mobile.png),
  [after phone](app-status/after-mobile.png),
  [before desktop](app-status/before-desktop.png),
  [after desktop](app-status/after-desktop.png). Before images use the previous
  main implementation; after images use the independently built test release,
  which correctly identifies itself as a development/archive build.

Tests use pinned Playwright 1.58 / Chromium 145, matching CI. Browser screenshots
are also uploaded by CI. No new CUDA code is introduced. Native installation UI,
Safari/iOS worker/storage behaviour and manual screen-reader output have not been
validated in this environment. The dialog uses native modal focus behaviour,
explicit labels, status regions and a labelled progress element; reduced-motion
and touch-sized layouts are exercised in Chromium.

The implementation received a local source/behaviour review, including cache
scope, late-check rejection, atomic selection, all-window guards, restore paths
and truthful labels. That is author review, not independent human review. The
pull request remains the place for the independent review requested by #22;
CI provides separate automated verification but is not described as human review.
