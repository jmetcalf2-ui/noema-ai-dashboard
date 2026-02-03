/**
 * Shader sources for NOEMAVIZ WebGL2 renderer
 */

// =============================================================================
// POINT RENDERING
// =============================================================================

export const pointVertexShader = `#version 300 es
precision highp float;

in vec2 a_position;
in float a_id;
in vec4 a_color;

uniform mat3 u_matrix;
uniform float u_pointSize;

out vec4 v_color;
out float v_id;

void main() {
    gl_Position = vec4((u_matrix * vec3(a_position, 1.0)).xy, 0.0, 1.0);
    gl_PointSize = u_pointSize;
    v_color = a_color;
    v_id = a_id;
}
`;

export const pointFragmentShader = `#version 300 es
precision highp float;

in vec4 v_color;
out vec4 outColor;

void main() {
    // Circular point with anti-aliasing
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) {
        discard;
    }
    
    // Smooth edge
    float alpha = smoothstep(0.5, 0.4, dist);
    outColor = vec4(v_color.rgb, v_color.a * alpha);
}
`;

// =============================================================================
// PICKING (ID BUFFER)
// =============================================================================

export const pickingFragmentShader = `#version 300 es
precision highp float;

in float v_id;
out vec4 outColor;

void main() {
    // Encode ID as RGB
    int id = int(v_id);
    float r = float((id >> 16) & 0xFF) / 255.0;
    float g = float((id >> 8) & 0xFF) / 255.0;
    float b = float(id & 0xFF) / 255.0;
    outColor = vec4(r, g, b, 1.0);
}
`;

// =============================================================================
// RECT RENDERING (Bars, Heatmap)
// =============================================================================

export const rectVertexShader = `#version 300 es
precision highp float;

in vec2 a_position;
in vec4 a_color;
in float a_id;

uniform mat3 u_matrix;

out vec4 v_color;
out float v_id;

void main() {
    gl_Position = vec4((u_matrix * vec3(a_position, 1.0)).xy, 0.0, 1.0);
    v_color = a_color;
    v_id = a_id;
}
`;

export const rectFragmentShader = `#version 300 es
precision highp float;

in vec4 v_color;
out vec4 outColor;

void main() {
    outColor = v_color;
}
`;

// =============================================================================
// LINE RENDERING
// =============================================================================

export const lineVertexShader = `#version 300 es
precision highp float;

in vec2 a_position;
in vec4 a_color;

uniform mat3 u_matrix;
uniform float u_lineWidth;

out vec4 v_color;

void main() {
    gl_Position = vec4((u_matrix * vec3(a_position, 1.0)).xy, 0.0, 1.0);
    v_color = a_color;
}
`;

export const lineFragmentShader = `#version 300 es
precision highp float;

in vec4 v_color;
out vec4 outColor;

void main() {
    outColor = v_color;
}
`;

// =============================================================================
// DENSITY FIELD (2D binning + blur)
// =============================================================================

export const densityVertexShader = `#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_texCoord;

out vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
}
`;

export const densityFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_densityTexture;
uniform vec4 u_colorLow;
uniform vec4 u_colorHigh;

void main() {
    float density = texture(u_densityTexture, v_texCoord).r;
    outColor = mix(u_colorLow, u_colorHigh, density);
}
`;

// =============================================================================
// GAUSSIAN BLUR (for density smoothing)
// =============================================================================

export const blurVertexShader = `#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_texCoord;

out vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
}
`;

export const blurFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_texture;
uniform vec2 u_direction;
uniform float u_radius;

void main() {
    vec2 texelSize = 1.0 / vec2(textureSize(u_texture, 0));
    vec4 result = vec4(0.0);
    float totalWeight = 0.0;
    
    for (float i = -u_radius; i <= u_radius; i++) {
        vec2 offset = u_direction * i * texelSize;
        float weight = exp(-0.5 * (i * i) / (u_radius * u_radius));
        result += texture(u_texture, v_texCoord + offset) * weight;
        totalWeight += weight;
    }
    
    outColor = result / totalWeight;
}
`;
