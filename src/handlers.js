// =======================================
// Command: !alert <text>
// Description: will display whatever text comes after the !alert command
// =======================================
actionHandlers['!alert'] = {
    security: (context, textContent) => {
        return context.mod || context.subscriber;
    },
    handle: (context, textContent) => {
        const formattedText = popup.formatEmotes(textContent, context.emotes, true).substr(7);
        popup.showText(formattedText, alertBg);
        if (playAlertSound){
            new Audio(alertSoundFile).play();
        }
    }
};

// =======================================
// Command: !spotlight
// Description: spotlight [@username]: will display the chat of the specified user from that point on
// =======================================
var spotlightUser = "";

actionHandlers['!spotlight'] = {
    security: (context, textContent) => {
        return context.mod || context.subscriber;
    },
    handle: (context, textContent) => {
        spotlightUser = textContent.substr(12).toLowerCase();
        if (spotlightUser.length === 0) {
            popup.showText('', spotlightBg);
        } else {
            popup.showText(`${spotlightEmoji} Welcome ${spotlightUser} to the party crew!`, spotlightBg);
        }
    }
};

// =======================================
// Command: !fin <text>
// Description: will tts whatever text comes after the !fin command
// =======================================
actionHandlers['!fin'] = {
    security: (context, textContent) => {
        return context.mod || context.subscriber;
    },
    handle: (context, textContent) => {
        const text = textContent.substr(5);
        const speech = new SpeechSynthesisUtterance(text);
        speech.addEventListener('end', function (event) {
            setTimeout(function() {
                $("#tts").css('display', 'none');
            }, 250);
        });
        $("#tts").css('display', 'block');
        setTimeout(function() {
            window.speechSynthesis.speak(speech);
        }, 250);
    }
};


// This handler is fired when the spotlighted user types something in chat
allHandlers.push({
    security: (context, textContent) => {
        return context.username === spotlightUser && (!textContent.startsWith('@') || textContent.startsWith('@' + twitchChannel))
    },
    handle: (context, textContent) => {
        const formattedText = popup.formatEmotes(textContent, context.emotes, false);
        console.log(formattedText);
        popup.showText(`${spotlightEmoji} ${context['display-name']}: ${formattedText}`, spotlightBg);
    }
});
