# three-camera-controller [![Circle CI](https://circleci.com/gh/andrewscwei/three-camera-controller/tree/master.svg?style=svg)](https://circleci.com/gh/andrewscwei/three-camera-controller/tree/master) [![npm version](https://badge.fury.io/js/three-camera-controller.svg)](https://badge.fury.io/js/three-camera-controller)

`ThreeCameraController` is a class that binds keyboard/mouse controls to a [`Three.js`](http://threejs.org/) camera. It comes with [`Stats.js`](https://www.npmjs.com/package/stats.js) and its own display which shows the current position and rotation of the target camera. 

`ThreeCameraController` is based on [`FlyControls`](https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_fly.html).

## Usage

```js
import TCC from 'three-camera-controller';

const camera = new THREE.PerspectiveCamera(75, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 10000);
const tcc = new TCC(camera);

...
function render() {
  this.renderer.render(this.scene, this.camera);
  tcc.update();
}
...
```
