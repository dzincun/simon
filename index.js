var audioContext = new (window.AudioContext || window.webkitAudioContext)();
var ramp = 0.05;
var vol = 0.5;
var errorFreq = 190;
var successFreq = 1200;

var errorSound = gainSound(newSound(errorFreq));
var successSound = gainSound(newSound(successFreq));
function playOkSound(){
  successSound.gain.value = 1;
  setTimeout(() => successSound.gain.value = 0, 200);
}
function playErrorSound(){
  errorSound.gain.value = 1;
  setTimeout(() => errorSound.gain.value = 0, 200);
}
function newSound(freq){
  var osc = audioContext.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.start(0.0);
  return osc;
}
function gainSound(sound){
  var g = audioContext.createGain();
  sound.connect(g);
  g.connect(audioContext.destination);
  g.gain.value = 0;
  return g;
}

Vue.component("press", {
  template: `
    <button class="bigbutton button" 
            :class="{on: active}" 
            v-on:mousedown="emitSound" 
            v-on:mouseup="stop"
            
            >
      <slot></slot>
    </button>
  `,
  props: ['keyPress', 'freq', 'playThis', 'id'],
  computed: {
    sound: function() {
        return newSound(this.freq);
      },
      gain: function() {
        return gainSound(this.sound);
      }
  },
  watch: {
    playThis: function(){
      this.playThis ? this.play() : this.stop();
    }
  },
  data: function() {
    return {
      active: false
    }
  },
  methods: {
    emitSound: function(){
      this.$emit("addsound", this.id);
      this.play();
    },
    play: function(){
      this.active = true;
      return this.gain.gain.value = vol;
    },
    stop: function(){
      this.active = false;
      return this.gain.gain.value = 0;
    }
  }
});
var vm = new Vue({
  el: "#simon",
  data: {
    notes: [523,587,659,698],
    sequence: Array.apply(null, { length: 20 }),
    playSeq: null,
    running: false,
    position: 1,
    strict: false,
    userSeq: [],
    inter: null,
    listening: false,
    message: ""
  },
  mounted: function(){
    return this.newSequence();
  },
  methods: {
    newSequence: function() {
          this.sequence = this.sequence.map( (x) => Math.floor(Math.random()*this.notes.length));
    },
    addSound: function(id){
      if (this.listening) { 
        clearTimeout(this.waitTimer);
        this.userSeq.push(id);
        
        if (this.userSeq.length<this.position) {
          this.waitTimer = setTimeout(()=>{
            return this.matchError();
          },3000);
        } else {
          this.listening = false;
          if (this.checkMatch()) {
             return this.matchOK(); 
          }
          return this.matchError();
        }
      }
    },
    matchOK: function(){
      if (this.position < this.sequence.length) {
        this.message = "Good!";
        this.userSeq = [];
        setTimeout(() => playOkSound(), 1000);
        this.position++;
        setTimeout(() => this.start(), 2000);  
      } else {
        this.message = "Completed!";
        setTimeout(() => this.reset(), 4000); 
      }
    },
    matchError: function(){
      this.message = "Try again! Your Result: " + (this.position - 1);
      this.userSeq = [];
      if (this.strict) {
        this.position = 1;
        this.newSequence();
      }
      setTimeout(() => playErrorSound(), 1000);
      setTimeout(() => this.start(), 2000);
    },
    checkMatch: function() {
      for (var i=0; i<this.position;i++) {
        if (this.userSeq[i] !== this.sequence[i]) return false;
      }
      return true;
    },
    start: function() {
      if (!this.running) {
        var i=0;
        this.message = "";
        this.inter = setInterval(function() {
          vm.running = true;
          vm.playSeq = vm.sequence[i];
          setTimeout(()=>vm.playSeq=null, 500);
          i++;  
          if (i == vm.position) {
            clearInterval(vm.inter);
            setTimeout(() => vm.running = false, 500);
            vm.listening = true;
            vm.waitTimer = setTimeout(()=>{
              vm.userSeq = [];
              vm.listening = false;
              if (vm.strict) vm.position = 1;
              vm.message = "Time out!";
              setTimeout(() => playErrorSound(), 1000);
            },3000);
          } 
        },800);
      } else {
        this.reset();
      }  
    },
    reset: function() {
      clearInterval(this.inter);
      this.playSeq = null;
      this.running = false;
      this.listening = false;
      this.position = 1;
      this.userSeq = [];
      this.message = "";
      this.newSequence();
    }
  }
});