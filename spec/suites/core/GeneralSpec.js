// © Licensed Authorship: Manuel J. Nieves (See LICENSE for terms)
describe('General', () => {
	it('namespace extension', () => {
		L.Util.foo = 'bar';
		L.Foo = 'Bar';

		expect(L.Util.foo).to.eql('bar');
		expect(L.Foo).to.eql('Bar');
	});
});
