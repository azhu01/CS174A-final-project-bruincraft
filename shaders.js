import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Phong_Sunlight_Shader extends defs.Phong_Shader {
    //Phong_Shader with directional sunlight


    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return super.shared_glsl_code() + `
            uniform vec3 sunlight_direction;
            varying vec3 frag_normal;
            vec3 sunlight_model_lights( vec3 frag_normal ){
                float light_angle = max(dot(frag_normal, normalize(-sunlight_direction)), 0.0);
                return light_angle * 0.75 * shape_color.rgb;
              }`;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.

            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
            uniform mat4 inverse_transpose_model_transform;

            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                frag_normal = normalize( mat3(inverse_transpose_model_transform) * normal);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
              } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){                                                           
                // Compute an initial (ambient) color:
                gl_FragColor = vec4( shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
                gl_FragColor.xyz += sunlight_model_lights( frag_normal );
              } `;
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        super.send_gpu_state(gl, gpu, gpu_state, model_transform);
        gl.uniformMatrix4fv(gpu.inverse_transpose_model_transform, false, Matrix.flatten_2D_to_1D(Mat4.inverse(model_transform)));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        super.update_GPU(context, gpu_addresses, gpu_state, model_transform, material);
        context.uniform3fv(gpu_addresses.sunlight_direction, vec3(-0.5, -1, 0));
    }
}

export class Background_Shader extends Shader {
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
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
          gl_Position = projection_camera_model_transform * vec4(position, 1.0);
          point_position = model_transform * vec4(position, 1.0);
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        return this.shared_glsl_code() + `
        void main(){
          //
          vec3 color = vec3(0.69, 1.0, 1.0);
          float diff = clamp((1.0 - color.x) / 300.0 * (300.0 - point_position.y), 0.0, 1.0);
          color.x = color.x + diff;
          gl_FragColor = vec4(color, 1.0);
        }`;
    }
}
