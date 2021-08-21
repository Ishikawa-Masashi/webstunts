import { Vector3D } from '../geom/Vector3D';

export class TerrainData {
  constructor(public height = 0, public normal = new Vector3D()) {}
}
