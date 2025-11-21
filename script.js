document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');

  // A simple array to hold the conversation history for the API
  let conversationHistory = [];

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = userInput.value.trim();
    if (!userMessage) {
      return; // Don't send empty messages
    }

    // 1. Add user's message to the chat box
    addMessageToChatbox('user', userMessage);
    conversationHistory.push({ role: 'user', text: userMessage });

    // Clear the input field
    userInput.value = '';

    // 2. Show a temporary "Thinking..." message
    const thinkingMessageElement = addMessageToChatbox('bot', 'Thinking...');

    try {
      // 3. Send the user's message to the backend API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // The backend expects a `conversation` array with `text` properties
        body: JSON.stringify({ conversation: conversationHistory }),
      });

      if (!response.ok) {
        // Handle HTTP errors like 500, 404 etc.
        throw new Error('Failed to get response from server.');
      }

      const data = await response.json();

      // 4. Replace "Thinking..." with the AI's reply
      if (data.result) {
        thinkingMessageElement.textContent = data.result;
        // Add the bot's response to the history for context in future messages
        conversationHistory.push({ role: 'model', text: data.result });
      } else {
        // Handle cases where the response is successful but has no result
        thinkingMessageElement.textContent = 'Sorry, no response received.';
      }
    } catch (error) {
      // 5. Handle network errors or other exceptions
      console.error('Chat API Error:', error);
      thinkingMessageElement.textContent = error.message || 'Failed to get response from server.';
    } finally {
        // Scroll to the bottom of the chat box
        chatBox.scrollTop = chatBox.scrollHeight;
    }
  });

  /**
   * Adds a message to the chat box UI.
   * @param {'user' | 'bot'} sender - The sender of the message.
   * @param {string} message - The message content.
   * @returns {HTMLParagraphElement} The created message element.
   */
  function addMessageToChatbox(sender, message) {
    const messageElement = document.createElement('p');
    messageElement.classList.add('chat-message', `${sender}-message`);
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    // Scroll to the bottom of the chat box
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageElement;
  }
});