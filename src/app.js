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
    eventQueue: new EventQueue(),
    show: false,
    showTTS: false,
    text: '',
    activeVideo: '',
	},
	mounted() {
    this.activeCommands = {
      '!alert': this.alertCommand,
      '!spotlight': this.spotlightCommand,
      '!so': this.shoutOutCommand,
      '!fin': this.finCommand,
      '!heal': this.soundCommand,
      '!lurk': this.soundCommand,
      '!bong': this.adminSoundCommand,
      '!youa': this.videoCommand,
      '!plat': this.videoCommand,
      '!dont': this.videoCommand,
      '!ding': this.videoCommand,
    }

		this.client = new tmi.client(this.opts);
    this.client.on('message', this.onMessageHandler);
    this.client.on('cheer', this.onCheerHandler);
    this.client.on('raided', this.onRaidedHandler)
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
        const vm = this;
        this.eventQueue.add(this.activeCommands[command], [context, rawText]);
        setInterval(function () {
          vm.eventQueue.execute();
        });
      } else {
        this.onOtherMessages(context, rawText);
      }
    },
    onCheerHandler(channel, userstate, message) {
      const bits = userstate.bits;

      if (bits == 50) {
        return this.playVideo('apparently');
      }

      const beginning = `${userstate['display-name']} just cheered ${bits} bits `;
      const cleaned = message.replace(/(Cheer\d+)/g, '');
      const theMessage = beginning + cleaned;
      return this.textToSpeech(theMessage);
    },
    onRaidedHandler(channel, username, viewers) {
      return this.textToSpeech(`${username} just raided with ${viewers} viewers. Thank you so much! Welcome raiders I'm Fin! You have entered romeboiii's channel! We like to play games and stuff, hope you enjoy yourself here!`);
    },
    alertCommand(context, textContent) {
      if (context.mod || context.subscriber) {
        this.spotlightUser = "";
        const formattedText = this.formatEmotes(textContent, context.emotes).substring(6);
        this.showText(formattedText);
      }
    },
    soundCommand(context, textContent) {
      const sound = textContent.indexOf(" ") > -1 ? textContent.substring(1, textContent.indexOf(" ")) : textContent.substring(1);
      return new Promise(resolve => {
        const audio = new Audio(`assets/sounds/${sound}.mp3`);
        audio.play();
        audio.onended = resolve;
      });
    },
    adminSoundCommand(context, textContent) {
      if (context.mod || context.subscriber) {
        return this.soundCommand(context, textContent);
      }
    },
    videoCommand(context, textContent) {
      if (context.mod || context.subscriber) {
        const videoName = textContent.indexOf(" ") > -1 ? textContent.substring(1, textContent.indexOf(" ")) : textContent.substring(1);
        return this.playVideo(videoName);
      }
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
    shoutOutCommand(context, textContent) {
      if (context.mod || context.subscriber) {
        this.spotlightUser = textContent.substring(5).toLowerCase();
        if (this.spotlightUser.length === 0) {
          this.showText('');
        } else {
          this.showText(`${this.spotlightEmoji} Welcome ${this.spotlightUser} to the party crew!`);
        }
      }
    },
    finCommand(context, textContent) {
      if (context.mod || context.subscriber) {
        return this.textToSpeech(textContent.substring(4));
      }
    },
    onOtherMessages(context, textContent) {
      if (context.username === this.spotlightUser) {
        const formattedText = this.formatEmotes(textContent, context.emotes);
        this.showText(`${this.spotlightEmoji} ${context['display-name']}: ${formattedText}`);
      }
    },
    formatEmotes(message, emotes) {
      let newMessage = message.split("");
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
      const vm = this;
      this.show = false;
      if (text.length > 0) {
        setTimeout(function () {
          vm.text = text;
          vm.show = true;
        }, 1000);
      }
    },
    textToSpeech(text) {
      const vm = this;
      return new Promise(resolve => {
        const src = "https://api.streamelements.com/kappa/v2/speech?voice=Justin&text=" + encodeURIComponent(text);

        const audioTag = document.createElement("AUDIO");
        audioTag.src = src;
        audioTag.id = 'tts-audio'
        document.body.appendChild(audioTag);

        const interval = setInterval(function() {
          const element = document.getElementById('tts-audio');
          if (element) {
            vm.showTTS = true;
            setTimeout(function() {
              audioTag.play();
            }, 250);
            clearInterval(interval);
          }
        },100);

        audioTag.addEventListener("ended", () => {
          setTimeout(function() {
            vm.showTTS = false;
            document.body.removeChild(audioTag);
            resolve();
          }, 250);
        });
      });
    },
    playVideo(videoName) {
      const vm = this;
      return new Promise(resolve => {
        vm.activeVideo = videoName;

        const interval = setInterval(function () {
          const element = document.querySelector('video')
          if (element) {
            element.addEventListener('ended', (event) => {
              vm.activeVideo = '';
              resolve();
            });

            clearInterval(interval);
          }
        }, 100);
      });
    }
  }
});
