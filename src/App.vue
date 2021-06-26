<template>
  <div id="app">
    <div class="action">
      <button @click="onTestClick">Test</button>
      <button @click="onInitCanvasClick">Init Canvas</button>
    </div>
    <canvas ref="canvas" />
  </div>
</template>

<script>
import RenderWorker from "./graph-render-worker";
export default {
  methods: {
    onTestClick() {
      RenderWorker.send({ msg: "hello!!" }).then((result) => {
        console.log(result);
      });
    },
    onInitCanvasClick() {
      let offscreen = this.$refs.canvas.transferControlToOffscreen();
      RenderWorker.initCanvas(offscreen).then((result) => {
        console.log(result);
      });
    },
  },
};
</script>
<style>
html,
body,
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0;
  margin: 0;
}
</style>
<style scoped>
.action {
  position: absolute;
  top: 12px;
  left: 12px;
}

.action button + button {
  margin-left: 6px;
}
</style>
