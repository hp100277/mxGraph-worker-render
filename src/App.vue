<template>
  <div id="app">
    <button @click="onClick">Test</button>
    <canvas ref="canvas" />
  </div>
</template>

<script>
import RenderWorker from "./graph-render-worker";
export default {
  methods: {
    onClick() {
      RenderWorker.send({ msg: "hello!!" }).then((result) => {
        console.log(result);
      });
    },
  },
};
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;

}
</style>
