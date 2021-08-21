import { Vector3D } from '../geom/Vector3D';
import { JMath3D } from '../math/JMath3D';
import { RigidBody } from '../physics/RigidBody';

export class JPlane extends RigidBody {
  _initNormal = null; // Vector3D
  _normal = null; // Vector3D
  _distance = null; // Number
  constructor(skin, initNormal) {
    super(skin);
    // jiglib.RigidBody.apply(this, [ skin ]);

    this._initNormal = initNormal ? initNormal.clone() : new Vector3D(0, 0, -1);
    this._normal = this._initNormal.clone();

    this._distance = 0;
    this.set_movable(false);

    var huge = JMath3D.NUM_HUGE;
    this._boundingBox.minPos = new Vector3D(-huge, -huge, -huge);
    this._boundingBox.maxPos = new Vector3D(huge, huge, huge);

    this._type = 'PLANE';
  }

  // jiglib.extend(JPlane, RigidBody);

  get_normal() {
    return this._normal;
  }

  get_distance() {
    return this._distance;
  }

  pointPlaneDistance(pt) {
    return this._normal.dotProduct(pt) - this._distance;
  }

  segmentIntersect(out, seg, state) {
    out.frac = 0;
    out.position = new Vector3D();
    out.normal = new Vector3D();

    var frac = 0,
      t,
      denom;

    denom = this._normal.dotProduct(seg.delta);
    if (Math.abs(denom) > JMath3D.NUM_TINY) {
      t = (-1 * (this._normal.dotProduct(seg.origin) - this._distance)) / denom;

      if (t < 0 || t > 1) {
        return false;
      } else {
        frac = t;
        out.frac = frac;
        out.position = seg.getPoint(frac);
        out.normal = this._normal.clone();
        out.normal.normalize();
        return true;
      }
    } else {
      return false;
    }
  }

  updateState() {
    super.updateState();

    this._normal = this._currState.orientation.transformVector(
      this._initNormal
    );
    this._distance = this._currState.position.dotProduct(this._normal);
  }
}
