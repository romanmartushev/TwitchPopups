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
      show: false,
      showTTS: false,
      text: "",
      activeVideo: "",
      court: new Court(),
      auth_token: "",
      modal: {
        active: false,
        src: "",
        text: "",
        isVideo: false,
      },
      config: env,
    };
  },
  async mounted() {
    this.activeCommands = {
      "!alert": {
        func: this.alertCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isModSubscriberVip,
        description: "[message]",
      },
      "!fin": {
        func: this.finCommand,
        globalCoolDown: 15000,
        userCoolDown: 30000,
        auth: this.isModSubscriberVip,
        description: "[message]",
      },
      "!vip": {
        func: this.vipCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isVip,
      },
      "!guilty": {
        func: this.guiltySentence,
        globalCoolDown: 0,
        userCoolDown: 0,
        auth: this.isBroadcaster,
        arguments: "[@name]",
      },
      "!innocent": {
        func: this.innocentSentence,
        globalCoolDown: 0,
        userCoolDown: 0,
        auth: this.isBroadcaster,
        arguments: "[@name]",
      },
      "!release": {
        func: this.releaseFromJail,
        globalCoolDown: 0,
        userCoolDown: 0,
        auth: this.isBroadcaster,
        arguments: "[@name]",
      },
      "!trial": {
        func: this.courtTrial,
        globalCoolDown: 0,
        userCoolDown: 0,
        auth: this.isBroadcaster,
        arguments: "[@name]",
      },
    };

    this.client = new tmi.client(this.opts);
    this.client.on("message", this.onMessageHandler);
    this.client.on("connected", this.onConnectedHandler);
    this.client.connect();

    this.auth_token = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${this.config.client_id}&client_secret=${this.config.client_secret}&grant_type=client_credentials`,{
      method: 'POST',
    }).then((response) => response.json())
      .then((data) => {
        return data.access_token;
      });
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
      if (this.court.inSession()) {
        this.onTrialHandler(target, context, msg, self);
        return;
      }

      const rawText = msg.trim();
      const command =
        rawText.indexOf(" ") > -1
          ? rawText.substring(0, rawText.indexOf(" "))
          : rawText;

      if (
        command in this.activeCommands &&
        this.activeCommands[command].auth(context)
      ) {
        this.eventQueue.add(this.activeCommands[command].func, [
          context,
          rawText,
        ]);
      }
    },
    onTrialHandler(target, context, msg, self) {
      if (!this.court.voted(context) && context.username !== this.broadcaster) {
        if (
          msg.toLowerCase().includes("voteyea") ||
          msg.toLowerCase().includes("yes")
        ) {
          this.court.guiltyCountAdd();
          this.court.juryAdd(context);
        }
        if (
          msg.toLowerCase().includes("votenay") ||
          msg.toLowerCase().includes("no")
        ) {
          this.court.innocentCountAdd();
          this.court.juryAdd(context);
        }
      }
      if (context.username === this.broadcaster && msg === "!end") {
        this.court.inSession(false);
        this.client.say(
          this.broadcaster,
          "The jury has decided your fate, the verdict is:"
        );
        this.client.say(
          this.broadcaster,
          `!${this.court.getVerdict()} @${this.court.getAccused()}`
        );
        this.eventQueue.add(this.playVideo, [this.court.getVerdict()]);
      }
    },
    alertCommand(context, textContent) {
      const formattedText = this.formatEmotes(
        textContent,
        context.emotes
      ).substring(6);
      this.showText(formattedText);
    },
    vipCommand(context, textContent) {
      const vm = this;
      fetch(`https://api.twitch.tv/helix/users?id=${context["user-id"]}`, {
        headers: {
          Authorization: `Bearer ${vm.auth_token}`,
          "Client-Id": vm.config.client_id,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          let vip = data.data[0];
          vm.eventQueue.add(vm.setModal, [
            true,
            vip.profile_image_url,
            `I'M A VIP B**CH!!!! - ${vip.display_name}`,
            12000,
          ]);
          vm.eventQueue.add(vm.playSound, ["./sounds/vip.mp3"]);
        });
    },
    finCommand(context, textContent) {
      if (textContent.substring(4)) {
        return this.textToSpeech(textContent.substring(4));
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
            emoteIndexes = [
              parseInt(emoteIndexes[0]),
              parseInt(emoteIndexes[1]),
            ];
            for (let i = emoteIndexes[0]; i <= emoteIndexes[1]; ++i) {
              newMessage[i] = "";
            }
            newMessage[
              emoteIndexes[0]
            ] = `<img class="emoticon" src="https://static-cdn.jtvnw.net/emoticons/v2/${emoteIndex}/default/dark/3.0"/>`;
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
      return new Promise((resolve) => {
        const src =
          "https://api.streamelements.com/kappa/v2/speech?voice=Justin&text=" +
          encodeURIComponent(text);

        const audioTag = document.getElementById("tts-audio");
        audioTag.src = src;

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
    playVideo(videoName) {
      const vm = this;
      return new Promise((resolve) => {
        vm.activeVideo = videoName;

        const interval = setInterval(function () {
          const element = document.querySelector("video");
          if (element) {
            element.volume = 0.5;
            element.addEventListener("ended", (event) => {
              vm.activeVideo = "";
              resolve();
            });

            clearInterval(interval);
          }
        }, 100);
      });
    },
    playSound(sound) {
      return new Promise((resolve) => {
        const audio = new Audio(sound);
        audio.play();
        audio.onended = resolve;
      });
    },
    setModal(active = false, img = "", text = "", time = 5000) {
      const extension = img.split(".");
      return new Promise((resolve) => {
        this.modal = {
          active: active,
          src: img,
          text: text,
          isVideo: extension[1] === "mp4",
        };
        const vm = this;
        setTimeout(() => {
          vm.modal = {
            active: false,
            src: "",
            text: "",
            isVideo: false,
          };
        }, time);
        resolve();
      });
    },
    courtTrial(context, textContent) {
      this.court.inSession(true);
      this.court.setAccused(textContent.substring(8));
      this.client.say(
        this.broadcaster,
        `Court is in session!!! The Accused: ${this.court.getAccused()} stands trial. You decide their fate, are they guilty? : VoteYea (yes) or VoteNay (no).`
      );
    },
    guiltySentence(context, textContent) {
      const username = textContent.substring(9);
      this.court.end();
      this.client.say(this.broadcaster, `/timeout @${username} 600`);
    },
    innocentSentence(context, textContent) {
      this.court.end();
    },
    releaseFromJail(context, textContent) {
      const username = textContent.substring(10);
      this.client.say(this.broadcaster, `/untimeout @${username}`);
    },
    isModSubscriberVip(context) {
      return (
        context.mod ||
        context.subscriber ||
        (context.badges && context.badges.vip) ||
        context.username === this.broadcaster
      );
    },
    isModVip(context) {
      return (
        context.mod ||
        (context.badges && context.badges.vip) ||
        context.username === this.broadcaster
      );
    },
    isVip(context) {
      return (
        (context.badges && context.badges.vip) ||
        context.username === this.broadcaster
      );
    },
    isBroadcaster(context) {
      return context.username === this.broadcaster;
    },
  },
});

app.mount("#app");
