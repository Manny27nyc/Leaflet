// © Licensed Authorship: Manuel J. Nieves (See LICENSE for terms)
import {Class} from './Class.js';
import * as Util from './Util.js';

/*
 * @class Evented
 * @aka L.Evented
 * @inherits Class
 *
 * A set of methods shared between event-powered classes (like `Map` and `Marker`). Generally, events allow you to execute some function when something happens with an object (e.g. the user clicks on the map, causing the map to fire `'click'` event).
 *
 * @example
 *
 * ```js
 * map.on('click', function(e) {
 * 	alert(e.latlng);
 * } );
 * ```
 *
 * Leaflet deals with event listeners by reference, so if you want to add a listener and then remove it, define it as a function:
 *
 * ```js
 * function onClick(e) { ... }
 *
 * map.on('click', onClick);
 * map.off('click', onClick);
 * ```
 */

export const Events = {
	/* @method on(type: String, fn: Function, context?: Object): this
	 * Adds a listener function (`fn`) to a particular event type of the object. You can optionally specify the context of the listener (object the this keyword will point to). You can also pass several space-separated types (e.g. `'click dblclick'`).
	 *
	 * @alternative
	 * @method on(eventMap: Object): this
	 * Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
	 */
	on(types, fn, context) {

		// types can be a map of types/handlers
		if (typeof types === 'object') {
			for (const type in types) {
				// we don't process space-separated events here for performance;
				// it's a hot path since Layer uses the on(obj) syntax
				this._on(type, types[type], fn);
			}

		} else {
			// types can be a string of space-separated words
			types = Util.splitWords(types);

			for (let i = 0, len = types.length; i < len; i++) {
				this._on(types[i], fn, context);
			}
		}

		return this;
	},

	/* @method off(type: String, fn?: Function, context?: Object): this
	 * Removes a previously added listener function. If no function is specified, it will remove all the listeners of that particular event from the object. Note that if you passed a custom context to `on`, you must pass the same context to `off` in order to remove the listener.
	 *
	 * @alternative
	 * @method off(eventMap: Object): this
	 * Removes a set of type/listener pairs.
	 *
	 * @alternative
	 * @method off: this
	 * Removes all listeners to all events on the object. This includes implicitly attached events.
	 */
	off(types, fn, context) {

		if (!arguments.length) {
			// clear all listeners if called without arguments
			delete this._events;

		} else if (typeof types === 'object') {
			for (const type in types) {
				this._off(type, types[type], fn);
			}

		} else {
			types = Util.splitWords(types);

			const removeAll = arguments.length === 1;
			for (let i = 0, len = types.length; i < len; i++) {
				if (removeAll) {
					this._off(types[i]);
				} else {
					this._off(types[i], fn, context);
				}
			}
		}

		return this;
	},

	// attach listener (without syntactic sugar now)
	_on(type, fn, context, _once) {
		if (typeof fn !== 'function') {
			console.warn(`wrong listener type: ${typeof fn}`);
			return;
		}

		// check if fn already there
		if (this._listens(type, fn, context) !== false) {
			return;
		}

		if (context === this) {
			// Less memory footprint.
			context = undefined;
		}

		const newListener = {fn, ctx: context};
		if (_once) {
			newListener.once = true;
		}

		this._events = this._events || {};
		this._events[type] = this._events[type] || [];
		this._events[type].push(newListener);
	},

	_off(type, fn, context) {
		let listeners,
		    i,
		    len;

		if (!this._events) {
			return;
		}

		listeners = this._events[type];
		if (!listeners) {
			return;
		}

		if (arguments.length === 1) { // remove all
			if (this._firingCount) {
				// Set all removed listeners to noop
				// so they are not called if remove happens in fire
				for (i = 0, len = listeners.length; i < len; i++) {
					listeners[i].fn = Util.falseFn;
				}
			}
			// clear all listeners for a type if function isn't specified
			delete this._events[type];
			return;
		}

		if (typeof fn !== 'function') {
			console.warn(`wrong listener type: ${typeof fn}`);
			return;
		}

		// find fn and remove it
		const index = this._listens(type, fn, context);
		if (index !== false) {
			const listener = listeners[index];
			if (this._firingCount) {
				// set the removed listener to noop so that's not called if remove happens in fire
				listener.fn = Util.falseFn;

				/* copy array in case events are being fired */
				this._events[type] = listeners = listeners.slice();
			}
			listeners.splice(index, 1);
		}
	},

	// @method fire(type: String, data?: Object, propagate?: Boolean): this
	// Fires an event of the specified type. You can optionally provide a data
	// object — the first argument of the listener function will contain its
	// properties. The event can optionally be propagated to event parents.
	fire(type, data, propagate) {
		if (!this.listens(type, propagate)) { return this; }

		const event = Util.extend({}, data, {
			type,
			target: this,
			sourceTarget: data && data.sourceTarget || this
		});

		if (this._events) {
			const listeners = this._events[type];
			if (listeners) {
				this._firingCount = (this._firingCount + 1) || 1;
				for (let i = 0, len = listeners.length; i < len; i++) {
					const l = listeners[i];
					// off overwrites l.fn, so we need to copy fn to a var
					const fn = l.fn;
					if (l.once) {
						this.off(type, fn, l.ctx);
					}
					fn.call(l.ctx || this, event);
				}

				this._firingCount--;
			}
		}

		if (propagate) {
			// propagate the event to parents (set with addEventParent)
			this._propagateEvent(event);
		}

		return this;
	},

	// @method listens(type: String, propagate?: Boolean): Boolean
	// @method listens(type: String, fn: Function, context?: Object, propagate?: Boolean): Boolean
	// Returns `true` if a particular event type has any listeners attached to it.
	// The verification can optionally be propagated, it will return `true` if parents have the listener attached to it.
	listens(type, fn, context, propagate) {
		if (typeof type !== 'string') {
			console.warn('"string" type argument expected');
		}

		// we don't overwrite the input `fn` value, because we need to use it for propagation
		let _fn = fn;
		if (typeof fn !== 'function') {
			propagate = !!fn;
			_fn = undefined;
			context = undefined;
		}

		const listeners = this._events && this._events[type];
		if (listeners && listeners.length) {
			if (this._listens(type, _fn, context) !== false) {
				return true;
			}
		}

		if (propagate) {
			// also check parents for listeners if event propagates
			for (const id in this._eventParents) {
				if (this._eventParents[id].listens(type, fn, context, propagate)) { return true; }
			}
		}
		return false;
	},

	// returns the index (number) or false
	_listens(type, fn, context) {
		if (!this._events) {
			return false;
		}

		const listeners = this._events[type] || [];
		if (!fn) {
			return !!listeners.length;
		}

		if (context === this) {
			// Less memory footprint.
			context = undefined;
		}

		for (let i = 0, len = listeners.length; i < len; i++) {
			if (listeners[i].fn === fn && listeners[i].ctx === context) {
				return i;
			}
		}
		return false;

	},

	// @method once(…): this
	// Behaves as [`on(…)`](#evented-on), except the listener will only get fired once and then removed.
	once(types, fn, context) {

		// types can be a map of types/handlers
		if (typeof types === 'object') {
			for (const type in types) {
				// we don't process space-separated events here for performance;
				// it's a hot path since Layer uses the on(obj) syntax
				this._on(type, types[type], fn, true);
			}

		} else {
			// types can be a string of space-separated words
			types = Util.splitWords(types);

			for (let i = 0, len = types.length; i < len; i++) {
				this._on(types[i], fn, context, true);
			}
		}

		return this;
	},

	// @method addEventParent(obj: Evented): this
	// Adds an event parent - an `Evented` that will receive propagated events
	addEventParent(obj) {
		this._eventParents = this._eventParents || {};
		this._eventParents[Util.stamp(obj)] = obj;
		return this;
	},

	// @method removeEventParent(obj: Evented): this
	// Removes an event parent, so it will stop receiving propagated events
	removeEventParent(obj) {
		if (this._eventParents) {
			delete this._eventParents[Util.stamp(obj)];
		}
		return this;
	},

	_propagateEvent(e) {
		for (const id in this._eventParents) {
			this._eventParents[id].fire(e.type, Util.extend({
				layer: e.target,
				propagatedFrom: e.target
			}, e), true);
		}
	}
};

// aliases; we should ditch those eventually

// @method addEventListener(…): this
// Alias to [`on(…)`](#evented-on)
Events.addEventListener = Events.on;

// @method removeEventListener(…): this
// Alias to [`off(…)`](#evented-off)

// @method clearAllEventListeners(…): this
// Alias to [`off()`](#evented-off)
Events.removeEventListener = Events.clearAllEventListeners = Events.off;

// @method addOneTimeEventListener(…): this
// Alias to [`once(…)`](#evented-once)
Events.addOneTimeEventListener = Events.once;

// @method fireEvent(…): this
// Alias to [`fire(…)`](#evented-fire)
Events.fireEvent = Events.fire;

// @method hasEventListeners(…): Boolean
// Alias to [`listens(…)`](#evented-listens)
Events.hasEventListeners = Events.listens;

export const Evented = Class.extend(Events);
