<script>
import EventQueue from "./js/EventQueue";
import tmi from "tmi.js";
import { useSubStore } from "./stores/subs";

export default {
  data() {
    return {
      client: null,
      opts: {
        channels: [import.meta.env.VITE_TWITCH_CHANNEL],
      },
      broadcaster: import.meta.env.VITE_TWITCH_CHANNEL,
      activeCommands: {},
      spotlightUser: "",
      spotlightEmoji:
        '<img class="emoticon" src="https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_1604443d6fd54998bfe170cc620868a2/default/dark/3.0">',
      eventQueue: new EventQueue(),
      show: false,
      showTTS: false,
      text: "",
      activeVideo: "",
      subs: useSubStore(),
    };
  },
  mounted() {
    this.activeCommands = {
      "!alert": this.alertCommand,
      "!spotlight": this.spotlightCommand,
      "!fin": this.finCommand,
      "!heal": this.soundCommand,
      "!lurk": this.soundCommand,
      "!bong": this.soundCommand,
      "!ding": this.soundCommand,
      "!nice": this.soundCommand,
      "!damage": this.soundCommand,
      "!youa": this.videoCommand,
      "!plat": this.videoCommand,
      "!dont": this.videoCommand,
      "!no": this.videoCommand,
    };

    this.client = new tmi.client(this.opts);
    this.client.on("message", this.onMessageHandler);
    this.client.on("cheer", this.onCheerHandler);
    this.client.on("raided", this.onRaidedHandler);
    this.client.on("connected", this.onConnectedHandler);
    this.client.connect();

    const vm = this;
    setInterval(function () {
      vm.eventQueue.execute();
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
      } else {
        this.onOtherMessages(context, rawText);
      }
    },
    onCheerHandler(channel, userstate, message) {
      const bits = userstate.bits;

      if (bits == 50) {
        return this.playVideo("apparently");
      }

      const beginning = `${userstate["display-name"]} just cheered ${bits} bits `;
      const cleaned = message.replace(/(Cheer\d+)/g, "");
      const theMessage = beginning + cleaned;
      return this.textToSpeech(theMessage);
    },
    onRaidedHandler(channel, username, viewers) {
      return this.textToSpeech(
        `${username} just raided with ${viewers} viewers. Thank you so much! Welcome raiders I'm Fin! You have entered romeboiii's channel! We like to play games and stuff, hope you enjoy yourself here!`
      );
    },
    alertCommand(context, textContent) {
      if (context.mod || context.subscriber) {
        this.spotlightUser = "";
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
      return new Promise((resolve) => {
        const audio = new Audio(`/sounds/${sound}.mp3`);
        audio.play();
        audio.onended = resolve;
      });
    },
    subSound(name) {
      return new Promise((resolve) => {
        this.showText(`${name} has arrived!!!`);
        const audio = new Audio(`/subSounds/${name}.mp3`);
        audio.play();
        audio.onended = () => {
          setTimeout(() => {
            this.showText("");
            resolve();
          }, 3000);
        };
      });
    },
    adminSoundCommand(context, textContent) {
      if (context.mod || context.subscriber) {
        return this.soundCommand(context, textContent);
      }
    },
    broadcasterVideoCommand(context, textContent) {
      if (context.username === this.broadcaster) {
        const videoName =
          textContent.indexOf(" ") > -1
            ? textContent.substring(1, textContent.indexOf(" "))
            : textContent.substring(1);
        return this.playVideo(videoName);
      }
    },
    adminVideoCommand(context, textContent) {
      if (context.mod || context.subscriber) {
        const videoName =
          textContent.indexOf(" ") > -1
            ? textContent.substring(1, textContent.indexOf(" "))
            : textContent.substring(1);
        return this.playVideo(videoName);
      }
    },
    videoCommand(context, textContent) {
      const videoName =
        textContent.indexOf(" ") > -1
          ? textContent.substring(1, textContent.indexOf(" "))
          : textContent.substring(1);
      return this.playVideo(videoName);
    },
    spotlightCommand(context, textContent) {
      if (context.mod || context.subscriber) {
        this.spotlightUser = textContent.substring(12).toLowerCase();
        if (this.spotlightUser.length === 0) {
          this.showText("");
        } else {
          this.showText(
            `${this.spotlightEmoji} Welcome ${this.spotlightUser} to the party crew!`
          );
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
        this.showText(
          `${this.spotlightEmoji} ${context["display-name"]}: ${formattedText}`
        );
      }
      if (context.subscriber && this.subs.doesntHave(context.username)) {
        fetch(`/subSounds/${context.username}.mp3`).then((response) => {
          if (response.ok) {
            this.eventQueue.add(this.subSound, [context.username]);
          }
        });
        this.subs.add(context.username);
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

        const audioTag = document.createElement("AUDIO");
        audioTag.src = src;
        audioTag.id = "tts-audio";
        document.body.appendChild(audioTag);

        const interval = setInterval(function () {
          const element = document.getElementById("tts-audio");
          if (element) {
            vm.showTTS = true;
            setTimeout(function () {
              audioTag.play();
            }, 250);
            clearInterval(interval);
          }
        }, 100);

        audioTag.addEventListener("ended", () => {
          setTimeout(function () {
            vm.showTTS = false;
            document.body.removeChild(audioTag);
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
  },
};
</script>

<template>
  <transition name="bounce">
    <div v-if="show" id="popupbox">
      <div id="popuptext-wrapper">
        <h1 id="popuptext" v-html="text"></h1>
      </div>
    </div>
  </transition>
  <div id="video-wrapper">
    <video
      :key="activeVideo"
      id="active-video"
      autoplay
      style="max-width: 1000px; max-height: 1000px"
    >
      <source v-if="activeVideo !== ''" :src="`/videos/${activeVideo}.mp4`" />
    </video>
  </div>
  <img v-if="showTTS" id="tts" src="/images/tts.gif" />
</template>

<style></style>
