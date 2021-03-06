import { CollOutData } from '../data/CollOutData';
import { PlaneData } from '../data/PlaneData';
import { SpanData } from '../data/SpanData';
import { Vector3D } from '../geom/Vector3D';
import { JMath3D } from '../math/JMath3D';

export class JTriangle {
  origin: Vector3D = null; // Vector3D
  edge0: Vector3D = null; // Vector3D
  edge1: Vector3D = null; // Vector3D
  constructor(pt0: Vector3D, pt1: Vector3D, pt2: Vector3D) {
    this.origin = pt0.clone();
    this.edge0 = pt1.subtract(pt0);
    this.edge1 = pt2.subtract(pt0);
  }

  get_edge2() {
    return this.edge1.subtract(this.edge0);
  }

  get_normal() {
    let N = this.edge0.crossProduct(this.edge1);
    N.normalize();
    return N;
  }

  get_plane() {
    let pl = new PlaneData();
    pl.setWithNormal(this.origin, this.get_normal());

    return pl;
  }

  getPoint(t0, t1) {
    let d0 = this.edge0.clone();
    let d1 = this.edge1.clone();

    d0.scaleBy(t0);
    d1.scaleBy(t1);

    return this.origin.add(d0).add(d1);
  }

  getCentre() {
    let result = this.edge0.add(this.edge1);
    result.scaleBy(0.333333);
    return this.origin.add(result);
  }

  getVertex(_id) {
    switch (_id) {
      case 1:
        return this.origin.add(this.edge0);
      case 2:
        return this.origin.add(this.edge1);
      default:
        return this.origin;
    }
  }

  getSpan(axis) {
    let d0 = this.getVertex(0).dotProduct(axis);
    let d1 = this.getVertex(1).dotProduct(axis);
    let d2 = this.getVertex(2).dotProduct(axis);

    let result = new SpanData();
    result.min = Math.min(d0, d1, d2);
    result.max = Math.max(d0, d1, d2);

    return result;
  }

  segmentTriangleIntersection(out: CollOutData, seg) {
    let p = seg.delta.crossProduct(this.edge1);
    let a = this.edge0.dotProduct(p);

    if (a > -JMath3D.NUM_TINY && a < JMath3D.NUM_TINY) {
      return false;
    }
    let f = 1 / a;
    let s = seg.origin.subtract(this.origin);
    let u = f * s.dotProduct(p);

    if (u < 0 || u > 1) return false;

    let q = s.crossProduct(this.edge0);
    let v = f * seg.delta.dotProduct(q);
    if (v < 0 || u + v > 1) return false;

    let t = f * this.edge1.dotProduct(q);
    if (t < 0 || t > 1) return false;

    if (out) out.frac = t;
    return true;
  }

  pointTriangleDistanceSq(out, point) {
    var fSqrDist;

    let kDiff = this.origin.subtract(point);
    let fA00 = this.edge0.get_lengthSquared();
    let fA01 = this.edge0.dotProduct(this.edge1);
    let fA11 = this.edge1.get_lengthSquared();
    let fB0 = kDiff.dotProduct(this.edge0);
    let fB1 = kDiff.dotProduct(this.edge1);
    let fC = kDiff.get_lengthSquared();
    let fDet = Math.abs(fA00 * fA11 - fA01 * fA01);
    let fS = fA01 * fB1 - fA11 * fB0;
    let fT = fA01 * fB0 - fA00 * fB1;

    if (fS + fT <= fDet) {
      if (fS < 0) {
        if (fT < 0) {
          // region 4
          if (fB0 < 0) {
            fT = 0;
            if (-fB0 >= fA00) {
              fS = 1;
              fSqrDist = fA00 + 2 * fB0 + fC;
            } else {
              fS = -fB0 / fA00;
              fSqrDist = fB0 * fS + fC;
            }
          } else {
            fS = 0;
            if (fB1 >= 0) {
              fT = 0;
              fSqrDist = fC;
            } else if (-fB1 >= fA11) {
              fT = 1;
              fSqrDist = fA11 + 2 * fB1 + fC;
            } else {
              fT = -fB1 / fA11;
              fSqrDist = fB1 * fT + fC;
            }
          }
        } // region 3
        else {
          fS = 0;
          if (fB1 >= 0) {
            fT = 0;
            fSqrDist = fC;
          } else if (-fB1 >= fA11) {
            fT = 1;
            fSqrDist = fA11 + 2 * fB1 + fC;
          } else {
            fT = -fB1 / fA11;
            fSqrDist = fB1 * fT + fC;
          }
        }
      } else if (fT < 0) {
        // region 5
        fT = 0;
        if (fB0 >= 0) {
          fS = 0;
          fSqrDist = fC;
        } else if (-fB0 >= fA00) {
          fS = 1;
          fSqrDist = fA00 + 2 * fB0 + fC;
        } else {
          fS = -fB0 / fA00;
          fSqrDist = fB0 * fS + fC;
        }
      } // region 0
      else {
        // minimum at interior point
        var fInvDet = 1 / fDet;
        fS *= fInvDet;
        fT *= fInvDet;
        fSqrDist =
          fS * (fA00 * fS + fA01 * fT + 2 * fB0) +
          fT * (fA01 * fS + fA11 * fT + 2 * fB1) +
          fC;
      }
    } else {
      var fTmp0, fTmp1, fNumer, fDenom;

      if (fS < 0) {
        // region 2
        fTmp0 = fA01 + fB0;
        fTmp1 = fA11 + fB1;
        if (fTmp1 > fTmp0) {
          fNumer = fTmp1 - fTmp0;
          fDenom = fA00 - 2 * fA01 + fA11;
          if (fNumer >= fDenom) {
            fS = 1;
            fT = 0;
            fSqrDist = fA00 + 2 * fB0 + fC;
          } else {
            fS = fNumer / fDenom;
            fT = 1 - fS;
            fSqrDist =
              fS * (fA00 * fS + fA01 * fT + 2 * fB0) +
              fT * (fA01 * fS + fA11 * fT + 2 * fB1) +
              fC;
          }
        } else {
          fS = 0;
          if (fTmp1 <= 0) {
            fT = 1;
            fSqrDist = fA11 + 2 * fB1 + fC;
          } else if (fB1 >= 0) {
            fT = 0;
            fSqrDist = fC;
          } else {
            fT = -fB1 / fA11;
            fSqrDist = fB1 * fT + fC;
          }
        }
      } else if (fT < 0) {
        // region 6
        fTmp0 = fA01 + fB1;
        fTmp1 = fA00 + fB0;
        if (fTmp1 > fTmp0) {
          fNumer = fTmp1 - fTmp0;
          fDenom = fA00 - 2 * fA01 + fA11;
          if (fNumer >= fDenom) {
            fT = 1;
            fS = 0;
            fSqrDist = fA11 + 2 * fB1 + fC;
          } else {
            fT = fNumer / fDenom;
            fS = 1 - fT;
            fSqrDist =
              fS * (fA00 * fS + fA01 * fT + 2 * fB0) +
              fT * (fA01 * fS + fA11 * fT + 2 * fB1) +
              fC;
          }
        } else {
          fT = 0;
          if (fTmp1 <= 0) {
            fS = 1;
            fSqrDist = fA00 + 2 * fB0 + fC;
          } else if (fB0 >= 0) {
            fS = 0;
            fSqrDist = fC;
          } else {
            fS = -fB0 / fA00;
            fSqrDist = fB0 * fS + fC;
          }
        }
      } // region 1
      else {
        fNumer = fA11 + fB1 - fA01 - fB0;
        if (fNumer <= 0) {
          fS = 0;
          fT = 1;
          fSqrDist = fA11 + 2 * fB1 + fC;
        } else {
          fDenom = fA00 - 2 * fA01 + fA11;
          if (fNumer >= fDenom) {
            fS = 1;
            fT = 0;
            fSqrDist = fA00 + 2 * fB0 + fC;
          } else {
            fS = fNumer / fDenom;
            fT = 1 - fS;
            fSqrDist =
              fS * (fA00 * fS + fA01 * fT + 2 * fB0) +
              fT * (fA01 * fS + fA11 * fT + 2 * fB1) +
              fC;
          }
        }
      }
    }
    out[0] = fS;
    out[1] = fT;

    return Math.abs(fSqrDist);
  }
}
