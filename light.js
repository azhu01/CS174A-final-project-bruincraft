import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class DirectedLight extends Light {
    constructor(position, color, size, view_target, fov) {
        super(position, color, size);
        Object.assign(this, {view_target, fov});
        this.light = new Light(position, color, size);
    }
}