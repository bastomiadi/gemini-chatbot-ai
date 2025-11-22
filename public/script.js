document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const newChatBtn = document.getElementById('new-chat-btn');
  const clearChatBtn = document.getElementById('clear-chat-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const themeToggle = document.getElementById('theme-toggle-btn');
  const addFileBtn = document.getElementById('add-file-btn');
  const fileInput = document.getElementById('file-input');
  const historyList = document.getElementById('history-list');
  const confirmModal = document.getElementById('confirm-modal');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmYes = document.getElementById('confirm-yes');
  const confirmNo = document.getElementById('confirm-no');
  const toast = document.getElementById('toast');
  const loginScreen = document.getElementById('login-screen');
  const loginForm = document.getElementById('login-form');
  const userNameInput = document.getElementById('user-name-input');
  const avatarSelect = document.getElementById('avatar-select');
  const avatarUpload = document.getElementById('avatar-upload');
  const welcomeScreen = document.getElementById('welcome-screen');
  const main = document.querySelector('.main');
  toast.style.display = 'none'; // Ensure hidden on load

  let chats = JSON.parse(localStorage.getItem('chats')) || {};
  let currentChatId = localStorage.getItem('currentChatId') || null;
  let attachedFiles = [];
  let startTime = parseInt(localStorage.getItem('startTime')) || Date.now();
  localStorage.setItem('startTime', startTime);

  // Function to update user display
  function updateUserDisplay(user) {
    document.getElementById('user-name').textContent = user.name;
    document.querySelector('.profile-icon').textContent = user.avatar;
    document.querySelector('.welcome-screen h2').textContent = `Welcome to Gemini AI Chatbot, ${user.name}!`;
  }

  // Check if user is logged in
  const user = JSON.parse(sessionStorage.getItem('user'));
  if (!user) {
    loginScreen.style.display = 'flex';
    main.style.display = 'none';
  } else {
    updateUserDisplay(user);
    main.style.display = 'flex';
    loginScreen.style.display = 'none';
  }

  // (readFileContent defined later with support for text/image/video/audio/other)

  // Login form
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = userNameInput.value.trim();
    if (!name) return;

    let avatar = avatarSelect.value;
    if (avatarUpload.files[0]) {
      avatar = await readFileContent(avatarUpload.files[0]);
    }

    const userData = { name, avatar };
    sessionStorage.setItem('user', JSON.stringify(userData));
    updateUserDisplay(userData);
    loginScreen.style.display = 'none';
    main.style.display = 'flex';
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    showConfirm('Are you sure you want to logout?', () => {
      sessionStorage.removeItem('user');
      location.reload();
    });
  });

  // Function to format relative time like WhatsApp
  function formatRelativeTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
      // Today: show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.getTime() === yesterday.getTime()) {
      // Yesterday
      return 'Yesterday';
    } else if (now.getTime() - messageDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
      // This week: show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older: show date
      return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  }

  // Theme
  const isDark = localStorage.getItem('theme') === 'dark';
  if (isDark) {
    document.body.classList.add('dark-mode');
    themeToggle.checked = true;
  }

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
  });

  // Load history
  function loadHistory() {
    historyList.innerHTML = '';
    const chatKeys = Object.keys(chats).sort((a,b) => chats[b].timestamp - chats[a].timestamp);
    if (chatKeys.length === 0) {
      const li = document.createElement('li');
      li.classList.add('history-item', 'no-chats');
      li.textContent = 'No chats yet. Start a new conversation!';
      historyList.appendChild(li);
    } else {
      chatKeys.forEach(id => {
        const li = document.createElement('li');
        li.classList.add('history-item');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('history-checkbox');
        checkbox.dataset.id = id;
        checkbox.addEventListener('click', (e) => e.stopPropagation());

        const content = document.createElement('div');
        content.classList.add('history-content');
        content.textContent = chats[id].title || `Chat ${id}`;
        const timestamp = document.createElement('div');
        timestamp.classList.add('history-timestamp');
        timestamp.textContent = formatRelativeTime(chats[id].timestamp);
        content.appendChild(timestamp);

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('control-btn');
        deleteBtn.title = 'Delete';
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'fas fa-trash';
        deleteBtn.appendChild(deleteIcon);
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (Object.keys(chats).length > 1) {
            showConfirm('WARNING: Are you sure you want to delete this chat? This action is irreversible!', () => {
              delete chats[id];
              if (currentChatId === id) {
                currentChatId = Object.keys(chats)[0];
                loadChat(currentChatId);
              }
              localStorage.setItem('chats', JSON.stringify(chats));
              loadHistory();
              showToast('Chat deleted successfully!');
            });
          } else {
            showConfirm('WARNING: Are you sure you want to delete this chat? This action is irreversible!', () => {
              chats[id].messages = [];
              chats[id].title = 'New Chat';
              chats[id].timestamp = Date.now();
              loadChat(id);
              localStorage.setItem('chats', JSON.stringify(chats));
              loadHistory();
              showToast('Chat cleared successfully!');
            });
          }
        });

        const duplicateBtn = document.createElement('button');
        duplicateBtn.classList.add('control-btn');
        duplicateBtn.title = 'Duplicate';
        const duplicateIcon = document.createElement('i');
        duplicateIcon.className = 'fas fa-clone';
        duplicateBtn.appendChild(duplicateIcon);
        duplicateBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          showConfirm('Are you sure you want to duplicate this chat?', () => {
            const newId = Date.now().toString();
            chats[newId] = { ...chats[id], title: chats[id].title + ' (Copy)', timestamp: Date.now() };
            localStorage.setItem('chats', JSON.stringify(chats));
            loadHistory();
            showToast('Chat duplicated successfully!');
          });
        });

        li.appendChild(checkbox);
        li.appendChild(content);
        li.appendChild(duplicateBtn);
        li.appendChild(deleteBtn);
        if (id === currentChatId) {
          li.classList.add('active');
        }
        li.addEventListener('click', () => loadChat(id));
        historyList.appendChild(li);
      });
    }
  }

  // Load chat
  function loadChat(id) {
    currentChatId = id;
    localStorage.setItem('currentChatId', id);
    const welcome = document.getElementById('welcome-screen');
    chatBox.innerHTML = '';
    if (!id || (chats[id] && chats[id].messages.length === 0)) {
      welcome.style.display = 'flex';
    } else {
      welcome.style.display = 'none';
      chats[id].messages.forEach(msg => {
        addMessageToChatbox(msg.sender, msg.text, msg.timestamp);
      });
    }
    loadHistory(); // Update active highlight
  }

  // New chat
  newChatBtn.addEventListener('click', () => {
    const id = Date.now().toString();
    chats[id] = { title: 'New Chat', messages: [], timestamp: Date.now() };
    currentChatId = id;
    localStorage.setItem('currentChatId', id);
    localStorage.setItem('chats', JSON.stringify(chats));
    chatBox.innerHTML = '';
    loadHistory();
  });

  // Show confirm modal
  function showConfirm(message, onYes) {
    confirmMessage.textContent = message;
    confirmModal.style.display = 'flex';
    confirmYes.onclick = () => {
      onYes();
      confirmModal.style.display = 'none';
    };
    confirmNo.onclick = () => {
      confirmModal.style.display = 'none';
    };
  }

  // Show toast
  function showToast(message) {
    document.getElementById('toast-message').textContent = message;
    toast.style.display = 'flex';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }

  // Clear chat
  clearChatBtn.addEventListener('click', () => {
    if (currentChatId && chats[currentChatId]) {
      showConfirm('WARNING: Are you sure you want to clear this chat? All messages will be lost!', () => {
        chats[currentChatId].messages = [];
        chatBox.innerHTML = '';
        document.getElementById('welcome-screen').style.display = 'flex';
        localStorage.setItem('chats', JSON.stringify(chats));
        showToast('Chat cleared successfully!');
      });
    }
  });

  // Add file
  addFileBtn.addEventListener('click', () => {
    fileInput.click();
  });

  const fileList = document.getElementById('file-list');
  // hide on initial load if no attachments
  if (!attachedFiles || attachedFiles.length === 0) fileList.style.display = 'none';

  function updateFileList() {
    fileList.innerHTML = '';
    if (attachedFiles.length === 0) {
      // hide the file-list container when empty
      fileList.style.display = 'none';
      return;
    } else {
      // ensure visible when files exist
      fileList.style.display = 'flex';
      attachedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');

        // create thumbnail for images
        let thumbEl = null;
        if (file.type.startsWith('image/')) {
          thumbEl = document.createElement('img');
          thumbEl.src = URL.createObjectURL(file);
          thumbEl.alt = file.name;
          thumbEl.style.maxWidth = '48px';
          thumbEl.style.maxHeight = '48px';
          thumbEl.style.marginRight = '8px';
          thumbEl.style.borderRadius = '6px';
          thumbEl.style.objectFit = 'cover';
        }

        const info = document.createElement('div');
        info.style.flex = '1';
        info.style.overflow = 'hidden';
        info.style.textOverflow = 'ellipsis';
        info.style.whiteSpace = 'nowrap';
        const title = document.createElement('div');
        title.style.fontWeight = '600';
        title.textContent = file.name;
        const size = document.createElement('div');
        size.style.fontSize = '0.8rem';
        size.style.color = '#666';
        size.textContent = `${(file.size / 1024).toFixed(1)} KB`;
        info.appendChild(title);
        info.appendChild(size);

        const controls = document.createElement('div');
        controls.style.marginLeft = '8px';
        controls.style.display = 'flex';
        controls.style.gap = '6px';
        controls.style.alignItems = 'center';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-file-btn';
        removeBtn.dataset.index = index;
        removeBtn.title = 'Remove';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        controls.appendChild(removeBtn);

        // assemble file item
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '8px';
        wrapper.style.width = '100%';
        if (thumbEl) wrapper.appendChild(thumbEl);
        wrapper.appendChild(info);
        wrapper.appendChild(controls);

        fileItem.appendChild(wrapper);
        fileList.appendChild(fileItem);

        // attach click handler to remove button
        removeBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const idx = parseInt(removeBtn.dataset.index, 10);
          if (!isNaN(idx)) {
            attachedFiles.splice(idx, 1);
            updateFileList();
          }
        });
      });

  // Add 'Add more' control at the end
      const addMoreWrap = document.createElement('div');
      addMoreWrap.style.marginTop = '8px';
      const addMoreBtn = document.createElement('button');
      addMoreBtn.type = 'button';
      addMoreBtn.id = 'add-more-files';
      addMoreBtn.className = 'add-file-btn';
      addMoreBtn.style.padding = '6px 10px';
      addMoreBtn.style.fontSize = '0.9rem';
      addMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Add more';
      addMoreWrap.appendChild(addMoreBtn);
      fileList.appendChild(addMoreWrap);

      addMoreBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        fileInput.click();
      });
    }
  }

  fileInput.addEventListener('change', (e) => {
    const newFiles = Array.from(e.target.files);
    // Append new files, avoiding duplicates by name+size
    newFiles.forEach(f => {
      const exists = attachedFiles.some(af => af.name === f.name && af.size === f.size && af.lastModified === f.lastModified);
      if (!exists) attachedFiles.push(f);
    });
    updateFileList();
    // clear input so same file can be reselected later
    fileInput.value = '';
  });

  fileList.addEventListener('click', (e) => {
    if (e.target.closest('.remove-file-btn')) {
      const index = parseInt(e.target.closest('.remove-file-btn').dataset.index, 10);
      if (!isNaN(index)) {
        attachedFiles.splice(index, 1);
        updateFileList();
      }
    }
    if (e.target.closest('#add-more-files')) {
      fileInput.click();
    }
  });

  // Function to read file content
  function readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      if (file.type.startsWith('text/')) {
        reader.readAsText(file);
      } else if (file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        reader.readAsDataURL(file);
      } else {
        resolve(`[File: ${file.name}, type: ${file.type}]`);
      }
    });
  }

  // Submit
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = userInput.value.trim();
    if (!userMessage && attachedFiles.length === 0) return;

    if (!currentChatId) {
      newChatBtn.click(); // Create new if none
    }

    let fullMessage = userMessage;

    // Handle files if any
    if (attachedFiles.length > 0) {
      const fileContents = await Promise.all(attachedFiles.map(readFileContent));
      const fileTexts = attachedFiles.map((file, i) => `\n--- File: ${file.name} ---\n${fileContents[i]}`);
      fullMessage += fileTexts.join('\n');
    }

    const msgTime = Date.now();
    addMessageToChatbox('user', fullMessage, msgTime);
    chats[currentChatId].messages.push({ sender: 'user', text: fullMessage, timestamp: msgTime });
    chats[currentChatId].timestamp = msgTime; // Update last activity
    document.getElementById('welcome-screen').style.display = 'none';
    userInput.value = '';

    const thinkingMessage = addMessageToChatbox('bot', '<i class="fas fa-brain thinking-icon"></i> Thinking<span class="dots"></span>');

    try {
      const formData = new FormData();
      formData.append('conversation', JSON.stringify(chats[currentChatId].messages));
      attachedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to get response from server.');

      const data = await response.json();

      thinkingMessage.remove();

      if (data.result) {
        const msgTime = Date.now();
        addMessageToChatbox('bot', data.result, msgTime);
        chats[currentChatId].messages.push({ sender: 'bot', text: data.result, timestamp: msgTime });
        chats[currentChatId].timestamp = msgTime; // Update last activity
        // Update title if first message
        if (chats[currentChatId].messages.length === 2) {
          chats[currentChatId].title = userMessage.slice(0, 20) + '...';
          loadHistory();
        }
      } else {
        addMessageToChatbox('bot', 'Sorry, no response received.');
      }
    } catch (error) {
      thinkingMessage.remove();
      addMessageToChatbox('bot', error.message || 'Failed to get response from server.');
    } finally {
      attachedFiles = [];
      fileInput.value = '';
      updateFileList();
      chatBox.scrollTop = chatBox.scrollHeight;
      localStorage.setItem('chats', JSON.stringify(chats));
    }
  });

  function getFileIcon(filename) {
    if (filename.match(/\.(pdf)$/i)) return 'fas fa-file-pdf';
    if (filename.match(/\.(doc|docx)$/i)) return 'fas fa-file-word';
    if (filename.match(/\.(xls|xlsx)$/i)) return 'fas fa-file-excel';
    if (filename.match(/\.(ppt|pptx)$/i)) return 'fas fa-file-powerpoint';
    if (filename.match(/\.(txt)$/i)) return 'fas fa-file-alt';
    if (filename.match(/\.(zip|rar|7z)$/i)) return 'fas fa-file-archive';
    if (filename.match(/\.(mp3|wav|ogg)$/i)) return 'fas fa-file-audio';
    if (filename.match(/\.(mp4|avi|mov)$/i)) return 'fas fa-file-video';
    return 'fas fa-file';
  }

  function formatMessage(text) {
    // Handle file attachments
    text = text.replace(/\n--- File: ([^\n]+) ---\n([\s\S]*?)(?=\n--- File:|$)/g, (match, filename, content) => {
      if (filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
        return `<div class="attachment image"><img src="${content.trim()}" alt="${filename}" style="max-width: 100%; max-height: 200px; border-radius: 8px;"></div>`;
      } else if (filename.match(/\.(mp3|wav|ogg)$/i)) {
        return `<div class="attachment audio"><i class="${getFileIcon(filename)}"></i> <span>${filename}</span><br><audio controls src="${content.trim()}" style="max-width: 200px;"></audio></div>`;
      } else if (filename.match(/\.(mp4|avi|mov)$/i)) {
        return `<div class="attachment video"><i class="${getFileIcon(filename)}"></i> <span>${filename}</span><br><video controls src="${content.trim()}" style="max-width: 200px;"></video></div>`;
      } else {
        return `<div class="attachment document"><i class="${getFileIcon(filename)}"></i> <span>${filename}</span></div>`;
      }
    });

    // Simple markdown to HTML
    let html = text
      .replace(/^### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^## (.*$)/gim, '<h3>$1</h3>')
      .replace(/^# (.*$)/gim, '<h2>$1</h2>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`(.*)`/gim, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    if (!html.startsWith('<')) html = '<p>' + html + '</p>';
    return html;
  }

  function addMessageToChatbox(sender, message, timestamp) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', `${sender}-message`);
    if (message.includes('Thinking')) {
      messageElement.classList.add('thinking-message');
    }
    messageElement.innerHTML = formatMessage(message);

    if (timestamp) {
      const timeElement = document.createElement('span');
      timeElement.classList.add('message-time');
      timeElement.textContent = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      messageElement.appendChild(timeElement);
    }

    let messageContainer = messageElement;

    if (sender === 'bot' || sender === 'user') {
      const container = document.createElement('div');
      container.classList.add(`${sender}-message-container`);

      const avatar = document.createElement('div');
      avatar.classList.add(`${sender}-avatar`);
      if (sender === 'user') {
        const user = JSON.parse(sessionStorage.getItem('user'));
        avatar.textContent = user ? user.avatar : '👤';
      } else {
        const icon = document.createElement('i');
        icon.className = 'fas fa-robot';
        avatar.appendChild(icon);
      }

      const messageWrapper = document.createElement('div');
      messageWrapper.classList.add('message-wrapper');
      messageWrapper.appendChild(messageElement);

      if (sender === 'user') {
        container.appendChild(messageWrapper);
        container.appendChild(avatar);
      } else {
        container.appendChild(avatar);
        container.appendChild(messageWrapper);
      }

      if (message !== 'Thinking...') {
        const copyButton = document.createElement('button');
        copyButton.classList.add('copy-btn');
        if (sender === 'user') {
          copyButton.classList.add('copy-btn-left');
        }
        const copyIcon = document.createElement('i');
        copyIcon.className = 'fas fa-copy';
        copyButton.appendChild(copyIcon);
        copyButton.title = 'Copy';
        copyButton.addEventListener('click', () => {
          navigator.clipboard.writeText(message);
        });
        messageElement.appendChild(copyButton);
      }
      messageContainer = container;
    }

    chatBox.appendChild(messageContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageContainer;
  }

  function updateOnlineTime() {
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    document.getElementById('online-time').textContent = `${minutes} min`;
  }

  setInterval(updateOnlineTime, 60000); // Update every minute
  updateOnlineTime(); // Initial

  // History controls
  const selectAllBtn = document.getElementById('select-all-btn');
  const deleteSelectedBtn = document.getElementById('delete-selected-btn');
  const clearAllBtn = document.getElementById('clear-all-btn');

  selectAllBtn.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.history-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
  });

  deleteSelectedBtn.addEventListener('click', () => {
    const selected = Array.from(document.querySelectorAll('.history-checkbox:checked')).map(cb => cb.dataset.id);
    if (selected.length === 0) {
      showToast('No chats selected!');
      return;
    }
    showConfirm(`Are you sure you want to delete ${selected.length} selected chats?`, () => {
      selected.forEach(id => delete chats[id]);
      if (selected.includes(currentChatId)) {
        currentChatId = Object.keys(chats)[0] || null;
      }
      localStorage.setItem('chats', JSON.stringify(chats));
      loadHistory();
      if (currentChatId) {
        loadChat(currentChatId);
      } else {
        loadChat(null);
      }
      showToast(`${selected.length} chats deleted!`);
    });
  });

  clearAllBtn.addEventListener('click', () => {
    showConfirm('Are you sure you want to clear all chat history?', () => {
      chats = {};
      currentChatId = null;
      localStorage.setItem('chats', JSON.stringify(chats));
      loadHistory();
      loadChat(null);
      showToast('All chat history cleared!');
    });
  });

  // Initial load
  loadHistory();
  if (currentChatId && chats[currentChatId]) {
    loadChat(currentChatId);
  } else if (Object.keys(chats).length > 0) {
    currentChatId = Object.keys(chats)[0];
    loadChat(currentChatId);
  } else {
    loadChat(null);
  }
});