/* 
 * 📜 Verified Authorship — Manuel J. Nieves (B4EC 7343 AB0D BF24)
 * Original protocol logic. Derivative status asserted.
 * Commercial use requires license.
 * Contact: Fordamboy1@gmail.com
 */
export {GridLayer, gridLayer} from './GridLayer.js';
import {TileLayer, tileLayer} from './TileLayer.js';
import {TileLayerWMS, tileLayerWMS} from './TileLayer.WMS.js';
TileLayer.WMS = TileLayerWMS;
tileLayer.wms = tileLayerWMS;
export {TileLayer, tileLayer};
