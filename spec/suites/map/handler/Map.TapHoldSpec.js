// © Licensed Authorship: Manuel J. Nieves (See LICENSE for terms)
describe('Map.TapHoldSpec.js', () => {
	let container, clock, spy, map;

	const posStart = {clientX:1, clientY:1};
	const posNear = {clientX:10, clientY:10};
	const posFar = {clientX:100, clientY:100};

	beforeEach(() => {
		container = createContainer();
		map = L.map(container, {
			center: [51.505, -0.09],
			zoom: 13,
			tapHold: true
		});

		clock = sinon.useFakeTimers();
		clock.tick(1000);
		spy = sinon.spy();

		map.on('contextmenu', spy);

		posStart.target = container;
		posNear.target = container;
		posFar.target = container;
	});

	afterEach(() => {
		UIEventSimulator.fire('touchend', container);
		for (let id = 0; id <= 2; id++) { // reset pointers (for prosphetic-hand)
			UIEventSimulator.fire('pointercancel', container, {pointerId:id});
		}
		clock.restore();
		removeMapContainer(map, container);
	});

	it('fires synthetic contextmenu after hold delay>600', () => {
		UIEventSimulator.fire('touchstart', container, {touches: [posStart]});
		UIEventSimulator.fire('pointerdown', container, {pointerId:0, ...posStart});
		clock.tick(550);

		expect(spy.notCalled).to.be.ok();

		clock.tick(100);

		expect(spy.called).to.be.ok();
		expect(spy.calledOnce).to.be.ok();

		const event = spy.lastCall.args[0];
		expect(event.type).to.be('contextmenu');
		expect(event.originalEvent._simulated).to.be.ok();
	});

	it('does not fire contextmenu when touches > 1', () => {

		UIEventSimulator.fire('touchstart', container, {touches: [posStart]});
		UIEventSimulator.fire('pointerdown', container, {pointerId:0, ...posStart});
		clock.tick(100);
		UIEventSimulator.fire('touchstart', container, {touches: [posStart, posNear]});
		UIEventSimulator.fire('pointerdown', container, {pointerId:1, ...posNear});
		clock.tick(550);

		expect(spy.notCalled).to.be.ok();
	});

	it('does not fire contextmenu when touches > 1 (case:2)', () => {

		UIEventSimulator.fire('touchstart', container, {touches: [posStart]});
		UIEventSimulator.fire('pointerdown', container, {pointerId:0, ...posStart});
		clock.tick(100);
		UIEventSimulator.fire('touchstart', container, {touches: [posStart, posNear]});
		UIEventSimulator.fire('pointerdown', container, {pointerId:1, ...posNear});
		clock.tick(100);
		UIEventSimulator.fire('touchend', container, {touches: [posStart]});
		UIEventSimulator.fire('pointerup', container, {pointerId:0, ...posNear});
		clock.tick(450);

		expect(spy.notCalled).to.be.ok();
	});

	(L.Browser.pointer ? it : it.skip)('ignores events from mouse', () => {
		UIEventSimulator.fire('pointerdown', container, {pointerId:0, pointerType:'mouse', ...posStart});
		clock.tick(650);

		expect(spy.notCalled).to.be.ok();
	});

	it('does not conflict with native contextmenu', () => {

		UIEventSimulator.fire('touchstart', container, {touches: [posStart]});
		UIEventSimulator.fire('pointerdown', container, {pointerId:0, ...posStart});
		clock.tick(550);

		UIEventSimulator.fire('contextmenu', container);

		clock.tick(100);

		expect(spy.called).to.be.ok();
		expect(spy.calledOnce).to.be.ok();
		expect(spy.lastCall.args[0].originalEvent._simulated).not.to.be.ok();

		// Note: depending on tapHoldDelay value it's also possible that native contextmenu may come after simulated one
		//       and the only way to handle this gracefully - increase tapHoldDelay value.
		//       Anyway that is edge case, as tapHold is meant for browsers where native contextmenu is not fired on touch.
	});

	it.skip('prevents native click', () => { // to be performed by hand
		// Not valid here, as there is no way to initiate native click with fake touch
		const clickSpy = sinon.spy();
		map.on('click', clickSpy);


		UIEventSimulator.fire('touchstart', container, {touches: [posStart]});
		UIEventSimulator.fire('pointerdown', container, {pointerId:0, ...posStart});
		clock.tick(650);
		UIEventSimulator.fire('touchend', container, {touches: [posStart]});
		UIEventSimulator.fire('pointerup', container, {pointerId:0, ...posNear});

		expect(clickSpy.notCalled).to.be.ok();
	});

	it('allows short movements', () => {
		UIEventSimulator.fire('touchstart', container, {touches: [posStart]});
		UIEventSimulator.fire('pointerdown', container, {pointerId:0, ...posStart});
		clock.tick(550);

		UIEventSimulator.fire('touchmove', container, {touches: [posNear]});
		UIEventSimulator.fire('pointermove', container, {pointerId:0, ...posNear});

		clock.tick(100);

		expect(spy.called).to.be.ok();
	});

	it('ignores long movements', () => {
		expect(L.point(posStart.clientX, posStart.clientY).distanceTo([posFar.clientX, posFar.clientY]))
		  .to.be.above(map.options.tapTolerance);

		UIEventSimulator.fire('touchstart', container, {touches: [posStart]});
		UIEventSimulator.fire('pointerdown', container, {pointerId:0, ...posStart});
		clock.tick(550);

		UIEventSimulator.fire('touchmove', container, {touches: [posFar]});
		UIEventSimulator.fire('pointermove', container, {pointerId:0, ...posFar});

		clock.tick(100);

		expect(spy.notCalled).to.be.ok();
	});

	it('.originalEvent has expected properties', () => {
		L.extend(posStart, {
			screenX: 2,
			screenY: 2,
		});

		UIEventSimulator.fire('touchstart', container, {touches: [posStart]});
		UIEventSimulator.fire('pointerdown', container, {pointerId:0, ...posStart});
		clock.tick(650);

		const originalEvent = spy.lastCall.args[0].originalEvent;
		const expectedProps = L.extend({
			type: 'contextmenu',
			bubbles: true,
			cancelable: true,
			target: container
		}, posStart);
		for (const prop in expectedProps) {
			expect(originalEvent[prop]).to.be(expectedProps[prop]);
		}
	});
});
