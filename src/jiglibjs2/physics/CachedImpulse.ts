import { Vector3D } from '../geom/Vector3D';

export class CachedImpulse {
  constructor(
    public normalImpulse: number,
    public normalImpulseAux: number,
    public frictionImpulse: Vector3D
  ) {}
}
