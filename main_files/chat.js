/**
 * SafeShelter AI Emergency Assistant
 * Provides real-time answers to questions about emergency procedures,
 * evacuation protocols, and safety information.
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const chatPanel = document.getElementById('chat-panel');
    const chatCloseBtn = document.getElementById('chat-close-btn');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMessages = document.getElementById('chat-messages');
    
    // Chat state
    let isWaitingForResponse = false;
    
    // Emergency information knowledge base (for offline/fallback use)
    const emergencyInfo = {
        "tilfluktsrom": "Tilfluktsrom er beskyttelsesrom som er bygget for å beskytte befolkningen i krisesituasjoner. Du kan finne nærmeste tilfluktsrom ved å bruke 'Finn nærmeste tilfluktsrom' funksjonen på kartet.",
        "brannstasjon": "Brannstasjoner i Norge er bemannet 24/7 og kan nås ved å ringe 110 i nødstilfeller. Du kan finne nærmeste brannstasjon med 'Finn nærmeste brannstasjon' knappen.",
        "evakuering": "Ved evakuering, ta med nødvendige medisiner, ID, varme klær og følg instruksjoner fra myndighetene. Hold deg oppdatert via radio eller andre offisielle kanaler.",
        "flom": "Ved flom eller flomvarsel bør du flytte verdisaker til høyereliggende områder (ID, viktige dokumenter), dersom du er i fare, kom deg så langt unna flom-faren som mulig. Det er alltid lurt å ha beredskapssekk klar, og følge med på værvarsel. Ikke kjør eller gå gjennom oversvømte veier! Kontakt alltid nødetatene ved fare og vent på hjelp.",
        "strømbrudd": "Ved strømbrudd, konserver varme, bruk lommelykt istedenfor stearinlys når mulig, slå av elektriske apparater, og ha nødsett med mat, vann og varme klær tilgjengelig.",
        "nødnumre": "Ambulanse: 113, Brann: 110, Politi: 112, Legevakt: 116117",
        "førstehjelpstips": "Sikre skadestedet, sjekk bevissthet og pust, start HLR hvis nødvendig, stopp blødninger med direkte trykk, hold personen varm og ring 113 for hjelp."
    };
    
    // Event Listeners
    chatToggleBtn.addEventListener('click', toggleChat);
    chatCloseBtn.addEventListener('click', toggleChat);
    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Toggle chat panel visibility
    function toggleChat() {
        chatPanel.classList.toggle('hidden');
        
        if (!chatPanel.classList.contains('hidden')) {
            chatInput.focus();
        }
    }
    
    // Send user message to bot
    function sendMessage() {
        const message = chatInput.value.trim();
        
        if (message === '' || isWaitingForResponse) return;
        
        // Add user message to chat
        addMessageToChat(message, 'user');
        
        // Clear input
        chatInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Set waiting state
        isWaitingForResponse = true;
        
        // Get AI response
        getAIResponse(message)
            .then(response => {
                // Hide typing indicator
                hideTypingIndicator();
                
                // Add bot response to chat
                addMessageToChat(response, 'bot');
                
                // Reset waiting state
                isWaitingForResponse = false;
                
                // Scroll to bottom of chat
                scrollToBottom();
            })
            .catch(error => {
                console.error('Error getting AI response:', error);
                
                // Hide typing indicator
                hideTypingIndicator();
                
                // Add error message
                addMessageToChat("Beklager, jeg kunne ikke behandle forespørselen din akkurat nå. Prøv igjen senere eller kontakt nødetatene direkte ved akutt behov.", 'bot');
                
                // Reset waiting state
                isWaitingForResponse = false;
            });
    }
    
    // Add a message to the chat window
    function addMessageToChat(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        const currentTime = new Date();
        const timeString = currentTime.getHours().toString().padStart(2, '0') + ':' + 
                        currentTime.getMinutes().toString().padStart(2, '0');
        
        // Format the message content if it's from the bot
        let formattedMessage = message;
        if (sender === 'bot') {
            formattedMessage = formatBotMessage(message);
        }
        
        if (sender === 'bot') {
            messageElement.innerHTML = `
                <div class="bot-icon"><i class="fas fa-robot"></i></div>
                <div class="message-content">
                    ${formattedMessage}
                    <div class="message-time">${timeString}</div>
                </div>
            `;
        } else {
            messageElement.innerHTML = `
                <div class="message-content">
                    ${formattedMessage}
                    <div class="message-time">${timeString}</div>
                </div>
            `;
        }
        
        chatMessages.appendChild(messageElement);
        
        // Scroll to the new message
        scrollToBottom();
    }

    // Format bot messages for better readability
    function formatBotMessage(message) {
        // Remove LaTeX-style box formatting
        message = message.replace(/\\boxed\{([\s\S]*?)\}/g, '$1');
        
        // Convert hashtag headers to proper HTML headings
        message = message.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
        message = message.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
        message = message.replace(/^#\s+(.+)$/gm, '<h2>$1</h2>');
        
        // Convert bullet points and lists to simple paragraphs instead of lists
        message = message.replace(/^\s*[\*\-]\s+(.+)$/gm, '<p>$1</p>');
        message = message.replace(/^\s*(\d+)[\.)]\s+(.+)$/gm, '<p>$2</p>');
        
        // Remove any existing list tags
        message = message.replace(/<\/?[uo]l>/g, '');
        message = message.replace(/<\/?li>/g, '<p>');
        
        // Convert paragraphs (double line breaks)
        message = message.replace(/\n\n/g, '</p><p>');
        
        // Handle single line breaks
        message = message.replace(/\n/g, '</p><p>');
        
        // Bold text
        message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        message = message.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Wrap in paragraph if not already wrapped in HTML
        if (!message.startsWith('<')) {
            message = `<p>${message}</p>`;
        }
        
        return message;
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot-message typing-indicator-container';
        typingIndicator.id = 'typing-indicator';
        
        typingIndicator.innerHTML = `
            <div class="bot-icon"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingIndicator);
        
        // Scroll to the typing indicator
        scrollToBottom();
    }
    
    // Hide typing indicator
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Scroll chat to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Get AI response to user message
    async function getAIResponse(userMessage) {
        // First check local knowledge base for quick responses
        const lowerCaseMessage = userMessage.toLowerCase();
        
        for (const [keyword, response] of Object.entries(emergencyInfo)) {
            if (lowerCaseMessage.includes(keyword)) {
                // Artificial delay to seem more natural
                await new Promise(resolve => setTimeout(resolve, 1000));
                return response;
            }
        }
        
        try {
            // Connect to our proxy endpoint instead of directly to OpenRouter
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMessage
                })
            });
            
            const data = await response.json();
            
            // Log the response for debugging
            console.log('API Response:', data);
            
            // Check if response contains error
            if (data.error) {
                console.error('API Error:', data.error);
                throw new Error(data.error.message || 'Error from OpenRouter API');
            }
            
            // Check if response has expected format
            if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
                console.error('Unexpected API response format:', data);
                throw new Error('Invalid response format from API');
            }
            
            // Extract the response content from the API result
            const message = data.choices[0].message;
            let responseContent = message.content;
            
            // If content is empty but reasoning exists, use reasoning instead
            if ((!responseContent || responseContent.trim() === '') && message.reasoning) {
                responseContent = message.reasoning;
                console.log('Using reasoning field instead of content:', responseContent);
            }

            // Before returning responseContent, add this line:
            responseContent = responseContent.replace(/\\[a-zA-Z]+(\{|\[|\()/g, '')
            .replace(/```/g, '')
            .replace(/`/g, '');
            
            return responseContent.trim();
            
        } catch (error) {
            console.error('Error calling DeepSeek API via OpenRouter:', error);
            
            // Fallback to simple response based on keywords
            if (lowerCaseMessage.includes('hjelp') || lowerCaseMessage.includes('nød')) {
                return "I en nødsituasjon, ring følgende nødnumre:\n\n• Ambulanse: 113\n• Brann: 110\n• Politi: 112\n\nHold deg rolig og gi tydelig informasjon om situasjonen. Oppgi nøyaktig adresse og beskriv hendelsen kort og presist.";
            } else if (lowerCaseMessage.includes('evakuer')) {
                return "Ved evakuering:\n\n1. Ta med nødvendige medisiner og ID-dokumenter\n2. Ta på deg varme klær og gode sko\n3. Følg instruksjoner fra myndighetene\n4. Hold deg oppdatert via radio, TV eller offisielle nettsider\n5. Registrer deg ved evakueringspunktet så myndighetene vet at du er trygg";
            } else {
                return "Beklager, jeg kunne ikke behandle forespørselen din akkurat nå. For nødstilfeller, kontakt nødnumrene:\n\n• Ambulanse: 113\n• Brann: 110\n• Politi: 112";
            }
        }
    }
});