const opts = {
    channels: [
        twitchChannel
    ]
};

let actionHandlers = {};
let allHandlers = [];
let activeCommands = [
    '!alert',
    '!spotlight',
    '!fin'
];

// Create a client with our options defined at the top of the file
let client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

client.on('cheer', (channel, userstate, message) => {
    const speech = new SpeechSynthesisUtterance(message);
    speech.addEventListener('end', function (event) {
        setTimeout(function() {
            $("#tts").css('display', 'none');
        }, 250);
    });
    $("#tts").css('display', 'block');
    setTimeout(function() {
        window.speechSynthesis.speak(speech);
    }, 250);
});

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler(target, context, msg, self) {
    const rawText = msg.trim();
    const command =  rawText.indexOf(" ") > -1 ? rawText.substring(0, rawText.indexOf(" ")) : rawText;

    if (activeCommands.includes(command)) {
        if (actionHandlers[command].security(context, rawText)) {
            actionHandlers[command].handle(context, rawText);
        }
    } else {
        for (const handler of allHandlers) {
            if (handler.security(context, rawText)) {
                handler.handle(context, rawText);
            }
        }
    }
}

function onConnectedHandler(addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
}
