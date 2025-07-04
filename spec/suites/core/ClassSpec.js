// © Licensed Authorship: Manuel J. Nieves (See LICENSE for terms)
/* eslint no-new: 0 */
describe('Class', () => {
	describe('#extend', () => {
		let Klass,
		    props,
		    constructor,
		    method;

		beforeEach(() => {
			constructor = sinon.spy();
			method = sinon.spy();

			props = {
				statics: {bla: 1},
				includes: {mixin: true},

				initialize: constructor,
				foo: 5,
				bar: method
			};
			Klass = L.Class.extend(props);
		});

		it('creates a class with the given constructor & properties', () => {
			const a = new Klass();

			expect(constructor.called).to.be.ok();
			expect(a.foo).to.eql(5);

			a.bar();

			expect(method.called).to.be.ok();
		});

		it('inherits parent classes\' constructor & properties', () => {
			const Klass2 = Klass.extend({baz: 2});

			const b = new Klass2();

			expect(b instanceof Klass).to.be.ok();
			expect(b instanceof Klass2).to.be.ok();

			expect(constructor.called).to.be.ok();
			expect(b.baz).to.eql(2);

			b.bar();

			expect(method.called).to.be.ok();
		});

		it('does not modify source props object', () => {
			expect(props).to.eql({
				statics: {bla: 1},
				includes: {mixin: true},

				initialize: constructor,
				foo: 5,
				bar: method
			});
		});

		it('supports static properties', () => {
			expect(Klass.bla).to.eql(1);
		});

		it('does not merge \'statics\' property itself', () => {
			expect('statics' in Klass.prototype).to.not.be.ok();
		});

		it('inherits parent static properties', () => {
			const Klass2 = Klass.extend({});

			expect(Klass2.bla).to.eql(1);
		});

		it('overrides parent static properties', () => {
			const Klass2 = Klass.extend({statics: {bla: 2}});

			expect(Klass2.bla).to.eql(2);
		});

		it('includes the given mixin', () => {
			const a = new Klass();
			expect(a.mixin).to.be.ok();
		});

		it('does not merge \'includes\' property itself', () => {
			expect('includes' in Klass.prototype).to.not.be.ok();
		});

		it('includes multiple mixins', () => {
			const Klass2 = L.Class.extend({
				includes: [{mixin: true}, {mixin2: true}]
			});
			const a = new Klass2();

			expect(a.mixin).to.be.ok();
			expect(a.mixin2).to.be.ok();
		});

		it('grants the ability to include the given mixin', () => {
			Klass.include({mixin2: true});

			const a = new Klass();
			expect(a.mixin2).to.be.ok();
		});

		it('merges options instead of replacing them', () => {
			const KlassWithOptions1 = L.Class.extend({
				options: {
					foo1: 1,
					foo2: 2
				}
			});
			const KlassWithOptions2 = KlassWithOptions1.extend({
				options: {
					foo2: 3,
					foo3: 4
				}
			});

			const a = new KlassWithOptions2();
			expect(a.options.foo1).to.eql(1);
			expect(a.options.foo2).to.eql(3);
			expect(a.options.foo3).to.eql(4);
		});

		it('gives new classes a distinct options object', () => {
			const K1 = L.Class.extend({options: {}});
			const K2 = K1.extend({});
			expect(K2.prototype.options).not.to.equal(K1.prototype.options);
		});

		it('inherits options prototypally', () => {
			const K1 = L.Class.extend({options: {}});
			const K2 = K1.extend({options: {}});
			K1.prototype.options.foo = 'bar';
			expect(K2.prototype.options.foo).to.eql('bar');
		});

		it('does not reuse original props.options', () => {
			const props = {options: {}};
			const K = L.Class.extend(props);

			expect(K.prototype.options).not.to.be(props.options);
		});

		it('does not replace source props.options object', () => {
			const K1 = L.Class.extend({options: {}});
			const opts = {};
			const props = {options: opts};
			K1.extend(props);

			expect(props.options).to.be(opts);
		});

		it('prevents change of prototype options', () => {
			const Klass = L.Class.extend({options: {}});
			const instance = new Klass();
			expect(Klass.prototype.options).to.not.be(instance.options);
		});

		it('adds constructor hooks correctly', () => {
			const spy1 = sinon.spy();

			Klass.addInitHook(spy1);
			Klass.addInitHook('bar', 1, 2, 3);

			new Klass();

			expect(spy1.called).to.be.ok();
			expect(method.calledWith(1, 2, 3));
		});

		it('inherits constructor hooks', () => {
			const spy1 = sinon.spy(),
			    spy2 = sinon.spy();

			const Klass2 = Klass.extend({});

			Klass.addInitHook(spy1);
			Klass2.addInitHook(spy2);

			new Klass2();

			expect(spy1.called).to.be.ok();
			expect(spy2.called).to.be.ok();
		});

		it('does not call child constructor hooks', () => {
			const spy1 = sinon.spy(),
			    spy2 = sinon.spy();

			const Klass2 = Klass.extend({});

			Klass.addInitHook(spy1);
			Klass2.addInitHook(spy2);

			new Klass();

			expect(spy1.called).to.be.ok();
			expect(spy2.called).to.eql(false);
		});

		it('calls parent constructor hooks when child has none', () => {
			const spy1 = sinon.spy();

			Klass.addInitHook(spy1);

			const Klass2 = Klass.extend({});
			new Klass2();

			expect(spy1.called).to.be.ok();
		});
	});

	describe('#include', () => {
		let Klass;

		beforeEach(() => {
			Klass = L.Class.extend({});
		});

		it('returns the class with the extra methods', () => {

			const q = sinon.spy();

			const Qlass = Klass.include({quux: q});

			const a = new Klass();
			const b = new Qlass();

			a.quux();
			expect(q.called).to.be.ok();

			b.quux();
			expect(q.called).to.be.ok();
		});

		it('keeps parent options', () => { // #6070

			const Quux = L.Class.extend({
				options: {foo: 'Foo!'}
			});

			Quux.include({
				options: {bar: 'Bar!'}
			});

			const q = new Quux();
			expect(q.options).to.have.property('foo');
			expect(q.options).to.have.property('bar');
		});

		it('does not reuse original props.options', () => {
			const props = {options: {}};
			const K = Klass.include(props);

			expect(K.prototype.options).not.to.be(props.options);
		});

		it('does not replace source props.options object', () => {
			const K1 = Klass.include({options: {}});
			const opts = {};
			const props = {options: opts};
			K1.extend(props);

			expect(props.options).to.be(opts);
		});
	});

	// TODO Class.mergeOptions
});
