# Auto-Update System Documentation

## Overview

This project now includes an automated system that keeps champion cooldown data and patch information up-to-date using Riot's DDragon API.

## Features

✅ **Automatic Patch Detection**: Checks daily for new League of Legends patches
✅ **Cooldown Updates**: Automatically updates all champion ability cooldowns
✅ **Patch Version Updates**: Auto-updates the patch version displayed on the website
✅ **New Champion Detection**: Detects and adds new champions (with manual review flag for threat tags)
✅ **Preserves Manual Curation**: Keeps all manually-curated threat tags intact

## How It Works

### GitHub Actions Workflow

The workflow runs automatically:
- **Schedule**: Daily at 12:00 UTC
- **Manual Trigger**: Can be triggered manually via GitHub Actions UI
- **Location**: `.github/workflows/update-champion-data.yml`

### Update Script

The Node.js script (`scripts/update-champion-data.js`) performs the following:

1. **Fetches Latest Patch**: Queries DDragon API for current patch version
2. **Checks for Changes**: Compares with current patch in `app.js`
3. **Updates Cooldowns**: For each champion:
   - Fetches detailed ability data from DDragon API
   - Updates cooldown arrays in `champions-summary.json`
   - Preserves all threat tags and manual notes
4. **Updates Patch Info**: Modifies `const latestUpdate` in `app.js`
5. **Commits Changes**: Auto-commits and pushes if data changed

### What Gets Updated

✅ **Updated Automatically**:
- Champion ability cooldowns (Q, W, E, R)
- Ability names (if changed by Riot)
- Passive ability names
- Patch version number in app.js
- Patch notes URL

❌ **NOT Updated (Manual Curation Required)**:
- Threat tags (KNOCKUP, STUN, GAP_CLOSE, etc.)
- Ability notes and descriptions
- Champion role classifications

### New Champions

When a new champion is released:
- The script detects and adds them to `champions-summary.json`
- Cooldown data is automatically populated
- Threat tags are left empty with a note: `"⚠️ New champion - threat tags need manual review"`
- Manual review is required to add appropriate threat classifications

## Manual Testing

You can test the update system locally:

```bash
# Install dependencies
npm install

# Run update script (dry run - checks current patch)
npm run update-data

# Force update even if patch is current
npm run test-update
```

## Manual Triggering

To manually trigger an update via GitHub:

1. Go to **Actions** tab in GitHub
2. Select **Auto-Update Champion Data** workflow
3. Click **Run workflow**
4. (Optional) Check "Force update" to update even if patch is current

## Monitoring

Check the GitHub Actions tab to monitor:
- Update status and logs
- When last update ran
- Any errors or issues

## Data Sources

- **Cooldowns**: Riot Games DDragon API (`ddragon.leagueoflegends.com`)
- **Threat Tags**: Manually curated based on League of Legends Wiki
- **CC Classifications**: Based on [Cleanse mechanics](https://wiki.leagueoflegends.com/en-us/Cleanse)

## Rollback

If an auto-update causes issues:

```bash
# Revert to previous commit
git revert HEAD

# Or manually restore from a previous commit
git checkout <commit-hash> champions-summary.json app.js
```

## Future Enhancements

Possible improvements:
- Slack/Discord notifications for updates
- Automated testing of data integrity
- AI-assisted threat tag suggestions for new champions
- Ability description updates

## Notes

- The system uses HTTPS and built-in Node.js libraries (no axios despite package.json listing it)
- Rate limiting: 100ms delay per 10 champions to respect Riot's API
- Cooldown arrays always contain 6 values to support ultimate evolutions
- Auto-updates run on the `main` branch (workflow commits directly)

---

**Last Updated**: 2025-11-09
**Automation Added**: Patch 25.22
