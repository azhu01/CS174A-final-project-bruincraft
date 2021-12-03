import {defs, tiny} from './examples/common.js';
import {BruinCraft} from './bruincraft.js';
import {Color_Phong_Shader} from './shaders.js'

import {Shape_From_File} from './examples/obj-file-demo.js'

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
        this.jump = 0;
        this.startjumptime = -1;
        this.startjumppos;
        this.startlookat;
        this.swing = 0;
        this.swingTime = 0;
        this.swingSet = 0;

        this.shapes = {
            pickaxe: new Shape_From_File("assets/pickaxe.obj"),
        };
        this.materials = {
            background: new Material(new Color_Phong_Shader()),
        }            
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
        this.key_triggered_button("Jump", [" "], () => this.jump = 1, undefined, () => this.jump = this.jump);
        this.key_triggered_button("Swing", ["1"], () => this.swing = 1, undefined, () => this.swing = this.swing);
    }
    display(context, program_state) {
        let t = program_state.animation_time / 1000;
        // Position and look_at after movement
        let proposed_position = this.position;
        let proposed_look_at = this.look_at;

        // Move forward
        if (this.thrust[2] == 1){
            let look_direction = this.look_at.minus(this.position);
            look_direction = vec3(look_direction[0], 0, look_direction[2]).normalized();
            proposed_position = this.position.plus(look_direction.times(0.1));
            proposed_look_at = this.look_at.plus(look_direction.times(0.1));
        }
        // Move backward
        if (this.thrust[3] == 1){
            let look_direction = this.look_at.minus(this.position);
            look_direction = vec3(look_direction[0], 0, look_direction[2]).normalized();
            proposed_position = this.position.minus(look_direction.times(0.1));
            proposed_look_at = this.look_at.minus(look_direction.times(0.1));

        }
        // Move right
        if (this.thrust[1] == 1){
            let look_direction = this.look_at.minus(this.position);
            let right = look_direction.cross(vec3(0,1,0)).normalized();
            proposed_position = this.position.plus(right.times(0.1));
            proposed_look_at = this.look_at.plus(right.times(0.1));
        }
        // Move left
        if (this.thrust[0] == 1) {
            let look_direction = this.look_at.minus(this.position);
            let right = look_direction.cross(vec3(0,1,0)).normalized();
            proposed_position = this.position.minus(right.times(0.1));
            proposed_look_at = this.look_at.minus(right.times(0.1));
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

            let _proposed_look_at = vec3(vec4LookAt[0], vec4LookAt[1], vec4LookAt[2]);
            let proposed_direction = this.look_at.minus(this.position).normalized();
            
            if (vec3(0, 1, 0).dot(proposed_direction) < 0.99 ) {
//                 console.log("up");
//                 console.log(vec3(0, 1, 0).dot(proposed_direction));
                proposed_look_at = _proposed_look_at;
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

            let _proposed_look_at = vec3(vec4LookAt[0], vec4LookAt[1], vec4LookAt[2]);
            let proposed_direction = this.look_at.minus(this.position).normalized();

            if (vec3(0, 1, 0).dot(proposed_direction) > -0.99 ) {
//                 console.log("down");
//                 console.log(vec3(0, 1, 0).dot(proposed_direction));
                proposed_look_at = _proposed_look_at;
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
            proposed_look_at = vec3(vec4LookAt[0], vec4LookAt[1], vec4LookAt[2]);
        }
        if (this.direction[1] == 1){
            let vec4LookAt = vec4(this.look_at[0], this.look_at[1], this.look_at[2], 1);
            let model_transform = Mat4.identity();
            model_transform = model_transform.times(Mat4.translation(this.position[0], this.position[1], this.position[2]));
            model_transform = model_transform.times(Mat4.rotation(-0.02, 0, 1, 0));
            model_transform = model_transform.times(Mat4.translation(this.position[0] * -1, this.position[1] * -1, this.position[2] * -1));
            vec4LookAt = model_transform.times(vec4LookAt);
            proposed_look_at = vec3(vec4LookAt[0], vec4LookAt[1], vec4LookAt[2]);
        }
        

        if (this.swing == 1 && this.swingSet == 0) {
            this.swingSet = 1;
            this.swing = 0;
            this.swingTime = t;
        } else if (this.swingSet == 1) {
            let model_transform = Mat4.identity();
            model_transform = model_transform.times(program_state.camera_transform);
            model_transform = model_transform.times(Mat4.translation(2, -1, -5));
            model_transform = model_transform.times(Mat4.rotation(2*3.14/3, 0, 1, 0));
            model_transform = model_transform.times(Mat4.translation(-2, -2, 0));
            model_transform = model_transform.times(Mat4.rotation((this.swingTime - t), 0, 0 ,1));
            model_transform = model_transform.times(Mat4.translation(2, 2, 0));
            model_transform = model_transform.times(Mat4.scale(0.5, 0.5, 0.5));
            
            this.shapes.pickaxe.draw(context, program_state, model_transform, this.materials.background);
            if (t - this.swingTime > 0.4) {
                this.swingSet = 0;
            }
            
        }
        

        // Collision Detection Handling
        let floorOffset = 3;
        let blockSize = 1.25;
        let posX = proposed_position[0];
        let posY = proposed_position[1];
        let posZ = proposed_position[2];
        
        let collide = false;
        for (let i = 0; i < this.blocks.length; i++) {
           let blockX = this.blocks[i][0];
           let blockY = this.blocks[i][1];
           let blockZ = this.blocks[i][2];
            
            // Assume a bounding hitbox of 2 units
           if (blockX + blockSize > posX && blockX < posX + blockSize && (posY < blockY + 1 && posY > blockY - 1 || posY-2.9 < blockY + 1 && posY-2.9 > blockY - 1) && blockZ + blockSize > posZ && blockZ < posZ + blockSize) {
                collide = true;
                break;
           }
        }
        // Update position and look_at
        if (!collide) {
            this.position = proposed_position;
            this.look_at = proposed_look_at;
        }

        if (this.jump == 1){
            if(this.startjumptime == -1){
                this.startjumptime= t;
                this.startjumppos = this.position[1];
                this.startlookat = this.look_at[1]
            }
            this.position[1] = this.startjumppos + -8*(t-this.startjumptime)**2 + 11*(t-this.startjumptime);
            this.look_at[1] = this.startlookat + -8*(t-this.startjumptime)**2 + 11*(t-this.startjumptime);
        }
        else if (this.jump == 2){
            if(this.startjumptime == -1){
                this.startjumptime= t-0.1;
                this.startjumppos = this.position[1];
                this.startlookat = this.look_at[1]
            }
            this.position[1] = this.startjumppos + -8*(t-this.startjumptime)**2;
            this.look_at[1] = this.startlookat + -8*(t-this.startjumptime)**2;
        }
        let falling = true;
        if(this.position[1] <=3){
            falling = false;
        }
        if (this.position[1] < 3){
            this.jump = 0;
            this.startjumptime = -1;
            this.position[1] = 3;
    
        }
        else{
            for (let i = 0; i < this.blocks.length; i++) {
                let blockX = this.blocks[i][0];
                let blockY = this.blocks[i][1];
                let blockZ = this.blocks[i][2];
                if (this.position[0] < blockX + blockSize && this.position[0] > blockX-blockSize && this.position[2] < blockZ + blockSize && this.position[2] > blockZ-blockSize){
                    //upper sliver
                    if (this.position[1] <= 3 + blockY + 1 && this.position[1] > blockY+3.5 && this.startjumptime != t){
                        this.jump = 0;
                        this.startjumptime = -1;
                        this.position[1] = blockY + 4;
                        this.look_at = proposed_look_at;
                        falling = false;
                    }
                    

                    //bottom sliver
                    if (this.position[1] > blockY-blockSize && this.position[1] < blockY-0.5){
                        this.jump = 2;
                       this.startjumptime = -1;
                   }
                }
            }
            if(falling){
                if (this.jump == 0){
                    this.jump = 2;
                }
            }
        }



        program_state.set_camera(Mat4.look_at(this.position, this.look_at, vec3(0, 1, 0)));
    }
}

