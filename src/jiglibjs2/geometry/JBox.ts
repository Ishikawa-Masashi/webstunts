import { EdgeData } from '../data/EdgeData';
import { SpanData } from '../data/SpanData';
import { Vector3D } from '../geom/Vector3D';
import { JMath3D } from '../math/JMath3D';
import { JMatrix3D } from '../math/JMatrix3D';
import { JNumber3D } from '../math/JNumber3D';
import { ISkin3D, RigidBody } from '../physics/RigidBody';

export class JBox extends RigidBody {
  private _sideLengths: Vector3D = null; // Vector3D
  private _points: Vector3D[] = null; // Vector3D
  private _edges = [
    new EdgeData(0, 1),
    new EdgeData(0, 2),
    new EdgeData(0, 6),
    new EdgeData(2, 3),
    new EdgeData(2, 4),
    new EdgeData(6, 7),
    new EdgeData(6, 4),
    new EdgeData(1, 3),
    new EdgeData(1, 7),
    new EdgeData(3, 5),
    new EdgeData(7, 5),
    new EdgeData(4, 5),
  ]; // EdgeData
  private _face = [
    [[6, 7, 1, 0]],
    [[5, 4, 2, 3]],
    [[3, 1, 7, 5]],
    [[4, 6, 0, 2]],
    [[1, 3, 2, 0]],
    [[7, 6, 4, 5]],
  ];

  constructor(skin: ISkin3D, width: number, depth: number, height: number) {
    super(skin);
    this._type = 'BOX';

    this._sideLengths = new Vector3D(width, height, depth);
    this._boundingSphere = 0.5 * this._sideLengths.get_length();
    this.initPoint();
    this.set_mass(1);
    this.updateBoundingBox();
  }

  initPoint() {
    var halfSide = this.getHalfSideLengths();
    this._points = [];
    this._points[0] = new Vector3D(halfSide.x, -halfSide.y, halfSide.z);
    this._points[1] = new Vector3D(halfSide.x, halfSide.y, halfSide.z);
    this._points[2] = new Vector3D(-halfSide.x, -halfSide.y, halfSide.z);
    this._points[3] = new Vector3D(-halfSide.x, halfSide.y, halfSide.z);
    this._points[4] = new Vector3D(-halfSide.x, -halfSide.y, -halfSide.z);
    this._points[5] = new Vector3D(-halfSide.x, halfSide.y, -halfSide.z);
    this._points[6] = new Vector3D(halfSide.x, -halfSide.y, -halfSide.z);
    this._points[7] = new Vector3D(halfSide.x, halfSide.y, -halfSide.z);
  }

  set_sideLengths(size) {
    this._sideLengths = size.clone();
    this._boundingSphere = 0.5 * this._sideLengths.get_length();
    this.initPoint();
    this.setInertia(this.getInertiaProperties(this.get_mass()));
    this.setActive();
    this.updateBoundingBox();
  }

  get_sideLengths() {
    return this._sideLengths;
  }

  get_edges() {
    return this._edges;
  }

  getVolume() {
    return this._sideLengths.x * this._sideLengths.y * this._sideLengths.z;
  }

  getSurfaceArea() {
    return (
      2 *
      (this._sideLengths.x * this._sideLengths.y +
        this._sideLengths.x * this._sideLengths.z +
        this._sideLengths.y * this._sideLengths.z)
    );
  }

  getHalfSideLengths() {
    return JNumber3D.getScaleVector(this._sideLengths, 0.5);
  }

  getSpan(axis) {
    var cols = this.get_currentState().getOrientationCols();
    var obj = new SpanData();
    let s = Math.abs(axis.dotProduct(cols[0])) * (0.5 * this._sideLengths.x);
    let u = Math.abs(axis.dotProduct(cols[1])) * (0.5 * this._sideLengths.y);
    let d = Math.abs(axis.dotProduct(cols[2])) * (0.5 * this._sideLengths.z);
    let r = s + u + d;
    let p = this.get_currentState().position.dotProduct(axis);
    obj.min = p - r;
    obj.max = p + r;

    return obj;
  }

  getCornerPoints(state) {
    var _points_length = this._points.length;
    var arr = [];

    var transform = JMatrix3D.getTranslationMatrix(
      state.position.x,
      state.position.y,
      state.position.z
    );
    transform = JMatrix3D.getAppendMatrix3D(state.orientation, transform);

    var i = 0;
    for (
      var _points_i = 0, _points_l = this._points.length, _point;
      _points_i < _points_l && (_point = this._points[_points_i]);
      _points_i++
    ) {
      arr[i++] = transform.transformVector(_point);
    }

    return arr;
  }

  getCornerPointsInBoxSpace(thisState, boxState) {
    let max = JMatrix3D.getTransposeMatrix(boxState.orientation);
    var pos = thisState.position.subtract(boxState.position);
    pos = max.transformVector(pos);

    let orient = JMatrix3D.getAppendMatrix3D(thisState.orientation, max);

    var arr: Vector3D[] = [];

    let transform = JMatrix3D.getTranslationMatrix(pos.x, pos.y, pos.z);
    transform = JMatrix3D.getAppendMatrix3D(orient, transform);

    var i = 0;
    for (let _point of this._points)
      arr[i++] = transform.transformVector(_point);

    return arr;
  }

  getSqDistanceToPoint(state, closestBoxPoint, point) {
    var delta = 0,
      sqDistance = 0;

    let _closestBoxPoint = point.subtract(state.position);
    _closestBoxPoint = JMatrix3D.getTransposeMatrix(
      state.orientation
    ).transformVector(_closestBoxPoint);

    let halfSideLengths = this.getHalfSideLengths();

    if (_closestBoxPoint.x < -halfSideLengths.x) {
      delta = _closestBoxPoint.x + halfSideLengths.x;
      sqDistance += delta * delta;
      _closestBoxPoint.x = -halfSideLengths.x;
    } else if (_closestBoxPoint.x > halfSideLengths.x) {
      delta = _closestBoxPoint.x - halfSideLengths.x;
      sqDistance += delta * delta;
      _closestBoxPoint.x = halfSideLengths.x;
    }

    if (_closestBoxPoint.y < -halfSideLengths.y) {
      delta = _closestBoxPoint.y + halfSideLengths.y;
      sqDistance += delta * delta;
      _closestBoxPoint.y = -halfSideLengths.y;
    } else if (_closestBoxPoint.y > halfSideLengths.y) {
      delta = _closestBoxPoint.y - halfSideLengths.y;
      sqDistance += delta * delta;
      _closestBoxPoint.y = halfSideLengths.y;
    }

    if (_closestBoxPoint.z < -halfSideLengths.z) {
      delta = _closestBoxPoint.z + halfSideLengths.z;
      sqDistance += delta * delta;
      _closestBoxPoint.z = -halfSideLengths.z;
    } else if (_closestBoxPoint.z > halfSideLengths.z) {
      delta = _closestBoxPoint.z - halfSideLengths.z;
      sqDistance += delta * delta;
      _closestBoxPoint.z = halfSideLengths.z;
    }
    _closestBoxPoint = state.orientation.transformVector(_closestBoxPoint);
    closestBoxPoint[0] = state.position.add(_closestBoxPoint);
    return sqDistance;
  }

  getDistanceToPoint(state, closestBoxPoint, point) {
    return Math.sqrt(this.getSqDistanceToPoint(state, closestBoxPoint, point));
  }

  pointIntersect(pos) {
    var p, h, dirVec;

    p = pos.subtract(this.get_currentState().position);
    h = JNumber3D.getScaleVector(this._sideLengths, 0.5);

    var cols = this.get_currentState().getOrientationCols();
    for (var dir; dir < 3; dir++) {
      dirVec = cols[dir].clone();
      dirVec.normalize();
      if (
        Math.abs(dirVec.dotProduct(p)) >
        JNumber3D.toArray(h)[dir] + JMath3D.NUM_TINY
      ) {
        return false;
      }
    }
    return true;
  }

  segmentIntersect(out, seg, state) {
    out.frac = 0;
    out.position = new Vector3D();
    out.normal = new Vector3D();

    var tiny = JMath3D.NUM_TINY,
      huge = JMath3D.NUM_HUGE,
      dirMin = 0,
      dirMax = 0,
      dir = 0,
      e,
      f,
      t,
      t1,
      t2,
      directionVectorNumber;

    let frac = huge;
    let min = -huge;
    let max = huge;
    let p = state.position.subtract(seg.origin);
    let h = JNumber3D.getScaleVector(this._sideLengths, 0.5);

    var orientationCol = state.getOrientationCols();
    var directionVectorArray = JNumber3D.toArray(h);
    for (dir = 0; dir < 3; dir++) {
      directionVectorNumber = directionVectorArray[dir];
      e = orientationCol[dir].dotProduct(p);
      f = orientationCol[dir].dotProduct(seg.delta);
      if (Math.abs(f) > tiny) {
        t1 = (e + directionVectorNumber) / f;
        t2 = (e - directionVectorNumber) / f;
        if (t1 > t2) {
          t = t1;
          t1 = t2;
          t2 = t;
        }
        if (t1 > min) {
          min = t1;
          dirMin = dir;
        }
        if (t2 < max) {
          max = t2;
          dirMax = dir;
        }
        if (min > max) return false;
        if (max < 0) return false;
      } else if (
        -e - directionVectorNumber > 0 ||
        -e + directionVectorNumber < 0
      ) {
        return false;
      }
    }

    if (min > 0) {
      dir = dirMin;
      frac = min;
    } else {
      dir = dirMax;
      frac = max;
    }
    if (frac < 0) frac = 0;
    /*if (frac > 1)
                frac = 1;*/
    if (frac > 1 - tiny) {
      return false;
    }
    out.frac = frac;
    out.position = seg.getPoint(frac);
    if (orientationCol[dir].dotProduct(seg.delta) < 0) {
      out.normal = JNumber3D.getScaleVector(orientationCol[dir], -1);
    } else {
      out.normal = orientationCol[dir];
    }
    return true;
  }

  getInertiaProperties(m) {
    return JMatrix3D.getScaleMatrix(
      (m / 12) *
        (this._sideLengths.y * this._sideLengths.y +
          this._sideLengths.z * this._sideLengths.z),
      (m / 12) *
        (this._sideLengths.x * this._sideLengths.x +
          this._sideLengths.z * this._sideLengths.z),
      (m / 12) *
        (this._sideLengths.x * this._sideLengths.x +
          this._sideLengths.y * this._sideLengths.y)
    );
  }

  updateBoundingBox() {
    this._boundingBox.clear();
    this._boundingBox.addBox(this);
  }
}
