const { createApp } = Vue;

const app = createApp({
  data() {
    return {
      client: null,
      opts: {
        channels: [env.channel],
        options: {
          clientId: env.client_id,
          skipUpdatingEmotesets: true,
        },
        identity: {
          username: env.channel,
          password: env.oauth,
        }
      },
      broadcaster: env.channel,
      activeCommands: {},
      eventQueue: new EventQueue(),
      cooldown: new CooldownStore(),
      showTTS: false,
      config: env,
      isGrandMaster: false,
    };
  },
  async mounted() {
    this.activeCommands = {
      "!so": {
        func: this.shoutOutCommand,
        globalCoolDown: 0,
        userCoolDown: 0,
        auth: this.isVip,
      },
      "!soc": {
        func: this.shoutOutClipCommand,
        globalCoolDown: 0,
        userCoolDown: 0,
        auth: this.isVip,
      },
      "!fin": {
        func: this.finCommand,
        globalCoolDown: 0,
        userCoolDown: 0,
        auth: this.isSubscriber,
        description: "[message]",
      },
    };

    this.client = new tmi.client(this.opts);
    this.client.on("message", this.onMessageHandler);
    this.client.on("connected", this.onConnectedHandler);
    this.client.connect();
  },
  watch: {
    eventQueue: {
      handler() {
        this.eventQueue.execute();
      },
      deep: true,
    },
  },
  methods: {
    onConnectedHandler(addr, port) {
      console.log(`* Connected to ${addr}:${port}`);
    },
    onMessageHandler(target, context, msg, self) {
      const rawText = msg.trim();
      const command =
        rawText.indexOf(" ") > -1
          ? rawText.substring(0, rawText.indexOf(" "))
          : rawText;

      if (
        command in this.activeCommands &&
        this.activeCommands[command].auth(context)
      ) {
        if ((!this.cooldown.hasGlobal(command) && !this.cooldown.hasUser(context.username, command)) || this.isMod(context)) {
          this.eventQueue.add(this.activeCommands[command].func, [
            context,
            rawText,
          ]);
          this.cooldown.addUser(
            command,
            this.activeCommands[command],
            context.username
          );
          this.cooldown.addGlobal(command, this.activeCommands[command]);
        } else {
          this.client.say(
            this.broadcaster,
            `the ${command} command is on cooldown.`
          )
        }
      }
    },
    finCommand(context, textContent) {
      if (textContent.substring(4)) {
        return this.textToSpeech(textContent.substring(4), context.username);
      }
    },
    shoutOutCommand(context, textContent) {
      const name = textContent.replace('!so ', '');
      const url = name.startsWith('@') ? `https://twitch.tv/${textContent.substring(5)}` : `https://twitch.tv/${textContent.substring(4)}`;
      this.client.say(
        this.broadcaster,
        `Please join me in following ${name} romeboLove romeboLove You can find them at ${url} romeboJam romeboJam`
      );
    },
    shoutOutClipCommand(context, textContent) {
      const name = textContent.replace('!soc ', '');
      const url = name.startsWith('@') ? `https://twitch.tv/${textContent.substring(6)}` : `https://twitch.tv/${textContent.substring(5)}`;
      this.client.say(
        this.broadcaster,
        `Please join me in following ${name} romeboLove romeboLove You can find them at ${url} romeboJam romeboJam Enjoy the clip!!`
      );
    },
    textToSpeech(text, username = '') {
      const vm = this;
      return new Promise((resolve) => {
        const src =
          "https://api.streamelements.com/kappa/v2/speech?voice=Justin&text=" +
          encodeURIComponent(text);

        const audioTag = document.getElementById("tts-audio");
        audioTag.src = src;

        vm.isGrandMaster = username === 'grand_master_shadow';

        vm.showTTS = true;
        setTimeout(function () {
          audioTag.play();
        }, 250);

        audioTag.addEventListener("ended", () => {
          setTimeout(function () {
            vm.showTTS = false;
            resolve();
          }, 250);
        });
      });
    },
    isSubscriber(context) {
      return context.subscriber || this.isVip(context);
    },
    isVip(context) {
      return (context.badges && context.badges.vip) || this.isMod(context);
    },
    isMod(context) {
      return context.mod || this.isBroadcaster(context);
    },
    isBroadcaster(context) {
      return context.username === this.broadcaster;
    },
  },
});

app.mount("#app");
