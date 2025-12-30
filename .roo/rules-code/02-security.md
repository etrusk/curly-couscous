# Security Rules for Code Mode

## Never Hardcode Secrets
- No API keys, passwords, tokens, credentials in code
- Use environment variables: process.env.API_KEY, os.environ['API_KEY']
- Use secrets managers for production

## If You See a Secret
If existing code contains hardcoded secrets:
→ Flag it immediately
→ "I found a hardcoded [secret type] in [file]. This should be moved to environment variables."

## Common Patterns to Avoid
- Connection strings with passwords
- Private keys inline
- Auth tokens in source
- .env files with real values committed
