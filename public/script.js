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
  const loginThemeToggle = document.getElementById('login-theme-toggle-btn');
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

    const profileIcon = document.querySelector('.profile-icon');
    profileIcon.innerHTML = ''; // Clear existing content

    // Check if avatar is an uploaded image (data URL) or Font Awesome icon
    if (user.avatar.startsWith('data:image/')) {
      // Create image element for uploaded avatar
      const img = document.createElement('img');
      img.src = user.avatar;
      img.alt = `${user.name}'s avatar`;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';
      profileIcon.appendChild(img);
    } else if (user.avatar.startsWith('fas ') || user.avatar.startsWith('far ') || user.avatar.startsWith('fab ')) {
      // Display Font Awesome icon
      const icon = document.createElement('i');
      icon.className = user.avatar;
      profileIcon.appendChild(icon);
    } else {
      // Fallback to emoji or text
      profileIcon.textContent = user.avatar;
    }

    document.querySelector('.welcome-screen h2').textContent = `Welcome to Gemini AI Chatbot, ${user.name}!`;
  }

  // Check if user is logged in
  const user = JSON.parse(sessionStorage.getItem('user'));
  if (!user) {
    loginScreen.style.display = 'flex';
    document.body.classList.add('modal-open');
    main.style.display = 'none';
  } else {
    updateUserDisplay(user);
    main.style.display = 'flex';
    loginScreen.style.display = 'none';
    document.body.classList.remove('modal-open');
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
    // Smooth transition: delay removing modal-open class for better UX
    setTimeout(() => {
      document.body.classList.remove('modal-open');
    }, 300);
    main.style.display = 'flex';
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    showConfirm('Are you sure you want to logout?', () => {
      sessionStorage.removeItem('user');
      document.body.classList.remove('modal-open'); // Ensure modal-open is removed
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

  // Theme - Using sessionStorage for session-persistent theme
  // Default to dark theme if no preference is saved
  const savedTheme = sessionStorage.getItem('theme');
  const isDark = savedTheme === null ? true : savedTheme === 'dark';

  // Background gradient preference - default to enabled
  const gradientEnabled = sessionStorage.getItem('gradientEnabled') !== 'false';

  if (isDark) {
    document.body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    loginThemeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    loginThemeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }

  // Apply gradient background if enabled
  if (gradientEnabled) {
    document.body.classList.add('gradient-bg');
  }

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    // Save theme preference to sessionStorage
    sessionStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  // Login theme toggle
  loginThemeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    loginThemeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    // Save theme preference to sessionStorage
    sessionStorage.setItem('theme', isDark ? 'dark' : 'light');
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
        const messageContainer = addMessageToChatbox(msg.sender, msg.text, msg.timestamp);
        
        // Mark edited messages
        if (msg.sender === 'user' && msg.edited) {
          if (messageContainer && messageContainer.querySelector) {
            const messageElement = messageContainer.querySelector('.chat-message');
            if (messageElement) {
              messageElement.dataset.edited = 'true';
              
              // Update timestamp to show edited indicator
              const timeElement = messageElement.querySelector('.message-time');
              if (timeElement) {
                const originalTime = msg.timestamp;
                const timeText = new Date(originalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                timeElement.textContent = timeText + ' • Edited';
              }
            }
          }
        }
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
    document.body.classList.add('modal-open');
    confirmYes.onclick = () => {
      onYes();
      confirmModal.style.display = 'none';
      // Smooth transition: delay removing modal-open class
      setTimeout(() => {
        document.body.classList.remove('modal-open');
      }, 300);
    };
    confirmNo.onclick = () => {
      confirmModal.style.display = 'none';
      // Smooth transition: delay removing modal-open class
      setTimeout(() => {
        document.body.classList.remove('modal-open');
      }, 300);
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
  // hide on initial load if no attachments and no saved files
  const hasSavedFiles = localStorage.getItem('attachedFilesData');
  if ((!attachedFiles || attachedFiles.length === 0) && !hasSavedFiles) {
    fileList.style.display = 'none';
  }

  function updateFileList() {
    fileList.innerHTML = '';
    if (attachedFiles.length === 0) {
      // hide the file-list container when empty
      fileList.style.display = 'none';
      return;
    } else {
      // ensure visible when files exist
      fileList.style.display = 'flex';

      // Create header section with close button
      const headerDiv = document.createElement('div');
      headerDiv.className = 'file-list-header';

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'close-file-list-btn';
      closeBtn.title = 'Close and clear all files';
      closeBtn.innerHTML = '<i class="fas fa-times"></i>';

      closeBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        attachedFiles = [];
        fileInput.value = '';
        updateFileList();
        localStorage.removeItem('attachedFilesData'); // Clear saved file data
        showToast('All file attachments cleared');
      });

      headerDiv.appendChild(closeBtn);

      // Create content section for files
      const contentDiv = document.createElement('div');
      contentDiv.className = 'file-list-content';
      
      // Add hover effect for close button
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.backgroundColor = 'rgba(220, 53, 69, 1)';
        closeBtn.style.transform = 'scale(1.1)';
      });
      
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.backgroundColor = 'rgba(220, 53, 69, 0.8)';
        closeBtn.style.transform = 'scale(1)';
      });
      
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
        wrapper.style.position = 'relative';
        wrapper.style.paddingRight = '32px'; // Space for close button
        if (thumbEl) wrapper.appendChild(thumbEl);
        wrapper.appendChild(info);
        wrapper.appendChild(controls);

        fileItem.appendChild(wrapper);
        contentDiv.appendChild(fileItem);

        // attach click handler to remove button
        removeBtn.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          const idx = parseInt(removeBtn.dataset.index, 10);
          if (!isNaN(idx)) {
            attachedFiles.splice(idx, 1);
            updateFileList();
            // Update saved file data
            if (attachedFiles.length > 0) {
              try {
                const filesData = [];
                for (const file of attachedFiles) {
                  const reader = new FileReader();
                  const dataPromise = new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                  });
                  const dataURL = await dataPromise;
                  const base64Data = dataURL.split(',')[1];

                  filesData.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    data: base64Data
                  });
                }
                localStorage.setItem('attachedFilesData', JSON.stringify(filesData));
              } catch (error) {
                console.error('Error updating file data:', error);
              }
            } else {
              localStorage.removeItem('attachedFilesData');
            }
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
      contentDiv.appendChild(addMoreWrap);

      addMoreBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        fileInput.click();
      });

      // Append both header and content to fileList
      fileList.appendChild(headerDiv);
      fileList.appendChild(contentDiv);
    }
  }

  // Load attached files from localStorage if available (after updateFileList is defined)
  const savedFilesData = localStorage.getItem('attachedFilesData');
  if (savedFilesData) {
    try {
      const filesData = JSON.parse(savedFilesData);
      if (filesData.length > 0) {
        // Recreate File objects from stored data
        const recreatedFiles = filesData.map(fileData => {
          // Convert base64 back to blob
          const byteCharacters = atob(fileData.data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: fileData.type });

          // Create File object
          return new File([blob], fileData.name, {
            type: fileData.type,
            lastModified: fileData.lastModified
          });
        });

        // Add recreated files to attachedFiles array
        attachedFiles = recreatedFiles;
        updateFileList();

        // Ensure file-list is visible after restoration
        const fileListElement = document.getElementById('file-list');
        if (fileListElement && recreatedFiles.length > 0) {
          fileListElement.style.display = 'flex';
        }

        showToast(`Restored ${recreatedFiles.length} previously selected file(s).`);
        // Keep the data in localStorage for future refreshes
      }
    } catch (e) {
      console.error('Error restoring files:', e);
      localStorage.removeItem('attachedFilesData'); // Clear corrupted data
    }
  }

  fileInput.addEventListener('change', async (e) => {
    const newFiles = Array.from(e.target.files);
    // Append new files, avoiding duplicates by name+size
    for (const f of newFiles) {
      const exists = attachedFiles.some(af => af.name === f.name && af.size === f.size && af.lastModified === f.lastModified);
      if (!exists) attachedFiles.push(f);
    }
    updateFileList();
    // clear input so same file can be reselected later
    fileInput.value = '';

    // Save file data to localStorage for persistence across refreshes
    if (attachedFiles.length > 0) {
      try {
        const filesData = [];
        for (const file of attachedFiles) {
          const reader = new FileReader();
          const dataPromise = new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          const dataURL = await dataPromise;
          // Extract base64 data (remove the data:mime;base64, prefix)
          const base64Data = dataURL.split(',')[1];

          filesData.push({
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            data: base64Data
          });
        }
        localStorage.setItem('attachedFilesData', JSON.stringify(filesData));
      } catch (error) {
        console.error('Error saving file data:', error);
      }
    } else {
      localStorage.removeItem('attachedFilesData');
    }
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
      localStorage.removeItem('attachedFilesData'); // Clear saved file data after submission
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
      
      // Check if this is an edited message by looking at the message data
      let timeText = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // If this is a user message and has been edited, add edited indicator
      if (sender === 'user' && messageElement.dataset && messageElement.dataset.edited === 'true') {
        timeText += ' • Edited';
      }
      
      timeElement.textContent = timeText;
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
        const userAvatar = user ? user.avatar : 'fas fa-user';
        
        if (userAvatar.startsWith('data:image/')) {
          // Create image element for uploaded avatar
          const img = document.createElement('img');
          img.src = userAvatar;
          img.alt = `${user.name}'s avatar`;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.borderRadius = '50%';
          img.style.objectFit = 'cover';
          avatar.appendChild(img);
        } else if (userAvatar.startsWith('fas ') || userAvatar.startsWith('far ') || userAvatar.startsWith('fab ')) {
          // Display Font Awesome icon
          const icon = document.createElement('i');
          icon.className = userAvatar;
          avatar.appendChild(icon);
        } else {
          // Fallback to emoji or text
          avatar.textContent = userAvatar;
        }
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

        // Add edit button for user messages only (not thinking messages)
        if (sender === 'user') {
          const editButton = document.createElement('button');
          editButton.classList.add('edit-btn');
          editButton.classList.add('edit-btn-left');
          const editIcon = document.createElement('i');
          editIcon.className = 'fas fa-edit';
          editButton.appendChild(editIcon);
          editButton.title = 'Edit Message';
          editButton.addEventListener('click', () => {
            // Get the raw message text from chat data instead of formatted DOM content
            const rawMessage = getRawMessageText(timestamp);
            startEditMessage(messageElement, rawMessage, timestamp, container);
          });
          messageElement.appendChild(editButton);
        }
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

  // Function to get raw message text from chat data
  function getRawMessageText(timestamp) {
    if (currentChatId && chats[currentChatId]) {
      const messageData = chats[currentChatId].messages.find(msg => msg.timestamp === timestamp);
      return messageData ? messageData.text : '';
    }
    return '';
  }

  // Function to start editing a message
  function startEditMessage(messageElement, originalMessage, messageTimestamp, messageContainer) {
    // Hide buttons during edit
    const copyBtn = messageElement.querySelector('.copy-btn');
    const editBtn = messageElement.querySelector('.edit-btn');
    if (copyBtn) copyBtn.style.display = 'none';
    if (editBtn) editBtn.style.display = 'none';

    // Create edit input
    const editInput = document.createElement('textarea');
    editInput.value = originalMessage;
    editInput.classList.add('message-edit-input');
    
    // Create edit buttons container
    const editButtons = document.createElement('div');
    editButtons.classList.add('edit-buttons');

    // Create save button
    const saveBtn = document.createElement('button');
    saveBtn.classList.add('edit-save-btn');
    saveBtn.innerHTML = '<i class="fas fa-check"></i> Save';
    
    // Create cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('edit-cancel-btn');
    cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';

    // Handle save
    saveBtn.addEventListener('click', () => {
      const newMessage = editInput.value.trim();
      if (newMessage && newMessage !== originalMessage) {
        // Update the message content
        messageElement.innerHTML = formatMessage(newMessage);
        
        // Mark message as edited in DOM
        messageElement.dataset.edited = 'true';
        
        // Update timestamp and add edited indicator
        const timeElement = document.createElement('span');
        timeElement.classList.add('message-time');
        timeElement.textContent = `${new Date(messageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Edited`;
        messageElement.appendChild(timeElement);

        // Restore buttons
        if (copyBtn) {
          copyBtn.style.display = 'inline-flex';
          messageElement.appendChild(copyBtn);
        }
        if (editBtn) {
          editBtn.style.display = 'inline-flex';
          messageElement.appendChild(editBtn);
        }

        // Update chat history
        updateChatHistory(messageTimestamp, newMessage);

        showToast('Message updated! Processing new response...');

        // Process the edited message for new AI response
        // Note: The chat will be cleared and reloaded, so edit UI cleanup is not needed
        processEditedMessage(newMessage, messageTimestamp);
      } else if (newMessage === originalMessage) {
        // No changes made, just cancel
        cancelEdit();
      }
    });

    // Handle cancel
    cancelBtn.addEventListener('click', () => {
      cancelEdit();
    });

    // Handle Enter key to save (with Ctrl/Cmd)
    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        saveBtn.click();
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
    });

    // Function to cancel edit
    function cancelEdit() {
      // Restore buttons
      if (copyBtn) {
        copyBtn.style.display = 'inline-flex';
        messageElement.appendChild(copyBtn);
      }
      if (editBtn) {
        editBtn.style.display = 'inline-flex';
        messageElement.appendChild(editBtn);
      }

      // Remove edit UI
      messageElement.removeChild(editInput);
      messageElement.removeChild(editButtons);
    }

    editButtons.appendChild(saveBtn);
    editButtons.appendChild(cancelBtn);

    // Add edit UI to message
    messageElement.appendChild(editInput);
    messageElement.appendChild(editButtons);

    // Focus and select the input
    editInput.focus();
    editInput.select();
  }

  // Function to update chat history when message is edited
  function updateChatHistory(messageTimestamp, newMessage) {
    if (currentChatId && chats[currentChatId]) {
      const messageIndex = chats[currentChatId].messages.findIndex(msg => msg.timestamp === messageTimestamp);
      if (messageIndex !== -1) {
        chats[currentChatId].messages[messageIndex].text = newMessage;
        chats[currentChatId].messages[messageIndex].edited = true;
        chats[currentChatId].messages[messageIndex].editTimestamp = Date.now();
        localStorage.setItem('chats', JSON.stringify(chats));
      }
    }
  }

  // Function to process edited message for new AI response
  async function processEditedMessage(editedMessage, messageTimestamp) {
    console.log('Processing edited message:', editedMessage, 'timestamp:', messageTimestamp);

    try {
      // Find the index of the edited message
      const editedIndex = chats[currentChatId].messages.findIndex(msg => msg.timestamp === messageTimestamp);
      console.log('Edited message index:', editedIndex);

      if (editedIndex === -1) {
        console.error('Edited message not found in chat data');
        return;
      }

      // Create a new conversation that includes all messages up to and including the edited message
      const newMessages = [];
      for (let i = 0; i <= editedIndex; i++) {
        newMessages.push(chats[currentChatId].messages[i]);
      }

      console.log('New messages for API:', newMessages);

      // Clear chat display and reload messages up to the edited message
      chatBox.innerHTML = '';
      newMessages.forEach(msg => {
        const messageContainer = addMessageToChatbox(msg.sender, msg.text, msg.timestamp);

        // Mark edited messages
        if (msg.sender === 'user' && msg.edited) {
          if (messageContainer && messageContainer.querySelector) {
            const messageElement = messageContainer.querySelector('.chat-message');
            if (messageElement) {
              messageElement.dataset.edited = 'true';

              // Update timestamp to show edited indicator
              const timeElement = messageElement.querySelector('.message-time');
              if (timeElement) {
                const originalTime = msg.timestamp;
                const timeText = new Date(originalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                timeElement.textContent = timeText + ' • Edited';
              }
            }
          }
        }
      });

      // Show thinking indicator
      const thinkingMessage = addMessageToChatbox('bot', '<i class="fas fa-brain thinking-icon"></i> Thinking<span class="dots"></span>');

      // Clear any attached files before sending
      attachedFiles = [];
      fileInput.value = '';
      updateFileList();
      localStorage.removeItem('attachedFilesData'); // Clear saved file data

      // Prepare form data for API request with the conversation up to the edited message
      const formData = new FormData();
      formData.append('conversation', JSON.stringify(newMessages));
      console.log('Sending conversation to API:', JSON.stringify(newMessages));

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      thinkingMessage.remove();

      if (data.result) {
        const msgTime = Date.now();
        addMessageToChatbox('bot', data.result, msgTime);
        // Update the messages array: replace everything after edited message with new bot response
        chats[currentChatId].messages = [...newMessages, { sender: 'bot', text: data.result, timestamp: msgTime }];
        chats[currentChatId].timestamp = msgTime;
        localStorage.setItem('chats', JSON.stringify(chats));
        showToast('New response generated for edited message!');
        console.log('Successfully processed edited message');
      } else {
        console.warn('No result in API response');
        addMessageToChatbox('bot', 'Sorry, no response received from the AI.');
      }

    } catch (error) {
      console.error('Error processing edited message:', error);
      addMessageToChatbox('bot', `Error processing edited message: ${error.message || 'Failed to get response from server.'}`);
      showToast('Failed to process edited message');
    }
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