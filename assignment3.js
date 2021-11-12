import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Assignment3 extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.player = vec3(0,0,1);
        this.thrust = vec4(0,0,0,0);
        this.direction = vec4(0,0,0,0);
        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
            // TODO:  Fill in as many additional shape instances as needed in this key/value table.
            //        (Requirement 1)
            block: new defs.Cube(1),
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            ring: new Material(new Ring_Shader()),
            // TODO:  Fill in as many additional material objects as needed in this key/value table.
            //        (Requirement 4)
        }
        this.position = vec3(0, 6, 20);
        this.look_at = vec3(0,0,0);
        this.top = vec3(0,1,0);
        this.current_camera_location = Mat4.look_at(vec3(0, 6, 20), vec3(0, 0, 0), vec3(0, 1, 0));
        this.blocks = [];
        let numberOfSquares = 25;
        //let model_transform = Mat4.translation(-numberOfSquares, 0, 0);
        for(let i = 0; i < numberOfSquares; i++) {
            //console.log(model_transform);
            for (let j = 0; j < numberOfSquares; j++) {
                this.blocks.push([i * 2, 0, j * 2]);
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
        this.key_triggered_button("View solar system", ["Control", "0"], () => this.attached = () => null);
        this.new_line();
        this.key_triggered_button("Attach to planet 1", ["Control", "1"], () => this.attached = () => this.planet_1);
        this.key_triggered_button("Attach to planet 2", ["Control", "2"], () => this.attached = () => this.planet_2);
        this.new_line();
        this.key_triggered_button("Attach to planet 3", ["Control", "3"], () => this.attached = () => this.planet_3);
        this.key_triggered_button("Attach to planet 4", ["Control", "4"], () => this.attached = () => this.planet_4);
        this.new_line();
        this.key_triggered_button("Attach to moon", ["Control", "m"], () => this.attached = () => this.moon);
        this.key_triggered_button("Forward", ["w"], () => this.thrust[2] = 1, undefined, () => this.thrust[2] = 0);
        this.key_triggered_button("Backward", ["s"], () => this.thrust[3] = 1, undefined, () => this.thrust[3] = 0);
        this.key_triggered_button("Left", ["a"], () => this.thrust[0] = 1, undefined, () => this.thrust[0] = 0);
        this.key_triggered_button("Right", ["d"], () => this.thrust[1] = 1, undefined, () => this.thrust[1] = 0);
        this.key_triggered_button("Look up", ["u"], () => this.direction[2] = 1, undefined, () => this.direction[2] = 0);
        this.key_triggered_button("Look down", ["j"], () => this.direction[3] = 1, undefined, () => this.direction[3] = 0);
        this.key_triggered_button("Look right", ["k"], () => this.direction[1] = 1, undefined, () => this.direction[1] = 0);
        this.key_triggered_button("Look left", ["h"], () => this.direction[0] = 1, undefined, () => this.direction[0] = 0);
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.current_camera_location);
        }
        if (this.thrust[2] == 1){
            let look_direction = this.look_at.minus(this.position);
            look_direction = vec3(look_direction[0], 0, look_direction[2]).normalized();
            console.log(look_direction)
            this.position = this.position.plus(look_direction.times(0.5));
            this.look_at = this.look_at.plus(look_direction.times(0.5));

//             this.current_camera_location = this.current_camera_location.times(Mat4.translation())
//             program_state.camera_inverse = program_state.camera_inverse[i]
               
        }
        if (this.thrust[3] == 1){
            let look_direction = this.look_at.minus(this.position);
            look_direction = vec3(look_direction[0], 0, look_direction[2]).normalized();
            console.log(look_direction)
            this.position = this.position.minus(look_direction.times(0.5));
            this.look_at = this.look_at.minus(look_direction.times(0.5));

        }
        if (this.thrust[1] == 1){
            let look_direction = this.look_at.minus(this.position);
            let right = look_direction.cross(vec3(0,1,0)).normalized();
            this.position = this.position.plus(right.times(0.2));
            this.look_at = this.look_at.plus(right.times(0.2));
            console.log(this.look_at);
        }
        if (this.thrust[0] == 1){
            let look_direction = this.look_at.minus(this.position);
            let right = look_direction.cross(vec3(0,1,0)).normalized();
            this.position = this.position.minus(right.times(0.2));
            this.look_at = this.look_at.minus(right.times(0.2));
        }
        if (this.direction[2] == 1){
            this.look_at = vec3(this.look_at[0], this.look_at[1]+0.05, this.look_at[2]);
            console.log(this.look_at);
        }
        if (this.direction[3] == 1){
            this.look_at = vec3(this.look_at[0], this.look_at[1]-0.05, this.look_at[2]);
            
        }
        if (this.direction[0] == 1){
            let temp = vec4(this.look_at[0], this.look_at[1], this.look_at[2], 1);
            let model_transform = Mat4.identity();
            model_transform = model_transform.times(Mat4.translation(this.position[0], this.position[1], this.position[2])).times(Mat4.rotation(0.01, 0, 1, 0)).times(Mat4.translation(this.position[0] * -1, this.position[1] * -1, this.position[2] * -1));
            console.log(model_transform);
            temp = model_transform.times(temp);
            console.log(temp);
            this.look_at = vec3(temp[0], temp[1], temp[2]);
            console.log(this.look_at);
        }
        if (this.direction[1] == 1){
            let temp = vec4(this.look_at[0], this.look_at[1], this.look_at[2], 1);
            let model_transform = Mat4.identity();
            model_transform = model_transform.times(Mat4.translation(this.position[0], this.position[1], this.position[2])).times(Mat4.rotation(-0.01, 0, 1, 0)).times(Mat4.translation(this.position[0] * -1, this.position[1] * -1, this.position[2] * -1));
            console.log(model_transform);
            temp = model_transform.times(temp);
            console.log(temp);
            this.look_at = vec3(temp[0], temp[1], temp[2]);
            console.log(this.look_at);
        }

        program_state.set_camera(Mat4.look_at(this.position, this.look_at, vec3(0, 1, 0)));
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        // TODO: Create Planets (Requirement 1)
        // this.shapes.[XXX].draw([XXX]) // <--example

        // TODO: Lighting (Requirement 2)
        const light_position = vec4(0, 5, 5, 1);
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        // TODO:  Fill in matrix operations and drawing code to draw the solar system scene (Requirements 3 and 4)
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const yellow = hex_color("#fac91a");

        let model_transform = Mat4.identity();

        for (let i = 0; i < this.blocks.length; i++) {
            let curr = this.blocks[i];
            this.shapes.block.draw(context, program_state, model_transform.times(Mat4.translation(curr[0], curr[1], curr[2])), this.materials.test.override({color: yellow}));
        }
                
       
        //this.shapes.block.draw(context, program_state, model_transform, this.materials.test.override({color: yellow}));
    }
}


class Ring_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
          
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        void main(){
          
        }`;
    }
}

