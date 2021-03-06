import { Vector3D } from '../../geom/Vector3D';
import { JMath3D } from '../../math/JMath3D';
import { JNumber3D } from '../../math/JNumber3D';
import { PhysicsSystem } from '../PhysicsSystem';
import { JConstraint } from './JConstraint';

export class JConstraintPoint extends JConstraint {
  _maxVelMag = 20; // Number
  _minVelForProcessing = 0.01; // Number
  _body0 = null; // RigidBody
  _body1 = null; // RigidBody
  _body0Pos = null; // Vector3D
  _body1Pos = null; // Vector3D
  _timescale = null; // Number
  _allowedDistance = null; // Number
  r0 = null; // Vector3D
  r1 = null; // Vector3D
  _worldPos = null; // Vector3D
  _vrExtra = null; // Vector3D
  constructor(body0, body0Pos, body1, body1Pos, allowedDistance, timescale) {
    super();
    this._body0 = body0;
    this._body0Pos = body0Pos;
    this._body1 = body1;
    this._body1Pos = body1Pos;
    this._allowedDistance = allowedDistance;
    this._timescale = timescale;
    if (this._timescale < JMath3D.NUM_TINY) {
      this._timescale = JMath3D.NUM_TINY;
    }

    this._constraintEnabled = false;
    this.enableConstraint();
  }

  enableConstraint() {
    if (this._constraintEnabled) {
      return;
    }
    this._constraintEnabled = true;
    this._body0.addConstraint(this);
    this._body1.addConstraint(this);
    PhysicsSystem.getInstance().addConstraint(this);
  }

  disableConstraint() {
    if (!this._constraintEnabled) {
      return;
    }
    this._constraintEnabled = false;
    this._body0.removeConstraint(this);
    this._body1.removeConstraint(this);
    PhysicsSystem.getInstance().removeConstraint(this);
  }

  preApply(dt) {
    this.satisfied = false;

    this.r0 = this._body0
      .get_currentState()
      .orientation.transformVector(this._body0Pos);
    this.r1 = this._body1
      .get_currentState()
      .orientation.transformVector(this._body1Pos);

    var worldPos0, worldPos1, deviation, deviationAmount;
    worldPos0 = this._body0.get_currentState().position.add(this.r0);
    worldPos1 = this._body1.get_currentState().position.add(this.r1);
    this._worldPos = JNumber3D.getScaleVector(worldPos0.add(worldPos1), 0.5);

    deviation = worldPos0.subtract(worldPos1);
    deviationAmount = deviation.get_length();
    if (deviationAmount > this._allowedDistance) {
      this._vrExtra = JNumber3D.getScaleVector(
        deviation,
        (deviationAmount - this._allowedDistance) /
          (deviationAmount * Math.max(this._timescale, dt))
      );
    } else {
      this._vrExtra = new Vector3D();
    }
  }

  apply(dt) {
    this.satisfied = true;

    if (!this._body0.isActive && !this._body1.isActive) {
      return false;
    }

    var normalVel, denominator;
    var currentVel0, currentVel1, Vr, N, tempVec1, tempVec2, normalImpulse;
    currentVel0 = this._body0.getVelocity(this.r0);
    currentVel1 = this._body1.getVelocity(this.r1);
    Vr = this._vrExtra.add(currentVel0.subtract(currentVel1));

    normalVel = Vr.get_length();
    if (normalVel < this._minVelForProcessing) {
      return false;
    }

    if (normalVel > this._maxVelMag) {
      Vr = JNumber3D.getScaleVector(Vr, this._maxVelMag / normalVel);
      normalVel = this._maxVelMag;
    }

    N = JNumber3D.getDivideVector(Vr, normalVel);
    tempVec1 = this.r0.crossProduct(N);
    tempVec1 = this._body0.get_worldInvInertia().transformVector(tempVec1);
    tempVec2 = this.r1.crossProduct(N);
    tempVec2 = this._body1.get_worldInvInertia().transformVector(tempVec2);
    denominator =
      this._body0.get_invMass() +
      this._body1.get_invMass() +
      N.dotProduct(tempVec1.crossProduct(this.r0)) +
      N.dotProduct(tempVec2.crossProduct(this.r1));
    if (denominator < JMath3D.NUM_TINY) {
      return false;
    }

    normalImpulse = JNumber3D.getScaleVector(N, -normalVel / denominator);
    this._body0.applyWorldImpulse(normalImpulse, this._worldPos, false);
    this._body1.applyWorldImpulse(
      JNumber3D.getScaleVector(normalImpulse, -1),
      this._worldPos,
      false
    );

    this._body0.setConstraintsAndCollisionsUnsatisfied();
    this._body1.setConstraintsAndCollisionsUnsatisfied();
    this.satisfied = true;
    return true;
  }
}
// jiglib.JConstraintPoint = JConstraintPoint;
