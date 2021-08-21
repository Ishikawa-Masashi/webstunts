import { JAABox } from '../geometry/JAABox';

export class OctreeCell {
  childCellIndices = null; // int
  triangleIndices: number[] = null; // int
  AABox: JAABox = null; // JAABox
  _points = null; // Vector3D
  _egdes = null; // EdgeData
  constructor(aabox: JAABox) {
    this.childCellIndices = [];
    this.triangleIndices = [];

    this.clear();

    if (aabox) {
      this.AABox = aabox.clone();
    } else {
      this.AABox = new JAABox();
    }
    this._points = this.AABox.getAllPoints();
    //this._egdes = this.AABox.get_edges();
    this._egdes = JAABox.get_edges();
  }

  static NUM_CHILDREN = 8; // uint

  isLeaf() {
    return this.childCellIndices[0] == -1;
  }

  clear() {
    for (var i = 0; i < OctreeCell.NUM_CHILDREN; i++) {
      this.childCellIndices[i] = -1;
    }
    this.triangleIndices.splice(0, this.triangleIndices.length);
  }

  get_points() {
    return this._points;
  }

  get_egdes() {
    return this._egdes;
  }
}
