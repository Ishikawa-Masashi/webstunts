import { Vector3D } from "../geom/Vector3D";

export class CollOutData {
  constructor(
    public frac = 0,
    public position = new Vector3D(),
    public normal = new Vector3D()
  ) {}
}
