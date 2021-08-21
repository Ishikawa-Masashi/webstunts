import { Vector3D } from '../../geom/Vector3D';
import { JMath3D } from '../../math/JMath3D';
import { JNumber3D } from '../../math/JNumber3D';
import { PhysicsSystem } from '../PhysicsSystem';
import { JConstraint } from './JConstraint';

export class JConstraintWorldPoint extends JConstraint {
  minVelForProcessing = 0.001; // Number
  allowedDeviation = 0.01; // Number
  timescale = 4; // Number
  _body = null; // RigidBody
  _pointOnBody = null; // Vector3D
  _worldPosition = null; // Vector3D
  constructor(body, pointOnBody, worldPosition) {
    // jiglib.JConstraint.apply(this, []);
    super();
    this._body = body;
    this._pointOnBody = pointOnBody;
    this._worldPosition = worldPosition;

    this._constraintEnabled = false;
    this.enableConstraint();
  }

  set_worldPosition(pos) {
    this._worldPosition = pos;
  }

  get_worldPosition() {
    return this._worldPosition;
  }

  enableConstraint() {
    if (this._constraintEnabled) {
      return;
    }
    this._constraintEnabled = true;
    this._body.addConstraint(this);
    PhysicsSystem.getInstance().addConstraint(this);
  }

  disableConstraint() {
    if (!this._constraintEnabled) {
      return;
    }
    this._constraintEnabled = false;
    this._body.removeConstraint(this);
    PhysicsSystem.getInstance().removeConstraint(this);
  }

  apply(dt) {
    this.satisfied = true;

    var deviationDistance, normalVel, denominator, normalImpulse, dot;
    var desiredVel, deviationDir, deviation, N, tempV;

    let worldPos = this._body
      .get_currentState()
      .orientation.transformVector(this._pointOnBody);
    worldPos = worldPos.add(this._body.get_currentState().position);
    let R = worldPos.subtract(this._body.get_currentState().position);
    let currentVel = this._body
      .get_currentState()
      .linVelocity.add(
        this._body.get_currentState().rotVelocity.crossProduct(R)
      );

    deviation = worldPos.subtract(this._worldPosition);
    deviationDistance = deviation.get_length();
    if (deviationDistance > this.allowedDeviation) {
      deviationDir = JNumber3D.getDivideVector(deviation, deviationDistance);
      desiredVel = JNumber3D.getScaleVector(
        deviationDir,
        (this.allowedDeviation - deviationDistance) / (this.timescale * dt)
      );
    } else {
      desiredVel = new Vector3D();
    }

    N = currentVel.subtract(desiredVel);
    normalVel = N.get_length();
    if (normalVel < this.minVelForProcessing) {
      return false;
    }
    N = JNumber3D.getDivideVector(N, normalVel);

    tempV = R.crossProduct(N);
    tempV = this._body.get_worldInvInertia().transformVector(tempV);
    denominator =
      this._body.get_invMass() + N.dotProduct(tempV.crossProduct(R));

    if (denominator < JMath3D.NUM_TINY) {
      return false;
    }

    normalImpulse = -normalVel / denominator;

    this._body.applyWorldImpulse(
      JNumber3D.getScaleVector(N, normalImpulse),
      worldPos,
      false
    );

    this._body.setConstraintsAndCollisionsUnsatisfied();
    this.satisfied = true;

    return true;
  }
}
