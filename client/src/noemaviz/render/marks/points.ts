/**
 * Batched Point Renderer (Scatter plots)
 * Uses instanced rendering for efficient drawing of thousands of points
 */

import { WebGL2Context, createProgram, createBuffer } from '../gl';
import { pointVertexShader, pointFragmentShader } from '../shaders';
import { DataFrame } from '../../core/data_engine';

export interface PointRenderConfig {
    xField: string;
    yField: string;
    colorField?: string;
    sizeField?: string;
    defaultColor?: [number, number, number, number];
    defaultSize?: number;
}

export class PointRenderer {
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private vao: WebGLVertexArrayObject;
    private positionBuffer: WebGLBuffer;
    private idBuffer: WebGLBuffer;
    private colorBuffer: WebGLBuffer;
    private count: number = 0;

    // Uniform locations
    private u_matrix: WebGLUniformLocation | null;
    private u_pointSize: WebGLUniformLocation | null;

    constructor(glContext: WebGL2Context) {
        this.gl = glContext.gl;
        this.program = createProgram(this.gl, pointVertexShader, pointFragmentShader);

        // Get uniform locations
        this.u_matrix = this.gl.getUniformLocation(this.program, 'u_matrix');
        this.u_pointSize = this.gl.getUniformLocation(this.program, 'u_pointSize');

        // Create VAO
        const vao = this.gl.createVertexArray();
        if (!vao) throw new Error('Failed to create VAO');
        this.vao = vao;

        // Create buffers (will be populated on setData)
        this.positionBuffer = createBuffer(this.gl, new Float32Array(0));
        this.idBuffer = createBuffer(this.gl, new Float32Array(0));
        this.colorBuffer = createBuffer(this.gl, new Float32Array(0));
    }

    public setData(data: DataFrame, config: PointRenderConfig) {
        const xCol = data.getColumn(config.xField);
        const yCol = data.getColumn(config.yField);

        if (!xCol || !yCol) {
            console.warn('Missing required fields for point renderer');
            return;
        }

        const count = xCol.values.length;
        this.count = count;

        // Prepare position data
        const positions = new Float32Array(count * 2);
        const ids = new Float32Array(count);
        const colors = new Float32Array(count * 4);

        const defaultColor = config.defaultColor || [59 / 255, 130 / 255, 246 / 255, 0.85];

        for (let i = 0; i < count; i++) {
            const x = xCol.values[i] as number;
            const y = yCol.values[i] as number;

            positions[i * 2] = x;
            positions[i * 2 + 1] = y;
            ids[i] = i;

            // Color
            colors[i * 4] = defaultColor[0];
            colors[i * 4 + 1] = defaultColor[1];
            colors[i * 4 + 2] = defaultColor[2];
            colors[i * 4 + 3] = defaultColor[3];
        }

        // Update buffers
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.idBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, ids, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

        // Setup VAO
        gl.bindVertexArray(this.vao);

        // Position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // ID attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.idBuffer);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);

        // Color attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);
    }

    public render(matrix: Float32Array, pointSize: number = 6) {
        if (this.count === 0) return;

        const gl = this.gl;

        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        // Set uniforms
        if (this.u_matrix) {
            gl.uniformMatrix3fv(this.u_matrix, false, matrix);
        }
        if (this.u_pointSize) {
            gl.uniform1f(this.u_pointSize, pointSize);
        }

        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Draw points
        gl.drawArrays(gl.POINTS, 0, this.count);

        gl.disable(gl.BLEND);
        gl.bindVertexArray(null);
    }

    public destroy() {
        const gl = this.gl;
        gl.deleteVertexArray(this.vao);
        gl.deleteBuffer(this.positionBuffer);
        gl.deleteBuffer(this.idBuffer);
        gl.deleteBuffer(this.colorBuffer);
        gl.deleteProgram(this.program);
    }
}
