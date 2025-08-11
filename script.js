/*
  Diese Datei ist identisch mit der Skriptdatei der gelben Variante und
  behandelt die Eingabe des API‑Schlüssels sowie das Versenden von Prompts.
*/

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('apiKeyModal');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  // Lese den API‑Key aus dem lokalen Speicher. Dieser Wert wird sowohl
  // vom Eingabe‑Bar am Seitenende als auch vom Modaldialog verwendet.
  let apiKey = localStorage.getItem('openai_api_key');

  function showApiKeyModal() {
    modal.style.display = 'block';
  }
  function hideApiKeyModal() {
    modal.style.display = 'none';
  }
  // Zeige das Modal nicht automatisch, wenn kein Schlüssel vorhanden ist.
  // Stattdessen kann der Nutzer den Schlüssel im unteren Eingabebereich
  // eintragen. Das Modal bleibt über Ctrl+K erreichbar.
  saveApiKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem('openai_api_key', key);
      apiKey = key;
      hideApiKeyModal();
      // Synchronisiere auch das Passwortfeld im API‑Key‑Bar
      const barInput = document.getElementById('apiKeyBarInput');
      if (barInput) barInput.value = key;
    }
  });

  const promptInput = document.getElementById('prompt');
  const resultModal = document.getElementById('resultModal');
  const resultContent = document.getElementById('resultContent');

  function warnIfFileProtocol() {
    if (window.location.protocol === 'file:') {
      showResult(
        'Diese Anwendung funktioniert nicht, wenn sie direkt über eine lokale Datei (file://) geöffnet wird. Bitte starte einen lokalen Webserver (z.\u00a0B. mit "python -m http.server" im Projektordner) und öffne die Seite über http://localhost:PORT.'
      );
      return true;
    }
    return false;
  }

  function showResult(content) {
    resultContent.innerHTML = '';
    if (typeof content === 'string') {
      const p = document.createElement('p');
      p.textContent = content;
      resultContent.appendChild(p);
    } else if (content instanceof HTMLElement) {
      resultContent.appendChild(content);
    }
    resultModal.style.display = 'flex';
  }
  function hideResult() {
    resultModal.style.display = 'none';
  }

  async function sendPrompt() {
    const prompt = promptInput.value.trim();
    if (!prompt) return;
    promptInput.value = '';
    if (!apiKey) {
      showResult('Kein API‑Schlüssel gefunden. Bitte gib deinen Schlüssel unten ein.');
      return;
    }
    if (warnIfFileProtocol()) return;
    const payload = {
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
      response_format: 'url'
    };
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        let errorMsg = `HTTP error ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error && errorData.error.message) {
            errorMsg = `${errorMsg}: ${errorData.error.message}`;
          }
        } catch (e) {
          /* ignore JSON parse errors */
        }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      const imageUrl = data.data && data.data[0] && data.data[0].url;
      if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = prompt;
        showResult(img);
      } else {
        showResult('Es wurde kein Bild zurückgegeben.');
      }
    } catch (error) {
      console.error(error);
      if (error.message && error.message.toLowerCase().includes('failed to fetch')) {
        showResult('Fehler: Die Anfrage konnte nicht gesendet werden. Dies kann an der CORS‑Policy liegen. Starte die Seite über einen lokalen Webserver oder überprüfe deine Internetverbindung.');
      } else {
        showResult(`Fehler bei der Kommunikation mit der API: ${error.message}`);
      }
    }
  }

  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  });
  resultModal.addEventListener('click', (event) => {
    if (event.target === resultModal) {
      hideResult();
    }
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideResult();
      hideApiKeyModal();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      showApiKeyModal();
    }
  });

  // Eingabefeld aktivieren, damit der Benutzer direkt loslegen kann.
  promptInput.focus();

  // *** API‑Key‑Bar Funktionslogik ***
  const bar = document.getElementById('apiKeyBar');
  const barInput = document.getElementById('apiKeyBarInput');
  const barSaveBtn = document.getElementById('saveApiKeyBar');
  // Bei bestehendem Schlüssel im Speicher fülle das Passwortfeld vor
  // und verstecke den unteren Eingabebereich, da kein weiterer Schlüssel
  // nötig ist. Der API‑Key kann weiterhin über Ctrl+K geändert werden.
  if (apiKey && barInput) {
    barInput.value = apiKey;
    if (bar) {
      bar.style.display = 'none';
    }
  }
  function saveKeyFromBar() {
    const key = barInput.value.trim();
    if (key) {
      localStorage.setItem('openai_api_key', key);
      apiKey = key;
      // Synchronisiere auch das Modal‑Feld
      const modalInput = document.getElementById('apiKeyInput');
      if (modalInput) modalInput.value = key;
      // Blende den API‑Key‑Bar aus, nachdem der Schlüssel gespeichert wurde
      if (bar) {
        bar.style.display = 'none';
      }
    }
  }
  if (barSaveBtn) {
    barSaveBtn.addEventListener('click', () => {
      saveKeyFromBar();
    });
  }
  if (barInput) {
    barInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveKeyFromBar();
      }
    });
  }
});