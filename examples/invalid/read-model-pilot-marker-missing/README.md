# Read-Model Missing Pilot Marker Fixture

Status: invalid-read-model-test-fixture / local-focused-test-only / absence-based / not-generated-evidence

This fixture is a durable negative read-model input used to prove that a `pilot-marker-backed` profile cannot validate
without its scoped source-authority pilot marker.

It is not generated Evidence, not source authority, not a source promotion record, not CI enforcement, and not user
acceptance. It must not be added to `examples/read-model-aggregate/read-model-slices.json`, `validate --all`, or the
GitHub Actions read-model Evidence workflow unless a later explicit task approves an invalid-fixture test mode.

Expected failure:

- Todo Search uses the `pilot-marker-backed` policy level
- `generated/scoped-source-authority-pilot-marker.json` is intentionally absent in the temp validation setup
- generated read-model, evidence manifest, and parity report remain present
- parity should remain `comparison-pass` so the failure isolates the missing pilot marker boundary
- validation should return a blocking `pilot-marker-exists` check

The fixture is absence-based. It does not store a replacement marker file because the missing artifact is the test case.
