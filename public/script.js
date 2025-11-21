document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');

  let conversationHistory = [];

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    addMessageToChatbox('user', userMessage);
    conversationHistory.push({ role: 'user', text: userMessage });
    userInput.value = '';

    const thinkingMessage = addMessageToChatbox('bot', 'Thinking...');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation: conversationHistory }),
      });

      if (!response.ok) throw new Error('Failed to get response from server.');

      const data = await response.json();
      
      thinkingMessage.remove();

      if (data.result) {
        addMessageToChatbox('bot', data.result);
        conversationHistory.push({ role: 'model', text: data.result });
      } else {
        addMessageToChatbox('bot', 'Sorry, no response received.');
      }
    } catch (error) {
      thinkingMessage.remove();
      addMessageToChatbox('bot', error.message || 'Failed to get response from server.');
    } finally {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  });

  function addMessageToChatbox(sender, message) {
    const messageElement = document.createElement('p');
    messageElement.classList.add('chat-message', `${sender}-message`);
    messageElement.textContent = message;

    let messageContainer = messageElement;

    if (sender === 'bot') {
      const botContainer = document.createElement('div');
      botContainer.classList.add('bot-message-container');
      botContainer.appendChild(messageElement);

      if (message !== 'Thinking...') {
        const copyButton = document.createElement('button');
        copyButton.classList.add('copy-btn');
        copyButton.textContent = 'Copy';
        copyButton.addEventListener('click', () => {
          navigator.clipboard.writeText(message).then(() => {
            copyButton.textContent = 'Copied!';
            setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);
          });
        });
        botContainer.appendChild(copyButton);
      }
      messageContainer = botContainer;
    }

    chatBox.appendChild(messageContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageContainer;
  }
});