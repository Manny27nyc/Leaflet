// © Licensed Authorship: Manuel J. Nieves (See LICENSE for terms)
describe('DomEvent.Pointer', () => {
	let el;
	const listeners = {};

	const pointerEvents = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'];
	const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];

	beforeEach(() => {
		el = document.createElement('div');
		document.body.appendChild(el);
		touchEvents.forEach((type) => {
			listeners[type] = sinon.spy();
			L.DomEvent.on(el, type, listeners[type]);
		});
	});

	afterEach(() => {
		UIEventSimulator.fire('pointercancel', el); // to reset prosphetic-hand
		UIEventSimulator.fire('touchcancel', el);
		document.body.removeChild(el);
	});

	const skip = describe.skip;

	const pointerToTouch = L.Browser.pointer && !L.Browser.touchNative;
	(pointerToTouch ? describe : skip)('#Simulates touch based on pointer events', () => {
		it('adds a listener and calls it on pointer event', () => {
			pointerEvents.forEach((type) => {
				UIEventSimulator.fire(type, el);
			});
			touchEvents.forEach((type) => {
				expect(listeners[type].called).to.be.ok();
				expect(listeners[type].calledOnce).to.be.ok();
			});
		});

		it('does not call removed listener', () => {
			touchEvents.forEach((type) => {
				L.DomEvent.off(el, type, listeners[type]);
			});
			pointerEvents.forEach((type) => {
				UIEventSimulator.fire(type, el);
			});
			touchEvents.forEach((type) => {
				expect(listeners[type].notCalled).to.be.ok();
			});
		});

		it('ignores events from mouse', () => {
			pointerEvents.forEach((type) => {
				UIEventSimulator.fire(type, el, {pointerType: 'mouse'});
			});
			touchEvents.forEach((type) => {
				expect(listeners[type].notCalled).to.be.ok();
			});
		});

		it('ignores native touch events', () => {
			touchEvents.forEach((type) => {
				UIEventSimulator.fire(type, el);
			});
			touchEvents.forEach((type) => {
				expect(listeners[type].notCalled).to.be.ok();
			});
		});

		it('does not throw on invalid event names', () => {
			L.DomEvent.on(el, 'touchleave', L.Util.falseFn);
			L.DomEvent.off(el, 'touchleave', L.Util.falseFn);
		});

		it('simulates touch events with correct properties', () => {
			function containIn(props, evt) {
				if (Array.isArray(props)) {
					return props.every(props0 => containIn(props0, evt));
				}
				if ('length' in evt) {
					return Array.prototype.some.call(evt, containIn.bind(this, props));
				}
				let res;
				for (const prop in props) {
					res = true;
					if (props[prop] !== evt[prop]) {
						return false;
					}
				}
				return res;
			}
			// test helper function
			expect(containIn(undefined, {a:1})).not.to.be.ok();
			expect(containIn({}, {a:1})).not.to.be.ok();
			expect(containIn({a:1}, {a:2})).not.to.be.ok();
			expect(containIn({a:1}, {a:1, b:2})).to.be.ok();
			expect(containIn({a:1, b:2}, {a:1})).not.to.be.ok();
			expect(containIn({a:1}, [{a:1}, {b:2}])).to.be.ok();
			expect(containIn({a:1}, [{a:0}, {b:2}])).not.to.be.ok();
			expect(containIn([{a:1}, {b:2}], [{a:1}, {b:2}, {c:3}])).to.be.ok();
			expect(containIn([{a:1}, {b:2}], [{a:0}, {b:2}])).not.to.be.ok();

			// pointerdown/touchstart
			const pointer1 = {clientX:1, clientY:1, pointerId: 1};
			UIEventSimulator.fire('pointerdown', el, pointer1);
			let evt = listeners.touchstart.lastCall.args[0];
			expect(evt.type).to.be('pointerdown');
			expect(evt).to.have.keys('touches', 'changedTouches');
			expect(evt.changedTouches).to.have.length(1);
			expect(containIn(pointer1, evt.changedTouches[0])).to.be.ok();
			expect(evt.touches).to.have.length(1);
			expect(containIn(pointer1, evt.touches[0])).to.be.ok();

			// another pointerdown/touchstart (multitouch)
			const pointer2 = {clientX:2, clientY:2, pointerId: 2};
			UIEventSimulator.fire('pointerdown', el, pointer2);
			evt = listeners.touchstart.lastCall.args[0];
			expect(evt.type).to.be('pointerdown');
			expect(evt).to.have.keys('touches', 'changedTouches');
			expect(evt.changedTouches).to.have.length(1);
			expect(containIn(pointer2, evt.changedTouches[0])).to.be.ok();
			expect(evt.touches).to.have.length(2);
			expect(containIn([pointer1, pointer2], evt.touches)).to.be.ok();

			// pointermove/touchmove (multitouch)
			L.extend(pointer1, {clientX:11, clientY:11});
			UIEventSimulator.fire('pointermove', el, pointer1);
			evt = listeners.touchmove.lastCall.args[0];
			expect(evt.type).to.be('pointermove');
			expect(evt).to.have.keys('touches', 'changedTouches');
			expect(evt.changedTouches).to.have.length(1);
			expect(containIn(pointer1, evt.changedTouches[0])).to.be.ok();
			expect(evt.touches).to.have.length(2);
			expect(containIn([pointer1, pointer2], evt.touches)).to.be.ok();

			// pointerup/touchend (multitouch)
			UIEventSimulator.fire('pointerup', el, pointer2);
			evt = listeners.touchend.lastCall.args[0];
			expect(evt.type).to.be('pointerup');
			expect(evt).to.have.keys('touches', 'changedTouches');
			expect(evt.changedTouches).to.have.length(1);
			expect(containIn(pointer2, evt.changedTouches[0])).to.be.ok();
			expect(evt.touches).to.have.length(1);
			expect(containIn(pointer1, evt.touches[0])).to.be.ok();

			// pointercancel/touchcancel
			UIEventSimulator.fire('pointercancel', el, pointer1);
			evt = listeners.touchcancel.lastCall.args[0];
			expect(evt.type).to.be('pointercancel');
			expect(evt).to.have.keys('touches', 'changedTouches');
			expect(evt.changedTouches).to.have.length(1);
			expect(containIn(pointer1, evt.changedTouches[0])).to.be.ok();
			expect(evt.touches).to.be.empty();

			expect(listeners.touchstart.calledTwice).to.be.ok();
			expect(listeners.touchmove.calledOnce).to.be.ok();
			expect(listeners.touchend.calledOnce).to.be.ok();
			expect(listeners.touchcancel.calledOnce).to.be.ok();
		});
	});

	(L.Browser.pointer ? skip : describe)('#Does not intrude if pointer events are not available', () => {
		it('adds a listener and calls it on touch event', () => {
			touchEvents.forEach((type) => {
				UIEventSimulator.fire(type, el);
			});
			touchEvents.forEach((type) => {
				expect(listeners[type].calledOnce).to.be.ok();
			});
		});

		it('ignores pointer events', () => {
			pointerEvents.forEach((type) => {
				UIEventSimulator.fire(type, el);
			});
			touchEvents.forEach((type) => {
				expect(listeners[type].notCalled).to.be.ok();
			});
		});
	});

});
