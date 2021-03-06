import { Vector3D } from '../geom/Vector3D';
import { JMatrix3D } from '../math/JMatrix3D';
import { ISkin3D, RigidBody } from '../physics/RigidBody';

export class JSphere extends RigidBody {
  name = null; // String
  _radius = null; // Number

  constructor(skin: ISkin3D, r) {
    super(skin);

    //jiglib.RigidBody.apply(this, [skin]);
    this._type = 'SPHERE';
    this._radius = r;
    this._boundingSphere = this._radius;
    this.set_mass(1);
    this.updateBoundingBox();
  }

  //jiglib.extend(JSphere, RigidBody);

  set_radius(r) {
    this._radius = r;
    this._boundingSphere = this._radius;
    this.setInertia(this.getInertiaProperties(this.get_mass()));
    this.setActive();
    this.updateBoundingBox();
  }

  get_radius() {
    return this._radius;
  }

  segmentIntersect(out, seg, state) {
    out.frac = 0;
    out.position = new Vector3D();
    out.normal = new Vector3D();

    var frac = 0,
      radiusSq,
      rSq,
      sDotr,
      sSq,
      sigma,
      sigmaSqrt,
      lambda1,
      lambda2;
    var r, s;
    r = seg.delta;
    s = seg.origin.subtract(state.position);

    radiusSq = this._radius * this._radius;
    rSq = r.get_lengthSquared();
    if (rSq < radiusSq) {
      out.frac = 0;
      out.position = seg.origin.clone();
      out.normal = out.position.subtract(state.position);
      out.normal.normalize();
      return true;
    }

    sDotr = s.dotProduct(r);
    sSq = s.get_lengthSquared();
    sigma = sDotr * sDotr - rSq * (sSq - radiusSq);
    if (sigma < 0) {
      return false;
    }
    sigmaSqrt = Math.sqrt(sigma);
    lambda1 = (-sDotr - sigmaSqrt) / rSq;
    lambda2 = (-sDotr + sigmaSqrt) / rSq;
    if (lambda1 > 1 || lambda2 < 0) {
      return false;
    }
    frac = Math.max(lambda1, 0);
    out.frac = frac;
    out.position = seg.getPoint(frac);
    out.normal = out.position.subtract(state.position);
    out.normal.normalize();
    return true;
  }

  getInertiaProperties(m) {
    var Ixx = 0.4 * m * this._radius * this._radius;
    return JMatrix3D.getScaleMatrix(Ixx, Ixx, Ixx);
  }

  updateBoundingBox() {
    this._boundingBox.clear();
    this._boundingBox.addSphere(this); // todo: only when needed like changing the scale?
  }
}
