# Changelog

## 0.2.0 - 2026-11-07

### Added
- Analysis results are cached, so a policy you already checked loads instantly. Use "Re-analyze" to run a fresh check.
- GDPR, CCPA, and PIPA rubric layers, so findings reference the laws that apply to them.
- Extension icons (16, 48, 128 px).
- Privacy section in the README explaining what data stays on your device and what is sent to your chosen AI provider.

### Security
- Policy text is treated as untrusted input. The prompt now tells the model to ignore any instructions inside the excerpt.
- Quotes shorter than 12 characters are rejected during verification, to avoid matching generic phrases.
- Policy fetches no longer send cookies or other credentials.
- Only http and https URLs are accepted for policy links.
