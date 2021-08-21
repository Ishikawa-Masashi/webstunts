import { JMatrix3D } from '../math/JMatrix3D';
import { JNumber3D } from '../math/JNumber3D';
import { RigidBody } from '../physics/RigidBody';

export class JCapsule extends RigidBody {
  _length = null; // Number
  _radius = null; // Number
  constructor(skin, r, l) {
    // jiglib.RigidBody.apply(this, [ skin ]);
    super(skin);
    this._type = 'CAPSULE';
    this._radius = r;
    this._length = l;
    this._boundingSphere = this.getBoundingSphere(r, l);
    this.set_mass(1);
    this.updateBoundingBox();
  }

  // jiglib.extend(JCapsule, RigidBody);

  set_radius(r) {
    this._radius = r;
    this._boundingSphere = this.getBoundingSphere(this._radius, this._length);
    this.setInertia(this.getInertiaProperties(this.get_mass()));
    this.updateBoundingBox();
    this.setActive();
  }

  get_radius() {
    return this._radius;
  }

  set_length(l) {
    this._length = l;
    this._boundingSphere = this.getBoundingSphere(this._radius, this._length);
    this.setInertia(this.getInertiaProperties(this.get_mass()));
    this.updateBoundingBox();
    this.setActive();
  }

  get_length() {
    return this._length;
  }

  getBottomPos(state) {
    return state.position.add(
      JNumber3D.getScaleVector(state.getOrientationCols()[1], -this._length / 2)
    );
  }

  getEndPos(state) {
    return state.position.add(
      JNumber3D.getScaleVector(state.getOrientationCols()[1], this._length / 2)
    );
  }

  segmentIntersect(out, seg, state) {
    return false;
  }

  getInertiaProperties(m) {
    var cylinderMass, Ixx, Iyy, Izz, endMass;
    cylinderMass =
      (m * Math.PI * this._radius * this._radius * this._length) /
      this.getVolume();
    Ixx =
      0.25 * cylinderMass * this._radius * this._radius +
      (1 / 12) * cylinderMass * this._length * this._length;
    Iyy = 0.5 * cylinderMass * this._radius * this._radius;
    Izz = Ixx;

    endMass = m - cylinderMass;
    Ixx +=
      0.4 * endMass * this._radius * this._radius +
      endMass * Math.pow(0.5 * this._length, 2);
    Iyy += 0.2 * endMass * this._radius * this._radius;
    Izz +=
      0.4 * endMass * this._radius * this._radius +
      endMass * Math.pow(0.5 * this._length, 2);

    return JMatrix3D.getScaleMatrix(Ixx, Iyy, Izz);
  }

  updateBoundingBox() {
    this._boundingBox.clear();
    this._boundingBox.addCapsule(this);
  }

  getBoundingSphere(r, l) {
    return Math.sqrt(Math.pow(l / 2, 2) + r * r) + r;
  }

  getVolume() {
    return (
      (4 / 3) * Math.PI * this._radius * this._radius * this._radius +
      this._length * Math.PI * this._radius * this._radius
    );
  }
}
