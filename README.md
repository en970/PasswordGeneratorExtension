# Strong Password Generator - Chrome Extension

This extension generates strong passwords locally using cryptographically secure randomness. All generation happens on your device and nothing is stored or transmitted.

## Installation

1. Create a folder on your computer (e.g. `RandomPasswordChromeextension`) or use the existing project folder.
2. Save the following files into that folder:
   - `manifest.json`
   - `popup.html`
   - `popup.js`
   - (Optional) `icon16.png` — 16x16 icon image referenced by the manifest.
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode** (toggle in the top-right corner).
5. Click **Load unpacked** (top-left) and select the folder from step 1.
6. The extension should now be loaded. Click the extension icon (puzzle or extensions menu) and choose the extension to open the popup.

## Usage

- In the popup, set the number of Symbols, Numbers, Uppercase and Lowercase characters you want in the password. Each field requires at least 1. The sum of these values is the total password length and must be at least 8.
- Click **Generate Password** to create a new password.
- Click the generated password to copy it to your clipboard. You will see a confirmation: "Password copied to clipboard! (Not Stored)".

## Privacy

Passwords are generated locally using `window.crypto.getRandomValues`. They are not stored, logged, or transmitted.

## Notes

- If you enter a total less than 8 across all fields, the extension will alert: "Minimum total length is 8.".
- If you want an initial password on open, uncomment the `generateButton.click();` line in `popup.js`.

## New Features (Mouse Wheel, Randomize, Save List)

- Mouse Wheel: You can use your mouse wheel over any number input (Symbols, Numbers, Uppercase, Lowercase) to increment/decrement the value.
- Randomize Specs: Click the "Randomize Specs" button to pick random counts for each category (0–10). The randomizer ensures the total length is at least 8 and will auto-generate the matching password.
- Save List: Click "Save Current to List" to save the displayed password with a memorable name. Saved items are stored locally using `chrome.storage.local` and shown in the "My Passwords" list. For security the actual password text is not displayed—only the name. Use the "Copy" button to copy a saved password, and the "X" button to delete it.

## Testing the new features

1. Open the popup and hover your mouse over the number inputs and scroll to change values.
2. Click "Randomize Specs" to generate random counts (and auto-generate a password).
3. Click "Save Current to List", give it a name, and then see it appear under "My Passwords".
4. Use the "Copy" button next to a saved name to copy its password to clipboard, and "X" to delete it.

Note: The extension uses `chrome.storage.local` to save the list. This data remains on your machine (in Chrome profile storage) until you remove it or delete the extension.