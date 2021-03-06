import { Vector3D } from '../geom/Vector3D';
import { JMath3D } from '../math/JMath3D';
import { JMatrix3D } from '../math/JMatrix3D';
import { JNumber3D } from '../math/JNumber3D';
import { JConstraintMaxDistance } from './constraint/JConstraintMaxDistance';
import { JConstraintPoint } from './constraint/JConstraintPoint';
import { PhysicsController } from './PhysicsController';
import { PhysicsSystem } from './PhysicsSystem';

export class HingeJoint extends PhysicsController {
  MAX_HINGE_ANGLE_LIMIT = 150; // Number
  _hingeAxis = null; // Vector3D
  _hingePosRel0 = null; // Vector3D
  _body0 = null; // RigidBody
  _body1 = null; // RigidBody
  _usingLimit = null; // Boolean
  _broken = null; // Boolean
  _damping = null; // Number
  _extraTorque = null; // Number
  sidePointConstraints = null; // JConstraintMaxDistance
  midPointConstraint = null; // JConstraintPoint
  maxDistanceConstraint = null; // JConstraintMaxDistance

  constructor(
    body0,
    body1,
    hingeAxis,
    hingePosRel0,
    hingeHalfWidth,
    hingeFwdAngle,
    hingeBckAngle,
    sidewaysSlack,
    damping
  ) {
    super();

    this._body0 = body0;
    this._body1 = body1;
    this._hingeAxis = hingeAxis.clone();
    this._hingePosRel0 = hingePosRel0.clone();
    this._usingLimit = false;
    this._controllerEnabled = false;
    this._broken = false;
    this._damping = damping;
    this._extraTorque = 0;

    this._hingeAxis.normalize();
    var _hingePosRel1 = this._body0
      .get_currentState()
      .position.add(
        this._hingePosRel0.subtract(this._body1.get_currentState().position)
      );

    var relPos0a = this._hingePosRel0.add(
      JNumber3D.getScaleVector(this._hingeAxis, hingeHalfWidth)
    );
    var relPos0b = this._hingePosRel0.subtract(
      JNumber3D.getScaleVector(this._hingeAxis, hingeHalfWidth)
    );

    var relPos1a = _hingePosRel1.add(
      JNumber3D.getScaleVector(this._hingeAxis, hingeHalfWidth)
    );
    var relPos1b = _hingePosRel1.subtract(
      JNumber3D.getScaleVector(this._hingeAxis, hingeHalfWidth)
    );

    var timescale = 1 / 20;
    var allowedDistanceMid = 0.005;
    var allowedDistanceSide = sidewaysSlack * hingeHalfWidth;

    this.sidePointConstraints = [];
    this.sidePointConstraints[0] = new JConstraintMaxDistance(
      this._body0,
      relPos0a,
      this._body1,
      relPos1a,
      allowedDistanceSide
    );
    this.sidePointConstraints[1] = new JConstraintMaxDistance(
      this._body0,
      relPos0b,
      this._body1,
      relPos1b,
      allowedDistanceSide
    );

    this.midPointConstraint = new JConstraintPoint(
      this._body0,
      this._hingePosRel0,
      this._body1,
      _hingePosRel1,
      allowedDistanceMid,
      timescale
    );

    if (hingeFwdAngle <= this.MAX_HINGE_ANGLE_LIMIT) {
      var perpDir = Vector3D.Y_AXIS;
      if (perpDir.dotProduct(this._hingeAxis) > 0.1) {
        perpDir.x = 1;
        perpDir.y = 0;
        perpDir.z = 0;
      }
      var sideAxis = this._hingeAxis.crossProduct(perpDir);
      perpDir = sideAxis.crossProduct(this._hingeAxis);
      perpDir.normalize();

      var len = 10 * hingeHalfWidth;
      var hingeRelAnchorPos0 = JNumber3D.getScaleVector(perpDir, len);
      var angleToMiddle = 0.5 * (hingeFwdAngle - hingeBckAngle);
      var hingeRelAnchorPos1 = JMatrix3D.getRotationMatrix(
        this._hingeAxis.x,
        this._hingeAxis.y,
        this._hingeAxis.z,
        -angleToMiddle
      ).transformVector(hingeRelAnchorPos0);

      var hingeHalfAngle = 0.5 * (hingeFwdAngle + hingeBckAngle);
      var allowedDistance =
        len * 2 * Math.sin((0.5 * hingeHalfAngle * Math.PI) / 180);

      var hingePos = this._body1
        .get_currentState()
        .position.add(this._hingePosRel0);
      var relPos0c = hingePos.add(
        hingeRelAnchorPos0.subtract(this._body0.get_currentState().position)
      );
      var relPos1c = hingePos.add(
        hingeRelAnchorPos1.subtract(this._body1.get_currentState().position)
      );

      this.maxDistanceConstraint = new JConstraintMaxDistance(
        this._body0,
        relPos0c,
        this._body1,
        relPos1c,
        allowedDistance
      );
      this._usingLimit = true;
    }
    if (this._damping <= 0) {
      this._damping = -1;
    } else {
      this._damping = JMath3D.getLimiteNumber(this._damping, 0, 1);
    }

    this.enableController();
  }

  // jiglib.extend(HingeJoint, PhysicsController);

  enableController() {
    if (this._controllerEnabled) {
      return;
    }
    this.midPointConstraint.enableConstraint();
    this.sidePointConstraints[0].enableConstraint();
    this.sidePointConstraints[1].enableConstraint();
    if (this._usingLimit && !this._broken) {
      this.maxDistanceConstraint.enableConstraint();
    }
    this._controllerEnabled = true;
    PhysicsSystem.getInstance().addController(this);
  }

  disableController() {
    if (!this._controllerEnabled) {
      return;
    }
    this.midPointConstraint.disableConstraint();
    this.sidePointConstraints[0].disableConstraint();
    this.sidePointConstraints[1].disableConstraint();
    if (this._usingLimit && !this._broken) {
      this.maxDistanceConstraint.disableConstraint();
    }
    this._controllerEnabled = false;
    PhysicsSystem.getInstance().removeController(this);
  }

  breakHinge() {
    if (this._broken) {
      return;
    }
    if (this._usingLimit) {
      this.maxDistanceConstraint.disableConstraint();
    }
    this._broken = true;
  }

  mendHinge() {
    if (!this._broken) {
      return;
    }
    if (this._usingLimit) {
      this.maxDistanceConstraint.enableConstraint();
    }
    this._broken = false;
  }

  setExtraTorque(torque) {
    this._extraTorque = torque;
  }

  isBroken() {
    return this._broken;
  }

  getHingePosRel0() {
    return this._hingePosRel0;
  }

  updateController(dt) {
    if (this._damping > 0) {
      var hingeAxis, newAngVel1, newAngVel2;
      var angRot1, angRot2, avAngRot, frac, newAngRot1, newAngRot2;

      hingeAxis = this._body1
        .get_currentState()
        .rotVelocity.subtract(this._body0.get_currentState().rotVelocity);
      hingeAxis.normalize();

      angRot1 = this._body0
        .get_currentState()
        .rotVelocity.dotProduct(hingeAxis);
      angRot2 = this._body1
        .get_currentState()
        .rotVelocity.dotProduct(hingeAxis);

      avAngRot = 0.5 * (angRot1 + angRot2);
      frac = 1 - this._damping;
      newAngRot1 = avAngRot + (angRot1 - avAngRot) * frac;
      newAngRot2 = avAngRot + (angRot2 - avAngRot) * frac;

      newAngVel1 = this._body0
        .get_currentState()
        .rotVelocity.add(
          JNumber3D.getScaleVector(hingeAxis, newAngRot1 - angRot1)
        );
      newAngVel2 = this._body1
        .get_currentState()
        .rotVelocity.add(
          JNumber3D.getScaleVector(hingeAxis, newAngRot2 - angRot2)
        );

      this._body0.setAngleVelocity(newAngVel1);
      this._body1.setAngleVelocity(newAngVel2);
    }

    if (this._extraTorque != 0) {
      var torque1 = this._body0
        .get_currentState()
        .orientation.transformVector(this._hingeAxis);
      torque1 = JNumber3D.getScaleVector(torque1, this._extraTorque);

      this._body0.addWorldTorque(torque1);
      this._body1.addWorldTorque(JNumber3D.getScaleVector(torque1, -1));
    }
  }
}
