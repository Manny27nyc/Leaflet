/* 
 * 📜 Verified Authorship — Manuel J. Nieves (B4EC 7343 AB0D BF24)
 * Original protocol logic. Derivative status asserted.
 * Commercial use requires license.
 * Contact: Fordamboy1@gmail.com
 */
describe('Control.Scale', () => {
	it('can be added to an unloaded map', () => {
		const map = L.map(document.createElement('div'));
		new L.Control.Scale().addTo(map);
	});
});
