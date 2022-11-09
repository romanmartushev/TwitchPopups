<script>
import EventQueue from "./js/EventQueue";
import tmi from "tmi.js";
import { useSubStore } from "./stores/subs";
import axios from "axios";
import { useVipStore } from "./stores/vips";
import { useCoolDownStore } from "./stores/cooldown";
import { useCourtStore } from "./stores/court";

export default {
  data() {
    return {
      client: null,
      opts: {
        channels: [import.meta.env.VITE_TWITCH_CHANNEL],
        options: {
          clientId: import.meta.env.VITE_CLIENT_ID,
          skipUpdatingEmotesets: true,
        },
        identity: {
          username: import.meta.env.VITE_TWITCH_CHANNEL,
          password: import.meta.env.VITE_TWITCH_OAUTH,
        },
      },
      broadcaster: import.meta.env.VITE_TWITCH_CHANNEL,
      activeCommands: {},
      eventQueue: new EventQueue(),
      show: false,
      showTTS: false,
      text: "",
      activeVideo: "",
      subs: useSubStore(),
      vips: useVipStore(),
      cooldown: useCoolDownStore(),
      court: useCourtStore(),
      auth_token: "",
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
      "!alerts": {
        func: this.sayAlerts,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isForAll,
      },
      "!bits": {
        func: this.sayBits,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isForAll,
      },
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
      "!lore": {
        func: this.sayCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isForAll,
        say: "Ryan Reynolds look alike, the Cleric Teen Snatcher, serves Fin Sif, the god of evil. Trained to heal all the ouchies, when he isn't healing teens, he is most likely stalking the night with his petrified gift hoping it turns into something useful to his snatching hobby.",
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
      "!rollin": {
        func: this.soundCommand,
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
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isModSubscriberVip,
        description: "[message]",
      },
      "!ah": {
        func: this.soundCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isModSubscriberVip,
      },
      "!bin": {
        func: this.soundCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isModSubscriberVip,
      },
      "!control": {
        func: this.videoCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isModSubscriberVip,
      },
      "!fin": {
        func: this.finCommand,
        globalCoolDown: 15000,
        userCoolDown: 30000,
        auth: this.isModSubscriberVip,
        description: "[message]",
      },
      "!plat": {
        func: this.videoCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isModSubscriberVip,
      },
      "!praise": {
        func: this.videoCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isModSubscriberVip,
      },
      "!toptier": {
        func: this.videoCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isModSubscriberVip,
      },
      "!vip": {
        func: this.vipCommand,
        globalCoolDown: 5000,
        userCoolDown: 15000,
        auth: this.isVip,
      },
      "!hoya": {
        func: this.videoCommand,
        globalCoolDown: 0,
        userCoolDown: 0,
        auth: this.isVip,
      },
      "!apparently": {
        func: this.videoCommand,
        globalCoolDown: 0,
        userCoolDown: 0,
        auth: this.isBroadcaster,
      },
      "!friend": {
        func: this.videoCommand,
        globalCoolDown: 0,
        userCoolDown: 0,
        auth: this.isBroadcaster,
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
    this.client.on("cheer", this.onCheerHandler);
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
      if (this.court.inSession()) {
        this.onTrialHandler(target, context, msg, self);
        return;
      }
      if (this.court.isGuilty(context)) {
        return;
      }
      this.subSound(context);

      const rawText = msg.trim();
      const command =
        rawText.indexOf(" ") > -1
          ? rawText.substring(0, rawText.indexOf(" "))
          : rawText;

      if (
        command in this.activeCommands &&
        this.activeCommands[command].auth(context)
      ) {
        if (!this.isModVip(context)) {
          if (this.cooldown.hasUser(context.username, command)) {
            const seconds = this.cooldown.getUserTime(
              context.username,
              command,
              this.activeCommands[command].userCoolDown
            );
            this.client.say(
              this.broadcaster,
              `${context.username}, you have used the ${command} command too soon. Try again in ${seconds} seconds.`
            );
            return;
          }
          if (this.cooldown.hasGlobal(command)) {
            const seconds = this.cooldown.getGlobalTime(
              command,
              this.activeCommands[command].globalCoolDown
            );
            this.client.say(
              this.broadcaster,
              `The ${command} command is on a global cooldown. Try again in ${seconds} seconds.`
            );
            return;
          }
        }
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
    onCheerHandler(channel, userstate, message) {
      const bits = userstate.bits;

      if (bits == 20) {
        this.eventQueue.add(this.playVideo, ["friend"]);
      } else if (bits == 50) {
        this.eventQueue.add(this.playVideo, ["apparently"]);
      } else if (bits == 100) {
        this.eventQueue.add(this.playVideo, ["hoya"]);
      } else {
        const beginning = `${userstate["display-name"]} just cheered ${bits} bits `;
        const cleaned = message.replace(/(Cheer\d+)/g, "");
        this.eventQueue.add(this.textToSpeech, [beginning + cleaned]);
      }
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
      let text = event;
      if (message) {
        text += message;
      }
      this.eventQueue.add(this.textToSpeech, [text]);
    },
    sayAlerts(context, textContent) {
      const vm = this;
      const alerts = function (auth) {
        let message = "";
        Object.keys(vm.activeCommands).forEach((key) => {
          if (vm.activeCommands[key].auth === auth) {
            if (vm.activeCommands[key].description) {
              message += `${key} ${vm.activeCommands[key].description}, `;
            } else {
              message += `${key}, `;
            }
          }
        });
        return message;
      };
      this.client.say(
        this.broadcaster,
        `For Everyone: ${alerts(this.isForAll)}`
      );

      this.client.say(
        this.broadcaster,
        `For Subs: ${alerts(this.isModSubscriberVip)}`
      );

      this.client.say(this.broadcaster, `For VIPS: ${alerts(this.isVip)}`);
    },
    sayBits(context, textContent) {
      this.client.say(
        this.broadcaster,
        "Bits/Cheer Menu: 1 (Cheer1) -> Infinite = TTS Enabled, 20 (Cheer20) = Friend, 50 (Cheer50) = Apparently, 100 (Cheer100) = Hoyaaa!️"
      );
    },
    sayCommand(context, textContent) {
      this.client.say(this.broadcaster, this.activeCommands[textContent].say);
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
    videoCommand(context, textContent) {
      const videoName =
        textContent.indexOf(" ") > -1
          ? textContent.substring(1, textContent.indexOf(" "))
          : textContent.substring(1);
      return this.playVideo(videoName);
    },
    finCommand(context, textContent) {
      if (textContent.substring(4)) {
        return this.textToSpeech(textContent.substring(4));
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
            context.profile_image_url = activeSub.profile_image_url;
            context.display_name = activeSub.display_name;
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
      if (username !== this.broadcaster) {
        this.court.guilty(username.toLowerCase());
        this.client.say(this.broadcaster, `/timeout @${username} 180`);
      }
    },
    innocentSentence(context, textContent) {
      this.court.innocent(textContent.substring(11).toLowerCase());
    },
    releaseFromJail(context, textContent) {
      this.court.innocent(textContent.substring(10).toLowerCase());
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
    isForAll(context) {
      return true;
    },
  },
};
</script>

<template>
  <transition name="bounce">
    <div
      class="w-1/2 flex flex-col items-center justify-center m-auto mt-28 bg-black p-10 rounded-2xl"
      v-if="court.inSession()"
    >
      <h1 class="text-pink uppercase text-8xl">Court is in session</h1>
      <div class="flex w-full justify-around text-5xl text-blue">
        <p>Guilty: {{ court.getGuiltyCount() }}</p>
        <p>Innocent: {{ court.getInnocentCount() }}</p>
      </div>
      <p class="absolute text-pink uppercase text-center text-8xl">
        {{ court.getAccused() }}
      </p>
      <img class="relative" src="/images/jail.png" />
    </div>
  </transition>
  <transition name="bounce">
    <div class="absolute alert-bg left-1 bottom-1" v-if="show">
      <h1
        class="p-2 pl-6 text-pink uppercase flex justify-center items-center whitespace-nowrap"
        v-html="text"
      ></h1>
    </div>
  </transition>
  <transition name="bounce">
    <div
      class="absolute w-full h-full flex flex-col justify-center items-center"
      v-if="modal.active"
    >
      <video v-if="modal.isVideo" autoplay class="w-1/5">
        <source :src="modal.src" />
      </video>
      <img v-else class="w-1/5" :src="modal.src" />
      <h2 class="mt-1 p-2 pl-6 outline text-pink">
        {{ modal.text }}
      </h2>
    </div>
  </transition>
  <div
    class="flex justify-center items-center h-full justify-self-center"
    id="video-wrapper"
    v-if="activeVideo"
  >
    <video
      :key="activeVideo"
      id="active-video"
      class="vidClip"
      autoplay
      style="max-width: 1000px; max-height: 1000px"
    >
      <source :src="`/videos/${activeVideo}.mp4`" />
    </video>
  </div>
  <img v-if="showTTS" class="absolute bottom-20 left-3" src="/images/tts.gif" />
  <audio id="tts-audio" />
</template>
