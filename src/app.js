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
	},
	mounted() {
    this.activeCommands = {
      '!alert': this.alertCommand,
      '!spotlight': this.spotlightCommand,
      '!fin': this.finCommand,
      '!heal': this.healCommand,
      '!lurk': this.lurkCommand,
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
      this.textToSpeech(message);
    },
    alertCommand(context, textContent) {
      if (context.mod || context.subscriber) {
        this.spotlightUser = "";
        const formattedText = this.formatEmotes(textContent, context.emotes).substring(6);
        this.showText(formattedText);
      }
    },
    healCommand(context, textContent) {
      new Audio('assets/sounds/heal.mp3').play();
    },
    lurkCommand(context, textContent) {
      new Audio('assets/sounds/lurk.mp3').play();
    },
    spotlightCommand(context, textContent) {
      if (context.mod || context.subscriber) {
        this.spotlightUser = textContent.substring(12).toLowerCase();
        if (this.spotlightUser.length === 0) {
          this.showText('');
        } else {
          this.showText(`${this.spotlightEmoji} Welcome ${this.spotlightUser} to the party crew!`);
        }
      }
    },
    finCommand(context, textContent) {
      if (context.mod || context.subscriber) {
        this.textToSpeech(textContent.substring(4));
      }
    },
    onOtherMessages(context, textContent) {
      if (context.username === this.spotlightUser) {
        const formattedText = this.formatEmotes(textContent, context.emotes);
        this.showText(`${this.spotlightEmoji} ${context['display-name']}: ${formattedText}`);
      }
    },
    formatEmotes(message, emotes) {
      let newMessage = $($.parseHTML(message)).text().split("");

      //replace any twitch emotes in the message with img tags for those emotes
      for (let emoteIndex in emotes) {
        const emote = emotes[emoteIndex];
        for (let charIndexes in emote) {
          let emoteIndexes = emote[charIndexes];
          if (typeof emoteIndexes == "string") {
            emoteIndexes = emoteIndexes.split("-");
            emoteIndexes = [parseInt(emoteIndexes[0]), parseInt(emoteIndexes[1])];
            for (let i = emoteIndexes[0]; i <= emoteIndexes[1]; ++i) {
              newMessage[i] = "";
            }
            newMessage[emoteIndexes[0]] = `<img class="emoticon" src="https://static-cdn.jtvnw.net/emoticons/v2/${emoteIndex}/default/dark/3.0"/>`;
          }
        }
      }
      return newMessage.join("");
    },
    showText(text) {
      if (text.length === 0) {
        $("#popupbox").animate({ width: 0 }, 500);
        $("#popuptext").animate({ "opacity": 0}, 700);
        return;
      }

      $("#popuptext").html(text);

      const textWidth = $("#popuptext").width();
      $("#popupbox").animate({ width: textWidth + 30 }, 500);
      $("#popuptext").animate({ "opacity": 1, "margin-left": "15px" }, 700);
    },
    textToSpeech(text) {
      const src = "https://api.streamelements.com/kappa/v2/speech?voice=Justin&text=" + encodeURIComponent(text);

      const audioTag = document.createElement("AUDIO");
      audioTag.src = src;
      audioTag.id = 'tts-audio'
      document.body.appendChild(audioTag);

      const interval = setInterval(function() {
        const element = document.getElementById('tts-audio');
        if (element) {
          $("#tts").css('display', 'block');
          setTimeout(function() {
            audioTag.play();
          }, 250);
          clearInterval(interval);
        }
      },100);

      audioTag.addEventListener("ended", () => {
        setTimeout(function() {
          $("#tts").css('display', 'none');
          document.body.removeChild(audioTag);
        }, 250);
      });
    }
  }
});
