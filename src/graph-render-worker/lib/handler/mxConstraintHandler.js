const mxClient = require("../mxClient");
const mxConstants = require("../util/mxConstants");
const mxUtils = require("../util/mxUtils");
const mxEvent = require("../util/mxEvent");
const mxRectangle = require("../util/mxRectangle");
const mxImage = require("../util/mxImage");
const mxImageShape = require("../shape/mxImageShape");
const mxRectangleShape = require("../shape/mxRectangleShape");

/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 */
/**
 * Class: mxConstraintHandler
 *
 * Handles constraints on connection targets. This class is in charge of
 * showing fixed points when the mouse is over a vertex and handles constraints
 * to establish new connections.
 *
 * Constructor: mxConstraintHandler
 *
 * Constructs an new constraint handler.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 * factoryMethod - Optional function to create the edge. The function takes
 * the source and target <mxCell> as the first and second argument and
 * returns the <mxCell> that represents the new edge.
 */
function mxConstraintHandler(graph) {
  this.graph = graph;

  // Adds a graph model listener to update the current focus on changes
  // eslint-disable-next-line no-unused-vars
  this.resetHandler = mxUtils.bind(this, function (sender, evt) {
    if (
      this.currentFocus != null &&
      this.graph.view.getState(this.currentFocus.cell) == null
    ) {
      this.reset();
    } else {
      this.redraw();
    }
  });

  this.graph.model.addListener(mxEvent.CHANGE, this.resetHandler);
  this.graph.view.addListener(mxEvent.SCALE_AND_TRANSLATE, this.resetHandler);
  this.graph.view.addListener(mxEvent.TRANSLATE, this.resetHandler);
  this.graph.view.addListener(mxEvent.SCALE, this.resetHandler);
  this.graph.addListener(mxEvent.ROOT, this.resetHandler);
}

/**
 * Variable: pointImage
 *
 * <mxImage> to be used as the image for fixed connection points.
 */
mxConstraintHandler.prototype.pointImage = new mxImage(
  mxClient.imageBasePath + "/point.gif",
  5,
  5
);

/**
 * Variable: graph
 *
 * Reference to the enclosing <mxGraph>.
 */
mxConstraintHandler.prototype.graph = null;

/**
 * Variable: enabled
 *
 * Specifies if events are handled. Default is true.
 */
mxConstraintHandler.prototype.enabled = true;

/**
 * Variable: highlightColor
 *
 * Specifies the color for the highlight. Default is <mxConstants.DEFAULT_VALID_COLOR>.
 */
mxConstraintHandler.prototype.highlightColor = mxConstants.DEFAULT_VALID_COLOR;

/**
 * Function: isEnabled
 *
 * Returns true if events are handled. This implementation
 * returns <enabled>.
 */
mxConstraintHandler.prototype.isEnabled = function () {
  return this.enabled;
};

/**
 * Function: setEnabled
 *
 * Enables or disables event handling. This implementation
 * updates <enabled>.
 *
 * Parameters:
 *
 * enabled - Boolean that specifies the new enabled state.
 */
mxConstraintHandler.prototype.setEnabled = function (enabled) {
  this.enabled = enabled;
};

/**
 * Function: reset
 *
 * Resets the state of this handler.
 */
mxConstraintHandler.prototype.reset = function () {
  if (this.focusIcons != null) {
    for (let i = 0; i < this.focusIcons.length; i++) {
      this.focusIcons[i].destroy();
    }

    this.focusIcons = null;
  }

  if (this.focusHighlight != null) {
    this.focusHighlight.destroy();
    this.focusHighlight = null;
  }

  this.currentConstraint = null;
  this.currentFocusArea = null;
  this.currentPoint = null;
  this.currentFocus = null;
  this.focusPoints = null;
};

/**
 * Function: getTolerance
 *
 * Returns the tolerance to be used for intersecting connection points. This
 * implementation returns <mxGraph.tolerance>.
 *
 * Parameters:
 *
 * me - <mxMouseEvent> whose tolerance should be returned.
 */
// eslint-disable-next-line no-unused-vars
mxConstraintHandler.prototype.getTolerance = function (me) {
  return this.graph.getTolerance();
};

/**
 * Function: getImageForConstraint
 *
 * Returns the tolerance to be used for intersecting connection points.
 */
mxConstraintHandler.prototype.getImageForConstraint = function (
  // eslint-disable-next-line no-unused-vars
  state,
  // eslint-disable-next-line no-unused-vars
  constraint,
  // eslint-disable-next-line no-unused-vars
  point
) {
  return this.pointImage;
};

/**
 * Function: isEventIgnored
 *
 * Returns true if the given <mxMouseEvent> should be ignored in <update>. This
 * implementation always returns false.
 */
// eslint-disable-next-line no-unused-vars
mxConstraintHandler.prototype.isEventIgnored = function (me, source) {
  return false;
};

/**
 * Function: isStateIgnored
 *
 * Returns true if the given state should be ignored. This always returns false.
 */
// eslint-disable-next-line no-unused-vars
mxConstraintHandler.prototype.isStateIgnored = function (state, source) {
  return false;
};

/**
 * Function: destroyIcons
 *
 * Destroys the <focusIcons> if they exist.
 */
mxConstraintHandler.prototype.destroyIcons = function () {
  if (this.focusIcons != null) {
    for (let i = 0; i < this.focusIcons.length; i++) {
      this.focusIcons[i].destroy();
    }

    this.focusIcons = null;
    this.focusPoints = null;
  }
};

/**
 * Function: destroyFocusHighlight
 *
 * Destroys the <focusHighlight> if one exists.
 */
mxConstraintHandler.prototype.destroyFocusHighlight = function () {
  if (this.focusHighlight != null) {
    this.focusHighlight.destroy();
    this.focusHighlight = null;
  }
};

/**
 * Function: isKeepFocusEvent
 *
 * Returns true if the current focused state should not be changed for the given event.
 * This returns true if shift and alt are pressed.
 */
mxConstraintHandler.prototype.isKeepFocusEvent = function (me) {
  return mxEvent.isShiftDown(me.getEvent());
};

/**
 * Function: getCellForEvent
 *
 * Returns the cell for the given event.
 */
mxConstraintHandler.prototype.getCellForEvent = function (me, point) {
  let cell = me.getCell();

  // Gets cell under actual point if different from event location
  if (
    cell == null &&
    point != null &&
    (me.getGraphX() != point.x || me.getGraphY() != point.y)
  ) {
    cell = this.graph.getCellAt(point.x, point.y);
  }

  // Uses connectable parent vertex if one exists
  if (cell != null && !this.graph.isCellConnectable(cell)) {
    let parent = this.graph.getModel().getParent(cell);

    if (
      this.graph.getModel().isVertex(parent) &&
      this.graph.isCellConnectable(parent)
    ) {
      cell = parent;
    }
  }

  return this.graph.isCellLocked(cell) ? null : cell;
};

/**
 * Function: update
 *
 * Updates the state of this handler based on the given <mxMouseEvent>.
 * Source is a boolean indicating if the cell is a source or target.
 */
mxConstraintHandler.prototype.update = function (
  me,
  source,
  existingEdge,
  point
) {
  if (this.isEnabled() && !this.isEventIgnored(me)) {
    // Lazy installation of mouseleave handler
    if (this.mouseleaveHandler == null && this.graph.container != null) {
      this.mouseleaveHandler = mxUtils.bind(this, function () {
        this.reset();
      });

      mxEvent.addListener(
        this.graph.container,
        "mouseleave",
        this.resetHandler
      );
    }

    let tol = this.getTolerance(me);
    let x = point != null ? point.x : me.getGraphX();
    let y = point != null ? point.y : me.getGraphY();
    let grid = new mxRectangle(x - tol, y - tol, 2 * tol, 2 * tol);
    let mouse = new mxRectangle(
      me.getGraphX() - tol,
      me.getGraphY() - tol,
      2 * tol,
      2 * tol
    );
    let state = this.graph.view.getState(this.getCellForEvent(me, point));

    // Keeps focus icons visible while over vertex bounds and no other cell under mouse or shift is pressed
    if (
      !this.isKeepFocusEvent(me) &&
      (this.currentFocusArea == null ||
        this.currentFocus == null ||
        state != null ||
        !this.graph.getModel().isVertex(this.currentFocus.cell) ||
        !mxUtils.intersects(this.currentFocusArea, mouse)) &&
      state != this.currentFocus
    ) {
      this.currentFocusArea = null;
      this.currentFocus = null;
      this.setFocus(me, state, source);
    }

    this.currentConstraint = null;
    this.currentPoint = null;
    let minDistSq = null;

    if (
      this.focusIcons != null &&
      this.constraints != null &&
      (state == null || this.currentFocus == state)
    ) {
      let cx = mouse.getCenterX();
      let cy = mouse.getCenterY();

      for (let i = 0; i < this.focusIcons.length; i++) {
        let dx = cx - this.focusIcons[i].bounds.getCenterX();
        let dy = cy - this.focusIcons[i].bounds.getCenterY();
        let tmp = dx * dx + dy * dy;

        if (
          (this.intersects(this.focusIcons[i], mouse, source, existingEdge) ||
            (point != null &&
              this.intersects(
                this.focusIcons[i],
                grid,
                source,
                existingEdge
              ))) &&
          (minDistSq == null || tmp < minDistSq)
        ) {
          this.currentConstraint = this.constraints[i];
          this.currentPoint = this.focusPoints[i];
          minDistSq = tmp;

          tmp = this.focusIcons[i].bounds.clone();
          tmp.grow(mxConstants.HIGHLIGHT_SIZE + 1);
          tmp.width -= 1;
          tmp.height -= 1;

          if (this.focusHighlight == null) {
            let hl = this.createHighlightShape();
            hl.dialect =
              this.graph.dialect == mxConstants.DIALECT_SVG
                ? mxConstants.DIALECT_SVG
                : mxConstants.DIALECT_VML;
            hl.pointerEvents = false;

            hl.init(this.graph.getView().getOverlayPane());
            this.focusHighlight = hl;

            let getState = mxUtils.bind(this, function () {
              return this.currentFocus != null ? this.currentFocus : state;
            });

            mxEvent.redirectMouseEvents(hl.node, this.graph, getState);
          }

          this.focusHighlight.bounds = tmp;
          this.focusHighlight.redraw();
        }
      }
    }

    if (this.currentConstraint == null) {
      this.destroyFocusHighlight();
    }
  } else {
    this.currentConstraint = null;
    this.currentFocus = null;
    this.currentPoint = null;
  }
};

/**
 * Function: redraw
 *
 * Transfers the focus to the given state as a source or target terminal. If
 * the handler is not enabled then the outline is painted, but the constraints
 * are ignored.
 */
mxConstraintHandler.prototype.redraw = function () {
  if (
    this.currentFocus != null &&
    this.constraints != null &&
    this.focusIcons != null
  ) {
    let state = this.graph.view.getState(this.currentFocus.cell);
    this.currentFocus = state;
    this.currentFocusArea = new mxRectangle(
      state.x,
      state.y,
      state.width,
      state.height
    );

    for (let i = 0; i < this.constraints.length; i++) {
      let cp = this.graph.getConnectionPoint(state, this.constraints[i]);
      let img = this.getImageForConstraint(state, this.constraints[i], cp);

      let bounds = new mxRectangle(
        Math.round(cp.x - img.width / 2),
        Math.round(cp.y - img.height / 2),
        img.width,
        img.height
      );
      this.focusIcons[i].bounds = bounds;
      this.focusIcons[i].redraw();
      this.currentFocusArea.add(this.focusIcons[i].bounds);
      this.focusPoints[i] = cp;
    }
  }
};

/**
 * Function: setFocus
 *
 * Transfers the focus to the given state as a source or target terminal. If
 * the handler is not enabled then the outline is painted, but the constraints
 * are ignored.
 */
mxConstraintHandler.prototype.setFocus = function (me, state, source) {
  this.constraints =
    state != null &&
    !this.isStateIgnored(state, source) &&
    this.graph.isCellConnectable(state.cell)
      ? this.isEnabled()
        ? this.graph.getAllConnectionConstraints(state, source) || []
        : []
      : null;

  // Only uses cells which have constraints
  if (this.constraints != null) {
    this.currentFocus = state;
    this.currentFocusArea = new mxRectangle(
      state.x,
      state.y,
      state.width,
      state.height
    );

    if (this.focusIcons != null) {
      for (let i = 0; i < this.focusIcons.length; i++) {
        this.focusIcons[i].destroy();
      }

      this.focusIcons = null;
      this.focusPoints = null;
    }

    this.focusPoints = [];
    this.focusIcons = [];

    for (let i = 0; i < this.constraints.length; i++) {
      let cp = this.graph.getConnectionPoint(state, this.constraints[i]);
      let img = this.getImageForConstraint(state, this.constraints[i], cp);

      let src = img.src;
      let bounds = new mxRectangle(
        Math.round(cp.x - img.width / 2),
        Math.round(cp.y - img.height / 2),
        img.width,
        img.height
      );
      let icon = new mxImageShape(bounds, src);
      icon.dialect =
        this.graph.dialect != mxConstants.DIALECT_SVG
          ? mxConstants.DIALECT_MIXEDHTML
          : mxConstants.DIALECT_SVG;
      icon.preserveImageAspect = false;
      icon.init(this.graph.getView().getDecoratorPane());

      // Fixes lost event tracking for images in quirks / IE8 standards
      if (mxClient.IS_QUIRKS || document.documentMode == 8) {
        mxEvent.addListener(icon.node, "dragstart", function (evt) {
          mxEvent.consume(evt);

          return false;
        });
      }

      // Move the icon behind all other overlays
      if (icon.node.previousSibling != null) {
        icon.node.parentNode.insertBefore(
          icon.node,
          icon.node.parentNode.firstChild
        );
      }

      let getState = mxUtils.bind(this, function () {
        return this.currentFocus != null ? this.currentFocus : state;
      });

      icon.redraw();

      mxEvent.redirectMouseEvents(icon.node, this.graph, getState);
      this.currentFocusArea.add(icon.bounds);
      this.focusIcons.push(icon);
      this.focusPoints.push(cp);
    }

    this.currentFocusArea.grow(this.getTolerance(me));
  } else {
    this.destroyIcons();
    this.destroyFocusHighlight();
  }
};

/**
 * Function: createHighlightShape
 *
 * Create the shape used to paint the highlight.
 *
 * Returns true if the given icon intersects the given point.
 */
mxConstraintHandler.prototype.createHighlightShape = function () {
  let hl = new mxRectangleShape(
    null,
    this.highlightColor,
    this.highlightColor,
    mxConstants.HIGHLIGHT_STROKEWIDTH
  );
  hl.opacity = mxConstants.HIGHLIGHT_OPACITY;

  return hl;
};

/**
 * Function: intersects
 *
 * Returns true if the given icon intersects the given rectangle.
 */
mxConstraintHandler.prototype.intersects = function (
  icon,
  mouse,
  // eslint-disable-next-line no-unused-vars
  source,
  // eslint-disable-next-line no-unused-vars
  existingEdge
) {
  return mxUtils.intersects(icon.bounds, mouse);
};

/**
 * Function: destroy
 *
 * Destroy this handler.
 */
mxConstraintHandler.prototype.destroy = function () {
  this.reset();

  if (this.resetHandler != null) {
    this.graph.model.removeListener(this.resetHandler);
    this.graph.view.removeListener(this.resetHandler);
    this.graph.removeListener(this.resetHandler);
    this.resetHandler = null;
  }

  if (this.mouseleaveHandler != null && this.graph.container != null) {
    mxEvent.removeListener(
      this.graph.container,
      "mouseleave",
      this.mouseleaveHandler
    );
    this.mouseleaveHandler = null;
  }
};

module.exports = mxConstraintHandler;
