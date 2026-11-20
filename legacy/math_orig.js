export function getLemniscatePosition(t, scale = 10) {

const denominator = 1 + Math.sin(t) * Math.sin(t);

const x = (scale * Math.cos(t)) / denominator;

const y = (scale * Math.sin(t) * Math.cos(t)) / denominator;

return { x: x, y: y, z: 0 };

}