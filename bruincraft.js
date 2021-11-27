import {defs, tiny} from './examples/common.js';
import { DirectedLight } from './light.js';
import { Constrained_Movement_Controls } from './movement.js';
import {Background_Shader, Color_Phong_Shader, Shadow_Textured_Phong_Shader,
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

            // For the floor or other plain objects
            floor: new Material(new Shadow_Textured_Phong_Shader(), {
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

        this.blocks.push([0, 0, 0]);
        this.blocks.push([0, 2, 0]);
        this.blocks.push([0, 4, 0]);
        this.blocks.push([0, 6, 0]);
        this.blocks.push([4, 0, 0]);
        this.blocks.push([4, 2, 0]);
        this.blocks.push([4, 4, 0]);
        this.blocks.push([4, 6, 0]);

        this.blocks.push([8, 0, 0]);
        this.blocks.push([12, 3, 0]);
        this.blocks.push([16, 5, 0]);

        this.timescale = 1; //minutes / day -- realtime is 1440 minutes per day
        this.time = 0.0; 

        this.lightDepthTextures = [];
        this.lightDepthFramebuffers = [];
        
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
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

        let model_transform = Mat4.identity();

        for (let i = 0; i < this.blocks.length; i++) {
            let curr = this.blocks[i];
            this.shapes.block.draw(context, program_state, model_transform.times(Mat4.translation(curr[0], curr[1], curr[2])), shadow_pass? this.materials.floor.override({color: yellow}) : this.materials.pure);
        }
        this.shapes.floor.draw(context, program_state, model_transform.times(Mat4.rotation(3*Math.PI / 2, 1, 0, 0)).times(Mat4.scale(10000, 10000, 1)), shadow_pass? this.materials.floor.override({color: green}) : this.materials.pure);
        this.shapes.background.draw(context, program_state, program_state.camera_transform.times(Mat4.translation(0, 0, -999.9)).times(Mat4.scale(10000, 10000, 1)), this.materials.background);
    }
    display(context, program_state) {
        const t = program_state.animation_time;
        const gl = context.context;

        if (!this.init_ok) {
            const ext = gl.getExtension('WEBGL_depth_texture');
            if (!ext) {
                return alert('need WEBGL_depth_texture');  // eslint-disable-line
            }

            this.add_sun(gl);

            let light_position = Mat4.rotation(0 / 1500, 0, 1, 0).times(vec4(0, 10, 0, 1));
            let light_position_2 = Mat4.rotation(0 / 1500, 0, 1, 0).times(vec4(10, 10, 4, 1));
            let light_position_3 = Mat4.rotation(0 / 1500, 0, 1, 0).times(vec4(10, 10, -4, 1));
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

            this.add_light_source(new DirectedLight(light_position, light_color, 1000, light_view_target, light_field_of_view), gl);
            //this.add_light_source(new DirectedLight(light_position_2, light_color_2, 1000, light_view_target_2, light_field_of_view), gl);
            //this.add_light_source(new DirectedLight(light_position_3, light_color_3, 1000, light_view_target_3, light_field_of_view), gl);
            //this.add_light_source(new DirectedLight(light_position_4, light_color_4, 1000, light_view_target_4, light_field_of_view), gl);


            this.init_ok = true;
        }

       if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new Constrained_Movement_Controls(this.blocks));
            console.log("initialized");
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(context.scratchpad.controls.current_camera_location);
        }
        
        program_state.lights = this.lights.map(x => x.light);

        //Sun stuff

        let sun_position = vec3(0, 5, 10);

        program_state.sunlight_direction = sun_position;

        const sun_view_mat = Mat4.look_at(
            vec3(sun_position[0], sun_position[1], sun_position[2]),
            vec3(0, 0, 0),
            vec3(0, 1, 0), // assume the light to target will have a up dir of +y, maybe need to change according to your case
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


