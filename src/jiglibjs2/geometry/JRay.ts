import { Vector3D } from '../geom/Vector3D';
import { JNumber3D } from '../math/JNumber3D';

export class JRay {
  constructor(public origin: Vector3D, public dir: Vector3D) {}

  getOrigin(t: number) {
    return this.origin.add(JNumber3D.getScaleVector(this.dir, t));
  }
}
