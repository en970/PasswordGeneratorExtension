document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generate');
    const passwordOutput = document.getElementById('password-output');
    const symbolsInput = document.getElementById('symbols');
    const numbersInput = document.getElementById('numbers');
    const uppercaseInput = document.getElementById('uppercase');
    const lowercaseInput = document.getElementById('lowercase');
    const randomizeButton = document.getElementById('randomize-specs');
    const toggleSaveForm = document.getElementById('toggle-save-form');
    const saveFormContainer = document.getElementById('save-form-container');
    const saveNameInput = document.getElementById('save-name-input');
    const savePasswordInput = document.getElementById('save-password-input');
    const confirmSaveButton = document.getElementById('confirm-save-button');
    const cancelSaveButton = document.getElementById('cancel-save-button');
    const passwordListEl = document.getElementById('password-list');
    const visibilityToggle = document.getElementById('toggle-visibility');
    const toastEl = document.getElementById('toast');

    // Visibility state (default false: obscured)
    let isPasswordVisible = false;
    // Index of item pending deletion via modal
    let itemToDeleteIndex = null;

    // Character sets
    const LOWER = 'abcdefghijklmnopqrstuvwxyz';
    const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const DIGITS = '0123456789';
    const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:\",.<>?/~`';

    // Secure random integer in [0, max)
    function secureRandomInt(max) {
        if (max <= 0) return 0;
        const uint32 = new Uint32Array(1);
        window.crypto.getRandomValues(uint32);
        return uint32[0] % max; // modulo bias negligible for our small sets
    }

    // Securely pick a char from a set
    function pickRandomChar(set) {
        const idx = secureRandomInt(set.length);
        return set.charAt(idx);
    }

    // Secure shuffle using Fisher-Yates with crypto RNG
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = secureRandomInt(i + 1);
            const tmp = array[i];
            array[i] = array[j];
            array[j] = tmp;
        }
    }

    /**
     * Generate password based on per-component counts.
     * Ensures each component has at least the requested count and uses crypto RNG.
     * Returns string or throws Error with a message.
     */
    function generatePassword() {
        const s = parseInt(symbolsInput.value, 10) || 0;
        const n = parseInt(numbersInput.value, 10) || 0;
        const u = parseInt(uppercaseInput.value, 10) || 0;
        const l = parseInt(lowercaseInput.value, 10) || 0;

        // enforce minimums (inputs have min=1, but parseInt fallback safety)
        const symbolsCount = Math.max(0, s);
        const numbersCount = Math.max(0, n);
        const uppercaseCount = Math.max(0, u);
        const lowercaseCount = Math.max(0, l);

        const total = symbolsCount + numbersCount + uppercaseCount + lowercaseCount;
        if (total < 8) {
            throw new Error('Minimum total length is 8.');
        }

        const chars = [];

        for (let i = 0; i < symbolsCount; i++) chars.push(pickRandomChar(SYMBOLS));
        for (let i = 0; i < numbersCount; i++) chars.push(pickRandomChar(DIGITS));
        for (let i = 0; i < uppercaseCount; i++) chars.push(pickRandomChar(UPPER));
        for (let i = 0; i < lowercaseCount; i++) chars.push(pickRandomChar(LOWER));

        // Shuffle the resulting characters to mix categories
        shuffleArray(chars);

        return chars.join('');
    }

    // Click handler for Generate button
    generateButton.addEventListener('click', () => {
        try {
            const pwd = generatePassword();
            passwordOutput.textContent = pwd;
        } catch (err) {
            showToast(err.message || 'Error generating password');
        }
    });

    // Wheel support for number inputs: scroll up to increase, down to decrease (honor min)
    function attachWheelIncrement(el) {
        el.addEventListener('wheel', (e) => {
            e.preventDefault();
            const step = 1;
            const current = parseInt(el.value, 10) || 0;
            const min = parseInt(el.getAttribute('min') || '0', 10);
            if (e.deltaY < 0) { // scroll up
                el.value = current + step;
            } else { // scroll down
                el.value = Math.max(min, current - step);
            }
        }, { passive: false });
    }

    [symbolsInput, numbersInput, uppercaseInput, lowercaseInput].forEach(attachWheelIncrement);

    // Randomize Specs button: generate four ints 0..10 inclusive and ensure total >= 8
    randomizeButton.addEventListener('click', () => {
        // generate initial randoms 0..10
        let s = secureRandomInt(11); // 0..10
        let n = secureRandomInt(11);
        let u = secureRandomInt(11);
        let l = secureRandomInt(11);
        let total = s + n + u + l;
        // If total < 8, bump random fields until total >= 8 (keeping each <=10)
        const fields = ['s','n','u','l'];
        while (total < 8) {
            // choose a random field to increment that is < 10
            const choices = [];
            if (s < 10) choices.push('s');
            if (n < 10) choices.push('n');
            if (u < 10) choices.push('u');
            if (l < 10) choices.push('l');
            if (choices.length === 0) break; // all are 10
            const pick = choices[secureRandomInt(choices.length)];
            if (pick === 's') { s++; }
            else if (pick === 'n') { n++; }
            else if (pick === 'u') { u++; }
            else if (pick === 'l') { l++; }
            total = s + n + u + l;
        }

        symbolsInput.value = s;
        numbersInput.value = n;
        uppercaseInput.value = u;
        lowercaseInput.value = l;

        // Try to generate and set the password; generatePassword will validate total >= 8
        try {
            const pwd = generatePassword();
            passwordOutput.textContent = pwd;
        } catch (err) {
            showToast(err.message || 'Error generating password');
        }
    });

    // Click to copy
    passwordOutput.addEventListener('click', () => {
        const password = passwordOutput.textContent;
        const defaultText = 'Your generated password will appear here';
        if (!password || password === defaultText) return;

        navigator.clipboard.writeText(password).then(() => {
            showToast('Password copied to clipboard! (Not Stored)');
        }).catch(err => {
            console.error('Copy failed', err);
            showToast('Copy failed.');
        });
    });

    // Toggle inline save form (no prompt())
    toggleSaveForm.addEventListener('click', () => {
        const current = passwordOutput.textContent;
        const defaultText = 'Your generated password will appear here';
        if (!current || current === defaultText) {
            showToast('No password to save. Generate one first.');
            return;
        }
        savePasswordInput.value = current;
        saveNameInput.value = '';
        saveNameInput.style.border = '';
        saveFormContainer.style.display = 'block';
        saveNameInput.focus();
    });

    // Confirm save: validate name and save using chrome.storage.local
    confirmSaveButton.addEventListener('click', () => {
        const name = (saveNameInput.value || '').trim();
        const pass = savePasswordInput.value || '';
        if (!name) {
            saveNameInput.style.border = '1px solid red';
            saveNameInput.focus();
            return;
        }

        chrome.storage.local.get(['passwords'], (res) => {
            const list = res.passwords || [];
            const isDuplicate = list.some(item => item.name === name && item.pass === pass);
            if (isDuplicate) {
                alert('This name and password combination already exists.');
                return;
            }
            list.push({ name: name, pass: pass });
            chrome.storage.local.set({ passwords: list }, () => {
                loadAndRenderPasswords();
                // hide and clear
                saveFormContainer.style.display = 'none';
                saveNameInput.value = '';
                savePasswordInput.value = '';
                displayStatusMessage('Password saved!', 'success');
            });
        });
    });

    // Cancel save: hide and clear fields
    cancelSaveButton.addEventListener('click', () => {
        saveFormContainer.style.display = 'none';
        saveNameInput.value = '';
        savePasswordInput.value = '';
        saveNameInput.style.border = '';
    });

    // Centralized loader + renderer: always reads from storage and (re)builds the list
    function loadAndRenderPasswords() {
        chrome.storage.local.get(['passwords', 'isPasswordVisible'], (res) => {
            const list = Array.isArray(res.passwords) ? res.passwords : [];
            isPasswordVisible = !!res.isPasswordVisible;
            if (visibilityToggle) visibilityToggle.checked = isPasswordVisible;

            // Clear current list
            passwordListEl.innerHTML = '';

            if (list.length === 0) {
                const li = document.createElement('li');
                li.style.color = '#666';
                li.style.fontSize = '12px';
                li.textContent = 'No saved passwords';
                passwordListEl.appendChild(li);
                return;
            }

            // Rebuild list and attach listeners per-item to avoid stale references
            list.forEach((item, idx) => {
                const li = document.createElement('li');

                const meta = document.createElement('div');
                meta.className = 'meta';

                const nameEl = document.createElement('strong');
                nameEl.innerHTML = escapeHtml(item.name);

                const pwText = document.createElement('span');
                pwText.className = 'password-text';
                pwText.style.display = isPasswordVisible ? 'inline' : 'none';
                pwText.textContent = item.pass;

                const pwDots = document.createElement('span');
                pwDots.className = 'password-dots';
                pwDots.style.display = isPasswordVisible ? 'none' : 'inline';
                pwDots.textContent = '•'.repeat(Math.max(8, item.pass.length));

                meta.appendChild(nameEl);
                meta.appendChild(pwText);
                meta.appendChild(pwDots);

                const actions = document.createElement('div');
                actions.className = 'actions';

                const copyBtn = document.createElement('button');
                copyBtn.textContent = 'Copy';
                copyBtn.className = 'copy-saved';
                copyBtn.dataset.index = idx;
                copyBtn.dataset.password = item.pass; // Store real password for copy
                copyBtn.style.background = '#06b6d4';
                copyBtn.style.color = '#fff';

                const delBtn = document.createElement('button');
                delBtn.textContent = 'X';
                delBtn.className = 'delete-saved';
                delBtn.dataset.index = idx;
                delBtn.style.background = '#ef4444';
                delBtn.style.color = '#fff';

                // Attach per-button listeners (fresh closures, no stale state)
                copyBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const pwd = copyBtn.dataset.password || '';
                    if (!pwd) return;
                    navigator.clipboard.writeText(pwd).then(() => {
                        displayStatusMessage('Password copied to clipboard!', 'success');
                    }).catch(() => {
                        displayStatusMessage('Copy failed', 'error');
                    });
                });

                delBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    // Open confirmation modal instead of deleting immediately
                    itemToDeleteIndex = parseInt(delBtn.dataset.index, 10);
                    const modal = document.getElementById('delete-confirmation-modal');
                    if (modal) modal.classList.add('show');
                });

                actions.appendChild(copyBtn);
                actions.appendChild(delBtn);

                li.appendChild(meta);
                li.appendChild(actions);

                passwordListEl.appendChild(li);
            });
        });
    }

    // Helper: escape HTML for names
    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (s) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
    }

    // Note: per-item listeners are attached inside loadAndRenderPasswords()

    // Toast helper (replace alert)
    function showToast(msg, duration = 2200) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.style.display = 'block';
        clearTimeout(toastEl._timer);
        toastEl._timer = setTimeout(() => {
            toastEl.style.display = 'none';
        }, duration);
    }

    // Status message helper
    function displayStatusMessage(msg, type = 'success', duration = 3000) {
        const statusEl = document.getElementById('status-message');
        if (!statusEl) return;
        statusEl.textContent = msg;
        statusEl.style.color = type === 'error' ? 'red' : 'green';
        statusEl.style.display = 'block';
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, duration);
    }

    // Initial load: always use the centralized loader which reads directly from storage
    loadAndRenderPasswords();

    // Modal buttons: confirm / cancel delete
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            const modal = document.getElementById('delete-confirmation-modal');
            if (modal) modal.classList.remove('show');
            itemToDeleteIndex = null;
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            if (itemToDeleteIndex === null) return;
            chrome.storage.local.get(['passwords'], (res) => {
                const current = Array.isArray(res.passwords) ? res.passwords : [];
                if (itemToDeleteIndex >= 0 && itemToDeleteIndex < current.length) {
                    current.splice(itemToDeleteIndex, 1);
                    chrome.storage.local.set({ passwords: current }, () => {
                        // Refresh UI after delete
                        loadAndRenderPasswords();
                        displayStatusMessage('Password deleted!', 'success');
                        const modal = document.getElementById('delete-confirmation-modal');
                        if (modal) modal.classList.remove('show');
                        itemToDeleteIndex = null;
                    });
                } else {
                    itemToDeleteIndex = null;
                    const modal = document.getElementById('delete-confirmation-modal');
                    if (modal) modal.classList.remove('show');
                }
            });
        });
    }

    // Visibility toggle change listener: persist and toggle DOM elements
    if (visibilityToggle) {
        visibilityToggle.addEventListener('change', (e) => {
            isPasswordVisible = !!e.target.checked;
            chrome.storage.local.set({ isPasswordVisible: isPasswordVisible }, () => {
                // Toggle all password-text and password-dots in the list
                const pwTexts = document.querySelectorAll('.password-text');
                const pwDots = document.querySelectorAll('.password-dots');
                pwTexts.forEach(el => el.style.display = isPasswordVisible ? 'inline' : 'none');
                pwDots.forEach(el => el.style.display = isPasswordVisible ? 'none' : 'inline');
            });
        });
    }

    // (No theme/dark-mode initialization here)

    // Keyboard accessibility: Enter confirms save, Esc cancels
    saveNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); confirmSaveButton.click(); }
        if (e.key === 'Escape') { e.preventDefault(); cancelSaveButton.click(); }
    });
    savePasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); confirmSaveButton.click(); }
        if (e.key === 'Escape') { e.preventDefault(); cancelSaveButton.click(); }
    });

    // Global Escape to close save form
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (saveFormContainer.style.display === 'block') {
                cancelSaveButton.click();
            }
        }
    });

    // Optionally generate an initial password on load
    // generateButton.click();
});