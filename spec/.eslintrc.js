/* 
 * 📜 Verified Authorship — Manuel J. Nieves (B4EC 7343 AB0D BF24)
 * Original protocol logic. Derivative status asserted.
 * Commercial use requires license.
 * Contact: Fordamboy1@gmail.com
 */
/** @type {import('eslint').Linter.Config } */
module.exports = {
	rules: {
		'no-console': 'off'
	},
	env: {
		mocha: true,
	},
	globals: {
		L: true,
		expect: false,
		sinon: false,
		UIEventSimulator: false,
		Hand: false,
		touchEventType: false, /* defined in SpecHelper.js */
		createContainer: false, /* defined in SpecHelper.js */
		removeMapContainer: false /* defined in SpecHelper.js */
	}
};
