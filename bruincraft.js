import {defs, tiny} from './examples/common.js';
import { DirectedLight } from './light.js';
import { Constrained_Movement_Controls } from './movement.js';
import {Background_Shader, Color_Phong_Shader, Shadow_Textured_Phong_Shader, Texture_Block,
    Depth_Texture_Shader_2D, Buffered_Texture, LIGHT_DEPTH_TEX_SIZE} from './shaders.js'

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class BruinCraft extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
            square_2d: new defs.Square(),
            block: new defs.Cube(),

            floor: new defs.Square(),
            background: new defs.Square()
            
        };

        // *** Materials
        this.materials = {
            background: new Material(new Background_Shader()),
            phantom: new Material(new defs.Phong_Shader(), {
                color: color(1, 1, 1, 0.2), ambient: 0.5, diffusivity: 0, specularity: 0.5
            }),

            // For the floor or other plain objects
            floor: new Material(new Shadow_Textured_Phong_Shader(), {
                color: color(1, 1, 1, 1), ambient: .3, diffusivity: 0.6, specularity: 0.4, smoothness: 64,
                color_texture: null,
                light_depth_textures: [],
                sun_texture: null
            }),

            block: new Material(new Texture_Block, {
                color: color(1, 1, 1, 1), ambient: .3, diffusivity: 0.6, specularity: 0.4, smoothness: 64,
                color_texture: null,
                light_depth_textures: [],
                sun_texture: null
            }),

            // For the first pass
            pure: new Material(new Color_Phong_Shader(), {
            }),

            // For light source
            light_src: new Material(new defs.Phong_Shader(), {
                color: color(1, 1, 1, 1), ambient: 1, diffusivity: 0, specularity: 0
            }),
            depth_tex: new Material(new Depth_Texture_Shader_2D(), {
                color: color(0, 0, .0, 1),
                ambient: 1, diffusivity: 0, specularity: 0, texture: null
            })
        }

        this.init_ok = false;

        //coordinates
        this.blocks = [];
        //directed lights
        this.lights = [];
        this.phantomBlock;
        this.showPhantomBlock = true;
        this.blocks.push([0, 1, 0]);
        this.blocks.push([0, 3, 0]);
        this.blocks.push([0, 5, 0]);
        this.blocks.push([0, 7, 0]);
        this.blocks.push([4, 1, 0]);
        this.blocks.push([4, 3, 0]);
        this.blocks.push([4, 5, 0]);
        this.blocks.push([4, 7, 0]);

        this.blocks.push([8, 1, 0]);
        this.blocks.push([10, 3, 0]);
        this.blocks.push([10, 1, 0]);
        this.blocks.push([12, 5, 0]);
        this.blocks.push([12, 3, 0]);
        this.blocks.push([12, 1, 0]);


        this.minsPerDay = 1; //minutes per day -- realtime is 1440 minutes per day
        this.time = 720.0; //goes from 0 to 1440 minutes (12am - 12pm)
                        //time starts off at noon
                        // 

        this.lightDepthTextures = [];
        this.lightDepthFramebuffers = [];
        
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Add", ["v"], ()=>{this.addBlock()});
        this.key_triggered_button("Delete", ["x"], ()=>{this.deleteBlock()});
        this.key_triggered_button("Toggle Phantom Block", ["t"], ()=>{this.showPhantomBlock = !this.showPhantomBlock})
    }
    /*
    x values are even
    y values are odd and >= 1
    z values are even
    */
    addBlock(){
        this.cmc.swing = 1;
        if(this.phantomBlock[1] >= 1) {
            this.blocks.push(this.phantomBlock);
        }
    }
    deleteBlock() {
        //console.log([x,y,z])
        this.cmc.swing = 1;
        let x = this.phantomBlock[0]
        let y = this.phantomBlock[1]
        let z = this.phantomBlock[2]
        for(let i = 0; i < this.blocks.length; i++) { 
            if(this.blocks[i][0]===x && this.blocks[i][1]===y && this.blocks[i][2]===z) {
                // console.log(this.blocks[i])
                // console.log(i)
                this.blocks.splice(i,1);
                break;
            }
        }
    }
    add_light_source(light, gl) {
        this.lights.push(light);
        this.materials.floor.shader.num_lights = this.lights.length;
        this.texture_buffer_init(gl);
        this.lightDepthTextures.push(this.lightDepthTexture);
        this.lightDepthFramebuffers.push(this.lightDepthFramebuffer);
        this.materials.floor.light_depth_textures.push(this.light_depth_texture);

    }

    add_sun(gl) {
        this.texture_buffer_init(gl);
        this.sunDepthTexture = this.lightDepthTexture;
        this.sun_texture = this.light_depth_texture;
        this.sunDepthFramebuffer = this.lightDepthFramebuffer;
        this.materials.floor.sun_texture = this.light_depth_texture;
    }

    texture_buffer_init(gl) {
        // Depth Texture
        this.lightDepthTexture = gl.createTexture();

        // Bind it to TinyGraphics
        this.light_depth_texture = new Buffered_Texture(this.lightDepthTexture);

        this.lightDepthTextureSize = LIGHT_DEPTH_TEX_SIZE;
        gl.bindTexture(gl.TEXTURE_2D, this.lightDepthTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,      // target
            0,                  // mip level
            gl.DEPTH_COMPONENT, // internal format
            this.lightDepthTextureSize,   // width
            this.lightDepthTextureSize,   // height
            0,                  // border
            gl.DEPTH_COMPONENT, // format
            gl.UNSIGNED_INT,    // type
            null);              // data
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Depth Texture Buffer
        this.lightDepthFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,       // target
            gl.DEPTH_ATTACHMENT,  // attachment point
            gl.TEXTURE_2D,        // texture target
            this.lightDepthTexture,         // texture
            0);                   // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // create a color texture of the same size as the depth texture
        // see article why this is needed_
        this.unusedTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.unusedTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.lightDepthTextureSize,
            this.lightDepthTextureSize,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // attach it to the framebuffer
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,        // target
            gl.COLOR_ATTACHMENT0,  // attachment point
            gl.TEXTURE_2D,         // texture target
            this.unusedTexture,         // texture
            0);                    // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    render_scene(context, program_state, shadow_pass, draw_light_source=false, draw_shadow=false) {
        // shadow_pass: true if this is the second pass that draw the shadow.
        // draw_light_source: true if we want to draw the light source.
        // draw_shadow: true if we want to draw the shadow

        const t = program_state.animation_time;

        program_state.draw_shadow = draw_shadow;

        if (draw_light_source && shadow_pass) {
            for (let i = 0; i < this.lights.length; i++) {
                let curr_light = this.lights[i];
                this.shapes.sphere.draw(context, program_state,
                    Mat4.translation(curr_light.position[0], curr_light.position[1], curr_light.position[2]).times(Mat4.scale(.5,.5,.5)),
                    this.materials.light_src.override({color: curr_light.color}));
            }
        }

        const yellow = hex_color("#fac91a");
        const green = hex_color("#228B22");
        const red = hex_color("FF0000");

        let model_transform = Mat4.identity();

        let campos = this.cmc.position;
        let camlookat = this.cmc.look_at;
        let blockplace = campos.plus((camlookat.minus(campos)).normalized().times(6));
        let x = 2*Math.round(blockplace[0]/2);
        let y = Math.max(2*Math.floor(blockplace[1]/2)+1,1);
        let z = 2*Math.round(blockplace[2]/2);
        this.phantomBlock = [x,y,z]

        let booleanvariable = false;
        for (let i = 0; i < this.blocks.length; i++) {
            let curr = this.blocks[i];
            if(curr[0] == this.phantomBlock[0] && curr[1] == this.phantomBlock[1] && curr[2] == this.phantomBlock[2]) {
                booleanvariable = true;
                if(this.showPhantomBlock) {
                    this.shapes.block.draw(context, program_state, model_transform.times(Mat4.translation(this.phantomBlock[0], this.phantomBlock[1], this.phantomBlock[2])), shadow_pass ? this.materials.floor.override({color: red}) : this.materials.pure)
                } else {
                    this.shapes.block.draw(context, program_state, model_transform.times(Mat4.translation(curr[0], curr[1], curr[2])), shadow_pass? this.materials.floor.override({color: yellow}) : this.materials.pure);
                }
            } else {
                this.shapes.block.draw(context, program_state, model_transform.times(Mat4.translation(curr[0], curr[1], curr[2])), shadow_pass? this.materials.floor.override({color: yellow}) : this.materials.pure);
            }
        }
        if(!booleanvariable) {
            if(this.phantomBlock[1] >= 1) {
                if(this.showPhantomBlock) {
                    this.shapes.block.draw(context, program_state, model_transform.times(Mat4.translation(this.phantomBlock[0], this.phantomBlock[1], this.phantomBlock[2])), shadow_pass ? this.materials.floor.override({color: green}) : this.materials.pure)
                }
            }
        }
        this.shapes.floor.draw(context, program_state, model_transform.times(Mat4.rotation(3*Math.PI / 2, 1, 0, 0)).times(Mat4.scale(10000, 10000, 1)), shadow_pass? this.materials.floor.override({color: green}) : this.materials.pure);
        this.shapes.background.draw(context, program_state, program_state.camera_transform.times(Mat4.translation(0, 0, -990)).times(Mat4.scale(10000, 10000, 1)), this.materials.background);
    }
    // my_mouse_down(e, pos, context, program_state) {
    //     let pos_ndc_near = vec4(pos[0], pos[1], -1.0, 1.0);
    //     let pos_ndc_far  = vec4(pos[0], pos[1],  1.0, 1.0);
    //     let center_ndc_near = vec4(0.0, 0.0, -1.0, 1.0);
    //     let P = program_state.projection_transform;
    //     let V = program_state.camera_inverse;
    //     let pos_world_near = Mat4.inverse(P.times(V)).times(pos_ndc_near);
    //     let pos_world_far  = Mat4.inverse(P.times(V)).times(pos_ndc_far);
    //     let center_world_near  = Mat4.inverse(P.times(V)).times(center_ndc_near);
    //     pos_world_near.scale_by(1 / pos_world_near[3]);
    //     pos_world_far.scale_by(1 / pos_world_far[3]);
    //     center_world_near.scale_by(1 / center_world_near[3]);

    //     console.log(pos_world_near);
    //     console.log(pos_world_far);
    //     this.blocks.push(
    //         [
    //             Math.round(pos_world_near[0]),
    //             Math.round(pos_world_near[1]), 
    //             0
    //         ]);
    //     console.log(Math.round(pos_world_near[0]))
    // }
    display(context, program_state) {
        const t = program_state.animation_time/ 1000;
        const dt = program_state.animation_delta_time / 1000;

        this.time += dt / 60.0 / this.minsPerDay * 1440;
        this.time %= 1440;

        const blue = hex_color("#B0FFFF");
        const purple = hex_color("#C8A2C8");

        const gl = context.context;

        if (!this.init_ok) {
            const ext = gl.getExtension('WEBGL_depth_texture');
            if (!ext) {
                return alert('need WEBGL_depth_texture');  // eslint-disable-line
            }

            this.add_sun(gl);

            let light_position = vec4(0, 10, 0, 1);
            let light_position_2 = vec4(10, 10, 4, 1);
            let light_position_3 = vec4(10, 10, -4, 1);
            let light_position_4 = vec4(5, 10, 0, 1);


            let light_color = color(1, 1, 1, 1);
            let light_color_2 = color(1, 0, 0, 1);
            let light_color_3 = color(0, 0, 1, 1);
            let light_color_4 = color(0, 1, 0, 1);

            // This is a rough target of the light.
            // Although the light is point light, we need a target to set the POV of the light
            let light_view_target = vec4(1, 1, 0, 1);
            let light_view_target_2 = vec4(10, 1, 2, 1);
            let light_view_target_3 = vec4(10, 1, -2, 1);
            let light_view_target_4= vec4(6, 1, 0, 1);

            let light_field_of_view = 130 * Math.PI / 180; // 130 degree

            this.add_light_source(new DirectedLight(light_position, light_color, 100, light_view_target, light_field_of_view), gl);
            this.add_light_source(new DirectedLight(light_position_2, light_color_2, 100, light_view_target_2, light_field_of_view), gl);
            this.add_light_source(new DirectedLight(light_position_3, light_color_3, 1000, light_view_target_3, light_field_of_view), gl);
            this.add_light_source(new DirectedLight(light_position_4, light_color_4, 1000, light_view_target_4, light_field_of_view), gl);


            this.init_ok = true;
        }

       if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new Constrained_Movement_Controls(this.blocks));
            
            console.log("Initialized");
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(context.scratchpad.controls.current_camera_location);
            this.cmc=(context.scratchpad.controls);
            //implement mouse behavior
            // let canvas = context.canvas;
            // const mouse_position = (e, rect = canvas.getBoundingClientRect()) =>
            //     vec((e.clientX - (rect.left + rect.right) / 2) / ((rect.right - rect.left) / 2),
            //         (e.clientY - (rect.bottom + rect.top) / 2) / ((rect.top - rect.bottom) / 2));

            // canvas.addEventListener("mousedown", e => {
            //     e.preventDefault();
            //     const rect = canvas.getBoundingClientRect()
            //     console.log("e.clientX: " + e.clientX);
            //     console.log("e.clientX - rect.left: " + (e.clientX - rect.left));
            //     console.log("e.clientY: " + e.clientY);
            //     console.log("e.clientY - rect.top: " + (e.clientY - rect.top));
            //     console.log("mouse_position(e): " + mouse_position(e));
            //     this.my_mouse_down(e, mouse_position(e), context, program_state);
            // });
        }
        
        program_state.lights = this.lights.map(x => x.light);

        //console.log(purple);

        program_state.sky_color = blue.plus(purple.minus(blue).times(0.5 + 0.5 * Math.sin(this.time * 0.025)));
        // console.log(blue);
        // console.log(program_state.sky_color);

        //Sun stuff

        let sun_position = vec3(0, 5, 15*Math.sin(0.05 * t));

        program_state.sunlight_direction = sun_position;

        const sun_view_mat = Mat4.look_at(
            vec3(sun_position[0], sun_position[1], sun_position[2]),
            vec3(0, 0, 0),
            vec3(0, 1,  0.1), // assume the light to target will have a up dir of +y, maybe need to change according to your case
        );
        
        //const sun_proj_mat = Mat4.perspective(130 * Math.PI / 180, 1, 0.5, 2000);
        const sun_proj_mat = Mat4.orthographic(-20.0, 20.0, -20.0, 20.0, 0.1, 100.0);
        
        // Bind the Depth Texture Buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.sunDepthFramebuffer);
        gl.viewport(0, 0, this.lightDepthTextureSize, this.lightDepthTextureSize);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Prepare uniforms
        program_state.light_view_mat = sun_view_mat;
        program_state.light_proj_mat = sun_proj_mat;
        program_state.light_tex_mat = sun_proj_mat;
        program_state.view_mat = sun_view_mat;
        program_state.projection_transform = sun_proj_mat;
        this.render_scene(context, program_state, false, false, false);


        // Step 1: set the perspective and camera to the POV of light

        let light_view_mats = [];
        let light_proj_mats = [];

        for (let i = 0; i < this.lights.length; i++) {
            let curr_light = this.lights[i];
            const light_view_mat = Mat4.look_at(
                vec3(curr_light.position[0], curr_light.position[1], curr_light.position[2]),
                vec3(curr_light.view_target[0], curr_light.view_target[1], curr_light.view_target[2]),
                vec3(0, 1, 0), // assume the light to target will have a up dir of +y, maybe need to change according to your case
            );
            const light_proj_mat = Mat4.perspective(curr_light.fov, 1, 0.5, 500);

            // Bind the Depth Texture Buffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffers[i]);
            gl.viewport(0, 0, this.lightDepthTextureSize, this.lightDepthTextureSize);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
            // Prepare uniforms
            program_state.light_view_mat = light_view_mat;
            program_state.light_proj_mat = light_proj_mat;
            program_state.light_tex_mat = light_proj_mat;
            program_state.view_mat = light_view_mat;
            program_state.projection_transform = light_proj_mat;
            this.render_scene(context, program_state, false, false, false);
            
            light_view_mats.push(light_view_mat);
            light_proj_mats.push(light_proj_mat);
        }

        program_state.light_view_mats = light_view_mats;
        program_state.light_proj_mats = light_proj_mats;
        program_state.sun_view_mat = sun_view_mat;
        program_state.sun_proj_mat = sun_proj_mat;

        // Step 2: unbind, draw to the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        program_state.view_mat = program_state.camera_inverse;
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);        
        this.render_scene(context, program_state, true, true, true);


        // this.shapes.square_2d.draw(context, program_state,
        //     Mat4.translation(-0.6, 0, 0).times(
        //     Mat4.scale(0.25, 0.25 * gl.canvas.width / gl.canvas.height, 0.25)
        //     ),
        //     this.materials.depth_tex.override({texture: this.sunDepthTexture})
        // );

        // this.shapes.square_2d.draw(context, program_state,
        //     Mat4.translation(0.6, 0, 0).times(
        //     Mat4.scale(0.25, 0.25 * gl.canvas.width / gl.canvas.height, 0.25)
        //     ),
        //     this.materials.depth_tex.override({texture: this.materials.floor.sun_texture})
        // );
    }
    
}

