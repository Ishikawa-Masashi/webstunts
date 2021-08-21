import { Vector3D } from '../geom/Vector3D';
import { RigidBody } from '../physics/RigidBody';
import { CollOutData } from './CollOutData';

export class CollOutBodyData extends CollOutData {
  constructor(
    frac = 0,
    position = new Vector3D(),
    normal = new Vector3D(),
    public rigidBody: RigidBody = null
  ) {
    super(frac, position, normal);
  }
}
