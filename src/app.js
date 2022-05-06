export default new Vue({
	el: '#app',
	data: {
    client: null,
    opts: {
			channels: [
				'romeboiii'
			]
		},
    activeCommands: {},
    spotlightUser: "",
    spotlightEmoji: '<img class="emoticon" src="https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_1604443d6fd54998bfe170cc620868a2/default/dark/3.0">',
    playAlertSound: false,
    alertSoundFile: 'assets/sounds/alert.mp3',
	},
	mounted() {

    this.activeCommands = {
      '!alert': this.alertCommand,
      '!spotlight': this.spotlightCommand,
      '!fin': this.finCommand,
    }

		this.client = new tmi.client(this.opts);
    this.client.on('message', this.onMessageHandler);
    this.client.on('cheer', this.onCheerHandler);
    this.client.on('connected', this.onConnectedHandler);

    this.client.connect();
	},
  methods: {
    onConnectedHandler(addr, port) {
      console.log(`* Connected to ${addr}:${port}`);
    },
    onMessageHandler(target, context, msg, self) {
      const rawText = msg.trim();
      const command =  rawText.indexOf(" ") > -1 ? rawText.substring(0, rawText.indexOf(" ")) : rawText;

      if (command in this.activeCommands) {
        this.activeCommands[command](context, rawText);
      } else {
        this.onOtherMessages(context, rawText);
      }
    },
    onCheerHandler(channel, userstate, message) {
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
    },
    alertCommand(context, textContent) {
      if (context.mod || context.subscriber) {
        this.spotlightUser = "";
        const formattedText = popup.formatEmotes(textContent, context.emotes, true).substr(7);
        popup.showText(formattedText);
        if (this.playAlertSound) {
          new Audio(this.alertSoundFile).play();
        }
      }
    },
    spotlightCommand(context, textContent) {
      if (context.mod || context.subscriber) {
        this.spotlightUser = textContent.substr(12).toLowerCase();
        if (this.spotlightUser.length === 0) {
          popup.showText('');
        } else {
          popup.showText(`${this.spotlightEmoji} Welcome ${this.spotlightUser} to the party crew!`);
        }
      }
    },
    finCommand(context, textContent) {
      if (context.mod || context.subscriber) {
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
    },
    onOtherMessages(context, textContent) {
      if (context.username === this.spotlightUser) {
        const formattedText = popup.formatEmotes(textContent, context.emotes, false);
        popup.showText(`${this.spotlightEmoji} ${context['display-name']}: ${formattedText}`);
      }
    }
  }
});
