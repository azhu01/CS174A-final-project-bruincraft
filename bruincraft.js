import {defs, tiny} from './examples/common.js';
import {Background_Shader, Phong_Sunlight_Shader} from './shaders.js';
import { Constrained_Movement_Controls } from './movement.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class BruinCraft extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
            // TODO:  Fill in as many additional shape instances as needed in this key/value table.
            //        (Requirement 1)
            block: new defs.Cube(),
            floor: new defs.Square(),
            background: new defs.Square()
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            phong_sunlight: new Material(new Phong_Sunlight_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            // TODO:  Fill in as many additional material objects as needed in this key/value table.
            //        (Requirement 4)
            background: new Material(new Background_Shader()),
        }
        this.blocks = [];
        let numberOfSquares = 50;
        //let model_transform = Mat4.translation(-numberOfSquares, 0, 0);
        for(let i = 0; i < numberOfSquares; i++) {
            //console.log(model_transform);
            for (let j = 0; j < numberOfSquares; j++) {
                //this.blocks.push([i * 2, 0, j * 2]);
                if (Math.random() < 0.05) {
                    let height = Math.floor(Math.random() * 10);
                    for (let k = 0; k < height; k++) {
                        this.blocks.push([i*2, k * 2, j*2]);
                    }                
                }
                
            }
        }
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new Constrained_Movement_Controls());
            console.log("initialized");
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(context.scratchpad.controls.current_camera_location);
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        // TODO: Lighting (Requirement 2)
        const light_position = vec4(20, 5, 20, 1);
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, color(5, 5, 5, 1), 10)];

        // TODO:  Fill in matrix operations and drawing code to draw the solar system scene (Requirements 3 and 4)
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const yellow = hex_color("#fac91a");
        const green = hex_color("#228B22");
        const blue = hex_color("#87CEEB");

        let model_transform = Mat4.identity();

        for (let i = 0; i < this.blocks.length; i++) {
            let curr = this.blocks[i];
            this.shapes.block.draw(context, program_state, model_transform.times(Mat4.translation(curr[0], curr[1], curr[2])), this.materials.phong_sunlight.override({color: yellow}));
        }
        this.shapes.floor.draw(context, program_state, model_transform.times(Mat4.rotation(3*Math.PI / 2, 1, 0, 0)).times(Mat4.scale(10000, 10000, 1)), this.materials.phong_sunlight.override({color: green}));
        this.shapes.background.draw(context, program_state, program_state.camera_transform.times(Mat4.translation(0, 0, -999.9)).times(Mat4.scale(10000, 10000, 1)), this.materials.background);
        //this.shapes.background.draw(context, program_state, program_state.camera_transform.times(Mat4.translation(0, 0, +999.9)).times(Mat4.scale(10000, 10000, 1)), this.materials.test.override({color: blue}));
    }
}


