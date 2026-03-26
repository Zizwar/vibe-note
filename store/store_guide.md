# Vibe Note - Store Publishing Guide

## Google Play Console Setup

### App Info
- **App name**: Vibe Note - Smart Prompt Manager
- **Package name**: com.vibzcode.note
- **Default language**: English (en-US)
- **Secondary language**: Arabic (ar)
- **App category**: Tools
- **Tags**: Productivity, AI, Notes

### Content Rating
- IARC questionnaire answers:
  - No violence: Yes
  - No sexual content: Yes
  - No gambling: Yes
  - No profanity: Yes
  - No user-generated content sharing with others: Yes (content is local)
  - Expected rating: **Everyone / PEGI 3**

### Privacy & Data Safety
Fill the Data Safety form as follows:

| Question | Answer |
|----------|--------|
| Does your app collect or share data? | **No** |
| Does your app collect user data? | **No** |
| Is data encrypted in transit? | **Yes** (API calls use HTTPS) |
| Can users request data deletion? | **N/A** (no data collected) |
| Data types collected | **None** |

**Privacy policy URL**: https://note.vibzcode.com/privacy.html

### Store Listing Assets Needed
You'll need to prepare:

1. **App Icon**: 512x512 PNG (already in assets/icon.png - resize if needed)
2. **Feature Graphic**: 1024x500 PNG (banner image for Play Store header)
3. **Screenshots**:
   - Minimum 2, recommended 4-8
   - Phone: 16:9 or 9:16 ratio (1080x1920 recommended)
   - Suggested screenshots:
     1. Home screen showing prompt list
     2. Variable filler modal in action
     3. AI Assistant chat
     4. Create/Edit prompt screen
     5. Settings with dark mode
     6. Arabic language view

### Release Track Recommendation
- **First release**: Use "Internal testing" track to test on your device
- **Then**: Promote to "Open testing" or "Production"
- **Build**: Use `eas build --platform android --profile production`
- **Submit**: Upload the .aab file from EAS build

### EAS Build Commands
```bash
# Install EAS CLI if not installed
npm install -g eas-cli

# Login to Expo account
eas login

# Build for Android production
eas build --platform android --profile production

# Submit to Google Play (after first manual upload)
eas submit --platform android
```

### Pricing
- **Free**: The app is completely free
- **No in-app purchases**
- **No ads**

### Target Audience
- General audience (all ages)
- Not designed for children specifically

### App Access
- No special access needed for review
- App works fully offline without any setup
- AI features require user's own API key (optional)
