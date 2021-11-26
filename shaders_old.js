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
            uniform vec3 sunlight_direction_1;
            uniform vec3 sunlight_direction_2;

            varying vec3 frag_normal;
            varying vec3 vertex_eyespace;
            vec3 sunlight_model_lights( vec3 frag_normal ){
                float light_angle_1 = max(dot(frag_normal, normalize(-sunlight_direction_1)), 0.0);
                float light_angle_2 = max(dot(frag_normal, normalize(-sunlight_direction_2)), 0.0);
                return (light_angle_1 + light_angle_2) * 0.75 * shape_color.rgb;
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
            uniform mat4 camera_model_transform;

            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                frag_normal = normalize( mat3(inverse_transpose_model_transform) * normal);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                vertex_eyespace = (camera_model_transform * vec4(position, 1.0)).xyz;
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
        gl.uniformMatrix4fv(gpu.camera_model_transform, false, Matrix.flatten_2D_to_1D(Mat4.inverse(gpu_state.camera_inverse.times(model_transform))));

    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        super.update_GPU(context, gpu_addresses, gpu_state, model_transform, material);
        context.uniform3fv(gpu_addresses.sunlight_direction_1, vec3(-0.5, -1, -0.25));
        context.uniform3fv(gpu_addresses.sunlight_direction_1, vec3(-0.25, -1, -0.75));

    }
}

