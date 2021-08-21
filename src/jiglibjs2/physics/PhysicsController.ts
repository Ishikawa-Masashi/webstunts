export class PhysicsController {
  _controllerEnabled: boolean;
  constructor() {
    this._controllerEnabled = null; // Boolean

    this._controllerEnabled = false;
  }

  updateController(dt) {}

  enableController() {}

  disableController() {}

  get_controllerEnabled() {
    return this._controllerEnabled;
  }
}
