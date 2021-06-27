const mxUtils = require("../util/mxUtils");
const mxConstants = require("../util/mxConstants");
const mxPoint = require("../util/mxPoint");
const mxRectangle = require("../util/mxRectangle");
const mxCellState = require("./mxCellState");

/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 */
let mxEdgeStyle = {
  /**
   * Class: mxEdgeStyle
   *
   * Provides various edge styles to be used as the values for
   * <mxConstants.STYLE_EDGE> in a cell style.
   *
   * Example:
   *
   * (code)
   * let style = stylesheet.getDefaultEdgeStyle();
   * style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
   * (end)
   *
   * Sets the default edge style to <ElbowConnector>.
   *
   * Custom edge style:
   *
   * To write a custom edge style, a function must be added to the mxEdgeStyle
   * object as follows:
   *
   * (code)
   * mxEdgeStyle.MyStyle = function(state, source, target, points, result)
   * {
   *   if (source != null && target != null)
   *   {
   *     let pt = new mxPoint(target.getCenterX(), source.getCenterY());
   *
   *     if (mxUtils.contains(source, pt.x, pt.y))
   *     {
   *       pt.y = source.y + source.height;
   *     }
   *
   *     result.push(pt);
   *   }
   * };
   * (end)
   *
   * In the above example, a right angle is created using a point on the
   * horizontal center of the target vertex and the vertical center of the source
   * vertex. The code checks if that point intersects the source vertex and makes
   * the edge straight if it does. The point is then added into the result array,
   * which acts as the return value of the function.
   *
   * The new edge style should then be registered in the <mxStyleRegistry> as follows:
   * (code)
   * mxStyleRegistry.putValue('myEdgeStyle', mxEdgeStyle.MyStyle);
   * (end)
   *
   * The custom edge style above can now be used in a specific edge as follows:
   *
   * (code)
   * model.setStyle(edge, 'edgeStyle=myEdgeStyle');
   * (end)
   *
   * Note that the key of the <mxStyleRegistry> entry for the function should
   * be used in string values, unless <mxGraphView.allowEval> is true, in
   * which case you can also use mxEdgeStyle.MyStyle for the value in the
   * cell style above.
   *
   * Or it can be used for all edges in the graph as follows:
   *
   * (code)
   * let style = graph.getStylesheet().getDefaultEdgeStyle();
   * style[mxConstants.STYLE_EDGE] = mxEdgeStyle.MyStyle;
   * (end)
   *
   * Note that the object can be used directly when programmatically setting
   * the value, but the key in the <mxStyleRegistry> should be used when
   * setting the value via a key, value pair in a cell style.
   *
   * Function: EntityRelation
   *
   * Implements an entity relation style for edges (as used in database
   * schema diagrams). At the time the function is called, the result
   * array contains a placeholder (null) for the first absolute point,
   * that is, the point where the edge and source terminal are connected.
   * The implementation of the style then adds all intermediate waypoints
   * except for the last point, that is, the connection point between the
   * edge and the target terminal. The first ant the last point in the
   * result array are then replaced with mxPoints that take into account
   * the terminal's perimeter and next point on the edge.
   *
   * Parameters:
   *
   * state - <mxCellState> that represents the edge to be updated.
   * source - <mxCellState> that represents the source terminal.
   * target - <mxCellState> that represents the target terminal.
   * points - List of relative control points.
   * result - Array of <mxPoints> that represent the actual points of the
   * edge.
   */
  EntityRelation: function (state, source, target, points, result) {
    let view = state.view;
    let graph = view.graph;
    let segment =
      mxUtils.getValue(
        state.style,
        mxConstants.STYLE_SEGMENT,
        mxConstants.ENTITY_SEGMENT
      ) * view.scale;

    let pts = state.absolutePoints;
    let p0 = pts[0];
    let pe = pts[pts.length - 1];

    let isSourceLeft = false;

    if (source != null) {
      let sourceGeometry = graph.getCellGeometry(source.cell);

      if (sourceGeometry.relative) {
        isSourceLeft = sourceGeometry.x <= 0.5;
      } else if (target != null) {
        isSourceLeft =
          (pe != null ? pe.x : target.x + target.width) <
          (p0 != null ? p0.x : source.x);
      }
    }

    if (p0 != null) {
      source = new mxCellState();
      source.x = p0.x;
      source.y = p0.y;
    } else if (source != null) {
      let constraint = mxUtils.getPortConstraints(
        source,
        state,
        true,
        mxConstants.DIRECTION_MASK_NONE
      );

      if (
        constraint != mxConstants.DIRECTION_MASK_NONE &&
        constraint !=
          mxConstants.DIRECTION_MASK_WEST + mxConstants.DIRECTION_MASK_EAST
      ) {
        isSourceLeft = constraint == mxConstants.DIRECTION_MASK_WEST;
      }
    } else {
      return;
    }

    let isTargetLeft = true;

    if (target != null) {
      let targetGeometry = graph.getCellGeometry(target.cell);

      if (targetGeometry.relative) {
        isTargetLeft = targetGeometry.x <= 0.5;
      } else if (source != null) {
        isTargetLeft =
          (p0 != null ? p0.x : source.x + source.width) <
          (pe != null ? pe.x : target.x);
      }
    }

    if (pe != null) {
      target = new mxCellState();
      target.x = pe.x;
      target.y = pe.y;
    } else if (target != null) {
      let constraint = mxUtils.getPortConstraints(
        target,
        state,
        false,
        mxConstants.DIRECTION_MASK_NONE
      );

      if (
        constraint != mxConstants.DIRECTION_MASK_NONE &&
        constraint !=
          mxConstants.DIRECTION_MASK_WEST + mxConstants.DIRECTION_MASK_EAST
      ) {
        isTargetLeft = constraint == mxConstants.DIRECTION_MASK_WEST;
      }
    }

    if (source != null && target != null) {
      let x0 = isSourceLeft ? source.x : source.x + source.width;
      let y0 = view.getRoutingCenterY(source);

      let xe = isTargetLeft ? target.x : target.x + target.width;
      let ye = view.getRoutingCenterY(target);

      let seg = segment;

      let dx = isSourceLeft ? -seg : seg;
      let dep = new mxPoint(x0 + dx, y0);

      dx = isTargetLeft ? -seg : seg;
      let arr = new mxPoint(xe + dx, ye);

      // Adds intermediate points if both go out on same side
      if (isSourceLeft == isTargetLeft) {
        let x = isSourceLeft
          ? Math.min(x0, xe) - segment
          : Math.max(x0, xe) + segment;

        result.push(new mxPoint(x, y0));
        result.push(new mxPoint(x, ye));
      } else if (dep.x < arr.x == isSourceLeft) {
        let midY = y0 + (ye - y0) / 2;

        result.push(dep);
        result.push(new mxPoint(dep.x, midY));
        result.push(new mxPoint(arr.x, midY));
        result.push(arr);
      } else {
        result.push(dep);
        result.push(arr);
      }
    }
  },

  /**
   * Function: Loop
   *
   * Implements a self-reference, aka. loop.
   */
  Loop: function (state, source, target, points, result) {
    let pts = state.absolutePoints;

    let p0 = pts[0];
    let pe = pts[pts.length - 1];

    if (p0 != null && pe != null) {
      if (points != null && points.length > 0) {
        for (let i = 0; i < points.length; i++) {
          let pt = points[i];
          pt = state.view.transformControlPoint(state, pt);
          result.push(new mxPoint(pt.x, pt.y));
        }
      }

      return;
    }

    if (source != null) {
      let view = state.view;
      let graph = view.graph;
      let pt = points != null && points.length > 0 ? points[0] : null;

      if (pt != null) {
        pt = view.transformControlPoint(state, pt);

        if (mxUtils.contains(source, pt.x, pt.y)) {
          pt = null;
        }
      }

      let x = 0;
      let dx = 0;
      let y = 0;
      let dy = 0;

      let seg =
        mxUtils.getValue(
          state.style,
          mxConstants.STYLE_SEGMENT,
          graph.gridSize
        ) * view.scale;
      let dir = mxUtils.getValue(
        state.style,
        mxConstants.STYLE_DIRECTION,
        mxConstants.DIRECTION_WEST
      );

      if (
        dir == mxConstants.DIRECTION_NORTH ||
        dir == mxConstants.DIRECTION_SOUTH
      ) {
        x = view.getRoutingCenterX(source);
        dx = seg;
      } else {
        y = view.getRoutingCenterY(source);
        dy = seg;
      }

      if (pt == null || pt.x < source.x || pt.x > source.x + source.width) {
        if (pt != null) {
          x = pt.x;
          dy = Math.max(Math.abs(y - pt.y), dy);
        } else {
          if (dir == mxConstants.DIRECTION_NORTH) {
            y = source.y - 2 * dx;
          } else if (dir == mxConstants.DIRECTION_SOUTH) {
            y = source.y + source.height + 2 * dx;
          } else if (dir == mxConstants.DIRECTION_EAST) {
            x = source.x - 2 * dy;
          } else {
            x = source.x + source.width + 2 * dy;
          }
        }
      } else if (pt != null) {
        x = view.getRoutingCenterX(source);
        dx = Math.max(Math.abs(x - pt.x), dy);
        y = pt.y;
        dy = 0;
      }

      result.push(new mxPoint(x - dx, y - dy));
      result.push(new mxPoint(x + dx, y + dy));
    }
  },

  /**
   * Function: ElbowConnector
   *
   * Uses either <SideToSide> or <TopToBottom> depending on the horizontal
   * flag in the cell style. <SideToSide> is used if horizontal is true or
   * unspecified. See <EntityRelation> for a description of the
   * parameters.
   */
  ElbowConnector: function (state, source, target, points, result) {
    let pt = points != null && points.length > 0 ? points[0] : null;

    let vertical = false;
    let horizontal = false;

    if (source != null && target != null) {
      if (pt != null) {
        let left = Math.min(source.x, target.x);
        let right = Math.max(source.x + source.width, target.x + target.width);

        let top = Math.min(source.y, target.y);
        let bottom = Math.max(
          source.y + source.height,
          target.y + target.height
        );

        pt = state.view.transformControlPoint(state, pt);

        vertical = pt.y < top || pt.y > bottom;
        horizontal = pt.x < left || pt.x > right;
      } else {
        let left = Math.max(source.x, target.x);
        let right = Math.min(source.x + source.width, target.x + target.width);

        vertical = left == right;

        if (!vertical) {
          let top = Math.max(source.y, target.y);
          let bottom = Math.min(
            source.y + source.height,
            target.y + target.height
          );

          horizontal = top == bottom;
        }
      }
    }

    if (
      !horizontal &&
      (vertical ||
        state.style[mxConstants.STYLE_ELBOW] == mxConstants.ELBOW_VERTICAL)
    ) {
      mxEdgeStyle.TopToBottom(state, source, target, points, result);
    } else {
      mxEdgeStyle.SideToSide(state, source, target, points, result);
    }
  },

  /**
   * Function: SideToSide
   *
   * Implements a vertical elbow edge. See <EntityRelation> for a description
   * of the parameters.
   */
  SideToSide: function (state, source, target, points, result) {
    let view = state.view;
    let pt = points != null && points.length > 0 ? points[0] : null;
    let pts = state.absolutePoints;
    let p0 = pts[0];
    let pe = pts[pts.length - 1];

    if (pt != null) {
      pt = view.transformControlPoint(state, pt);
    }

    if (p0 != null) {
      source = new mxCellState();
      source.x = p0.x;
      source.y = p0.y;
    }

    if (pe != null) {
      target = new mxCellState();
      target.x = pe.x;
      target.y = pe.y;
    }

    if (source != null && target != null) {
      let l = Math.max(source.x, target.x);
      let r = Math.min(source.x + source.width, target.x + target.width);

      let x = pt != null ? pt.x : Math.round(r + (l - r) / 2);

      let y1 = view.getRoutingCenterY(source);
      let y2 = view.getRoutingCenterY(target);

      if (pt != null) {
        if (pt.y >= source.y && pt.y <= source.y + source.height) {
          y1 = pt.y;
        }

        if (pt.y >= target.y && pt.y <= target.y + target.height) {
          y2 = pt.y;
        }
      }

      if (
        !mxUtils.contains(target, x, y1) &&
        !mxUtils.contains(source, x, y1)
      ) {
        result.push(new mxPoint(x, y1));
      }

      if (
        !mxUtils.contains(target, x, y2) &&
        !mxUtils.contains(source, x, y2)
      ) {
        result.push(new mxPoint(x, y2));
      }

      if (result.length == 1) {
        if (pt != null) {
          if (
            !mxUtils.contains(target, x, pt.y) &&
            !mxUtils.contains(source, x, pt.y)
          ) {
            result.push(new mxPoint(x, pt.y));
          }
        } else {
          let t = Math.max(source.y, target.y);
          let b = Math.min(source.y + source.height, target.y + target.height);

          result.push(new mxPoint(x, t + (b - t) / 2));
        }
      }
    }
  },

  /**
   * Function: TopToBottom
   *
   * Implements a horizontal elbow edge. See <EntityRelation> for a
   * description of the parameters.
   */
  TopToBottom: function (state, source, target, points, result) {
    let view = state.view;
    let pt = points != null && points.length > 0 ? points[0] : null;
    let pts = state.absolutePoints;
    let p0 = pts[0];
    let pe = pts[pts.length - 1];

    if (pt != null) {
      pt = view.transformControlPoint(state, pt);
    }

    if (p0 != null) {
      source = new mxCellState();
      source.x = p0.x;
      source.y = p0.y;
    }

    if (pe != null) {
      target = new mxCellState();
      target.x = pe.x;
      target.y = pe.y;
    }

    if (source != null && target != null) {
      let t = Math.max(source.y, target.y);
      let b = Math.min(source.y + source.height, target.y + target.height);

      let x = view.getRoutingCenterX(source);

      if (pt != null && pt.x >= source.x && pt.x <= source.x + source.width) {
        x = pt.x;
      }

      let y = pt != null ? pt.y : Math.round(b + (t - b) / 2);

      if (!mxUtils.contains(target, x, y) && !mxUtils.contains(source, x, y)) {
        result.push(new mxPoint(x, y));
      }

      if (pt != null && pt.x >= target.x && pt.x <= target.x + target.width) {
        x = pt.x;
      } else {
        x = view.getRoutingCenterX(target);
      }

      if (!mxUtils.contains(target, x, y) && !mxUtils.contains(source, x, y)) {
        result.push(new mxPoint(x, y));
      }

      if (result.length == 1) {
        if (pt != null && result.length == 1) {
          if (
            !mxUtils.contains(target, pt.x, y) &&
            !mxUtils.contains(source, pt.x, y)
          ) {
            result.push(new mxPoint(pt.x, y));
          }
        } else {
          let l = Math.max(source.x, target.x);
          let r = Math.min(source.x + source.width, target.x + target.width);

          result.push(new mxPoint(l + (r - l) / 2, y));
        }
      }
    }
  },

  /**
   * Function: SegmentConnector
   *
   * Implements an orthogonal edge style. Use <mxEdgeSegmentHandler>
   * as an interactive handler for this style.
   *
   * state - <mxCellState> that represents the edge to be updated.
   * sourceScaled - <mxCellState> that represents the source terminal.
   * targetScaled - <mxCellState> that represents the target terminal.
   * controlHints - List of relative control points.
   * result - Array of <mxPoints> that represent the actual points of the
   * edge.
   *
   */
  SegmentConnector: function (
    state,
    sourceScaled,
    targetScaled,
    controlHints,
    result
  ) {
    // Creates array of all way- and terminalpoints
    let pts = mxEdgeStyle.scalePointArray(
      state.absolutePoints,
      state.view.scale
    );
    let source = mxEdgeStyle.scaleCellState(sourceScaled, state.view.scale);
    let target = mxEdgeStyle.scaleCellState(targetScaled, state.view.scale);
    let tol = 1;

    // Whether the first segment outgoing from the source end is horizontal
    let lastPushed = result.length > 0 ? result[0] : null;
    let horizontal = true;
    let hint = null;

    // Adds waypoints only if outside of tolerance
    function pushPoint(pt) {
      pt.x = Math.round(pt.x * state.view.scale * 10) / 10;
      pt.y = Math.round(pt.y * state.view.scale * 10) / 10;

      if (
        lastPushed == null ||
        Math.abs(lastPushed.x - pt.x) >= tol ||
        Math.abs(lastPushed.y - pt.y) >= Math.max(1, state.view.scale)
      ) {
        result.push(pt);
        lastPushed = pt;
      }

      return lastPushed;
    }

    // Adds the first point
    let pt = pts[0];

    if (pt == null && source != null) {
      pt = new mxPoint(
        state.view.getRoutingCenterX(source),
        state.view.getRoutingCenterY(source)
      );
    } else if (pt != null) {
      pt = pt.clone();
    }

    let lastInx = pts.length - 1;

    // Adds the waypoints
    if (controlHints != null && controlHints.length > 0) {
      // Converts all hints and removes nulls
      let hints = [];

      for (let i = 0; i < controlHints.length; i++) {
        let tmp = state.view.transformControlPoint(
          state,
          controlHints[i],
          true
        );

        if (tmp != null) {
          hints.push(tmp);
        }
      }

      if (hints.length == 0) {
        return;
      }

      // Aligns source and target hint to fixed points
      if (pt != null && hints[0] != null) {
        if (Math.abs(hints[0].x - pt.x) < tol) {
          hints[0].x = pt.x;
        }

        if (Math.abs(hints[0].y - pt.y) < tol) {
          hints[0].y = pt.y;
        }
      }

      let pe = pts[lastInx];

      if (pe != null && hints[hints.length - 1] != null) {
        if (Math.abs(hints[hints.length - 1].x - pe.x) < tol) {
          hints[hints.length - 1].x = pe.x;
        }

        if (Math.abs(hints[hints.length - 1].y - pe.y) < tol) {
          hints[hints.length - 1].y = pe.y;
        }
      }

      hint = hints[0];

      let currentTerm = source;
      let currentPt = pts[0];
      let hozChan = false;
      let vertChan = false;
      let currentHint = hint;

      if (currentPt != null) {
        currentTerm = null;
      }

      // Check for alignment with fixed points and with channels
      // at source and target segments only
      for (let i = 0; i < 2; i++) {
        let fixedVertAlign = currentPt != null && currentPt.x == currentHint.x;
        let fixedHozAlign = currentPt != null && currentPt.y == currentHint.y;

        let inHozChan =
          currentTerm != null &&
          currentHint.y >= currentTerm.y &&
          currentHint.y <= currentTerm.y + currentTerm.height;
        let inVertChan =
          currentTerm != null &&
          currentHint.x >= currentTerm.x &&
          currentHint.x <= currentTerm.x + currentTerm.width;

        hozChan = fixedHozAlign || (currentPt == null && inHozChan);
        vertChan = fixedVertAlign || (currentPt == null && inVertChan);

        // If the current hint falls in both the hor and vert channels in the case
        // of a floating port, or if the hint is exactly co-incident with a
        // fixed point, ignore the source and try to work out the orientation
        // from the target end
        if (
          i == 0 &&
          ((hozChan && vertChan) || (fixedVertAlign && fixedHozAlign))
        ) {
          //do nothing
        } else {
          if (
            currentPt != null &&
            !fixedHozAlign &&
            !fixedVertAlign &&
            (inHozChan || inVertChan)
          ) {
            horizontal = inHozChan ? false : true;
            break;
          }

          if (vertChan || hozChan) {
            horizontal = hozChan;

            if (i == 1) {
              // Work back from target end
              horizontal = hints.length % 2 == 0 ? hozChan : vertChan;
            }

            break;
          }
        }

        currentTerm = target;
        currentPt = pts[lastInx];

        if (currentPt != null) {
          currentTerm = null;
        }

        currentHint = hints[hints.length - 1];

        if (fixedVertAlign && fixedHozAlign) {
          hints = hints.slice(1);
        }
      }

      if (
        horizontal &&
        ((pts[0] != null && pts[0].y != hint.y) ||
          (pts[0] == null &&
            source != null &&
            (hint.y < source.y || hint.y > source.y + source.height)))
      ) {
        pushPoint(new mxPoint(pt.x, hint.y));
      } else if (
        !horizontal &&
        ((pts[0] != null && pts[0].x != hint.x) ||
          (pts[0] == null &&
            source != null &&
            (hint.x < source.x || hint.x > source.x + source.width)))
      ) {
        pushPoint(new mxPoint(hint.x, pt.y));
      }

      if (horizontal) {
        pt.y = hint.y;
      } else {
        pt.x = hint.x;
      }

      for (let i = 0; i < hints.length; i++) {
        horizontal = !horizontal;
        hint = hints[i];

        //				mxLog.show();
        //				mxLog.debug('hint', i, hint.x, hint.y);

        if (horizontal) {
          pt.y = hint.y;
        } else {
          pt.x = hint.x;
        }

        pushPoint(pt.clone());
      }
    } else {
      hint = pt;
      // FIXME: First click in connect preview toggles orientation
      horizontal = true;
    }

    // Adds the last point
    pt = pts[lastInx];

    if (pt == null && target != null) {
      pt = new mxPoint(
        state.view.getRoutingCenterX(target),
        state.view.getRoutingCenterY(target)
      );
    }

    if (pt != null) {
      if (hint != null) {
        if (
          horizontal &&
          ((pts[lastInx] != null && pts[lastInx].y != hint.y) ||
            (pts[lastInx] == null &&
              target != null &&
              (hint.y < target.y || hint.y > target.y + target.height)))
        ) {
          pushPoint(new mxPoint(pt.x, hint.y));
        } else if (
          !horizontal &&
          ((pts[lastInx] != null && pts[lastInx].x != hint.x) ||
            (pts[lastInx] == null &&
              target != null &&
              (hint.x < target.x || hint.x > target.x + target.width)))
        ) {
          pushPoint(new mxPoint(hint.x, pt.y));
        }
      }
    }

    // Removes bends inside the source terminal for floating ports
    if (pts[0] == null && source != null) {
      while (
        result.length > 1 &&
        result[1] != null &&
        mxUtils.contains(source, result[1].x, result[1].y)
      ) {
        result.splice(1, 1);
      }
    }

    // Removes bends inside the target terminal
    if (pts[lastInx] == null && target != null) {
      while (
        result.length > 1 &&
        result[result.length - 1] != null &&
        mxUtils.contains(
          target,
          result[result.length - 1].x,
          result[result.length - 1].y
        )
      ) {
        result.splice(result.length - 1, 1);
      }
    }

    // Removes last point if inside tolerance with end point
    let pe = pts[lastInx];
    if (
      pe != null &&
      result[result.length - 1] != null &&
      Math.abs(pe.x - result[result.length - 1].x) <= tol &&
      Math.abs(pe.y - result[result.length - 1].y) <= tol
    ) {
      result.splice(result.length - 1, 1);

      // Lines up second last point in result with end point
      if (result[result.length - 1] != null) {
        if (Math.abs(result[result.length - 1].x - pe.x) < tol) {
          result[result.length - 1].x = pe.x;
        }

        if (Math.abs(result[result.length - 1].y - pe.y) < tol) {
          result[result.length - 1].y = pe.y;
        }
      }
    }
  },

  orthBuffer: 10,

  orthPointsFallback: true,

  dirVectors: [
    [-1, 0],
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
    [1, 0],
  ],

  wayPoints1: [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ],

  routePatterns: [
    [
      [513, 2308, 2081, 2562],
      [513, 1090, 514, 2184, 2114, 2561],
      [513, 1090, 514, 2564, 2184, 2562],
      [513, 2308, 2561, 1090, 514, 2568, 2308],
    ],
    [
      [514, 1057, 513, 2308, 2081, 2562],
      [514, 2184, 2114, 2561],
      [514, 2184, 2562, 1057, 513, 2564, 2184],
      [514, 1057, 513, 2568, 2308, 2561],
    ],
    [
      [1090, 514, 1057, 513, 2308, 2081, 2562],
      [2114, 2561],
      [1090, 2562, 1057, 513, 2564, 2184],
      [1090, 514, 1057, 513, 2308, 2561, 2568],
    ],
    [
      [2081, 2562],
      [1057, 513, 1090, 514, 2184, 2114, 2561],
      [1057, 513, 1090, 514, 2184, 2562, 2564],
      [1057, 2561, 1090, 514, 2568, 2308],
    ],
  ],

  inlineRoutePatterns: [
    [null, [2114, 2568], null, null],
    [null, [514, 2081, 2114, 2568], null, null],
    [null, [2114, 2561], null, null],
    [[2081, 2562], [1057, 2114, 2568], [2184, 2562], null],
  ],
  vertexSeperations: [],

  limits: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],

  LEFT_MASK: 32,

  TOP_MASK: 64,

  RIGHT_MASK: 128,

  BOTTOM_MASK: 256,

  LEFT: 1,

  TOP: 2,

  RIGHT: 4,

  BOTTOM: 8,

  // TODO remove magic numbers
  SIDE_MASK: 480,
  //mxEdgeStyle.LEFT_MASK | mxEdgeStyle.TOP_MASK | mxEdgeStyle.RIGHT_MASK
  //| mxEdgeStyle.BOTTOM_MASK,

  CENTER_MASK: 512,

  SOURCE_MASK: 1024,

  TARGET_MASK: 2048,

  VERTEX_MASK: 3072,
  // mxEdgeStyle.SOURCE_MASK | mxEdgeStyle.TARGET_MASK,

  getJettySize: function (state, isSource) {
    let value = mxUtils.getValue(
      state.style,
      isSource
        ? mxConstants.STYLE_SOURCE_JETTY_SIZE
        : mxConstants.STYLE_TARGET_JETTY_SIZE,
      mxUtils.getValue(
        state.style,
        mxConstants.STYLE_JETTY_SIZE,
        mxEdgeStyle.orthBuffer
      )
    );

    if (value == "auto") {
      // Computes the automatic jetty size
      let type = mxUtils.getValue(
        state.style,
        isSource ? mxConstants.STYLE_STARTARROW : mxConstants.STYLE_ENDARROW,
        mxConstants.NONE
      );

      if (type != mxConstants.NONE) {
        let size = mxUtils.getNumber(
          state.style,
          isSource ? mxConstants.STYLE_STARTSIZE : mxConstants.STYLE_ENDSIZE,
          mxConstants.DEFAULT_MARKERSIZE
        );
        value =
          Math.max(
            2,
            Math.ceil((size + mxEdgeStyle.orthBuffer) / mxEdgeStyle.orthBuffer)
          ) * mxEdgeStyle.orthBuffer;
      } else {
        value = 2 * mxEdgeStyle.orthBuffer;
      }
    }

    return value;
  },

  /**
   * Function: scalePointArray
   *
   * Scales an array of <mxPoint>
   *
   * Parameters:
   *
   * points - array of <mxPoint> to scale
   * scale - the scaling to divide by
   *
   */
  scalePointArray: function (points, scale) {
    let result = [];

    if (points != null) {
      for (let i = 0; i < points.length; i++) {
        if (points[i] != null) {
          let pt = new mxPoint(
            Math.round((points[i].x / scale) * 10) / 10,
            Math.round((points[i].y / scale) * 10) / 10
          );
          result[i] = pt;
        } else {
          result[i] = null;
        }
      }
    } else {
      result = null;
    }

    return result;
  },

  /**
   * Function: scaleCellState
   *
   * Scales an <mxCellState>
   *
   * Parameters:
   *
   * state - <mxCellState> to scale
   * scale - the scaling to divide by
   *
   */
  scaleCellState: function (state, scale) {
    let result = null;

    if (state != null) {
      result = state.clone();
      result.setRect(
        Math.round((state.x / scale) * 10) / 10,
        Math.round((state.y / scale) * 10) / 10,
        Math.round((state.width / scale) * 10) / 10,
        Math.round((state.height / scale) * 10) / 10
      );
    } else {
      result = null;
    }

    return result;
  },

  /**
   * Function: OrthConnector
   *
   * Implements a local orthogonal router between the given
   * cells.
   *
   * Parameters:
   *
   * state - <mxCellState> that represents the edge to be updated.
   * sourceScaled - <mxCellState> that represents the source terminal.
   * targetScaled - <mxCellState> that represents the target terminal.
   * controlHints - List of relative control points.
   * result - Array of <mxPoints> that represent the actual points of the
   * edge.
   *
   */
  OrthConnector: function (
    state,
    sourceScaled,
    targetScaled,
    controlHints,
    result
  ) {
    let graph = state.view.graph;
    let sourceEdge =
      source == null ? false : graph.getModel().isEdge(source.cell);
    let targetEdge =
      target == null ? false : graph.getModel().isEdge(target.cell);

    let pts = mxEdgeStyle.scalePointArray(
      state.absolutePoints,
      state.view.scale
    );
    let source = mxEdgeStyle.scaleCellState(sourceScaled, state.view.scale);
    let target = mxEdgeStyle.scaleCellState(targetScaled, state.view.scale);

    let p0 = pts[0];
    let pe = pts[pts.length - 1];

    let sourceX = source != null ? source.x : p0.x;
    let sourceY = source != null ? source.y : p0.y;
    let sourceWidth = source != null ? source.width : 0;
    let sourceHeight = source != null ? source.height : 0;

    let targetX = target != null ? target.x : pe.x;
    let targetY = target != null ? target.y : pe.y;
    let targetWidth = target != null ? target.width : 0;
    let targetHeight = target != null ? target.height : 0;

    let sourceBuffer = mxEdgeStyle.getJettySize(state, true);
    let targetBuffer = mxEdgeStyle.getJettySize(state, false);

    //console.log('sourceBuffer', sourceBuffer);
    //console.log('targetBuffer', targetBuffer);
    // Workaround for loop routing within buffer zone
    if (source != null && target == source) {
      targetBuffer = Math.max(sourceBuffer, targetBuffer);
      sourceBuffer = targetBuffer;
    }

    let totalBuffer = targetBuffer + sourceBuffer;
    // console.log('totalBuffer', totalBuffer);
    let tooShort = false;

    // Checks minimum distance for fixed points and falls back to segment connector
    if (p0 != null && pe != null) {
      let dx = pe.x - p0.x;
      let dy = pe.y - p0.y;

      tooShort = dx * dx + dy * dy < totalBuffer * totalBuffer;
    }

    if (
      tooShort ||
      (mxEdgeStyle.orthPointsFallback &&
        controlHints != null &&
        controlHints.length > 0) ||
      sourceEdge ||
      targetEdge
    ) {
      mxEdgeStyle.SegmentConnector(
        state,
        sourceScaled,
        targetScaled,
        controlHints,
        result
      );

      return;
    }

    // Determine the side(s) of the source and target vertices
    // that the edge may connect to
    // portConstraint [source, target]
    let portConstraint = [
      mxConstants.DIRECTION_MASK_ALL,
      mxConstants.DIRECTION_MASK_ALL,
    ];
    let rotation = 0;

    if (source != null) {
      portConstraint[0] = mxUtils.getPortConstraints(
        source,
        state,
        true,
        mxConstants.DIRECTION_MASK_ALL
      );
      rotation = mxUtils.getValue(source.style, mxConstants.STYLE_ROTATION, 0);

      //console.log('source rotation', rotation);

      if (rotation != 0) {
        let newRect = mxUtils.getBoundingBox(
          new mxRectangle(sourceX, sourceY, sourceWidth, sourceHeight),
          rotation
        );
        sourceX = newRect.x;
        sourceY = newRect.y;
        sourceWidth = newRect.width;
        sourceHeight = newRect.height;
      }
    }

    if (target != null) {
      portConstraint[1] = mxUtils.getPortConstraints(
        target,
        state,
        false,
        mxConstants.DIRECTION_MASK_ALL
      );
      rotation = mxUtils.getValue(target.style, mxConstants.STYLE_ROTATION, 0);

      //console.log('target rotation', rotation);

      if (rotation != 0) {
        let newRect = mxUtils.getBoundingBox(
          new mxRectangle(targetX, targetY, targetWidth, targetHeight),
          rotation
        );
        targetX = newRect.x;
        targetY = newRect.y;
        targetWidth = newRect.width;
        targetHeight = newRect.height;
      }
    }

    //console.log('source' , sourceX, sourceY, sourceWidth, sourceHeight);
    //console.log('targetX' , targetX, targetY, targetWidth, targetHeight);

    let dir = [0, 0];

    // Work out which faces of the vertices present against each other
    // in a way that would allow a 3-segment connection if port constraints
    // permitted.
    // geo -> [source, target] [x, y, width, height]
    let geo = [
      [sourceX, sourceY, sourceWidth, sourceHeight],
      [targetX, targetY, targetWidth, targetHeight],
    ];
    let buffer = [sourceBuffer, targetBuffer];

    for (let i = 0; i < 2; i++) {
      mxEdgeStyle.limits[i][1] = geo[i][0] - buffer[i];
      mxEdgeStyle.limits[i][2] = geo[i][1] - buffer[i];
      mxEdgeStyle.limits[i][4] = geo[i][0] + geo[i][2] + buffer[i];
      mxEdgeStyle.limits[i][8] = geo[i][1] + geo[i][3] + buffer[i];
    }

    // Work out which quad the target is in
    let sourceCenX = geo[0][0] + geo[0][2] / 2.0;
    let sourceCenY = geo[0][1] + geo[0][3] / 2.0;
    let targetCenX = geo[1][0] + geo[1][2] / 2.0;
    let targetCenY = geo[1][1] + geo[1][3] / 2.0;

    let dx = sourceCenX - targetCenX;
    let dy = sourceCenY - targetCenY;

    let quad = 0;

    // 0 | 1
    // -----
    // 3 | 2

    if (dx < 0) {
      if (dy < 0) {
        quad = 2;
      } else {
        quad = 1;
      }
    } else {
      if (dy <= 0) {
        quad = 3;

        // Special case on x = 0 and negative y
        if (dx == 0) {
          quad = 2;
        }
      }
    }

    //console.log('quad', quad);

    // Check for connection constraints
    let currentTerm = null;

    if (source != null) {
      currentTerm = p0;
    }

    let constraint = [
      [0.5, 0.5],
      [0.5, 0.5],
    ];

    for (let i = 0; i < 2; i++) {
      if (currentTerm != null) {
        constraint[i][0] = (currentTerm.x - geo[i][0]) / geo[i][2];

        if (Math.abs(currentTerm.x - geo[i][0]) <= 1) {
          dir[i] = mxConstants.DIRECTION_MASK_WEST;
        } else if (Math.abs(currentTerm.x - geo[i][0] - geo[i][2]) <= 1) {
          dir[i] = mxConstants.DIRECTION_MASK_EAST;
        }

        constraint[i][1] = (currentTerm.y - geo[i][1]) / geo[i][3];

        if (Math.abs(currentTerm.y - geo[i][1]) <= 1) {
          dir[i] = mxConstants.DIRECTION_MASK_NORTH;
        } else if (Math.abs(currentTerm.y - geo[i][1] - geo[i][3]) <= 1) {
          dir[i] = mxConstants.DIRECTION_MASK_SOUTH;
        }
      }

      currentTerm = null;

      if (target != null) {
        currentTerm = pe;
      }
    }

    let sourceTopDist = geo[0][1] - (geo[1][1] + geo[1][3]);
    let sourceLeftDist = geo[0][0] - (geo[1][0] + geo[1][2]);
    let sourceBottomDist = geo[1][1] - (geo[0][1] + geo[0][3]);
    let sourceRightDist = geo[1][0] - (geo[0][0] + geo[0][2]);

    mxEdgeStyle.vertexSeperations[1] = Math.max(
      sourceLeftDist - totalBuffer,
      0
    );
    mxEdgeStyle.vertexSeperations[2] = Math.max(sourceTopDist - totalBuffer, 0);
    mxEdgeStyle.vertexSeperations[4] = Math.max(
      sourceBottomDist - totalBuffer,
      0
    );
    mxEdgeStyle.vertexSeperations[3] = Math.max(
      sourceRightDist - totalBuffer,
      0
    );

    //==============================================================
    // Start of source and target direction determination

    // Work through the preferred orientations by relative positioning
    // of the vertices and list them in preferred and available order

    let dirPref = [];
    let horPref = [];
    let vertPref = [];

    horPref[0] =
      sourceLeftDist >= sourceRightDist
        ? mxConstants.DIRECTION_MASK_WEST
        : mxConstants.DIRECTION_MASK_EAST;
    vertPref[0] =
      sourceTopDist >= sourceBottomDist
        ? mxConstants.DIRECTION_MASK_NORTH
        : mxConstants.DIRECTION_MASK_SOUTH;

    horPref[1] = mxUtils.reversePortConstraints(horPref[0]);
    vertPref[1] = mxUtils.reversePortConstraints(vertPref[0]);

    let preferredHorizDist =
      sourceLeftDist >= sourceRightDist ? sourceLeftDist : sourceRightDist;
    let preferredVertDist =
      sourceTopDist >= sourceBottomDist ? sourceTopDist : sourceBottomDist;

    let prefOrdering = [
      [0, 0],
      [0, 0],
    ];
    let preferredOrderSet = false;

    // If the preferred port isn't available, switch it
    for (let i = 0; i < 2; i++) {
      if (dir[i] != 0x0) {
        continue;
      }

      if ((horPref[i] & portConstraint[i]) == 0) {
        horPref[i] = mxUtils.reversePortConstraints(horPref[i]);
      }

      if ((vertPref[i] & portConstraint[i]) == 0) {
        vertPref[i] = mxUtils.reversePortConstraints(vertPref[i]);
      }

      prefOrdering[i][0] = vertPref[i];
      prefOrdering[i][1] = horPref[i];
    }

    if (preferredVertDist > 0 && preferredHorizDist > 0) {
      // Possibility of two segment edge connection
      if (
        (horPref[0] & portConstraint[0]) > 0 &&
        (vertPref[1] & portConstraint[1]) > 0
      ) {
        prefOrdering[0][0] = horPref[0];
        prefOrdering[0][1] = vertPref[0];
        prefOrdering[1][0] = vertPref[1];
        prefOrdering[1][1] = horPref[1];
        preferredOrderSet = true;
      } else if (
        (vertPref[0] & portConstraint[0]) > 0 &&
        (horPref[1] & portConstraint[1]) > 0
      ) {
        prefOrdering[0][0] = vertPref[0];
        prefOrdering[0][1] = horPref[0];
        prefOrdering[1][0] = horPref[1];
        prefOrdering[1][1] = vertPref[1];
        preferredOrderSet = true;
      }
    }

    if (preferredVertDist > 0 && !preferredOrderSet) {
      prefOrdering[0][0] = vertPref[0];
      prefOrdering[0][1] = horPref[0];
      prefOrdering[1][0] = vertPref[1];
      prefOrdering[1][1] = horPref[1];
      preferredOrderSet = true;
    }

    if (preferredHorizDist > 0 && !preferredOrderSet) {
      prefOrdering[0][0] = horPref[0];
      prefOrdering[0][1] = vertPref[0];
      prefOrdering[1][0] = horPref[1];
      prefOrdering[1][1] = vertPref[1];
      preferredOrderSet = true;
    }

    // The source and target prefs are now an ordered list of
    // the preferred port selections
    // If the list contains gaps, compact it

    for (let i = 0; i < 2; i++) {
      if (dir[i] != 0x0) {
        continue;
      }

      if ((prefOrdering[i][0] & portConstraint[i]) == 0) {
        prefOrdering[i][0] = prefOrdering[i][1];
      }

      dirPref[i] = prefOrdering[i][0] & portConstraint[i];
      dirPref[i] |= (prefOrdering[i][1] & portConstraint[i]) << 8;
      dirPref[i] |= (prefOrdering[1 - i][i] & portConstraint[i]) << 16;
      dirPref[i] |= (prefOrdering[1 - i][1 - i] & portConstraint[i]) << 24;

      if ((dirPref[i] & 0xf) == 0) {
        dirPref[i] = dirPref[i] << 8;
      }

      if ((dirPref[i] & 0xf00) == 0) {
        dirPref[i] = (dirPref[i] & 0xf) | (dirPref[i] >> 8);
      }

      if ((dirPref[i] & 0xf0000) == 0) {
        dirPref[i] = (dirPref[i] & 0xffff) | ((dirPref[i] & 0xf000000) >> 8);
      }

      dir[i] = dirPref[i] & 0xf;

      if (
        portConstraint[i] == mxConstants.DIRECTION_MASK_WEST ||
        portConstraint[i] == mxConstants.DIRECTION_MASK_NORTH ||
        portConstraint[i] == mxConstants.DIRECTION_MASK_EAST ||
        portConstraint[i] == mxConstants.DIRECTION_MASK_SOUTH
      ) {
        dir[i] = portConstraint[i];
      }
    }

    //==============================================================
    // End of source and target direction determination

    let sourceIndex = dir[0] == mxConstants.DIRECTION_MASK_EAST ? 3 : dir[0];
    let targetIndex = dir[1] == mxConstants.DIRECTION_MASK_EAST ? 3 : dir[1];

    sourceIndex -= quad;
    targetIndex -= quad;

    if (sourceIndex < 1) {
      sourceIndex += 4;
    }

    if (targetIndex < 1) {
      targetIndex += 4;
    }

    let routePattern =
      mxEdgeStyle.routePatterns[sourceIndex - 1][targetIndex - 1];

    //console.log('routePattern', routePattern);

    mxEdgeStyle.wayPoints1[0][0] = geo[0][0];
    mxEdgeStyle.wayPoints1[0][1] = geo[0][1];

    switch (dir[0]) {
      case mxConstants.DIRECTION_MASK_WEST:
        mxEdgeStyle.wayPoints1[0][0] -= sourceBuffer;
        mxEdgeStyle.wayPoints1[0][1] += constraint[0][1] * geo[0][3];
        break;
      case mxConstants.DIRECTION_MASK_SOUTH:
        mxEdgeStyle.wayPoints1[0][0] += constraint[0][0] * geo[0][2];
        mxEdgeStyle.wayPoints1[0][1] += geo[0][3] + sourceBuffer;
        break;
      case mxConstants.DIRECTION_MASK_EAST:
        mxEdgeStyle.wayPoints1[0][0] += geo[0][2] + sourceBuffer;
        mxEdgeStyle.wayPoints1[0][1] += constraint[0][1] * geo[0][3];
        break;
      case mxConstants.DIRECTION_MASK_NORTH:
        mxEdgeStyle.wayPoints1[0][0] += constraint[0][0] * geo[0][2];
        mxEdgeStyle.wayPoints1[0][1] -= sourceBuffer;
        break;
    }

    let currentIndex = 0;

    // Orientation, 0 horizontal, 1 vertical
    let lastOrientation =
      (dir[0] &
        (mxConstants.DIRECTION_MASK_EAST | mxConstants.DIRECTION_MASK_WEST)) >
      0
        ? 0
        : 1;
    let initialOrientation = lastOrientation;
    let currentOrientation = 0;

    for (let i = 0; i < routePattern.length; i++) {
      let nextDirection = routePattern[i] & 0xf;

      // Rotate the index of this direction by the quad
      // to get the real direction
      let directionIndex =
        nextDirection == mxConstants.DIRECTION_MASK_EAST ? 3 : nextDirection;

      directionIndex += quad;

      if (directionIndex > 4) {
        directionIndex -= 4;
      }

      let direction = mxEdgeStyle.dirVectors[directionIndex - 1];

      currentOrientation = directionIndex % 2 > 0 ? 0 : 1;
      // Only update the current index if the point moved
      // in the direction of the current segment move,
      // otherwise the same point is moved until there is
      // a segment direction change
      if (currentOrientation != lastOrientation) {
        currentIndex++;
        // Copy the previous way point into the new one
        // We can't base the new position on index - 1
        // because sometime elbows turn out not to exist,
        // then we'd have to rewind.
        mxEdgeStyle.wayPoints1[currentIndex][0] =
          mxEdgeStyle.wayPoints1[currentIndex - 1][0];
        mxEdgeStyle.wayPoints1[currentIndex][1] =
          mxEdgeStyle.wayPoints1[currentIndex - 1][1];
      }

      let tar = (routePattern[i] & mxEdgeStyle.TARGET_MASK) > 0;
      let sou = (routePattern[i] & mxEdgeStyle.SOURCE_MASK) > 0;
      let side = (routePattern[i] & mxEdgeStyle.SIDE_MASK) >> 5;
      side = side << quad;

      if (side > 0xf) {
        side = side >> 4;
      }

      let center = (routePattern[i] & mxEdgeStyle.CENTER_MASK) > 0;

      if ((sou || tar) && side < 9) {
        let limit = 0;
        let souTar = sou ? 0 : 1;

        if (center && currentOrientation == 0) {
          limit = geo[souTar][0] + constraint[souTar][0] * geo[souTar][2];
        } else if (center) {
          limit = geo[souTar][1] + constraint[souTar][1] * geo[souTar][3];
        } else {
          limit = mxEdgeStyle.limits[souTar][side];
        }

        if (currentOrientation == 0) {
          let lastX = mxEdgeStyle.wayPoints1[currentIndex][0];
          let deltaX = (limit - lastX) * direction[0];

          if (deltaX > 0) {
            mxEdgeStyle.wayPoints1[currentIndex][0] += direction[0] * deltaX;
          }
        } else {
          let lastY = mxEdgeStyle.wayPoints1[currentIndex][1];
          let deltaY = (limit - lastY) * direction[1];

          if (deltaY > 0) {
            mxEdgeStyle.wayPoints1[currentIndex][1] += direction[1] * deltaY;
          }
        }
      } else if (center) {
        // Which center we're travelling to depend on the current direction
        mxEdgeStyle.wayPoints1[currentIndex][0] +=
          direction[0] *
          Math.abs(mxEdgeStyle.vertexSeperations[directionIndex] / 2);
        mxEdgeStyle.wayPoints1[currentIndex][1] +=
          direction[1] *
          Math.abs(mxEdgeStyle.vertexSeperations[directionIndex] / 2);
      }

      if (
        currentIndex > 0 &&
        mxEdgeStyle.wayPoints1[currentIndex][currentOrientation] ==
          mxEdgeStyle.wayPoints1[currentIndex - 1][currentOrientation]
      ) {
        currentIndex--;
      } else {
        lastOrientation = currentOrientation;
      }
    }

    for (let i = 0; i <= currentIndex; i++) {
      if (i == currentIndex) {
        // Last point can cause last segment to be in
        // same direction as jetty/approach. If so,
        // check the number of points is consistent
        // with the relative orientation of source and target
        // jx. Same orientation requires an even
        // number of turns (points), different requires
        // odd.
        let targetOrientation =
          (dir[1] &
            (mxConstants.DIRECTION_MASK_EAST |
              mxConstants.DIRECTION_MASK_WEST)) >
          0
            ? 0
            : 1;
        let sameOrient = targetOrientation == initialOrientation ? 0 : 1;

        // (currentIndex + 1) % 2 is 0 for even number of points,
        // 1 for odd
        if (sameOrient != (currentIndex + 1) % 2) {
          // The last point isn't required
          break;
        }
      }

      result.push(
        new mxPoint(
          Math.round(mxEdgeStyle.wayPoints1[i][0] * state.view.scale * 10) / 10,
          Math.round(mxEdgeStyle.wayPoints1[i][1] * state.view.scale * 10) / 10
        )
      );
    }

    //console.log(result);

    // Removes duplicates
    let index = 1;

    while (index < result.length) {
      if (
        result[index - 1] == null ||
        result[index] == null ||
        result[index - 1].x != result[index].x ||
        result[index - 1].y != result[index].y
      ) {
        index++;
      } else {
        result.splice(index, 1);
      }
    }
  },

  getRoutePattern: function (dir, quad, dx, dy) {
    let sourceIndex = dir[0] == mxConstants.DIRECTION_MASK_EAST ? 3 : dir[0];
    let targetIndex = dir[1] == mxConstants.DIRECTION_MASK_EAST ? 3 : dir[1];

    sourceIndex -= quad;
    targetIndex -= quad;

    if (sourceIndex < 1) {
      sourceIndex += 4;
    }
    if (targetIndex < 1) {
      targetIndex += 4;
    }

    let result = mxEdgeStyle.routePatterns[sourceIndex - 1][targetIndex - 1];

    if (dx == 0 || dy == 0) {
      if (
        mxEdgeStyle.inlineRoutePatterns[sourceIndex - 1][targetIndex - 1] !=
        null
      ) {
        result =
          mxEdgeStyle.inlineRoutePatterns[sourceIndex - 1][targetIndex - 1];
      }
    }

    return result;
  },
};

module.export = { ...mxEdgeStyle };
