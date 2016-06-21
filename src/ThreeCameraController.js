// (c) Andrew Wei, based on `three/examples/js/controls/FlyControls.js` by James Baicoianu.

import Stats from 'stats.js';
import THREE from 'three';

const DEFAULT_Z = 600;
const DEFAULT_MOVEMENT_SPEED = 1000;
const DEFAULT_ROLL_SPEED = Math.PI / 12;

class ThreeCameraController {
  /**
   * Target camera object to control.
   *
   * @type {Object}
   */
  get camera() { return this.__private__.camera; }
  set camera(val) { this.__private__.camera = val; }

  /**
   * DOM element containing the scene that renders the camera. Defaults to
   * `document`.
   *
   * @return {Element}
   */
  get element() { return this.__private__.element || document; }
  set element(val) { this.__private__.element = val; if (val) this.__private__.element.setAttribute('tabindex', -1); }

  /**
   * Internal clock.
   *
   * @return {Object}
   */
  get clock() {
    if (this.__private__.clock) return this.__private__.clock;
    this.__private__.clock = new THREE.Clock();
    return this.__private__.clock;
  }

  /**
   * Camera movement speed.
   *
   * @return {number}
   */
  get movementSpeed() { return (isNaN(this.__private__.movementSpeed) ? DEFAULT_MOVEMENT_SPEED : this.__private__.movementSpeed); }
  set movementSpeed(val) { this.__private__.movementSpeed = val; }

  /**
   * Camera rotation speed.
   *
   * @return {number}
   */
  get rollSpeed() { return (isNaN(this.__private__.rollSpeed) ? DEFAULT_ROLL_SPEED : this.__private__.rollSpeed); }
  set rollSpeed(val) { this.__private__.rollSpeed = val; }

  /**
   * Specifies whether the camera can be dragged to look around.
   *
   * @return {boolean}
   */
  get dragToLook() { return this.__private__.dragToLook; }
  set dragToLook(val) { this.__private__.dragToLook = val; }

  /**
   * Specifies whether the camera automatically moves forward at the current
   * movement speed.
   *
   * @return {number}
   */
  get autoForward() { return this.__private__.autoForward; }
  set autoForward(val) { this.__private__.autoForward = val; }

  /**
   * Specifies whether mouse controls are enabled.
   *
   * @return {boolean}
   */
  get mouseInteractive() { return this.__private__.mouseInteractive; }
  set mouseInteractive(val) { this.__private__.mouseInteractive = val; }

  /**
   * Performance monitor.
   *
   * @see {@link https://www.npmjs.com/package/stats.js}
   *
   * @return {Object}
   */
  get stats() {
    if (this.__private__.stats) return this.__private__.stats;
    let stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    this.__private__.stats = stats;
    return stats;
  }

  /**
   * DOM element displays the current camera position and rotation.
   *
   * @return {Element}
   */
  get display() {
    if (this.__private__.display) return this.__private__.display;
    let display = document.createElement('div');
    let backgroundColor = '#520a6f';
    let foregroundColor = '#ff7ed4';
    display.style['width'] = '80px';
    display.style['height'] = '48px';
    display.style['padding'] = `16px 3px 3px 3px`;
    display.style['box-sizing'] = 'border-box';
    display.style['position'] = 'fixed';
    display.style['top'] = '0px';
    display.style['left'] = '80px';
    display.style['cursor'] = 'pointer';
    display.style['opacity'] = '0.9';
    display.style['z-index'] = '10000';
    display.style['background'] = backgroundColor;
    display.titleElement = display.appendChild(document.createElement('span'));
    display.titleElement.style['top'] = `3px`;
    display.titleElement.style['left'] = `2px`;
    display.titleElement.style['white-space'] = `nowrap`;
    display.titleElement.style['overflow'] = `hidden`;
    display.titleElement.style['font'] = `bolder 9px Helvetica,Arial,sans-serif`;
    display.titleElement.style['color'] = foregroundColor;
    display.titleElement.style['position'] = 'absolute';
    display.titleElement.style['display'] = 'block';
    display.titleElement.innerHTML = 'CAMERA';
    display.innerFrame = display.appendChild(document.createElement('div'));
    display.innerFrame.style['top'] = '15px';
    display.innerFrame.style['left'] = '2px';
    display.innerFrame.style['width'] = `${80-2*2}px`;
    display.innerFrame.style['height'] = `${48-15-2}px`;
    display.innerFrame.style['position'] = 'absolute';
    display.innerFrame.style['background'] = '#fff';
    display.innerFrame.style['opacity'] = '0.1';
    display.xElement = display.appendChild(document.createElement('span'));
    display.yElement = display.appendChild(document.createElement('span'));
    display.zElement = display.appendChild(document.createElement('span'));
    display.xElement.style['width'] = display.yElement.style['width'] = display.zElement.style['width'] = `100%`;
    display.xElement.style['white-space'] = display.yElement.style['white-space'] = display.zElement.style['white-space'] = `nowrap`;
    display.xElement.style['overflow'] = display.yElement.style['overflow'] = display.zElement.style['overflow'] = `hidden`;
    display.xElement.style['text-overflow'] = display.yElement.style['text-overflow'] = display.zElement.style['text-overflow'] = `ellipsis`;
    display.xElement.style['font'] = display.yElement.style['font'] = display.zElement.style['font'] = `bolder 9px Helvetica,Arial,sans-serif`;
    display.xElement.style['color'] = display.yElement.style['color'] = display.zElement.style['color'] = foregroundColor;
    display.xElement.style['vertical-align'] = display.yElement.style['vertical-align'] = display.zElement.style['vertical-align'] = 'text-top';
    display.xElement.style['position'] = display.yElement.style['position'] = display.zElement.style['position'] = 'relative';
    display.xElement.style['display'] = display.yElement.style['display'] = display.zElement.style['display'] = 'block';
    this.__private__.display = display;
    return display;
  }

  /**
   * Creates a new ThreeCameraController instance.
   *
   * @param {Object} camera - Target camera object to apply controls to.
   * @param {Element} [element] - DOM element that houses the scene which
   *                              renders the target camera. Optional. Defaults
   *                              to `document`.
   *
   * @constructor
   */
  constructor(camera, element) {
    this.__private__ = {};

    this.camera = camera;
    this.element = element;

    this.__private__.quaternion = new THREE.Quaternion();
    this.__private__.moveStatus = 0;
    this.__private__.moveVector = new THREE.Vector3(0, 0, 0);
    this.__private__.rotationVector = new THREE.Vector3(0, 0, 0);
    this.__private__.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };

    this.init();
  }

  /**
   * Initializes this ThreeCameraController instance.
   */
  init() {
    this.__private__.contextMenuHandler = (event) => event.preventDefault();
    this.__private__.mouseMoveHandler = this.onMouseMove.bind(this);
    this.__private__.mouseDownHandler = this.onMouseDown.bind(this);
    this.__private__.mouseUpHandler = this.onMouseUp.bind(this);
    this.__private__.keyDownHandler = this.onKeyDown.bind(this);
    this.__private__.keyUpHandler = this.onKeyUp.bind(this);
    this.__private__.resetHandler = (event) => this.reset();

    this.element.addEventListener('contextmenu', this.__private__.contextMenuHandler);
    this.element.addEventListener('mousemove', this.__private__.mouseMoveHandler);
    this.element.addEventListener('mousedown', this.__private__.mouseDownHandler);
    this.element.addEventListener('mouseup',   this.__private__.mouseUpHandler);

    this.display.addEventListener('click', this.__private__.resetHandler);

    window.addEventListener('keydown', this.__private__.keyDownHandler);
    window.addEventListener('keyup', this.__private__.keyUpHandler);

    document.body.appendChild(this.stats.dom);
    document.body.appendChild(this.display);

    this.reset();

    setTimeout(() => {
      this.updateMovementVector();
      this.updateRotationVector();
    }, 0);
  }

  /**
   * Destroys this ThreeCameraController instance.
   */
  destroy() {
    this.element.removeEventListener('contextmenu', this.__private__.contextMenuHandler);
    this.element.removeEventListener('mousedown', this.__private__.mouseDownHandler);
    this.element.removeEventListener('mousemove', this.__private__.mouseMoveHandler);
    this.element.removeEventListener('mouseup', this.__private__.mouseUpHandler);

    this.display.removeEventListener('click', this.__private__.resetHandler);

    window.removeEventListener('keydown', this.__private__.keyDownHandler);
    window.removeEventListener('keyup', this.__private__.keyUpHandler);

    this.__private__.contextMenuHandler = undefined;
    this.__private__.mouseMoveHandler = undefined;
    this.__private__.mouseDownHandler = undefined;
    this.__private__.mouseUpHandler = undefined;
    this.__private__.keyDownHandler = undefined;
    this.__private__.keyUpHandler = undefined;
  }

  /**
   * Resets the camera position and rotation to default.
   */
  reset() {
    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.camera.position.z = DEFAULT_Z;
    this.camera.rotation.x = 0;
    this.camera.rotation.y = 0;
    this.camera.rotation.z = 0;
  }

  /**
   * Handler invoked when a key is pressed down.
   *
   * @param  {Event} event
   */
  onKeyDown(event) {
    if (event.altKey) return;

    switch (event.keyCode) {
      case 16: /* shift */ this.movementSpeedMultiplier = .1; break;
      case 87: /*W*/ this.__private__.moveState.forward = 1; break;
      case 83: /*S*/ this.__private__.moveState.back = 1; break;
      case 65: /*A*/ this.__private__.moveState.left = 1; break;
      case 68: /*D*/ this.__private__.moveState.right = 1; break;
      case 82: /*R*/ this.__private__.moveState.up = 1; break;
      case 70: /*F*/ this.__private__.moveState.down = 1; break;
      case 38: /*up*/ this.__private__.moveState.pitchUp = 1; break;
      case 40: /*down*/ this.__private__.moveState.pitchDown = 1; break;
      case 37: /*left*/ this.__private__.moveState.yawLeft = 1; break;
      case 39: /*right*/ this.__private__.moveState.yawRight = 1; break;
      case 81: /*Q*/ this.__private__.moveState.rollLeft = 1; break;
      case 69: /*E*/ this.__private__.moveState.rollRight = 1; break;
    }

    this.updateMovementVector();
    this.updateRotationVector();
  }

  /**
   * Handler invoked when a key is released.
   *
   * @param  {Event} event
   */
  onKeyUp(event) {
    switch (event.keyCode) {
      case 16: /* shift */ this.movementSpeedMultiplier = 1; break;
      case 87: /*W*/ this.__private__.moveState.forward = 0; break;
      case 83: /*S*/ this.__private__.moveState.back = 0; break;
      case 65: /*A*/ this.__private__.moveState.left = 0; break;
      case 68: /*D*/ this.__private__.moveState.right = 0; break;
      case 82: /*R*/ this.__private__.moveState.up = 0; break;
      case 70: /*F*/ this.__private__.moveState.down = 0; break;
      case 38: /*up*/ this.__private__.moveState.pitchUp = 0; break;
      case 40: /*down*/ this.__private__.moveState.pitchDown = 0; break;
      case 37: /*left*/ this.__private__.moveState.yawLeft = 0; break;
      case 39: /*right*/ this.__private__.moveState.yawRight = 0; break;
      case 81: /*Q*/ this.__private__.moveState.rollLeft = 0; break;
      case 69: /*E*/ this.__private__.moveState.rollRight = 0; break;
    }

    this.updateMovementVector();
    this.updateRotationVector();
  }

  /**
   * Handler invoked when the mouse is pressed down.
   *
   * @param  {Event} event
   */
  onMouseDown(event) {
    if (this.element !== document) this.element.focus();

    event.preventDefault();
    event.stopPropagation();

    if (!this.mouseInteractive) return;

    if (this.dragToLook) {
      this.__private__.moveStatus ++;
    }
    else {
      switch (event.button) {
        case 0: this.__private__.moveState.forward = 1; break;
        case 2: this.__private__.moveState.back = 1; break;
      }

      this.updateMovementVector();
    }
  }

  /**
   * Handler invoked when the mouse moves.
   *
   * @param  {Event} event
   */
  onMouseMove(event) {
    if (!this.mouseInteractive) return;

    if (! this.dragToLook || this.__private__.moveStatus > 0) {
      let container = (this.element !== document) ? {
        size: [this.element.offsetWidth, this.element.offsetHeight],
        offset: [this.element.offsetLeft, this.element.offsetTop]
      } : {
        size : [window.innerWidth, window.innerHeight],
        offset: [0, 0]
      };

      let halfWidth  = container.size[0] / 2;
      let halfHeight = container.size[1] / 2;

      this.__private__.moveState.yawLeft = -((event.pageX - container.offset[0]) - halfWidth ) / halfWidth;
      this.__private__.moveState.pitchDown = ((event.pageY - container.offset[1]) - halfHeight) / halfHeight;

      this.updateRotationVector();
    }
  }

  /**
   * Handler invoked when the mouse is released.
   *
   * @param  {Event} event
   */
  onMouseUp(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.mouseInteractive) return;

    if (this.dragToLook) {
      this.__private__.moveStatus --;
      this.__private__.moveState.yawLeft = this.__private__.moveState.pitchDown = 0;
    }
    else {
      switch (event.button) {
        case 0: this.__private__.moveState.forward = 0; break;
        case 2: this.__private__.moveState.back = 0; break;
      }

      this.updateMovementVector();
    }

    this.updateRotationVector();
  }

  /**
   * Method to be manually invoked to render this ThreeCameraController
   * instance.
   *
   * @param  {number} [delta] - Time elapsed since last update (auto handled if
   *                          unspecified).
   */
  update(delta) {
    if (isNaN(delta)) delta = this.clock.getDelta();

    let moveMult = delta * this.movementSpeed;
    let rotMult = delta * this.rollSpeed;

    this.camera.translateX(this.__private__.moveVector.x * moveMult);
    this.camera.translateY(this.__private__.moveVector.y * moveMult);
    this.camera.translateZ(this.__private__.moveVector.z * moveMult);

    this.__private__.quaternion.set(this.__private__.rotationVector.x * rotMult, this.__private__.rotationVector.y * rotMult, this.__private__.rotationVector.z * rotMult, 1).normalize();
    this.camera.quaternion.multiply(this.__private__.quaternion);

    // expose the rotation vector for convenience
    this.camera.rotation.setFromQuaternion(this.camera.quaternion, this.camera.rotation.order);

    this.display.xElement.innerHTML = `${this.camera.position.x.toFixed(3)} / ${this.camera.rotation.x.toFixed(3)}`;
    this.display.yElement.innerHTML = `${this.camera.position.y.toFixed(3)} / ${this.camera.rotation.y.toFixed(3)}`;
    this.display.zElement.innerHTML = `${this.camera.position.z.toFixed(3)} / ${this.camera.rotation.z.toFixed(3)}`;

    this.stats.update();
  }

  /**
   * Updates the movement vector which defines the current moving direction of
   * the camera.
   */
  updateMovementVector() {
    let forward = (this.__private__.moveState.forward || (this.autoForward && ! this.__private__.moveState.back)) ? 1 : 0;

    this.__private__.moveVector.x = (-this.__private__.moveState.left + this.__private__.moveState.right);
    this.__private__.moveVector.y = (-this.__private__.moveState.down + this.__private__.moveState.up);
    this.__private__.moveVector.z = (-forward + this.__private__.moveState.back);
  }

  /**
   * Updates the rotation vector which defines the current rotating direction of
   * the camera.
   */
  updateRotationVector() {
    this.__private__.rotationVector.x = (-this.__private__.moveState.pitchDown + this.__private__.moveState.pitchUp);
    this.__private__.rotationVector.y = (-this.__private__.moveState.yawRight + this.__private__.moveState.yawLeft);
    this.__private__.rotationVector.z = (-this.__private__.moveState.rollRight + this.__private__.moveState.rollLeft);
  }
}

export default ThreeCameraController;
