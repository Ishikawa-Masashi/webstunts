import { JBox } from '../geometry/JBox';
import { ISkin3D } from '../physics/RigidBody';
import { JCar } from './JCar';

export class JChassis extends JBox {
  _car = null; // JCar
  constructor(
    car: JCar,
    skin: ISkin3D = null,
    width = null,
    depth = null,
    height = null
  ) {
    super(skin, width, depth, height);
    this._car = car;
  }

  get_car() {
    return this._car;
  }

  postPhysics(dt) {
    super.postPhysics(dt);
    this._car.addExternalForces(dt);
    this._car.postPhysics(dt);
  }
}
