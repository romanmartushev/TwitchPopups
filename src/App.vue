<script>
import EventQueue from "./js/EventQueue";
import tmi from "tmi.js";
import { useSubStore } from "./stores/subs";
import axios from "axios";

export default {
  data() {
    return {
      client: null,
      opts: {
        channels: [import.meta.env.VITE_TWITCH_CHANNEL],
      },
      broadcaster: import.meta.env.VITE_TWITCH_CHANNEL,
      activeCommands: {},
      eventQueue: new EventQueue(),
      show: false,
      showTTS: false,
      text: "",
      activeVideo: "",
      activeImage: "",
      subs: useSubStore(),
      auth_token: "",
      audioMuted: true,
      modal: {
        active: false,
        img: "",
        text: "",
      },
    };
  },
  async mounted() {
    this.activeCommands = {
      "!alert": this.alertCommand,
      "!fin": this.finCommand,
      "!heal": this.soundCommand,
      "!lurk": this.soundCommand,
      "!bong": this.soundCommand,
      "!ding": this.soundCommand,
      "!nice": this.soundCommand,
      "!damage": this.soundCommand,
      "!rollin": this.soundCommand,
      "!slap": this.imageSwitchCommand,
      "!youa": this.videoCommand,
      "!plat": this.videoCommand,
      "!dont": this.videoCommand,
      "!no": this.videoCommand,
      "!ss": this.replaySubSound,
    };

    this.client = new tmi.client(this.opts);
    this.client.on("message", this.onMessageHandler);
    this.client.on("cheer", this.onCheerHandler);
    this.client.on("raided", this.onRaidedHandler);
    this.client.on("anongiftpaidupgrade", this.onAnonGiftPaidUpgrade);
    this.client.on("giftpaidupgrade", this.onGiftPaidUpgrade);
    this.client.on("resub", this.onReSub);
    this.client.on("subgift", this.onSubGift);
    this.client.on("submysterygift", this.onSubMysteryGift);
    this.client.on("subscription", this.onSubscriptionHandler);
    this.client.on("connected", this.onConnectedHandler);
    this.client.connect();

    const vm = this;

    setInterval(function () {
      vm.eventQueue.execute();
    });

    this.auth_token = await axios
      .post("https://id.twitch.tv/oauth2/token", {
        client_id: import.meta.env.VITE_CLIENT_ID,
        client_secret: import.meta.env.VITE_CLIENT_SECRET,
        grant_type: "client_credentials",
      })
      .then((response) => {
        return response.data.access_token;
      });
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

      if (command in this.activeCommands) {
        this.eventQueue.add(this.activeCommands[command], [context, rawText]);
      }

      this.onOtherMessages(context, rawText);
    },
    onCheerHandler(channel, userstate, message) {
      const bits = userstate.bits;

      if (bits == 50) {
        this.eventQueue.add(this.playVideo, ["apparently"]);
        return;
      }

      this.eventQueue.add(this.setModal, [
        true,
        "",
        `${userstate["display-name"]} just cheered ${bits} bits!!!`,
      ]);

      const beginning = `${userstate["display-name"]} just cheered ${bits} bits `;
      const cleaned = message.replace(/(Cheer\d+)/g, "");
      this.eventQueue.add(this.textToSpeech, [beginning + cleaned]);
    },
    onRaidedHandler(channel, username, viewers) {
      this.eventQueue.add(this.setModal, [
        true,
        "/images/raid.gif",
        `${username} just raided with ${viewers} viewers!!!`,
      ]);

      this.eventQueue.add(this.playSound, ["/sounds/raid.mp3"]);
    },
    onSubscriptionHandler(channel, username, method, message, userstate) {
      const event = `${username} just subbed!!!`;
      this.baseSub(event, message);
    },
    onAnonGiftPaidUpgrade(channel, username, userstate) {
      const event = `${username} is continuing their gift sub!!!`;
      this.baseSub(event);
    },
    onGiftPaidUpgrade(channel, username, sender, userstate) {
      const event = `${username} is continuing their gift sub from ${sender}!!!`;
      this.baseSub(event);
    },
    onReSub(channel, username, months, message, userstate, methods) {
      const event = `${username} just re-subbed!!!`;
      this.baseSub(event, message);
    },
    onSubGift(channel, username, streakMonths, recipient, methods, userstate) {
      const event = `${username} just gifted a sub to ${recipient}!!!`;
      this.baseSub(event);
    },
    onSubMysteryGift(channel, username, numbOfSubs, methods, userstate) {
      const event = `${username} just gifted ${numbOfSubs} subs!!!`;
      this.baseSub(event);
    },
    baseSub(event, message = "") {
      this.eventQueue.add(this.setModal, [true, "/images/sub.gif", event]);
      this.eventQueue.add(this.playSound, ["/sounds/sub.mp3"]);
      this.eventQueue.add(this.textToSpeech, [event + message]);
    },
    alertCommand(context, textContent) {
      if (context.mod || context.subscriber) {
        const formattedText = this.formatEmotes(
          textContent,
          context.emotes
        ).substring(6);
        this.showText(formattedText);
      }
    },
    soundCommand(context, textContent) {
      const sound =
        textContent.indexOf(" ") > -1
          ? textContent.substring(1, textContent.indexOf(" "))
          : textContent.substring(1);
      return this.playSound(`/sounds/${sound}.mp3`);
    },
    imageSwitchCommand(context, textContent) {
      const vm = this;
      const command =
        textContent.indexOf(" ") > -1
          ? textContent.substring(1, textContent.indexOf(" "))
          : textContent.substring(1);
      return new Promise((resolve) => {
        vm.activeImage = `before-${command}.png`;
        setTimeout(() => {
          const audio = new Audio(`/sounds/${command}.mp3`);
          audio.play();
          vm.activeImage = `after-${command}.png`;
          audio.onended = () => {
            vm.activeImage = "";
            resolve();
          };
        }, 1000);
      });
    },
    videoCommand(context, textContent) {
      const videoName =
        textContent.indexOf(" ") > -1
          ? textContent.substring(1, textContent.indexOf(" "))
          : textContent.substring(1);
      return this.playVideo(videoName);
    },
    finCommand(context, textContent) {
      if (context.mod || context.subscriber) {
        return this.textToSpeech(textContent.substring(4));
      }
    },
    onOtherMessages(context, textContent) {
      if (
        context.subscriber &&
        this.subs.doesntHave(context.username) &&
        context.username !== this.broadcaster
      ) {
        this.subSound(context);
        this.subs.add(context);
      }
    },
    replaySubSound(context, textContent) {
      if (context.username === this.broadcaster) {
        const name = textContent.substring(5);
        if (this.subs.has(name)) {
          const sub = this.subs.getSubscriber(name);
          this.subSound(sub);
        }
      }
    },
    subSound(context) {
      const vm = this;
      axios
        .get(`https://api.twitch.tv/helix/users?id=${context["user-id"]}`, {
          headers: {
            Authorization: `Bearer ${this.auth_token}`,
            "Client-Id": import.meta.env.VITE_CLIENT_ID,
          },
        })
        .then((response) => {
          const activeSub = response.data.data[0];
          vm.eventQueue.add(vm.setModal, [
            true,
            activeSub.profile_image_url,
            `${activeSub.display_name} has arrived!!!`,
          ]);
          axios.get(`/subSounds/${activeSub.display_name}.mp3`).then(() => {
            vm.eventQueue.add(vm.playSound, [
              `/subSounds/${activeSub.display_name}.mp3`,
            ]);
          });
        });
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
      return new Promise((resolve) => {
        this.modal = {
          active: active,
          img: img,
          text: text,
        };
        const vm = this;
        setTimeout(() => {
          vm.modal = {
            active: false,
            img: "",
            text: "",
          };
        }, time);
        resolve();
      });
    },
  },
};
</script>

<template>
  <transition name="bounce">
    <div class="bg-special rounded absolute left-3 bottom-3" v-if="show">
      <h1
        class="special-text flex justify-center items-center uppercase whitespace-nowrap"
        v-html="text"
      ></h1>
    </div>
  </transition>
  <transition name="bounce">
    <div
      class="absolute w-full h-full flex flex-col justify-center items-center"
      v-if="modal.active"
    >
      <img class="w-1/6 rounded" :src="modal.img" />
      <div class="bg-special rounded mt-1">
        <p class="special-text uppercase">
          {{ modal.text }}
        </p>
      </div>
    </div>
  </transition>
  <div
    class="flex justify-center items-center h-full justify-self-center"
    id="video-wrapper"
  >
    <video
      :key="activeVideo"
      id="active-video"
      autoplay
      style="max-width: 1000px; max-height: 1000px"
    >
      <source v-if="activeVideo !== ''" :src="`/videos/${activeVideo}.mp4`" />
    </video>
  </div>
  <img v-if="showTTS" class="absolute bottom-20 left-3" src="/images/tts.gif" />
  <audio id="tts-audio" />
  <img
    v-if="activeImage"
    :key="activeImage"
    class="absolute bottom-0 right-20"
    style="max-height: 300px"
    :src="'/images/' + activeImage"
  />
</template>
