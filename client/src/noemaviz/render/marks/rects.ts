/**
 * Batched Rect Renderer (Bar charts, Heatmap cells)
 * Renders rectangles using triangle pairs
 */

import { WebGL2Context, createProgram, createBuffer } from '../gl';
import { rectVertexShader, rectFragmentShader } from '../shaders';
import { DataFrame } from '../../core/data_engine';

export interface RectRenderConfig {
    xField: string;
    yField: string;
    widthField?: string;
    heightField?: string;
    colorField?: string;
    defaultColor?: [number, number, number, number];
    defaultWidth?: number;
    defaultHeight?: number;
}

export class RectRenderer {
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private vao: WebGLVertexArrayObject;
    private positionBuffer: WebGLBuffer;
    private colorBuffer: WebGLBuffer;
    private idBuffer: WebGLBuffer;
    private indexBuffer: WebGLBuffer;
    private indexCount: number = 0;

    // Uniform locations
    private u_matrix: WebGLUniformLocation | null;

    constructor(glContext: WebGL2Context) {
        this.gl = glContext.gl;
        this.program = createProgram(this.gl, rectVertexShader, rectFragmentShader);

        // Get uniform locations
        this.u_matrix = this.gl.getUniformLocation(this.program, 'u_matrix');

        // Create VAO
        const vao = this.gl.createVertexArray();
        if (!vao) throw new Error('Failed to create VAO');
        this.vao = vao;

        // Create buffers
        this.positionBuffer = createBuffer(this.gl, new Float32Array(0));
        this.colorBuffer = createBuffer(this.gl, new Float32Array(0));
        this.idBuffer = createBuffer(this.gl, new Float32Array(0));
        this.indexBuffer = createBuffer(this.gl, new Uint16Array(0));
    }

    public setData(
        data: DataFrame,
        config: RectRenderConfig,
        rects: Array<{ x: number; y: number; w: number; h: number; color?: [number, number, number, number] }>
    ) {
        const count = rects.length;
        if (count === 0) {
            this.indexCount = 0;
            return;
        }

        // Each rect = 4 vertices, 6 indices (2 triangles)
        const positions = new Float32Array(count * 4 * 2);
        const colors = new Float32Array(count * 4 * 4);
        const ids = new Float32Array(count * 4);
        const indices = new Uint16Array(count * 6);

        const defaultColor = config.defaultColor || [59 / 255, 130 / 255, 246 / 255, 0.85];

        for (let i = 0; i < count; i++) {
            const rect = rects[i];
            const color = rect.color || defaultColor;

            const x0 = rect.x;
            const y0 = rect.y;
            const x1 = rect.x + rect.w;
            const y1 = rect.y + rect.h;

            const vi = i * 4; // vertex index
            const pi = vi * 2; // position index
            const ci = vi * 4; // color index

            // Vertex positions (bottom-left, bottom-right, top-right, top-left)
            positions[pi + 0] = x0;
            positions[pi + 1] = y0;
            positions[pi + 2] = x1;
            positions[pi + 3] = y0;
            positions[pi + 4] = x1;
            positions[pi + 5] = y1;
            positions[pi + 6] = x0;
            positions[pi + 7] = y1;

            // Colors (same for all 4 vertices)
            for (let j = 0; j < 4; j++) {
                colors[ci + j * 4 + 0] = color[0];
                colors[ci + j * 4 + 1] = color[1];
                colors[ci + j * 4 + 2] = color[2];
                colors[ci + j * 4 + 3] = color[3];
                ids[vi + j] = i;
            }

            // Indices (two triangles: 0-1-2, 0-2-3)
            const ii = i * 6;
            indices[ii + 0] = vi + 0;
            indices[ii + 1] = vi + 1;
            indices[ii + 2] = vi + 2;
            indices[ii + 3] = vi + 0;
            indices[ii + 4] = vi + 2;
            indices[ii + 5] = vi + 3;
        }

        this.indexCount = indices.length;

        // Update buffers
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.idBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, ids, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        // Setup VAO
        gl.bindVertexArray(this.vao);

        // Position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // Color attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);

        // ID attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.idBuffer);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.bindVertexArray(null);
    }

    public render(matrix: Float32Array) {
        if (this.indexCount === 0) return;

        const gl = this.gl;

        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        // Set uniforms
        if (this.u_matrix) {
            gl.uniformMatrix3fv(this.u_matrix, false, matrix);
        }

        // Enable blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Draw
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);

        gl.disable(gl.BLEND);
        gl.bindVertexArray(null);
    }

    public destroy() {
        const gl = this.gl;
        gl.deleteVertexArray(this.vao);
        gl.deleteBuffer(this.positionBuffer);
        gl.deleteBuffer(this.colorBuffer);
        gl.deleteBuffer(this.idBuffer);
        gl.deleteBuffer(this.indexBuffer);
        gl.deleteProgram(this.program);
    }
}
