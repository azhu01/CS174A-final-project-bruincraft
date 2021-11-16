import {defs, tiny} from './examples/common.js';
import {BruinCraft} from './bruincraft.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Constrained_Movement_Controls extends Scene {
    constructor(blocks) {
        super()
        this.thrust = vec4(0,0,0,0);
        this.direction = vec4(0,0,0,0);
        this.position = vec3(0, 3, 30);
        this.look_at = vec3(0, 3,1);
        this.top = vec3(0,1,0);
        this.current_camera_location = Mat4.look_at(vec3(0, 6, 20), vec3(0, 0, 0), vec3(0, 1, 0));
        this.blocks = blocks;
    }
    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Forward", ["w"], () => this.thrust[2] = 1, undefined, () => this.thrust[2] = 0);
        this.key_triggered_button("Backward", ["s"], () => this.thrust[3] = 1, undefined, () => this.thrust[3] = 0);
        this.key_triggered_button("Left", ["a"], () => this.thrust[0] = 1, undefined, () => this.thrust[0] = 0);
        this.key_triggered_button("Right", ["d"], () => this.thrust[1] = 1, undefined, () => this.thrust[1] = 0);
        this.key_triggered_button("Look up", ["i"], () => this.direction[2] = 1, undefined, () => this.direction[2] = 0);
        this.key_triggered_button("Look down", ["k"], () => this.direction[3] = 1, undefined, () => this.direction[3] = 0);
        this.key_triggered_button("Look right", ["l"], () => this.direction[1] = 1, undefined, () => this.direction[1] = 0);
        this.key_triggered_button("Look left", ["j"], () => this.direction[0] = 1, undefined, () => this.direction[0] = 0);
    }
    display(context, program_state) {
        if (this.thrust[2] == 1){
            let look_direction = this.look_at.minus(this.position);
            look_direction = vec3(look_direction[0], 0, look_direction[2]).normalized();
            this.position = this.position.plus(look_direction.times(0.5));
            this.look_at = this.look_at.plus(look_direction.times(0.5));
        }
        if (this.thrust[3] == 1){
            let look_direction = this.look_at.minus(this.position);
            look_direction = vec3(look_direction[0], 0, look_direction[2]).normalized();
            this.position = this.position.minus(look_direction.times(0.3));
            this.look_at = this.look_at.minus(look_direction.times(0.3));

        }
        if (this.thrust[1] == 1){
            let look_direction = this.look_at.minus(this.position);
            let right = look_direction.cross(vec3(0,1,0)).normalized();
            this.position = this.position.plus(right.times(0.3));
            this.look_at = this.look_at.plus(right.times(0.3));
        }
        if (this.thrust[0] == 1) {
            let look_direction = this.look_at.minus(this.position);
            let right = look_direction.cross(vec3(0,1,0)).normalized();
            this.position = this.position.minus(right.times(0.5));
            this.look_at = this.look_at.minus(right.times(0.5));
        }
        if (this.direction[2] == 1) {
            let vec4LookAt = vec4(this.look_at[0], this.look_at[1], this.look_at[2], 1);
            let look_direction = this.look_at.minus(this.position);
            let right = look_direction.cross(vec3(0,1,0)).normalized();
            let model_transform = Mat4.identity();
            model_transform = model_transform.times(Mat4.translation(this.position[0], this.position[1], this.position[2]));
            model_transform = model_transform.times(Mat4.rotation(0.015, right[0], right[1], right[2]));
            model_transform = model_transform.times(Mat4.translation(this.position[0] * -1, this.position[1] * -1, this.position[2] * -1));
            vec4LookAt = model_transform.times(vec4LookAt);

            let proposed_look_at = vec3(vec4LookAt[0], vec4LookAt[1], vec4LookAt[2]);
            let proposed_direction = this.look_at.minus(this.position).normalized();
            
            if (vec3(0, 1, 0).dot(proposed_direction) < 0.99 ) {
//                 console.log("up");
//                 console.log(vec3(0, 1, 0).dot(proposed_direction));
                this.look_at = proposed_look_at;
            }
            

        }
        if (this.direction[3] == 1){

            let vec4LookAt = vec4(this.look_at[0], this.look_at[1], this.look_at[2], 1);
            let look_direction = this.look_at.minus(this.position);
            let right = look_direction.cross(vec3(0,1,0)).normalized();
            let model_transform = Mat4.identity();
            model_transform = model_transform.times(Mat4.translation(this.position[0], this.position[1], this.position[2]));
            model_transform = model_transform.times(Mat4.rotation(-0.015, right[0], right[1], right[2]));
            model_transform = model_transform.times(Mat4.translation(this.position[0] * -1, this.position[1] * -1, this.position[2] * -1));
            vec4LookAt = model_transform.times(vec4LookAt);

            let proposed_look_at = vec3(vec4LookAt[0], vec4LookAt[1], vec4LookAt[2]);
            let proposed_direction = this.look_at.minus(this.position).normalized();

            if (vec3(0, 1, 0).dot(proposed_direction) > -0.99 ) {
//                 console.log("down");
//                 console.log(vec3(0, 1, 0).dot(proposed_direction));
                this.look_at = proposed_look_at;
            }

        }
        if (this.direction[0] == 1){
            let vec4LookAt = vec4(this.look_at[0], this.look_at[1], this.look_at[2], 1);
            let model_transform = Mat4.identity();
            model_transform = model_transform.times(Mat4.translation(this.position[0], this.position[1], this.position[2]));
            model_transform = model_transform.times(Mat4.rotation(0.02, 0, 1, 0));
            model_transform = model_transform.times(Mat4.translation(this.position[0] * -1, this.position[1] * -1, this.position[2] * -1));
            //console.log(model_transform);
            vec4LookAt = model_transform.times(vec4LookAt);
            this.look_at = vec3(vec4LookAt[0], vec4LookAt[1], vec4LookAt[2]);
        }
        if (this.direction[1] == 1){
            let vec4LookAt = vec4(this.look_at[0], this.look_at[1], this.look_at[2], 1);
            let model_transform = Mat4.identity();
            model_transform = model_transform.times(Mat4.translation(this.position[0], this.position[1], this.position[2]));
            model_transform = model_transform.times(Mat4.rotation(-0.02, 0, 1, 0))
            model_transform = model_transform.times(Mat4.translation(this.position[0] * -1, this.position[1] * -1, this.position[2] * -1));
            vec4LookAt = model_transform.times(vec4LookAt);
            this.look_at = vec3(vec4LookAt[0], vec4LookAt[1], vec4LookAt[2]);
        }
        //console.log(this.blocks.length);
        
        let posX = this.position[0];
        let posY = this.position[1];
        let posZ = this.position[2];
        
        for (let i = 0; i < this.blocks.length; i++) {
           let blockX = this.blocks[i][0];
           let blockY = this.blocks[i][1];
           let blockZ = this.blocks[i][2];
            
           if (blockX + 2 > posX && blockX < posX + 2 && blockY + 2 > posY && blockY < posY + 2 && blockZ + 2 > posZ && blockZ < posZ + 2) {
                // collision detected assuming bounding hitbox of 2 units
                console.log("yes");
           }
        }
        

        program_state.set_camera(Mat4.look_at(this.position, this.look_at, vec3(0, 1, 0)));
    }
}