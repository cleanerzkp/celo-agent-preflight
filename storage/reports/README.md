# Preflight Report Storage

Drop canonical `preflight.report.v0.1` JSON files in this directory to publish
them through the local ReadyList, `/api/reports`, `/api/agents`, and report
pages.

Only commit reports that are deliberately public and reproducible from the
scanner. Generated smoke-test reports, local experiments, and unreviewed third
party data should be removed before a public release.

Demo agent rows are useful for reviewer navigation, but they are not grant
evidence until paired with current scan timestamps and Celo attestation
transactions.
