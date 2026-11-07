# Check Privacy Policy

[한국어](README.md) | **English**

**Your data matters. Know what you are agreeing to.**

Most services never make clear how they handle your personal data, and their privacy policies are too long to read. This open-source Chrome extension reads the policy for you and flags clauses that put your data at risk, quoting the exact text so you can check it yourself.

## Status
Phase 1 (MVP): paste a policy URL (or detect it on the current page), get a risk score and quoted red flags. Bring your own Anthropic or OpenAI API key; it stays in your browser.

## Develop
```
npm install
npm run build      # then load dist/ via chrome://extensions → Load unpacked
npm test
```

Rules live in `rubric/core.json`; contributions that improve them are welcome. Automated analysis can be wrong and is not legal advice.

## Privacy
- No telemetry, analytics or accounts. There is no server of ours.
- Your API key is stored only in `chrome.storage.local` in your browser and is sent only to the provider you chose.
- Only the privacy-policy text is sent to that provider for analysis. Saved results (policy-derived findings, never your key) are cached locally, up to 50.
- Output is automated and is not legal advice.

## License
MIT. See [LICENSE](LICENSE).
