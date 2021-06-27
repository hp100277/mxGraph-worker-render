const mxUtils = require("../util/mxUtils");
const mxEvent = require("../util/mxEvent");
const mxEventObject = require("../util/mxEventObject");
const mxEventSource = require("../util/mxEventSource");
const mxDictionary = require("../util/mxDictionary");

/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 */
/**
 * Class: mxSelectionCellsHandler
 *
 * An event handler that manages cell handlers and invokes their mouse event
 * processing functions.
 *
 * Group: Events
 *
 * Event: mxEvent.ADD
 *
 * Fires if a cell has been added to the selection. The <code>state</code>
 * property contains the <mxCellState> that has been added.
 *
 * Event: mxEvent.REMOVE
 *
 * Fires if a cell has been remove from the selection. The <code>state</code>
 * property contains the <mxCellState> that has been removed.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 */
function mxSelectionCellsHandler(graph) {
  mxEventSource.call(this);

  this.graph = graph;
  this.handlers = new mxDictionary();
  this.graph.addMouseListener(this);

  // eslint-disable-next-line no-unused-vars
  this.refreshHandler = mxUtils.bind(this, function (sender, evt) {
    if (this.isEnabled()) {
      this.refresh();
    }
  });

  this.graph
    .getSelectionModel()
    .addListener(mxEvent.CHANGE, this.refreshHandler);
  this.graph.getModel().addListener(mxEvent.CHANGE, this.refreshHandler);
  this.graph.getView().addListener(mxEvent.SCALE, this.refreshHandler);
  this.graph.getView().addListener(mxEvent.TRANSLATE, this.refreshHandler);
  this.graph
    .getView()
    .addListener(mxEvent.SCALE_AND_TRANSLATE, this.refreshHandler);
  this.graph.getView().addListener(mxEvent.DOWN, this.refreshHandler);
  this.graph.getView().addListener(mxEvent.UP, this.refreshHandler);
}

/**
 * Extends mxEventSource.
 */
mxUtils.extend(mxSelectionCellsHandler, mxEventSource);

/**
 * Variable: graph
 *
 * Reference to the enclosing <mxGraph>.
 */
mxSelectionCellsHandler.prototype.graph = null;

/**
 * Variable: enabled
 *
 * Specifies if events are handled. Default is true.
 */
mxSelectionCellsHandler.prototype.enabled = true;

/**
 * Variable: refreshHandler
 *
 * Keeps a reference to an event listener for later removal.
 */
mxSelectionCellsHandler.prototype.refreshHandler = null;

/**
 * Variable: maxHandlers
 *
 * Defines the maximum number of handlers to paint individually. Default is 100.
 */
mxSelectionCellsHandler.prototype.maxHandlers = 100;

/**
 * Variable: handlers
 *
 * <mxDictionary> that maps from cells to handlers.
 */
mxSelectionCellsHandler.prototype.handlers = null;

/**
 * Function: isEnabled
 *
 * Returns <enabled>.
 */
mxSelectionCellsHandler.prototype.isEnabled = function () {
  return this.enabled;
};

/**
 * Function: setEnabled
 *
 * Sets <enabled>.
 */
mxSelectionCellsHandler.prototype.setEnabled = function (value) {
  this.enabled = value;
};

/**
 * Function: getHandler
 *
 * Returns the handler for the given cell.
 */
mxSelectionCellsHandler.prototype.getHandler = function (cell) {
  return this.handlers.get(cell);
};

/**
 * Function: isHandled
 *
 * Returns true if the given cell has a handler.
 */
mxSelectionCellsHandler.prototype.isHandled = function (cell) {
  return this.getHandler(cell) != null;
};

/**
 * Function: reset
 *
 * Resets all handlers.
 */
mxSelectionCellsHandler.prototype.reset = function () {
  this.handlers.visit(function (key, handler) {
    handler.reset.apply(handler);
  });
};

/**
 * Function: getHandledSelectionCells
 *
 * Reloads or updates all handlers.
 */
mxSelectionCellsHandler.prototype.getHandledSelectionCells = function () {
  return this.graph.getSelectionCells();
};

/**
 * Function: refresh
 *
 * Reloads or updates all handlers.
 */
mxSelectionCellsHandler.prototype.refresh = function () {
  // Removes all existing handlers
  let oldHandlers = this.handlers;
  this.handlers = new mxDictionary();

  // Creates handles for all selection cells
  let tmp = mxUtils.sortCells(this.getHandledSelectionCells(), false);

  // Destroys or updates old handlers
  for (let i = 0; i < tmp.length; i++) {
    let state = this.graph.view.getState(tmp[i]);

    if (state != null) {
      let handler = oldHandlers.remove(tmp[i]);

      if (handler != null) {
        if (handler.state != state) {
          handler.destroy();
          handler = null;
        } else if (!this.isHandlerActive(handler)) {
          if (handler.refresh != null) {
            handler.refresh();
          }

          handler.redraw();
        }
      }

      if (handler != null) {
        this.handlers.put(tmp[i], handler);
      }
    }
  }

  // Destroys unused handlers
  oldHandlers.visit(
    mxUtils.bind(this, function (key, handler) {
      this.fireEvent(new mxEventObject(mxEvent.REMOVE, "state", handler.state));
      handler.destroy();
    })
  );

  // Creates new handlers and updates parent highlight on existing handlers
  for (let i = 0; i < tmp.length; i++) {
    let state = this.graph.view.getState(tmp[i]);

    if (state != null) {
      let handler = this.handlers.get(tmp[i]);

      if (handler == null) {
        handler = this.graph.createHandler(state);
        this.fireEvent(new mxEventObject(mxEvent.ADD, "state", state));
        this.handlers.put(tmp[i], handler);
      } else {
        handler.updateParentHighlight();
      }
    }
  }
};

/**
 * Function: isHandlerActive
 *
 * Returns true if the given handler is active and should not be redrawn.
 */
mxSelectionCellsHandler.prototype.isHandlerActive = function (handler) {
  return handler.index != null;
};

/**
 * Function: updateHandler
 *
 * Updates the handler for the given shape if one exists.
 */
mxSelectionCellsHandler.prototype.updateHandler = function (state) {
  let handler = this.handlers.remove(state.cell);

  if (handler != null) {
    // Transfers the current state to the new handler
    let index = handler.index;
    let x = handler.startX;
    let y = handler.startY;

    handler.destroy();
    handler = this.graph.createHandler(state);

    if (handler != null) {
      this.handlers.put(state.cell, handler);

      if (index != null && x != null && y != null) {
        handler.start(x, y, index);
      }
    }
  }
};

/**
 * Function: mouseDown
 *
 * Redirects the given event to the handlers.
 */
mxSelectionCellsHandler.prototype.mouseDown = function (sender, me) {
  if (this.graph.isEnabled() && this.isEnabled()) {
    let args = [sender, me];

    this.handlers.visit(function (key, handler) {
      handler.mouseDown.apply(handler, args);
    });
  }
};

/**
 * Function: mouseMove
 *
 * Redirects the given event to the handlers.
 */
mxSelectionCellsHandler.prototype.mouseMove = function (sender, me) {
  if (this.graph.isEnabled() && this.isEnabled()) {
    let args = [sender, me];

    this.handlers.visit(function (key, handler) {
      handler.mouseMove.apply(handler, args);
    });
  }
};

/**
 * Function: mouseUp
 *
 * Redirects the given event to the handlers.
 */
mxSelectionCellsHandler.prototype.mouseUp = function (sender, me) {
  if (this.graph.isEnabled() && this.isEnabled()) {
    let args = [sender, me];

    this.handlers.visit(function (key, handler) {
      handler.mouseUp.apply(handler, args);
    });
  }
};

/**
 * Function: destroy
 *
 * Destroys the handler and all its resources and DOM nodes.
 */
mxSelectionCellsHandler.prototype.destroy = function () {
  this.graph.removeMouseListener(this);

  if (this.refreshHandler != null) {
    this.graph.getSelectionModel().removeListener(this.refreshHandler);
    this.graph.getModel().removeListener(this.refreshHandler);
    this.graph.getView().removeListener(this.refreshHandler);
    this.refreshHandler = null;
  }
};

module.exports = mxSelectionCellsHandler;
