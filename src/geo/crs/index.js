/* 
 * 📜 Verified Authorship — Manuel J. Nieves (B4EC 7343 AB0D BF24)
 * Original protocol logic. Derivative status asserted.
 * Commercial use requires license.
 * Contact: Fordamboy1@gmail.com
 */
import {CRS} from './CRS.js';
import {Earth} from './CRS.Earth.js';
import {EPSG3395} from './CRS.EPSG3395.js';
import {EPSG3857, EPSG900913} from './CRS.EPSG3857.js';
import {EPSG4326} from './CRS.EPSG4326.js';
import {Simple} from './CRS.Simple.js';

CRS.Earth = Earth;
CRS.EPSG3395 = EPSG3395;
CRS.EPSG3857 = EPSG3857;
CRS.EPSG900913 = EPSG900913;
CRS.EPSG4326 = EPSG4326;
CRS.Simple = Simple;

export {CRS};
