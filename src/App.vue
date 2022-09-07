<script>
import EventQueue from "./js/EventQueue";
import tmi from "tmi.js";
import { useSubStore } from "./stores/subs";
import axios from "axios";
import { useVipStore } from "./stores/vips";
import { useCoolDownStore } from "./stores/cooldown";

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
      vips: useVipStore(),
      cooldown: useCoolDownStore(),
      auth_token: "",
      audioMuted: true,
      modal: {
        active: false,
        src: "",
        text: "",
        isVideo: false,
      },
    };
  },
  async mounted() {
    this.activeCommands = {
      "!bell": {
        func: this.soundCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isForAll,
      },
      "!damage": {
        func: this.soundCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isForAll,
      },
      "!ding": {
        func: this.soundCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isForAll,
      },
      "!dog": {
        func: this.videoCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isForAll,
      },
      "!heal": {
        func: this.soundCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isForAll,
      },
      "!lost": {
        func: this.soundCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isForAll,
      },
      "!lurk": {
        func: this.soundCommand,
        globalCoolDown: 0,
        userCoolDown: 15000,
        auth: this.isForAll,
      },
      "!nice": {
        func: this.soundCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isForAll,
      },
      "!no": {
        func: this.videoCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isForAll,
      },
      "!pet": {
        func: this.petTurtleDog,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isForAll,
      },
      "!rollin": {
        func: this.soundCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isForAll,
      },
      "!slap": {
        func: this.imageSwitchCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isForAll,
      },
      "!uwu": {
        func: this.soundCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isForAll,
      },
      "!alert": {
        func: this.alertCommand,
        globalCoolDown: 0,
        userCoolDown: 0,
        auth: this.isModSubscriberVip,
      },
      "!bin": {
        func: this.soundCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isModSubscriberVip,
      },
      "!fin": {
        func: this.finCommand,
        globalCoolDown: 0,
        userCoolDown: 0,
        auth: this.isModSubscriberVip,
      },
      "!plat": {
        func: this.videoCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isModSubscriberVip,
      },
      "!ss": {
        func: this.replaySubSound,
        globalCoolDown: 0,
        userCoolDown: 0,
        auth: this.isModVip,
      },
      "!vip": {
        func: this.vipCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isVip,
      },
      "!hoya": {
        func: this.videoCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isVip,
      },
      "!apparently": {
        func: this.videoCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isBroadcaster,
      },
      "!friend": {
        func: this.videoCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isBroadcaster,
      },
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
        if (
          (!this.cooldown.hasGlobal(command) &&
            !this.cooldown.hasUser(context.username, command)) ||
          this.isModVip(context)
        ) {
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
        }
      }

      this.subSound(context);
    },
    onCheerHandler(channel, userstate, message) {
      const bits = userstate.bits;

      if (bits == 20) {
        this.eventQueue.add(this.playVideo, ["friend"]);
        return;
      }

      if (bits == 50) {
        this.eventQueue.add(this.playVideo, ["apparently"]);
        return;
      }

      if (bits == 100) {
        this.eventQueue.add(this.playVideo, ["hoya"]);
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
      let text = event;
      if (message) {
        text += message;
      }
      this.eventQueue.add(this.textToSpeech, [text]);
    },
    alertCommand(context, textContent) {
      const formattedText = this.formatEmotes(
        textContent,
        context.emotes
      ).substring(6);
      this.showText(formattedText);
    },
    soundCommand(context, textContent) {
      const sound =
        textContent.indexOf(" ") > -1
          ? textContent.substring(1, textContent.indexOf(" "))
          : textContent.substring(1);
      return this.playSound(`/sounds/${sound}.mp3`);
    },
    vipCommand(context, textContent) {
      const vm = this;
      if (this.vips.has(context.username)) {
        const vip = this.vips.getVip(context.username);
        vm.eventQueue.add(vm.setModal, [
          true,
          vip.profile_image_url,
          `I'M A VIP B**CH!!!! - ${vip.display_name}`,
          12000,
        ]);
        vm.eventQueue.add(vm.playSound, ["/sounds/vip.mp3"]);
      } else {
        axios
          .get(`https://api.twitch.tv/helix/users?id=${context["user-id"]}`, {
            headers: {
              Authorization: `Bearer ${this.auth_token}`,
              "Client-Id": import.meta.env.VITE_CLIENT_ID,
            },
          })
          .then((response) => {
            let vip = response.data.data[0];
            vip.username = context.username;
            vm.vips.add(vip);
            vm.eventQueue.add(vm.setModal, [
              true,
              vip.profile_image_url,
              `I'M A VIP B**CH!!!! - ${vip.display_name}`,
              12000,
            ]);
            vm.eventQueue.add(vm.playSound, ["/sounds/vip.mp3"]);
          });
      }
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
      return this.textToSpeech(textContent.substring(4));
    },
    replaySubSound(context, textContent) {
      const name = textContent.substring(5);
      if (this.subs.has(name)) {
        const sub = this.subs.getSubscriber(name);
        this.subSound(sub);
      }
    },
    subSound(context) {
      if (
        context.subscriber &&
        !this.subs.has(context.username) &&
        context.username !== this.broadcaster
      ) {
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
            axios.get(`/subSounds/${context.username}.mp3`).then(() => {
              vm.eventQueue.add(vm.playSound, [
                `/subSounds/${context.username}.mp3`,
              ]);
            });
          });
        this.subs.add(context);
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
    petTurtleDog() {
      return this.setModal(true, "/images/pet-turtle-dog.gif", "GOOD BOIII!!!");
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
    isModSubscriberVip(context) {
      return (
        context.mod ||
        context.subscriber ||
        context.badges.vip ||
        context.username === this.broadcaster
      );
    },
    isModVip(context) {
      return (
        context.mod ||
        context.badges.vip ||
        context.username === this.broadcaster
      );
    },
    isVip(context) {
      return context.badges.vip || context.username === this.broadcaster;
    },
    isBroadcaster(context) {
      return context.username === this.broadcaster;
    },
    isForAll(context) {
      return true;
    },
  },
};
</script>

<template>
  <div class="cyberpunk2077 absolute left-1 bottom-1" v-if="show">
    <h1
      class="text-pink flex justify-center items-center whitespace-nowrap cyberpunk"
      v-html="text"
    ></h1>
  </div>
  <transition name="bounce">
    <div
      class="absolute w-full h-full flex flex-col justify-center items-center"
      v-if="modal.active"
    >
      <video
        v-if="modal.isVideo"
        autoplay
        class="w-1/5 cyberpunk-border dotted"
      >
        <source :src="modal.src" />
      </video>
      <img v-else class="w-1/5 cyberpunk-border dotted" :src="modal.src" />
      <div class="cyberpunk2077 mt-1">
        <h2 class="text-pink cyberpunk">
          {{ modal.text }}
        </h2>
      </div>
    </div>
  </transition>
  <div
    class="flex justify-center items-center h-full justify-self-center"
    id="video-wrapper"
  >
    <video
      v-if="activeVideo !== ''"
      :key="activeVideo"
      id="active-video"
      class="cyberpunk-border dotted"
      autoplay
      style="max-width: 1000px; max-height: 1000px"
    >
      <source :src="`/videos/${activeVideo}.mp4`" />
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
